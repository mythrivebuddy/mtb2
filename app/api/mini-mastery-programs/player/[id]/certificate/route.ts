import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVerificationHash } from "@/lib/certificates/generateHash";
import { generateQRCode } from "@/lib/certificates/generateQRCode";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateCertificateId } from "@/lib/certificates/generateCertificateId";
import { sendPushNotificationToUser } from "@/lib/utils/pushNotifications";
import { renderCertificateImage } from "@/lib/certificates/renderCerticiate";
import sharp from "sharp";

const CERT_BUCKET = "certificates";

function serializeError(e: unknown) {
  if (e instanceof Error)
    return { name: e.name, message: e.message, stack: e.stack };
  return { message: String(e) };
}

// ─── GET /api/mini-mastery-programs/player/[id]/certificate ──────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const userId    = session.user.id;
  const programId = params.id;

  const cert = await prisma.miniMasteryCertificate.findFirst({
    where:   { participantId: userId, programId },
    orderBy: { issuedAt: "desc" },
    select: {
      id:               true,
      certificateId:    true,
      certificateUrl:   true,
      verificationHash: true,
      issuedAt:         true,
    },
  });

  return NextResponse.json({ certificate: cert ?? null });
}

// ─── POST /api/mini-mastery-programs/player/[id]/certificate ─────────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const userId    = session.user.id;
  const programId = params.id;

  try {
    // ── 1. Fetch user ──────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, name: true, image: true },
    });
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // ── 2. Fetch program + creator ─────────────────────────────────────────
    const program = await prisma.program.findFirst({
      where:  { id: programId, status: "PUBLISHED", isActive: true },
      select: {
        id:                  true,
        name:                true,
        certificateTitle:    true,
        completionThreshold: true,
        durationDays:        true,
        createdBy:           true,
        creator: { select: { id: true, name: true } },
      },
    });
    if (!program) {
      return NextResponse.json({ message: "Program not found." }, { status: 404 });
    }

    const issuedById = program.createdBy ?? userId;

    // ── 3. Enrollment check ────────────────────────────────────────────────
    const enrollment = await prisma.userProgramState.findUnique({
      where:  { userId_programId: { userId, programId } },
      select: { id: true },
    });
    if (!enrollment) {
      return NextResponse.json({ message: "Not enrolled in this program." }, { status: 403 });
    }

    // ── 4. Progress check ─────────────────────────────────────────────────
    const totalDays      = program.durationDays ?? 0;
    const completedCount = await prisma.miniMasteryProgressLog.count({
      where: { userId, programId, isCompleted: true },
    });
    const progressPct = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
    const threshold   = program.completionThreshold ?? 100;

    // Certificate eligibility: must meet threshold (can be < 100%)
    if (progressPct < threshold) {
      return NextResponse.json(
        {
          message:    `Not eligible. Required: ${threshold}%, current: ${progressPct}%.`,
          progressPct,
          threshold,
        },
        { status: 400 },
      );
    }

    // Track whether ALL modules are done — separate from threshold
    // e.g. threshold=80% → cert unlocked, but courseCompleted only when 100% done
    const isFullyCompleted = totalDays > 0 && completedCount >= totalDays;

    // ── 5. Idempotency — return existing cert if already generated ─────────
    const existing = await prisma.miniMasteryCertificate.findFirst({
      where:   { participantId: userId, programId },
      orderBy: { issuedAt: "desc" },
    });
    if (existing) {
      await prisma.miniMasteryCourseCompletion.upsert({
        where:  { userId_programId: { userId, programId } },
        create: {
          userId,
          programId,
          // Only mark course completed if truly all modules done
          courseCompleted:         isFullyCompleted,
          courseCompletedAt:       isFullyCompleted ? new Date() : null,
          certificateDownloaded:   true,
          certificateDownloadedAt: new Date(),
          certificateUrl:          existing.certificateUrl,
          certificateId:           existing.certificateId,
        },
        update: {
          // Never downgrade courseCompleted — only set true, never false
          ...(isFullyCompleted
            ? { courseCompleted: true, courseCompletedAt: new Date() }
            : {}
          ),
          certificateDownloaded:   true,
          certificateDownloadedAt: new Date(),
        },
      });

      return NextResponse.json({
        success:       true,
        certificate:   existing,
        pngUrl:        existing.certificateUrl,
        alreadyIssued: true,
      });
    }

    // ── 6. Fetch creator signature — reuse ChallengeCreatorSignature ───────
    const sig = program.createdBy
      ? await prisma.challengeCreatorSignature.findUnique({
          where:  { userId: program.createdBy },
          select: { type: true, text: true, imageUrl: true },
        })
      : null;

    const signatureUrl   = sig?.type === "IMAGE" ? (sig.imageUrl ?? undefined) : undefined;
    const signatureText  = sig?.type === "TEXT"  ? (sig.text     ?? undefined) : undefined;
    const signatureDrawn = sig?.type === "DRAWN" ? (sig.imageUrl ?? undefined) : undefined;

    // ── 7. Generate unique IDs ─────────────────────────────────────────────
    const certId           = generateCertificateId();
    const verificationHash = generateVerificationHash(certId + userId);

    // ── 8. QR code — points to /verify/[certId] (human-readable, not hash) ─
    const qr = await generateQRCode(
      `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${certId}`
    );

    // ── 9. Render certificate image ────────────────────────────────────────
    const og = await renderCertificateImage({
      participantName: user.name ?? "Participant",
      challengeName:   program.certificateTitle ?? program.name,
      certificateId:   certId,
      creatorName:     program.creator?.name    ?? "SGE",
      signatureUrl,
      signatureText,
      signatureDrawn,
      qrCodeDataUrl:   qr,
      baseUrl:         process.env.NEXT_PUBLIC_BASE_URL!,
    });

    // ── 10. PNG → WebP ─────────────────────────────────────────────────────
    const pngBuffer  = Buffer.from(await og.arrayBuffer());
    const webpBuffer = await sharp(pngBuffer).webp({ quality: 75 }).toBuffer();

    // ── 11. Upload to Supabase ─────────────────────────────────────────────
    const storagePath = `mini-mastery/${certId}.webp`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(CERT_BUCKET)
      .upload(storagePath, webpBuffer, {
        contentType: "image/webp",
        upsert:      true,
      });

    if (uploadErr) {
      console.error("Supabase upload error:", uploadErr);
      return NextResponse.json(
        { message: "Certificate upload failed.", uploadErr },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(CERT_BUCKET)
      .getPublicUrl(storagePath);

    // ── 12. Transaction: save cert + update completion record ──────────────
    const [cert] = await prisma.$transaction([
      prisma.miniMasteryCertificate.create({
        data: {
          certificateId:    certId,
          verificationHash,
          participantId:    userId,
          programId,
          issuedById,
          certificateUrl:   publicUrl,
          storagePath,
        },
      }),

      prisma.miniMasteryCourseCompletion.upsert({
        where:  { userId_programId: { userId, programId } },
        create: {
          userId,
          programId,
          // Only mark course completed if truly all modules done
          courseCompleted:         isFullyCompleted,
          courseCompletedAt:       isFullyCompleted ? new Date() : null,
          certificateDownloaded:   true,
          certificateDownloadedAt: new Date(),
          certificateUrl:          publicUrl,
          certificateId:           certId,
        },
        update: {
          // Never downgrade — only upgrade courseCompleted to true
          ...(isFullyCompleted
            ? { courseCompleted: true, courseCompletedAt: new Date() }
            : {}
          ),
          certificateDownloaded:   true,
          certificateDownloadedAt: new Date(),
          certificateUrl:          publicUrl,
          certificateId:           certId,
        },
      }),
    ]);

    // ── 13. Push notification ──────────────────────────────────────────────
    sendPushNotificationToUser(
      userId,
      "🎓 Certificate Issued!",
      `Your certificate for "${program.certificateTitle ?? program.name}" is ready.`,
      { url: `/dashboard/mini-mastery-programs/${programId}/play` }
    ).catch(console.error);

    return NextResponse.json(
      { success: true, certificate: cert, pngUrl: publicUrl },
      { status: 201 },
    );

  } catch (err) {
    console.error("Certificate generation error:", err);
    return NextResponse.json(
      { message: "Internal error.", errorDetails: serializeError(err) },
      { status: 500 },
    );
  }
}
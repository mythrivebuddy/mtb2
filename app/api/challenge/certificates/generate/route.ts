import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {

  try {
    const body = await req.json();

    const { participantId, challengeId, issuedById } = body;
    if (!participantId || !challengeId || !issuedById)
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );

    // 1. Enrollment
    const enrollment = await prisma.challengeEnrollment.findUnique({
      where: { userId_challengeId: { userId: participantId, challengeId } },
      include: {
        user: true,
        challenge: { include: { creator: true } },
      },
    });

    if (!enrollment)
      return NextResponse.json({ error: "No enrollment" }, { status: 404 });

    const { user, challenge } = enrollment;

    // 2. Completion

    const totalDays =
      Math.floor(
        (new Date(challenge.endDate).getTime() -
          new Date(challenge.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
      ) + 1;

    const completed = await prisma.completionRecord.count({
      where: { challengeId, userId: participantId },
    });

    const completionPct = Math.round((completed / totalDays) * 100);


    if (completionPct < 75)
      return NextResponse.json(
        { error: "Not eligible (<75%)" },
        { status: 400 }
      );

    // 3. Signature

    const sig = await prisma.challengeCreatorSignature.findUnique({
      where: { userId: challenge.creatorId },
    });


    const signatureUrl =
      sig?.type === "IMAGE" ? sig.imageUrl ?? undefined : undefined;

    const signatureText =
      sig?.type === "TEXT" ? sig.text ?? undefined : undefined;
      const signatureDrawn = sig?.type === "DRAWN" ? sig.imageUrl ?? undefined : undefined;

    // 4. Certificate IDs
    const certId = generateCertificateId();
    const verificationHash = generateVerificationHash(certId + participantId);

    // 5. QR Code

    const qr = await generateQRCode(
      `${process.env.NEXT_URL}/verify/${certId}`
    );

    // 6. OG PNG Generation (NO FETCH)

    const og = await renderCertificateImage({
      participantName: user.name ?? "Participant",
      challengeName: challenge.title,
      certificateId: certId,
      creatorName: challenge.creator?.name ?? "",
      signatureUrl,
      signatureText,
      signatureDrawn,
      qrCodeDataUrl: qr,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
    });



    const pngBuffer = Buffer.from(await og.arrayBuffer());

    // png to webp 

    const webpBuffer = await sharp(pngBuffer)
      .webp({ quality: 75 })
      .toBuffer();


    // Upload WebP instead of PNG

    const storagePath = `certificates/${certId}.webp`;


    // 7. Upload

    // const storagePath = `certificates/${certId}.png`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(CERT_BUCKET)
      .upload(storagePath, webpBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadErr)
      return NextResponse.json({ uploadErr }, { status: 500 });

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(CERT_BUCKET).getPublicUrl(storagePath);

    // 8. Save cert

    // let cert = null;
    const [cert] = await prisma.$transaction([
      prisma.challengeCertificate.create({
        data: {
          certificateId: certId,
          participantId,
          challengeId,
          issuedById,
          certificateUrl: publicUrl,
          verificationHash,
          // qrCodeUrl: qr,
        },
      }),

      prisma.challengeEnrollment.update({
        where: { userId_challengeId: { userId: participantId, challengeId } },
        data: { isCertificateIssued: true },
      })
    ]);

    // 10. Push

    sendPushNotificationToUser(
      participantId,
      "New Certificate Issued!",
      `Your certificate for ${challenge.title} is ready.`,
      { url: `/dashboard/challenge/my-challenges/my-achievements/${challengeId}` }
    ).catch(console.error);

    return NextResponse.json(
      { success: true, certificate: cert, pngUrl: publicUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error("ERROR:", err);

    return NextResponse.json(
      { error: "Internal error", errorDetails: serializeError(err) },
      { status: 500 }
    );
  }
}

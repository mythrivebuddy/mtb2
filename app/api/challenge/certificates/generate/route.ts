// /api/challenge/certificates/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { generateVerificationHash } from "@/lib/certificates/generateHash";
import { generateQRCode } from "@/lib/certificates/generateQRCode";
import { generateCertificatePDF } from "@/lib/certificates/generateCertificatePDF";
import type { CertificatePDFProps } from "@/lib/certificates/CertificatePDF";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateCertificateId } from "@/lib/certificates/generateCertificateId";

const CERT_BUCKET = "certificates"; // make sure this bucket exists in Supabase



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { participantId, challengeId, issuedById } = body as {
      participantId: string;
      challengeId: string;
      issuedById: string;
    };

    if (!participantId || !challengeId || !issuedById) {
      return NextResponse.json(
        { error: "participantId, challengeId and issuedById are required" },
        { status: 400 }
      );
    }

    // 1. Check enrollment (participant must be in challenge)
    const enrollment = await prisma.challengeEnrollment.findUnique({
      where: {
        userId_challengeId: {
          userId: participantId,
          challengeId,
        },
      },
      include: {
        user: true,
        challenge: {
          include: {
            creator: true,
            templateTasks: true,
          },
        },
        userTasks: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Participant is not enrolled in this challenge" },
        { status: 404 }
      );
    }

    const { user, challenge, userTasks } = enrollment;

    // 2. Challenge-level eligibility: duration >= 5 days & certificates enabled
    const start = new Date(challenge.startDate);
    const end = new Date(challenge.endDate);
    const durationDays =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (durationDays < 5 || !challenge.isIssuingCertificate) {
      return NextResponse.json(
        { error: "Certificates are not enabled for this challenge" },
        { status: 400 }
      );
    }

    // 3. Check if certificate already issued for this participant+challenge
    const existingCertificate = await prisma.challengeCertificate.findFirst({
      where: {
        participantId,
        challengeId,
      },
    });

    if (existingCertificate) {
      return NextResponse.json(
        { error: "Certificate already issued for this participant" },
        { status: 400 }
      );
    }

    // 4. Participant-level eligibility
    //    You said completion is computed on frontend, but for safety we compute here too.
    //    We'll approximate completion as: completedTasks / totalTasks * 100
   const totalChallengeDays =
  Math.floor(
    (new Date(challenge.endDate).getTime() -
      new Date(challenge.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1;

// Fetch completed days from completionRecord table
const completedDaysRecord = await prisma.completionRecord.count({
  where: {
    challengeId,
    userId: participantId,
  },
});

// Same formula as frontend
const completionPercentage = Math.round(
  (completedDaysRecord / totalChallengeDays) * 100
);

    console.log({completionPercentage});
    

    if (completionPercentage < 75) {
      return NextResponse.json(
        { error: "Participant has not completed at least 75% of the challenge" },
        { status: 400 }
      );
    }

    // 5. Generate certificate values
    const certificateId = generateCertificateId();
    const verificationHash = generateVerificationHash(
      certificateId + participantId
    );

    const verificationUrl = `${process.env.NEXT_URL}/verify/${certificateId}`;
    const qrCodeDataUrl = await generateQRCode(verificationUrl);

    // 6. Prepare PDF props
    const pdfProps: CertificatePDFProps = {
      participantName: user.name ?? "Participant",
      challengeName: challenge.title,
      issueDate: new Date().toISOString().split("T")[0],
      creatorName: challenge.creator?.name ?? "Challenge Creator",
      signatureUrl: challenge.creatorSignatureUrl ?? undefined,
      certificateId,
      qrCodeDataUrl,
    };

    // 7. Generate PDF (React-PDF → Buffer)
    const pdfBuffer = await generateCertificatePDF(pdfProps);

    // 8. Upload PDF to Supabase bucket
    const filePath = `certificates/${certificateId}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(CERT_BUCKET)
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload certificate PDF" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(CERT_BUCKET).getPublicUrl(filePath);

    // 9. Save certificate in DB
    const certificate = await prisma.challengeCertificate.create({
      data: {
        certificateId,
        participantId,
        challengeId,
        issuedById,
        certificateUrl: publicUrl,
        verificationHash,
      },
    });

    // Optionally: you can also mark something on enrollment if you add fields later

    return NextResponse.json(
      {
        success: true,
        certificate,
        pdfUrl: publicUrl,
        completionPercentage: Math.round(completionPercentage),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error issuing certificate:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

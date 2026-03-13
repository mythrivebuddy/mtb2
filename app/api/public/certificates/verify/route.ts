import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const certificateId = searchParams.get("id");

        if (!certificateId) {
            return NextResponse.json({ valid: false, message: "Missing ID" });
        }

        // ── 1. Challenge Certificate ──────────────────────────────────────────
        const cert = await prisma.challengeCertificate.findUnique({
            where: { certificateId },
            include: {
                participant: true,
                challenge:   true,
                issuedBy:    true,
            },
        });

        if (cert) {
            const pdfUrl = cert.certificateUrl;

            return NextResponse.json({
                valid: true,
                type:  "challenge",
                certificate: {
                    certificateId:    cert.certificateId,
                    participantName:  cert.participant.name,
                    participantEmail: cert.participant.email,
                    challengeName:    cert.challenge.title,
                    issuedBy:         cert.issuedBy.name,
                    issuedAt:         cert.issuedAt,
                    pdfUrl,
                    certificateUrl:   cert.certificateUrl,
                },
            });
        }

        // ── 2. Mini-Mastery Certificate ───────────────────────────────────────
        // OR query handles both:
        //   - new certs: QR points to /verify/[certId]      → matches certificateId
        //   - old certs: QR pointed to /verify/[hash]       → matches verificationHash
        const mmCert = await prisma.miniMasteryCertificate.findFirst({
            where: {
                OR: [
                    { certificateId },
                    { verificationHash: certificateId },
                ],
            },
            include: {
                participant: {
                    select: { name: true, email: true },
                },
                program: {
                    select: {
                        name:             true,
                        certificateTitle: true,
                    },
                },
                issuedBy: {
                    select: { name: true },
                },
            },
        });

        if (mmCert) {
            return NextResponse.json({
                valid: true,
                type:  "mini-mastery",
                certificate: {
                    certificateId:    mmCert.certificateId,
                    participantName:  mmCert.participant.name,
                    participantEmail: mmCert.participant.email,
                    challengeName:    mmCert.program.certificateTitle ?? mmCert.program.name,
                    issuedBy:         mmCert.issuedBy.name,
                    issuedAt:         mmCert.issuedAt,
                    pdfUrl:           mmCert.certificateUrl,
                    certificateUrl:   mmCert.certificateUrl,
                },
            });
        }

        // ── 3. Not found in either ────────────────────────────────────────────
        return NextResponse.json({
            valid:   false,
            message: "Certificate not found",
        });

    } catch (err) {
        console.log(err);
        return NextResponse.json({
            valid:   false,
            message: "Server error",
        });
    }
}
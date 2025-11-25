import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const certificateId = searchParams.get("id");

        if (!certificateId) {
            return NextResponse.json({ valid: false, message: "Missing ID" });
        }

        const cert = await prisma.challengeCertificate.findUnique({
            where: { certificateId },
            include: {
                participant: true,
                challenge: true,
                issuedBy: true,
            },
        });

        if (!cert) {
            return NextResponse.json({
                valid: false,
                message: "Certificate not found",
            });
        }
        const pdfUrl = cert.certificateUrl;



        return NextResponse.json({
            valid: true,
            certificate: {
                certificateId: cert.certificateId,
                participantName: cert.participant.name,
                participantEmail: cert.participant.email,
                challengeName: cert.challenge.title,
                issuedBy: cert.issuedBy.name,
                issuedAt: cert.issuedAt,
                pdfUrl,
            },
        });
    } catch (err) {
        console.log(err);
        return NextResponse.json({
            valid: false,
            message: "Server error",
        });
    }
}

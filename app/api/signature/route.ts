import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { base64ToBuffer } from "@/lib/base64ToBuffer";
import { SignatureType } from "@prisma/client";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";



export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user;
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const type = formData.get("type")?.toString() as SignatureType;

        if (!type || !["TEXT", "IMAGE", "DRAWN"].includes(type)) {
            return NextResponse.json(
                { error: "Invalid signature type" },
                { status: 400 }
            );
        }

        let imageUrl: string | null = null;
        let text: string | null = null;

        // ---------------------------------------------------------------------
        // 1. TEXT SIGNATURE
        // ---------------------------------------------------------------------
        if (type === "TEXT") {
            text = formData.get("text")?.toString() || null;
            if (!text) {
                return NextResponse.json(
                    { error: "Signature text is required" },
                    { status: 400 }
                );
            }
        }


        // 2. IMAGE UPLOAD SIGNATURE (REMOVE BACKGROUND)
        // ---------------------------------------------------------------------


    if (type === "IMAGE") {
            const file = formData.get("file") as File | null;

            if (!file) {
                return NextResponse.json(
                    { error: "Signature image file missing" },
                    { status: 400 }
                );
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const sharp = (await import("sharp")).default;

            // 1. Convert to PNG + ensure alpha channel exists
            const img = sharp(buffer).png().ensureAlpha();

            const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

            const pixelCount = info.width * info.height;
            const newBuffer = Buffer.alloc(pixelCount * 4);

            // 2. Iterate pixels
            for (let i = 0; i < pixelCount; i++) {
                const r = data[i * 4];
                const g = data[i * 4 + 1];
                const b = data[i * 4 + 2];
                const a = data[i * 4 + 3];

                // Calculate brightness (average of RGB)
                // This is better for scanned documents which might be slightly yellow/gray
                const brightness = (r + g + b) / 3;

                // 3. THRESHOLD:
                // If brightness > 210, treat it as background (white/off-white).
                // Lowering this from 240 catches more "gray" noise.
                const isWhite = brightness > 210;

                newBuffer[i * 4] = r;
                newBuffer[i * 4 + 1] = g;
                newBuffer[i * 4 + 2] = b;
                
                // If white, set Alpha to 0 (transparent). Otherwise, keep original Alpha.
                newBuffer[i * 4 + 3] = isWhite ? 0 : a;
            }

            // 4. Reconstruct the image from the buffer
            const transparentPng = await sharp(newBuffer, {
                raw: {
                    width: info.width,
                    height: info.height,
                    channels: 4,
                }
            })
            .png()
            .toBuffer();

            const path = `signatures/${user.id}/signature.png`;

            // 5. Upload to Supabase
            const { error: uploadError } = await supabaseAdmin.storage
                .from("signatures")
                .upload(path, transparentPng, {
                    contentType: "image/png",
                    upsert: true,
                    // setting cacheControl to 0 helps if you are immediately re-fetching this image
                    cacheControl: "0", 
                });

            if (uploadError) throw uploadError;

            const { data: signedUrlData, error: signedError } =
                await supabaseAdmin.storage
                    .from("signatures")
                    .createSignedUrl(path, 60 * 60 * 24 * 365);

            if (signedError) throw signedError;

            // Append a timestamp to the URL to force the browser/PDF generator 
            // to fetch the new transparent version instead of the cached white version
            imageUrl = `${signedUrlData.signedUrl}&t=${Date.now()}`;
        }



        // ---------------------------------------------------------------------
        // 3. DRAWN SIGNATURE (SignaturePad)
        // ---------------------------------------------------------------------
        if (type === "DRAWN") {
            const dataUrl = formData.get("dataUrl")?.toString();
            if (!dataUrl) {
                return NextResponse.json(
                    { error: "SignaturePad base64 data missing" },
                    { status: 400 }
                );
            }

            const { buffer, mimeType } = base64ToBuffer(dataUrl);

            const path = `signatures/${user.id}/signature.png`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from("signatures")
                .upload(path, buffer, {
                    contentType: mimeType,
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: signedUrlData, error: signedError } =
                await supabaseAdmin.storage
                    .from("signatures")
                    .createSignedUrl(path, 60 * 60 * 24 * 365);

            if (signedError) throw signedError;

            imageUrl = signedUrlData.signedUrl;
        }

        // ---------------------------------------------------------------------
        // SAVE SIGNATURE (UPSERT for user)
        // ---------------------------------------------------------------------
        const saved = await prisma.challengeCreatorSignature.upsert({
            where: { userId: user.id },
            update: {
                type,
                text,
                imageUrl,
            },
            create: {
                userId: user.id,
                type,
                text,
                imageUrl,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Signature saved successfully",
                signature: saved,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Server Error",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

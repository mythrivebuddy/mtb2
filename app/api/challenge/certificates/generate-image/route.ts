import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const {
      participantName,
      challengeName,
      certificateId,
      creatorName,
      signatureUrl,
      signatureText,
      qrCodeDataUrl,
    } = await req.json();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // HTML Template
    const html = `<!DOCTYPE html>
      <html>
      <head>
        <style>
          @font-face {
            font-family: 'PinyonScript';
            src: url('${baseUrl}/fonts/PinyonScript-Regular.ttf') format('truetype');
          }
          @font-face {
            font-family: 'MerriWeather';
            src: url('${baseUrl}/fonts/Merriweather.ttf') format('truetype');
            font-weight: 700;
          }
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body style="width:1280px;height:905px;overflow:hidden;">
        <div style="position:relative;width:1280px;height:905px;">
          
          <img src="${baseUrl}/certificate-template-placeholder.png"
            style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" />

          <div style="
            position:absolute;top:355px;left:0;right:0;
            text-align:center;font-size:70px;color:#8A6D3B;
            font-family:'PinyonScript';font-weight:600;">
            ${participantName}
          </div>

          <div style="
            position:absolute;top:490px;left:0;right:0;
            text-align:center;font-size:30px;color:#3d3d3d;
            font-family:'MerriWeather';font-weight:700;">
            ${challengeName}
          </div>

          ${
            signatureUrl
              ? `<img src="${signatureUrl}" style="
                  position:absolute;bottom:250px;left:320px;
                  width:180px;height:100px;object-fit:contain;" />`
              : signatureText
              ? `<div style="
                    position:absolute;bottom:250px;left:320px;
                    font-family:'PinyonScript';font-size:40px;">
                    ${signatureText}
                </div>`
              : ""
          }

          <div style="
            position:absolute;bottom:220px;left:320px;
            font-size:20px;color:#8A6D3B;text-transform:uppercase;
            font-family:'MerriWeather';font-weight:700;">
            ${creatorName}
          </div>

          <img src="${qrCodeDataUrl}" style="
            position:absolute;bottom:245px;right:300px;
            width:100px;height:100px;" />

          <img src="${baseUrl}/logo.png" style="
            position:absolute;bottom:103px;left:415px;
            width:30px;height:30px;" />

          <div style="
            position:absolute;bottom:60px;left:200px;
            font-size:16px;color:#777;font-family:'MerriWeather';">
            Certificate ID: ${certificateId}
          </div>

        </div>
      </body>
      </html>
    `;

    // ----------------------------------------------------
    // FIXED EXECUTABLE PATH LOGIC
    // ----------------------------------------------------

    const isLocal = process.env.NODE_ENV !== "production";

    let executablePath: string | null = null;

    if (isLocal) {
      executablePath = process.env.CHROME_EXECUTABLE_PATH ?? null;
      if (!executablePath) {
        throw new Error(
          "CHROME_EXECUTABLE_PATH missing in .env.local (required in local dev)"
        );
      }
    } else {
      executablePath = await chromium.executablePath();
      if (!executablePath) {
        throw new Error("chromium.executablePath() returned undefined on Vercel");
      }
    }

    // ----------------------------------------------------
    // Launch Browser
    // ----------------------------------------------------
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: chromium.args,
      defaultViewport: { width: 1280, height: 905 },
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const png = await page.screenshot({
      type: "png",
      fullPage: false,
    });

    await browser.close();

    return new NextResponse(Buffer.from(png), {
      headers: {
        "Content-Type": "image/png",
      },
    });

  } catch (error) {
    console.error("Certificate Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate image" },
      { status: 500 }
    );
  }
}

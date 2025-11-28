/** @jsxImportSource react */
import { ImageResponse } from "@vercel/og";
import fs from "fs/promises";
import path from "path";



export async function renderCertificateImage(props: {
  participantName: string;
  challengeName: string;
  certificateId: string;
  creatorName: string;
  signatureUrl?: string;
  signatureText?: string;
  signatureDrawn?: string;
  qrCodeDataUrl: string;
  baseUrl: string;
}) {
  const {
    participantName,
    challengeName,
    certificateId,
    creatorName,
    signatureUrl,
    signatureText,
    signatureDrawn,
    qrCodeDataUrl,
    baseUrl,
  } = props;

  // Load Pinyon font
  const fontDir = path.join(process.cwd(), "public", "fonts");
  const pinyonFont = await fs.readFile(
    path.join(fontDir, "PinyonScript-Regular.ttf")
  );
  const merriweatherFont = await fs.readFile(
    path.join(fontDir, "Merriweather_2.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "1280px",
          height: "905px",
          position: "relative",
          backgroundColor: "white",
          display: "flex", // REQUIRED by OG
        }}
      >
        {/* BACKGROUND */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "flex", // REQUIRED
          }}
        >
          <img
            src={`${baseUrl}/certificate-template-placeholder.png`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
             fetchPriority="low"
          />
        </div>

        {/* PARTICIPANT NAME */}
        <div
          style={{
            position: "absolute",
            top: "355px",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "70px",
            color: "#8A6D3B",
            fontFamily: "PinyonScript",
            fontWeight: 600,
          }}
        >
          {participantName}
        </div>

        {/* CHALLENGE NAME */}
        <div
          style={{
            position: "absolute",
            top: "490px",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "30px",
            color: "#3d3d3d",
            fontFamily: "Merriweather",
            fontWeight: 700,
          }}
        >
          {challengeName}
        </div>

        {/* SIGNATURE BLOCK */}
        {signatureUrl ? (
          <div
            style={{
              position: "absolute",
              bottom: "250px",
              left: "320px",
              width: "180px",
              height: "100px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={signatureUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        ): signatureDrawn ? (
             <div
            style={{
              position: "absolute",
              bottom: "250px",
              left: "320px",
              display: "flex",
              fontFamily: "PinyonScript",
              fontSize: "40px",
              color: "#8A6D3B",
            }}
          >
           <img
              src={signatureDrawn}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        ) : signatureText ? (
          <div
            style={{
              position: "absolute",
              bottom: "250px",
              left: "320px",
              display: "flex",
              fontFamily: "PinyonScript",
              fontSize: "40px",
              color:"black"
            }}
          >
            {signatureText}
          </div>
        )  : (
               <div
            style={{
              position: "absolute",
              bottom: "250px",
              left: "320px",
              display: "flex",
              fontFamily: "PinyonScript",
              fontSize: "40px",
              color: "#8A6D3B",
            }}
          >
            {creatorName}
          </div>
        )}

        {/* CREATOR NAME */}
        <div
          style={{
            position: "absolute",
            bottom: "220px",
            left: "320px",
            display: "flex",
            fontSize: "20px",
            color: "#8A6D3B",
            fontFamily: "Merriweather",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {creatorName}
        </div>

        {/* QR CODE */}
        <div
          style={{
            position: "absolute",
            bottom: "245px",
            right: "300px",
            width: "100px",
            height: "100px",
            display: "flex",
          }}
        >
          <img
            src={qrCodeDataUrl}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </div>

        {/* LOGO */}
        <div
          style={{
            position: "absolute",
            bottom: "103px",
            left: "415px",
            width: "30px",
            height: "30px",
            display: "flex",
          }}
        >
          <img
            src={`${baseUrl}/logo.png`}
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {/* CERTIFICATE ID */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            left: "200px",
            display: "flex",
            fontSize: "16px",
            color: "#777",
            fontFamily: "Merriweather",
          }}
        >
          Certificate ID: {certificateId}
        </div>
      </div>
    ),
    {
      width: 1280,
      height: 905,
      fonts: [
        {
          name: "PinyonScript",
          data: pinyonFont,
          style: "normal",
        },
        {
            name:"Merriweather",
            data:merriweatherFont,
            style:"normal",
        }
      ],
    }
  );
}

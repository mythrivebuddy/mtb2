import { Document, Page, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "PinyonScript",
  src: `${process.env.NEXT_PUBLIC_BASE_URL}/fonts/PinyonScript-Regular.ttf`,
});

export interface CertificatePDFProps {
  participantName: string;
  challengeName: string;
  issueDate: string;
  creatorName: string;
  signatureUrl?: string | null;
  certificateId: string;
  qrCodeDataUrl: string;
}

const TEMPLATE_URL =
  `${process.env.NEXT_PUBLIC_BASE_URL}/certificate-template-placeholder.jpg`;

const styles = StyleSheet.create({
  page: {
    width: 1280,
    height: 905,
    position: "relative",
  },

  background: {
    position: "absolute",
    width: 1280,
    height: 905,
    top: 0,
    left: 0,
  },

  /** -------------------------------
   *  PARTICIPANT NAME
   *  (Exactly on the long golden line)
   *  ------------------------------- */
  participantName: {
    position: "absolute",
    top: 355,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 60,
    color: "#8A6D3B",
    fontFamily: "PinyonScript",
    fontWeight: 600,
  },

  /** -------------------------------
   * CHALLENGE NAME
   * Appears BELOW the line:
   * “For Successfully Completing”
   * ------------------------------- */
  challengeName: {
    position: "absolute",
    top: 490,  // PERFECT alignment under static line
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 30,
    color: "#3d3d3d",
    fontWeight: "bold",
  },

  /** -------------------------------
   * SIGNATURE + CREATOR NAME
   * Left bottom quadrant
   * ------------------------------- */
  signature: {
    position: "absolute",
    bottom: 205,
    left: 200,
    width: 170,
    height: 70,
  },

  creatorName: {
    position: "absolute",
    bottom: 220, // exactly under signature line
    left: 320,
    fontSize: 20,
    color: "#8A6D3B",
    textTransform: "uppercase",
  },

  /** -------------------------------
   * QR + "Scan to Verify"
   * ------------------------------- */
  scanText: {
    position: "absolute",
    bottom: 255,
    right: 300,
    fontSize: 18,
    color: "#444",
  },

  qrCode: {
    position: "absolute",
    bottom: 245,
    right: 300,
    width: 100,
    height: 100,
  },

  /** -------------------------------
   * Certificate ID
   * ------------------------------- */
  certificateId: {
    position: "absolute",
    bottom: 60,
    left: 200,
    fontSize: 16,
    color: "#777",
  },
  mtbLogo:{
    position: "absolute",
    bottom: 103,
    left: 415,
    width: 30,
    height:30
  }
});

export function CertificatePDF(props: CertificatePDFProps) {
  return (
    <Document>
      <Page size={[1280, 905]} style={styles.page}>

        <Image src={TEMPLATE_URL} style={styles.background} fixed />

        {/* Participant Name */}
        <Text style={styles.participantName}>
          {props.participantName}
        </Text>

        {/* Challenge Name (below the static line) */}
        <Text style={styles.challengeName}>
          {props.challengeName}
        </Text>

        {/* Signature */}
        {props.signatureUrl && (
          <Image src={props.signatureUrl} style={styles.signature} />
        )}

        {/* Creator */}
        <Text style={styles.creatorName}>
          {props.creatorName}
        </Text>

        {/* Scan Label */}
        {/* <Text style={styles.scanText}>Scan to verify</Text> */}

        {/* QR Code */}
        <Image src={props.qrCodeDataUrl} style={styles.qrCode} />

        {/* MTB Logo */}
        <Image src={`${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`} style={styles.mtbLogo} />

        {/* Certificate ID */}
        <Text style={styles.certificateId}>
          Certificate ID: {props.certificateId}
        </Text>
      </Page>
    </Document>
  );
}

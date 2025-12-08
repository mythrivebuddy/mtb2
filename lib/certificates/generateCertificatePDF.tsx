"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { CertificatePDF, CertificatePDFProps } from "./CertificatePDF";

export async function generateCertificatePDF(props: CertificatePDFProps) {
  const pdfBuffer = await renderToBuffer(<CertificatePDF {...props} />);
  return Buffer.from(pdfBuffer);
}

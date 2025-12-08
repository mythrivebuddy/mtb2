import QRCode from "qrcode";

export async function generateQRCode(url: string): Promise<string> {
  return await QRCode.toDataURL(url);
}

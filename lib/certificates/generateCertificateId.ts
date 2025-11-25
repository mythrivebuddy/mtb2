export function generateCertificateId() {
  const random = Math.random().toString(36).substring(2, 12).toUpperCase();
  return `MTB-CHL-${random}`;
}

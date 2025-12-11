export function base64ToBuffer(dataUrl: string) {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 string");

  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");

  return { buffer, mimeType };
}

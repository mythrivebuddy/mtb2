// lib/upload.ts

export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject("No file provided");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result); // base64 image string
      } else {
        reject("Failed to read image");
      }
    };

    reader.onerror = () => {
      reject("Error reading file");
    };

    reader.readAsDataURL(file); // Reads file as base64
  });
}

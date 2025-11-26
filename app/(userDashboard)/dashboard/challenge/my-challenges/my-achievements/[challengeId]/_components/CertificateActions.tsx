"use client";

import { Linkedin, Download, Instagram, Loader2 } from "lucide-react";
import { useState } from "react";

export default function CertificateActions({
  imageUrl,
  shareUrl,
}: {
  imageUrl: string;
  shareUrl: string;
}) {
  //   const [copied, setCopied] = useState(false);

  //   const handleCopyLink = () => {
  //     navigator.clipboard.writeText(shareUrl);
  //     setCopied(true);
  //     setTimeout(() => setCopied(false), 2000);
  //   };
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // 1. Fetch the image as "data"
      const response = await fetch(imageUrl, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });

      if (!response.ok) throw new Error("Network error");

      // 2. Convert to a "Blob" (file-like object)
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // 3. Create a temporary link to force the download
      const link = document.createElement("a");
      link.href = url;
      link.download = "certificate.png"; // Forces the file name
      document.body.appendChild(link);
      link.click();

      // 4. Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: If CORS is still blocking, just open the tab
      window.open(imageUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-6">
      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg shadow hover:bg-gray-800 transition disabled:opacity-50"
      >
        {isDownloading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        {isDownloading ? "Downloading..." : "Download"}
      </button>

      {/* Instagram */}
      <button
        onClick={() => {
          const isMobile = /Android|iPhone|iPad|iPod/i.test(
            navigator.userAgent
          );

          if (isMobile && navigator.share) {
            // Mobile: Native share sheet (Instagram appears if installed)
            navigator
              .share({
                title: "Certificate",
                text: "Check out my certificate!",
                url: shareUrl,
              })
              .catch((err) => console.log("Share failed:", err));
          } else {
            // Desktop: Open Instagram website in new tab
            window.open("https://www.instagram.com/", "_blank");
          }
        }}
        className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
      >
        <Instagram className="w-5 h-5" />
        Instagram
      </button>

      {/* LinkedIn  */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <Linkedin className="w-5 h-5" />
        LinkedIn
      </a>

      {/* Copy Link
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
      >
        {copied ? <Check className="w-5 h-5 text-green-600" /> : <LinkIcon className="w-5 h-5" />}
        {copied ? "Copied!" : "Copy Link"}
      </button> */}
    </div>
  );
}

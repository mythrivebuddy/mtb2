// import { Providers } from '@/lib/providers'
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "@/providers/Provider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="h-screen bg-gradient-to-br from-[#4A90E2] via-[#F8F2FF] to-[#FF69B4]">
          <Provider>{children}</Provider>
        </div>
      </body>
    </html>
  );
}

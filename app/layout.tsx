import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "@/providers/Provider";
import { Analytics } from "@vercel/analytics/react"; 
import LoginStreakTracker from "@/components/userStreak/LoginStreakTracker";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";

import PWAInstallButton from "@/components/PWAInstallButton"; // <-- NEW Import
import { SupabaseClientProvider } from "@/components/providers/SupabaseClientProvider"; // Adjust path if needed

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "My Thrive Buddy",
  description: "MTB with PWA",
  themeColor: "#F1F9FF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Manifest & PWA setup */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F1F9FF" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Google Analytics */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <div className="h-screen bg-gradient-to-br from-[#4A90E2] via-[#F8F2FF] to-[#FF69B4] overflow-y-auto">
          <Provider>
            <SupabaseClientProvider>
            <LoginStreakTracker />
            
            {/* Main children */}
            {children}

            {/* Analytics */}
            <Analytics />
            </SupabaseClientProvider>
          </Provider>
        </div>

        <Toaster />
        <ShadcnToaster />

        {/* 🚀 PWA Install Button ye rha (always visible, floating in corner) */}
        <PWAInstallButton />

        {/* 🚀 Service Worker Registration  kiya*/}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker
                    .register('/service-worker.js')
                    .then((registration) => {
                      console.log('Service Worker registered with scope:', registration.scope);
                    })
                    .catch((error) => {
                      console.error('Service Worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

import { Inter } from "next/font/google";
import "./globals.scss";
import Provider from "@/providers/Provider";
import LoginStreakTracker from "@/components/userStreak/LoginStreakTracker";
import { Toaster } from "sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";

import PWAInstallButton from "@/components/PWAInstallButton"; // <-- NEW Import
import { SupabaseClientProvider } from "@/components/providers/SupabaseClientProvider"; // Adjust path if needed
import AnalyticsWrapper from "@/components/wrappers/AnalyticsWrapper";

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
           <AnalyticsWrapper/>
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

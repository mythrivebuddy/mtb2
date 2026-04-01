"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useSession } from "next-auth/react";
import Script from "next/script";

export default function AnalyticsWrapper() {
    const { data: session, status } = useSession();

    // Block analytics only when we KNOW the user is an admin
    // Wait until session is resolved
    if (process.env.NODE_ENV !== "production") return null;
    if (status === "loading") return null;
    // During loading, render analytics so the page view isn't missed
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
        return null;
    }


    return (
        <>
            {/* Google Analytics */}
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                 gtag('js', new Date());
                 gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                 `}
            </Script>
            <Analytics />
            <SpeedInsights />
        </>
    );
}
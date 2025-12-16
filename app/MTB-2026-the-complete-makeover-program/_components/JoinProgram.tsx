"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type JoinProgramProps = {
    url: string; // The URL to navigate to when the button is clickable
};

type Countdown = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
};

// Helper function to format time values with leading zero
const formatTime = (value: number) => (value < 10 ? `0${value}` : value);

export default function JoinProgram({ url }: JoinProgramProps) {
    const session = useSession();

    const [countdown, setCountdown] = useState<Countdown | null>(null);
    const [isStarted, setIsStarted] = useState(false);

    // Fetch subscription status only if authenticated
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["JoinNow"],
        queryFn: async () => {
            if (session.status !== "authenticated") {
                return null;
            }
            // Assume this API returns an object where `programSubscription` is present if enrolled
            const res = await axios.get(
                "/api/user/subscription/get-program-subscription"
            );
            return res.data;
        },
        // Only run query if session is authenticated
        enabled: session.status === "authenticated",
        staleTime: 1000,
    });

    const isAuthenticated = session.status === "authenticated";

    // Determine if the user is enrolled. 
    // This is true if logged in AND the query data confirms enrollment.
    const isEnrolled =
        isAuthenticated &&
        !!data?.programSubscription; // Check for the existence of the subscription object

    const isLoadingState =
        isLoading || isFetching || session.status === "loading";

    // Program start time: 7 Jan 2026, 12:00 PM (Ensure this is in the user's local timezone or adjust for UTC)
    const programStartDate = new Date("2026-01-07T12:00:00");

    /* -------------------------------------
       Manage Countdown Timer (Enrolled only)
    --------------------------------------*/
    useEffect(() => {
        // Only run the timer if the user is enrolled
        if (!isEnrolled) return;

        // Check immediately if the program has already started
        const now = Date.now();
        if (programStartDate.getTime() <= now) {
            setIsStarted(true);
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const distance = programStartDate.getTime() - now;

            if (distance <= 0) {
                setIsStarted(true);
                setCountdown(null); // Clear countdown state
                clearInterval(interval);
                return;
            }

            setCountdown({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor(
                    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                ),
                minutes: Math.floor(
                    (distance % (1000 * 60 * 60)) / (1000 * 60)
                ),
                seconds: Math.floor(
                    (distance % (1000 * 60)) / 1000
                ),
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isEnrolled]);

    /* -----------------------------
        Determine Button Text
    ------------------------------*/
    let buttonText = "Join The Program Today";

    if (isLoadingState) {
        buttonText = "Loading...";
    } else if (isEnrolled) {
        if (isStarted || (countdown === null && Date.now() >= programStartDate.getTime())) {
             // Enrolled AND program has started
            buttonText = "Program Has Started";
        } else if (countdown) {
            // Enrolled AND program has NOT started (Show timer)
            buttonText = `Starts in ${formatTime(countdown.days)}d ${formatTime(countdown.hours)}h ${formatTime(countdown.minutes)}m ${formatTime(countdown.seconds)}s`;
        }
    }


    /* -----------------------------
        Render Button Component
    ------------------------------*/
    // Define classes for clickable and non-clickable states
    const clickableClasses = 'bg-[#6B8E23] hover:bg-opacity-90 transform hover:scale-105';
    // Using a darker green/brown tone for the disabled/enrolled state
    const enrolledClasses = 'bg-[#5D7E20] cursor-default'; 

    const button = (
        <button
            className={`flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-14 px-8 text-white text-lg font-bold tracking-[0.015em] transition-all mt-4 
            ${isEnrolled ? enrolledClasses : clickableClasses}`}
            disabled={isLoadingState || isEnrolled} // Disable button if loading or enrolled
        >
            <span className="truncate">{buttonText}</span>
        </button>
    );

    /* --------------------------------
        Final Conditional Render
    ---------------------------------*/

    // If loading, show the button but disabled
    if (isLoadingState) {
        return button;
    }

    // Navigation is allowed if NOT enrolled (this covers both not logged in AND logged in/not enrolled)
    const shouldAllowNavigation = !isEnrolled;

    if (shouldAllowNavigation) {
        return <Link href={url}>{button}</Link>;
    }

    // If enrolled, show the button (which now contains the timer/started text) without a link
    return button;
}
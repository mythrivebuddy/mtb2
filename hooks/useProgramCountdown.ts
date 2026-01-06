"use client";

import { useEffect, useState } from "react";

export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getRemainingTime(targetDate: Date | null): TimeLeft {
  if (!targetDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const now = new Date();
  const diff = Math.max(targetDate.getTime() - now.getTime(), 0);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function useProgramCountdown(startDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    getRemainingTime(startDate)
  );
  const [isProgramStarted, setIsProgramStarted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const target = startDate ? new Date(startDate) : null;
    const now = new Date();
    const started = target ? target <= now : false;

    setIsProgramStarted(started);

    if (!started && target) {
      const timer = setInterval(() => {
        const remaining = getRemainingTime(target);
        setTimeLeft(remaining);

        if (
          remaining.days <= 0 &&
          remaining.hours <= 0 &&
          remaining.minutes <= 0 &&
          remaining.seconds <= 0
        ) {
          setIsProgramStarted(true);
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [startDate]);

  return {
    mounted,
    timeLeft,
    isProgramStarted,
  };
}

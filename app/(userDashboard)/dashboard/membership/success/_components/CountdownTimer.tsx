"use client";

import { useEffect, useState } from "react";

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ startDate }: { startDate: Date }) {
  const [time, setTime] = useState(() => getTimeLeft(startDate));

  useEffect(() => {
    const i = setInterval(() => {
      setTime(getTimeLeft(startDate));
    }, 1000);
    return () => clearInterval(i);
  }, [startDate]);

  if (!time) {
    return (
      <div className="bg-green-100 text-green-800 rounded-lg px-4 py-2 text-sm">
        🚀 Program has started! {" "}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-xl font-semibold mb-2 text-slate-700">
        Program starts in
      </p>
      <div className="flex justify-center gap-5 bg-slate-900 p-4 rounded-xl text-white">
        <Block label="days" value={time.days} />
        <Block label="hours" value={time.hours} />
        <Block label="min" value={time.minutes} />
        <Block label="sec" value={time.seconds} />
      </div>
    </div>
  );
}

function Block({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <span className="countdown font-mono text-4xl">
        <span
          style={
            {
              "--value": value,
            } as React.CSSProperties
          }
          aria-live="polite"
          aria-label={String(value)}
        >
          {value}
        </span>
      </span>
      <div className="text-xs uppercase text-slate-400 mt-1">{label}</div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

export default function ConfettiClient() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState(true);

  useEffect(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });

    const timer = setTimeout(() => setActive(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!active) return null;

  return (
    <ReactConfetti
      width={size.width}
      height={size.height}
      recycle={false}
      numberOfPieces={500}
      gravity={0.1}
    />
  );
}

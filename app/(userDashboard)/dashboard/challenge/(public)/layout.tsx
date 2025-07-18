// File: app/(userDashboard)/dashboard/challenge/(public)/layout.tsx

import React from 'react';

// Yeh naya layout sirf public challenge page ke liye hai.
// Iska parent (dashboard ka layout) is par apply nahi hoga.
export default function PublicChallengeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Yeh layout component bas children ko render karta hai.
  // Kyunki yahan koi data fetching nahi ho rahi, guest users ko error nahi aayega.
  return <>{children}</>;
}

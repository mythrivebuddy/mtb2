

export function getAvatar(name = "", size = 100) {
  const initial = name.charAt(0)?.toUpperCase() || "?";

  // Simple color palette
  const colors = [
    "#F87171", // red
    "#FBBF24", // yellow
    "#34D399", // green
    "#60A5FA", // blue
    "#A78BFA", // purple
    "#F472B6", // pink
    "#FACC15", // amber
    "#2DD4BF", // teal
  ];

  // Deterministic color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];

  // Create SVG data URL
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="${color}" />
      <text x="50%" y="55%" font-size="${size * 0.5}" font-family="Arial, sans-serif"
        fill="white" text-anchor="middle" dominant-baseline="middle">
        ${initial}
      </text>
    </svg>
  `;

  // Encode as base64
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

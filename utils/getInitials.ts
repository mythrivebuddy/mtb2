export const getInitials = (name: string) => {
  if (!name) return "U";

  const words = name
    .trim()
    .split(" ")
    .filter((w) => w.length > 0);

  if (words.length === 0) return "U";
  if (words.length === 1) return words[0][0].toUpperCase();

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export const getAvatarColor = (name: string) => {
  // Curated list of 5 distinct colors optimized for light/dark mode readability
  const colors = [
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

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
    const colors = [
        "bg-red-100 text-red-900",
        "bg-blue-100 text-blue-900",
        "bg-green-100 text-green-900",
        "bg-purple-100 text-purple-900",
        "bg-indigo-100 text-indigo-900",
        "bg-teal-100 text-teal-900",
        "bg-rose-100 text-rose-900",
        "bg-amber-100 text-amber-900",
        "bg-emerald-100 text-emerald-900",
        "bg-cyan-100 text-cyan-900",
        "bg-fuchsia-100 text-fuchsia-900",
        "bg-pink-100 text-pink-900",
        "bg-orange-100 text-orange-900",
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};
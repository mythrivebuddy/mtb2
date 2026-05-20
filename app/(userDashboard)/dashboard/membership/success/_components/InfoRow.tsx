
export default function InfoRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm sm:text-md bg-slate-100 dark:bg-slate-900 p-3 rounded-lg">
      <span>✨{text}</span>
    </div>
  );
}

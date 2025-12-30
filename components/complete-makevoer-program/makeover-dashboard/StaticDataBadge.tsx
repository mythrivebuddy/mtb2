
interface StaticDataBadgeProps {
  label?: string;
  className?: string;
}

const StaticDataBadge = ({
  label = "Static Data",
  className = "",
}: StaticDataBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-50" />
      {label}
    </span>
  );
};

export default StaticDataBadge;

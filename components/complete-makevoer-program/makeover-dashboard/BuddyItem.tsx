import { Eye, MessageSquare } from "lucide-react";

const BuddyItem = ({
  name,
  active,
  image,
}: {
  name: string;
  active: string;
  image: string;
}) => (
  <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
    <div className="flex items-center gap-3">
      <div
        className="size-10 rounded-full bg-cover bg-center border border-slate-200"
        style={{ backgroundImage: `url(${image})` }}
      ></div>
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {name}
        </p>
        <p className="text-xs text-slate-500">Last active: {active}</p>
      </div>
    </div>
    <div className="flex gap-2">
      <button className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#1183d4] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <MessageSquare className="w-4 h-4" />
      </button>
      <button className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-[#1183d4] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <Eye className="w-4 h-4" />
      </button>
    </div>
  </div>
);
export default BuddyItem;

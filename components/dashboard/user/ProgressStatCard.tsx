import { Card } from "@/components/ui/card";
import Image from "next/image";

type Props = {
  value: number;
  label: string;
};

export const ProgressStatCard = ({ value, label }: Props) => {
  return (
    <Card className="p-3 rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="bg-dashboard/10 p-2 rounded-lg">
          <Image src="/Pearls.png" alt="icon" width={28} height={28} />
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <p className="text-lg font-semibold text-jp-orange leading-none">
            {value}
          </p>
          <p className="text-xs text-gray-500 leading-tight">{label}</p>
        </div>
      </div>
    </Card>
  );
};

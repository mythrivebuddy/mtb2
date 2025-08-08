import { Card, CardContent } from "@/components/ui/card";
import { JPCardProps } from "@/types/client/dashboard";
import Image from "next/image";

const JPCard = ({ value, label }: JPCardProps) => {
  return (
    <Card className="p-4 flex flex-row items-center rounded-3xl bg-white shadow-md space-x-4">
      <div className="flex-shrink-0">
        <Image
          src="/Pearls.png"
          alt="Icon"
          width={65}
          height={65}
          className="bg-dashboard p-4 rounded-xl"
        />
      </div>
      <CardContent className="px-0 mx-0 py-0">
        <p className="text-xl text-jp-orange">{value || 0}</p>
        <p className="text-base">{label}</p>
      </CardContent>
    </Card>
  );
};

export default JPCard;

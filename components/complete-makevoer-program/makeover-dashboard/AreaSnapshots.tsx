import { AREAS } from "@/lib/utils/makeover-program/makeover-dashboard/meta-areas";
import AreaCard from "./AreaCard";

interface AreaSnapshotsProps {
  commitments: {
    id: string;
    areaId: number;
    goalText: string;
    identityText: string;
    actionText: string;
    isLocked: boolean;
  }[];
  challengesByArea: Record<number, string[]>;
}

const AreaSnapshots = ({
  commitments,
  challengesByArea,
}: AreaSnapshotsProps) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {commitments.map((commitment) => {
        const area = AREAS[commitment.areaId];
        const challenges = challengesByArea[commitment.areaId] ?? [];

        // Safety check (in case DB has unexpected areaId)
        if (!area) return null;

        const Icon = area.Icon;

        return (
          <AreaCard
            key={commitment.id}
            title={area.title}
            label={area.label}
            goal={commitment.goalText}
            progress={0}
            points={0}
            color={area.color}
            bgColor={area.bgColor}
            icon={<Icon className="w-5 h-5" />}
            challengeIds={challenges}
          />
        );
      })}
    </section>
  );
};

export default AreaSnapshots;

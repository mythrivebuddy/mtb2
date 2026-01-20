"use client";
import { AREAS } from "@/lib/utils/makeover-program/makeover-dashboard/meta-areas";
import AreaCard from "./AreaCard";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface AreaSnapshotsProps {
  commitments: {
    id: string;
    areaId: number;
    goalText: string;
    identityText: string;
    actionText: string;
    isLocked: boolean;
    areaName: string;
  }[];
  challengesByArea: Record<number, string[]>;
}
type AreaProgressMap = Record<number, number>;

const AreaSnapshots = ({
  commitments,
  challengesByArea,
}: AreaSnapshotsProps) => {
  const { data: areaProgress } = useQuery({
    queryKey: ["area-progress"],
    queryFn: async () => {
      const res = await axios.get("/api/makeover-program/area-progress");
      return res.data.data as AreaProgressMap;
    },
  });
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {commitments.map((commitment, index) => {
        const area = AREAS[commitment.areaId];
        const challenges = challengesByArea[commitment.areaId] ?? [];

        // Safety check (in case DB has unexpected areaId)
        if (!area) return null;

        const Icon = area.Icon;

        return (
          <AreaCard
            key={commitment.id}
            title={commitment.areaName}
            label={`Area ${index + 1}`}
            goal={commitment.goalText}
            progress={areaProgress?.[area.id] ?? 0}
            // points={0}
            color={area.color}
            bgColor={area.bgColor}
            icon={<Icon className="w-5 h-5" />}
            challengeIds={challenges}
            areaId={commitment.areaId}
          />
        );
      })}
    </section>
  );
};

export default AreaSnapshots;

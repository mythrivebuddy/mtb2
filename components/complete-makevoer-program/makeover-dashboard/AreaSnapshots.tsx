import AreaCard from "./AreaCard";
import { Footprints, Landmark, BookOpen } from "lucide-react";

const AreaSnapshots = () => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AreaCard
        title="Health & Vitality"
        goal="Run 50km"
        progress={45}
        points={120}
        color="#10B981"
        bgColor="bg-emerald-50 dark:bg-emerald-900/20"
        icon={<Footprints className="w-5 h-5" />}
      />
      <AreaCard
        title="Wealth & Career"
        goal="Launch MVP"
        progress={72}
        points={340}
        color="#F59E0B"
        bgColor="bg-amber-50 dark:bg-amber-900/20"
        icon={<Landmark className="w-5 h-5" />}
      />
      <AreaCard
        title="Wisdom & Peace"
        goal="Read 3 Books"
        progress={25}
        points={85}
        color="#1183d4"
        bgColor="bg-indigo-50 dark:bg-indigo-900/20"
        icon={<BookOpen className="w-5 h-5" />}
      />
    </section>
  );
};

export default AreaSnapshots;

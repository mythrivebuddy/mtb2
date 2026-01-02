import TodayActionsCard from "./TodayActionsCard";
import DailyInsightCard from "./DailyInsightCard";

const ActionsAndInsights = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <TodayActionsCard />
      <DailyInsightCard />
    </div>
  );
};

export default ActionsAndInsights;

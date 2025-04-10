const SummaryCard = ({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
}) => (
  <div className="bg-white rounded-lg p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
      <div className="bg-[#F1F3FF] p-3 rounded-full">
        <Icon className="w-6 h-6 text-[#151E46]" />
      </div>
    </div>
  </div>
);

export default SummaryCard;

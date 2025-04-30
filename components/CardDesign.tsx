import Image from 'next/image';

const Card = ({ title, description, bgColor, icon }: { title: string; description: string; bgColor: string; icon: string }) => (
  <div className={`w-full max-w-xs p-4 rounded-lg shadow-md ${bgColor} text-white flex flex-col items-center justify-center`}>
    <div className="w-12 h-12 mb-2">
      <Image src={icon} alt={title} width={48} height={48} />
    </div>
    <h3 className="text-lg font-bold">{title}</h3>
    <p className="text-center text-sm">{description}</p>
  </div>
);

const CardGrid = () => {
  const cards = [
    { title: 'MagicBox', description: 'Unlock Your Daily JoyPearl Surprise!', bgColor: 'bg-purple-700', icon: '/placeholder-icon1.png' },
    { title: 'BuddyLens', description: 'Ask, Reflect, and Grow with BuddyLens!', bgColor: 'bg-indigo-700', icon: '/placeholder-icon2.png' },
    { title: '1% Start', description: 'Kick Off Your Power Hours!', bgColor: 'bg-red-700', icon: '/placeholder-icon3.png' },
    { title: 'Spotlight', description: 'Highlight Your Growth, Inspire Others!', bgColor: 'bg-orange-700', icon: '/placeholder-icon4.png' },
    { title: '1% Progress', description: 'Build a Better You, 1% Every Day!', bgColor: 'bg-pink-700', icon: '/placeholder-icon5.png' },
    { title: 'Miracle Log', description: 'Your Space for Everyday Miracles!', bgColor: 'bg-blue-700', icon: '/placeholder-icon6.png' },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card key={index} title={card.title} description={card.description} bgColor={card.bgColor} icon={card.icon} />
        ))}
      </div>
    </div>
  );
};

export default CardGrid;
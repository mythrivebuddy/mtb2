'use client';

import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const allAccordionData = [
  {
    type: 'miracle_log',
    title: 'Read About This feature',
    content: (
      <>
        <p className="mb-4">
          Document unexpected breakthroughs and lucky moments to build belief and track unseen progress.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Creates a personal archive of uplifting events.</li>
          <li>Trains your brain to notice and attract opportunities.</li>
          <li>Reframes your identity to abundance and magnetism.</li>
        </ul>
      </>
    ),
  },
  {
    type: 'progress_vault',
    title: 'Read About This feature',
    content: (
      <>
        <p className="mb-4">
          Log your tiny daily actions — the pebble moves — that add up to real growth.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Tracks progress and builds consistency.</li>
          <li>Creates a reinforcing identity of a doer.</li>
          <li>Makes success feel lived, not just imagined.</li>
        </ul>
      </>
    ),
  },
  {
    type: '1_percent_start',
    title: 'Read About This feature',
    content: (
      <>
        <p className="mb-4">
          Helps you start a tiny action instantly — even just 1% — to build momentum.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Breaks procrastination by making tasks feel doable.</li>
          <li>Creates a daily action habit that builds over time.</li>
          <li>Transforms your success mindset to value momentum.</li>
        </ul>
      </>
    ),
  },
  {
    type: 'prosperity_drops',
    title: 'Read About This feature',
    content: (
      <>
        <p className="mb-4">
          Quarterly grants awarded to deserving solopreneurs, funded by the platform once profitable.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provides tangible financial aid to support key goals.</li>
          <li>Builds trust that the platform truly invests in members.</li>
          <li>Encourages a shared vision of success and support.</li>
        </ul>
      </>
    ),
  },
  {
    type: 'spotlight',
    title: 'Read About This feature',
    content: (
      <>
        <p className="mb-4">
          A rotating Spotlight feature that showcases one solopreneur to the ecosystem with their one-line pitch, profile, and link.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Gain exposure to new potential clients and collaborators.</li>
          <li>Boosts social proof by being featured in the community.</li>
          <li>Increases internal belief and momentum in your business.</li>
        </ul>
      </>
    ),
  },
];

export default function AccordionWrapper() {
  const pathname = usePathname();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  let selectedType = '';
  if (pathname.includes('miracle-log')) selectedType = 'miracle_log';
  else if (pathname.includes('progress-vault')) selectedType = 'progress_vault';
  else if (pathname.includes('aligned-actions')) selectedType = '1_percent_start';
  else if (pathname.includes('prosperity')) selectedType = 'prosperity_drops';
  else if (pathname.includes('spotlight')) selectedType = 'spotlight';

  const filteredData = allAccordionData.filter((item) => item.type === selectedType);

  if (filteredData.length === 0) {
    return <p className="text-left mt-6 text-gray-500">No content available for this section.</p>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {filteredData.map((item, index) => (
        <div
          key={index}
          className="w-full border border-green-700 rounded-lg bg-green-100"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between px-6 py-4 text-left text-xl font-semibold text-gray-800 hover:bg-green-200 rounded-lg transition-all duration-300"
          >
            <span>{item.title}</span>
            <ChevronDown
              className={clsx(
                'w-5 h-5 text-gray-500 transition-transform duration-200',
                openIndex === index && 'rotate-180'
              )}
            />
          </button>
          {openIndex === index && (
            <div className="px-6 py-4 text-gray-700 border-t border-green-600">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

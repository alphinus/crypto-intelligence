'use client';

interface FearGreedMiniProps {
  value: number;
  label: string;
}

export function FearGreedMini({ value, label }: FearGreedMiniProps) {
  const getColor = (val: number) => {
    if (val <= 25) return { bg: 'bg-red-500', text: 'text-red-400' };
    if (val <= 45) return { bg: 'bg-orange-500', text: 'text-orange-400' };
    if (val <= 55) return { bg: 'bg-yellow-500', text: 'text-yellow-400' };
    if (val <= 75) return { bg: 'bg-lime-500', text: 'text-lime-400' };
    return { bg: 'bg-green-500', text: 'text-green-400' };
  };

  const colors = getColor(value);
  const rotation = (value / 100) * 180 - 90; // -90 bis 90 Grad

  return (
    <div className="flex flex-col items-center">
      {/* Mini Gauge */}
      <div className="relative w-16 h-8 overflow-hidden">
        {/* Background Arc */}
        <div className="absolute inset-0 rounded-t-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-30" />

        {/* Needle */}
        <div
          className="absolute bottom-0 left-1/2 w-0.5 h-6 bg-white origin-bottom transition-transform duration-500"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />

        {/* Center dot */}
        <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Value */}
      <div className={`text-xl font-bold ${colors.text} mt-1`}>{value}</div>

      {/* Label */}
      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DifficultyDonutProps {
  data: Array<{ name: string; solved: number; total: number; color: string }>;
  totals: { totalSolved: number };
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-sm border-zinc-700/50">
        <p className="font-medium text-zinc-200">{payload[0].name}</p>
        <p className="text-zinc-400">Solved: <span className="text-zinc-50 font-bold">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

export const DifficultyDonut: React.FC<DifficultyDonutProps> = ({ data, totals }) => {
  if (totals.totalSolved === 0) {
    return (
      <div className="w-full flex items-center justify-center text-zinc-500 text-sm">
        No problems solved yet
      </div>
    );
  }

  // Format data for the pie chart (only non-zero solved)
  const chartData = data
    .filter(d => d.solved > 0)
    .map(d => ({ name: d.name, value: d.solved, color: d.color }));

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 w-full">
      {/* Left side: Donut chart */}
      <div className="w-32 h-32 relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
        {/* Total count in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-zinc-50 leading-none">{totals.totalSolved}</span>
          <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-1">Solved</span>
        </div>
      </div>

      {/* Right side: Progress bars */}
      <div className="flex-1 flex flex-col gap-5 w-full">
        {data.map(diff => (
          <div key={diff.name} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">{diff.name}</span>
              <span className="text-zinc-300 font-medium">
                {diff.solved} <span className="text-zinc-600">/ {totals.totalSolved}</span>
              </span>
            </div>
            {/* Progress Bar Background */}
            <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/30">
              {/* Progress Bar Fill */}
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ 
                  width: `${totals.totalSolved > 0 ? (diff.solved / totals.totalSolved) * 100 : 0}%`,
                  backgroundColor: diff.color,
                  boxShadow: `0 0 10px ${diff.color}40`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, TrendingDown, Download } from 'lucide-react';

interface ChartData {
  label: string;
  value: number;
  previousValue?: number;
  color?: string;
}

interface ChartsProps {
  data: ChartData[];
  title: string;
  type?: 'bar' | 'line' | 'area';
  height?: number;
  showLegend?: boolean;
  onExport?: () => void;
}

export function Charts({
  data,
  title,
  type = 'bar',
  height = 300,
  showLegend = true,
  onExport,
}: ChartsProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const colors = ['bg-navy', 'bg-red', 'bg-green', 'bg-blue-600', 'bg-purple-600', 'bg-yellow-600'];

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-navy" />
          <h3 className="font-semibold text-navy">{title}</h3>
        </div>
        {onExport && (
          <Button variant="ghost" size="sm" leftIcon={<Download size={14} />} onClick={onExport}>
            Export
          </Button>
        )}
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-grey-medium">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue / 2)}</span>
          <span>0</span>
        </div>

        {/* Bars */}
        <div className="ml-14 h-full flex items-end gap-2">
          {data.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const color = item.color || colors[index % colors.length];
            const change = item.previousValue
              ? ((item.value - item.previousValue) / item.previousValue) * 100
              : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 min-w-[40px]">
                {/* Value label */}
                <div className="text-xs font-medium text-navy">
                  {item.value.toLocaleString()}
                </div>

                {/* Change indicator */}
                {item.previousValue !== undefined && change !== 0 && (
                  <div className={`text-xs flex items-center gap-0.5 ${
                    change > 0 ? 'text-green' : 'text-red'
                  }`}>
                    {change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 hover:opacity-80 ${color}`}
                  style={{ height: `${Math.max(percentage, 2)}%` }}
                  title={`${item.label}: ${item.value}`}
                />

                {/* Label */}
                <span className="text-xs text-grey-medium truncate w-full text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-grey-light">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${item.color || colors[index % colors.length]}`} />
              <span className="text-xs text-grey-dark">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
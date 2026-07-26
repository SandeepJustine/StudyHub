'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';

interface RevenueData {
  month: string;
  subscriptions: number;
  courses: number;
  certificates: number;
  recruitment: number;
  events: number;
  marketplace: number;
  sponsorships: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  onTimeframeChange?: (timeframe: string) => void;
}

export function RevenueChart({ data, onTimeframeChange }: RevenueChartProps) {
  const [timeframe, setTimeframe] = useState('monthly');
  const [visibleStreams, setVisibleStreams] = useState<Set<string>>(
    new Set(['subscriptions', 'courses', 'certificates', 'recruitment', 'events', 'marketplace', 'sponsorships'])
  );

  const streamColors: Record<string, string> = {
    subscriptions: 'bg-navy',
    courses: 'bg-red',
    certificates: 'bg-green',
    recruitment: 'bg-blue-600',
    events: 'bg-purple-600',
    marketplace: 'bg-yellow-600',
    sponsorships: 'bg-orange-600',
  };

  const streamLabels: Record<string, string> = {
    subscriptions: 'Subscriptions',
    courses: 'Course Sales',
    certificates: 'Certificates',
    recruitment: 'Recruitment',
    events: 'Events',
    marketplace: 'Marketplace',
    sponsorships: 'Sponsorships',
  };

  const toggleStream = (stream: string) => {
    const updated = new Set(visibleStreams);
    if (updated.has(stream)) {
      updated.delete(stream);
    } else {
      updated.add(stream);
    }
    setVisibleStreams(updated);
  };

  const totals = data.reduce(
    (acc, month) => {
      Object.keys(streamColors).forEach(stream => {
        acc[stream] = (acc[stream] || 0) + (month[stream as keyof RevenueData] as number);
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const grandTotal = Object.values(totals).reduce((sum, val) => sum + (val as number), 0);

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-navy">Revenue Breakdown</h3>
        <div className="flex gap-1 bg-grey-light rounded-lg p-1">
          {['weekly', 'monthly', 'yearly'].map(t => (
            <button
              key={t}
              onClick={() => {
                setTimeframe(t);
                onTimeframeChange?.(t);
              }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                timeframe === t ? 'bg-white shadow text-navy' : 'text-grey-dark'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="text-center mb-8">
        <p className="text-sm text-grey-medium">Total Revenue</p>
        <p className="text-4xl font-bold text-navy">{formatCurrency(grandTotal)}</p>
      </div>

      {/* Stream Breakdown */}
      <div className="space-y-3 mb-6">
        {Object.entries(streamColors).map(([stream, color]) => {
          const amount = totals[stream] || 0;
          const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
          const isVisible = visibleStreams.has(stream);

          return (
            <button
              key={stream}
              onClick={() => toggleStream(stream)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                isVisible ? 'hover:bg-grey-light/50' : 'opacity-40'
              }`}
            >
              <div className={`w-3 h-3 rounded ${color}`} />
              <span className="flex-1 text-sm text-grey-dark text-left">
                {streamLabels[stream]}
              </span>
              <span className="text-sm font-medium text-navy">
                {formatCurrency(amount)}
              </span>
              <span className="text-xs text-grey-medium w-12 text-right">
                {percentage.toFixed(1)}%
              </span>
              <div className="w-24 bg-grey-light rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Monthly Breakdown */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-grey-light">
              <th className="text-left py-2 text-grey-medium font-medium">Month</th>
              {Array.from(visibleStreams).map(stream => (
                <th key={stream} className="text-right py-2 text-grey-medium font-medium">
                  {streamLabels[stream]}
                </th>
              ))}
              <th className="text-right py-2 text-navy font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((month, i) => {
              const monthTotal = Array.from(visibleStreams).reduce(
                (sum, stream) => sum + (month[stream as keyof RevenueData] as number),
                0
              );
              return (
                <tr key={i} className="border-b border-grey-light last:border-0">
                  <td className="py-2 text-grey-dark">{month.month}</td>
                  {Array.from(visibleStreams).map(stream => (
                    <td key={stream} className="text-right py-2 text-grey-dark">
                      {formatCurrency(month[stream as keyof RevenueData] as number)}
                    </td>
                  ))}
                  <td className="text-right py-2 font-medium text-navy">
                    {formatCurrency(monthTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
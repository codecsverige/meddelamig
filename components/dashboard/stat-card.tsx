'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { MiniChart } from './mini-chart';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  chartData?: number[];
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  trend,
  chartData,
}: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-1">{value}</div>
        
        {trend && (
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-500">vs förra veckan</span>
          </div>
        )}
        
        {description && (
          <p className="text-xs text-gray-500 mb-2">{description}</p>
        )}
        
        {chartData && chartData.length > 0 && (
          <div className="mt-3">
            <MiniChart data={chartData} color={color.replace('text-', '#')} height={30} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

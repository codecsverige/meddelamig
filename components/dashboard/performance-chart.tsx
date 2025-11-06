'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DataPoint {
  label: string;
  value: number;
  target?: number;
}

interface PerformanceChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  type?: 'bar' | 'line';
}

export function PerformanceChart({ 
  title, 
  description, 
  data,
  type = 'bar' 
}: PerformanceChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), ...data.map(d => d.target || 0));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const targetPercentage = item.target ? (item.target / maxValue) * 100 : 0;
            const isAboveTarget = item.target ? item.value >= item.target : true;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{item.value}</span>
                    {item.target && (
                      <Badge variant={isAboveTarget ? 'success' : 'warning'} className="text-xs">
                        Mål: {item.target}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  {/* Target indicator */}
                  {item.target && (
                    <div
                      className="absolute h-full w-0.5 bg-gray-400 z-10"
                      style={{ left: `${targetPercentage}%` }}
                    />
                  )}
                  {/* Progress bar */}
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAboveTarget
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

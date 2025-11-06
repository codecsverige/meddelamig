'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Star, TrendingUp, Target, Calendar } from 'lucide-react';

interface SegmentationStatsProps {
  segments: {
    vip: number;
    regular: number;
    at_risk: number;
    new: number;
    inactive: number;
  };
  total: number;
}

export function SegmentationStats({ segments, total }: SegmentationStatsProps) {
  const segmentData = [
    {
      label: 'VIP Kunder',
      count: segments.vip,
      percentage: total > 0 ? ((segments.vip / total) * 100).toFixed(1) : '0',
      color: 'bg-purple-500',
      icon: Star,
      description: 'Spenderar >5000 kr/månad'
    },
    {
      label: 'Stamkunder',
      count: segments.regular,
      percentage: total > 0 ? ((segments.regular / total) * 100).toFixed(1) : '0',
      color: 'bg-blue-500',
      icon: TrendingUp,
      description: '3+ besök senaste månaden'
    },
    {
      label: 'Risk att förlora',
      count: segments.at_risk,
      percentage: total > 0 ? ((segments.at_risk / total) * 100).toFixed(1) : '0',
      color: 'bg-red-500',
      icon: Target,
      description: 'Ingen aktivitet 45+ dagar'
    },
    {
      label: 'Nya kunder',
      count: segments.new,
      percentage: total > 0 ? ((segments.new / total) * 100).toFixed(1) : '0',
      color: 'bg-green-500',
      icon: Calendar,
      description: 'Första besöket <30 dagar'
    },
    {
      label: 'Inaktiva',
      count: segments.inactive,
      percentage: total > 0 ? ((segments.inactive / total) * 100).toFixed(1) : '0',
      color: 'bg-gray-400',
      icon: Users,
      description: 'Ingen aktivitet 90+ dagar'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Kundsegmentering
        </CardTitle>
        <CardDescription>
          Automatisk segmentering baserad på beteende och engagemang
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {segmentData.map((segment) => (
          <div key={segment.label}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <segment.icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{segment.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  {segment.count}
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  ({segment.percentage}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div
                className={`${segment.color} h-2 rounded-full transition-all`}
                style={{ width: `${segment.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{segment.description}</p>
          </div>
        ))}

        {/* Action Recommendations */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Rekommenderade åtgärder:</h4>
          <div className="space-y-2">
            {segments.at_risk > 0 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <Target className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">
                    Skicka win-back kampanj
                  </p>
                  <p className="text-xs text-red-700">
                    {segments.at_risk} kunder i riskzonen
                  </p>
                </div>
                <button className="text-xs font-medium text-red-700 hover:text-red-800">
                  Skapa →
                </button>
              </div>
            )}

            {segments.new > 0 && (
              <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    Välkomna nya kunder
                  </p>
                  <p className="text-xs text-green-700">
                    {segments.new} nya kunder att engagera
                  </p>
                </div>
                <button className="text-xs font-medium text-green-700 hover:text-green-800">
                  Skicka →
                </button>
              </div>
            )}

            {segments.vip > 0 && (
              <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                <Star className="h-4 w-4 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900">
                    VIP-erbjudande
                  </p>
                  <p className="text-xs text-purple-700">
                    Belöna dina {segments.vip} bästa kunder
                  </p>
                </div>
                <button className="text-xs font-medium text-purple-700 hover:text-purple-800">
                  Skapa →
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

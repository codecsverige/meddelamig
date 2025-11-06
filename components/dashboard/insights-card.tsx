'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';
import Link from 'next/link';

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

interface InsightsCardProps {
  insights: Insight[];
}

const insightConfig = {
  success: {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badge: 'success',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badge: 'warning',
  },
  info: {
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badge: 'info',
  },
  tip: {
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badge: 'info',
  },
};

export function InsightsCard({ insights }: InsightsCardProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <CardTitle>Smart Insights</CardTitle>
        </div>
        <CardDescription>Rekommendationer baserade på din data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => {
            const config = insightConfig[insight.type];
            const Icon = config.icon;
            
            return (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {insight.title}
                      </h4>
                      <Badge variant={config.badge as any}>
                        {insight.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <Link
                        href={insight.action.href}
                        className={`text-sm font-medium ${config.color} hover:underline inline-flex items-center gap-1`}
                      >
                        {insight.action.label}
                        <span>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

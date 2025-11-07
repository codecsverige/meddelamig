'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

interface CostTrackerProps {
  totalCost: number;
  budget?: number;
  smsSent: number;
  costPerSMS: number;
  trend: {
    value: number;
    isPositive: boolean;
  };
}

export function CostTracker({ 
  totalCost, 
  budget, 
  smsSent, 
  costPerSMS,
  trend 
}: CostTrackerProps) {
  const budgetPercentage = budget ? (totalCost / budget) * 100 : 0;
  const isOverBudget = budget ? totalCost > budget : false;
  
  return (
    <Card className={isOverBudget ? 'border-red-200 bg-red-50/30' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Kostnadsöversikt</CardTitle>
            <CardDescription>Denna månad</CardDescription>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Cost */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {totalCost.toFixed(2)} kr
            </span>
            <div className="flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-red-600' : 'text-green-600'
              }`}>
                {Math.abs(trend.value)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Totalt {smsSent} SMS × {costPerSMS} kr/SMS
          </p>
        </div>

        {/* Budget Progress */}
        {budget && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Budget</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {totalCost.toFixed(0)} / {budget} kr
                </span>
                <Badge variant={isOverBudget ? 'destructive' : 'success'}>
                  {budgetPercentage.toFixed(0)}%
                </Badge>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}
                style={{ width: `${Math.min(100, budgetPercentage)}%` }}
              />
            </div>
            {isOverBudget && (
              <p className="text-xs text-red-600 mt-2">
                ⚠️ Du har överskridit din budget med {(totalCost - budget).toFixed(2)} kr
              </p>
            )}
          </div>
        )}

        {/* Cost Breakdown */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Genomsnitt/dag</p>
              <p className="font-semibold text-gray-900">
                {(totalCost / 30).toFixed(2)} kr
              </p>
            </div>
            <div>
              <p className="text-gray-500">ROI estimat</p>
              <p className="font-semibold text-green-600">
                {(smsSent * 50).toFixed(0)} kr
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

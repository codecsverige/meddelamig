'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Star,
  MessageSquare,
  Clock,
  Target
} from 'lucide-react';

interface ContactInsightsProps {
  contact: {
    total_visits?: number;
    total_spent?: number;
    average_spend?: number;
    last_visit_date?: string;
    first_visit_date?: string;
    total_sms_sent?: number;
    preferred_day?: string;
    customer_segment?: 'vip' | 'regular' | 'at_risk' | 'new';
    lifetime_value?: number;
  };
}

export function ContactInsights({ contact }: ContactInsightsProps) {
  const daysSinceLastVisit = contact.last_visit_date 
    ? Math.floor((Date.now() - new Date(contact.last_visit_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getSegmentInfo = (segment: string) => {
    const segments = {
      vip: { label: 'VIP Kund', color: 'bg-purple-100 text-purple-800', icon: Star },
      regular: { label: 'Stamkund', color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
      at_risk: { label: 'Risk att förlora', color: 'bg-red-100 text-red-800', icon: Target },
      new: { label: 'Ny kund', color: 'bg-green-100 text-green-800', icon: Calendar }
    };
    return segments[segment as keyof typeof segments] || segments.new;
  };

  const segmentInfo = contact.customer_segment ? getSegmentInfo(contact.customer_segment) : null;

  return (
    <div className="space-y-6">
      {/* Segment Badge */}
      {segmentInfo && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={`${segmentInfo.color} text-sm py-2 px-4`}>
            <segmentInfo.icon className="h-4 w-4 mr-2" />
            {segmentInfo.label}
          </Badge>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">Totalt besök</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {contact.total_visits || 0}
            </div>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-600">Total spenderat</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {contact.total_spent?.toFixed(0) || 0} kr
            </div>
          </CardContent>
        </Card>

        {/* Average Spend */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-gray-600">Genomsnitt/besök</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {contact.average_spend?.toFixed(0) || 0} kr
            </div>
          </CardContent>
        </Card>

        {/* SMS Sent */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-gray-600">SMS skickade</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {contact.total_sms_sent || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visit History */}
      <Card>
        <CardHeader>
          <CardTitle>Besökshistorik</CardTitle>
          <CardDescription>Information om kundens besök</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contact.last_visit_date && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Senaste besök</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Date(contact.last_visit_date).toLocaleDateString('sv-SE')}
                </p>
                {daysSinceLastVisit !== null && (
                  <p className="text-xs text-gray-500">
                    {daysSinceLastVisit === 0 
                      ? 'Idag' 
                      : daysSinceLastVisit === 1 
                      ? 'Igår' 
                      : `${daysSinceLastVisit} dagar sedan`}
                  </p>
                )}
              </div>
            </div>
          )}

          {contact.first_visit_date && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Första besök</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Date(contact.first_visit_date).toLocaleDateString('sv-SE')}
                </p>
                <p className="text-xs text-gray-500">
                  Kund sedan {Math.floor((Date.now() - new Date(contact.first_visit_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} månader
                </p>
              </div>
            </div>
          )}

          {contact.preferred_day && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Föredragen dag</span>
              </div>
              <p className="text-sm font-medium text-blue-900">
                {contact.preferred_day}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Lifetime Value */}
      {contact.lifetime_value && (
        <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Customer Lifetime Value (CLV)
            </CardTitle>
            <CardDescription>Uppskattad livstidsvärde</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 mb-2">
              {contact.lifetime_value.toFixed(0)} kr
            </div>
            <p className="text-sm text-purple-700">
              Baserat på genomsnitt och besöksfrekvens
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {daysSinceLastVisit !== null && daysSinceLastVisit > 45 && (
        <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Target className="h-5 w-5" />
              Rekommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800 mb-3">
              Kunden har inte besökt oss på {daysSinceLastVisit} dagar. 
              Överväg att skicka en win-back kampanj!
            </p>
            <button className="text-sm font-medium text-orange-700 hover:text-orange-800 underline">
              Skicka win-back SMS →
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

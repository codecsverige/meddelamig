'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Activity {
  id: string;
  type: 'sms_sent' | 'contact_added' | 'campaign_created' | 'sms_failed' | 'sms_delivered';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const activityConfig = {
  sms_sent: {
    icon: Send,
    color: 'bg-blue-100 text-blue-600',
    borderColor: 'border-blue-200',
  },
  contact_added: {
    icon: Users,
    color: 'bg-green-100 text-green-600',
    borderColor: 'border-green-200',
  },
  campaign_created: {
    icon: MessageSquare,
    color: 'bg-purple-100 text-purple-600',
    borderColor: 'border-purple-200',
  },
  sms_failed: {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-600',
    borderColor: 'border-red-200',
  },
  sms_delivered: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-600',
    borderColor: 'border-green-200',
  },
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Senaste aktivitet</CardTitle>
          <CardDescription>Din aktivitet de senaste dagarna</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Ingen aktivitet ännu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Senaste aktivitet</CardTitle>
        <CardDescription>Din aktivitet de senaste dagarna</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            
            return (
              <div key={activity.id} className="flex gap-3 relative">
                {/* Timeline line */}
                {index !== activities.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />
                )}
                
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.color} flex items-center justify-center relative z-10`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.timestamp).toLocaleString('sv-SE', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

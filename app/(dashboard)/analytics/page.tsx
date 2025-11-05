import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, MessageSquare, Users, Send, DollarSign } from 'lucide-react';

export default async function AnalyticsPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', session.user.id)
    .single<{ organization_id: string | null }>();

  if (!user?.organization_id) {
    redirect('/onboarding');
  }

  const orgId = user.organization_id;

  // Get analytics data
  const [
    { count: totalContacts },
    { count: totalSMS },
    { data: smsData },
    { data: organization },
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .is('deleted_at', null),
    supabase
      .from('sms_messages')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    supabase
      .from('sms_messages')
      .select('status, cost, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('organizations').select('*').eq('id', orgId).single(),
  ]);

  // Calculate metrics
  const smsList = (smsData ?? []) as Array<{
    status: string;
    cost: number | null;
    created_at: string;
  }>;

  const delivered = smsList.filter((s) => s.status === 'delivered').length || 0;
  const failed = smsList.filter((s) => s.status === 'failed').length || 0;
  const deliveryRate = totalSMS ? ((delivered / (totalSMS || 1)) * 100).toFixed(1) : '0';
  const totalCost = smsList.reduce((sum, s) => sum + (s.cost ?? 0), 0);

  // Group by date
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const smsByDate = last7Days.map((date) => {
    const count = smsList.filter((s) => s.created_at.startsWith(date)).length || 0;
    return { date, count };
  });

  const metrics = [
    {
      title: 'Totalt SMS',
      value: totalSMS || 0,
      change: '+12%',
      trend: 'up' as const,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Leveransfrekvens',
      value: `${deliveryRate}%`,
      change: '+2%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Aktiva kontakter',
      value: totalContacts || 0,
      change: '+8%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total kostnad',
      value: `${totalCost.toFixed(2)} SEK`,
      change: '+15%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const statusStats = [
    {
      status: 'Levererade',
      count: delivered,
      percentage: totalSMS ? ((delivered / totalSMS) * 100).toFixed(1) : '0',
      color: 'bg-green-500',
    },
    {
      status: 'Skickade',
      count: smsList.filter((s) => s.status === 'sent').length || 0,
      percentage: totalSMS
        ? (((smsList.filter((s) => s.status === 'sent').length || 0) / totalSMS) * 100).toFixed(1)
        : '0',
      color: 'bg-blue-500',
    },
    {
      status: 'Väntande',
      count: smsList.filter((s) => s.status === 'pending').length || 0,
      percentage: totalSMS
        ? (((smsList.filter((s) => s.status === 'pending').length || 0) / totalSMS) * 100).toFixed(1)
        : '0',
      color: 'bg-yellow-500',
    },
    {
      status: 'Misslyckade',
      count: failed,
      percentage: totalSMS ? ((failed / totalSMS) * 100).toFixed(1) : '0',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analys</h1>
        <p className="text-gray-600">Översikt över dina SMS-kampanjer och statistik</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {metric.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-sm text-gray-600">{metric.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* SMS Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>SMS senaste 7 dagarna</CardTitle>
            <CardDescription>Antal skickade SMS per dag</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {smsByDate.map((day) => {
                const maxCount = Math.max(...smsByDate.map((d) => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative group">
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                        style={{ height: `${height}%` || '2%', minHeight: '4px' }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {day.count} SMS
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(day.date).toLocaleDateString('sv-SE', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>SMS-status</CardTitle>
            <CardDescription>Fördelning av meddelanden per status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusStats.map((stat) => (
                <div key={stat.status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{stat.status}</span>
                    <span className="text-sm text-gray-600">
                      {stat.count} ({stat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${stat.color} h-2 rounded-full transition-all`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {totalSMS === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Ingen data ännu</p>
                <p className="text-sm mt-1">Börja skicka SMS för att se statistik</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Genomsnittlig kostnad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {totalSMS ? (totalCost / totalSMS).toFixed(2) : '0.00'} SEK
            </div>
            <p className="text-sm text-gray-600 mt-1">per SMS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SMS-krediter kvar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {organization?.sms_credits || 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Plan: {organization?.plan?.toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prenumeration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  organization?.subscription_status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : organization?.subscription_status === 'trial'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {organization?.subscription_status === 'active'
                  ? 'Aktiv'
                  : organization?.subscription_status === 'trial'
                  ? 'Testperiod'
                  : 'Inaktiv'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              {organization?.subscription_status === 'trial'
                ? 'Uppgradera för fler funktioner'
                : 'Allt fungerar som det ska'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

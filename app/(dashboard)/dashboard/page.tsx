import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  Send, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  DollarSign,
  Clock,
  Target,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { InsightsCard } from '@/components/dashboard/insights-card';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { CostTracker } from '@/components/dashboard/cost-tracker';

export default async function DashboardPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Get user's organization
  const { data: user } = await supabase
    .from('users')
    .select('*, organizations(*)')
    .eq('id', session.user.id)
    .single();

  if (!user?.organization_id) {
    redirect('/onboarding');
  }

  const orgId = user?.organization_id;

  // If no organization, show onboarding prompt instead of redirect
  if (!orgId) {
    return (
      <div className="p-4 lg:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 pb-6 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Välkommen till MEDDELA! 👋
              </h2>
              <p className="text-gray-600">
                Skapa din organisation för att komma igång med SMS-plattformen
              </p>
            </div>
            <Link href="/onboarding">
              <Button size="lg" className="w-full max-w-sm">
                <Sparkles className="h-5 w-5 mr-2" />
                Skapa organisation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get comprehensive stats
  const [
    { count: contactsCount },
    { count: smsCount },
    { data: recentSMS },
    { data: organization },
    { data: campaigns },
    { data: todaySMS },
    { data: weekSMS },
    { data: monthSMS },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
    supabase.from('sms_messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase
      .from('sms_messages')
      .select('*, contacts(name, phone)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('campaigns').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(3),
    supabase.from('sms_messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('sms_messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('sms_messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // Calculate statistics
  const totalContacts = contactsCount || 0;
  const totalSMS = smsCount || 0;
  const todaySMSCount = todaySMS?.count || 0;
  const weekSMSCount = weekSMS?.count || 0;
  const monthSMSCount = monthSMS?.count || 0;
  const smsCredits = organization?.sms_credits || 0;

  // Calculate trends (mock data for demonstration)
  const contactsTrend = totalContacts > 0 ? 12 : 0;
  const smsTrend = totalSMS > 0 ? 8 : 0;
  const deliveryRate = totalSMS > 0 ? 98 : 0;

  // Calculate costs (0.35 SEK per SMS in Sweden via 46elks)
  const costPerSMS = 0.35;
  const monthCost = monthSMSCount * costPerSMS;
  const weekCost = weekSMSCount * costPerSMS;
  const costTrend = weekSMSCount > 0 ? ((monthCost - weekCost) / weekCost * 100).toFixed(1) : 0;

  // Generate chart data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return Math.floor(Math.random() * 30) + 10; // Mock data
  });

  const stats = [
    {
      title: 'Totalt kontakter',
      value: totalContacts,
      icon: Users,
      description: 'Aktiva kontakter i databasen',
      color: 'text-blue-600',
      trend: {
        value: contactsTrend,
        isPositive: true,
      },
      chartData: last7Days,
    },
    {
      title: 'SMS skickade',
      value: totalSMS,
      icon: MessageSquare,
      description: `${todaySMSCount} idag, ${weekSMSCount} denna vecka`,
      color: 'text-green-600',
      trend: {
        value: smsTrend,
        isPositive: true,
      },
      chartData: last7Days.map(v => v * 1.2),
    },
    {
      title: 'SMS-krediter',
      value: smsCredits,
      icon: Send,
      description: 'Återstående SMS-krediter',
      color: 'text-purple-600',
      trend: {
        value: 15,
        isPositive: false,
      },
    },
    {
      title: 'Leveransfrekvens',
      value: `${deliveryRate}%`,
      icon: TrendingUp,
      description: 'Genomsnittlig leveransfrekvens',
      color: 'text-orange-600',
      trend: {
        value: 2,
        isPositive: true,
      },
      chartData: [95, 96, 97, 98, 97, 98, 98],
    },
  ];

  // Check if new user
  const isNewUser = totalContacts === 0 && totalSMS === 0;

  // Generate smart insights
  const insights = [];
  
  if (smsCredits < 50) {
    insights.push({
      id: '1',
      type: 'warning' as const,
      title: 'Lågt SMS-saldo',
      description: `Du har bara ${smsCredits} SMS kvar. Fyll på ditt saldo för att undvika avbrott.`,
      action: {
        label: 'Köp fler SMS',
        href: '/settings',
      },
    });
  }

  if (deliveryRate >= 98) {
    insights.push({
      id: '2',
      type: 'success' as const,
      title: 'Utmärkt leveransfrekvens!',
      description: `Din leveransfrekvens på ${deliveryRate}% är över genomsnittet. Bra jobbat!`,
    });
  }

  if (totalContacts > 100 && weekSMSCount < 10) {
    insights.push({
      id: '3',
      type: 'tip' as const,
      title: 'Engagera dina kontakter',
      description: 'Du har många kontakter men har inte skickat många SMS nyligen. Skapa en kampanj för att öka engagemanget!',
      action: {
        label: 'Skapa kampanj',
        href: '/campaigns',
      },
    });
  }

  if (totalContacts > 0 && totalSMS === 0) {
    insights.push({
      id: '4',
      type: 'info' as const,
      title: 'Skicka ditt första SMS',
      description: 'Du har kontakter men har inte skickat något SMS ännu. Testa systemet genom att skicka ett välkomstmeddelande!',
      action: {
        label: 'Skicka SMS',
        href: '/messages/send',
      },
    });
  }

  // Generate activity timeline
  const activities = recentSMS?.slice(0, 8).map((sms: any) => ({
    id: sms.id,
    type: sms.status === 'delivered' ? 'sms_delivered' : sms.status === 'failed' ? 'sms_failed' : 'sms_sent',
    title: sms.status === 'delivered' ? 'SMS levererat' : sms.status === 'failed' ? 'SMS misslyckades' : 'SMS skickat',
    description: `Till ${sms.contacts?.name || sms.to_phone}: "${sms.message.substring(0, 50)}${sms.message.length > 50 ? '...' : ''}"`,
    timestamp: sms.created_at,
  })) || [];

  // Performance data
  const performanceData = [
    { label: 'Måndag', value: 45, target: 50 },
    { label: 'Tisdag', value: 62, target: 50 },
    { label: 'Onsdag', value: 48, target: 50 },
    { label: 'Torsdag', value: 55, target: 50 },
    { label: 'Fredag', value: 70, target: 50 },
    { label: 'Lördag', value: 35, target: 30 },
    { label: 'Söndag', value: 28, target: 30 },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Welcome Banner for New Users */}
      {isNewUser && (
        <Card className="border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Sparkles className="h-10 w-10 text-yellow-300 animate-pulse" />
              </div>
              <div className="flex-1 text-white">
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                  Välkommen till MEDDELA! 🎉
                </h2>
                <p className="text-blue-100 mb-6 text-lg">
                  Du har {smsCredits} gratis SMS-krediter! Följ dessa steg för att komma igång:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/contacts/new"
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl p-5 transition-all hover:scale-105"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-6 w-6" />
                      <span className="font-semibold text-lg">Steg 1</span>
                    </div>
                    <p className="text-sm text-blue-50 mb-3">
                      Lägg till din första kontakt
                    </p>
                    <ArrowRight className="h-5 w-5 opacity-75 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/templates"
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl p-5 transition-all hover:scale-105"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-6 w-6" />
                      <span className="font-semibold text-lg">Steg 2</span>
                    </div>
                    <p className="text-sm text-blue-50 mb-3">
                      Utforska SMS-mallar
                    </p>
                    <ArrowRight className="h-5 w-5 opacity-75 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/messages/send"
                    className="group bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl p-5 transition-all hover:scale-105"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="h-6 w-6" />
                      <span className="font-semibold text-lg">Steg 3</span>
                    </div>
                    <p className="text-sm text-blue-50 mb-3">
                      Skicka ditt första SMS
                    </p>
                    <ArrowRight className="h-5 w-5 opacity-75 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            {isNewUser ? 'Kom igång med MEDDELA' : `Välkommen tillbaka, ${user?.full_name}! 👋`}
          </h1>
          <p className="text-gray-600 text-lg">
            {isNewUser
              ? 'Följ stegen ovan för att komma igång med din SMS-plattform'
              : 'Här är en översikt över din SMS-plattform'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info" className="text-sm px-4 py-2">
            {organization?.plan?.toUpperCase() || 'STARTER'}
          </Badge>
          <Link
            href="/messages/send"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            <Send className="h-5 w-5" />
            Skicka SMS
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Snabbåtgärder
          </CardTitle>
          <CardDescription>Vanliga uppgifter ett klick bort</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/messages/send" className="group">
              <div className="p-4 bg-white rounded-xl hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-600 transition-colors">
                    <Send className="h-5 w-5 text-blue-600 group-hover:text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">Skicka SMS</h4>
                </div>
                <p className="text-sm text-gray-600">Skicka snabbt till en kontakt</p>
              </div>
            </Link>

            <Link href="/contacts/new" className="group">
              <div className="p-4 bg-white rounded-xl hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-green-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-600 transition-colors">
                    <Users className="h-5 w-5 text-green-600 group-hover:text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-green-600">Ny kontakt</h4>
                </div>
                <p className="text-sm text-gray-600">Lägg till en ny kontakt</p>
              </div>
            </Link>

            <Link href="/campaigns" className="group">
              <div className="p-4 bg-white rounded-xl hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-purple-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-600 transition-colors">
                    <Target className="h-5 w-5 text-purple-600 group-hover:text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">Ny kampanj</h4>
                </div>
                <p className="text-sm text-gray-600">Skicka bulk SMS</p>
              </div>
            </Link>

            <Link href="/contacts/import" className="group">
              <div className="p-4 bg-white rounded-xl hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-orange-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-600 transition-colors">
                    <Activity className="h-5 w-5 text-orange-600 group-hover:text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-orange-600">Importera</h4>
                </div>
                <p className="text-sm text-gray-600">Ladda upp kontakter</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Smart Insights */}
      {insights.length > 0 && <InsightsCard insights={insights} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Middle Row: Cost Tracker & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostTracker
          totalCost={monthCost}
          budget={500}
          smsSent={monthSMSCount}
          costPerSMS={costPerSMS}
          trend={{
            value: parseFloat(costTrend as string),
            isPositive: parseFloat(costTrend as string) > 0,
          }}
        />
        
        <PerformanceChart
          title="SMS denna vecka"
          description="Antal SMS per dag"
          data={performanceData}
        />
      </div>

      {/* Campaign Overview */}
      {campaigns && campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Aktiva kampanjer</CardTitle>
                <CardDescription>Dina senaste SMS-kampanjer</CardDescription>
              </div>
              <Link
                href="/campaigns"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Visa alla →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campaigns.map((campaign: any) => (
                <div
                  key={campaign.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {campaign.name}
                    </h4>
                    <Badge
                      variant={
                        campaign.status === 'completed'
                          ? 'success'
                          : campaign.status === 'sending'
                          ? 'info'
                          : 'outline'
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {campaign.message}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {campaign.sent_count}/{campaign.total_recipients} skickat
                    </span>
                    <span>{campaign.delivered_count} levererat</span>
                  </div>
                  <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{
                        width: `${
                          (campaign.sent_count / campaign.total_recipients) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Row: Activity Timeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityTimeline activities={activities} />
        </div>

        {/* Enhanced Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snabbåtgärder</CardTitle>
            <CardDescription>Vanliga åtgärder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/contacts/new"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-all group"
            >
              <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-900">Lägg till kontakt</p>
                <p className="text-xs text-blue-700">Skapa ny kontakt</p>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/messages/send"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition-all group"
            >
              <div className="p-2 bg-green-600 rounded-lg group-hover:scale-110 transition-transform">
                <Send className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-900">Skicka SMS</p>
                <p className="text-xs text-green-700">Nytt meddelande</p>
              </div>
              <ArrowRight className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/campaigns"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition-all group"
            >
              <div className="p-2 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-purple-900">Ny kampanj</p>
                <p className="text-xs text-purple-700">Bulk SMS</p>
              </div>
              <ArrowRight className="h-4 w-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/analytics"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg transition-all group"
            >
              <div className="p-2 bg-orange-600 rounded-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-orange-900">Analys</p>
                <p className="text-xs text-orange-700">Visa rapporter</p>
              </div>
              <ArrowRight className="h-4 w-4 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="/templates"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg transition-all group"
            >
              <div className="p-2 bg-gray-600 rounded-lg group-hover:scale-110 transition-transform">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Mallar</p>
                <p className="text-xs text-gray-700">SMS-mallar</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Idag</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{todaySMSCount}</p>
          <p className="text-xs text-blue-600">SMS skickade</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Denna vecka</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{weekSMSCount}</p>
          <p className="text-xs text-green-600">SMS skickade</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Denna månad</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{monthSMSCount}</p>
          <p className="text-xs text-purple-600">SMS skickade</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-700">Total kostnad</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{monthCost.toFixed(0)} kr</p>
          <p className="text-xs text-orange-600">Denna månad</p>
        </div>
      </div>
    </div>
  );
}

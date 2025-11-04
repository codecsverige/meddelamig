import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Send, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
    // Redirect to onboarding if no organization
    redirect('/onboarding');
  }

  const orgId = user.organization_id;

  // Get stats
  const [
    { count: contactsCount },
    { count: smsCount },
    { data: recentSMS },
    { data: organization },
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
  ]);

  const stats = [
    {
      title: 'Totalt kontakter',
      value: contactsCount || 0,
      icon: Users,
      description: 'Aktiva kontakter i databasen',
      color: 'text-blue-600',
    },
    {
      title: 'SMS skickade',
      value: smsCount || 0,
      icon: MessageSquare,
      description: 'Totalt antal SMS',
      color: 'text-green-600',
    },
    {
      title: 'SMS-krediter',
      value: organization?.sms_credits || 0,
      icon: Send,
      description: 'Återstående SMS-krediter',
      color: 'text-purple-600',
    },
    {
      title: 'Leveransfrekvens',
      value: '98%',
      icon: TrendingUp,
      description: 'Genomsnittlig leveransfrekvens',
      color: 'text-orange-600',
    },
  ];

  // Check if new user (no contacts and no SMS sent)
  const isNewUser = (contactsCount || 0) === 0 && (smsCount || 0) === 0;

  return (
    <div className="p-8">
      {/* Welcome Banner for New Users */}
      {isNewUser && (
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 border-0">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Sparkles className="h-8 w-8 text-yellow-300" />
              </div>
              <div className="flex-1 text-white">
                <h2 className="text-2xl font-bold mb-2">
                  Välkommen till MEDDELA! 🎉
                </h2>
                <p className="text-blue-100 mb-4">
                  Du har {organization?.sms_credits || 0} gratis SMS-krediter! Här är vad du kan göra härnäst:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/contacts/new"
                    className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold">Steg 1</span>
                    </div>
                    <p className="text-sm text-blue-50">
                      Lägg till din första kontakt
                    </p>
                    <ArrowRight className="h-4 w-4 mt-2 opacity-75" />
                  </Link>

                  <Link
                    href="/templates"
                    className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-5 w-5" />
                      <span className="font-semibold">Steg 2</span>
                    </div>
                    <p className="text-sm text-blue-50">
                      Utforska SMS-mallar
                    </p>
                    <ArrowRight className="h-4 w-4 mt-2 opacity-75" />
                  </Link>

                  <Link
                    href="/messages/send"
                    className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="h-5 w-5" />
                      <span className="font-semibold">Steg 3</span>
                    </div>
                    <p className="text-sm text-blue-50">
                      Skicka ditt första SMS
                    </p>
                    <ArrowRight className="h-4 w-4 mt-2 opacity-75" />
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isNewUser ? 'Kom igång med MEDDELA' : `Välkommen tillbaka, ${user?.full_name}! 👋`}
        </h1>
        <p className="text-gray-600">
          {isNewUser
            ? 'Följ stegen ovan för att komma igång med din SMS-plattform'
            : 'Här är en översikt över din SMS-plattform'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent SMS */}
        <Card>
          <CardHeader>
            <CardTitle>Senaste SMS</CardTitle>
            <CardDescription>
              Dina senast skickade meddelanden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSMS && recentSMS.length > 0 ? (
              <div className="space-y-4">
                {recentSMS.map((sms: any) => (
                  <div
                    key={sms.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sms.contacts?.name || sms.to_phone}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {sms.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(sms.created_at).toLocaleString('sv-SE')}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        sms.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : sms.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : sms.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {sms.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Inga SMS skickade ännu</p>
                <p className="text-sm mt-1">
                  Börja med att lägga till kontakter och skicka ditt första SMS!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snabbåtgärder</CardTitle>
            <CardDescription>
              Vanliga åtgärder du kan utföra
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/contacts/new"
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Lägg till kontakt</p>
                <p className="text-sm text-blue-700">
                  Skapa en ny kontakt i databasen
                </p>
              </div>
            </a>

            <a
              href="/messages/send"
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <Send className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Skicka SMS</p>
                <p className="text-sm text-green-700">
                  Skicka ett nytt SMS-meddelande
                </p>
              </div>
            </a>

            <a
              href="/templates"
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">SMS-mallar</p>
                <p className="text-sm text-purple-700">
                  Hantera dina meddelandemallar
                </p>
              </div>
            </a>

            <a
              href="/settings"
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Inställningar</p>
                <p className="text-sm text-gray-700">
                  Konfigurera ditt konto och organisation
                </p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

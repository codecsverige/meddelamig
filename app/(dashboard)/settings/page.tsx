import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SettingsPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('*, organizations(*)')
    .eq('id', session.user.id)
    .single();

  if (!user?.organization_id) {
    redirect('/onboarding');
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inställningar</h1>
        <p className="text-gray-600">Hantera ditt konto och organisationsinställningar</p>
      </div>

      <div className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personlig information</CardTitle>
            <CardDescription>Din kontoinformation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Namn</label>
              <input
                type="text"
                value={user.full_name}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-postadress
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organisationsinformation</CardTitle>
            <CardDescription>Information om din organisation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Företagsnamn
              </label>
              <input
                type="text"
                value={user.organizations?.name}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bransch</label>
              <input
                type="text"
                value={
                  user.organizations?.industry === 'restaurant'
                    ? 'Restaurang'
                    : user.organizations?.industry === 'salon'
                    ? 'Salong'
                    : user.organizations?.industry === 'workshop'
                    ? 'Verkstad'
                    : 'B2B'
                }
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMS-avsändarnamn
              </label>
              <input
                type="text"
                value={user.organizations?.sms_sender_name}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Namnet som visas som avsändare i SMS
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Prenumeration</CardTitle>
            <CardDescription>Din nuvarande plan och betalning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {user.organizations?.plan?.toUpperCase()} Plan
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {user.organizations?.sms_credits} SMS-krediter kvar
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.organizations?.subscription_status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : user.organizations?.subscription_status === 'trial'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.organizations?.subscription_status === 'active'
                  ? 'Aktiv'
                  : user.organizations?.subscription_status === 'trial'
                  ? 'Testperiod'
                  : 'Inaktiv'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Kontakta support för att ändra din plan eller hantera betalning
            </p>
          </CardContent>
        </Card>

        {/* GDPR */}
        <Card>
          <CardHeader>
            <CardTitle>GDPR & Dataskydd</CardTitle>
            <CardDescription>Hantera dina data och integritet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-600">✓</span>
                <span>Dataskyddsavtal accepterat</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-600">✓</span>
                <span>GDPR-kompatibel datalagring</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-600">✓</span>
                <span>Automatisk opt-out hantering</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

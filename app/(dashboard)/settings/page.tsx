'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, AlertCircle, CheckCircle, Users, Bell, Shield, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);

  const [orgForm, setOrgForm] = useState({
    name: '',
    phone: '',
    email: '',
    sms_sender_name: '',
  });

  const [userForm, setUserForm] = useState({
    full_name: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;
      setUser(userData);
      setUserForm({ full_name: userData.full_name });

      if (!userData.organization_id) {
        router.push('/onboarding');
        return;
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);
      setOrgForm({
        name: orgData.name || '',
        phone: orgData.phone || '',
        email: orgData.email || '',
        sms_sender_name: orgData.sms_sender_name || '',
      });

    } catch (error: any) {
      showToast(error.message || 'Kunde inte ladda inställningar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveOrganization = async () => {
    setSaving(true);
    try {
      // Validate SMS sender name (max 11 chars)
      if (orgForm.sms_sender_name.length > 11) {
        throw new Error('SMS-avsändarnamn kan max vara 11 tecken');
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgForm.name,
          phone: orgForm.phone,
          email: orgForm.email,
          sms_sender_name: orgForm.sms_sender_name,
        })
        .eq('id', organization.id);

      if (error) throw error;

      showToast('Organisationsinställningar sparade!', 'success');
      loadData(); // Reload to get updated data
    } catch (error: any) {
      showToast(error.message || 'Kunde inte spara', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveUser = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: userForm.full_name,
        })
        .eq('id', user.id);

      if (error) throw error;

      showToast('Personlig information sparad!', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Kunde inte spara', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500">Laddar inställningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inställningar</h1>
        <p className="text-gray-600">Hantera ditt konto och organisationsinställningar</p>
      </div>

      <div className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personlig information
            </CardTitle>
            <CardDescription>Din kontoinformation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Namn *
              </label>
              <input
                type="text"
                value={userForm.full_name}
                onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ditt fullständiga namn"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-postadress
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                E-postadressen kan inte ändras
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roll
              </label>
              <input
                type="text"
                value={user?.role === 'owner' ? 'Ägare' : user?.role === 'admin' ? 'Administratör' : 'Medlem'}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <Button onClick={saveUser} disabled={saving || !userForm.full_name}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Spara ändringar
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Organisationsinformation
            </CardTitle>
            <CardDescription>Information om din organisation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Företagsnamn *
              </label>
              <input
                type="text"
                value={orgForm.name}
                onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ditt företagsnamn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefonnummer
              </label>
              <input
                type="tel"
                value={orgForm.phone}
                onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+46701234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-postadress
              </label>
              <input
                type="email"
                value={orgForm.email}
                onChange={e => setOrgForm({ ...orgForm, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="info@dittforetag.se"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMS-avsändarnamn *
              </label>
              <input
                type="text"
                value={orgForm.sms_sender_name}
                onChange={e => setOrgForm({ ...orgForm, sms_sender_name: e.target.value.toUpperCase().slice(0, 11) })}
                maxLength={11}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="MEDDELA"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 11 tecken. Namnet som visas som avsändare i SMS. ({orgForm.sms_sender_name.length}/11)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bransch
              </label>
              <input
                type="text"
                value={
                  organization?.industry === 'restaurant'
                    ? 'Restaurang'
                    : organization?.industry === 'salon'
                    ? 'Frisörsalong'
                    : organization?.industry === 'workshop'
                    ? 'Verkstad'
                    : 'B2B'
                }
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Branschen kan inte ändras efter onboarding
              </p>
            </div>

            <Button onClick={saveOrganization} disabled={saving || !orgForm.name || !orgForm.sms_sender_name}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Spara ändringar
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Prenumeration & Krediter
            </CardTitle>
            <CardDescription>Din nuvarande plan och SMS-krediter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div>
                <p className="font-bold text-xl text-gray-900">
                  {organization?.plan?.toUpperCase()} Plan
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {organization?.sms_credits || 0} SMS-krediter kvar
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  organization?.subscription_status === 'active'
                    ? 'bg-green-500 text-white'
                    : organization?.subscription_status === 'trial'
                    ? 'bg-blue-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {organization?.subscription_status === 'active'
                  ? '✓ Aktiv'
                  : organization?.subscription_status === 'trial'
                  ? '🎉 Testperiod'
                  : '⚠ Inaktiv'}
              </span>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">
                    Köp fler SMS-krediter
                  </p>
                  <p className="text-sm text-yellow-800">
                    Kontakta support@meddela.se för att uppgradera din plan eller köpa fler krediter
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-1">Pris per SMS</p>
                <p className="font-semibold text-gray-900">~0.35 SEK</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-1">Förnyelsedatum</p>
                <p className="font-semibold text-gray-900">
                  {organization?.created_at 
                    ? new Date(organization.created_at).toLocaleDateString('sv-SE')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifikationer
            </CardTitle>
            <CardDescription>Hantera dina e-postnotifikationer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">SMS levererad</p>
                  <p className="text-xs text-gray-600">Få notis när SMS levereras</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Låga krediter</p>
                  <p className="text-xs text-gray-600">Varning när SMS-krediter är låga</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Veckorapport</p>
                  <p className="text-xs text-gray-600">Sammanfattning varje måndag</p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* GDPR & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              GDPR & Dataskydd
            </CardTitle>
            <CardDescription>Hantera dina data och integritet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">GDPR-kompatibel</p>
                  <p className="text-xs text-green-700 mt-1">
                    All data lagras säkert i EU och följer GDPR-regler
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Dataskyddsavtal</p>
                  <p className="text-xs text-green-700 mt-1">
                    Accepterat: {organization?.created_at 
                      ? new Date(organization.created_at).toLocaleDateString('sv-SE')
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Opt-out hantering</p>
                  <p className="text-xs text-green-700 mt-1">
                    Automatisk hantering av STOP-kommandon
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">
                  Vill du exportera eller radera dina data?
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Exportera data
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    Radera konto
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API & Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>API & Integrationer</CardTitle>
            <CardDescription>Anslut andra tjänster</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 mb-2">
                <strong>Kommer snart:</strong> API-åtkomst för integration med ditt befintliga system
              </p>
              <p className="text-xs text-blue-700">
                Kontakta support för early access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

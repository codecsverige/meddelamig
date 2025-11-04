'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Building2, Users, MessageSquare } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    organizationName: '',
    industry: 'restaurant' as 'restaurant' | 'salon' | 'workshop' | 'b2b',
    phone: '',
    senderName: '',
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUserId(session.user.id);

    // Check if already has organization
    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (user?.organization_id) {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create organization
      const slug = formData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.organizationName,
          slug,
          industry: formData.industry,
          phone: formData.phone || null,
          plan: 'starter',
          sms_credits: 10, // Free trial
          subscription_status: 'trial',
          sms_sender_name: formData.senderName || 'MEDDELA',
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Update user with organization
      const { error: userError } = await supabase
        .from('users')
        .update({
          organization_id: org.id,
          role: 'owner',
        })
        .eq('id', userId);

      if (userError) throw userError;

      // Success - go to dashboard
      router.push('/dashboard?welcome=true');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const industries = [
    {
      value: 'restaurant',
      emoji: '🍽️',
      title: 'Restaurang',
      description: 'Bokningar, påminnelser, takeaway',
    },
    {
      value: 'salon',
      emoji: '💇',
      title: 'Salong',
      description: 'Tidsbokning, påminnelser, kampanjer',
    },
    {
      value: 'workshop',
      emoji: '🔧',
      title: 'Verkstad',
      description: 'Bil klar, service, orderbekräftelser',
    },
    {
      value: 'b2b',
      emoji: '📦',
      title: 'B2B/Annat',
      description: 'Leveranser, orderbekräftelser',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-400 border-2 border-gray-300'
                  }`}
                >
                  {step > s ? <CheckCircle className="h-6 w-6" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 w-16 mx-2 ${
                      step > s ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Steg {step} av 3 - {
                step === 1 ? 'Välj bransch' :
                step === 2 ? 'Företagsinformation' :
                'Klar!'
              }
            </p>
          </div>
        </div>

        {/* Step 1: Choose Industry */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Välkommen till MEDDELA! 🎉</CardTitle>
              <CardDescription className="text-lg mt-2">
                Låt oss sätta upp ditt konto. Vilket typ av företag driver du?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {industries.map((ind) => (
                  <button
                    key={ind.value}
                    onClick={() => {
                      setFormData({ ...formData, industry: ind.value as any });
                      setStep(2);
                    }}
                    className={`p-6 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left ${
                      formData.industry === ind.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="text-4xl mb-3">{ind.emoji}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {ind.title}
                    </h3>
                    <p className="text-sm text-gray-600">{ind.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Company Info */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Företagsinformation</CardTitle>
              <CardDescription>
                Berätta lite om ditt företag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Företagsnamn *
                  </label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) =>
                      setFormData({ ...formData, organizationName: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="T.ex. Restaurang Bella"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon (valfritt)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="08-123 456 78"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS Avsändarnamn (max 11 tecken)
                  </label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        senderName: e.target.value.slice(0, 11),
                      })
                    }
                    maxLength={11}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="MEDDELA"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Namnet som visas när du skickar SMS
                  </p>
                </div>

                {/* Free Trial Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">
                        Gratis testperiod inkluderad! 🎁
                      </h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• 10 gratis SMS-krediter</li>
                        <li>• Ingen bindningstid</li>
                        <li>• Inget kreditkort krävs</li>
                        <li>• Alla funktioner tillgängliga</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Tillbaka
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Skapar...' : 'Slutför och börja'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const INDUSTRIES = [
  { value: 'restaurant', label: 'Restaurang', icon: '🍽️' },
  { value: 'salon', label: 'Frisörsalong', icon: '💇' },
  { value: 'workshop', label: 'Verkstad', icon: '🔧' },
  { value: 'b2b', label: 'B2B/Annat', icon: '🏢' },
];

const PLANS = [
  {
    value: 'starter',
    name: 'Starter',
    price: '299',
    credits: 100,
    features: ['100 SMS/månad', 'Grundläggande mallar', 'Email support'],
  },
  {
    value: 'professional',
    name: 'Professional',
    price: '599',
    credits: 300,
    features: ['300 SMS/månad', 'Alla mallar', 'Prioriterad support', 'Kampanjverktyg'],
    popular: true,
  },
  {
    value: 'business',
    name: 'Business',
    price: '1299',
    credits: 1000,
    features: ['1000 SMS/månad', 'Alla funktioner', '24/7 support', 'API-åtkomst', 'Dedikerad account manager'],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    organizationName: '',
    industry: '',
    phone: '',
    email: '',
    plan: 'professional',
    senderName: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    setUserId(session.user.id);

    // Check if user already has organization
    const { data: user } = await supabase
      .from('users')
      .select('organization_id, email, full_name')
      .eq('id', session.user.id)
      .single();

    if (user?.organization_id) {
      router.push('/dashboard');
      return;
    }

    // Pre-fill email
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);

    try {
      if (!userId) throw new Error('Not authenticated');

      // Create organization
      const slug = formData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.organizationName,
          slug: `${slug}-${Date.now()}`,
          industry: formData.industry,
          phone: formData.phone || null,
          email: formData.email,
          plan: formData.plan,
          sms_credits: PLANS.find(p => p.value === formData.plan)?.credits || 100,
          subscription_status: 'trial',
          sms_sender_name: formData.senderName || 'MEDDELA',
          gdpr_consent_date: new Date().toISOString(),
          data_processing_agreement: true,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Update user with organization_id
      const { error: userError } = await supabase
        .from('users')
        .update({
          organization_id: org.id,
          role: 'owner',
        })
        .eq('id', userId);

      if (userError) throw userError;

      showToast('Välkommen till Meddela! 🎉', 'success');
      
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } catch (error: any) {
      console.error('Onboarding error:', error);
      showToast(error.message || 'Ett fel uppstod', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Organisation</span>
            <span>Bransch</span>
            <span>Abonnemang</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && 'Välkommen till Meddela!'}
              {step === 2 && 'Välj din bransch'}
              {step === 3 && 'Välj ditt abonnemang'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Låt oss komma igång med ditt konto'}
              {step === 2 && 'Vi anpassar upplevelsen efter din verksamhet'}
              {step === 3 && 'Du kan alltid ändra senare'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Organization Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                      Organisationsnamn *
                    </label>
                    <input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      value={formData.organizationName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mina Restauranger AB"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-postadress *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="info@minafirma.se"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefonnummer (valfritt)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="08-123 456 78"
                    />
                  </div>

                  <div>
                    <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-2">
                      SMS-avsändarnamn (max 11 tecken)
                    </label>
                    <input
                      id="senderName"
                      name="senderName"
                      type="text"
                      value={formData.senderName}
                      onChange={handleChange}
                      maxLength={11}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="MEDDELA"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Detta namn kommer att visas som avsändare i dina SMS
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Industry */}
              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {INDUSTRIES.map((industry) => (
                    <label
                      key={industry.value}
                      className={`relative flex items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.industry === industry.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="industry"
                        value={industry.value}
                        checked={formData.industry === industry.value}
                        onChange={handleChange}
                        required
                        className="sr-only"
                      />
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{industry.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{industry.label}</p>
                        </div>
                      </div>
                      {formData.industry === industry.value && (
                        <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-blue-600" />
                      )}
                    </label>
                  ))}
                </div>
              )}

              {/* Step 3: Plan */}
              {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PLANS.map((plan) => (
                    <label
                      key={plan.value}
                      className={`relative flex flex-col p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.plan === plan.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      } ${plan.popular ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.value}
                        checked={formData.plan === plan.value}
                        onChange={handleChange}
                        required
                        className="sr-only"
                      />
                      
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                          POPULÄR
                        </span>
                      )}

                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <div className="mt-2">
                          <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                          <span className="text-gray-600"> SEK/mån</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{plan.credits} SMS inkluderade</p>
                      </div>

                      <ul className="space-y-2 flex-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {formData.plan === plan.value && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Vald</span>
                          </div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="flex-1"
                    disabled={loading}
                  >
                    Tillbaka
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Skapar...
                    </>
                  ) : step === 3 ? (
                    'Slutför'
                  ) : (
                    'Nästa'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Trial Notice */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            🎉 Du får <strong>14 dagars gratis provperiod</strong> - inget kreditkort krävs
          </p>
        </div>
      </div>
    </div>
  );
}

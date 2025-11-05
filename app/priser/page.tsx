import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: '299',
      sms: '100',
      features: [
        'Upp till 100 SMS per månad',
        'Obegränsat antal kontakter',
        'Grundläggande mallar',
        'SMS-historik',
        'E-postsupport',
        'GDPR-kompatibel',
      ],
      cta: 'Kom igång',
      popular: false,
    },
    {
      name: 'Professional',
      price: '599',
      sms: '500',
      features: [
        'Upp till 500 SMS per månad',
        'Obegränsat antal kontakter',
        'Alla mallar (16st)',
        'Kampanjer (bulk SMS)',
        'Avancerad analys',
        'Prioriterad support',
        'API-åtkomst',
        'GDPR-kompatibel',
      ],
      cta: 'Mest populär',
      popular: true,
    },
    {
      name: 'Business',
      price: '999',
      sms: '2000',
      features: [
        'Upp till 2000 SMS per månad',
        'Obegränsat antal kontakter',
        'Alla funktioner inkluderade',
        'Anpassade mallar',
        'Dedikerad support',
        'API-åtkomst',
        'Teamhantering',
        'Prioriterad leverans',
        'GDPR-kompatibel',
      ],
      cta: 'Kontakta oss',
      popular: false,
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              <span className="font-bold text-xl text-gray-900">MEDDELA</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/priser" className="text-blue-600 font-medium">
                Priser
              </Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Hem
              </Link>
              <Link href="/login">
                <Button variant="outline">Logga in</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Enkla och transparenta priser
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Välj den plan som passar ditt företag. Ingen bindningstid, avsluta när du vill.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Check className="h-5 w-5 text-green-600" />
            <span>14 dagars gratis test</span>
            <span className="mx-2">•</span>
            <Check className="h-5 w-5 text-green-600" />
            <span>Inget kreditkort krävs</span>
            <span className="mx-2">•</span>
            <Check className="h-5 w-5 text-green-600" />
            <span>Avsluta när som helst</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:scale-105 ${
                  plan.popular
                    ? 'border-blue-500 shadow-blue-200'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      ⭐ Mest populär
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">SEK/månad</span>
                  </div>

                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-900">{plan.sms}</span> SMS inkluderade
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Extra SMS: 0.40 SEK/st
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/register">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                          : ''
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Vanliga frågor
            </h2>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Vad händer om jag överskrider mitt SMS-antal?
                </h3>
                <p className="text-gray-600">
                  Extra SMS kostar 0.40 SEK/st. Du kan också uppgradera din plan när som helst.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Kan jag avsluta när som helst?
                </h3>
                <p className="text-gray-600">
                  Ja! Ingen bindningstid. Avsluta när du vill från inställningar.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Vilka betalningsmetoder accepterar ni?
                </h3>
                <p className="text-gray-600">
                  Vi accepterar alla svenska kort via Stripe (Visa, Mastercard, Amex).
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Är det GDPR-säkert?
                </h3>
                <p className="text-gray-600">
                  Ja! Alla data lagras i EU (Stockholm) och vi följer GDPR 100%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Redo att komma igång?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Testa gratis i 14 dagar - inget kreditkort krävs
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Starta gratis testperiod
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

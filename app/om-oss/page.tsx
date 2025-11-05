import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Users, Shield, Zap } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Kundcentrerad',
      description: 'Varje funktion är byggd för att lösa verkliga problem för svenska företag.',
    },
    {
      icon: Users,
      title: 'Lokalt fokus',
      description: 'Byggd i Sverige, för Sverige. Svensk support på svenska.',
    },
    {
      icon: Shield,
      title: 'Säkerhet först',
      description: 'GDPR-kompatibel från dag 1. Din data är säker hos oss.',
    },
    {
      icon: Zap,
      title: 'Enkelt att använda',
      description: 'Ingen teknisk kunskap krävs. Kom igång på 5 minuter.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Nöjda kunder' },
    { value: '98%', label: 'Leveransfrekvens' },
    { value: '35%', label: 'Färre no-shows' },
    { value: '24/7', label: 'Systemtid' },
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
              <Link href="/priser" className="text-gray-600 hover:text-gray-900">
                Priser
              </Link>
              <Link href="/om-oss" className="text-blue-600 font-medium">
                Om oss
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
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Vi gör SMS-kommunikation{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              enkelt för svenska företag
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            MEDDELA startades med en enkel vision: att hjälpa svenska småföretag 
            att minska no-shows och förbättra kundkommunikationen med automatiska SMS-påminnelser.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Våra värderingar
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Vad som driver oss varje dag
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Vår historia
            </h2>
            <div className="prose prose-lg">
              <p className="text-gray-700 mb-4">
                MEDDELA grundades 2024 av svenska entreprenörer som själva drev restauranger 
                och salonger. Vi såg hur mycket tid och pengar som förlorades på grund av 
                uteblivna kunder (no-shows).
              </p>
              <p className="text-gray-700 mb-4">
                Efter att ha testat olika internationella SMS-plattformar märkte vi att 
                ingen var riktigt anpassad för svenska företag - komplicerade gränssnitt, 
                engelska mallar och dyrt.
              </p>
              <p className="text-gray-700 mb-4">
                Så vi byggde MEDDELA - en SMS-plattform som är enkel, prisvärd och 
                specifikt designad för svenska småföretag.
              </p>
              <p className="text-gray-700">
                Idag hjälper vi hundratals företag att spara tid, minska no-shows och 
                förbättra kundupplevelsen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Redo att börja spara tid?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Gå med i hundratals svenska företag som redan använder MEDDELA
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Kom igång gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

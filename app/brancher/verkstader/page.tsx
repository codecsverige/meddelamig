import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Wrench, Clock, CheckCircle, Star } from 'lucide-react';

export default function WorkshopPage() {
  const features = [
    {
      icon: Wrench,
      title: 'Bil klar-meddelanden',
      description: 'Informera kunder automatiskt när bilen är klar för upphämtning',
    },
    {
      icon: Clock,
      title: 'Servicepåminnelser',
      description: 'Påminn kunder om kommande service och besiktning',
    },
    {
      icon: CheckCircle,
      title: 'Orderbekräftelser',
      description: 'Bekräfta bokningar och orderdetaljer direkt via SMS',
    },
    {
      icon: Star,
      title: 'Kundlojalitet',
      description: 'Bygg långsiktiga relationer med påminnelser och erbjudanden',
    },
  ];

  const templates = [
    {
      title: 'Bil klar',
      message: 'Hej {namn}! Din {bilmodell} är nu klar för upphämtning. Total kostnad: {kostnad} SEK. Välkommen till {verkstad}! 🚗',
    },
    {
      title: 'Orderbekräftelse',
      message: 'Tack {namn}! Din bokning för service av {bilmodell} den {datum} kl {tid} är bekräftad. Beräknad tid: {timmar}h',
    },
    {
      title: 'Servicepåminnelse',
      message: 'Hej {namn}! Din {bilmodell} är snart dags för service. Boka tid på {telefon} eller svara på detta SMS 🔧',
    },
    {
      title: 'Besiktningspåminnelse',
      message: 'Hej {namn}! Din {bilmodell} ska besiktigas senast {datum}. Vi hjälper dig - boka på {telefon}',
    },
  ];

  const testimonials = [
    {
      quote: 'Kunderna uppskattar att få veta när bilen är klar. Mindre ring och fråga!',
      author: 'Lars Pettersson',
      workshop: 'Bilcity Verkstad, Jönköping',
      rating: 5,
    },
    {
      quote: 'Servicepåminnelserna ökar återkommande kunder med 30%. Fantastiskt!',
      author: 'Johan Eriksson',
      workshop: 'Mekonomen Verkstad, Västerås',
      rating: 5,
    },
  ];

  const stats = [
    { label: 'Aktiva verkstäder', value: '80+' },
    { label: 'Färre samtal', value: '65%' },
    { label: 'Fler återbesök', value: '30%' },
    { label: 'Kundnöjdhet', value: '96%' },
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
              <Link href="/om-oss" className="text-gray-600 hover:text-gray-900">
                Om oss
              </Link>
              <Link href="/login">
                <Button variant="outline">Logga in</Button>
              </Link>
              <Link href="/register">
                <Button>Kom igång gratis</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">🔧</div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              SMS-meddelanden för{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Bilverkstäder
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Minska telefonsamtal och öka kundnöjdheten med automatiska bil klar-meddelanden
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                Prova gratis i 14 dagar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Inget kreditkort krävs • 80+ verkstäder litar på oss
            </p>
          </div>
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

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Varför verkstäder älskar MEDDELA
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Effektivisera kommunikationen och bygg starkare kundrelationer
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Fördelar för din verkstad
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-4">
                <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Spara tid på telefon
                  </h3>
                  <p className="text-gray-600 text-sm">
                    65% färre inkommande samtal om när bilen är klar
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4">
                <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Nöjdare kunder
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Kunderna uppskattar att bli informerade proaktivt
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4">
                <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Fler återbesök
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Servicepåminnelser ökar återkommande service med 30%
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4">
                <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Professionell image
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Ge ett modernt och professionellt intryck
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Färdiga SMS-mallar
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professionella mallar skapade för verkstadsbranschen
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {templates.map((template) => (
              <div key={template.title} className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {template.title}
                </h3>
                <p className="text-gray-700 text-sm italic bg-gray-50 p-4 rounded-lg">
                  "{template.message}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vad verkstadsägare säger
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.workshop}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Användningsområden
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
                <div className="text-4xl mb-3">🚗</div>
                <h3 className="font-semibold text-gray-900 mb-2">Service</h3>
                <p className="text-sm text-gray-600">Årlig service och oljebyte</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-semibold text-gray-900 mb-2">Besiktning</h3>
                <p className="text-sm text-gray-600">Påminnelser och kontroll</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
                <div className="text-4xl mb-3">🛠️</div>
                <h3 className="font-semibold text-gray-900 mb-2">Reparationer</h3>
                <p className="text-sm text-gray-600">Alla typer av reparationer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Redo att modernisera din verkstad?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Gå med i 80+ verkstäder som redan använder MEDDELA
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Starta din gratis testperiod
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

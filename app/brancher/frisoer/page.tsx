import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Clock, Scissors, Heart, Star } from 'lucide-react';

export default function SalonPage() {
  const features = [
    {
      icon: Clock,
      title: 'Tidsbokningspåminnelser',
      description: 'Automatiska påminnelser innan varje besök för att undvika missade tider',
    },
    {
      icon: Scissors,
      title: 'Behandlingskonfirmationer',
      description: 'Bekräfta bokningar direkt via SMS med tid, behandling och pris',
    },
    {
      icon: Heart,
      title: 'Kundvård',
      description: 'Skicka tack-meddelanden och tips efter behandling',
    },
    {
      icon: Star,
      title: 'Stamkundserbjudanden',
      description: 'Belöna lojala kunder med exklusiva erbjudanden',
    },
  ];

  const templates = [
    {
      title: 'Tidspåminnelse',
      message: 'Hej {namn}! Påminnelse om din tid hos {salong} imorgon kl {tid}. Vi ser fram emot att ta hand om dig! 💇',
    },
    {
      title: 'Bokningsbekräftelse',
      message: 'Tack {namn}! Din bokning för {behandling} den {datum} kl {tid} är bekräftad. Pris: {pris} SEK. Välkommen!',
    },
    {
      title: 'Eftervård',
      message: 'Hej {namn}! Tack för ditt besök! Kom ihåg att återfukta håret dagligen. Vi ses snart igen! 😊',
    },
    {
      title: 'Kampanj',
      message: 'Hej {namn}! Exklusivt för dig: 15% rabatt på klippning + färg i mars. Boka på {telefon} 💝',
    },
  ];

  const testimonials = [
    {
      quote: 'Kunderna uppskattar påminnelserna och vi har färre no-shows. Perfekt!',
      author: 'Anna Lindberg',
      salon: 'Bella Salon, Malmö',
      rating: 5,
    },
    {
      quote: 'Enkelt att använda och sparar oss så mycket tid varje dag.',
      author: 'Sofia Johansson',
      salon: 'Hair & Beauty, Uppsala',
      rating: 5,
    },
  ];

  const stats = [
    { label: 'Aktiva salonger', value: '200+' },
    { label: 'Ökad punktlighet', value: '42%' },
    { label: 'Tidssparande/vecka', value: '5h' },
    { label: 'Kundnöjdhet', value: '97%' },
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
      <section className="py-20 bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">💇</div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              SMS-påminnelser för{' '}
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Salonger & Frisörer
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Ge dina kunder en professionell upplevelse med automatiska bokningspåminnelser
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                Prova gratis i 14 dagar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Inget kreditkort krävs • 200+ salonger litar på oss
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
                <div className="text-4xl font-bold text-pink-600 mb-2">
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
              Varför salonger älskar MEDDELA
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ge dina kunder en premium upplevelse från bokning till eftervård
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-pink-600" />
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

      {/* Templates */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Färdiga SMS-mallar
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professionella mallar anpassade för salong- och frisörbranschen
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {templates.map((template) => (
              <div key={template.title} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {template.title}
                </h3>
                <p className="text-gray-700 text-sm italic bg-white p-4 rounded-lg border border-gray-100">
                  "{template.message}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vad salongägare säger
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
                  <p className="text-sm text-gray-600">{testimonial.salon}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Perfekt för alla typer av behandlingar
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-pink-50 rounded-xl">
                <div className="text-4xl mb-3">✂️</div>
                <h3 className="font-semibold text-gray-900 mb-2">Klippning</h3>
                <p className="text-sm text-gray-600">Dam, herr, barn</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="text-4xl mb-3">🎨</div>
                <h3 className="font-semibold text-gray-900 mb-2">Färgning</h3>
                <p className="text-sm text-gray-600">Balayage, slingor, helårsförändring</p>
              </div>
              <div className="text-center p-6 bg-pink-50 rounded-xl">
                <div className="text-4xl mb-3">💅</div>
                <h3 className="font-semibold text-gray-900 mb-2">Naglar & Spa</h3>
                <p className="text-sm text-gray-600">Manikyr, pedikyr, behandlingar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-pink-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ge dina kunder en professionell upplevelse
          </h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Gå med i 200+ salonger som redan använder MEDDELA
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

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Clock, Users, TrendingDown, Star } from 'lucide-react';

export default function RestaurantPage() {
  const features = [
    {
      icon: Clock,
      title: 'Bokningspåminnelser',
      description: 'Automatiska påminnelser 24h innan bokning för att minska no-shows',
    },
    {
      icon: Users,
      title: 'Bordhantering',
      description: 'Bekräfta bokningar och hantera sistaminutenändringar via SMS',
    },
    {
      icon: TrendingDown,
      title: 'Minska no-shows med 35%',
      description: 'Bevisad minskning av uteblivna gäster med automatiska påminnelser',
    },
    {
      icon: Star,
      title: 'Specialerbjudanden',
      description: 'Skicka erbjudanden till stamkunder på lugna dagar',
    },
  ];

  const templates = [
    {
      title: 'Bokningspåminnelse',
      message: 'Hej {namn}! Vi ser fram emot ditt besök imorgon kl {tid}. Välkommen till {restaurang}! Behöver du ändra? Ring {telefon}',
    },
    {
      title: 'Bokningsbekräftelse',
      message: 'Tack {namn}! Din bokning för {antal} personer den {datum} kl {tid} är bekräftad. Vi ses snart! 🍽️',
    },
    {
      title: 'Tacksägelse',
      message: 'Tack för ditt besök hos oss {namn}! Vi hoppas du hade en fantastisk upplevelse. Välkommen åter! 😊',
    },
    {
      title: 'Specialerbjudande',
      message: 'Hej {namn}! Exklusivt erbjudande för dig: 20% rabatt på hela notan på tisdagar i mars. Boka på {telefon}',
    },
  ];

  const testimonials = [
    {
      quote: 'No-shows minskade med 40% första månaden. Fantastiskt!',
      author: 'Erik Karlsson',
      restaurant: 'Bella Italia, Stockholm',
      rating: 5,
    },
    {
      quote: 'Våra gäster älskar påminnelserna. Professionellt och enkelt.',
      author: 'Maria Andersson',
      restaurant: 'Kustens Pärla, Göteborg',
      rating: 5,
    },
  ];

  const stats = [
    { label: 'Aktiva restauranger', value: '150+' },
    { label: 'Minskning no-shows', value: '35%' },
    { label: 'Skickade SMS/månad', value: '50k+' },
    { label: 'Nöjda gäster', value: '98%' },
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
      <section className="py-20 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">🍽️</div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              SMS-påminnelser för{' '}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Restauranger
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Minska no-shows med 35% och spara timmar varje vecka med automatiska bokningspåminnelser
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                Prova gratis i 14 dagar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Inget kreditkort krävs • 150+ restauranger litar på oss
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
                <div className="text-4xl font-bold text-orange-600 mb-2">
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
              Varför restauranger älskar MEDDELA
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Allt du behöver för att hantera bokningar professionellt
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-orange-600" />
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
              Professionella mallar skapade specifikt för restaurangbranschen
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
              Vad restaurangägare säger
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
                  <p className="text-sm text-gray-600">{testimonial.restaurant}</p>
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
              Använd MEDDELA för
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="text-4xl mb-3">📅</div>
                <h3 className="font-semibold text-gray-900 mb-2">Bokningar</h3>
                <p className="text-sm text-gray-600">Bekräftelser och påminnelser</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-semibold text-gray-900 mb-2">Event</h3>
                <p className="text-sm text-gray-600">Buffé, fester, privata evenemang</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-3">💝</div>
                <h3 className="font-semibold text-gray-900 mb-2">Lojalitet</h3>
                <p className="text-sm text-gray-600">Erbjudanden till stamkunder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Redo att minska no-shows?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Gå med i 150+ restauranger som redan använder MEDDELA
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

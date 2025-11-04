import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  MessageSquare,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Clock,
      title: 'Spara tid',
      description: 'Automatisera dina SMS-påminnelser och frigör tid för viktigare uppgifter',
    },
    {
      icon: Users,
      title: 'Minska no-shows',
      description: 'Reducera uteblivna besök med upp till 35% med automatiska påminnelser',
    },
    {
      icon: MessageSquare,
      title: 'Färdiga mallar',
      description: 'Använd våra branschspecifika mallar eller skapa dina egna',
    },
    {
      icon: Shield,
      title: 'GDPR-säkert',
      description: 'Fullständig GDPR-efterlevnad med inbyggda samtycken och säkerhet',
    },
    {
      icon: TrendingUp,
      title: 'Smart analys',
      description: 'Följ dina kampanjer och se leveransstatistik i realtid',
    },
    {
      icon: Zap,
      title: 'Snabb integration',
      description: 'Kom igång på 5 minuter med vårt enkla gränssnitt',
    },
  ];

  const industries = [
    {
      emoji: '🍽️',
      name: 'Restauranger',
      features: ['Bokningspåminnelser', 'Tacksägelser', 'Specialerbjudanden'],
      href: '/brancher/restauranger',
    },
    {
      emoji: '💇',
      name: 'Salonger',
      features: ['Tidsbokning', 'Automatiska påminnelser', 'Kundvård'],
      href: '/brancher/frisoer',
    },
    {
      emoji: '🔧',
      name: 'Verkstäder',
      features: ['Bil klar-meddelanden', 'Servicepåminnelser', 'Orderbekräftelser'],
      href: '/brancher/verkstader',
    },
  ];

  const testimonials = [
    {
      quote: 'MEDDELA har minskat våra no-shows med 40%. Otroligt enkelt att använda!',
      author: 'Erik Andersson',
      role: 'Restaurangägare, Stockholm',
    },
    {
      quote: 'Perfekt för vår salong. Kunderna älskar påminnelserna och vi sparar timmar varje vecka.',
      author: 'Anna Svensson',
      role: 'Salong Bella, Göteborg',
    },
    {
      quote: 'Bästa investeringen vi gjort. ROI på några veckor!',
      author: 'Lars Johansson',
      role: 'Mekonomen Verkstad',
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
              <Link href="/priser" className="text-gray-600 hover:text-gray-900">
                Priser
              </Link>
              <Link href="/om-oss" className="text-gray-600 hover:text-gray-900">
                Om oss
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Logga in
              </Link>
              <Link href="/register">
                <Button>Kom igång gratis</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6 text-sm font-medium">
              <Zap className="h-4 w-4" />
              Sveriges enklaste SMS-plattform
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Minska no-shows med{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                automatiska SMS
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Professionell SMS-plattform för svenska företag. Spara tid, öka intäkterna 
              och förbättra kundupplevelsen med automatiska påminnelser.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6">
                  Prova gratis i 14 dagar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/priser">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Se priser
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Ingen bindningstid</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>GDPR-säkert</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Svensk support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Allt du behöver för att lyckas
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              En komplett SMS-lösning byggd specifikt för svenska företag
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
              >
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

      {/* Industries Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfekt för din bransch
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Skräddarsydda lösningar för olika branscher
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {industries.map((industry) => (
              <Link
                key={industry.name}
                href={industry.href}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-all border border-gray-200 hover:border-blue-300"
              >
                <div className="text-5xl mb-4">{industry.emoji}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {industry.name}
                </h3>
                <ul className="space-y-2">
                  {industry.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 text-blue-600 font-medium flex items-center gap-2">
                  Läs mer <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vad våra kunder säger
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="text-yellow-400 mb-4">★★★★★</div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
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
            Gå med i hundratals svenska företag som redan använder MEDDELA
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Starta din gratis testperiod
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-blue-100 mt-4">
            Inget kreditkort krävs • Avsluta när du vill
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📱</span>
                <span className="font-bold text-xl text-white">MEDDELA</span>
              </div>
              <p className="text-sm text-gray-400">
                Sveriges enklaste SMS-plattform för företag
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/priser" className="hover:text-white">Priser</Link></li>
                <li><Link href="/brancher/restauranger" className="hover:text-white">Restauranger</Link></li>
                <li><Link href="/brancher/frisoer" className="hover:text-white">Salonger</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Företag</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/om-oss" className="hover:text-white">Om oss</Link></li>
                <li><Link href="/kontakt" className="hover:text-white">Kontakt</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Juridiskt</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Integritetspolicy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Användarvillkor</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 MEDDELA. Alla rättigheter förbehållna. 🇸🇪 Gjord i Sverige</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

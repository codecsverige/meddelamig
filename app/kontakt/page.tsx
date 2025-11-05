import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
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
              <Link href="/kontakt" className="text-blue-600 font-medium">
                Kontakt
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
            Kontakta oss
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Vi finns här för att hjälpa dig. Tveka inte att höra av dig!
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">E-post</h3>
              <a
                href="mailto:support@meddelasms.se"
                className="text-blue-600 hover:underline"
              >
                support@meddelasms.se
              </a>
              <p className="text-sm text-gray-500 mt-2">Svarar inom 24h</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Chatt</h3>
              <p className="text-gray-700">Livechatt i appen</p>
              <p className="text-sm text-gray-500 mt-2">Mån-Fre 9-17</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Telefon</h3>
              <a href="tel:+46101234567" className="text-purple-600 hover:underline">
                010-123 45 67
              </a>
              <p className="text-sm text-gray-500 mt-2">Mån-Fre 9-17</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Adress</h3>
              <p className="text-gray-700">Stockholm, Sverige</p>
              <p className="text-sm text-gray-500 mt-2">Besök efter bokning</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Skicka ett meddelande
            </h2>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Namn *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ditt namn"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-post *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="namn@företag.se"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Företag
                </label>
                <input
                  type="text"
                  id="company"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ditt företagsnamn"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Ämne *
                </label>
                <select
                  id="subject"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Välj ämne</option>
                  <option value="sales">Säljfrågor</option>
                  <option value="support">Teknisk support</option>
                  <option value="billing">Fakturering</option>
                  <option value="partnership">Partnerskap</option>
                  <option value="other">Övrigt</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Meddelande *
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Beskriv hur vi kan hjälpa dig..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Skicka meddelande
              </Button>

              <p className="text-sm text-gray-500 text-center">
                Vi svarar normalt inom 24 timmar på vardagar
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Vanliga frågor
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Hur snabbt får jag svar?
                </h3>
                <p className="text-gray-600">
                  Vi strävar efter att svara på alla förfrågningar inom 24 timmar på vardagar. 
                  För akuta supportärenden, använd vår livechatt i appen.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Finns ni tillgängliga på helger?
                </h3>
                <p className="text-gray-600">
                  Vår support är öppen måndag-fredag 9-17. För premium-kunder erbjuder vi 
                  utökad support även på helger.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Kan jag boka ett möte?
                </h3>
                <p className="text-gray-600">
                  Ja! Kontakta oss via e-post eller ring så bokar vi en tid som passar dig.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

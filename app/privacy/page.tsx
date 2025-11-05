import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
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
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Integritetspolicy
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              Senast uppdaterad: {new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduktion</h2>
              <p className="text-gray-700 mb-4">
                MEDDELA ("vi", "oss", "vår") respekterar din integritet och är engagerade i att skydda 
                dina personuppgifter. Denna integritetspolicy beskriver hur vi samlar in, använder och 
                skyddar din information när du använder vår SMS-plattform.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Personuppgiftsansvarig</h2>
              <p className="text-gray-700 mb-4">
                MEDDELA AB är personuppgiftsansvarig för behandlingen av dina personuppgifter.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Företag: MEDDELA AB</li>
                <li>Organisationsnummer: XXX-XXXXXXX</li>
                <li>Adress: Stockholm, Sverige</li>
                <li>E-post: privacy@meddelasms.se</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Vilka uppgifter samlar vi in?</h2>
              <p className="text-gray-700 mb-4">Vi samlar in följande kategorier av personuppgifter:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Kontouppgifter:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Namn</li>
                <li>E-postadress</li>
                <li>Företagsnamn</li>
                <li>Telefonnummer</li>
                <li>Lösenord (krypterat)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Användningsdata:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>SMS-meddelanden och mottagare</li>
                <li>Kontaktinformation du laddar upp</li>
                <li>Kampanjdata och statistik</li>
                <li>IP-adress och enhetsinfo</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Betalningsuppgifter:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Kortuppgifter (hanteras av Stripe, lagras ej hos oss)</li>
                <li>Faktureringsadress</li>
                <li>Transaktionshistorik</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Hur använder vi dina uppgifter?</h2>
              <p className="text-gray-700 mb-4">Vi använder dina personuppgifter för att:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Tillhandahålla och förbättra våra tjänster</li>
                <li>Skicka SMS-meddelanden å dina vägnar</li>
                <li>Hantera ditt konto och prenumeration</li>
                <li>Behandla betalningar</li>
                <li>Tillhandahålla kundsupport</li>
                <li>Skicka viktiga uppdateringar om tjänsten</li>
                <li>Förebygga bedrägerier och säkerhetshot</li>
                <li>Följa juridiska krav</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Rättslig grund</h2>
              <p className="text-gray-700 mb-4">Vi behandlar dina personuppgifter baserat på:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Avtal:</strong> För att fullgöra vårt avtal med dig</li>
                <li><strong>Berättigat intresse:</strong> För att förbättra våra tjänster och säkerhet</li>
                <li><strong>Samtycke:</strong> När du ger oss tillåtelse (t.ex. marknadsföring)</li>
                <li><strong>Rättslig skyldighet:</strong> När lagen kräver det</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Delning av uppgifter</h2>
              <p className="text-gray-700 mb-4">Vi delar dina uppgifter med:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>46elks:</strong> Vår SMS-leverantör för att skicka meddelanden</li>
                <li><strong>Supabase:</strong> Vår databasleverantör (servrar i EU)</li>
                <li><strong>Stripe:</strong> För betalningshantering</li>
                <li><strong>Vercel:</strong> För hosting och leverans</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Vi säljer aldrig dina personuppgifter till tredje part.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Datalagring</h2>
              <p className="text-gray-700 mb-4">
                All data lagras inom EU (primärt Stockholm och Frankfurt). Vi lagrar dina uppgifter 
                så länge du har ett aktivt konto. Efter avslutad prenumeration raderas eller anonymiseras 
                dina uppgifter inom 90 dagar, om inte juridiska krav säger annat.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Dina rättigheter</h2>
              <p className="text-gray-700 mb-4">Enligt GDPR har du rätt att:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Tillgång:</strong> Begära en kopia av dina uppgifter</li>
                <li><strong>Rättelse:</strong> Korrigera felaktiga uppgifter</li>
                <li><strong>Radering:</strong> Begära att vi raderar dina uppgifter</li>
                <li><strong>Begränsning:</strong> Begränsa behandlingen</li>
                <li><strong>Dataportabilitet:</strong> Få dina uppgifter i maskinläsbart format</li>
                <li><strong>Invändning:</strong> Invända mot viss behandling</li>
                <li><strong>Återkalla samtycke:</strong> När som helst</li>
              </ul>
              <p className="text-gray-700 mt-4">
                För att utöva dina rättigheter, kontakta oss på privacy@meddelasms.se
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Säkerhet</h2>
              <p className="text-gray-700 mb-4">
                Vi använder branschstandard säkerhetsåtgärder för att skydda dina uppgifter:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Kryptering av data under överföring (TLS/SSL)</li>
                <li>Kryptering av känslig data i vila</li>
                <li>Tvåfaktorsautentisering (2FA)</li>
                <li>Regelbundna säkerhetsgranskningar</li>
                <li>Begränsad åtkomst till personuppgifter</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies</h2>
              <p className="text-gray-700 mb-4">
                Vi använder endast nödvändiga cookies för att säkerställa att tjänsten fungerar korrekt. 
                Inga tracking- eller annonscookies används.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Ändringar i policyn</h2>
              <p className="text-gray-700 mb-4">
                Vi kan uppdatera denna policy då och då. Vid väsentliga ändringar kommer vi att 
                meddela dig via e-post eller i appen.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Kontakt</h2>
              <p className="text-gray-700 mb-4">
                För frågor om denna integritetspolicy eller dina personuppgifter:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>E-post: privacy@meddelasms.se</li>
                <li>Telefon: 010-123 45 67</li>
                <li>Adress: MEDDELA AB, Stockholm, Sverige</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Du har även rätt att lämna in ett klagomål till Integritetsskyddsmyndigheten (IMY) 
                om du anser att vi behandlar dina personuppgifter felaktigt.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link href="/">
              <Button variant="outline">
                Tillbaka till startsidan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
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
            Användarvillkor
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              Senast uppdaterad: {new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptans av villkor</h2>
              <p className="text-gray-700 mb-4">
                Genom att använda MEDDELA:s tjänster accepterar du dessa användarvillkor. Om du inte 
                accepterar villkoren ska du inte använda tjänsten.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Tjänstebeskrivning</h2>
              <p className="text-gray-700 mb-4">
                MEDDELA är en SMS-plattform som gör det möjligt för företag att skicka automatiserade 
                SMS-meddelanden till sina kunder. Tjänsten inkluderar:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Kontakthantering</li>
                <li>SMS-mallar</li>
                <li>Kampanjverktyg</li>
                <li>Analys och rapportering</li>
                <li>API-åtkomst (vissa planer)</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Konto och registrering</h2>
              <p className="text-gray-700 mb-4">För att använda tjänsten måste du:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Vara minst 18 år eller ha målsmans tillstånd</li>
                <li>Tillhandahålla korrekt och fullständig information</li>
                <li>Hålla ditt konto säkert och skyddat</li>
                <li>Omedelbart meddela oss om obehörig användning</li>
                <li>Vara ansvarig för all aktivitet under ditt konto</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptabel användning</h2>
              <p className="text-gray-700 mb-4">Du får INTE använda tjänsten för att:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Skicka spam eller oönskade meddelanden</li>
                <li>Skicka meddelanden utan mottagarens samtycke</li>
                <li>Sprida skadligt innehåll eller malware</li>
                <li>Bryta mot några lagar eller förordningar</li>
                <li>Kränka andras rättigheter</li>
                <li>Skicka bedrägligt, trakasserande eller olagligt innehåll</li>
                <li>Försöka få obehörig åtkomst till systemet</li>
              </ul>
              <p className="text-gray-700 mt-4">
                <strong>Viktigt:</strong> Du måste ha dokumenterat samtycke från alla mottagare enligt GDPR 
                och svensk marknadsföringslagstiftning.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Priser och betalning</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Prenumerationsplaner</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Månadsprenumeration med olika nivåer</li>
                <li>Inkluderat antal SMS per månad beroende på plan</li>
                <li>Extra SMS debiteras 0.40 SEK/st</li>
                <li>Priser anges exklusive moms</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Betalningsvillkor</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Betalning sker i förskott varje månad</li>
                <li>Automatisk förnyelse via Stripe</li>
                <li>Vid utebliven betalning kan tjänsten stängas av</li>
                <li>Inga återbetalningar för outnyttjade SMS</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Gratis testperiod</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>14 dagars gratis test utan kreditkort</li>
                <li>Full åtkomst till alla funktioner under testperioden</li>
                <li>Efter testperioden krävs betalplan för fortsatt användning</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Uppsägning</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Din uppsägning</h3>
              <p className="text-gray-700 mb-4">
                Du kan när som helst säga upp din prenumeration via inställningar i appen. 
                Uppsägning träder i kraft vid nästa faktureringsperiod. Ingen återbetalning 
                sker för redan betalda perioder.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Vår uppsägning</h3>
              <p className="text-gray-700 mb-4">
                Vi förbehåller oss rätten att stänga av eller avsluta ditt konto om:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Du bryter mot dessa villkor</li>
                <li>Betalning uteblir</li>
                <li>Tjänsten missbrukas</li>
                <li>Vi bedömer att det föreligger juridiska risker</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Leveransgaranti</h2>
              <p className="text-gray-700 mb-4">
                Vi strävar efter 98% leveransfrekvens men kan inte garantera att alla SMS levereras. 
                Faktorer utanför vår kontroll inkluderar:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Mottagarens operatör</li>
                <li>Telefonnummer som inte längre är aktivt</li>
                <li>Full inkorg hos mottagaren</li>
                <li>Tekniska problem hos tredjepartsleverantörer</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Misslyckade SMS debiteras inte.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Immateriella rättigheter</h2>
              <p className="text-gray-700 mb-4">
                All innehåll på MEDDELA:s plattform (text, grafik, logotyper, kod) ägs av MEDDELA AB 
                och skyddas av upphovsrättslagen. Du får inte kopiera, reproducera eller distribuera 
                vårt innehåll utan tillstånd.
              </p>
              <p className="text-gray-700 mt-4">
                Du behåller alla rättigheter till ditt innehåll (kontakter, meddelanden).
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Ansvarsbegränsning</h2>
              <p className="text-gray-700 mb-4">
                MEDDELA ansvarar inte för:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Indirekta skador eller utebliven vinst</li>
                <li>Förlust av data (säkerhetskopiera regelbundet)</li>
                <li>Skador orsakade av tredje part</li>
                <li>Fel eller avbrott i tjänsten</li>
                <li>Ditt bruk av tjänsten i strid med lag</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Vårt totala ansvar begränsas till det belopp du betalat för tjänsten under de 
                senaste 12 månaderna.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Force Majeure</h2>
              <p className="text-gray-700 mb-4">
                Vi ansvarar inte för försening eller utebliven prestation som orsakas av omständigheter 
                utanför vår kontroll, inklusive naturkatastrofer, krig, arbetskonflikter, eller 
                myndighetsbeslut.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Ändringar av villkoren</h2>
              <p className="text-gray-700 mb-4">
                Vi kan ändra dessa villkor när som helst. Vid väsentliga ändringar meddelar vi dig 
                30 dagar i förväg via e-post. Fortsatt användning av tjänsten efter ändringen innebär 
                att du accepterar de nya villkoren.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Tillämplig lag</h2>
              <p className="text-gray-700 mb-4">
                Dessa villkor styrs av svensk lag. Eventuella tvister ska i första hand lösas genom 
                förhandling. Om det inte är möjligt ska tvisten avgöras av svensk domstol.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Kontaktinformation</h2>
              <p className="text-gray-700 mb-4">
                För frågor om dessa villkor:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Företag: MEDDELA AB</li>
                <li>E-post: legal@meddelasms.se</li>
                <li>Telefon: 010-123 45 67</li>
                <li>Adress: Stockholm, Sverige</li>
              </ul>
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

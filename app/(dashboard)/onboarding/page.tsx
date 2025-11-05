import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import OnboardingForm from './_components/onboarding-form';

export default async function OnboardingPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', session.user.id)
    .single();

  if (user?.organization_id) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-3xl mx-auto py-16 px-6">
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            Steg 1 av 1
          </span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Låt oss sätta upp din organisation
          </h1>
          <p className="mt-3 text-gray-600 text-lg">
            Fyll i uppgifterna nedan så skapar vi din arbetsyta och ger dig startkrediter för SMS.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Suspense fallback={<div className="text-gray-500">Laddar formulär...</div>}>
              <OnboardingForm />
            </Suspense>
          </div>

          <aside className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Vad händer nu?</h2>
              <ul className="mt-3 space-y-3 text-sm text-gray-600">
                <li>• Vi skapar din organisation och kopplar den till kontot.</li>
                <li>• Du får 25 sms-krediter för att testa plattformen.</li>
                <li>• Efteråt tar vi dig direkt till instrumentpanelen.</li>
              </ul>
            </section>

            <section className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Behöver du hjälp?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Du kan alltid kontakta vår support på <a href="mailto:support@meddela.se" className="text-blue-600 hover:text-blue-700">support@meddela.se</a> om du fastnar.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

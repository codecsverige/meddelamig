import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Sparkles, ArrowRight } from 'lucide-react';

export default async function TemplatesPage() {
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

  if (!user?.organization_id) {
    redirect('/onboarding');
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-3">
          Kommer snart
        </span>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          SMS-mallar
          <Sparkles className="h-7 w-7 text-indigo-500" />
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl">
          Snart kan du skapa, spara och dela branschspecifika SMS-mallar. Under tiden kan du använda våra rekommenderade mallar i sektionen nedan.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <MessageSquare className="h-5 w-5" />
              Pågående utveckling
            </CardTitle>
            <CardDescription>
              Vad du kommer att få i kommande uppdatering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-indigo-900/80">
            <p>• Bygg mallar med dynamiska variabler och uppsätt triggers.</p>
            <p>• Dela mallar med ditt team och återanvänd dem i kampanjer.</p>
            <p>• Inspireras av branschspecifika bibliotek skapade av MEDDELA.</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Behöver du mallar nu?</CardTitle>
            <CardDescription>
              Besök våra färdiga exempel i dokumentationen och kopiera dem till dina kampanjer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-600">
            <p>
              Vi har samlat exempel för restauranger, salonger, verkstäder och B2B. Kopiera mallarna och klistra in dem direkt i dina kampanjer eller individuella meddelanden.
            </p>
            <Link
              href="/docs/templates"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Gå till dokumentationen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

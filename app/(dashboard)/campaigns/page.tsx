import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Send } from 'lucide-react';

export default async function CampaignsPage() {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kampanjer</h1>
          <p className="text-gray-600">Skicka bulk SMS till flera kontakter samtidigt</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ny kampanj
        </Button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <Send className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inga kampanjer ännu
            </h3>
            <p className="mb-6">
              Skapa din första kampanj för att skicka SMS till flera kontakter
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Skapa kampanj
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

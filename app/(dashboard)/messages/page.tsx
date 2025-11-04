import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageSquare } from 'lucide-react';
import { displayPhoneNumber } from '@/lib/utils/phone';

export default async function MessagesPage() {
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

  // Get messages
  const { data: messages } = await supabase
    .from('sms_messages')
    .select('*, contacts(name, phone)')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meddelanden</h1>
          <p className="text-gray-600">Alla dina skickade SMS-meddelanden</p>
        </div>
        <Link href="/messages/send">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Skicka SMS
          </Button>
        </Link>
      </div>

      {/* Messages List */}
      {messages && messages.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>SMS-historik ({messages.length})</CardTitle>
            <CardDescription>Alla dina skickade meddelanden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map((message: any) => (
                <div
                  key={message.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {(message.contacts?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {message.contacts?.name || 'Okänd kontakt'}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleString('sv-SE')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {displayPhoneNumber(message.to_phone)}
                    </p>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {message.message}
                    </p>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          message.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : message.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : message.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.status === 'delivered'
                          ? 'Levererad'
                          : message.status === 'sent'
                          ? 'Skickad'
                          : message.status === 'failed'
                          ? 'Misslyckad'
                          : 'Väntande'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Typ: {message.type === 'manual' ? 'Manuell' : message.type}
                      </span>
                      {message.cost && (
                        <span className="text-xs text-gray-500">
                          Kostnad: {parseFloat(message.cost).toFixed(2)} SEK
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga meddelanden ännu
              </h3>
              <p className="mb-6">Skicka ditt första SMS för att komma igång</p>
              <Link href="/messages/send">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Skicka SMS
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

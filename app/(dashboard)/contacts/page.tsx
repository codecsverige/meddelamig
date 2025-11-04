import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download, Upload, Search, Users } from 'lucide-react';
import { displayPhoneNumber } from '@/lib/utils/phone';

export default async function ContactsPage() {
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

  // Get contacts
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', user.organization_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kontakter</h1>
          <p className="text-gray-600">
            Hantera dina kunder och kontakter
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
          <Link href="/contacts/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importera
            </Button>
          </Link>
          <Link href="/contacts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny kontakt
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Sök kontakter..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>Alla taggar</option>
              <option>VIP</option>
              <option>Regular</option>
              <option>New</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      {contacts && contacts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Alla kontakter ({contacts.length})</CardTitle>
            <CardDescription>
              En lista över alla dina kontakter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Namn
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Telefon
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      E-post
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Taggar
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      SMS skickade
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Senaste besök
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact: any) => (
                    <tr
                      key={contact.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                            {(contact.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {contact.name || 'Unnamed'}
                            </p>
                            {contact.sms_consent ? (
                              <p className="text-xs text-green-600">
                                ✓ SMS-godkännande
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400">
                                Inget godkännande
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {displayPhoneNumber(contact.phone)}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {contact.email || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {contact.tags && contact.tags.length > 0 ? (
                            contact.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {contact.total_sms_sent}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {contact.last_visit_date
                          ? new Date(contact.last_visit_date).toLocaleDateString('sv-SE')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Visa
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga kontakter ännu
              </h3>
              <p className="mb-6">
                Börja med att lägga till din första kontakt
              </p>
              <Link href="/contacts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till kontakt
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

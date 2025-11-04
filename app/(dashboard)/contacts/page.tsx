'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download, Upload, Search, Users, X } from 'lucide-react';
import { displayPhoneNumber } from '@/lib/utils/phone';

export default function ContactsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, selectedTag, contacts]);

  const loadContacts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) {
        router.push('/onboarding');
        return;
      }

      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', user.organization_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      setContacts(contactsData || []);
      
      // Extract unique tags
      const tags = new Set<string>();
      contactsData?.forEach((contact: any) => {
        contact.tags?.forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = [...contacts];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contact) =>
          contact.name?.toLowerCase().includes(query) ||
          contact.phone?.includes(query) ||
          contact.email?.toLowerCase().includes(query)
      );
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter((contact) =>
        contact.tags?.includes(selectedTag)
      );
    }

    setFilteredContacts(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag('');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-500">Laddar kontakter...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kontakter</h1>
          <p className="text-gray-600">
            Hantera dina kunder och kontakter
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
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
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sök efter namn, telefon eller email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            >
              <option value="">Alla taggar</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {(searchQuery || selectedTag) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Rensa
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedTag) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <span>Visar {filteredContacts.length} av {contacts.length} kontakter</span>
              {selectedTag && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  Tag: {selectedTag}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts List */}
      {filteredContacts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Alla kontakter ({filteredContacts.length})</CardTitle>
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
                    <th className="hidden md:table-cell text-left py-3 px-4 font-medium text-gray-700">
                      E-post
                    </th>
                    <th className="hidden lg:table-cell text-left py-3 px-4 font-medium text-gray-700">
                      Taggar
                    </th>
                    <th className="hidden sm:table-cell text-left py-3 px-4 font-medium text-gray-700">
                      SMS
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact: any) => (
                    <tr
                      key={contact.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {(contact.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
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
                      <td className="hidden md:table-cell py-3 px-4 text-gray-700 truncate max-w-[200px]">
                        {contact.email || '-'}
                      </td>
                      <td className="hidden lg:table-cell py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {contact.tags && contact.tags.length > 0 ? (
                            contact.tags.slice(0, 2).map((tag: string) => (
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
                          {contact.tags && contact.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{contact.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell py-3 px-4 text-gray-700">
                        {contact.total_sms_sent || 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/contacts/${contact.id}`}
                          onClick={(e) => e.stopPropagation()}
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
      ) : contacts.length > 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga kontakter hittades
              </h3>
              <p className="mb-6">
                Inga kontakter matchar dina sökkriterier
              </p>
              <Button onClick={clearFilters} variant="outline">
                Rensa filter
              </Button>
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

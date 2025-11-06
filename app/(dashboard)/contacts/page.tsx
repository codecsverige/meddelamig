"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Download, Upload, Search, Users, X, Tag } from "lucide-react";
import { displayPhoneNumber } from "@/lib/utils/phone";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

export default function ContactsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, selectedTag, contacts]);

  const loadContacts = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: user } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();

      if (!user?.organization_id) {
        router.push("/onboarding");
        return;
      }

      const { data: contactsData } = await supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", user.organization_id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      setContacts(contactsData || []);

      // Extract unique tags
      const tags = new Set<string>();
      contactsData?.forEach((contact: any) => {
        contact.tags?.forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error("Failed to load contacts:", error);
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
          contact.email?.toLowerCase().includes(query),
      );
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter((contact) =>
        contact.tags?.includes(selectedTag),
      );
    }

    setFilteredContacts(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag("");
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const toggleSelectContact = (contactId: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(contactId)) {
      newSet.delete(contactId);
    } else {
      newSet.add(contactId);
    }
    setSelectedContacts(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) return;
    
    if (!confirm(`Är du säker på att du vill ta bort ${selectedContacts.size} kontakter?`)) return;

    try {
      const contactIds = Array.from(selectedContacts);
      
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', contactIds);

      if (error) throw error;

      showToast(`${selectedContacts.size} kontakter borttagna!`, 'success');
      setSelectedContacts(new Set());
      setBulkActionMode(false);
      loadContacts();
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('Kunde inte ta bort kontakter', 'error');
    }
  };

  const handleBulkAddTag = async () => {
    if (selectedContacts.size === 0) return;
    
    const newTag = prompt('Ange tagg att lägga till:');
    if (!newTag) return;

    try {
      const contactIds = Array.from(selectedContacts);
      
      // Get current contacts
      const { data: currentContacts } = await supabase
        .from('contacts')
        .select('id, tags')
        .in('id', contactIds);

      if (!currentContacts) throw new Error('Could not fetch contacts');

      // Update each contact
      for (const contact of currentContacts) {
        const currentTags = contact.tags || [];
        if (!currentTags.includes(newTag)) {
          const updatedTags = [...currentTags, newTag];
          
          await supabase
            .from('contacts')
            .update({ tags: updatedTags })
            .eq('id', contact.id);
        }
      }

      showToast(`Tagg "${newTag}" tillagd till ${selectedContacts.size} kontakter!`, 'success');
      setSelectedContacts(new Set());
      setBulkActionMode(false);
      loadContacts();
    } catch (error) {
      console.error('Bulk add tag error:', error);
      showToast('Kunde inte lägga till tagg', 'error');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch("/api/contacts/export");

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Misslyckades med att exportera kontakter",
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().split("T")[0];

      link.href = url;
      link.download = `meddela-kontakter-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("Kontakter exporterades!", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ett oväntat fel uppstod";
      showToast(message, "error");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Laddar kontakter...</p>
        </div>
      </div>
    );
  }

  // Show onboarding prompt if no organization
  if (!contacts.length && !user?.organization_id) {
    return (
      <div className="p-4 lg:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 pb-6 text-center">
            <div className="mb-6">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ingen organisation ännu
              </h2>
              <p className="text-gray-600">
                Skapa din organisation först för att börja lägga till kontakter
              </p>
            </div>
            <Link href="/onboarding">
              <Button size="lg">
                Skapa organisation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kontakter</h1>
          <p className="text-gray-600">Hantera dina kunder och kontakter</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {bulkActionMode && selectedContacts.size > 0 ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedContacts(new Set());
                  setBulkActionMode(false);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Avbryt ({selectedContacts.size})
              </Button>
              <Button
                variant="outline"
                onClick={handleBulkAddTag}
              >
                L\u00e4gg till tagg
              </Button>
              <Button
                variant="outline"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700"
              >
                Ta bort valda
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setBulkActionMode(!bulkActionMode)}
              >
                {bulkActionMode ? 'Avbryt val' : 'V\u00e4lj flera'}
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exporting || filteredContacts.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporterar..." : `Exportera ${filteredContacts.length > 0 ? `(${filteredContacts.length})` : ''}`}
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
            </>
          )}
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
              <span>
                Visar {filteredContacts.length} av {contacts.length} kontakter
              </span>
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
            <CardDescription>En lista över alla dina kontakter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {bulkActionMode && (
                      <th className="w-12 py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                    )}
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
                      className={`border-b border-gray-100 hover:bg-gray-50 ${!bulkActionMode ? 'cursor-pointer' : ''} ${selectedContacts.has(contact.id) ? 'bg-blue-50' : ''}`}
                      onClick={() => !bulkActionMode && router.push(`/contacts/${contact.id}`)}
                    >
                      {bulkActionMode && (
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedContacts.has(contact.id)}
                            onChange={() => toggleSelectContact(contact.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {(contact.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {contact.name || "Unnamed"}
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
                        {contact.email || "-"}
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
              <p className="mb-6">Inga kontakter matchar dina sökkriterier</p>
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

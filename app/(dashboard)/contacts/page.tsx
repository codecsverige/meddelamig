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
import { 
  Plus, Download, Upload, Search, Users, X, Tag, 
  Send, Trash2, Edit, CheckSquare, Square, MessageSquare 
} from "lucide-react";
import { displayPhoneNumber } from "@/lib/utils/phone";
import { useToast } from "@/components/ui/toast";

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
  const [user, setUser] = useState<any>(null);
  const [showBulkSMS, setShowBulkSMS] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);

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

      // Skip redirect - handle in UI
      if (!user?.organization_id) {
        setLoading(false);
        return;
      }

      const { data: contactsData } = await supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", user.organization_id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      setContacts(contactsData || []);
      setUser(user);

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

  const toggleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleBulkSMS = () => {
    if (selectedContacts.size === 0) {
      showToast("Välj minst en kontakt", "error");
      return;
    }
    setShowBulkSMS(true);
  };

  const sendBulkSMS = async () => {
    if (!bulkMessage.trim()) {
      showToast("Skriv ett meddelande", "error");
      return;
    }

    setSendingBulk(true);
    let sent = 0;
    let failed = 0;

    try {
      const selectedContactsList = contacts.filter(c => selectedContacts.has(c.id));

      for (const contact of selectedContactsList) {
        try {
          const response = await fetch("/api/sms/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contactId: contact.id,
              message: bulkMessage,
              messageType: "manual",
            }),
          });

          if (response.ok) {
            sent++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      showToast(`✅ ${sent} SMS skickade! ${failed > 0 ? `❌ ${failed} misslyckades` : ''}`, sent > 0 ? "success" : "error");
      
      setShowBulkSMS(false);
      setBulkMessage("");
      setSelectedContacts(new Set());
      setBulkActionMode(false);
    } catch (error: any) {
      showToast(error.message || "Något gick fel", "error");
    } finally {
      setSendingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) {
      showToast("Välj minst en kontakt", "error");
      return;
    }

    if (!confirm(`Är du säker på att du vill ta bort ${selectedContacts.size} kontakter?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("contacts")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", Array.from(selectedContacts));

      if (error) throw error;

      showToast(`${selectedContacts.size} kontakter borttagna`, "success");
      setSelectedContacts(new Set());
      setBulkActionMode(false);
      loadContacts();
    } catch (error: any) {
      showToast(error.message || "Kunde inte ta bort kontakter", "error");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportData = filteredContacts.map((contact) => ({
        Namn: contact.name,
        Telefon: contact.phone,
        Email: contact.email || "",
        Taggar: contact.tags?.join("; ") || "",
        "SMS-samtycke": contact.sms_consent ? "Ja" : "Nej",
        "Marketing-samtycke": contact.marketing_consent ? "Ja" : "Nej",
        Skapad: new Date(contact.created_at).toLocaleDateString("sv-SE"),
      }));

      const csv = [
        Object.keys(exportData[0]).join(","),
        ...exportData.map((row) =>
          Object.values(row)
            .map((val) => `"${val}"`)
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();

      showToast("Kontakter exporterade!", "success");
    } catch (error) {
      showToast("Export misslyckades", "error");
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
          <p className="text-gray-600">
            {filteredContacts.length} av {contacts.length} kontakter
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {bulkActionMode && selectedContacts.size > 0 && (
            <>
              <Button 
                variant="outline" 
                onClick={handleBulkSMS}
                className="bg-blue-50 hover:bg-blue-100"
              >
                <Send className="h-4 w-4 mr-2" />
                Skicka SMS ({selectedContacts.size})
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBulkDelete}
                className="bg-red-50 hover:bg-red-100 text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ta bort ({selectedContacts.size})
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setBulkActionMode(!bulkActionMode)}>
            <CheckSquare className="h-4 w-4 mr-2" />
            {bulkActionMode ? "Avsluta urval" : "Välj flera"}
          </Button>
          <Link href="/contacts/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importera
            </Button>
          </Link>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
          <Link href="/contacts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Lägg till kontakt
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Sök efter namn, telefon eller email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tag Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedTag("")}
                className={`px-3 py-1 rounded-full text-sm ${
                  !selectedTag
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Alla ({contacts.length})
              </button>
              {allTags.map((tag) => {
                const count = contacts.filter((c) => c.tags?.includes(tag)).length;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? "" : tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTag === tag
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tag} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      {filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card 
              key={contact.id}
              className={`hover:shadow-lg transition-shadow ${
                selectedContacts.has(contact.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {bulkActionMode && (
                      <button
                        onClick={() => toggleSelectContact(contact.id)}
                        className="flex-shrink-0"
                      >
                        {selectedContacts.has(contact.id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {contact.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {displayPhoneNumber(contact.phone)}
                      </p>
                      {contact.email && (
                        <p className="text-xs text-gray-500 mt-1">
                          {contact.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {contact.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/messages/send?contact=${contact.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      SMS
                    </Button>
                  </Link>
                  <Link href={`/contacts/${contact.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Consent badges */}
                <div className="flex gap-2 mt-3 pt-3 border-t text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      contact.sms_consent
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {contact.sms_consent ? "✓ SMS" : "✗ SMS"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      contact.marketing_consent
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {contact.marketing_consent ? "✓ Marketing" : "✗ Marketing"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || selectedTag
                  ? "Inga kontakter hittades"
                  : "Inga kontakter ännu"}
              </h3>
              <p className="mb-6">
                {searchQuery || selectedTag
                  ? "Prova att ändra dina sökfilter"
                  : "Lägg till din första kontakt för att komma igång"}
              </p>
              {!searchQuery && !selectedTag && (
                <Link href="/contacts/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till kontakt
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk SMS Modal */}
      {showBulkSMS && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Skicka SMS till {selectedContacts.size} kontakter</CardTitle>
              <CardDescription>
                Meddelandet skickas till alla valda kontakter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meddelande
                  </label>
                  <textarea
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    rows={6}
                    maxLength={1600}
                    placeholder="Skriv ditt meddelande här..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{bulkMessage.length} / 1600 tecken</span>
                    <span>
                      Kostnad: ~{(selectedContacts.size * 0.35).toFixed(2)} SEK
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkSMS(false);
                      setBulkMessage("");
                    }}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button
                    onClick={sendBulkSMS}
                    disabled={sendingBulk || !bulkMessage.trim()}
                    className="flex-1"
                  >
                    {sendingBulk ? "Skickar..." : `Skicka till ${selectedContacts.size}`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Select All Bar */}
      {bulkActionMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-full px-6 py-4 flex items-center gap-4 border-2 border-blue-500 z-40">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {selectedContacts.size === filteredContacts.length ? (
              <CheckSquare className="h-5 w-5 text-blue-600" />
            ) : (
              <Square className="h-5 w-5" />
            )}
            Välj alla ({filteredContacts.length})
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <span className="text-sm font-semibold text-blue-600">
            {selectedContacts.size} valda
          </span>
        </div>
      )}
    </div>
  );
}

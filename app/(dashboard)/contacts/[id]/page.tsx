'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Mail, 
  Phone,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { displayPhoneNumber } from '@/lib/utils/phone';
import type { Database } from '@/lib/supabase/types';

interface Contact {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string[] | null;
  custom_fields: any;
  sms_consent: boolean;
  marketing_consent: boolean;
  consent_date: string | null;
  consent_source: string | null;
  total_bookings: number;
  total_sms_sent: number;
  last_visit_date: string | null;
  created_at: string;
  updated_at: string;
}

interface SMSMessage {
  id: string;
  message: string;
  status: string;
  created_at: string;
  cost: string | number | null;
  direction: 'outbound' | 'inbound';
  to_phone: string;
  from_phone: string | null;
}

interface ContactNote {
  id: string;
  body: string;
  note_type: 'note' | 'task' | 'alert';
  created_at: string;
  author_id: string | null;
}

type TimelineItem =
  | {
      kind: 'sms';
      id: string;
      message: string;
      status: string;
      cost: number | null;
      direction: 'outbound' | 'inbound';
      to_phone: string;
      from_phone: string | null;
      created_at: string;
    }
  | {
      kind: 'note';
      id: string;
      body: string;
      note_type: 'note' | 'task' | 'alert';
      created_at: string;
      author_id: string | null;
    };

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [smsHistory, setSmsHistory] = useState<SMSMessage[]>([]);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tags: '',
    sms_consent: false,
    marketing_consent: false,
  });
  const [noteForm, setNoteForm] = useState({
    body: '',
    note_type: 'note' as ContactNote['note_type'],
  });
  const [submittingNote, setSubmittingNote] = useState(false);
  const [showInboundForm, setShowInboundForm] = useState(false);
  const [inboundMessage, setInboundMessage] = useState('');
  const [loggingInbound, setLoggingInbound] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [params.id]);

  const fetchAll = async () => {
    setLoading(true);
    await fetchCurrentUser();
    try {
      const [contactData, smsData, noteData] = await Promise.all([
        fetchContact(),
        fetchSMSHistory(),
        fetchNotes(),
      ]);

      if (contactData) {
        setContact(contactData);
        setFormData({
          name: contactData.name || '',
          phone: contactData.phone,
          email: contactData.email || '',
          tags: (contactData.tags || []).join(', '),
          sms_consent: contactData.sms_consent || false,
          marketing_consent: contactData.marketing_consent || false,
        });
      }

      setSmsHistory(smsData);
      setNotes(noteData);
      recomputeTimeline(smsData, noteData);
    } catch (error) {
      console.error('Error fetching contact data', error);
      showToast('Kunde inte ladda kontaktdata', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    const { data } = await supabase.auth.getSession();
    setCurrentUserId(data.session?.user.id ?? null);
  };

  const fetchContact = async (): Promise<Contact | null> => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', params.id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return data as Contact;
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  };

  const fetchSMSHistory = async (): Promise<SMSMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('sms_messages')
        .select('*')
        .eq('contact_id', params.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as SMSMessage[];
    } catch (error) {
      console.error('Error fetching SMS history:', error);
      throw error;
    }
  };

  const fetchNotes = async (): Promise<ContactNote[]> => {
    try {
      const { data, error } = await supabase
        .from('contact_notes')
        .select('id, body, note_type, created_at, author_id')
        .eq('contact_id', params.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as ContactNote[];
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  };

  const recomputeTimeline = (sms: SMSMessage[], noteItems: ContactNote[]) => {
    const smsEvents: TimelineItem[] = sms.map((message) => ({
      kind: 'sms',
      id: message.id,
      message: message.message,
      status: message.status,
      cost: message.cost === null ? null : Number(message.cost ?? 0),
      direction: message.direction,
      to_phone: message.to_phone,
      from_phone: message.from_phone,
      created_at: message.created_at,
    }));

    const noteEvents: TimelineItem[] = noteItems.map((note) => ({
      kind: 'note',
      id: note.id,
      body: note.body,
      note_type: note.note_type,
      created_at: note.created_at,
      author_id: note.author_id,
    }));

    const combined = [...smsEvents, ...noteEvents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setTimeline(combined);
  };

  const handleCreateNote = async () => {
    if (!contact) {
      showToast('Kontaktdata inte laddad ännu', 'error');
      return;
    }
    if (!noteForm.body.trim()) {
      showToast('Skriv något i anteckningen först', 'warning');
      return;
    }

    try {
      setSubmittingNote(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id ?? null;

      const { error } = await supabase.from('contact_notes').insert({
        organization_id: contact.organization_id,
        contact_id: contact.id,
        author_id: userId,
        note_type: noteForm.note_type,
        body: noteForm.body.trim(),
      } satisfies Database['public']['Tables']['contact_notes']['Insert']);

      if (error) throw error;

      showToast('Anteckning sparad', 'success');
      setNoteForm({ body: '', note_type: 'note' });
      const noteData = await fetchNotes();
      setNotes(noteData);
      recomputeTimeline(smsHistory, noteData);
    } catch (error) {
      console.error('Error creating note:', error);
      showToast('Kunde inte spara anteckning', 'error');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Ta bort anteckningen?')) return;
    try {
      const { error } = await supabase.from('contact_notes').delete().eq('id', noteId);
      if (error) throw error;
      showToast('Anteckning borttagen', 'success');
      const noteData = await fetchNotes();
      setNotes(noteData);
      recomputeTimeline(smsHistory, noteData);
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Kunde inte ta bort anteckning', 'error');
    }
  };

  const handleLogInboundSms = async () => {
    if (!contact) {
      showToast('Kontaktdata inte laddad ännu', 'error');
      return;
    }
    if (!inboundMessage.trim()) {
      showToast('Skriv meddelandet först', 'warning');
      return;
    }

    try {
      setLoggingInbound(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id ?? null;

      const { error } = await supabase.from('sms_messages').insert({
        organization_id: contact.organization_id,
        contact_id: contact.id,
        user_id: userId,
        to_phone: contact.phone,
        from_phone: contact.phone,
        message: inboundMessage.trim(),
        sender_name: contact.name || contact.phone,
        type: 'manual',
        direction: 'inbound',
        status: 'received',
        cost: 0,
      } satisfies Database['public']['Tables']['sms_messages']['Insert']);

      if (error) throw error;

      showToast('Inkommande SMS loggat', 'success');
      setInboundMessage('');
      setShowInboundForm(false);
      const smsData = await fetchSMSHistory();
      setSmsHistory(smsData);
      recomputeTimeline(smsData, notes);
    } catch (error) {
      console.error('Error logging inbound SMS:', error);
      showToast('Kunde inte logga inkommande SMS', 'error');
    } finally {
      setLoggingInbound(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      const { error } = await supabase
        .from('contacts')
        .update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          tags,
          sms_consent: formData.sms_consent,
          marketing_consent: formData.marketing_consent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) throw error;

      showToast('Kontakt uppdaterad! ✅', 'success');
      setEditing(false);
      await fetchAll();
    } catch (error) {
      console.error('Error updating kontakt:', error);
      showToast('Kunde inte uppdatera kontakt', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Är du säker på att du vill ta bort denna kontakt?')) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', params.id);

      if (error) throw error;

      showToast('Kontakt borttagen', 'success');
      router.push('/contacts');
    } catch (error) {
      console.error('Error deleting contact:', error);
      showToast('Kunde inte ta bort kontakt', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Laddar...</div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Kontakt hittades inte
          </h2>
          <Link href="/contacts">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till kontakter
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till kontakter
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contact.name || 'Unnamed Contact'}</h1>
            <p className="text-gray-600 mt-1">
              Skapad {new Date(contact.created_at).toLocaleDateString('sv-SE')}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link href={`/messages/send?contactId=${contact.id}`}>
              <Button className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Skicka SMS
              </Button>
            </Link>
            {!editing && (
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Redigera
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Ta bort
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kontaktinformation</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Namn
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-post (valfritt)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taggar (kommaseparerade)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      placeholder="vip, stamkund, restaurang"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">GDPR-godkännanden</h3>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={formData.sms_consent}
                          onChange={(e) =>
                            setFormData({ ...formData, sms_consent: e.target.checked })
                          }
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">SMS-påminnelser</p>
                          <p className="text-xs text-gray-500">Godkännande för att skicka bokningsbekräftelser och påminnelser</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={formData.marketing_consent}
                          onChange={(e) =>
                            setFormData({ ...formData, marketing_consent: e.target.checked })
                          }
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Marknadsföring</p>
                          <p className="text-xs text-gray-500">Godkännande för att skicka erbjudanden och kampanjer</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleUpdate} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Spara ändringar
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Avbryt
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p className="font-medium text-gray-900">{contact.phone}</p>
                    </div>
                  </div>

                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">E-post</p>
                        <p className="font-medium text-gray-900">{contact.email}</p>
                      </div>
                    </div>
                  )}

                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Taggar</p>
                        <div className="flex flex-wrap gap-2">
                          {contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">GDPR-status</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {contact.sms_consent ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`text-sm ${contact.sms_consent ? 'text-green-700' : 'text-red-700'}`}>
                          SMS-påminnelser: {contact.sms_consent ? 'Godkänd' : 'Ej godkänd'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.marketing_consent ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`text-sm ${contact.marketing_consent ? 'text-green-700' : 'text-red-700'}`}>
                          Marknadsföring: {contact.marketing_consent ? 'Godkänd' : 'Ej godkänd'}
                        </span>
                      </div>
                      {contact.consent_date && (
                        <p className="text-xs text-gray-500 mt-2">
                          Samtycke givet: {new Date(contact.consent_date).toLocaleDateString('sv-SE')}
                          {contact.consent_source && ` (${contact.consent_source})`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Tidslinje & anteckningar</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <textarea
                      value={noteForm.body}
                      onChange={(e) => setNoteForm((prev) => ({ ...prev, body: e.target.value }))}
                      placeholder="Lägg till en anteckning om samtal, uppgift eller någonting att följa upp..."
                      rows={3}
                      className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Typ
                        </label>
                        <select
                          value={noteForm.note_type}
                          onChange={(e) =>
                            setNoteForm((prev) => ({
                              ...prev,
                              note_type: e.target.value as ContactNote['note_type'],
                            }))
                          }
                          className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                        >
                          <option value="note">Anteckning</option>
                          <option value="task">Uppgift</option>
                          <option value="alert">Flagga</option>
                        </select>
                      </div>
                      <Button onClick={handleCreateNote} disabled={submittingNote}>
                        {submittingNote ? 'Sparar...' : 'Lägg till'}
                      </Button>
                    </div>
                  </div>

                  <div className="border border-indigo-100 rounded-lg p-4 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Logga inkommande SMS</h4>
                        <p className="text-xs text-gray-500">
                          Registrera svar du fått via telefon eller annan kanal så att teamet ser hela bilden.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInboundForm((prev) => !prev)}
                      >
                        {showInboundForm ? 'Stäng' : 'Öppna'}
                      </Button>
                    </div>
                    {showInboundForm && (
                      <div className="mt-3 space-y-3">
                        <textarea
                          value={inboundMessage}
                          onChange={(e) => setInboundMessage(e.target.value)}
                          placeholder="Ex: “Hej, jag vill ändra tiden till 15:00 istället.”"
                          rows={3}
                          className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowInboundForm(false);
                              setInboundMessage('');
                            }}
                          >
                            Avbryt
                          </Button>
                          <Button size="sm" onClick={handleLogInboundSms} disabled={loggingInbound}>
                            {loggingInbound ? 'Loggar...' : 'Spara'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {timeline.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Ingen historik ännu. Lägg till en anteckning eller skicka ditt första SMS.</p>
                      </div>
                    ) : (
                      timeline.map((item) => {
                        if (item.kind === 'note') {
                          const badgeClasses =
                            item.note_type === 'task'
                              ? 'bg-amber-100 text-amber-700'
                              : item.note_type === 'alert'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700';
                          return (
                            <div key={`note-${item.id}`} className="border border-gray-200 rounded-lg p-4 bg-white">
                              <div className="flex items-start justify-between gap-3">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClasses}`}>
                                  {item.note_type === 'task'
                                    ? 'Uppgift'
                                    : item.note_type === 'alert'
                                    ? 'Flagga'
                                    : 'Anteckning'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.created_at).toLocaleString('sv-SE')}
                                </span>
                              </div>
                              <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{item.body}</p>
                              {currentUserId && (!item.author_id || currentUserId === item.author_id) && (
                                <div className="mt-3 text-right">
                                  <button
                                    onClick={() => handleDeleteNote(item.id)}
                                    className="text-xs font-semibold text-red-500 hover:text-red-600"
                                  >
                                    Ta bort
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        }

                        const statusColor =
                          item.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : item.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'received'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-700';
                        const statusLabel =
                          item.status === 'delivered'
                            ? 'Levererad'
                            : item.status === 'sent'
                            ? 'Skickad'
                            : item.status === 'failed'
                            ? 'Misslyckad'
                            : item.status === 'received'
                            ? 'Mottagen'
                            : 'Väntande';
                        const directionBadge =
                          item.direction === 'inbound'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-blue-50 text-blue-700';
                        const directionLabel =
                          item.direction === 'inbound' ? 'Inkommande' : 'Utgående';
                        const phoneLabel =
                          item.direction === 'inbound'
                            ? `Från ${displayPhoneNumber(item.from_phone ?? contact.phone)}`
                            : `Till ${displayPhoneNumber(item.to_phone)}`;

                        return (
                          <div key={`sms-${item.id}`} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                                  {statusLabel}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${directionBadge}`}
                                >
                                  {directionLabel}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(item.created_at).toLocaleString('sv-SE')}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{item.message}</p>
                            <p className="mt-2 text-xs text-gray-500">{phoneLabel}</p>
                            {item.cost !== null && (
                              <p className="mt-2 text-xs text-gray-500">
                                Kostnad: {item.cost.toFixed(2)} SEK
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Snabbåtgärder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/messages/send?contactId=${contact.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Skicka SMS
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="w-full justify-start"
                disabled={editing}
              >
                <Edit className="h-4 w-4 mr-2" />
                Redigera kontakt
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Totalt SMS skickat</p>
                <p className="text-2xl font-bold text-gray-900">{contact.total_sms_sent || smsHistory.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Levererade</p>
                <p className="text-2xl font-bold text-green-600">
                  {smsHistory.filter((s) => s.status === 'delivered').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Totalt bokningar</p>
                <p className="text-2xl font-bold text-blue-600">
                  {contact.total_bookings || 0}
                </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total kostnad</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {smsHistory
                      .reduce((sum, s) => {
                        const cost =
                          typeof s.cost === 'number' ? s.cost : Number(s.cost ?? 0);
                        return sum + cost;
                      }, 0)
                      .toFixed(2)}{' '}
                    SEK
                  </p>
                </div>
              {contact.last_visit_date && (
                <div>
                  <p className="text-sm text-gray-500">Senaste besök</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(contact.last_visit_date).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

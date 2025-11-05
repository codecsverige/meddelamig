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

interface Contact {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  tags: string[] | null;
  notes: string | null;
  gdpr_consent: boolean;
  created_at: string;
}

interface SMSMessage {
  id: string;
  message: string;
  status: string;
  created_at: string;
  cost: string;
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [smsHistory, setSmsHistory] = useState<SMSMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    tags: '',
    notes: '',
    gdpr_consent: false,
  });

  useEffect(() => {
    fetchContact();
    fetchSMSHistory();
  }, [params.id]);

  const fetchContact = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', params.id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      setContact(data);
      setFormData({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || '',
        tags: (data.tags || []).join(', '),
        notes: data.notes || '',
        gdpr_consent: data.gdpr_consent,
      });
    } catch (error) {
      console.error('Error fetching contact:', error);
      showToast('Kunde inte ladda kontakt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSMSHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_messages')
        .select('*')
        .eq('contact_id', params.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSmsHistory(data || []);
    } catch (error) {
      console.error('Error fetching SMS history:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      const { error } = await supabase
        .from('contacts')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email || null,
          tags,
          notes: formData.notes || null,
          gdpr_consent: formData.gdpr_consent,
        })
        .eq('id', params.id);

      if (error) throw error;

      showToast('Kontakt uppdaterad! ✅', 'success');
      setEditing(false);
      fetchContact();
    } catch (error) {
      console.error('Error updating contact:', error);
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
            <h1 className="text-3xl font-bold text-gray-900">{contact.full_name}</h1>
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
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anteckningar
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="gdpr"
                      checked={formData.gdpr_consent}
                      onChange={(e) =>
                        setFormData({ ...formData, gdpr_consent: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="gdpr" className="text-sm text-gray-700">
                      GDPR-samtycke beviljat
                    </label>
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

                  {contact.notes && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Anteckningar</p>
                        <p className="text-gray-700">{contact.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    {contact.gdpr_consent ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">GDPR-samtycke beviljat</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Inget GDPR-samtycke</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS History */}
          <Card>
            <CardHeader>
              <CardTitle>SMS-historik ({smsHistory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {smsHistory.length > 0 ? (
                <div className="space-y-4">
                  {smsHistory.map((sms) => (
                    <div
                      key={sms.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            sms.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : sms.status === 'sent'
                              ? 'bg-blue-100 text-blue-800'
                              : sms.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {sms.status === 'delivered'
                            ? 'Levererad'
                            : sms.status === 'sent'
                            ? 'Skickad'
                            : sms.status === 'failed'
                            ? 'Misslyckades'
                            : 'Väntar'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(sms.created_at).toLocaleString('sv-SE')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{sms.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Kostnad: {parseFloat(sms.cost).toFixed(2)} SEK
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Inga SMS skickade ännu</p>
                  <Link href={`/messages/send?contactId=${contact.id}`} className="mt-3 inline-block">
                    <Button size="sm">Skicka första SMS</Button>
                  </Link>
                </div>
              )}
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
                <p className="text-2xl font-bold text-gray-900">{smsHistory.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Levererade</p>
                <p className="text-2xl font-bold text-green-600">
                  {smsHistory.filter((s) => s.status === 'delivered').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total kostnad</p>
                <p className="text-2xl font-bold text-gray-900">
                  {smsHistory
                    .reduce((sum, s) => sum + parseFloat(s.cost), 0)
                    .toFixed(2)}{' '}
                  SEK
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

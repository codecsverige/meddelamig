'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit2, Trash2, Send, Phone, Mail, Tag, Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { displayPhoneNumber } from '@/lib/utils/phone';
import { useToast } from '@/components/ui/toast';

export default function ContactDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [contact, setContact] = useState<any>(null);
  const [smsHistory, setSmsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tags: '',
    smsConsent: true,
    marketingConsent: false,
  });

  useEffect(() => {
    loadContact();
  }, []);

  const loadContact = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) return;

      // Load contact
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', params.id)
        .eq('organization_id', user.organization_id)
        .is('deleted_at', null)
        .single();

      if (contactData) {
        setContact(contactData);
        setFormData({
          name: contactData.name || '',
          phone: contactData.phone || '',
          email: contactData.email || '',
          tags: contactData.tags?.join(', ') || '',
          smsConsent: contactData.sms_consent,
          marketingConsent: contactData.marketing_consent,
        });

        // Load SMS history
        const { data: smsData } = await supabase
          .from('sms_messages')
          .select('*')
          .eq('contact_id', params.id)
          .order('created_at', { ascending: false })
          .limit(20);

        setSmsHistory(smsData || []);
      }
    } catch (error) {
      console.error('Failed to load contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          name: formData.name,
          email: formData.email || null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          sms_consent: formData.smsConsent,
          marketing_consent: formData.marketingConsent,
        })
        .eq('id', params.id);

      if (error) throw error;

      setEditMode(false);
      showToast('Kontakt uppdaterad! ✅', 'success');
      loadContact();
    } catch (error: any) {
      showToast(error.message || 'Ett fel uppstod', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Är du säker på att du vill radera denna kontakt?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', params.id);

      if (error) throw error;

      showToast('Kontakt raderad! 🗑️', 'success');
      setTimeout(() => {
        router.push('/contacts');
      }, 1000);
    } catch (error: any) {
      showToast(error.message || 'Ett fel uppstod', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-500">Laddar...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kontakt hittades inte</h2>
          <Link href="/contacts">
            <Button>Tillbaka till kontakter</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till kontakter
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
              {(contact.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {contact.name || 'Unnamed Contact'}
              </h1>
              <p className="text-gray-600 mt-1">
                {displayPhoneNumber(contact.phone)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/messages/send?contact=${contact.id}`}>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Skicka SMS
              </Button>
            </Link>
            {!editMode && (
              <>
                <Button variant="outline" onClick={() => setEditMode(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Kontaktinformation</CardTitle>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Namn
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-post
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taggar
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="vip, regular, ny"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.smsConsent}
                        onChange={(e) => setFormData({ ...formData, smsConsent: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">SMS-godkännande</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.marketingConsent}
                        onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Marknadsföring</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">
                      Avbryt
                    </Button>
                    <Button onClick={handleUpdate} disabled={loading} className="flex-1">
                      {loading ? 'Sparar...' : 'Spara ändringar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Telefon</p>
                      <p className="font-medium text-gray-900">{displayPhoneNumber(contact.phone)}</p>
                    </div>
                  </div>

                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">E-post</p>
                        <p className="font-medium text-gray-900">{contact.email}</p>
                      </div>
                    </div>
                  )}

                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Taggar</p>
                        <div className="flex flex-wrap gap-2">
                          {contact.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Skapad</p>
                      <p className="font-medium text-gray-900">
                        {new Date(contact.created_at).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS History */}
          <Card>
            <CardHeader>
              <CardTitle>SMS-historik</CardTitle>
              <CardDescription>
                {smsHistory.length} meddelanden skickade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {smsHistory.length > 0 ? (
                <div className="space-y-3">
                  {smsHistory.map((sms) => (
                    <div
                      key={sms.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            sms.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : sms.status === 'sent'
                              ? 'bg-blue-100 text-blue-800'
                              : sms.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {sms.status === 'delivered' ? 'Levererad' :
                           sms.status === 'sent' ? 'Skickad' :
                           sms.status === 'failed' ? 'Misslyckad' : 'Väntande'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(sms.created_at).toLocaleString('sv-SE')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{sms.message}</p>
                      {sms.cost && (
                        <p className="text-xs text-gray-500 mt-2">
                          Kostnad: {parseFloat(sms.cost).toFixed(2)} SEK
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Inga SMS skickade till denna kontakt ännu</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Statistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">SMS skickade</p>
                <p className="text-2xl font-bold text-gray-900">{contact.total_sms_sent || 0}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Bokningar</p>
                <p className="text-2xl font-bold text-gray-900">{contact.total_bookings || 0}</p>
              </div>

              {contact.last_visit_date && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Senaste besök</p>
                  <p className="text-lg font-medium text-gray-900">
                    {new Date(contact.last_visit_date).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GDPR Card */}
          <Card>
            <CardHeader>
              <CardTitle>GDPR-godkännanden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${contact.sms_consent ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-700">
                  SMS-påminnelser: {contact.sms_consent ? 'Ja' : 'Nej'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${contact.marketing_consent ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-700">
                  Marknadsföring: {contact.marketing_consent ? 'Ja' : 'Nej'}
                </span>
              </div>

              {contact.consent_date && (
                <p className="text-xs text-gray-500 mt-2">
                  Godkänd: {new Date(contact.consent_date).toLocaleDateString('sv-SE')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

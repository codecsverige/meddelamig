'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { calculateSMSSegments, calculateSMSCost } from '@/lib/utils/sms';

function SendSMSForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [contacts, setContacts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    contactId: searchParams.get('contact') || '',
    templateId: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate SMS segments and cost
  const segments = calculateSMSSegments(formData.message);
  const cost = calculateSMSCost(formData.message);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) return;

      // Load contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('sms_consent', true)
        .is('deleted_at', null)
        .order('name');

      setContacts(contactsData || []);

      // Load templates (user's + global)
      const { data: templatesData } = await supabase
        .from('sms_templates')
        .select('*')
        .or(`organization_id.eq.${user.organization_id},is_global.eq.true`)
        .order('name');

      setTemplates(templatesData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        message: template.message,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error('Not authenticated');

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) throw new Error('No organization');

      // Get contact
      const contact = contacts.find(c => c.id === formData.contactId);
      if (!contact) throw new Error('Contact not found');

      // Send SMS via API route
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: formData.contactId,
          message: formData.message,
          templateId: formData.templateId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send SMS');
      }

      // Success
      router.push('/messages?success=sms_sent');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/messages"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Tillbaka till meddelanden
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Skicka SMS</CardTitle>
          <CardDescription>
            Skicka ett SMS-meddelande till en kontakt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Selection */}
            <div>
              <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-2">
                Mottagare *
              </label>
              <select
                id="contactId"
                value={formData.contactId}
                onChange={(e) => setFormData(prev => ({ ...prev, contactId: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Välj kontakt...</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} ({contact.phone})
                  </option>
                ))}
              </select>
              {contacts.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Inga kontakter med SMS-godkännande hittades.{' '}
                  <Link href="/contacts/new" className="underline">
                    Lägg till kontakt
                  </Link>
                </p>
              )}
            </div>

            {/* Template Selection */}
            <div>
              <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mb-2">
                Mall (valfritt)
              </label>
              <select
                id="templateId"
                value={formData.templateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Ingen mall - skriv eget meddelande</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.is_global && '(Färdig mall)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Meddelande *
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                required
                rows={6}
                maxLength={1600}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Skriv ditt meddelande här..."
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {formData.message.length} / 1600 tecken
                </p>
                <p className="text-xs text-gray-500">
                  {segments} SMS-del{segments !== 1 ? 'ar' : ''} • ~{cost.toFixed(2)} SEK
                </p>
              </div>
            </div>

            {/* Preview */}
            {formData.message && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Förhandsvisning</h4>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {formData.message}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.contactId || !formData.message} 
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Skickar...' : 'Skicka SMS'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SendSMSPage() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center"><p className="text-gray-500">Laddar...</p></div>}>
      <SendSMSForm />
    </Suspense>
  );
}

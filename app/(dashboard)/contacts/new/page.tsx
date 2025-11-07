'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatPhoneNumber } from '@/lib/utils/phone';
import { useToast } from '@/components/ui/toast';

export default function NewContactPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthday: '',
    notes: '',
    tags: '',
    smsConsent: true,
    marketingConsent: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user's organization
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) {
        throw new Error('No organization found');
      }

      // Format phone number
      const formattedPhone = formatPhoneNumber(formData.phone);
      if (!formattedPhone) {
        throw new Error('Ogiltigt telefonnummer. Använd svenskt format (070...)');
      }

      // Create contact
      const { error: insertError } = await supabase.from('contacts').insert({
        organization_id: user.organization_id,
        name: formData.name,
        phone: formattedPhone,
        email: formData.email || null,
        birthday: formData.birthday || null,
        notes: formData.notes || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        sms_consent: formData.smsConsent,
        marketing_consent: formData.marketingConsent,
        consent_date: new Date().toISOString(),
        consent_source: 'manual',
      });

      if (insertError) throw insertError;

      // Success
      showToast('Kontakt skapad! ✅', 'success');
      setTimeout(() => {
        router.push('/contacts');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      const errorMsg = err.message || 'Ett fel uppstod';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Tillbaka till kontakter
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Lägg till ny kontakt</CardTitle>
          <CardDescription>
            Skapa en ny kontakt i din databas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Namn *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Anna Andersson"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefonnummer *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="070-123 45 67"
              />
              <p className="text-xs text-gray-500 mt-1">
                Svenskt mobilnummer (börjar med 07)
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-postadress (valfritt)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="anna@exempel.se"
              />
            </div>

            <div>
              <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-2">
                🎂 Födelsedag (valfritt)
              </label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                value={formData.birthday}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Vi skickar automatisk gratishälsning med specialerbjudande
              </p>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Anteckningar (valfritt)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Allergier: nötter. Föredrar fönsterbord."
              />
              <p className="text-xs text-gray-500 mt-1">
                Särskilda önskemål, allergier, preferenser
              </p>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Taggar (valfritt)
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="vip, regular, ny"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separera med komma (vip, regular, ny)
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                GDPR-godkännanden
              </h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="smsConsent"
                    checked={formData.smsConsent}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      SMS-påminnelser (Obligatorisk)
                    </p>
                    <p className="text-xs text-gray-500">
                      Godkännande för att skicka bokningsbekräftelser och påminnelser
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="marketingConsent"
                    checked={formData.marketingConsent}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Marknadsföring (Valfritt)
                    </p>
                    <p className="text-xs text-gray-500">
                      Godkännande för att skicka erbjudanden och kampanjer
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Sparar...' : 'Spara kontakt'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

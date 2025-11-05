'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/utils/phone';
import { useToast } from '@/components/ui/toast';

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}

export default function NewContactPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tags: '',
    notes: '',
    smsConsent: true,
    marketingConsent: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Namn är obligatoriskt';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Namnet måste vara minst 2 tecken';
    }

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefonnummer är obligatoriskt';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Ogiltigt telefonnummer. Använd svenskt format (070-123 45 67)';
    }

    // Validate email (optional but must be valid if provided)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Ogiltig e-postadress';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    validateForm();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      name: true,
      phone: true,
      email: true,
    });

    if (!validateForm()) {
      showToast('Vänligen åtgärda felen i formuläret', 'error');
      return;
    }

    setLoading(true);

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
        throw new Error('Ogiltigt telefonnummer');
      }

      // Check for duplicate
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('phone', formattedPhone)
        .is('deleted_at', null)
        .single();

      if (existingContact) {
        setErrors({ phone: 'En kontakt med detta telefonnummer finns redan' });
        showToast('Kontakten finns redan', 'error');
        setLoading(false);
        return;
      }

      // Create contact
      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert({
          organization_id: user.organization_id,
          name: formData.name.trim(),
          phone: formattedPhone,
          email: formData.email.trim() || null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
          notes: formData.notes.trim() || null,
          sms_consent: formData.smsConsent,
          marketing_consent: formData.marketingConsent,
          consent_date: new Date().toISOString(),
          consent_source: 'manual',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Success
      showToast('Kontakt skapad! ✅', 'success');
      
      // Redirect to the new contact's detail page
      setTimeout(() => {
        router.push(`/contacts/${newContact.id}`);
      }, 500);
    } catch (err: any) {
      console.error('Error creating contact:', err);
      const errorMsg = err.message || 'Ett fel uppstod';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Tillbaka till kontakter
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lägg till ny kontakt</CardTitle>
          <CardDescription>
            Skapa en ny kontakt i din databas. Fält markerade med * är obligatoriska.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Namn <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  touched.name && errors.name
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Anna Andersson"
              />
              {touched.name && errors.name && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefonnummer <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleBlur('phone')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  touched.phone && errors.phone
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="070-123 45 67"
              />
              {touched.phone && errors.phone ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.phone}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-2">
                  Svenskt mobilnummer (börjar med 07)
                </p>
              )}
            </div>

            {/* Email */}
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
                onBlur={() => handleBlur('email')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  touched.email && errors.email
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="anna@exempel.se"
              />
              {touched.email && errors.email && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Tags */}
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
              <p className="text-xs text-gray-500 mt-2">
                Separera med komma för att skapa flera taggar (t.ex. vip, stamkund, restaurang)
              </p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Anteckningar (valfritt)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Lägg till anteckningar om kontakten..."
              />
            </div>

            {/* Consent Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                GDPR-godkännanden
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Enligt GDPR måste du ha godkännande från kontakten innan du skickar meddelanden.
              </p>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="smsConsent"
                    checked={formData.smsConsent}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      SMS-påminnelser (Obligatorisk) <span className="text-red-500">*</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Godkännande för att skicka bokningsbekräftelser, påminnelser och servicerelaterade meddelanden
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="marketingConsent"
                    checked={formData.marketingConsent}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Marknadsföring (Valfritt)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Godkännande för att skicka erbjudanden, kampanjer och marknadsföringsmaterial
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
                disabled={loading}
              >
                Avbryt
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.smsConsent} 
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Sparar...' : 'Spara kontakt'}
              </Button>
            </div>

            {!formData.smsConsent && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">SMS-godkännande krävs</p>
                    <p className="mt-1">
                      Du måste ha SMS-godkännande för att kunna skapa kontakten och skicka meddelanden.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">Tips för att lägga till kontakter</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Dubbelkolla att telefonnumret är korrekt - det går inte att ändra senare utan att skapa en ny kontakt</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Använd taggar för att organisera dina kontakter (t.ex. "vip", "stamkund", "restaurang")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Du måste ha dokumenterat godkännande enligt GDPR innan du skickar meddelanden</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>För att lägga till många kontakter samtidigt, använd importfunktionen</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

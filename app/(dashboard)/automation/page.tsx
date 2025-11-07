'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, Gift, Send, Loader2,
  Sparkles, Zap, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import {
  defaultAutomationSettings,
  normalizeAutomationSettings,
  type AutomationSettings,
} from '@/lib/automation/presets';

type Contact = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  marketing_consent: boolean;
};

type TemplateCategory = 'reminder' | 'confirmation' | 'marketing' | 'thank_you';

type TemplateOption = {
  id: string;
  name: string;
  category: TemplateCategory;
  message: string;
  is_global: boolean;
};

type TemplateRow = {
  id: string;
  name: string;
  category: TemplateCategory;
  message: string;
  is_global: boolean | null;
  organization_id: string | null;
};

export default function AutomationPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Contact[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    birthdayEnabled: true,
    daysBeforeBirthday: 0, // 0 = same day, 1 = day before
    autoSendBirthdays: false,
  });
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationSettings, setOrganizationSettings] = useState<Record<string, unknown> | null>(null);
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>(defaultAutomationSettings);
  const [automationDirty, setAutomationDirty] = useState(false);
  const [savingAutomations, setSavingAutomations] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        throw userError;
      }

      if (!user?.organization_id) {
        router.push('/onboarding');
        return;
      }

      setOrganizationId(user.organization_id);

      const [contactsRes, templatesRes, organizationRes] = await Promise.all([
        supabase
          .from('contacts')
          .select('*')
          .eq('organization_id', user.organization_id)
          .eq('marketing_consent', true)
          .not('birthday', 'is', null)
          .is('deleted_at', null),
        supabase
          .from('sms_templates')
          .select('id, name, category, message, is_global, organization_id')
          .or(`organization_id.eq.${user.organization_id},is_global.eq.true`)
          .order('is_global', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('organizations')
          .select('settings')
          .eq('id', user.organization_id)
          .single(),
      ]);

      if (contactsRes.error) {
        throw contactsRes.error;
      }

      if (templatesRes.error) {
        throw templatesRes.error;
      }

      if (organizationRes.error) {
        throw organizationRes.error;
      }

      const today = new Date();
      const next7Days = new Date();
      next7Days.setDate(today.getDate() + 7);

      const contacts = contactsRes.data ?? [];
      const upcoming = contacts.filter((c: any) => {
        if (!c.birthday) return false;

        const birthday = new Date(c.birthday);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthday.getMonth(),
          birthday.getDate(),
        );

        return thisYearBirthday >= today && thisYearBirthday <= next7Days;
      });

      setUpcomingBirthdays(upcoming);

      const templateRows = (templatesRes.data ?? []) as TemplateRow[];

      setTemplateOptions(
        templateRows.map((template) => ({
          id: template.id,
          name: template.name,
          category: template.category as TemplateCategory,
          message: template.message,
          is_global: Boolean(template.is_global),
        })),
      );

      const settingsData = (organizationRes.data?.settings as Record<string, unknown>) ?? {};
      setOrganizationSettings(settingsData);
      setAutomationSettings(
        normalizeAutomationSettings(
          (settingsData as Record<string, unknown>)?.automations ?? defaultAutomationSettings,
        ),
      );
      setAutomationDirty(false);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const findTemplateById = (templateId: string | null) => {
    if (!templateId) return null;
    return templateOptions.find((option) => option.id === templateId) ?? null;
  };

  const toggleAutomation = (key: keyof AutomationSettings) => {
    setAutomationSettings((prev) => {
      const next = {
        ...prev,
        [key]: {
          ...prev[key],
          enabled: !prev[key].enabled,
        },
      };
      if (next[key].enabled !== prev[key].enabled) {
        setAutomationDirty(true);
      }
      return next;
    });
  };

  const setAutomationTemplate = (
    key: keyof AutomationSettings,
    templateId: string | null,
    templateName: string | null,
  ) => {
    setAutomationSettings((prev) => {
      const next = {
        ...prev,
        [key]: {
          ...prev[key],
          templateId,
          templateName,
        },
      };
      if (next[key].templateId !== prev[key].templateId) {
        setAutomationDirty(true);
      }
      return next;
    });
  };

  const setAutomationTiming = (key: keyof AutomationSettings, value: number) => {
    const sanitizedValue = Number.isNaN(value) ? 0 : Math.max(0, value);
    setAutomationSettings((prev) => {
      const next = { ...prev };
      if (key === 'bookingConfirmation') {
        if (next.bookingConfirmation.sendDelayMinutes !== sanitizedValue) {
          next.bookingConfirmation = {
            ...next.bookingConfirmation,
            sendDelayMinutes: sanitizedValue,
          };
          setAutomationDirty(true);
        }
      } else if (key === 'bookingReminder') {
        if (next.bookingReminder.hoursBefore !== sanitizedValue) {
          next.bookingReminder = {
            ...next.bookingReminder,
            hoursBefore: sanitizedValue,
          };
          setAutomationDirty(true);
        }
      } else if (key === 'visitFollowup') {
        if (next.visitFollowup.delayHours !== sanitizedValue) {
          next.visitFollowup = {
            ...next.visitFollowup,
            delayHours: sanitizedValue,
          };
          setAutomationDirty(true);
        }
      }
      return next;
    });
  };

  const saveAutomations = async () => {
    if (!organizationId) {
      showToast('Ingen organisation vald', 'error');
      return;
    }

    try {
      setSavingAutomations(true);
      const nextSettings = {
        ...(organizationSettings ?? {}),
        automations: automationSettings,
      };

      const { error } = await supabase
        .from('organizations')
        .update({ settings: nextSettings } as any)
        .eq('id', organizationId);

      if (error) {
        throw error;
      }

      setOrganizationSettings(nextSettings);
      setAutomationDirty(false);
      showToast('Automatiseringar sparade!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Kunde inte spara automationsinställningar', 'error');
    } finally {
      setSavingAutomations(false);
    }
  };

  const sendBirthdaySMS = async (contact: Contact) => {
    if (!confirm(`Skicka födelsedagshälsning till ${contact.name}?`)) {
      return;
    }

    setSending(contact.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Inte inloggad');

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) throw new Error('Ingen organisation');

      const { data: org } = await supabase
        .from('organizations')
        .select('name, sms_sender_name, sms_credits')
        .eq('id', user.organization_id)
        .single();

      if (!org) throw new Error('Organisation hittades inte');
      if (org.sms_credits < 1) throw new Error('Inga SMS-krediter kvar!');

      // Send SMS
      const message = `🎂 Grattis på födelsedagen ${contact.name}! Fira med oss på ${org.name} - vi bjuder på desserten! Boka idag!`;

      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.phone,
          message,
          from: org.sms_sender_name || 'MEDDELA',
        }),
      });

      if (!response.ok) throw new Error('SMS-sändning misslyckades');

      showToast(`🎉 Födelsedagshälsning skickad till ${contact.name}!`, 'success');
      
      // Remove from list
      setUpcomingBirthdays(prev => prev.filter(c => c.id !== contact.id));
    } catch (error: any) {
      showToast(error.message || 'Något gick fel', 'error');
    } finally {
      setSending(null);
    }
  };

  const sendAllBirthdaySMS = async () => {
    if (upcomingBirthdays.length === 0) {
      showToast('Inga födelsedagar att skicka till', 'error');
      return;
    }

    if (!confirm(`Skicka födelsedagshälsningar till ${upcomingBirthdays.length} personer?`)) {
      return;
    }

    setSending('all');
    let successCount = 0;

    for (const contact of upcomingBirthdays) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) continue;

        const { data: user } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', session.user.id)
          .single();

        if (!user?.organization_id) continue;

        const { data: org } = await supabase
          .from('organizations')
          .select('name, sms_sender_name')
          .eq('id', user.organization_id)
          .single();

        if (!org) continue;

        const message = `🎂 Grattis på födelsedagen ${contact.name}! Fira med oss på ${org.name} - vi bjuder på desserten! Boka idag!`;

        const response = await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contact.phone,
            message,
            from: org.sms_sender_name || 'MEDDELA',
          }),
        });

        if (response.ok) {
          successCount++;
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to send to ${contact.name}:`, error);
      }
    }

    setSending(null);
    showToast(`🎉 ${successCount} födelsedagshälsningar skickade!`, 'success');
    loadData(); // Reload
  };

  const getDaysUntilBirthday = (birthday: string) => {
    const today = new Date();
    const bday = new Date(birthday);
    const thisYearBirthday = new Date(
      today.getFullYear(),
      bday.getMonth(),
      bday.getDate()
    );

    const diff = Math.ceil(
      (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff === 0) return 'Idag!';
    if (diff === 1) return 'Imorgon';
    return `Om ${diff} dagar`;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="inline-block animate-spin h-12 w-12 text-blue-600 mb-4" />
          <p className="text-gray-500">Laddar automatiseringar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚡ Automatiseringar</h1>
        <p className="text-gray-600">
          Låt MEDDELA jobba åt dig - automatiska kampanjer som sparar tid och ökar intäkter
        </p>
      </div>

      {/* Birthday Automation Card */}
      <Card className="mb-8 border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-pink-600" />
            Automatiska födelsedagshälsningar
          </CardTitle>
          <CardDescription>
            Skicka automatiskt födelsedagshälsningar med specialerbjudande - öka lojalitet och intäkter!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-white rounded-lg border-2 border-pink-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{upcomingBirthdays.length}</p>
                  <p className="text-xs text-gray-600">Nästa 7 dagar</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border-2 border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Status</p>
                  <p className="text-xs text-green-600">
                    {settings.autoSendBirthdays ? '✅ Automatisk' : '⚠️ Manuell'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">ROI</p>
                  <p className="text-xs text-blue-600">+25% återbesök</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Birthdays List */}
          {upcomingBirthdays.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Kommande födelsedagar</h4>
                <Button
                  onClick={sendAllBirthdaySMS}
                  disabled={sending === 'all'}
                  size="sm"
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {sending === 'all' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Skickar...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Skicka till alla ({upcomingBirthdays.length})
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                {upcomingBirthdays.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-pink-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Gift className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4">
                        <p className="text-sm font-semibold text-pink-600">
                          {contact.birthday && getDaysUntilBirthday(contact.birthday)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {contact.birthday && new Date(contact.birthday).toLocaleDateString('sv-SE', { 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <Button
                        onClick={() => sendBirthdaySMS(contact)}
                        disabled={sending === contact.id}
                        size="sm"
                        variant="outline"
                        className="border-pink-600 text-pink-600 hover:bg-pink-50"
                      >
                        {sending === contact.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Skicka
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Inga födelsedagar nästa 7 dagar</p>
              <p className="text-sm text-gray-500 mt-1">
                Lägg till födelsedagar för dina kontakter för att aktivera denna funktion
              </p>
              <Link href="/contacts">
                <Button className="mt-4" size="sm">
                  Gå till kontakter
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Automatiserade bokningsflöden
          </CardTitle>
          <CardDescription>
            Aktivera tre steg som ger gästen bekräftelse, påminnelse och omtänksam uppföljning – helt utan manuellt arbete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border border-blue-100 bg-white rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Bekräftelse direkt</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Skicka ett tryggt bekräftelse-SMS så snart bokningen registreras.
                  </p>
                </div>
                <button
                  onClick={() => toggleAutomation('bookingConfirmation')}
                  className={`px-4 py-1 text-xs font-semibold rounded-full border transition ${
                    automationSettings.bookingConfirmation.enabled
                      ? 'bg-green-100 border-green-200 text-green-700'
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                >
                  {automationSettings.bookingConfirmation.enabled ? 'Aktiv' : 'Av'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    SMS-mall
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                    value={automationSettings.bookingConfirmation.templateId ?? ''}
                    onChange={(event) => {
                      const value = event.target.value || null;
                      const selected = templateOptions.find((option) => option.id === value) ?? null;
                      setAutomationTemplate(
                        'bookingConfirmation',
                        selected?.id ?? null,
                        selected?.name ?? null,
                      );
                    }}
                    disabled={!automationSettings.bookingConfirmation.enabled || templateOptions.length === 0}
                  >
                    <option value="">Välj mall...</option>
                    {templateOptions
                      .filter((option) => option.category === 'confirmation')
                      .map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} {option.is_global ? '(Global)' : ''}
                        </option>
                      ))}
                  </select>
                  {automationSettings.bookingConfirmation.enabled &&
                    templateOptions.filter((option) => option.category === 'confirmation').length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Inga bekräftelsemallar ännu.{' '}
                        <Link href="/templates" className="text-blue-600 hover:underline">
                          Skapa en i SMS-mallar.
                        </Link>
                      </p>
                    )}
                  {automationSettings.bookingConfirmation.templateId && (
                    <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap line-clamp-4">
                      {findTemplateById(automationSettings.bookingConfirmation.templateId)?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    Fördröjning
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={automationSettings.bookingConfirmation.sendDelayMinutes}
                      onChange={(event) => setAutomationTiming('bookingConfirmation', Number(event.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                      disabled={!automationSettings.bookingConfirmation.enabled}
                    />
                    <span className="text-sm text-gray-600">minuter</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-purple-100 bg-white rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Påminnelse före besöket</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Skicka påminnelse automatiskt för att minska no-shows.
                  </p>
                </div>
                <button
                  onClick={() => toggleAutomation('bookingReminder')}
                  className={`px-4 py-1 text-xs font-semibold rounded-full border transition ${
                    automationSettings.bookingReminder.enabled
                      ? 'bg-green-100 border-green-200 text-green-700'
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                >
                  {automationSettings.bookingReminder.enabled ? 'Aktiv' : 'Av'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    SMS-mall
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:bg-gray-100 disabled:text-gray-400"
                    value={automationSettings.bookingReminder.templateId ?? ''}
                    onChange={(event) => {
                      const value = event.target.value || null;
                      const selected = templateOptions.find((option) => option.id === value) ?? null;
                      setAutomationTemplate('bookingReminder', selected?.id ?? null, selected?.name ?? null);
                    }}
                    disabled={!automationSettings.bookingReminder.enabled || templateOptions.length === 0}
                  >
                    <option value="">Välj mall...</option>
                    {templateOptions
                      .filter((option) => option.category === 'reminder')
                      .map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} {option.is_global ? '(Global)' : ''}
                        </option>
                      ))}
                  </select>
                  {automationSettings.bookingReminder.enabled &&
                    templateOptions.filter((option) => option.category === 'reminder').length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Inga påminnelsemallar ännu.{' '}
                        <Link href="/templates" className="text-blue-600 hover:underline">
                          Skapa en i SMS-mallar.
                        </Link>
                      </p>
                    )}
                  {automationSettings.bookingReminder.templateId && (
                    <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap line-clamp-4">
                      {findTemplateById(automationSettings.bookingReminder.templateId)?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    Tid före besök
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={automationSettings.bookingReminder.hoursBefore}
                      onChange={(event) => setAutomationTiming('bookingReminder', Number(event.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:bg-gray-100 disabled:text-gray-400"
                      disabled={!automationSettings.bookingReminder.enabled}
                    />
                    <span className="text-sm text-gray-600">timmar</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-green-100 bg-white rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Uppföljning efter besöket</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tacka, samla feedback och föreslå nästa steg – automatiskt.
                  </p>
                </div>
                <button
                  onClick={() => toggleAutomation('visitFollowup')}
                  className={`px-4 py-1 text-xs font-semibold rounded-full border transition ${
                    automationSettings.visitFollowup.enabled
                      ? 'bg-green-100 border-green-200 text-green-700'
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}
                >
                  {automationSettings.visitFollowup.enabled ? 'Aktiv' : 'Av'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    SMS-mall
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 disabled:bg-gray-100 disabled:text-gray-400"
                    value={automationSettings.visitFollowup.templateId ?? ''}
                    onChange={(event) => {
                      const value = event.target.value || null;
                      const selected = templateOptions.find((option) => option.id === value) ?? null;
                      setAutomationTemplate('visitFollowup', selected?.id ?? null, selected?.name ?? null);
                    }}
                    disabled={!automationSettings.visitFollowup.enabled || templateOptions.length === 0}
                  >
                    <option value="">Välj mall...</option>
                    {templateOptions
                      .filter((option) => option.category === 'thank_you' || option.category === 'marketing')
                      .map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} {option.is_global ? '(Global)' : ''}
                        </option>
                      ))}
                  </select>
                  {automationSettings.visitFollowup.enabled &&
                    templateOptions.filter((option) => option.category === 'thank_you' || option.category === 'marketing').length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Inga uppföljningsmallar ännu.{' '}
                        <Link href="/templates" className="text-blue-600 hover:underline">
                          Skapa en i SMS-mallar.
                        </Link>
                      </p>
                    )}
                  {automationSettings.visitFollowup.templateId && (
                    <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap line-clamp-4">
                      {findTemplateById(automationSettings.visitFollowup.templateId)?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    Skicka efter
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={automationSettings.visitFollowup.delayHours}
                      onChange={(event) => setAutomationTiming('visitFollowup', Number(event.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 disabled:bg-gray-100 disabled:text-gray-400"
                      disabled={!automationSettings.visitFollowup.enabled}
                    />
                    <span className="text-sm text-gray-600">timmar efter</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-gray-500">
              Tips: Använd playbooken för din bransch på sidan{' '}
              <Link href="/templates" className="text-blue-600 hover:underline">
                SMS-mallar
              </Link>{' '}
              för att få förifyllda mallar.
            </p>
            <Button
              onClick={saveAutomations}
              disabled={!automationDirty || savingAutomations}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {savingAutomations ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                <>
                  Spara automationer
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Why Automation Matters */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg flex-shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Varför automatisering?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-blue-600 mb-1">⏰ Spara tid</p>
                  <p className="text-gray-600">2-3 timmar per dag automatiseras</p>
                </div>
                <div>
                  <p className="font-medium text-green-600 mb-1">💰 Öka intäkter</p>
                  <p className="text-gray-600">25-35% fler återbesök</p>
                </div>
                <div>
                  <p className="font-medium text-purple-600 mb-1">❤️ Bättre upplevelse</p>
                  <p className="text-gray-600">Kunder känner sig omhändertagna</p>
                </div>
                <div>
                  <p className="font-medium text-orange-600 mb-1">📈 Aldrig glömma</p>
                  <p className="text-gray-600">Inget faller mellan stolarna</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

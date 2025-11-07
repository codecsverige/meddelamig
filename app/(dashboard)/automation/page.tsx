"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  Calendar,
  Gift,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import {
  defaultAutomationSettings,
  normalizeAutomationSettings,
  type AutomationSettings,
} from "@/lib/automation/presets";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  marketing_consent: boolean;
  created_at?: string;
  updated_at?: string | null;
};

type TemplateCategory = "reminder" | "confirmation" | "marketing" | "thank_you";

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

type ContactActivity = {
  id: string;
  name: string;
  phone: string;
  birthday?: string | null;
  marketing_consent: boolean;
  lastInteraction: string | null;
};

type SmsActivity = {
  contact_id: string | null;
  created_at: string;
  direction: "inbound" | "outbound";
};

export default function AutomationPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Contact[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationSettings, setOrganizationSettings] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
  const [automationSettings, setAutomationSettings] =
    useState<AutomationSettings>(defaultAutomationSettings);
  const [automationDirty, setAutomationDirty] = useState(false);
  const [savingAutomations, setSavingAutomations] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [contactActivities, setContactActivities] = useState<ContactActivity[]>(
    [],
  );
  const [smsActivity, setSmsActivity] = useState<SmsActivity[]>([]);
  const [inactiveContactsCount, setInactiveContactsCount] = useState(0);
  const [recentInboundCount, setRecentInboundCount] = useState(0);
  const [awaitingReplyCount, setAwaitingReplyCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (contactActivities.length === 0) {
      setInactiveContactsCount(0);
      return;
    }

    const now = Date.now();
    const thresholdMs =
      automationSettings.reactivation.daysSinceLastVisit * 24 * 60 * 60 * 1000;

    const inactiveCount = contactActivities.reduce((acc, contact) => {
      if (!contact.lastInteraction) {
        return acc + 1;
      }
      const lastInteractionMs = new Date(contact.lastInteraction).getTime();
      if (Number.isNaN(lastInteractionMs)) {
        return acc + 1;
      }
      return now - lastInteractionMs >= thresholdMs ? acc + 1 : acc;
    }, 0);

    setInactiveContactsCount(inactiveCount);
  }, [contactActivities, automationSettings.reactivation.daysSinceLastVisit]);

  useEffect(() => {
    if (smsActivity.length === 0) {
      setRecentInboundCount(0);
      setAwaitingReplyCount(0);
      return;
    }

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const latestByContact = new Map<string, SmsActivity>();
    let inboundLastWeek = 0;

    for (const sms of smsActivity) {
      if (sms.direction === "inbound") {
        const createdAtMs = new Date(sms.created_at).getTime();
        if (!Number.isNaN(createdAtMs) && createdAtMs >= sevenDaysAgo) {
          inboundLastWeek += 1;
        }
      }
      if (sms.contact_id && !latestByContact.has(sms.contact_id)) {
        latestByContact.set(sms.contact_id, sms);
      }
    }

    const awaitingReplies = Array.from(latestByContact.values()).filter(
      (sms) => sms.direction === "inbound",
    ).length;

    setRecentInboundCount(inboundLastWeek);
    setAwaitingReplyCount(awaitingReplies);
  }, [smsActivity]);

  const loadData = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();

      if (userError) {
        throw userError;
      }

      if (!user?.organization_id) {
        setNeedsOnboarding(true);
        setOrganizationId(null);
        setTemplateOptions([]);
        setUpcomingBirthdays([]);
        setAutomationSettings(defaultAutomationSettings);
        setAutomationDirty(false);
        setLoading(false);
        return;
      }

      setNeedsOnboarding(false);
      setOrganizationId(user.organization_id);

      const [contactsRes, smsRes, templatesRes, organizationRes] =
        await Promise.all([
          supabase
            .from("contacts")
            .select(
              "id, name, phone, email, birthday, marketing_consent, created_at, updated_at",
            )
            .eq("organization_id", user.organization_id)
            .eq("marketing_consent", true)
            .is("deleted_at", null),
          supabase
            .from("sms_messages")
            .select("contact_id, created_at, direction")
            .eq("organization_id", user.organization_id)
            .order("created_at", { ascending: false })
            .limit(2000),
          supabase
            .from("sms_templates")
            .select("id, name, category, message, is_global, organization_id")
            .or(`organization_id.eq.${user.organization_id},is_global.eq.true`)
            .order("is_global", { ascending: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("organizations")
            .select("settings")
            .eq("id", user.organization_id)
            .single(),
        ]);

      if (contactsRes.error) {
        throw contactsRes.error;
      }

      if (smsRes.error) {
        throw smsRes.error;
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

      const contacts = (contactsRes.data ?? []) as Contact[];
      const upcoming = contacts.filter((c) => {
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

      const smsRows = (smsRes.data ?? []) as SmsActivity[];
      setSmsActivity(smsRows);

      const latestByContact = new Map<string, string>();
      for (const sms of smsRows) {
        if (!sms.contact_id) continue;
        if (!latestByContact.has(sms.contact_id)) {
          latestByContact.set(sms.contact_id, sms.created_at);
        }
      }

      const contactActivityRows: ContactActivity[] = contacts.map(
        (contact) => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          birthday: contact.birthday ?? null,
          marketing_consent: contact.marketing_consent,
          lastInteraction:
            latestByContact.get(contact.id) ??
            contact.updated_at ??
            contact.created_at ??
            null,
        }),
      );
      setContactActivities(contactActivityRows);

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

      const settingsData =
        (organizationRes.data?.settings as Record<string, unknown>) ?? {};
      setOrganizationSettings(settingsData);
      setAutomationSettings(
        normalizeAutomationSettings(
          (settingsData as Record<string, unknown>)?.automations ??
            defaultAutomationSettings,
        ),
      );
      setAutomationDirty(false);
    } catch (error) {
      console.error("Failed to load data:", error);
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

  const setAutomationTiming = (
    key: keyof AutomationSettings,
    value: number,
  ) => {
    const sanitizedValue = Number.isNaN(value) ? 0 : Math.max(0, value);
    setAutomationSettings((prev) => {
      const next = { ...prev };
      if (key === "bookingConfirmation") {
        if (next.bookingConfirmation.sendDelayMinutes !== sanitizedValue) {
          next.bookingConfirmation = {
            ...next.bookingConfirmation,
            sendDelayMinutes: sanitizedValue,
          };
          setAutomationDirty(true);
        }
      } else if (key === "bookingReminder") {
        if (next.bookingReminder.hoursBefore !== sanitizedValue) {
          next.bookingReminder = {
            ...next.bookingReminder,
            hoursBefore: sanitizedValue,
          };
          setAutomationDirty(true);
        }
      } else if (key === "visitFollowup") {
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

  const setReactivationDays = (value: number) => {
    const sanitizedValue = Number.isNaN(value)
      ? 0
      : Math.max(1, Math.round(value));
    setAutomationSettings((prev) => {
      if (prev.reactivation.daysSinceLastVisit === sanitizedValue) {
        return prev;
      }
      const next = {
        ...prev,
        reactivation: {
          ...prev.reactivation,
          daysSinceLastVisit: sanitizedValue,
        },
      };
      setAutomationDirty(true);
      return next;
    });
  };

  const setReactivationSendHour = (value: number) => {
    const sanitizedValue = Number.isNaN(value)
      ? 0
      : Math.min(23, Math.max(0, Math.round(value)));
    setAutomationSettings((prev) => {
      if (prev.reactivation.sendHour === sanitizedValue) {
        return prev;
      }
      const next = {
        ...prev,
        reactivation: {
          ...prev.reactivation,
          sendHour: sanitizedValue,
        },
      };
      setAutomationDirty(true);
      return next;
    });
  };

  const setBirthdayDaysBefore = (value: number) => {
    const sanitizedValue = Number.isNaN(value)
      ? 0
      : Math.min(7, Math.max(0, Math.round(value)));
    setAutomationSettings((prev) => {
      if (prev.birthdayGreeting.daysBefore === sanitizedValue) {
        return prev;
      }
      const next = {
        ...prev,
        birthdayGreeting: {
          ...prev.birthdayGreeting,
          daysBefore: sanitizedValue,
        },
      };
      setAutomationDirty(true);
      return next;
    });
  };

  const setBirthdaySendHour = (value: number) => {
    const sanitizedValue = Number.isNaN(value)
      ? 0
      : Math.min(23, Math.max(0, Math.round(value)));
    setAutomationSettings((prev) => {
      if (prev.birthdayGreeting.sendHour === sanitizedValue) {
        return prev;
      }
      const next = {
        ...prev,
        birthdayGreeting: {
          ...prev.birthdayGreeting,
          sendHour: sanitizedValue,
        },
      };
      setAutomationDirty(true);
      return next;
    });
  };

  const setInboundAlertField = (
    field: "notifyEmail" | "notifySlackWebhook",
    value: string,
  ) => {
    const trimmedValue = value.trim() === "" ? null : value.trim();
    setAutomationSettings((prev) => {
      if (prev.inboundReplyAlert[field] === trimmedValue) {
        return prev;
      }
      const next = {
        ...prev,
        inboundReplyAlert: {
          ...prev.inboundReplyAlert,
          [field]: trimmedValue,
        },
      };
      setAutomationDirty(true);
      return next;
    });
  };

  const saveAutomations = async () => {
    if (!organizationId) {
      showToast("Ingen organisation vald", "error");
      return;
    }

    try {
      setSavingAutomations(true);
      const nextSettings = {
        ...(organizationSettings ?? {}),
        automations: automationSettings,
      };

      const { error } = await supabase
        .from("organizations")
        .update({ settings: nextSettings } as any)
        .eq("id", organizationId);

      if (error) {
        throw error;
      }

      setOrganizationSettings(nextSettings);
      setAutomationDirty(false);
      showToast("Automatiseringar sparade!", "success");
    } catch (error: any) {
      showToast(
        error.message || "Kunde inte spara automationsinställningar",
        "error",
      );
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Inte inloggad");

      const { data: user } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();

      if (!user?.organization_id) throw new Error("Ingen organisation");

      const { data: org } = await supabase
        .from("organizations")
        .select("name, sms_sender_name, sms_credits")
        .eq("id", user.organization_id)
        .single();

      if (!org) throw new Error("Organisation hittades inte");
      if (org.sms_credits < 1) throw new Error("Inga SMS-krediter kvar!");

      // Send SMS
      const message = `🎂 Grattis på födelsedagen ${contact.name}! Fira med oss på ${org.name} - vi bjuder på desserten! Boka idag!`;

      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contact.phone,
          message,
          from: org.sms_sender_name || "MEDDELA",
        }),
      });

      if (!response.ok) throw new Error("SMS-sändning misslyckades");

      showToast(
        `🎉 Födelsedagshälsning skickad till ${contact.name}!`,
        "success",
      );

      // Remove from list
      setUpcomingBirthdays((prev) => prev.filter((c) => c.id !== contact.id));
    } catch (error: any) {
      showToast(error.message || "Något gick fel", "error");
    } finally {
      setSending(null);
    }
  };

  const sendAllBirthdaySMS = async () => {
    if (upcomingBirthdays.length === 0) {
      showToast("Inga födelsedagar att skicka till", "error");
      return;
    }

    if (
      !confirm(
        `Skicka födelsedagshälsningar till ${upcomingBirthdays.length} personer?`,
      )
    ) {
      return;
    }

    setSending("all");
    let successCount = 0;

    for (const contact of upcomingBirthdays) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) continue;

        const { data: user } = await supabase
          .from("users")
          .select("organization_id")
          .eq("id", session.user.id)
          .single();

        if (!user?.organization_id) continue;

        const { data: org } = await supabase
          .from("organizations")
          .select("name, sms_sender_name")
          .eq("id", user.organization_id)
          .single();

        if (!org) continue;

        const message = `🎂 Grattis på födelsedagen ${contact.name}! Fira med oss på ${org.name} - vi bjuder på desserten! Boka idag!`;

        const response = await fetch("/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: contact.phone,
            message,
            from: org.sms_sender_name || "MEDDELA",
          }),
        });

        if (response.ok) {
          successCount++;
          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to send to ${contact.name}:`, error);
      }
    }

    setSending(null);
    showToast(`🎉 ${successCount} födelsedagshälsningar skickade!`, "success");
    loadData(); // Reload
  };

  const getDaysUntilBirthday = (birthday: string) => {
    const today = new Date();
    const bday = new Date(birthday);
    const thisYearBirthday = new Date(
      today.getFullYear(),
      bday.getMonth(),
      bday.getDate(),
    );

    const diff = Math.ceil(
      (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diff === 0) return "Idag!";
    if (diff === 1) return "Imorgon";
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

  if (needsOnboarding) {
    return (
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚡ Automatiseringar
          </h1>
          <p className="text-gray-600">
            Låt MEDDELA jobba åt dig - automatiska kampanjer som sparar tid och
            ökar intäkter
          </p>
        </div>
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100/30">
          <CardHeader>
            <CardTitle>
              Slutför onboarding för att aktivera automatiseringar
            </CardTitle>
            <CardDescription>
              Koppla först din organisation så kan vi skicka bekräftelser,
              påminnelser och uppföljningar automatiskt.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-600">
              När onboarding är klar kan du välja mallar, scheman och målgrupper
              för varje flöde.
            </p>
            <Link href="/onboarding">
              <Button>Gå till onboarding</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ⚡ Automatiseringar
        </h1>
        <p className="text-gray-600">
          Låt MEDDELA jobba åt dig - automatiska kampanjer som sparar tid och
          ökar intäkter
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <RefreshCw className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">
                Inaktiva kunder
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {inactiveContactsCount}
              </p>
              <p className="text-xs text-gray-500">
                {automationSettings.reactivation.daysSinceLastVisit} dagar sedan
                senaste kontakt
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-indigo-200 bg-indigo-50/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <MessageSquare className="h-6 w-6 text-indigo-700" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">
                Inkommande svar (7 dagar)
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {recentInboundCount}
              </p>
              <p className="text-xs text-gray-500">
                Loggade svar från kunder senaste veckan
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-rose-200 bg-rose-50/60">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-xl">
              <Bell className="h-6 w-6 text-rose-700" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-rose-700 font-semibold">
                Väntar på svar
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {awaitingReplyCount}
              </p>
              <p className="text-xs text-gray-500">
                Senaste meddelandet i tråden är från kunden
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Birthday Automation Card */}
      <Card className="mb-8 border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-pink-600" />
            Automatiska födelsedagshälsningar
          </CardTitle>
          <CardDescription>
            Skicka automatiskt födelsedagshälsningar med specialerbjudande - öka
            lojalitet och intäkter!
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
                  <p className="text-2xl font-bold text-gray-900">
                    {upcomingBirthdays.length}
                  </p>
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
                  <p
                    className={`text-xs font-semibold ${
                      automationSettings.birthdayGreeting.enabled
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {automationSettings.birthdayGreeting.enabled
                      ? "✅ Automatisk"
                      : "⚠️ Manuell"}
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

          <div className="border border-pink-200 bg-white/70 rounded-xl p-6 space-y-4 mb-8">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Automatisk utskickshantering
                </h3>
                <p className="text-sm text-gray-600">
                  När funktionen är aktiv schemaläggs ett personligt SMS{" "}
                  {automationSettings.birthdayGreeting.daysBefore === 0
                    ? "på själva födelsedagen"
                    : automationSettings.birthdayGreeting.daysBefore === 1
                      ? "dagen innan födelsedagen"
                      : `${automationSettings.birthdayGreeting.daysBefore} dagar innan`}{" "}
                  klockan{" "}
                  {automationSettings.birthdayGreeting.sendHour
                    .toString()
                    .padStart(2, "0")}
                  :00.
                </p>
              </div>
              <button
                onClick={() => toggleAutomation("birthdayGreeting")}
                className={`px-4 py-1 text-xs font-semibold rounded-full border transition ${
                  automationSettings.birthdayGreeting.enabled
                    ? "bg-green-100 border-green-200 text-green-700"
                    : "bg-gray-100 border-gray-200 text-gray-500"
                }`}
              >
                {automationSettings.birthdayGreeting.enabled ? "Aktiv" : "Av"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  SMS-mall
                </label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-gray-100 disabled:text-gray-400"
                  value={automationSettings.birthdayGreeting.templateId ?? ""}
                  onChange={(event) => {
                    const value = event.target.value || null;
                    const selected =
                      templateOptions.find((option) => option.id === value) ??
                      null;
                    setAutomationTemplate(
                      "birthdayGreeting",
                      selected?.id ?? null,
                      selected?.name ?? null,
                    );
                  }}
                  disabled={
                    !automationSettings.birthdayGreeting.enabled ||
                    templateOptions.length === 0
                  }
                >
                  <option value="">Välj mall...</option>
                  {templateOptions
                    .filter(
                      (option) =>
                        option.category === "marketing" ||
                        option.category === "thank_you",
                    )
                    .map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} {option.is_global ? "(Global)" : ""}
                      </option>
                    ))}
                </select>
                {automationSettings.birthdayGreeting.enabled &&
                  templateOptions.filter(
                    (option) =>
                      option.category === "marketing" ||
                      option.category === "thank_you",
                  ).length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Inga kampanjmallar ännu.{" "}
                      <Link
                        href="/templates"
                        className="text-pink-600 hover:underline"
                      >
                        Skapa en i SMS-mallar.
                      </Link>
                    </p>
                  )}
                {automationSettings.birthdayGreeting.templateId && (
                  <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap line-clamp-4">
                    {
                      findTemplateById(
                        automationSettings.birthdayGreeting.templateId,
                      )?.message
                    }
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Skicka antal dagar innan
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={automationSettings.birthdayGreeting.daysBefore}
                    onChange={(event) =>
                      setBirthdayDaysBefore(Number(event.target.value))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-gray-100 disabled:text-gray-400"
                    disabled={!automationSettings.birthdayGreeting.enabled}
                  />
                  <span className="text-sm text-gray-600">dagar</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  0 = samma dag, 1 = dagen innan födelsedagen.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Skicka klockan
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={6}
                    max={21}
                    value={automationSettings.birthdayGreeting.sendHour}
                    onChange={(event) =>
                      setBirthdaySendHour(Number(event.target.value))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 disabled:bg-gray-100 disabled:text-gray-400"
                    disabled={!automationSettings.birthdayGreeting.enabled}
                  />
                  <span className="text-sm text-gray-600">:00</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Rekommenderat mellan 08:00 och 18:00.
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Birthdays List */}
          {upcomingBirthdays.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  Kommande födelsedagar
                </h4>
                <Button
                  onClick={sendAllBirthdaySMS}
                  disabled={sending === "all"}
                  size="sm"
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {sending === "all" ? (
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
                        <p className="font-semibold text-gray-900">
                          {contact.name}
                        </p>
                        <p className="text-sm text-gray-600">{contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4">
                        <p className="text-sm font-semibold text-pink-600">
                          {contact.birthday &&
                            getDaysUntilBirthday(contact.birthday)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {contact.birthday &&
                            new Date(contact.birthday).toLocaleDateString(
                              "sv-SE",
                              {
                                month: "long",
                                day: "numeric",
                              },
                            )}
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
              <p className="text-gray-600 font-medium">
                Inga födelsedagar nästa 7 dagar
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Lägg till födelsedagar för dina kontakter för att aktivera denna
                funktion
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
            Aktivera tre steg som ger gästen bekräftelse, påminnelse och
            omtänksam uppföljning – helt utan manuellt arbete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border border-blue-100 bg-white rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Bekräftelse direkt
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Skicka ett tryggt bekräftelse-SMS så snart bokningen
                    registreras.
                  </p>
                </div>
                <button
                  onClick={() => toggleAutomation("bookingConfirmation")}
                  className={`px-4 py-1 text-xs font-semibold rounded-full border transition ${
                    automationSettings.bookingConfirmation.enabled
                      ? "bg-green-100 border-green-200 text-green-700"
                      : "bg-gray-100 border-gray-200 text-gray-500"
                  }`}
                >
                  {automationSettings.bookingConfirmation.enabled
                    ? "Aktiv"
                    : "Av"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    SMS-mall
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                    value={
                      automationSettings.bookingConfirmation.templateId ?? ""
                    }
                    onChange={(event) => {
                      const value = event.target.value || null;
                      const selected =
                        templateOptions.find((option) => option.id === value) ??
                        null;
                      setAutomationTemplate(
                        "bookingConfirmation",
                        selected?.id ?? null,
                        selected?.name ?? null,
                      );
                    }}
                    disabled={
                      !automationSettings.bookingConfirmation.enabled ||
                      templateOptions.length === 0
                    }
                  >
                    <option value="">Välj mall...</option>
                    {templateOptions
                      .filter((option) => option.category === "confirmation")
                      .map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} {option.is_global ? "(Global)" : ""}
                        </option>
                      ))}
                  </select>
                  {automationSettings.bookingConfirmation.enabled &&
                    templateOptions.filter(
                      (option) => option.category === "confirmation",
                    ).length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Inga bekräftelsemallar ännu.{" "}
                        <Link
                          href="/templates"
                          className="text-blue-600 hover:underline"
                        >
                          Skapa en i SMS-mallar.
                        </Link>
                      </p>
                    )}
                  {automationSettings.bookingConfirmation.templateId && (
                    <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap line-clamp-4">
                      {
                        findTemplateById(
                          automationSettings.bookingConfirmation.templateId,
                        )?.message
                      }
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
                      value={
                        automationSettings.bookingConfirmation.sendDelayMinutes
                      }
                      onChange={(event) =>
                        setAutomationTiming(
                          "bookingConfirmation",
                          Number(event.target.value),
                        )
                      }
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
                  <h3 className="font-semibold text-gray-900">
                    Påminnelse före besöket
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Skicka påminnelse automatiskt för att minska no-shows.
                  </p>
                </div>
                <button
                  onClick={() => toggleAutomation("bookingReminder")}
                  className={`px-4 py-1 text-xs font-semibold rounded-full border transition ${
                    automationSettings.bookingReminder.enabled
                      ? "bg-green-100 border-green-200 text-green-700"
                      : "bg-gray-100 border-gray-200 text-gray-500"
                  }`}
                >
                  {automationSettings.bookingReminder.enabled ? "Aktiv" : "Av"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    SMS-mall
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:bg-gray-100 disabled:text-gray-400"
                    value={automationSettings.bookingReminder.templateId ?? ""}
                    onChange={(event) => {
                      const value = event.target.value || null;
                      const selected =
                        templateOptions.find((option) => option.id === value) ??
                        null;
                      setAutomationTemplate(
                        "bookingReminder",
                        selected?.id ?? null,
                        selected?.name ?? null,
                      );
                    }}
                    disabled={
                      !automationSettings.bookingReminder.enabled ||
                      templateOptions.length === 0
                    }
                  >
                    <option value="">Välj mall...</option>
                    {templateOptions
                      .filter((option) => option.category === "reminder")
                      .map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} {option.is_global ? "(Global)" : ""}
                        </option>
                      ))}
                  </select>
                  {automationSettings.bookingReminder.enabled &&
                    templateOptions.filter(
                      (option) => option.category === "reminder",
                    ).length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Inga påminnelsemallar ännu.{" "}
                        <Link
                          href="/templates"
                          className="text-blue-600 hover:underline"
                        >
                          Skapa en i SMS-mallar.
                        </Link>
                      </p>
                    )}
                  {automationSettings.bookingReminder.templateId && (
                    <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap line-clamp-4">
                      {
                        findTemplateById(
                          automationSettings.bookingReminder.templateId,
                        )?.message
                      }
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
                      onChange={(event) =>
                        setAutomationTiming(
                          "bookingReminder",
                          Number(event.target.value),
                        )
                      }
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
                  <h3 className="font-semibold text-gray-900">
                    Uppföljning efter besöket
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tacka, samla feedback och föreslå nästa steg – automatiskt.
                  </p>
                </div>
                <button
                  onClick={() => toggleAutomation("visitFollowup")}
                  className={`px-4 py-1 text-xs font-semibold rounded-full border transition ${
                    automationSettings.visitFollowup.enabled
                      ? "bg-green-100 border-green-200 text-green-700"
                      : "bg-gray-100 border-gray-200 text-gray-500"
                  }`}
                >
                  {automationSettings.visitFollowup.enabled ? "Aktiv" : "Av"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                    SMS-mall
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 disabled:bg-gray-100 disabled:text-gray-400"
                    value={automationSettings.visitFollowup.templateId ?? ""}
                    onChange={(event) => {
                      const value = event.target.value || null;
                      const selected =
                        templateOptions.find((option) => option.id === value) ??
                        null;
                      setAutomationTemplate(
                        "visitFollowup",
                        selected?.id ?? null,
                        selected?.name ?? null,
                      );
                    }}
                    disabled={
                      !automationSettings.visitFollowup.enabled ||
                      templateOptions.length === 0
                    }
                  >
                    <option value="">Välj mall...</option>
                    {templateOptions
                      .filter(
                        (option) =>
                          option.category === "thank_you" ||
                          option.category === "marketing",
                      )
                      .map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} {option.is_global ? "(Global)" : ""}
                        </option>
                      ))}
                  </select>
                  {automationSettings.visitFollowup.enabled &&
                    templateOptions.filter(
                      (option) =>
                        option.category === "thank_you" ||
                        option.category === "marketing",
                    ).length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Inga uppföljningsmallar ännu.{" "}
                        <Link
                          href="/templates"
                          className="text-blue-600 hover:underline"
                        >
                          Skapa en i SMS-mallar.
                        </Link>
                      </p>
                    )}
                  {automationSettings.visitFollowup.templateId && (
                    <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap line-clamp-4">
                      {
                        findTemplateById(
                          automationSettings.visitFollowup.templateId,
                        )?.message
                      }
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
                      onChange={(event) =>
                        setAutomationTiming(
                          "visitFollowup",
                          Number(event.target.value),
                        )
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 disabled:bg-gray-100 disabled:text-gray-400"
                      disabled={!automationSettings.visitFollowup.enabled}
                    />
                    <span className="text-sm text-gray-600">timmar efter</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Tips: Använd playbooken för din bransch på sidan{" "}
            <Link href="/templates" className="text-blue-600 hover:underline">
              SMS-mallar
            </Link>{" "}
            för att få förifyllda mallar.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-8 border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-amber-700" />
            Återaktivera tappade kunder
          </CardTitle>
          <CardDescription>
            Få tillbaka gäster som inte har hört av sig på ett tag med en
            omtänksam återkomsterbjudande-kampanj.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">
                  Kunder som saknas
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {inactiveContactsCount}
                </p>
                <p className="text-xs text-gray-500">
                  Senaste kontakten äldre än{" "}
                  {automationSettings.reactivation.daysSinceLastVisit} dagar
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleAutomation("reactivation")}
              className={`px-4 py-1 text-xs font-semibold rounded-full border transition ${
                automationSettings.reactivation.enabled
                  ? "bg-green-100 border-green-200 text-green-700"
                  : "bg-gray-100 border-gray-200 text-gray-500"
              }`}
            >
              {automationSettings.reactivation.enabled ? "Aktiv" : "Av"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                SMS-mall
              </label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:bg-gray-100 disabled:text-gray-400"
                value={automationSettings.reactivation.templateId ?? ""}
                onChange={(event) => {
                  const value = event.target.value || null;
                  const selected =
                    templateOptions.find((option) => option.id === value) ??
                    null;
                  setAutomationTemplate(
                    "reactivation",
                    selected?.id ?? null,
                    selected?.name ?? null,
                  );
                }}
                disabled={
                  !automationSettings.reactivation.enabled ||
                  templateOptions.length === 0
                }
              >
                <option value="">Välj mall...</option>
                {templateOptions
                  .filter(
                    (option) =>
                      option.category === "marketing" ||
                      option.category === "thank_you",
                  )
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} {option.is_global ? "(Global)" : ""}
                    </option>
                  ))}
              </select>
              {automationSettings.reactivation.enabled &&
                templateOptions.filter(
                  (option) =>
                    option.category === "marketing" ||
                    option.category === "thank_you",
                ).length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Skapa en återaktiveringsmall under{" "}
                    <Link
                      href="/templates"
                      className="text-amber-600 hover:underline"
                    >
                      SMS-mallar
                    </Link>
                    .
                  </p>
                )}
              {automationSettings.reactivation.templateId && (
                <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap line-clamp-4">
                  {
                    findTemplateById(automationSettings.reactivation.templateId)
                      ?.message
                  }
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Skicka efter hur många dagar
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={14}
                  max={365}
                  value={automationSettings.reactivation.daysSinceLastVisit}
                  onChange={(event) =>
                    setReactivationDays(Number(event.target.value))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={!automationSettings.reactivation.enabled}
                />
                <span className="text-sm text-gray-600">dagar</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tips: 45–90 dagar fungerar ofta bra för salonger och kliniker.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Skicka klockan
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={8}
                  max={20}
                  value={automationSettings.reactivation.sendHour}
                  onChange={(event) =>
                    setReactivationSendHour(Number(event.target.value))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={!automationSettings.reactivation.enabled}
                />
                <span className="text-sm text-gray-600">:00</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Anpassa efter när dina kunder brukar öppna SMS.
              </p>
            </div>
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-6">
            När funktionen är aktiv schemaläggs automatiskt ett SMS varje morgon
            för kunder som passerat gränsen. Du kan följa utskicken i
            Meddelanden &gt; Inkorg.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-8 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-indigo-100/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-700" />
            Notifieringar för inkommande svar
          </CardTitle>
          <CardDescription>
            Säkerställ att inget kundsvar blir obesvarat – skicka aviseringar
            till teamet så fort en kund skriver in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-indigo-700" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">
                  Svar senaste veckan
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {recentInboundCount}
                </p>
                <p className="text-xs text-gray-500">
                  {awaitingReplyCount} konversationer väntar på åtgärd
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleAutomation("inboundReplyAlert")}
              className={`px-4 py-1 text-xs font-semibold rounded-full border transition ${
                automationSettings.inboundReplyAlert.enabled
                  ? "bg-green-100 border-green-200 text-green-700"
                  : "bg-gray-100 border-gray-200 text-gray-500"
              }`}
            >
              {automationSettings.inboundReplyAlert.enabled ? "Aktiv" : "Av"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Skicka ett e-postlarm till
              </label>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white border border-indigo-100 rounded-lg">
                  <Mail className="h-4 w-4 text-indigo-600" />
                </div>
                <input
                  type="email"
                  placeholder="support@dittföretag.se"
                  value={automationSettings.inboundReplyAlert.notifyEmail ?? ""}
                  onChange={(event) =>
                    setInboundAlertField("notifyEmail", event.target.value)
                  }
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={!automationSettings.inboundReplyAlert.enabled}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Vi skickar ett e-postmeddelande med länk till konversationen när
                ett nytt kundsvar kommer in.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Slack-webhook (valfritt)
              </label>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white border border-indigo-100 rounded-lg">
                  <Bell className="h-4 w-4 text-indigo-600" />
                </div>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={
                    automationSettings.inboundReplyAlert.notifySlackWebhook ??
                    ""
                  }
                  onChange={(event) =>
                    setInboundAlertField(
                      "notifySlackWebhook",
                      event.target.value,
                    )
                  }
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={!automationSettings.inboundReplyAlert.enabled}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Klistra in en inkommande webhook från Slack eller Teams för att
                få aviseringar direkt i kanalen.
              </p>
            </div>
          </div>

          <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mt-6">
            Tips: Kombinera aviseringar med Inkorgen för att svara direkt, och
            markera konversationen som löst när du är klar.
          </p>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <p className="text-xs text-gray-500 max-w-xl">
          Glöm inte att publicera eller uppdatera dina SMS-mallar när du ändrar
          ton eller erbjudanden. Behöver du inspiration? Besök{" "}
          <Link href="/templates" className="text-blue-600 hover:underline">
            SMS-mallar
          </Link>{" "}
          för branschvisa exempel.
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

      {/* Why Automation Matters */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg flex-shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Varför automatisering?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-blue-600 mb-1">⏰ Spara tid</p>
                  <p className="text-gray-600">
                    2-3 timmar per dag automatiseras
                  </p>
                </div>
                <div>
                  <p className="font-medium text-green-600 mb-1">
                    💰 Öka intäkter
                  </p>
                  <p className="text-gray-600">25-35% fler återbesök</p>
                </div>
                <div>
                  <p className="font-medium text-purple-600 mb-1">
                    ❤️ Bättre upplevelse
                  </p>
                  <p className="text-gray-600">
                    Kunder känner sig omhändertagna
                  </p>
                </div>
                <div>
                  <p className="font-medium text-orange-600 mb-1">
                    📈 Aldrig glömma
                  </p>
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

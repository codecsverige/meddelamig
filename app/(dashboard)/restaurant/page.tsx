'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, Clock, Users, Star, Gift, TrendingUp, 
  Send, Zap, Heart, Award, MessageSquare, Target 
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

type QuickCampaign = {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  message: string;
  targetType: 'all' | 'vip' | 'inactive' | 'recent';
};

type ContactRecord = {
  id: string;
  name?: string | null;
  phone?: string | null;
  tags?: string[] | null;
  birthday?: string | null;
  marketing_consent?: boolean | null;
  created_at?: string | null;
};

type ContactWithActivity = ContactRecord & {
  lastSmsAt: string | null;
  marketing_consent?: boolean;
};

export default function RestaurantHubPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [stats, setStats] = useState({
    totalContacts: 0,
    vipContacts: 0,
    inactiveContacts: 0,
    upcomingBirthdays: 0,
  });
  const [contacts, setContacts] = useState<ContactWithActivity[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<
    Array<{ id: string; name: string | null | undefined; birthday: string; formattedDate: string; daysUntil: number }>
  >([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) {
        setNeedsOnboarding(true);
        setStats({
          totalContacts: 0,
          vipContacts: 0,
          inactiveContacts: 0,
          upcomingBirthdays: 0,
        });
        setContacts([]);
        setUpcomingBirthdays([]);
        return;
      }

      setNeedsOnboarding(false);

      const [{ data: contactsRes, error: contactsError }, { data: smsRes, error: smsError }] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, name, phone, tags, birthday, marketing_consent, created_at')
          .eq('organization_id', user.organization_id)
          .is('deleted_at', null),
        supabase
          .from('sms_messages')
          .select('contact_id, created_at')
          .eq('organization_id', user.organization_id)
          .neq('contact_id', null)
          .order('created_at', { ascending: false })
          .limit(2000),
      ]);

      if (contactsError) throw contactsError;
      if (smsError) throw smsError;

      const contactList = (contactsRes ?? []) as ContactRecord[];
      const smsList = (smsRes ?? []) as Array<{ contact_id: string | null; created_at: string }>;

      const lastSmsMap = new Map<string, string>();
      smsList.forEach((sms) => {
        const contactId = sms.contact_id as string | null;
        if (!contactId) return;
        if (!lastSmsMap.has(contactId)) {
          lastSmsMap.set(contactId, sms.created_at as string);
        }
      });

      const vipCount = contactList.filter((contact) =>
        contact.tags?.some((tag) => tag.toLowerCase() === 'vip'),
      ).length;

      const now = new Date();
      const inactiveThreshold = new Date();
      inactiveThreshold.setDate(now.getDate() - 60);

      const inactiveCount = contactList.filter((contact) => {
        const lastSmsAt = lastSmsMap.get(contact.id);
        if (!lastSmsAt) {
          const createdAt = contact.created_at ? new Date(contact.created_at) : null;
          return !createdAt || createdAt < inactiveThreshold;
        }
        return new Date(lastSmsAt) < inactiveThreshold;
      }).length;

      const upcomingList: Array<{ id: string; name: string | null | undefined; birthday: string; formattedDate: string; daysUntil: number }> = [];
      contactList.forEach((contact) => {
        if (!contact.birthday) return;
        const raw = new Date(contact.birthday);
        if (Number.isNaN(raw.getTime())) return;
        const thisYear = new Date(now.getFullYear(), raw.getMonth(), raw.getDate());
        const nextOccurrence =
          thisYear < now ? new Date(now.getFullYear() + 1, raw.getMonth(), raw.getDate()) : thisYear;
        const daysUntil = Math.ceil((nextOccurrence.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= 30) {
          upcomingList.push({
            id: contact.id,
            name: contact.name,
            birthday: contact.birthday,
            formattedDate: nextOccurrence.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
            daysUntil,
          });
        }
      });

      upcomingList.sort((a, b) => a.daysUntil - b.daysUntil);
      const upcomingTop = upcomingList.slice(0, 6);

      setStats({
        totalContacts: contactList.length,
        vipContacts: vipCount,
        inactiveContacts: inactiveCount,
        upcomingBirthdays: upcomingList.length,
      });
      setContacts(
        contactList.map((contact) => ({
          ...contact,
          marketing_consent: Boolean(contact.marketing_consent),
          lastSmsAt: lastSmsMap.get(contact.id) ?? null,
        })),
      );
      setUpcomingBirthdays(upcomingTop);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickCampaigns: QuickCampaign[] = [
    {
      id: 'weekend-special',
      title: 'Veckoslutserbjudande',
      description: 'Skicka special-erbjudande för helgen',
      icon: Gift,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      message: 'Hej {{name}}! 🎉 Detta veckoslutet: 20% på alla huvudrätter hos {{organization}}. Boka nu eller ring oss. Gäller fre-sön!',
      targetType: 'all',
    },
    {
      id: 'last-minute',
      title: 'Sista minuten-bord',
      description: 'Lediga bord ikväll - fyll upp!',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      message: 'SISTA MINUTEN {{name}}! Lediga bord ikväll kl 19:00 hos {{organization}}. Första att boka får 15% rabatt! 🍽️',
      targetType: 'all',
    },
    {
      id: 'vip-exclusive',
      title: 'VIP-erbjudande',
      description: 'Exklusivt för dina bästa gäster',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      message: 'Exklusivt för dig {{name}} 🌟: Förhandsbokning till vår nya meny innan alla andra. Du är VIP hos {{organization}}!',
      targetType: 'vip',
    },
    {
      id: 'win-back',
      title: 'Vi saknar dig',
      description: 'Ta tillbaka inaktiva kunder',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      message: 'Vi saknar dig {{name}}! 😊 Kom tillbaka till {{organization}} denna månad och få gratis dessert. Välkommen åter!',
      targetType: 'inactive',
    },
    {
      id: 'happy-hour',
      title: 'Happy Hour',
      description: 'Drycker-erbjudande nu',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      message: 'HAPPY HOUR hos {{organization}}! 17-19 idag: alla drycker 2-för-1. Ta med en vän {{name}}! Välkommen! 🍹',
      targetType: 'all',
    },
    {
      id: 'birthday-blast',
      title: 'Födelsedagar',
      description: 'Grattis med special-erbjudande',
      icon: Calendar,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      message: '🎂 Grattis på födelsedagen {{name}}! Fira med oss på {{organization}} - vi bjuder på desserten! Boka idag!',
      targetType: 'all',
    },
  ];

  const inactiveThresholdDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() - 60);
    return date;
  })();

  const filterContactsForCampaign = (campaign: QuickCampaign) => {
    let filtered = contacts.filter((contact) => contact.marketing_consent);

    if (campaign.targetType === 'vip') {
      filtered = filtered.filter((contact) =>
        contact.tags?.some((tag) => tag.toLowerCase() === 'vip'),
      );
    } else if (campaign.targetType === 'inactive') {
      filtered = filtered.filter((contact) => {
        if (!contact.lastSmsAt) return true;
        return new Date(contact.lastSmsAt) < inactiveThresholdDate;
      });
    } else if (campaign.targetType === 'recent') {
      filtered = filtered.filter((contact) => {
        if (!contact.lastSmsAt) return false;
        return new Date(contact.lastSmsAt) >= inactiveThresholdDate;
      });
    }

    return filtered;
  };

  const handleQuickCampaign = async (campaign: QuickCampaign) => {
    if (!confirm(`Skicka "${campaign.title}" till ${campaign.targetType === 'vip' ? 'VIP-kunder' : campaign.targetType === 'inactive' ? 'inaktiva kunder' : 'alla kunder'}?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Inte inloggad');

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) throw new Error('Ingen organisation');

      const targets = filterContactsForCampaign(campaign);

      if (targets.length === 0) {
        showToast('Inga kontakter hittades för denna kampanj', 'error');
        return;
      }

      // Redirect to campaigns page with pre-filled data
      const campaignData = {
        name: campaign.title,
        message: campaign.message,
        targetContactIds: targets.map((contact) => contact.id),
      };

      // Save to sessionStorage and redirect
      sessionStorage.setItem('quickCampaign', JSON.stringify(campaignData));
      router.push('/campaigns');
    } catch (error: any) {
      showToast(error.message || 'Något gick fel', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
          <p className="text-gray-500">Laddar...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🍽️ Restaurant Hub</h1>
          <p className="text-gray-600">
            Kraftfulla verktyg designade specifikt för restauranger - inga krångel!
          </p>
        </div>
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100/30">
          <CardHeader>
            <CardTitle>Slutför onboarding för att se restaurangöversikten</CardTitle>
            <CardDescription>
              När organisationen är registrerad kan vi visa gästantal, VIP-status, kampanjer och snabbåtgärder här.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-600">
              Gå igenom onboarding så kopplar vi Restaurant Hub till rätt verksamhet och kontakter.
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🍽️ Restaurant Hub</h1>
        <p className="text-gray-600">
          Kraftfulla verktyg designade specifikt för restauranger - inga krångel!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Totalt gäster</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">VIP-gäster</p>
                <p className="text-2xl font-bold text-gray-900">{stats.vipContacts}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inaktiva</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactiveContacts}</p>
                <p className="text-xs text-orange-600 mt-1">Vinn tillbaka!</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Födelsedagar</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingBirthdays}</p>
                  <p className="text-xs text-pink-600 mt-1">Nästa 30 dagar</p>
                </div>
              <div className="p-3 rounded-lg bg-pink-50">
                <Calendar className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {upcomingBirthdays.length > 0 && (
        <Card className="mb-8 border border-pink-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-pink-600" />
              Kommande födelsedagar (30 dagar)
            </CardTitle>
            <CardDescription>
              Perfekt tillfälle att skicka ett personligt SMS och stärka relationen.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBirthdays.map((birthday) => (
              <div
                key={birthday.id}
                className="rounded-lg border border-pink-100 bg-white p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">
                    {birthday.name || 'Okänd kontakt'}
                  </p>
                  <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded-full">
                    {birthday.daysUntil === 0
                      ? 'Idag 🎉'
                      : birthday.daysUntil === 1
                      ? 'Imorgon'
                      : `Om ${birthday.daysUntil} dagar`}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{birthday.formattedDate}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Campaign Templates */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Snabbkampanjer - Ett klick!
          </CardTitle>
          <CardDescription>
            Färdiga kampanjer för vanliga situationer - ingen skrivning behövs!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickCampaigns.map((campaign) => {
                const targetCount = filterContactsForCampaign(campaign).length;
                return (
              <button
                key={campaign.id}
                onClick={() => handleQuickCampaign(campaign)}
                className="group text-left p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${campaign.bgColor} group-hover:scale-110 transition-transform`}>
                    <campaign.icon className={`h-5 w-5 ${campaign.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600">
                      {campaign.title}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {campaign.description}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 line-clamp-2">
                  "{campaign.message.substring(0, 80)}..."
                </div>
                  <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600">
                      {campaign.targetType === 'vip'
                        ? `→ VIP (${targetCount})`
                        : campaign.targetType === 'inactive'
                        ? `→ Inaktiva (${targetCount})`
                        : `→ Alla (${targetCount})`}
                  </span>
                  <Send className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pre-made Templates */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Färdiga SMS-mallar för restauranger
          </CardTitle>
          <CardDescription>
            21 professionella mallar - använd direkt utan att skriva något!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">Bokningar</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">5 mallar för bekräftelser</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Standard bekräftelse</li>
                <li>• Elegant ton</li>
                <li>• Kort & snabb</li>
                <li>• Med meny-frågor</li>
                <li>• VIP-stil</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">Påminnelser</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">4 mallar för reminders</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• 24h innan</li>
                <li>• 2h innan</li>
                <li>• Med JA/NEJ-bekräftelse</li>
                <li>• Vänlig ton</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">Tack-meddelanden</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">3 mallar efter besök</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Enkelt tack</li>
                <li>• Med review-begäran</li>
                <li>• Med nästa-bokning</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">Marketing</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">6 kampanjmallar</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Veckoslut-erbjudande</li>
                <li>• Sista minuten</li>
                <li>• Ny meny</li>
                <li>• Happy hour</li>
                <li>• Event-inbjudan</li>
                <li>• Återkommande kund</li>
              </ul>
            </div>

            <div className="p-4 bg-pink-50 rounded-xl border-2 border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-pink-600 rounded-lg">
                  <Gift className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">Speciella tillfällen</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">3 mallar för events</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Födelsedag</li>
                <li>• Jubileum</li>
                <li>• VIP-exklusivt</li>
              </ul>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-6 w-6 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Totalt</h4>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-1">21 mallar</p>
              <p className="text-xs text-gray-600">
                Alla färdiga att användas direkt!
              </p>
              <Link href="/templates">
                <Button className="w-full mt-3" size="sm">
                  Se alla mallar
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/templates">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">SMS-mallar</h4>
                  <p className="text-sm text-gray-600">Utforska alla 21 mallar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/campaigns">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Send className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Kampanjer</h4>
                  <p className="text-sm text-gray-600">Skicka till många samtidigt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/contacts">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Gästlista</h4>
                  <p className="text-sm text-gray-600">Hantera alla gäster</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

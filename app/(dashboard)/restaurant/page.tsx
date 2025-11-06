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
  tags?: string[] | null;
};

export default function RestaurantHubPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContacts: 0,
    vipContacts: 0,
    inactiveContacts: 0,
    upcomingBirthdays: 0,
  });

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
        router.push('/onboarding');
        return;
      }

      // Get contacts stats
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', user.organization_id)
        .is('deleted_at', null);

      const contactList = (contacts ?? []) as ContactRecord[];

      const vipCount = contactList.filter((contact) =>
        contact.tags?.includes('VIP') || contact.tags?.includes('vip')
      ).length;

      // Inactive: no SMS in last 60 days (mock for now)
      const inactiveCount = Math.floor(contactList.length * 0.2);

      // Upcoming birthdays in next 7 days (mock for now)
      const birthdayCount = Math.floor(contactList.length * 0.05);

      setStats({
        totalContacts: contactList.length,
        vipContacts: vipCount,
        inactiveContacts: inactiveCount,
        upcomingBirthdays: birthdayCount,
      });
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

      // Get target contacts based on type
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('marketing_consent', true)
        .is('deleted_at', null);

      if (campaign.targetType === 'vip') {
        query = query.or('tags.cs.{VIP},tags.cs.{vip}');
      }

      const { data: contacts } = await query;
      const contactList = (contacts ?? []) as ContactRecord[];

      if (contactList.length === 0) {
        showToast('Inga kontakter hittades för denna kampanj', 'error');
        return;
      }

      // Redirect to campaigns page with pre-filled data
      const campaignData = {
        name: campaign.title,
        message: campaign.message,
        targetContactIds: contactList.map((contact) => contact.id),
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
                <p className="text-xs text-pink-600 mt-1">Nästa 7 dagar</p>
              </div>
              <div className="p-3 rounded-lg bg-pink-50">
                <Calendar className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            {quickCampaigns.map((campaign) => (
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
                    {campaign.targetType === 'vip' ? '→ VIP' : campaign.targetType === 'inactive' ? '→ Inaktiva' : '→ Alla'}
                  </span>
                  <Send className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, Gift, Star, Clock, Send, 
  CheckCircle2, XCircle, Loader2, Heart,
  Sparkles, Zap, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

type Contact = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  marketing_consent: boolean;
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

      // Get upcoming birthdays (next 7 days)
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('marketing_consent', true)
        .not('birthday', 'is', null)
        .is('deleted_at', null);

      if (contacts) {
        // Filter birthdays in next 7 days (client-side for now)
        const today = new Date();
        const next7Days = new Date();
        next7Days.setDate(today.getDate() + 7);

        const upcoming = contacts.filter(c => {
          if (!c.birthday) return false;
          
          const birthday = new Date(c.birthday);
          const thisYearBirthday = new Date(
            today.getFullYear(),
            birthday.getMonth(),
            birthday.getDate()
          );

          // Check if birthday is within next 7 days
          return thisYearBirthday >= today && thisYearBirthday <= next7Days;
        });

        setUpcomingBirthdays(upcoming);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
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

      {/* Coming Soon Automations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50 opacity-75">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Booking Reminders</h4>
                <p className="text-xs text-gray-600">Automatiska påminnelser</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Skicka automatiskt påminnelser 24h och 2h innan bokning. Minska no-shows med 35%.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Sparkles className="h-4 w-4" />
              Kommer snart
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-orange-200 bg-orange-50 opacity-75">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-orange-600 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Win-Back Campaigns</h4>
                <p className="text-xs text-gray-600">Ta tillbaka inaktiva</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Automatisk SMS till kunder som inte besökt på 60+ dagar. Återfå 25% av förlorade kunder.
            </p>
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <Sparkles className="h-4 w-4" />
              Kommer snart
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-purple-200 bg-purple-50 opacity-75">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Review Requests</h4>
                <p className="text-xs text-gray-600">Automatiska review-begäran</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              SMS 2-4 timmar efter besök med direkt länk till Google Reviews. Öka reviews 5x.
            </p>
            <div className="flex items-center gap-2 text-xs text-purple-600">
              <Sparkles className="h-4 w-4" />
              Kommer snart
            </div>
          </CardContent>
        </Card>
      </div>

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

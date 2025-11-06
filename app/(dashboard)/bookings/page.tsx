import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingDown,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function BookingsPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', session.user.id)
    .single();

  // Show friendly message instead of redirect
  if (!user?.organization_id) {
    return (
      <div className="p-4 lg:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 pb-6 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Skapa din organisation först
            </h2>
            <p className="text-gray-600 mb-6">
              Du behöver skapa en organisation för att hantera bokningar
            </p>
            <Link href="/onboarding">
              <Button size="lg">Skapa organisation</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data for bookings
  const bookingStats = {
    totalBookings: 324,
    confirmed: 278,
    pending: 31,
    noShows: 15,
    noShowRate: 4.6,
    previousNoShowRate: 12.3,
    moneySaved: 38400, // kr saved from reduced no-shows
  };

  const upcomingBookings = [
    {
      id: 1,
      customer: 'Anna Andersson',
      phone: '+46701234567',
      date: 'Idag',
      time: '18:00',
      guests: 4,
      status: 'confirmed',
      confirmationSent: true,
      reminderSent: true,
    },
    {
      id: 2,
      customer: 'Erik Johansson',
      phone: '+46702345678',
      date: 'Idag',
      time: '19:30',
      guests: 2,
      status: 'pending',
      confirmationSent: true,
      reminderSent: false,
    },
    {
      id: 3,
      customer: 'Maria Svensson',
      phone: '+46703456789',
      date: 'Imorgon',
      time: '18:30',
      guests: 6,
      status: 'confirmed',
      confirmationSent: true,
      reminderSent: false,
    },
    {
      id: 4,
      customer: 'Johan Berg',
      phone: '+46704567890',
      date: 'Imorgon',
      time: '20:00',
      guests: 2,
      status: 'pending',
      confirmationSent: true,
      reminderSent: false,
    },
  ];

  const noShowHistory = [
    {
      id: 1,
      customer: 'Lars Andersson',
      date: '2024-01-15',
      time: '19:00',
      guests: 4,
      potentialRevenue: 2400,
      reliability: 'first_offense'
    },
    {
      id: 2,
      customer: 'Karin Svensson',
      date: '2024-01-10',
      time: '18:30',
      guests: 2,
      potentialRevenue: 1200,
      reliability: 'repeat_offender'
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bokningshantering</h1>
          <p className="text-gray-600">
            Minska no-shows och maximera bordsturnering
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Ny bokning
        </Button>
      </div>

      {/* Success Banner */}
      <Card className="border-2 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Fantastisk förbättring! 🎉
              </h3>
              <p className="text-green-800 mb-3">
                Ditt no-show rate har minskat från <strong>{bookingStats.previousNoShowRate}%</strong> till{' '}
                <strong>{bookingStats.noShowRate}%</strong> sedan du aktiverade automatiska påminnelser.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-700" />
                  <span className="text-green-900">
                    <strong>{bookingStats.moneySaved.toLocaleString()} kr</strong> sparade denna månad
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-700" />
                  <span className="text-green-900">
                    <strong>{bookingStats.confirmed}</strong> bekräftade bokningar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Totalt bokningar</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {bookingStats.totalBookings}
            </div>
            <p className="text-xs text-green-600">+12% vs förra månaden</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Bekräftade</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {bookingStats.confirmed}
            </div>
            <p className="text-xs text-gray-500">
              {((bookingStats.confirmed / bookingStats.totalBookings) * 100).toFixed(0)}% av totalt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-gray-600">Väntande svar</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {bookingStats.pending}
            </div>
            <p className="text-xs text-orange-600">Behöver bekräftelse</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-600">No-shows</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {bookingStats.noShowRate}%
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingDown className="h-3 w-3" />
              -{(bookingStats.previousNoShowRate - bookingStats.noShowRate).toFixed(1)}% förbättring
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kommande bokningar</CardTitle>
              <CardDescription>Bokningar som kräver uppmärksamhet</CardDescription>
            </div>
            <Badge variant="secondary">{upcomingBookings.length} aktiva</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className={`p-4 border rounded-lg ${
                  booking.status === 'pending' ? 'border-orange-200 bg-orange-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{booking.customer}</h4>
                      {booking.status === 'confirmed' ? (
                        <Badge variant="success" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Bekräftad
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Väntar
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {booking.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {booking.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {booking.guests} personer
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {booking.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <Button variant="outline" size="sm">
                        Skicka påminnelse
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      Detaljer
                    </Button>
                  </div>
                </div>

                {/* SMS Status */}
                <div className="flex flex-wrap gap-2 pt-3 border-t">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${
                      booking.confirmationSent ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-xs text-gray-600">Bekräftelse skickad</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${
                      booking.reminderSent ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-xs text-gray-600">24h påminnelse</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                    <span className="text-xs text-gray-600">2h påminnelse</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* No-Show Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>No-Show historik</CardTitle>
            <CardDescription>Kunder som inte dykt upp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {noShowHistory.map((noShow) => (
                <div key={noShow.id} className="p-4 border border-red-100 bg-red-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{noShow.customer}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(noShow.date).toLocaleDateString('sv-SE')} kl {noShow.time}
                      </p>
                    </div>
                    {noShow.reliability === 'repeat_offender' ? (
                      <Badge variant="destructive" className="bg-red-600">
                        Upprepad
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800">
                        Första gången
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{noShow.guests} personer</span>
                    <span className="font-medium text-red-700">
                      ~{noShow.potentialRevenue} kr förlorad
                    </span>
                  </div>
                  {noShow.reliability === 'repeat_offender' && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs text-red-800 mb-2">
                        ⚠️ Denna kund har flera no-shows. Överväg:
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs">
                          Kräv deposition
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                          Blacklist
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Automatiska påminnelser</CardTitle>
            <CardDescription>Konfigurera ditt no-show prevention system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Bekräftelse direkt</p>
                    <p className="text-xs text-gray-600">Vid bokning</p>
                  </div>
                </div>
                <Badge variant="success" className="bg-green-100 text-green-800">
                  Aktiv
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">24h påminnelse</p>
                    <p className="text-xs text-gray-600">Dagen innan</p>
                  </div>
                </div>
                <Badge variant="info" className="bg-blue-100 text-blue-800">
                  Aktiv
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">2h påminnelse</p>
                    <p className="text-xs text-gray-600">Om ej bekräftat</p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  Aktiv
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Kräv deposition för stora grupper</span>
                <input type="checkbox" checked readOnly className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Automatisk blacklist (3+ no-shows)</span>
                <input type="checkbox" checked readOnly className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Skicka till vänt lista vid avbokning</span>
                <input type="checkbox" checked readOnly className="rounded" />
              </div>
            </div>

            <Button className="w-full">
              Spara inställningar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

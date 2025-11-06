import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Gift, TrendingUp, Users, Award, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function LoyaltyPage() {
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

  if (!user?.organization_id) {
    redirect('/onboarding');
  }

  // Mock data for now - in production, this would come from database
  const loyaltyStats = {
    totalMembers: 234,
    activeMembers: 189,
    pointsIssued: 45600,
    rewardsRedeemed: 127,
    averagePointsPerMember: 195,
  };

  const tiers = [
    {
      name: 'Bronze',
      minPoints: 0,
      members: 145,
      color: 'bg-amber-100 text-amber-800',
      icon: Award,
      benefits: ['10% rabatt', 'Födelsedagserbjudande']
    },
    {
      name: 'Silver',
      minPoints: 500,
      members: 67,
      color: 'bg-gray-100 text-gray-800',
      icon: Star,
      benefits: ['15% rabatt', 'Prioriterad bokning', 'Gratis förrätt']
    },
    {
      name: 'Gold',
      minPoints: 1500,
      members: 18,
      color: 'bg-yellow-100 text-yellow-800',
      icon: TrendingUp,
      benefits: ['20% rabatt', 'VIP-behandling', 'Exklusiva event']
    },
    {
      name: 'Platinum',
      minPoints: 5000,
      members: 4,
      color: 'bg-purple-100 text-purple-800',
      icon: Zap,
      benefits: ['25% rabatt', 'Personlig service', 'Early access']
    }
  ];

  const recentActivity = [
    {
      id: 1,
      customer: 'Anna Andersson',
      action: 'Tjänade 150 poäng',
      timestamp: '2 timmar sedan',
      type: 'earned'
    },
    {
      id: 2,
      customer: 'Erik Johansson',
      action: 'Löste in 500 poäng för gratis huvudrätt',
      timestamp: '5 timmar sedan',
      type: 'redeemed'
    },
    {
      id: 3,
      customer: 'Maria Svensson',
      action: 'Uppgraderades till Silver',
      timestamp: 'Igår',
      type: 'tier_upgrade'
    },
    {
      id: 4,
      customer: 'Johan Berg',
      action: 'Tjänade 200 poäng (Födelsedagsbonus)',
      timestamp: 'Igår',
      type: 'earned'
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lojalitetsprogram</h1>
        <p className="text-gray-600">
          Belöna dina stamkunder och öka återkommande besök
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Totalt medlemmar</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loyaltyStats.totalMembers}
            </div>
            <p className="text-xs text-green-600 mt-1">
              +12% sedan förra månaden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Aktiva medlemmar</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loyaltyStats.activeMembers}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((loyaltyStats.activeMembers / loyaltyStats.totalMembers) * 100).toFixed(0)}% engagemang
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Poäng utdelade</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loyaltyStats.pointsIssued.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Denna månad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">Belöningar inlösta</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loyaltyStats.rewardsRedeemed}
            </div>
            <p className="text-xs text-green-600 mt-1">
              +8% vs förra månaden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-gray-600">Snitt poäng/medlem</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loyaltyStats.averagePointsPerMember}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Per aktiv medlem
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Medlemsnivåer</CardTitle>
            <CardDescription>Fördelning av kunder per tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tiers.map((tier) => (
              <div key={tier.name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tier.color}`}>
                      <tier.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                      <p className="text-xs text-gray-500">
                        {tier.minPoints}+ poäng
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{tier.members}</p>
                    <p className="text-xs text-gray-500">medlemmar</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700 mb-2">Fördelar:</p>
                  {tier.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      <span className="text-xs text-gray-600">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Senaste aktivitet</CardTitle>
            <CardDescription>Nya transaktioner och tier-uppgraderingar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'earned' 
                      ? 'bg-green-100' 
                      : activity.type === 'redeemed'
                      ? 'bg-blue-100'
                      : 'bg-purple-100'
                  }`}>
                    {activity.type === 'earned' ? (
                      <Star className={`h-4 w-4 ${
                        activity.type === 'earned' 
                          ? 'text-green-600' 
                          : activity.type === 'redeemed'
                          ? 'text-blue-600'
                          : 'text-purple-600'
                      }`} />
                    ) : activity.type === 'redeemed' ? (
                      <Gift className="h-4 w-4 text-blue-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.customer}
                    </p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Belöningskatalog</CardTitle>
              <CardDescription>Konfigurera tillgängliga belöningar</CardDescription>
            </div>
            <Button>
              <Gift className="h-4 w-4 mr-2" />
              Lägg till belöning
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { points: 200, reward: 'Gratis kaffe', icon: '☕', used: 45 },
              { points: 500, reward: 'Gratis förrätt', icon: '🍱', used: 32 },
              { points: 1000, reward: 'Gratis huvudrätt', icon: '🍽️', used: 28 },
              { points: 2000, reward: '50% rabatt på hela notan', icon: '💰', used: 12 },
              { points: 3000, reward: 'Champagne på huset', icon: '🍾', used: 8 },
              { points: 5000, reward: 'Privat matlagningskurs', icon: '👨‍🍳', used: 2 },
            ].map((reward, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{reward.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-1">{reward.reward}</h4>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="secondary">{reward.points} poäng</Badge>
                  <span className="text-gray-500">{reward.used} inlösta</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Program Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Programinställningar</CardTitle>
          <CardDescription>Konfigurera hur ditt lojalitetsprogram fungerar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Poäng per 100 kr spenderat</label>
              <input
                type="number"
                defaultValue={10}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Födelsedagsbonus (poäng)</label>
              <input
                type="number"
                defaultValue={100}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Referral bonus (poäng)</label>
              <input
                type="number"
                defaultValue={200}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Poäng utgår efter (dagar)</label>
              <input
                type="number"
                defaultValue={365}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button>Spara inställningar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

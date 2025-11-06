import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, MessageSquare, ThumbsUp, AlertTriangle, Award } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ReviewsPage() {
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

  // Mock data - in production, integrate with Google Reviews API
  const reviewStats = {
    totalReviews: 234,
    averageRating: 4.6,
    newThisMonth: 28,
    responseRate: 87,
    googleRating: 4.6,
    tripAdvisorRating: 4.5,
    facebookRating: 4.7,
  };

  const ratingDistribution = [
    { stars: 5, count: 165, percentage: 70 },
    { stars: 4, count: 47, percentage: 20 },
    { stars: 3, count: 12, percentage: 5 },
    { stars: 2, count: 7, percentage: 3 },
    { stars: 1, count: 3, percentage: 2 },
  ];

  const recentReviews = [
    {
      id: 1,
      customer: 'Anna Andersson',
      rating: 5,
      text: 'Fantastisk mat och service! Kommer definitivt tillbaka.',
      platform: 'Google',
      date: '2 dagar sedan',
      responded: true
    },
    {
      id: 2,
      customer: 'Erik Johansson',
      rating: 4,
      text: 'Mycket god mat men lite långsam service. Annars toppen!',
      platform: 'TripAdvisor',
      date: '5 dagar sedan',
      responded: false
    },
    {
      id: 3,
      customer: 'Maria Svensson',
      rating: 5,
      text: 'Bästa restaurangen i stan! Personalen är så trevlig.',
      platform: 'Facebook',
      date: '1 vecka sedan',
      responded: true
    },
    {
      id: 4,
      customer: 'Johan Berg',
      rating: 3,
      text: 'Ok mat men priset kändes lite högt.',
      platform: 'Google',
      date: '1 vecka sedan',
      responded: false
    },
  ];

  const automationStats = {
    requestsSent: 156,
    responsesReceived: 42,
    conversionRate: 27,
    averageTimeToRequest: '3 timmar',
  };

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recensionshantering</h1>
          <p className="text-gray-600">
            Automatisera insamling och hantering av kundrecensioner
          </p>
        </div>
        <Button>
          <Star className="h-4 w-4 mr-2" />
          Konfigurera automation
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-8 w-8 text-yellow-500" />
              <Badge variant="success" className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                +0.3
              </Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {reviewStats.averageRating.toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">Genomsnittligt betyg</p>
            <p className="text-xs text-gray-500 mt-1">
              Baserat på {reviewStats.totalReviews} recensioner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <Badge className="bg-blue-100 text-blue-800">
                +{reviewStats.newThisMonth}
              </Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {reviewStats.totalReviews}
            </div>
            <p className="text-sm text-gray-600">Totalt recensioner</p>
            <p className="text-xs text-gray-500 mt-1">
              {reviewStats.newThisMonth} nya denna månad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <ThumbsUp className="h-8 w-8 text-green-500" />
              <Badge variant="success" className="bg-green-100 text-green-800">
                Bra
              </Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {reviewStats.responseRate}%
            </div>
            <p className="text-sm text-gray-600">Svarsfrekvens</p>
            <p className="text-xs text-gray-500 mt-1">
              Du svarar på de flesta recensioner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-8 w-8 text-purple-500" />
              <Badge className="bg-purple-100 text-purple-800">
                Top 10%
              </Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {automationStats.conversionRate}%
            </div>
            <p className="text-sm text-gray-600">Konverteringsgrad</p>
            <p className="text-xs text-gray-500 mt-1">
              Begäranden som blir recensioner
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Betyg per plattform</CardTitle>
          <CardDescription>Dina recensioner på olika plattformar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">🔍</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Google</h3>
                  <p className="text-sm text-gray-500">182 recensioner</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {reviewStats.googleRating}
                </span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(reviewStats.googleRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Visa på Google
              </Button>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">✈️</div>
                <div>
                  <h3 className="font-semibold text-gray-900">TripAdvisor</h3>
                  <p className="text-sm text-gray-500">38 recensioner</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {reviewStats.tripAdvisorRating}
                </span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(reviewStats.tripAdvisorRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Visa på TripAdvisor
              </Button>
            </div>

            <div className="p-6 border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">📘</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Facebook</h3>
                  <p className="text-sm text-gray-500">14 recensioner</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {reviewStats.facebookRating}
                </span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(reviewStats.facebookRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Visa på Facebook
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Distribution & Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Betygfördelning</CardTitle>
            <CardDescription>Hur kunderna betygsätter er</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratingDistribution.map((rating) => (
              <div key={rating.stars}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-6">
                      {rating.stars}★
                    </span>
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${rating.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{rating.count}</span>
                    <span className="text-xs text-gray-400">({rating.percentage}%)</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 mt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">Sammanfattning:</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ThumbsUp className="h-4 w-4 text-green-600" />
                <span>
                  {ratingDistribution.slice(0, 2).reduce((sum, r) => sum + r.count, 0)} positiva recensioner (
                  {((ratingDistribution.slice(0, 2).reduce((sum, r) => sum + r.count, 0) / reviewStats.totalReviews) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Senaste recensioner</CardTitle>
            <CardDescription>Nya recensioner som behöver uppmärksamhet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{review.customer}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">• {review.platform}</span>
                      </div>
                    </div>
                    {review.responded ? (
                      <Badge variant="success" className="bg-green-100 text-green-800">
                        Besvarad
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Väntar
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{review.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{review.date}</span>
                    {!review.responded && (
                      <Button variant="outline" size="sm">
                        Svara
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Automatiserad insamling</CardTitle>
          <CardDescription>Prestanda för ditt automatiska review-system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Begäranden skickade</p>
              <p className="text-3xl font-bold text-gray-900">{automationStats.requestsSent}</p>
              <p className="text-xs text-gray-500 mt-1">Senaste 30 dagarna</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Svar mottagna</p>
              <p className="text-3xl font-bold text-gray-900">{automationStats.responsesReceived}</p>
              <p className="text-xs text-gray-500 mt-1">
                {automationStats.conversionRate}% konvertering
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Genomsnittlig tid</p>
              <p className="text-3xl font-bold text-gray-900">{automationStats.averageTimeToRequest}</p>
              <p className="text-xs text-gray-500 mt-1">Efter besöket</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Positiva recensioner</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.floor(automationStats.responsesReceived * 0.85)}
              </p>
              <p className="text-xs text-gray-500 mt-1">4-5 stjärnor</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  Så fungerar det automatiska systemet
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 3 timmar efter besök: SMS skickas med begäran om betyg (1-5)</li>
                  <li>• 4-5 stjärnor: Kunden dirigeras till Google Reviews</li>
                  <li>• 1-3 stjärnor: Privat feedback samlas in och chef notifieras</li>
                  <li>• Kompensation erbjuds automatiskt vid låga betyg</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function OnboardingPrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Card className="max-w-3xl w-full shadow-xl">
        <CardContent className="pt-12 pb-12">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Välkommen till MEDDELA! 🎉
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Låt oss sätta upp din SMS-plattform på bara några minuter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-600 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Skapa organisation</h3>
              <p className="text-sm text-gray-600">
                Lägg till din företagsinformation
              </p>
            </div>

            <div className="text-center p-6 bg-indigo-50 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-indigo-600 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Lägg till kontakter</h3>
              <p className="text-sm text-gray-600">
                Importera eller lägg till manuellt
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Skicka SMS</h3>
              <p className="text-sm text-gray-600">
                Börja kommunicera med kunder
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/onboarding">
              <Button size="lg" className="px-12 py-6 text-lg">
                <Sparkles className="h-5 w-5 mr-2" />
                Kom igång nu
              </Button>
            </Link>
            
            <p className="mt-4 text-sm text-gray-500">
              ✨ 14 dagars gratis provperiod • 🎁 100 gratis SMS • ❌ Inget kreditkort krävs
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

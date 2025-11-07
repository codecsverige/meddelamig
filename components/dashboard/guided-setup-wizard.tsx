'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { industryOptions, setupGoals, type SetupGoal } from '@/lib/setup/playbooks';

interface GuidedSetupWizardProps {
  isNewUser?: boolean;
}

type Step = 0 | 1 | 2 | 3;

interface SetupResult {
  contactsCreated: number;
  templatesCreated: number;
  campaignId: string | null;
}

export function GuidedSetupWizard({ isNewUser }: GuidedSetupWizardProps) {
  const [step, setStep] = useState<Step>(0);
  const [industry, setIndustry] = useState<string | null>(null);
  const [goal, setGoal] = useState<SetupGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SetupResult | null>(null);

  const reset = () => {
    setStep(0);
    setIndustry(null);
    setGoal(null);
    setError(null);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!industry || !goal) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, goal }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Ett fel inträffade.');
      }

      const data = (await response.json()) as SetupResult;
      setResult(data);
      setStep(3);
    } catch (err: any) {
      setError(err.message ?? 'Kunde inte slutföra snabbinställningen.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Välj vilken typ av verksamhet du driver
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {industryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setIndustry(option.value)}
                  className={`text-left rounded-lg border p-4 transition ${
                    industry === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Börja om
              </Button>
              <Button onClick={() => industry && setStep(1)} disabled={!industry}>
                Nästa
              </Button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Vad vill du uppnå just nu?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {setupGoals.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setGoal(item.value)}
                  className={`text-left rounded-lg border p-4 transition ${
                    goal === item.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Tillbaka
              </Button>
              <Button onClick={() => goal && setStep(2)} disabled={!goal}>
                Nästa
              </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Bekräfta snabbinställningen
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li>
                Vi lägger till 2–3 exempelkontakter med SMS-godkännande kopplat till
                verksamheten <strong>{industryOptions.find((opt) => opt.value === industry)?.label}</strong>.
              </li>
              <li>
                Vi skapar mallar och en kampanj anpassad för målet{' '}
                <strong>{setupGoals.find((opt) => opt.value === goal)?.title}</strong>.
              </li>
              <li>
                Du kan ändra eller ta bort allt i efterhand – detta är bara en snabb start.
              </li>
            </ul>
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Tillbaka
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Skapar innehåll…
                  </>
                ) : (
                  'Starta snabbinställning'
                )}
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          result && (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <Check className="h-5 w-5" />
                Snabbinställningen är klar!
              </div>
              <ul className="space-y-2">
                <li>
                  • {result.contactsCreated} kontakter lades till med relevanta etiketter.
                </li>
                <li>
                  • {result.templatesCreated} SMS-mallar skapades åt dig.
                </li>
                <li>
                  • En kampanj sparades som utkast – du kan aktivera den från kampanjsidan.
                </li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <LinkButton href="/contacts">Visa kontakter</LinkButton>
                <LinkButton href="/templates" variant="outline">
                  Visa mallar
                </LinkButton>
                <LinkButton href="/campaigns" variant="outline">
                  Hantera kampanj
                </LinkButton>
                <Button variant="ghost" onClick={reset}>
                  Kör igen
                </Button>
              </div>
            </div>
          )
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-2 border-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Snabbinställning
        </CardTitle>
        <CardDescription>
          Svara på två frågor så skapar vi kontakter, mallar och en första kampanj åt dig.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
          Steg {step + 1} av 4
        </div>

        {renderStep()}

        {!result && (
          <p className="text-xs text-gray-500">
            {isNewUser
              ? 'Perfekt om du precis startat kontot.'
              : 'Du kan alltid köra snabbinställningen igen för ett nytt fokus.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LinkButton({
  href,
  children,
  variant = 'default',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline';
}) {
  const classes =
    variant === 'outline'
      ? 'border border-blue-200 text-blue-600 hover:bg-blue-50'
      : 'bg-blue-600 text-white hover:bg-blue-700';

  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${classes}`}
    >
      {children}
    </a>
  );
}

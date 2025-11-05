'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const industries: Array<{ value: 'restaurant' | 'salon' | 'workshop' | 'b2b'; label: string; emoji: string }> = [
  { value: 'restaurant', label: 'Restaurang', emoji: '🍽️' },
  { value: 'salon', label: 'Salong', emoji: '💇' },
  { value: 'workshop', label: 'Verkstad', emoji: '🔧' },
  { value: 'b2b', label: 'B2B / Leverantör', emoji: '📦' },
];

export default function OnboardingForm() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState<'restaurant' | 'salon' | 'workshop' | 'b2b'>('restaurant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          industry,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Kunde inte skapa organisation');
      }

      router.push('/dashboard?welcome=onboarding');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Din organisation</h2>
        <p className="mt-1 text-sm text-gray-600">
          Vi använder den här informationen för att skapa din arbetsyta och anpassa mallarna.
        </p>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-sm text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
          Företagsnamn
        </label>
        <input
          id="organizationName"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          placeholder="Exempelvis: Salong Bella AB"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500">Namnet kan ändras senare från inställningar.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
          Bransch
        </label>
        <select
          id="industry"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={industry}
          onChange={(event) => setIndustry(event.target.value as typeof industry)}
          required
        >
          {industries.map((option) => (
            <option key={option.value} value={option.value}>
              {option.emoji} {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Skapar organisation...' : 'Skapa och fortsätt'}
      </button>
    </form>
  );
}

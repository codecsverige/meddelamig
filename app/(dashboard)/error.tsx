'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ett fel uppstod
        </h2>
        
        <p className="text-gray-600 mb-6">
          Kunde inte ladda denna sida. Vänligen försök igen.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 text-left">
            <p className="text-xs text-red-800 font-mono break-all">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-red-700 cursor-pointer">Stack trace</summary>
                <pre className="text-xs text-red-600 mt-2 overflow-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            Försök igen
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/dashboard')}
            className="w-full"
          >
            Tillbaka till översikten
          </Button>
        </div>
      </div>
    </div>
  );
}

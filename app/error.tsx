'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Något gick fel
        </h1>
        
        <p className="text-gray-600 mb-6">
          Ett oväntat fel uppstod. Vänligen försök igen eller kontakta support om problemet kvarstår.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
            <p className="text-xs text-gray-700 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={reset} className="flex-1">
            Försök igen
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/dashboard')}
            className="flex-1"
          >
            Till startsidan
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Felkod: {error.digest || 'UNKNOWN'}
        </p>
      </div>
    </div>
  );
}

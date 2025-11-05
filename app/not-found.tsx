import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <div className="relative -mt-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Sidan kunde inte hittas
        </h2>
        
        <p className="text-gray-600 mb-8">
          Vi kunde inte hitta sidan du letade efter. Den kan ha flyttats eller tagits bort.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Till startsidan
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">
              Till hemsidan
            </Button>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Behöver du hjälp? Kontakta vår support:</p>
          <a href="mailto:support@meddelasms.se" className="text-blue-600 hover:underline">
            support@meddelasms.se
          </a>
        </div>
      </div>
    </div>
  );
}

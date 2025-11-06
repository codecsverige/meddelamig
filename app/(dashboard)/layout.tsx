'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Send, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  Calendar
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface User {
  full_name: string;
  email: string;
  organizations: {
    name: string;
    plan: string;
    sms_credits: number;
  };
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/login';
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('*, organizations(*)')
        .eq('id', session.user.id)
        .single();

      setUser(data as User);
    };

    fetchUser();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navigation = [
    { name: '🌹 Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: '🍽️ Restaurant Hub', href: '/restaurant', icon: Star },
    { name: '⚡ Automatiseringar', href: '/automation', icon: Zap },
    { name: 'Kontakter', href: '/contacts', icon: Users },
    { name: 'Meddelanden', href: '/messages', icon: MessageSquare },
    { name: 'Kampanjer', href: '/campaigns', icon: Send },
    { name: 'Mallar', href: '/templates', icon: MessageSquare },
    { name: 'Analys', href: '/analytics', icon: BarChart3 },
    { name: 'Inställningar', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>

        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <span className="font-bold text-xl text-gray-900">MEDDELA</span>
          </Link>
        </div>

        {/* Organization Info */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.organizations?.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-white rounded-full text-blue-700 font-medium">
                  {user.organizations?.plan?.toUpperCase()}
                </span>
                <span className="text-xs text-gray-600">
                  {user.organizations?.sms_credits} SMS
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        {user && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logga ut
              </button>
            </form>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          
          <div className="flex-1 flex items-center justify-between">
            {/* Mobile Logo */}
            <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
              <span className="text-xl">📱</span>
              <span className="font-bold text-lg text-gray-900">MEDDELA</span>
            </Link>
            
            <div className="flex-1 lg:flex-none"></div>
            
            {/* Credits Badge - Always visible */}
            {user && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                <span className="text-xs font-medium text-blue-700">
                  {user.organizations?.sms_credits} SMS
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="min-h-[calc(100vh-4rem)]">{children}</div>
      </main>
    </div>
  );
}

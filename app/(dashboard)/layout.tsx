import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Send, 
  BarChart3, 
  Settings,
  LogOut,
  Menu
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('*, organizations(*)')
    .eq('id', session.user.id)
    .single();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Kontakter', href: '/contacts', icon: Users },
    { name: 'Meddelanden', href: '/messages', icon: MessageSquare },
    { name: 'Kampanjer', href: '/campaigns', icon: Send },
    { name: 'Analys', href: '/analytics', icon: BarChart3 },
    { name: 'Inställningar', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <span className="font-bold text-xl text-gray-900">MEDDELA</span>
          </Link>
        </div>

        {/* Organization Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.organizations?.name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-white rounded-full text-blue-700 font-medium">
                {user?.organizations?.plan?.toUpperCase()}
              </span>
              <span className="text-xs text-gray-600">
                {user?.organizations?.sms_credits} SMS
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <button className="lg:hidden mr-4">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1"></div>
          {/* Future: Notifications, Search, etc */}
        </header>

        {/* Page Content */}
        <div className="min-h-[calc(100vh-4rem)]">{children}</div>
      </main>
    </div>
  );
}

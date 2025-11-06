'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageSquare, Search, Filter, Download, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { displayPhoneNumber } from '@/lib/utils/phone';

type Message = {
  id: string;
  to_phone: string;
  message: string;
  sender_name: string;
  type: string;
  status: string;
  cost: number | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  contacts: {
    name: string;
    phone: string;
  } | null;
};

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchQuery, selectedStatus, selectedType, dateRange]);

  const loadMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: user } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) {
        router.push('/onboarding');
        return;
      }

      const { data, error } = await supabase
        .from('sms_messages')
        .select('*, contacts(name, phone)')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(msg =>
        msg.message.toLowerCase().includes(query) ||
        msg.to_phone.includes(query) ||
        msg.contacts?.name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(msg => msg.status === selectedStatus);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(msg => msg.type === selectedType);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(msg => new Date(msg.created_at) >= filterDate);
    }

    setFilteredMessages(filtered);
  };

  const exportToCSV = () => {
    const csvData = filteredMessages.map(msg => ({
      Datum: new Date(msg.created_at).toLocaleString('sv-SE'),
      Mottagare: msg.contacts?.name || 'Okänd',
      Telefon: msg.to_phone,
      Meddelande: msg.message,
      Status: msg.status,
      Typ: msg.type,
      Kostnad: msg.cost || 0,
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate stats
  const stats = {
    total: messages.length,
    delivered: messages.filter(m => m.status === 'delivered').length,
    failed: messages.filter(m => m.status === 'failed').length,
    pending: messages.filter(m => m.status === 'pending').length,
    totalCost: messages.reduce((sum, m) => sum + (m.cost || 0), 0),
  };

  const deliveryRate = stats.total > 0 
    ? ((stats.delivered / stats.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meddelanden</h1>
          <p className="text-gray-600">Alla dina skickade SMS-meddelanden</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={filteredMessages.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
          <Link href="/messages/send">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Skicka SMS
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Totalt skickade</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Levererade</p>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                <p className="text-xs text-green-600 mt-1">{deliveryRate}% leveransfrekvens</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Misslyckade</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total kostnad</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCost.toFixed(2)} SEK</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Sök meddelanden..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alla statusar</option>
              <option value="delivered">Levererad</option>
              <option value="sent">Skickad</option>
              <option value="pending">Väntande</option>
              <option value="failed">Misslyckad</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alla typer</option>
              <option value="manual">Manuell</option>
              <option value="marketing">Marknadsföring</option>
              <option value="reminder">Påminnelse</option>
              <option value="confirmation">Bekräftelse</option>
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All tid</option>
              <option value="today">Idag</option>
              <option value="week">Senaste veckan</option>
              <option value="month">Senaste månaden</option>
            </select>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || selectedStatus !== 'all' || selectedType !== 'all' || dateRange !== 'all') && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>
                Visar {filteredMessages.length} av {messages.length} meddelanden
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedType('all');
                  setDateRange('all');
                }}
                className="text-blue-600 hover:text-blue-700 ml-2"
              >
                Rensa filter
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Laddar meddelanden...</p>
        </div>
      ) : filteredMessages.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>SMS-historik ({filteredMessages.length})</CardTitle>
            <CardDescription>Alla dina skickade meddelanden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMessages.map(message => (
                <div
                  key={message.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {(message.contacts?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {message.contacts?.name || 'Okänd kontakt'}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleString('sv-SE')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {displayPhoneNumber(message.to_phone)}
                    </p>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {message.message}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          message.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : message.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : message.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.status === 'delivered'
                          ? '✅ Levererad'
                          : message.status === 'sent'
                          ? '📤 Skickad'
                          : message.status === 'failed'
                          ? '❌ Misslyckad'
                          : '⏳ Väntande'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {message.type === 'manual' ? '✍️ Manuell' 
                          : message.type === 'marketing' ? '📢 Marknadsföring'
                          : message.type === 'reminder' ? '⏰ Påminnelse'
                          : '✅ Bekräftelse'}
                      </span>
                      {message.cost && (
                        <span className="text-xs text-gray-500">
                          💰 {parseFloat(message.cost.toString()).toFixed(2)} SEK
                        </span>
                      )}
                      {message.delivered_at && (
                        <span className="text-xs text-gray-500">
                          Levererad: {new Date(message.delivered_at).toLocaleTimeString('sv-SE')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : messages.length > 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Filter className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga meddelanden matchade filtren
              </h3>
              <p className="mb-6">Prova att ändra eller rensa dina filter</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedType('all');
                  setDateRange('all');
                }}
              >
                Rensa alla filter
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga meddelanden ännu
              </h3>
              <p className="mb-6">Skicka ditt första SMS för att komma igång</p>
              <Link href="/messages/send">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Skicka SMS
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

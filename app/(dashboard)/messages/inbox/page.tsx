'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { displayPhoneNumber } from '@/lib/utils/phone';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, ArrowUpRight, Loader2, MessageSquare, RefreshCw, Send, Inbox } from 'lucide-react';

type MessageDirection = 'outbound' | 'inbound';

type ConversationMessage = {
  id: string;
  contact_id: string | null;
  message: string;
  created_at: string;
  direction: MessageDirection;
  status: string;
  delivered_at: string | null;
  sent_at: string | null;
  cost: number | null;
  user_id: string | null;
};

type ConversationContact = {
  conversationKey: string;
  contact_id: string | null;
  contact_name: string;
  contact_phone: string;
};

type ConversationRow = ConversationContact & {
  messages: ConversationMessage[];
  lastMessageAt: string;
  hasInboundAfterOutbound: boolean;
};

export default function InboxPage() {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeThreadKey, setActiveThreadKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loggingInbound, setLoggingInbound] = useState(false);
  const [inboundMessage, setInboundMessage] = useState('');

  const activeConversation = useMemo(() => {
    if (!activeThreadKey) return null;
    return conversations.find((c) => c.conversationKey === activeThreadKey) ?? null;
  }, [conversations, activeThreadKey]);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;
      if (!userRow?.organization_id) {
        router.push('/onboarding');
        return;
      }

      setOrganizationId(userRow.organization_id);

      const { data: smsRows, error: smsError } = await supabase
        .from('sms_messages')
        .select(
          `
            id,
            organization_id,
            contact_id,
            to_phone,
            message,
            created_at,
            direction,
            status,
            delivered_at,
            sent_at,
            cost,
            user_id,
            contacts (
              id,
              name,
              phone
            )
          `,
        )
        .eq('organization_id', userRow.organization_id)
        .order('created_at', { ascending: true })
        .limit(500);

      if (smsError) throw smsError;

      const grouped = new Map<string, ConversationRow>();

      (smsRows || []).forEach((row: any) => {
        const key: string =
          row.contact_id ??
          `unknown-${row.contacts?.phone ?? row.to_phone ?? 'no-contact'}`;

        if (!grouped.has(key)) {
          const contact: ConversationContact = {
            conversationKey: key,
            contact_id: row.contact_id,
            contact_name: row.contacts?.name ?? 'Okänd kontakt',
            contact_phone: row.contacts?.phone ?? row.to_phone ?? 'Okänt nummer',
          };

          grouped.set(key, {
            ...contact,
            messages: [],
            lastMessageAt: row.created_at,
            hasInboundAfterOutbound: false,
          });
        }

        const convo = grouped.get(key)!;
        const message: ConversationMessage = {
          id: row.id,
          contact_id: row.contact_id,
          message: row.message,
          created_at: row.created_at,
          direction: row.direction ?? 'outbound',
          status: row.status,
          delivered_at: row.delivered_at,
          sent_at: row.sent_at,
          cost: row.cost,
          user_id: row.user_id,
        };

        convo.messages.push(message);
        if (new Date(row.created_at) > new Date(convo.lastMessageAt)) {
          convo.lastMessageAt = row.created_at;
        }
      });

      const prepared = Array.from(grouped.values()).map((convo) => {
        const latestInbound = [...convo.messages]
          .reverse()
          .find((msg) => msg.direction === 'inbound');
        const latestOutbound = [...convo.messages]
          .reverse()
          .find((msg) => msg.direction === 'outbound');

        const hasInboundAfterOutbound =
          !!latestInbound &&
          (!latestOutbound ||
            new Date(latestInbound.created_at) > new Date(latestOutbound.created_at));

        return {
          ...convo,
          hasInboundAfterOutbound,
        };
      });

      prepared.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );

      setConversations(prepared);

      if (!activeThreadKey && prepared.length > 0) {
        setActiveThreadKey(prepared[0].conversationKey);
      }
    } catch (error) {
      console.error('Failed to load inbox:', error);
      showToast('Kunde inte ladda inkorgen', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    loadConversations();
  };

  const handleSendMessage = async () => {
    if (!activeConversation?.contact_id || !newMessage.trim()) {
      showToast('Välj en kontakt och skriv ett meddelande först', 'warning');
      return;
    }

    try {
      setSending(true);
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: activeConversation.contact_id,
          message: newMessage.trim(),
          messageType: 'manual',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Kunde inte skicka SMS');
      }

      setNewMessage('');
      showToast('Meddelandet skickades', 'success');
      await loadConversations();
    } catch (error) {
      console.error('Failed to send SMS:', error);
      showToast(error instanceof Error ? error.message : 'Kunde inte skicka SMS', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleLogInbound = async () => {
    if (!activeConversation?.contact_id || !organizationId) {
      showToast('Välj en kontakt först', 'warning');
      return;
    }
    if (!inboundMessage.trim()) {
      showToast('Skriv meddelandet först', 'warning');
      return;
    }

    try {
      setLoggingInbound(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const contactPhone = activeConversation.contact_phone;

      const { error } = await supabase.from('sms_messages').insert({
        organization_id: organizationId,
        contact_id: activeConversation.contact_id,
        user_id: session?.user.id ?? null,
        to_phone: contactPhone,
        from_phone: contactPhone,
        message: inboundMessage.trim(),
        sender_name: activeConversation.contact_name,
        type: 'manual',
        direction: 'inbound',
        status: 'received',
        cost: 0,
      });

      if (error) throw error;

      setInboundMessage('');
      showToast('Inkommande SMS sparat', 'success');
      await loadConversations();
    } catch (error) {
      console.error('Failed to log inbound SMS:', error);
      showToast('Kunde inte spara inkommande SMS', 'error');
    } finally {
      setLoggingInbound(false);
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Laddar inkorg...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Inbox className="h-7 w-7 text-indigo-600" />
            Inkorg
          </h1>
          <p className="text-gray-600">
            Följ inkommande svar och fortsätt dialogen utan att lämna Meddela.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          <Link href="/messages">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Till listan
            </Button>
          </Link>
        </div>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inga konversationer ännu
            </h3>
            <p className="max-w-md mx-auto">
              När någon svarar på dina SMS eller du loggar inkommande meddelanden manuellt
              visas de här.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <Card className="h-[calc(100vh-12rem)] xl:h-[calc(100vh-10rem)] overflow-hidden">
            <CardHeader className="px-4 py-4 border-b">
              <CardTitle className="text-base font-semibold text-gray-900">
                Konversationer
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                {conversations.length} {conversations.length === 1 ? 'kontakt' : 'kontakter'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-full overflow-y-auto">
              <div className="divide-y divide-gray-200">
                  {conversations.map((conversation) => {
                    const isActive = conversation.conversationKey === activeThreadKey;
                  return (
                    <button
                        key={conversation.conversationKey}
                        onClick={() => setActiveThreadKey(conversation.conversationKey)}
                      className={`w-full px-4 py-4 text-left transition-colors ${
                        isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            {conversation.contact_name}
                            {conversation.hasInboundAfterOutbound && (
                              <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                                Nytt svar
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {displayPhoneNumber(conversation.contact_phone)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(conversation.lastMessageAt).toLocaleDateString('sv-SE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {conversation.messages[conversation.messages.length - 1]?.message}
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="h-[calc(100vh-12rem)] xl:h-[calc(100vh-10rem)] overflow-hidden flex flex-col">
            {activeConversation ? (
              <>
                <CardHeader className="px-6 py-5 border-b">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {activeConversation.contact_name}
                    <span className="text-xs font-medium text-gray-500">
                      {displayPhoneNumber(activeConversation.contact_phone)}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    {activeConversation.messages.length} meddelanden i tråden
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 via-white to-gray-50">
                  {activeConversation.messages.map((message) => {
                    const isInbound = message.direction === 'inbound';
                    const alignClass = isInbound ? 'justify-start' : 'justify-end';
                    const bubbleClass = isInbound
                      ? 'bg-white text-gray-900 border border-indigo-100'
                      : 'bg-indigo-600 text-white';
                    const timestamp = new Date(message.created_at).toLocaleTimeString('sv-SE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const statusLabel = isInbound
                      ? 'Mottaget'
                      : message.status === 'delivered'
                      ? 'Levererad'
                      : message.status === 'failed'
                      ? 'Misslyckad'
                      : message.status === 'sent'
                      ? 'Skickad'
                      : 'Väntande';

                    return (
                      <div
                        key={message.id}
                        className={`flex ${alignClass}`}
                      >
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${bubbleClass}`}>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          <div className="mt-2 text-[10px] flex items-center justify-between gap-3 opacity-80">
                            <span>{timestamp}</span>
                            <span>{statusLabel}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>

                <div className="border-t border-gray-200 bg-white p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_200px] gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Skicka svar
                      </label>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={3}
                        className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="Skriv ett svar som skickas via SMS..."
                      />
                      {!activeConversation.contact_id && (
                        <p className="mt-2 text-xs text-amber-600">
                          Denna konversation saknar kopplad kontakt i databasen. Lägg till kontakten för att kunna skicka SMS härifrån.
                        </p>
                      )}
                      <div className="mt-2 flex justify-end">
                        <Button
                          onClick={handleSendMessage}
                          disabled={
                            sending ||
                            !newMessage.trim() ||
                            !activeConversation.contact_id
                          }
                        >
                          {sending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Skickar...
                            </>
                          ) : (
                            <>
                              Skicka SMS
                              <Send className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Logga inkommande SMS
                      </label>
                      <textarea
                        value={inboundMessage}
                        onChange={(e) => setInboundMessage(e.target.value)}
                        rows={3}
                        className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="Klistra in svaret som kom via telefon eller annan kanal..."
                      />
                      {!activeConversation.contact_id && (
                        <p className="mt-2 text-xs text-amber-600">
                          Koppla tråden till en kontakt för att kunna logga inkommande SMS mot kundkortet.
                        </p>
                      )}
                      <div className="mt-2 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setInboundMessage('');
                          }}
                        >
                          Rensa
                        </Button>
                        <Button
                          onClick={handleLogInbound}
                            disabled={
                              loggingInbound ||
                              !inboundMessage.trim() ||
                              !activeConversation.contact_id
                            }
                          variant="secondary"
                        >
                          {loggingInbound ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sparar...
                            </>
                          ) : (
                            <>
                              Logga svar
                              <ArrowUpRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center space-y-3">
                  <MessageSquare className="h-14 w-14 mx-auto opacity-40" />
                  <p className="text-sm">Välj en kontakt i listan till vänster för att se historiken.</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

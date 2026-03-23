import { useState, useEffect } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';

interface ChatPair {
  user1Id: string;
  user2Id: string;
  user1Name: string;
  user2Name: string;
  messageCount: number;
  lastMessage: string;
  lastAt: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

interface Props {
  searchQuery: string;
}

export default function AdminChatsTab({ searchQuery }: Props) {
  const { language } = useApp();
  const [pairs, setPairs] = useState<ChatPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPair, setSelectedPair] = useState<ChatPair | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => { loadChats(); }, []);

  const loadChats = async () => {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) {
        setPairs([]);
        setLoading(false);
        return;
      }

      const convMap = new Map<string, { msgs: any[]; user1: string; user2: string }>();
      data.forEach(m => {
        const key = [m.sender_id, m.receiver_id].sort().join('-');
        if (!convMap.has(key)) {
          const sorted = [m.sender_id, m.receiver_id].sort();
          convMap.set(key, { msgs: [], user1: sorted[0], user2: sorted[1] });
        }
        convMap.get(key)!.msgs.push(m);
      });

      const allUserIds = new Set<string>();
      convMap.forEach(v => { allUserIds.add(v.user1); allUserIds.add(v.user2); });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', [...allUserIds]);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      const pairList: ChatPair[] = [];
      convMap.forEach(v => {
        pairList.push({
          user1Id: v.user1,
          user2Id: v.user2,
          user1Name: profileMap.get(v.user1) || 'User',
          user2Name: profileMap.get(v.user2) || 'User',
          messageCount: v.msgs.length,
          lastMessage: v.msgs[0].message,
          lastAt: v.msgs[0].created_at,
        });
      });

      setPairs(pairList);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (pair: ChatPair) => {
    setSelectedPair(pair);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`and(sender_id.eq.${pair.user1Id},receiver_id.eq.${pair.user2Id}),and(sender_id.eq.${pair.user2Id},receiver_id.eq.${pair.user1Id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const filtered = pairs.filter(p =>
    p.user1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user2Name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <Badge variant="secondary">{pairs.length} {t('admin.conversations', language)}</Badge>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('chat.noConversations', language)}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(pair => (
            <button
              key={`${pair.user1Id}-${pair.user2Id}`}
              onClick={() => loadMessages(pair)}
              className={`w-full bg-card rounded-xl p-4 shadow-card text-left hover:bg-muted/50 transition-colors ${selectedPair?.user1Id === pair.user1Id && selectedPair?.user2Id === pair.user2Id ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{pair.user1Name} ↔ {pair.user2Name}</p>
                <Badge variant="outline">{pair.messageCount}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{pair.lastMessage}</p>
            </button>
          ))}
        </div>
      )}

      {selectedPair && messages.length > 0 && (
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="p-3 border-b">
            <p className="font-semibold text-sm">{selectedPair.user1Name} ↔ {selectedPair.user2Name}</p>
          </div>
          <ScrollArea className="max-h-96 p-4">
            <div className="space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === selectedPair.user1Id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] rounded-xl px-3 py-2 break-words overflow-hidden ${msg.sender_id === selectedPair.user1Id ? 'bg-muted' : 'bg-primary/10'}`}>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      {msg.sender_id === selectedPair.user1Id ? selectedPair.user1Name : selectedPair.user2Name}
                    </p>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

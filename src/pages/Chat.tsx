import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, ArrowLeft, MessageCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

interface ChatContact {
  userId: string;
  name: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Chat() {
  const { language, setAuthModalOpen, setAuthModalMode } = useApp();
  const { isAuthenticated, user, profile } = useAuthContext();
  const [searchParams] = useSearchParams();
  const toUserId = searchParams.get('to');
  const isAdmin = profile?.role === 'admin';

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(toUserId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load contacts
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    loadContacts();
  }, [isAuthenticated, user]);

  // Load messages when contact selected
  useEffect(() => {
    if (!selectedContact || !user) return;
    loadMessages(selectedContact);

    // Mark as read
    supabase.from('chat_messages')
      .update({ is_read: true })
      .eq('sender_id', selectedContact)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      .then();
  }, [selectedContact, user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.receiver_id === user.id ||
            (isAdmin)) {
          if (selectedContact && (msg.sender_id === selectedContact || msg.receiver_id === selectedContact || msg.sender_id === user.id)) {
            setMessages(prev => [...prev, msg]);
          }
          loadContacts();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedContact, isAdmin]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If toUserId is set, ensure contact exists
  useEffect(() => {
    if (toUserId && user && toUserId !== user.id) {
      setSelectedContact(toUserId);
    }
  }, [toUserId, user]);

  const loadContacts = async () => {
    if (!user) return;
    try {
      let query;
      if (isAdmin) {
        // Admin sees all conversations
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data) {
          const userIds = new Set<string>();
          const convMap = new Map<string, { lastMsg: string; lastAt: string; unread: number }>();
          
          // Group by conversation pairs
          data.forEach(m => {
            const key = [m.sender_id, m.receiver_id].sort().join('-');
            if (!convMap.has(key)) {
              convMap.set(key, { lastMsg: m.message, lastAt: m.created_at, unread: 0 });
            }
            userIds.add(m.sender_id);
            userIds.add(m.receiver_id);
          });

          // For admin, show each unique user
          const allUserIds = [...userIds].filter(id => id !== user.id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', allUserIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
          
          const contactList: ChatContact[] = allUserIds.map(uid => {
            const p = profileMap.get(uid);
            const relevantMsgs = data.filter(m => m.sender_id === uid || m.receiver_id === uid);
            const lastMsg = relevantMsgs[0];
            return {
              userId: uid,
              name: p?.full_name || 'User',
              avatarUrl: p?.avatar_url || null,
              lastMessage: lastMsg?.message || '',
              lastMessageAt: lastMsg?.created_at || '',
              unreadCount: 0,
            };
          });
          setContacts(contactList);
        }
      } else {
        // Regular user
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (data) {
          const contactIds = new Set<string>();
          data.forEach(m => {
            if (m.sender_id !== user.id) contactIds.add(m.sender_id);
            if (m.receiver_id !== user.id) contactIds.add(m.receiver_id);
          });

          const ids = [...contactIds];
          if (ids.length === 0 && toUserId) {
            ids.push(toUserId);
          }

          if (ids.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, full_name, avatar_url')
              .in('user_id', ids);

            const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

            const contactList: ChatContact[] = ids.map(uid => {
              const p = profileMap.get(uid);
              const msgs = data.filter(m => m.sender_id === uid || m.receiver_id === uid);
              const lastMsg = msgs[0];
              const unread = data.filter(m => m.sender_id === uid && m.receiver_id === user.id && !m.is_read).length;
              return {
                userId: uid,
                name: p?.full_name || 'User',
                avatarUrl: p?.avatar_url || null,
                lastMessage: lastMsg?.message || '',
                lastMessageAt: lastMsg?.created_at || '',
                unreadCount: unread,
              };
            });
            setContacts(contactList);
          } else {
            setContacts([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (contactId: string) => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      setMessages(data || []);

      // If contact not in list, load their profile
      if (!contacts.find(c => c.userId === contactId)) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .eq('user_id', contactId)
          .single();

        if (profileData) {
          setContacts(prev => {
            if (prev.find(c => c.userId === contactId)) return prev;
            return [...prev, {
              userId: contactId,
              name: profileData.full_name,
              avatarUrl: profileData.avatar_url,
              lastMessage: '',
              lastMessageAt: '',
              unreadCount: 0,
            }];
          });
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from('chat_messages').insert({
        sender_id: user.id,
        receiver_id: selectedContact,
        message: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Send className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('nav.chat', language)}</h1>
            <p className="text-muted-foreground mb-8">{t('chat.loginPrompt', language)}</p>
            <Button variant="hero" onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}>{t('nav.login', language)}</Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const selectedContactInfo = contacts.find(c => c.userId === selectedContact);

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="bg-card rounded-2xl shadow-card overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
            <div className="flex h-full">
              {/* Contacts sidebar */}
              <div className={`w-full md:w-80 border-r flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b">
                  <h2 className="text-lg font-serif font-bold">{t('nav.chat', language)}</h2>
                  {isAdmin && <p className="text-xs text-muted-foreground mt-1">{t('admin.viewOnly', language)}</p>}
                </div>
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t('chat.noConversations', language)}</p>
                    </div>
                  ) : (
                    contacts.map(contact => (
                      <button
                        key={contact.userId}
                        onClick={() => setSelectedContact(contact.userId)}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b ${selectedContact === contact.userId ? 'bg-muted/50' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {contact.avatarUrl ? (
                            <img src={contact.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium">{contact.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{contact.name}</p>
                            {contact.unreadCount > 0 && (
                              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
                                {contact.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                        </div>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Chat area */}
              <div className={`flex-1 flex flex-col ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
                {selectedContact ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b flex items-center gap-3">
                      <button onClick={() => setSelectedContact(null)} className="md:hidden">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {selectedContactInfo?.avatarUrl ? (
                          <img src={selectedContactInfo.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium">{selectedContactInfo?.name?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      <p className="font-medium">{selectedContactInfo?.name || t('chat.loading', language)}</p>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        {messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              <p className="text-sm">{msg.message}</p>
                              <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    {!isAdmin && (
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            placeholder={t('chat.typePlaceholder', language)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                          />
                          <Button onClick={handleSend} disabled={!newMessage.trim() || sending} size="icon">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">{t('chat.selectConversation', language)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

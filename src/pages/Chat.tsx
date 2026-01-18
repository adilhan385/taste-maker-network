import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Search, MoreVertical, Phone, Video, Image } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
}

interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

const sampleContacts: ChatContact[] = [
  {
    id: 'chef-1',
    name: 'Aisha K.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop',
    lastMessage: 'Your order is almost ready!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 'chef-2',
    name: 'Rustam M.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
    lastMessage: 'Thank you for your order!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60),
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 'support',
    name: 'ChefCook Support',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop',
    lastMessage: 'How can we help you today?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unreadCount: 0,
    isOnline: true,
  },
];

const sampleMessages: Record<string, Message[]> = {
  'chef-1': [
    { id: '1', senderId: 'chef-1', text: 'Hi! I received your order for Beshbarmak.', timestamp: new Date(Date.now() - 1000 * 60 * 30), isRead: true },
    { id: '2', senderId: 'user', text: 'Great! How long will it take?', timestamp: new Date(Date.now() - 1000 * 60 * 25), isRead: true },
    { id: '3', senderId: 'chef-1', text: 'About 45 minutes. I\'m using fresh lamb today!', timestamp: new Date(Date.now() - 1000 * 60 * 20), isRead: true },
    { id: '4', senderId: 'user', text: 'Sounds delicious, thank you!', timestamp: new Date(Date.now() - 1000 * 60 * 15), isRead: true },
    { id: '5', senderId: 'chef-1', text: 'Your order is almost ready!', timestamp: new Date(Date.now() - 1000 * 60 * 5), isRead: false },
  ],
  'chef-2': [
    { id: '1', senderId: 'chef-2', text: 'Your plov was delivered. Enjoy!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), isRead: true },
    { id: '2', senderId: 'user', text: 'It was amazing! Thank you so much!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), isRead: true },
    { id: '3', senderId: 'chef-2', text: 'Thank you for your order!', timestamp: new Date(Date.now() - 1000 * 60 * 60), isRead: true },
  ],
  'support': [
    { id: '1', senderId: 'support', text: 'Welcome to ChefCook! How can we help you today?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), isRead: true },
  ],
};

export default function Chat() {
  const { user, isAuthenticated, setAuthModalOpen, setAuthModalMode, language } = useApp();
  const [selectedContact, setSelectedContact] = useState<string | null>('chef-1');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Record<string, Message[]>>(sampleMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedContact, messages]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Send className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-4">{t('nav.chat', language)}</h1>
            <p className="text-muted-foreground mb-8">
              Please log in to access your messages
            </p>
            <Button 
              variant="hero" 
              onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
            >
              {t('nav.login', language)}
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedContact) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      text: messageInput,
      timestamp: new Date(),
      isRead: true,
    };

    setMessages(prev => ({
      ...prev,
      [selectedContact]: [...(prev[selectedContact] || []), newMessage],
    }));
    setMessageInput('');
  };

  const selectedContactData = sampleContacts.find(c => c.id === selectedContact);
  const filteredContacts = sampleContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Contacts Sidebar */}
        <div className="w-full md:w-80 lg:w-96 border-r flex flex-col bg-background">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selectedContact === contact.id ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {contact.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{contact.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {contact.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                      {contact.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-1 flex-col">
          {selectedContact && selectedContactData ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={selectedContactData.avatar}
                      alt={selectedContactData.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {selectedContactData.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedContactData.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedContactData.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {(messages[selectedContact] || []).map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          message.senderId === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Image className="w-5 h-5" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button variant="hero" size="icon" onClick={handleSendMessage}>
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

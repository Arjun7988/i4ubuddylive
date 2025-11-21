import { useState, useRef, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Send, User, Trash2, Pin, Shield } from 'lucide-react';
import { GradientButton } from '../components/GradientButton';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface ChatMessage {
  id: string;
  user_id: string | null;
  message: string;
  created_at: string;
  is_pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  admin_name: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export function ChatBotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2', 'ring-offset-background');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2', 'ring-offset-background');
      }, 2000);
    }
  };

  const pinnedMessages = messages.filter(m => m.is_pinned);
  const regularMessages = messages;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    loadMessages();
    checkAdminStatus();

    const subscription = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('New message received:', payload);
          loadMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('Message deleted:', payload);
          loadMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('Message updated:', payload);
          loadMessages();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          message,
          created_at,
          is_pinned,
          pinned_at,
          pinned_by,
          admin_name,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from('chat_messages').insert({
        user_id: user.id,
        message: inputMessage.trim(),
      });

      if (error) throw error;
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

        <main className="relative flex-1 pt-[calc(128px+50px)] px-4 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-heading font-bold text-white mb-4">
                Public Chat
              </h1>
              <p className="text-xl text-gray-400">
                Connect with the i4uBuddy community in real-time
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-primary-500/10 to-transparent border border-primary-500/30 rounded-2xl p-8">
                <div className="inline-block p-3 bg-gradient-to-br from-primary-500/20 to-blue-500/20 rounded-2xl mb-6">
                  <Send className="w-12 h-12 text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Real-Time Community Chat
                </h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Join lively discussions, ask questions, share tips, and connect with other users instantly.
                  Our public chat is a welcoming space for everyone.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-2"></div>
                    <p className="text-gray-400 text-sm">Share ideas and get instant feedback</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-2"></div>
                    <p className="text-gray-400 text-sm">Connect with like-minded individuals</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-2"></div>
                    <p className="text-gray-400 text-sm">Stay updated with community announcements</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-magenta-500/10 to-transparent border border-magenta-500/30 rounded-2xl p-8">
                <div className="inline-block p-3 bg-gradient-to-br from-magenta-500/20 to-pink-500/20 rounded-2xl mb-6">
                  <Pin className="w-12 h-12 text-magenta-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Important Updates
                </h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Admin messages are pinned so you never miss important announcements, events, or updates from the team.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-magenta-400 mt-2"></div>
                    <p className="text-gray-400 text-sm">Pinned messages for important info</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-magenta-400 mt-2"></div>
                    <p className="text-gray-400 text-sm">Real-time message updates</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-magenta-400 mt-2"></div>
                    <p className="text-gray-400 text-sm">Delete your own messages anytime</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-500/5 to-magenta-500/5 border border-white/10 rounded-2xl p-12 text-center">
              <Shield className="w-16 h-16 text-primary-400 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-white mb-4">
                Join the Conversation
              </h3>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
                Sign in to start chatting with the community. Share your experiences, ask questions,
                and be part of the i4uBuddy family.
              </p>
              <GradientButton
                onClick={() => window.location.href = '/auth'}
                size="lg"
                className="inline-flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                Sign In to Chat
              </GradientButton>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-dark-200/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-primary-400 mb-2">24/7</div>
                <p className="text-gray-400 text-sm">Always available for community interaction</p>
              </div>
              <div className="bg-dark-200/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-magenta-400 mb-2">Safe</div>
                <p className="text-gray-400 text-sm">Moderated for a friendly environment</p>
              </div>
              <div className="bg-dark-200/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-primary-400 mb-2">Free</div>
                <p className="text-gray-400 text-sm">Open to all registered members</p>
              </div>
            </div>
          </div>
        </main>
        <div className="mt-[50px]"><Footer /></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-20 pb-4 px-4 lg:px-8 max-w-5xl mx-auto w-full flex flex-col overflow-hidden">
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            Public Chat
          </h1>
          <p className="text-gray-400">
            Share your thoughts with the community. Everyone can see your messages!
          </p>
        </div>

        <div className="flex-1 bg-dark-200/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl flex flex-col overflow-hidden min-h-0">
          {pinnedMessages.length > 0 && (
            <div className="bg-yellow-500/10 border-b border-yellow-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold mb-2">
                <Pin className="w-4 h-4" />
                Pinned Messages
              </div>
              {pinnedMessages.map((message) => {
                const displayName = message.admin_name || message.profiles?.full_name || message.profiles?.email || 'Anonymous';
                return (
                  <button
                    key={message.id}
                    onClick={() => scrollToMessage(message.id)}
                    className="w-full text-left p-3 bg-dark-100/50 rounded-lg border border-yellow-500/20 hover:border-yellow-500/40 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-yellow-400 mb-1">{displayName}</p>
                        <p className="text-sm text-gray-200 line-clamp-2">{message.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(message.created_at)} • Click to view
                        </p>
                      </div>
                      <Pin className="w-4 h-4 text-yellow-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">
                  No messages yet. Be the first to say something!
                </p>
              </div>
            ) : (
              regularMessages.map((message) => {
                const isOwnMessage = message.user_id === user?.id;
                const isAdminMessage = message.admin_name === 'Admin';
                const displayName =
                  message.admin_name || message.profiles?.full_name || message.profiles?.email || 'Anonymous';

                return (
                  <div
                    key={message.id}
                    id={`message-${message.id}`}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} transition-all`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isAdminMessage
                          ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-glow'
                          : isOwnMessage
                          ? 'bg-gradient-primary shadow-glow'
                          : 'bg-dark-100 border border-white/10'
                      }`}
                    >
                      {isAdminMessage ? (
                        <Shield className="w-5 h-5 text-white" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>

                    <div
                      className={`flex-1 max-w-[75%] ${
                        isOwnMessage ? 'flex justify-end' : ''
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isAdminMessage
                            ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 text-white shadow-lg'
                            : isOwnMessage
                            ? 'bg-gradient-primary text-white shadow-glow'
                            : 'bg-dark-100 border border-white/10 text-gray-200'
                        } ${message.is_pinned ? 'ring-2 ring-yellow-500/30' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          {!isOwnMessage && (
                            <p className={`text-xs font-semibold ${
                              isAdminMessage ? 'text-red-400 flex items-center gap-1' : 'text-primary-400'
                            }`}>
                              {isAdminMessage && <Shield className="w-3 h-3" />}
                              {displayName}
                            </p>
                          )}
                          {message.is_pinned && (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Pin className="w-3 h-3" />
                              <span className="text-xs">Pinned</span>
                            </div>
                          )}
                        </div>
                        <p className="whitespace-pre-line leading-relaxed break-words">
                          {message.message}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <p
                            className={`text-xs ${
                              isOwnMessage ? 'text-white/60' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </p>
                          {(isOwnMessage || isAdmin) && (
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className={`transition-colors ${
                                isOwnMessage
                                  ? 'text-white/60 hover:text-white'
                                  : 'text-red-400 hover:text-red-300'
                              }`}
                              title={isAdmin && !isOwnMessage ? 'Admin: Delete message' : 'Delete message'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-white/5 bg-dark-100/50"
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                maxLength={1000}
              />
              <GradientButton
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="px-6"
              >
                <Send className="w-5 h-5" />
              </GradientButton>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Your message will be visible to all users
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

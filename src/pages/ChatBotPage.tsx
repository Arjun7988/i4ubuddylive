import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Send, Trash2, Pin, Shield, Reply, Image as ImageIcon, X, User, Home, ChevronRight, Search, MapPin, Calendar, Tag, DollarSign } from 'lucide-react';
import { GradientButton } from '../components/GradientButton';
import { Avatar } from '../components/Avatar';
import { Select } from '../components/Select';
import { Input } from '../components/Input';
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
  reply_to_message_id: string | null;
  image_url: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  reply_to_message?: {
    id: string;
    message: string;
    user_id: string | null;
    admin_name: string | null;
    profiles?: {
      full_name: string | null;
      email: string;
      avatar_url: string | null;
    };
  };
}


interface SearchResult {
  id: string;
  type: 'chat';
  title: string;
  description: string;
  location?: string;
  date?: string;
  image_url?: string;
  url: string;
  user_name?: string;
}

export function ChatBotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'today' | 'weekly' | 'monthly' | ''>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const DAILY_MESSAGE_LIMIT = 5;

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


  const performSearch = async () => {
    setIsSearching(true);
    setShowResults(true);
    const results: SearchResult[] = [];

    try {
      let dateFilter: Date | null = null;

      if (timeFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateFilter = today;
      } else if (timeFilter === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo;
      } else if (timeFilter === 'monthly') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = monthAgo;
      }

      console.log('Search filters:', { searchQuery, timeFilter, dateFilter });

      let chatQuery = supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          created_at,
          image_url,
          admin_name,
          profiles:user_id (
            full_name,
            email,
            city,
            state
          )
        `)
        .order('created_at', { ascending: false });

      if (dateFilter) {
        chatQuery = chatQuery.gte('created_at', dateFilter.toISOString());
      }

      const { data: chatMessages, error: chatError } = await chatQuery.limit(100);

      if (chatError) {
        console.error('Error fetching chat messages:', chatError);
      } else {
        console.log('Chat messages found:', chatMessages?.length);
      }

      const query = searchQuery.toLowerCase().trim();

      (chatMessages || []).forEach(msg => {
        const profile = msg.profiles as any;
        const userCity = profile?.city || '';
        const userState = profile?.state || '';
        const userName = msg.admin_name || profile?.full_name || profile?.email || 'Anonymous';

        const matchesSearch = !query ||
          msg.message.toLowerCase().includes(query) ||
          userName.toLowerCase().includes(query) ||
          userCity.toLowerCase().includes(query) ||
          userState.toLowerCase().includes(query);

        if (matchesSearch) {
          results.push({
            id: msg.id,
            type: 'chat',
            title: userName,
            description: msg.message,
            location: userCity && userState ? `${userCity}, ${userState}` : undefined,
            date: msg.created_at,
            image_url: msg.image_url || undefined,
            url: `/chatbot#message-${msg.id}`,
            user_name: userName,
          });
        }
      });

      console.log('Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTimeFilter('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 500);
  };

  const handleTimeFilterChange = (filter: 'today' | 'weekly' | 'monthly' | '') => {
    setTimeFilter(filter);
    setShowResults(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setTimeout(() => {
      performSearch();
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    loadMessages();
    checkAdminStatus();
    checkDailyMessageLimit();

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

  const checkDailyMessageLimit = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_daily_message_count', {
        user_uuid: user.id,
      });

      if (error) throw error;

      const count = data || 0;
      setDailyMessageCount(count);
      setIsLimitReached(count >= DAILY_MESSAGE_LIMIT);
    } catch (error) {
      console.error('Error checking daily message limit:', error);
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
          reply_to_message_id,
          image_url,
          profiles:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithReplies = await Promise.all(
        (data || []).map(async (msg) => {
          if (msg.reply_to_message_id) {
            const { data: replyData } = await supabase
              .from('chat_messages')
              .select(`
                id,
                message,
                user_id,
                admin_name,
                profiles:user_id (
                  full_name,
                  email,
                  avatar_url
                )
              `)
              .eq('id', msg.reply_to_message_id)
              .maybeSingle();

            return { ...msg, reply_to_message: replyData };
          }
          return msg;
        })
      );

      setMessages(messagesWithReplies);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;

    setIsUploading(true);
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('chat-images')
        .upload(fileName, selectedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedImage) || !user || isSending || isUploading) return;

    setIsSending(true);
    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage();
        if (!imageUrl && !inputMessage.trim()) {
          setIsSending(false);
          return;
        }
      }

      const { error } = await supabase.from('chat_messages').insert({
        user_id: user.id,
        message: inputMessage.trim(),
        reply_to_message_id: replyingTo?.id || null,
        image_url: imageUrl,
      });

      if (error) {
        if (error.message.includes('Daily message limit exceeded')) {
          alert(`You have reached your daily limit of ${DAILY_MESSAGE_LIMIT} messages. Please try again tomorrow.`);
          await checkDailyMessageLimit();
        } else {
          throw error;
        }
        return;
      }

      setInputMessage('');
      setReplyingTo(null);
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await checkDailyMessageLimit();
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

        <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 w-full">
          <div className="space-y-8">
            <nav className="flex items-center gap-2 text-sm mb-6">
              <Link
                to="/"
                className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <Home className="w-4 h-4 flex-shrink-0" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-white font-medium">Chat</span>
            </nav>

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

      <main className="relative flex-1 pt-[calc(128px+50px)] pb-4 container mx-auto px-4 w-full flex flex-col overflow-hidden">
        <div className="mb-4 bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[300px] relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-500" />
              </div>
              <Input
                type="text"
                placeholder="Search messages, names, locations..."
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                className="w-full pl-10"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleTimeFilterChange(timeFilter === 'today' ? '' : 'today')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeFilter === 'today'
                    ? 'bg-gradient-primary text-white shadow-glow'
                    : 'bg-dark-100 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleTimeFilterChange(timeFilter === 'weekly' ? '' : 'weekly')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeFilter === 'weekly'
                    ? 'bg-gradient-primary text-white shadow-glow'
                    : 'bg-dark-100 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => handleTimeFilterChange(timeFilter === 'monthly' ? '' : 'monthly')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeFilter === 'monthly'
                    ? 'bg-gradient-primary text-white shadow-glow'
                    : 'bg-dark-100 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                Monthly
              </button>
            </div>

            {showResults && (searchQuery || timeFilter) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30"
              >
                <X className="w-4 h-4 mr-2 inline" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className={`${showResults ? 'w-1/2' : 'w-full'} bg-dark-200/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}>
          {pinnedMessages.length > 0 && (
            <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                {pinnedMessages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => scrollToMessage(message.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-full border border-yellow-500/30 hover:border-yellow-500/50 transition-all group text-xs"
                  >
                    <Pin className="w-3 h-3 text-yellow-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-yellow-200 font-medium max-w-[200px] truncate">
                      {message.message}
                    </span>
                  </button>
                ))}
              </div>
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
                    {isAdminMessage ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-red-500 to-orange-500 shadow-glow">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <Avatar
                        src={message.profiles?.avatar_url}
                        alt={displayName}
                        size="md"
                        className={isOwnMessage ? 'shadow-glow' : ''}
                      />
                    )}

                    <div
                      className={`flex-1 max-w-[75%] ${
                        isOwnMessage ? 'flex justify-end' : ''
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-3 py-2 ${
                          isAdminMessage
                            ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 text-white shadow-lg'
                            : isOwnMessage
                            ? 'bg-gradient-primary text-white shadow-glow'
                            : 'bg-dark-100 border border-white/10 text-gray-200'
                        } ${message.is_pinned ? 'ring-2 ring-yellow-500/30' : ''}`}
                      >
                        {message.reply_to_message && (
                          <button
                            onClick={() => scrollToMessage(message.reply_to_message_id!)}
                            className={`w-full text-left mb-2 p-2 rounded-lg ${
                              isOwnMessage
                                ? 'bg-white/10 hover:bg-white/15'
                                : 'bg-dark-200/50 hover:bg-dark-200/70'
                            } transition-colors border-l-2 border-primary-400`}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <Reply className="w-3 h-3" />
                              <span className="text-xs font-semibold">
                                {message.reply_to_message.admin_name ||
                                 message.reply_to_message.profiles?.full_name ||
                                 message.reply_to_message.profiles?.email ||
                                 'Anonymous'}
                              </span>
                            </div>
                            <p className="text-xs opacity-75 line-clamp-2">
                              {message.reply_to_message.message}
                            </p>
                          </button>
                        )}

                        {message.image_url && (
                          <img
                            src={message.image_url}
                            alt="Shared image"
                            className="rounded-lg max-w-full mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.image_url!, '_blank')}
                          />
                        )}

                        {message.message && (
                          <p className="whitespace-pre-line leading-relaxed break-words">
                            {!isOwnMessage && (
                              <span className={`font-semibold ${
                                isAdminMessage ? 'text-red-400' : 'text-primary-400'
                              }`}>
                                {isAdminMessage && <Shield className="w-3 h-3 inline mr-1" />}
                                {displayName}:{' '}
                              </span>
                            )}
                            {message.message}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-xs ${
                                isOwnMessage ? 'text-white/60' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                            {message.is_pinned && (
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Pin className="w-3 h-3" />
                                <span className="text-xs">Pinned</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!isOwnMessage && (
                              <button
                                onClick={() => setReplyingTo(message)}
                                className="text-primary-400 hover:text-primary-300 transition-colors"
                                title="Reply to this message"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                            )}
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
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-white/5 bg-dark-100/50"
          >
            {replyingTo && (
              <div className="mb-2 p-2 bg-primary-500/10 border border-primary-500/30 rounded-lg flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Reply className="w-3 h-3 text-primary-400" />
                    <span className="text-xs font-semibold text-primary-400">
                      Replying to {replyingTo.admin_name || replyingTo.profiles?.full_name || replyingTo.profiles?.email || 'Anonymous'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{replyingTo.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {imagePreview && (
              <div className="mb-2 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 rounded-lg border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-dark-200 border border-white/10 rounded-xl hover:bg-dark-100 transition-colors"
                title="Upload image"
              >
                <ImageIcon className="w-4 h-4 text-gray-400" />
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-black placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors text-sm"
                maxLength={1000}
              />
              <GradientButton
                type="submit"
                disabled={(!inputMessage.trim() && !selectedImage) || isSending || isUploading}
                className="px-5 py-2"
              >
                {isUploading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </GradientButton>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-gray-500">
                Your message will be visible to all users
              </p>
              {!isAdmin && (
                <p className={`text-xs font-medium ${
                  dailyMessageCount >= DAILY_MESSAGE_LIMIT ? 'text-red-400' :
                  dailyMessageCount >= 4 ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {dailyMessageCount}/{DAILY_MESSAGE_LIMIT} messages today
                  {dailyMessageCount >= DAILY_MESSAGE_LIMIT && ' - Limit reached'}
                </p>
              )}
            </div>
          </form>
          </div>

          {showResults && (
            <div className="w-1/2 bg-dark-200/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="text-2xl font-heading font-semibold text-white">
                  Search Results ({searchResults.length})
                </h2>
              </div>
              <div className="overflow-y-auto p-6 h-full">
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No results found</p>
                    <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        to={result.url}
                        className="bg-dark-100 rounded-xl border border-white/10 overflow-hidden hover:border-primary-500/50 transition-all group"
                      >
                        <div className="flex gap-4">
                          {result.image_url && (
                            <div className="w-32 h-32 flex-shrink-0 overflow-hidden bg-dark-200">
                              <img
                                src={result.image_url}
                                alt={result.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="flex-1 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400">
                                Chat Message
                              </span>
                            </div>
                            <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                              {result.title}
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                              {result.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {result.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {result.location}
                                </div>
                              )}
                              {result.date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(result.date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

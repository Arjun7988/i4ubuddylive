import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  message: string;
  created_at: string;
  is_pinned: boolean;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export function CommunityHighlights() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          created_at,
          is_pinned,
          profiles(full_name, avatar_url)
        `)
        .is('reply_to_message_id', null)
        .is('image_url', null)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const colorPatterns = [
    'border-l-4 border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    'border-l-4 border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    'border-l-4 border-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)]',
    'border-l-4 border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]',
    'border-l-4 border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]',
  ];

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-white">Community Highlights</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="glass glass-border rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-white">Community Highlights</h2>
        </div>
        <div className="glass glass-border rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-3">No messages yet</p>
          <button
            onClick={() => navigate('/chatbot')}
            className="px-3 py-1.5 bg-gradient-primary rounded-lg text-white text-xs font-medium hover:shadow-glow transition-all"
          >
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-white">Community Highlights</h2>
        <button
          onClick={() => navigate('/chatbot')}
          className="text-primary-400 hover:text-primary-300 text-xs font-medium flex items-center gap-1 group"
        >
          Join Chat
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="space-y-3">
        {messages.map((post, index) => (
        <div
          key={post.id}
          onClick={() => navigate('/chatbot')}
          className={`glass glass-border rounded-xl p-3 transition-all duration-300 cursor-pointer group ${colorPatterns[index % colorPatterns.length]}`}
        >
          <div className="flex items-center gap-3">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles.full_name || 'User'}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-400 text-sm font-semibold">
                  {post.profiles?.full_name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-white font-semibold text-sm">
                  {post.profiles?.full_name || 'Admin'}
                </h4>
                <span className="text-gray-500 text-xs">{getTimeAgo(post.created_at)}</span>
              </div>
              <p className="text-gray-300 text-sm line-clamp-1">{post.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}

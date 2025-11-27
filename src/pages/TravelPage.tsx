import { useEffect, useState, useRef } from 'react';
import { Trash2, Send, X, MapPin, Copy, Check, Share2 } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Avatar } from '../components/Avatar';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuthStore } from '../store/authStore';

interface TravelCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
}

interface TravelPost {
  id: string;
  user_id: string;
  category_id: string | null;
  from_location: string;
  destination: string;
  travel_dates: string;
  description: string;
  budget_range: string;
  looking_for: string;
  contact_preference: string;
  is_active: boolean;
  share_token: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  travel_categories: {
    name: string;
    icon: string;
  } | null;
  reactions: {
    reaction: string;
    count: number;
    user_reacted: boolean;
  }[];
}

interface Permission {
  can_post: boolean;
  can_delete_own: boolean;
  can_delete_any: boolean;
}

const REACTIONS = [
  '❤️', '👍', '👎', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏',
  '✅', '❌', '💯', '🙏', '💪', '👀', '🤔', '😊', '😍', '🥳'
];

export function TravelPage() {
  console.log('[TravelPage] Component rendering');
  const { user } = useAuthStore();
  console.log('[TravelPage] User from store:', user?.id);
  const [posts, setPosts] = useState<TravelPost[]>([]);
  const [categories, setCategories] = useState<TravelCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    from_location: '',
    destination: '',
    travel_dates: '',
    description: '',
    budget_range: '',
    looking_for: '',
  });
  const [permissions, setPermissions] = useState<Permission>({
    can_post: true,
    can_delete_own: true,
    can_delete_any: false,
  });
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePost, setSharePost] = useState<TravelPost | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const loadingRef = useRef(false);

  const loadPosts = async () => {
    console.log('[loadPosts] Starting, user:', user?.id, 'loadingRef:', loadingRef.current);

    if (!user) {
      console.log('[loadPosts] No user, setting loading false');
      setLoading(false);
      return;
    }

    if (loadingRef.current) {
      console.log('[loadPosts] Already loading, skipping');
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    console.log('[loadPosts] Set loading true, starting query...');

    try {
      let query = supabase
        .from('travel_posts')
        .select(`
          id,
          user_id,
          category_id,
          destination,
          travel_dates,
          description,
          budget_range,
          looking_for,
          contact_preference,
          is_active,
          created_at,
          profiles!travel_posts_user_id_fkey(full_name, email, avatar_url),
          travel_categories(name, icon)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data: postsData, error: postsError } = await query;
      console.log('[loadPosts] Query completed, posts:', postsData?.length, 'error:', postsError);

      if (postsError) {
        console.error('[loadPosts] Error loading posts:', postsError);
        setError('Failed to load posts. Please check your connection and try again.');
        return;
      }

      setError(null);

      if (!postsData || postsData.length === 0) {
        console.log('[loadPosts] No posts found, setting empty array');
        setPosts([]);
        return;
      }

      console.log('[loadPosts] Processing', postsData.length, 'posts...');

      // Get all post IDs
      const postIds = postsData.map(p => p.id);

      // Fetch all reactions in one query
      const { data: allReactions } = await supabase
        .from('travel_post_reactions')
        .select('post_id, reaction, user_id')
        .in('post_id', postIds);

      // Group reactions by post
      const reactionsByPost: { [key: string]: any[] } = {};
      (allReactions || []).forEach(r => {
        if (!reactionsByPost[r.post_id]) {
          reactionsByPost[r.post_id] = [];
        }
        reactionsByPost[r.post_id].push(r);
      });

      // Process posts with their reactions
      const postsWithReactions = postsData.map((post) => {
        const postReactions = reactionsByPost[post.id] || [];
        const reactionCounts: { [key: string]: { count: number; user_reacted: boolean } } = {};

        REACTIONS.forEach(reaction => {
          reactionCounts[reaction] = { count: 0, user_reacted: false };
        });

        postReactions.forEach(({ reaction, user_id }) => {
          if (!reactionCounts[reaction]) {
            reactionCounts[reaction] = { count: 0, user_reacted: false };
          }
          reactionCounts[reaction].count++;
          if (user_id === user.id) {
            reactionCounts[reaction].user_reacted = true;
          }
        });

        const reactions = Object.entries(reactionCounts)
          .filter(([, data]) => data.count > 0)
          .map(([reaction, data]) => ({
            reaction,
            count: data.count,
            user_reacted: data.user_reacted,
          }));

        return {
          ...post,
          reactions,
        };
      });

      console.log('[loadPosts] Setting posts with reactions:', postsWithReactions.length);
      setPosts(postsWithReactions);
    } catch (error) {
      console.error('[loadPosts] Error in loadPosts:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      console.log('[loadPosts] Finally block - setting loading false');
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      console.log('[TravelPage] loadInitialData starting, user:', user?.id);

      if (!user) {
        console.log('[TravelPage] No user, setting loading false');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('[TravelPage] Loading categories...');

        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('travel_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        console.log('[TravelPage] Categories loaded:', categoriesData?.length, 'error:', categoriesError);

        if (categoriesError) {
          console.error('Error loading categories:', categoriesError);
        } else if (categoriesData) {
          setCategories(categoriesData);
        }

        console.log('[TravelPage] Loading permissions...');

        // Load permissions
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('travel_post_permissions')
          .select('can_post, can_delete_own, can_delete_any')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('[TravelPage] Permissions loaded:', permissionsData, 'error:', permissionsError);

        if (permissionsError) {
          console.error('Error loading permissions:', permissionsError);
        } else if (permissionsData) {
          setPermissions(permissionsData);
        }

        console.log('[TravelPage] Calling loadPosts...');
        // Load posts
        await loadPosts();
        console.log('[TravelPage] loadPosts completed');
      } catch (error) {
        console.error('[TravelPage] Error in loadInitialData:', error);
        setError('Failed to load data. Please refresh the page.');
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user?.id]);

  useEffect(() => {
    if (user && !loadingRef.current) {
      loadPosts();
    }
  }, [selectedCategory]);

  const generateShareToken = () => {
    return btoa(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
      .replace(/[+/=]/g, '')
      .substring(0, 16);
  };

  const handleCreatePost = async () => {
    if (!user || !formData.from_location.trim() || !formData.destination.trim() || !formData.description.trim()) {
      alert('Please fill in required fields: from, destination and description');
      return;
    }

    const { data: newPost, error } = await supabase
      .from('travel_posts')
      .insert({
        user_id: user.id,
        category_id: formData.category_id || null,
        from_location: formData.from_location.trim(),
        destination: formData.destination.trim(),
        travel_dates: formData.travel_dates.trim(),
        description: formData.description.trim(),
        budget_range: formData.budget_range.trim(),
        looking_for: formData.looking_for.trim(),
        share_token: generateShareToken(),
      })
      .select(`
        *,
        profiles!inner(full_name, email, avatar_url),
        travel_categories(name, icon)
      `)
      .single();

    if (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
      return;
    }

    setFormData({
      category_id: '',
      from_location: '',
      destination: '',
      travel_dates: '',
      description: '',
      budget_range: '',
      looking_for: '',
    });
    setShowCreateModal(false);
    await loadPosts();

    if (newPost) {
      setSharePost(newPost as TravelPost);
      setShowShareModal(true);
    }
  };

  const copyShareLink = async () => {
    if (!sharePost?.share_token) return;

    const shareLink = `${window.location.origin}/travel/share/${sharePost.share_token}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleReaction = async (postId: string, reaction: string, isReacted: boolean) => {
    if (!user) return;

    if (isReacted) {
      await supabase
        .from('travel_post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('reaction', reaction);
    } else {
      await supabase
        .from('travel_post_reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction,
        });
    }

    loadPosts();
    setShowReactions(null);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const { error } = await supabase
      .from('travel_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
      return;
    }

    loadPosts();
  };

  const canDeletePost = (post: TravelPost) => {
    if (permissions.can_delete_any) return true;
    if (post.user_id === user?.id) return true;
    return false;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-2">Travel Companion</h1>
          <p className="text-gray-400">Find travel companions and share your journey</p>
        </div>
        {user && permissions.can_post && (
          <GradientButton onClick={() => setShowCreateModal(true)}>
            <Send className="w-5 h-5 mr-2" />
            Post Travel Plan
          </GradientButton>
        )}
      </div>

      {!user ? (
        <div className="space-y-8">
          <GlowingCard>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-block p-3 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl">
                  <MapPin className="w-12 h-12 text-green-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Find Your Perfect Travel Buddy
                  </h2>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    Connect with like-minded travelers, share expenses, and create unforgettable memories together.
                    Whether you're planning a backpacking trip, luxury getaway, or adventure tour, find someone who shares your travel style.
                  </p>
                  <GradientButton onClick={() => window.location.href = '/auth'} className="w-full sm:w-auto">
                    Start Your Journey
                  </GradientButton>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Share Travel Plans</h3>
                      <p className="text-gray-400 text-sm">Post your destination, dates, and what you're looking for in a travel companion</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Send className="w-6 h-6 text-teal-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Connect with Travelers</h3>
                      <p className="text-gray-400 text-sm">Browse posts from other travelers and find someone going your way</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Share2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Safe & Easy</h3>
                      <p className="text-gray-400 text-sm">Read profiles, check travel styles, and coordinate before you go</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlowingCard>

          <div className="grid md:grid-cols-3 gap-6">
            <GlowingCard>
              <div className="text-center space-y-3">
                <div className="inline-block p-4 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl">
                  <MapPin className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Any Destination</h3>
                <p className="text-gray-400 text-sm">
                  From beach vacations to mountain treks, find companions for any type of adventure.
                </p>
              </div>
            </GlowingCard>

            <GlowingCard>
              <div className="text-center space-y-3">
                <div className="inline-block p-4 bg-gradient-to-br from-teal-500/20 to-green-500/20 rounded-2xl">
                  <Send className="w-8 h-8 text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Flexible Matching</h3>
                <p className="text-gray-400 text-sm">
                  Filter by budget, travel style, dates, and interests to find your ideal travel partner.
                </p>
              </div>
            </GlowingCard>

            <GlowingCard>
              <div className="text-center space-y-3">
                <div className="inline-block p-4 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl">
                  <Share2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Community Verified</h3>
                <p className="text-gray-400 text-sm">
                  React and engage with posts, build trust with fellow travelers in the community.
                </p>
              </div>
            </GlowingCard>
          </div>

          <GlowingCard>
            <div className="text-center py-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Explore the World Together?
              </h3>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                Join our community of travelers who believe that the best adventures are shared.
                Create your profile and start connecting with fellow explorers today.
              </p>
              <GradientButton onClick={() => window.location.href = '/auth'} size="lg">
                Sign In to Connect
              </GradientButton>
            </div>
          </GlowingCard>
        </div>
      ) : (
        <>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
            selectedCategory === ''
              ? 'bg-gradient-primary text-white shadow-glow'
              : 'text-gray-400 hover:text-white hover:bg-surface/50'
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-gradient-primary text-white shadow-glow'
                : 'text-gray-400 hover:text-white hover:bg-surface/50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {error ? (
          <div className="col-span-full">
            <GlowingCard>
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    loadPosts();
                  }}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </GlowingCard>
          </div>
        ) : loading ? (
          <div className="col-span-full">
            <GlowingCard>
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mb-4"></div>
                <p className="text-gray-400">Loading travel posts...</p>
              </div>
            </GlowingCard>
          </div>
        ) : posts.length === 0 ? (
          <div className="col-span-full">
            <GlowingCard>
              <div className="text-center py-12">
                <p className="text-gray-400">No travel posts yet. Be the first to share your journey!</p>
              </div>
            </GlowingCard>
          </div>
        ) : (
          posts.map((post) => (
            <GlowingCard key={post.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      <h3 className="font-semibold text-white text-lg truncate">{post.destination}</h3>
                    </div>
                    {post.travel_categories && (
                      <span className="inline-block px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full mb-2">
                        {post.travel_categories.name}
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                      <Avatar
                        src={post.profiles?.avatar_url}
                        alt={post.profiles?.full_name || 'User'}
                        size="sm"
                      />
                      <span className="truncate">{post.profiles?.full_name || 'Unknown User'}</span>
                      <span>•</span>
                      <span className="whitespace-nowrap">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  {canDeletePost(post) && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 py-3 border-y border-border">
                  {post.travel_dates && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Travel Dates</p>
                      <p className="text-sm text-gray-300">{post.travel_dates}</p>
                    </div>
                  )}
                  {post.budget_range && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Budget Range</p>
                      <p className="text-sm text-gray-300">{post.budget_range}</p>
                    </div>
                  )}
                  {post.looking_for && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Looking For</p>
                      <p className="text-sm text-gray-300">{post.looking_for}</p>
                    </div>
                  )}
                </div>

                <p className="text-gray-200 text-sm whitespace-pre-wrap line-clamp-3">{post.description}</p>

                <div className="pt-4 border-t border-border">
                  <div className="relative">
                    {showReactions === post.id ? (
                      <div className="glass-border rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Choose a reaction</span>
                          <button
                            onClick={() => setShowReactions(null)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-10 gap-3">
                          {REACTIONS.map((reaction) => {
                            const reactionData = post.reactions.find(r => r.reaction === reaction);
                            return (
                              <button
                                key={reaction}
                                onClick={() => handleReaction(post.id, reaction, reactionData?.user_reacted || false)}
                                className={`text-3xl hover:scale-125 transition-all p-2 rounded-lg ${
                                  reactionData?.user_reacted
                                    ? 'bg-primary-500/20 scale-110 shadow-lg'
                                    : 'hover:bg-surface/50'
                                }`}
                                title={reaction}
                              >
                                {reaction}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.reactions.map(({ reaction, count, user_reacted }) => (
                          <button
                            key={reaction}
                            onClick={() => handleReaction(post.id, reaction, user_reacted)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                              user_reacted
                                ? 'bg-primary-500/20 border border-primary-500/50'
                                : 'bg-surface/50 border border-border hover:border-primary-500/50'
                            }`}
                          >
                            <span className="mr-1">{reaction}</span>
                            <span className="text-gray-300">{count}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => setShowReactions(post.id)}
                          className="px-3 py-1.5 rounded-full text-sm bg-surface/50 border border-border hover:border-primary-500/50 text-gray-400 hover:text-white transition-all"
                        >
                          + React
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlowingCard>
          ))
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({
            category_id: '',
            from_location: '',
            destination: '',
            travel_dates: '',
            description: '',
            budget_range: '',
            looking_for: '',
          });
        }}
        title="Post Your Travel Plan"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <Select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Select a category (optional)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              From *
            </label>
            <Input
              value={formData.from_location}
              onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
              placeholder="e.g., New York, USA"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination *
            </label>
            <Input
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g., Bali, Indonesia"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Travel Dates
            </label>
            <Input
              value={formData.travel_dates}
              onChange={(e) => setFormData({ ...formData, travel_dates: e.target.value })}
              placeholder="e.g., Jan 15-25, 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Share your travel plans, what you want to explore, activities, etc..."
              rows={5}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Budget Range (optional)
            </label>
            <Input
              value={formData.budget_range}
              onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
              placeholder="e.g., $500-1000, Budget friendly, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Looking For
            </label>
            <Input
              value={formData.looking_for}
              onChange={(e) => setFormData({ ...formData, looking_for: e.target.value })}
              placeholder="e.g., Travel companion, Group tour, Local guide"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setFormData({
                  category_id: '',
                  from_location: '',
                  destination: '',
                  travel_dates: '',
                  description: '',
                  budget_range: '',
                  looking_for: '',
                  contact_preference: 'email',
                });
              }}
              className="flex-1 px-6 py-3 border border-border rounded-lg text-gray-300 hover:bg-surface/50 transition-colors"
            >
              Cancel
            </button>
            <GradientButton
              onClick={handleCreatePost}
              disabled={!formData.from_location.trim() || !formData.destination.trim() || !formData.description.trim()}
              className="flex-1"
            >
              Post
            </GradientButton>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSharePost(null);
          setCopiedLink(false);
        }}
        title="Travel Post Created Successfully!"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium">Share this travel post</h3>
              <p className="text-sm text-gray-400">Send this link to find travel companions or share your plans</p>
            </div>
          </div>

          {sharePost?.share_token && (
            <div className="space-y-3">
              <div className="p-3 bg-surface border border-border rounded-lg break-all text-sm text-gray-300">
                {`${window.location.origin}/travel/share/${sharePost.share_token}`}
              </div>
              <GradientButton onClick={copyShareLink} className="w-full flex items-center justify-center gap-2">
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </GradientButton>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <GradientButton
              variant="secondary"
              onClick={() => {
                setShowShareModal(false);
                setSharePost(null);
                setCopiedLink(false);
              }}
              className="w-full"
            >
              Close
            </GradientButton>
          </div>
        </div>
      </Modal>
        </>
      )}
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}

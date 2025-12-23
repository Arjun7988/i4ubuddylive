import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send, X, MapPin, Copy, Check, Share2, Plane, Calendar, CreditCard as Edit2, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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

// 🔹 Set this according to the page you are editing
const PAGE_KEY = "TRAVEL";

type AdActionType = "redirect" | "popup";

type PageAd = {
  id: string;
  title: string;
  image_url: string | null;
  redirect_url: string | null;
  action_type: AdActionType;
  popup_image_url: string | null;
  popup_description: string | null;
  pages: string[];
  placement: string;
  position: number | null;
  target_state: string | null;
  target_city: string | null;
  target_pincode: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
};

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
  title: string | null;
  role: string | null;
  flight_code: string | null;
  origin_airport: string | null;
  destination_airport: string | null;
  depart_at: string | null;
  arrive_at: string | null;
  languages: string | null;
  contact_method: string | null;
  contact_value: string | null;
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
  const [editingPost, setEditingPost] = useState<TravelPost | null>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    from_location: '',
    destination: '',
    travel_dates: '',
    description: '',
  });
  const [flightData, setFlightData] = useState({
    email: user?.email || '',
    role: '' as 'Offering Help' | 'Seeking Help' | '',
    flight_code: '',
    source_airport: '',
    destination_airport: '',
    depart_at: '',
    arrive_at: '',
    title: '',
    message: '',
    languages: '',
    contact_method: '' as 'instagram' | 'phone' | 'email' | '',
    contact_value: '',
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
  const [originFilter, setOriginFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<TravelPost | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TravelPost | null>(null);

  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [rightAds, setRightAds] = useState<PageAd[]>([]);
  const [inlineAds, setInlineAds] = useState<PageAd[]>([]);
  const [popupAd, setPopupAd] = useState<PageAd | null>(null);

  // Location context for ad targeting
  const userState: string | null = null;
  const userCity: string | null = null;
  const userPincode: string | null = null;

  const loadPosts = async () => {
    console.log('[loadPosts] Starting, user:', user?.id, 'loadingRef:', loadingRef.current);

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
          from_location,
          destination,
          travel_dates,
          description,
          budget_range,
          looking_for,
          contact_preference,
          is_active,
          created_at,
          title,
          role,
          flight_code,
          origin_airport,
          destination_airport,
          depart_at,
          arrive_at,
          languages,
          contact_method,
          contact_value,
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
          if (user && user_id === user.id) {
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

      // Sort posts: user's own posts first, then by created_at descending
      const sortedPosts = postsWithReactions.sort((a, b) => {
        // If one post is user's and the other isn't, prioritize user's post
        const aIsUsers = user ? a.user_id === user.id : false;
        const bIsUsers = user ? b.user_id === user.id : false;

        if (aIsUsers && !bIsUsers) return -1;
        if (!aIsUsers && bIsUsers) return 1;

        // If both are user's posts or both are not, sort by date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      console.log('[loadPosts] Setting posts with reactions:', sortedPosts.length);
      setPosts(sortedPosts);
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

      try {
        setLoading(true);
        setError(null);
        console.log('[TravelPage] Loading categories...');

        // Load categories (public access)
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

        // Load permissions only if user is logged in
        if (user) {
          console.log('[TravelPage] Loading permissions...');

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
        }

        console.log('[TravelPage] Calling loadPosts...');
        // Load posts (works with or without user)
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
    if (!loadingRef.current) {
      loadPosts();
    }
  }, [selectedCategory]);

  useEffect(() => {
    const loadPageAds = async () => {
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "ACTIVE")
        .contains("pages", [PAGE_KEY]);

      if (error) {
        console.error("Error loading ads for page:", PAGE_KEY, error);
        return;
      }
      if (!data) return;

      // Filter by date window
      const activeByDate = data.filter((ad: any) => {
        const start = ad.start_date ?? today;
        const end = ad.end_date ?? today;
        return start <= today && today <= end;
      });

      // Filter by location (if target_* is set, must match; if null, it's global)
      const activeByLocation = activeByDate.filter((ad: any) => {
        const matchState =
          !ad.target_state || !userState || ad.target_state === userState;
        const matchCity =
          !ad.target_city || !userCity || ad.target_city === userCity;
        const matchPincode =
          !ad.target_pincode || !userPincode || ad.target_pincode === userPincode;

        return matchState && matchCity && matchPincode;
      });

      // Map to PageAd
      const mapped: PageAd[] = activeByLocation.map((ad: any) => ({
        id: ad.id,
        title: ad.title,
        image_url: ad.image_url,
        redirect_url: ad.redirect_url,
        action_type: (ad.action_type ?? "redirect") as AdActionType,
        popup_image_url: ad.popup_image_url,
        popup_description: ad.popup_description,
        pages: ad.pages || [],
        placement: ad.placement,
        position: ad.position,
        target_state: ad.target_state,
        target_city: ad.target_city,
        target_pincode: ad.target_pincode,
        start_date: ad.start_date,
        end_date: ad.end_date,
        status: ad.status ?? "ACTIVE",
      }));

      // Sort by position (lower position numbers display first)
      const sortedMapped = mapped.sort((a, b) => (a.position || 0) - (b.position || 0));

      // Get ALL ads for each placement (using filter for arrays)
      const topLeft = sortedMapped.filter((ad) => ad.placement === 'TOP_LEFT');
      const topRight = sortedMapped.filter((ad) => ad.placement === 'TOP_RIGHT');
      const footerLeft = sortedMapped.filter((ad) => ad.placement === 'FOOTER_LEFT');
      const footerRight = sortedMapped.filter((ad) => ad.placement === 'FOOTER_RIGHT');

      setTopLeftAds(topLeft);
      setTopRightAds(topRight);
      setFooterLeftAds(footerLeft);
      setFooterRightAds(footerRight);

      const right = sortedMapped.filter(
        (ad) => ad.placement === 'RIGHT'
      );
      const inline = sortedMapped.filter(
        (ad) => ad.placement === 'INLINE'
      );

      setRightAds(right);
      setInlineAds(inline);
    };

    loadPageAds();
  }, [userState, userCity, userPincode]);

  const generateShareToken = () => {
    return btoa(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
      .replace(/[+/=]/g, '')
      .substring(0, 16);
  };

  const handleCreatePost = async () => {
    if (!user) {
      if (confirm('You must be logged in to post. Would you like to sign in now?')) {
        window.location.href = '/auth';
      }
      return;
    }

    if (!formData.category_id) {
      alert('Please select a category');
      return;
    }

    const selectedCategoryObj = categories.find(c => c.id === formData.category_id);
    const isFlight = selectedCategoryObj?.name === 'Flight Travel';

    if (isFlight) {
      if (!flightData.source_airport.trim() || !flightData.destination_airport.trim() ||
          !flightData.depart_at.trim() || !flightData.arrive_at.trim() ||
          !flightData.title.trim() || !flightData.contact_value.trim()) {
        alert('Please fill in all required flight fields');
        return;
      }
    } else {
      if (!formData.from_location.trim() || !formData.destination.trim() || !formData.description.trim()) {
        alert('Please fill in required fields: from, destination and description');
        return;
      }
    }

    if (editingPost) {
      // Update existing post
      const updatePayload: any = {
        category_id: formData.category_id || null,
        from_location: isFlight ? flightData.source_airport.trim() : formData.from_location.trim(),
        destination: isFlight ? flightData.destination_airport.trim() : formData.destination.trim(),
        travel_dates: isFlight ? '' : formData.travel_dates.trim(),
        description: isFlight ? (flightData.message.trim() || 'Flight Travel') : formData.description.trim(),
        title: isFlight ? (flightData.title.trim() || null) : null,
        role: isFlight ? (flightData.role || null) : null,
        flight_code: isFlight ? (flightData.flight_code.trim() || null) : null,
        origin_airport: isFlight ? (flightData.source_airport.trim() || null) : null,
        destination_airport: isFlight ? (flightData.destination_airport.trim() || null) : null,
        depart_at: isFlight && flightData.depart_at ? new Date(flightData.depart_at).toISOString() : null,
        arrive_at: isFlight && flightData.arrive_at ? new Date(flightData.arrive_at).toISOString() : null,
        languages: isFlight ? (flightData.languages.trim() || null) : null,
        contact_method: isFlight ? (flightData.contact_method || null) : null,
        contact_value: isFlight ? (flightData.contact_value.trim() || null) : null,
      };

      const { error } = await supabase
        .from('travel_posts')
        .update(updatePayload)
        .eq('id', editingPost.id);

      if (error) {
        console.error('Error updating post:', error);
        alert('Failed to update post. Please try again.');
        return;
      }

      setFormData({
        category_id: '',
        from_location: '',
        destination: '',
        travel_dates: '',
        description: '',
      });
      setFlightData({
        email: user?.email || '',
        role: '',
        flight_code: '',
        source_airport: '',
        destination_airport: '',
        depart_at: '',
        arrive_at: '',
        title: '',
        message: '',
        languages: '',
        contact_method: '',
        contact_value: '',
      });
      setShowCreateModal(false);
      setEditingPost(null);
      await loadPosts();
    } else {
      // Create new post
      const insertPayload: any = {
        user_id: user.id,
        category_id: formData.category_id || null,
        from_location: isFlight ? flightData.source_airport.trim() : formData.from_location.trim(),
        destination: isFlight ? flightData.destination_airport.trim() : formData.destination.trim(),
        travel_dates: isFlight ? '' : formData.travel_dates.trim(),
        description: isFlight ? (flightData.message.trim() || 'Flight Travel') : formData.description.trim(),
        share_token: generateShareToken(),
        title: isFlight ? (flightData.title.trim() || null) : null,
        role: isFlight ? (flightData.role || null) : null,
        flight_code: isFlight ? (flightData.flight_code.trim() || null) : null,
        origin_airport: isFlight ? (flightData.source_airport.trim() || null) : null,
        destination_airport: isFlight ? (flightData.destination_airport.trim() || null) : null,
        depart_at: isFlight && flightData.depart_at ? new Date(flightData.depart_at).toISOString() : null,
        arrive_at: isFlight && flightData.arrive_at ? new Date(flightData.arrive_at).toISOString() : null,
        languages: isFlight ? (flightData.languages.trim() || null) : null,
        contact_method: isFlight ? (flightData.contact_method || null) : null,
        contact_value: isFlight ? (flightData.contact_value.trim() || null) : null,
      };

      const { data: newPost, error } = await supabase
        .from('travel_posts')
        .insert(insertPayload)
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
      });
      setFlightData({
        email: user?.email || '',
        role: '',
        flight_code: '',
        source_airport: '',
        destination_airport: '',
        depart_at: '',
        arrive_at: '',
        title: '',
        message: '',
        languages: '',
        contact_method: '',
        contact_value: '',
      });
      setShowCreateModal(false);
      await loadPosts();

      if (newPost) {
        setSharePost(newPost as TravelPost);
        setShowShareModal(true);
      }
    }
  };

  const handleEditPost = (post: TravelPost) => {
    setEditingPost(post);
    setFormData({
      category_id: post.category_id || '',
      from_location: post.from_location,
      destination: post.destination,
      travel_dates: post.travel_dates,
      description: post.description,
    });

    const selectedCategoryObj = categories.find(c => c.id === post.category_id);
    const isFlight = selectedCategoryObj?.name === 'Flight Travel';

    if (isFlight) {
      setFlightData({
        email: user?.email || '',
        role: (post as any).role || '',
        flight_code: (post as any).flight_code || '',
        source_airport: (post as any).origin_airport || '',
        destination_airport: (post as any).destination_airport || '',
        depart_at: (post as any).depart_at ? new Date((post as any).depart_at).toISOString().slice(0, 16) : '',
        arrive_at: (post as any).arrive_at ? new Date((post as any).arrive_at).toISOString().slice(0, 16) : '',
        title: (post as any).title || '',
        message: post.description || '',
        languages: (post as any).languages || '',
        contact_method: (post as any).contact_method || '',
        contact_value: (post as any).contact_value || '',
      });
    }

    setShowCreateModal(true);
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
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  const isFlightTravelCategory = () => {
    if (!selectedCategory) return false;
    const category = categories.find(c => c.id === selectedCategory);
    return category?.name === 'Flight Travel';
  };

  const getFilteredFlightPosts = () => {
    let filtered = posts.filter(post => {
      const matchesOrigin = !originFilter ||
        post.from_location?.toLowerCase().includes(originFilter.toLowerCase());

      const matchesDestination = !destinationFilter ||
        post.destination?.toLowerCase().includes(destinationFilter.toLowerCase());

      return matchesOrigin && matchesDestination;
    });

    if (viewMode === 'weekly') {
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      filtered = filtered.filter(post => {
        const postDate = new Date(post.travel_dates || post.created_at);
        return postDate <= oneWeekFromNow && postDate >= new Date();
      });
    } else if (viewMode === 'monthly') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filtered = filtered.filter(post => {
        const postDate = new Date(post.travel_dates || post.created_at);
        return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear;
      });
    }

    return filtered;
  };

  const getGroupedByDate = (posts: TravelPost[]) => {
    const grouped: { [key: string]: TravelPost[] } = {};
    posts.forEach(post => {
      const baseDate = post.travel_dates || post.created_at;
      const dateKey = new Date(baseDate).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(post);
    });

    return Object.entries(grouped).sort((a, b) =>
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAdClick = (ad: PageAd | null) => {
    if (!ad || !ad.image_url) return;

    if (ad.action_type === "redirect" && ad.redirect_url) {
      window.open(ad.redirect_url, "_blank", "noopener,noreferrer");
      return;
    }

    if (ad.action_type === "popup") {
      setPopupAd(ad);
    }
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

      <main className="relative flex-1 pt-[calc(128px+50px)] pb-6 sm:pb-8">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Breadcrumb and Post Button */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <nav className="flex items-center gap-2 text-sm">
              <Link
                to="/"
                className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <Home className="w-4 h-4 flex-shrink-0" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-white font-medium">Travel Companion</span>
            </nav>

            <button
              onClick={() => {
                if (!user) {
                  if (confirm('You must be logged in to post. Would you like to sign in now?')) {
                    window.location.href = '/auth';
                  }
                  return;
                }
                if (!permissions.can_post) {
                  alert('You do not have permission to post');
                  return;
                }
                setFormData({
                  category_id: selectedCategory,
                  from_location: '',
                  destination: '',
                  travel_dates: '',
                  description: '',
                });
                setFlightData({
                  email: user?.email || '',
                  role: '',
                  flight_code: '',
                  source_airport: '',
                  destination_airport: '',
                  depart_at: '',
                  arrive_at: '',
                  title: '',
                  message: '',
                  languages: '',
                  contact_method: '',
                  contact_value: '',
                });
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-semibold hover:shadow-glow transition-all duration-300"
            >
              <Send className="w-4 h-4" />
              <span>Post Travel Plan</span>
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8">
        {/* Top Banner Ads */}
        {(topLeftAds.length > 0 || topRightAds.length > 0) && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                {topLeftAds.filter(ad => ad.image_url).map((ad) => (
                  <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                    <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {topRightAds.filter(ad => ad.image_url).map((ad) => (
                  <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                    <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      <div className="mt-4 bg-[#020617] rounded-2xl border border-slate-800 px-3 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-50 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="From Location"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
          <input
            type="text"
            placeholder="To Location"
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                viewMode === 'all'
                  ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                viewMode === 'weekly'
                  ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                viewMode === 'monthly'
                  ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

          {/* Main 2-Column Layout: Content + Ads */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN - All Content */}
            <div className="lg:col-span-9">
              {(() => {
                const filteredPosts = getFilteredFlightPosts();
                const groupedPosts = getGroupedByDate(filteredPosts);

                if (filteredPosts.length === 0) {
                  return (
                    <div className="mt-4 bg-[#111827] rounded-xl border border-slate-800 p-12 text-center">
                      <p className="text-slate-400">No flights found matching your criteria.</p>
                    </div>
                  );
                }

                return groupedPosts.map(([dateLabel, items], groupIndex) => (
              <section key={dateLabel} className="mt-4">
                <div className="bg-slate-900/60 text-xs sm:text-sm font-semibold text-slate-200 px-3 py-2 rounded-t-xl border-x border-t border-slate-800">
                  {new Date(dateLabel).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="divide-y divide-slate-800 border-x border-b border-slate-800 rounded-b-xl bg-[#111827]">
                  {items.map((plan, index) => {
                    const isFlight = plan.travel_categories?.name === 'Flight Travel';
                    return (
                    <React.Fragment key={plan.id}>
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className="w-full text-left px-3 py-3 flex flex-col gap-2 hover:bg-slate-900/80 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="sm:w-48 flex flex-col gap-1">
                          {isFlight && (plan.depart_at || plan.arrive_at) ? (
                            <>
                              {plan.depart_at && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 w-16">Depart:</span>
                                  <span className="text-xs font-semibold text-slate-300">
                                    {new Date(plan.depart_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-purple-400">
                                    {new Date(plan.depart_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}
                              {plan.arrive_at && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 w-16">Arrive:</span>
                                  <span className="text-xs font-semibold text-slate-300">
                                    {new Date(plan.arrive_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-fuchsia-400">
                                    {new Date(plan.arrive_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {plan.travel_dates && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 w-16">Travel:</span>
                                  <span className="text-xs font-semibold text-slate-300">
                                    {new Date(plan.travel_dates).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-purple-400">
                                    {formatTime(plan.travel_dates) || new Date(plan.travel_dates).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 w-16">Posted:</span>
                                <span className="text-xs font-semibold text-slate-300">
                                  {new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="text-sm font-semibold text-slate-50">
                            {isFlight && (plan.origin_airport || plan.destination_airport)
                              ? `${plan.origin_airport || plan.from_location} → ${plan.destination_airport || plan.destination}`
                              : `${plan.from_location} → ${plan.destination}`}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center rounded-full border border-purple-500/50 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300">
                              {plan.travel_categories?.name || 'Flight Travel'}
                            </span>
                            {isFlight && plan.flight_code && (
                              <span className="inline-flex items-center rounded-full border border-purple-400/50 bg-purple-500/20 px-2 py-0.5 text-xs text-purple-200 font-mono font-semibold">
                                {plan.flight_code}
                              </span>
                            )}
                          </div>
                        </div>

                        {plan.description && plan.description !== 'Flight Travel' && (
                          <div className="flex-1 sm:max-w-xs">
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {plan.description}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 sm:w-40">
                          <img
                            src={plan.profiles?.avatar_url || '/placeholder-avatar.png'}
                            alt={plan.profiles?.full_name || 'User'}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="text-xs sm:text-sm text-slate-200">
                            {plan.profiles?.full_name || 'Anonymous'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 justify-between sm:justify-end">
                          <span className="inline-flex items-center rounded-full border border-purple-500 text-xs text-purple-300 px-3 py-1 hover:bg-purple-500/10">
                            View details
                          </span>
                          {(plan.user_id === user?.id || permissions.can_delete_any) && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPost(plan);
                                }}
                                className="p-1.5 text-slate-400 hover:text-purple-400 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePost(plan.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    {inlineAds.length > 0 && inlineAds[0].image_url && groupIndex === 0 && index === 4 && (
                      <div className="p-3">
                        <button
                          type="button"
                          onClick={() => handleAdClick(inlineAds[0])}
                          className="block w-full"
                        >
                          <img
                            src={inlineAds[0].image_url}
                            alt={inlineAds[0].title}
                            className="w-full max-h-32 object-cover rounded-xl border border-slate-800 shadow"
                          />
                        </button>
                      </div>
                    )}
                    </React.Fragment>
                    );
                  })}
                </div>
              </section>
                ));
              })()}
            </div>

            {/* RIGHT COLUMN - Vertical Ads */}
            <div className="lg:col-span-3">
              <div>
                {rightAds.length > 0 ? (
                  <div className="space-y-4 mb-4">
                    {rightAds.filter(ad => ad.image_url).map((ad) => (
                      <button
                        key={ad.id}
                        type="button"
                        onClick={() => handleAdClick(ad)}
                        className="block w-full"
                      >
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="w-full max-h-[420px] object-cover rounded-2xl border border-slate-800 shadow-md"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-xl font-heading font-bold text-white mb-1">
                        Sponsored Ads
                      </h3>
                      <div className="h-0.5 w-28 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
                    </div>

                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <div
                          key={num}
                          className="relative rounded-xl overflow-hidden cursor-pointer hover:shadow-glow transition-all duration-300 hover:scale-105"
                        >
                          <div className="aspect-[4/3] bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10"></div>
                            <div className="relative z-10 text-center p-4">
                              <div className="text-4xl mb-2">📢</div>
                              <div className="text-white text-sm font-bold">Ad Space {num}</div>
                              <div className="text-gray-400 text-xs mt-1">Your ad here</div>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs">
                              Ad
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {selectedPlan && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="relative w-full max-w-2xl bg-[#020617] text-slate-50 shadow-2xl border border-slate-800 rounded-2xl flex flex-col max-h-[90vh]">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-700 flex-shrink-0">
                  <h2 className="text-base sm:text-lg font-semibold text-white pr-2 flex-1">
                    {selectedPlan.travel_categories?.name === 'Flight Travel' ? 'Flight Travel Details' : 'Travel Companion Needed'}
                  </h2>
                  <button
                    type="button"
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded-full text-white shadow-xl transition-colors"
                    onClick={() => setSelectedPlan(null)}
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 overflow-y-auto">

                <div className="mb-4 flex items-center gap-3 pb-4 border-b border-slate-800">
                  <img
                    src={selectedPlan.profiles?.avatar_url || '/placeholder-avatar.png'}
                    alt={selectedPlan.profiles?.full_name || 'User'}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-base font-semibold text-white">
                      {selectedPlan.profiles?.full_name || 'Anonymous'}
                    </p>
                  </div>
                </div>

                {selectedPlan.travel_categories?.name === 'Flight Travel' ? (
                  <div className="space-y-4">
                    {selectedPlan.title && (
                      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <div className="text-xs font-medium text-purple-400 uppercase tracking-wide mb-1">Title</div>
                        <div className="text-white text-lg font-semibold">{selectedPlan.title}</div>
                      </div>
                    )}

                    {selectedPlan.role && (
                      <div>
                        <div className="text-sm font-medium text-slate-400 mb-2">Participation Role</div>
                        <div className="inline-flex px-3 py-1.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-full text-sm font-medium">
                          {selectedPlan.role}
                        </div>
                      </div>
                    )}

                    {selectedPlan.flight_code && (
                      <div>
                        <div className="text-sm font-medium text-slate-400 mb-2">Flight Code</div>
                        <div className="text-white text-xl font-mono font-bold">{selectedPlan.flight_code}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Origin Airport</div>
                        <div className="text-white font-semibold text-base">{selectedPlan.origin_airport || selectedPlan.from_location}</div>
                      </div>
                      <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Destination Airport</div>
                        <div className="text-white font-semibold text-base">{selectedPlan.destination_airport || selectedPlan.destination}</div>
                      </div>
                    </div>

                    {(selectedPlan.depart_at || selectedPlan.arrive_at) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedPlan.depart_at && (
                          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Departure</div>
                            <div className="space-y-1">
                              <div className="text-white font-semibold text-sm">
                                {new Date(selectedPlan.depart_at).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-purple-400 font-bold text-lg">
                                {new Date(selectedPlan.depart_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedPlan.arrive_at && (
                          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Arrival</div>
                            <div className="space-y-1">
                              <div className="text-white font-semibold text-sm">
                                {new Date(selectedPlan.arrive_at).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-purple-400 font-bold text-lg">
                                {new Date(selectedPlan.arrive_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedPlan.description && selectedPlan.description !== 'Flight Travel' && (
                      <div>
                        <div className="text-sm font-medium text-slate-400 mb-2">Message</div>
                        <div className="text-white whitespace-pre-wrap bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm max-h-32 overflow-y-auto">{selectedPlan.description}</div>
                      </div>
                    )}

                    {selectedPlan.languages && (
                      <div>
                        <div className="text-sm font-medium text-slate-400 mb-2">Languages Spoken</div>
                        <div className="text-white">{selectedPlan.languages}</div>
                      </div>
                    )}

                    {selectedPlan.contact_method && selectedPlan.contact_value && (
                      <div className="p-4 bg-slate-800/50 border border-purple-500/30 rounded-lg">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Contact Information</div>
                        <div className="text-white flex items-center gap-2">
                          <span className="capitalize text-purple-400 font-medium">{selectedPlan.contact_method}:</span>
                          <span className="font-semibold">{selectedPlan.contact_value}</span>
                          <button
                            onClick={() => copyToClipboard(selectedPlan.contact_value || '')}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                            title="Copy contact"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs sm:text-sm">
                    {selectedPlan.travel_dates && (
                      <>
                        <div className="text-slate-400">Travel Date:</div>
                        <div className="text-slate-50">{formatDate(selectedPlan.travel_dates)}</div>
                      </>
                    )}
                    <div className="text-slate-400">Origin:</div>
                    <div className="text-slate-50">{selectedPlan.from_location}</div>
                    <div className="text-slate-400">Destination:</div>
                    <div className="text-slate-50">{selectedPlan.destination}</div>
                    {selectedPlan.budget_range && (
                      <>
                        <div className="text-slate-400">Budget:</div>
                        <div className="text-slate-50">{selectedPlan.budget_range}</div>
                      </>
                    )}
                    {selectedPlan.looking_for && (
                      <>
                        <div className="text-slate-400">Looking for:</div>
                        <div className="text-slate-50">{selectedPlan.looking_for}</div>
                      </>
                    )}
                    <div className="text-slate-400">Message:</div>
                    <div className="text-slate-50 max-h-32 overflow-y-auto">{selectedPlan.description}</div>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingPost(null);
          setFormData({
            category_id: '',
            from_location: '',
            destination: '',
            travel_dates: '',
            description: '',
          });
          setFlightData({
            email: user?.email || '',
            role: '',
            flight_code: '',
            source_airport: '',
            destination_airport: '',
            depart_at: '',
            arrive_at: '',
            title: '',
            message: '',
            languages: '',
            contact_method: '',
            contact_value: '',
          });
        }}
        title={editingPost ? "Edit Your Travel Plan" : "Post Your Travel Plan"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <Select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          {(() => {
            const selectedCategoryObj = categories.find(c => c.id === formData.category_id);
            const isFlight = selectedCategoryObj?.name === 'Flight Travel';

            return (
              <>
                {!isFlight && (
                  <>
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
                        Travel Date
                      </label>
                      <Input
                        type="date"
                        value={formData.travel_dates}
                        onChange={(e) => setFormData({ ...formData, travel_dates: e.target.value })}
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
                  </>
                )}

                {isFlight && (
                  <div className="mt-6 space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-5">
                <h3 className="text-base font-semibold text-slate-100 mb-1">
                  Flight Travel Details
                </h3>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={flightData.email}
                    onChange={(e) => setFlightData({ ...flightData, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <p className="mb-2 block text-xs font-medium text-slate-300">
                    Participation Role *
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="Offering Help"
                        checked={flightData.role === 'Offering Help'}
                        onChange={() => setFlightData({ ...flightData, role: 'Offering Help' })}
                        className="h-4 w-4"
                      />
                      <span className="text-gray-300">Offering Help</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="Seeking Help"
                        checked={flightData.role === 'Seeking Help'}
                        onChange={() => setFlightData({ ...flightData, role: 'Seeking Help' })}
                        className="h-4 w-4"
                      />
                      <span className="text-gray-300">Seeking Help</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Flight Code
                  </label>
                  <Input
                    type="text"
                    value={flightData.flight_code}
                    onChange={(e) => setFlightData({ ...flightData, flight_code: e.target.value.toUpperCase() })}
                    placeholder="QR4775"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Not your airline name, share the flight code (helps identify delays / multiple flights).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Origin *
                    </label>
                    <Input
                      type="text"
                      value={flightData.source_airport}
                      onChange={(e) => setFlightData({ ...flightData, source_airport: e.target.value.toUpperCase() })}
                      placeholder="HYD"
                      maxLength={4}
                      required
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      NOT the city name – use the airport code from your ticket (3 or 4 letters).
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Destination *
                    </label>
                    <Input
                      type="text"
                      value={flightData.destination_airport}
                      onChange={(e) => setFlightData({ ...flightData, destination_airport: e.target.value.toUpperCase() })}
                      placeholder="JFK"
                      maxLength={4}
                      required
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      NOT the city name – use the airport code from your ticket (3 or 4 letters).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Departure *
                    </label>
                    <Input
                      type="datetime-local"
                      value={flightData.depart_at}
                      onChange={(e) => setFlightData({ ...flightData, depart_at: e.target.value })}
                      required
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Departure Date &amp; Time in local time zone (approximate is ok).
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Arrival *
                    </label>
                    <Input
                      type="datetime-local"
                      value={flightData.arrive_at}
                      onChange={(e) => setFlightData({ ...flightData, arrive_at: e.target.value })}
                      required
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Arrival Date &amp; Time in local time zone.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Title *
                  </label>
                  <Input
                    type="text"
                    value={flightData.title}
                    onChange={(e) => setFlightData({ ...flightData, title: e.target.value })}
                    placeholder="First thing people read on your travel"
                    required
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    First thing people read on your travel, keep this precise.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Message
                  </label>
                  <textarea
                    value={flightData.message}
                    onChange={(e) => setFlightData({ ...flightData, message: e.target.value })}
                    placeholder="Any additional details you may want to add"
                    rows={3}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Languages you speak
                  </label>
                  <Input
                    type="text"
                    value={flightData.languages}
                    onChange={(e) => setFlightData({ ...flightData, languages: e.target.value })}
                    placeholder="Telugu, English"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Use a comma or colon separator. Example: Telugu, English.
                  </p>
                </div>

                <div>
                  <p className="mb-2 block text-xs font-medium text-slate-300">
                    Contact *
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm mb-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contactMethod"
                        value="instagram"
                        checked={flightData.contact_method === 'instagram'}
                        onChange={() => setFlightData({ ...flightData, contact_method: 'instagram' })}
                        className="h-4 w-4"
                      />
                      <span className="text-gray-300">Instagram</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contactMethod"
                        value="phone"
                        checked={flightData.contact_method === 'phone'}
                        onChange={() => setFlightData({ ...flightData, contact_method: 'phone' })}
                        className="h-4 w-4"
                      />
                      <span className="text-gray-300">Phone</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contactMethod"
                        value="email"
                        checked={flightData.contact_method === 'email'}
                        onChange={() => setFlightData({ ...flightData, contact_method: 'email' })}
                        className="h-4 w-4"
                      />
                      <span className="text-gray-300">Email</span>
                    </label>
                  </div>
                  <p className="mb-2 text-[10px] text-slate-500">
                    Please share the contact where you want to be reached (Instagram, phone or email).
                  </p>
                  <Input
                    type="text"
                    value={flightData.contact_value}
                    onChange={(e) => setFlightData({ ...flightData, contact_value: e.target.value })}
                    placeholder={
                      flightData.contact_method === 'instagram'
                        ? '@your_instagram'
                        : flightData.contact_method === 'phone'
                        ? '+1 234 567 8900'
                        : 'contact@email.com'
                    }
                    required
                  />
                </div>
                  </div>
                )}
              </>
            );
          })()}

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
                });
                setFlightData({
                  email: user?.email || '',
                  role: '',
                  flight_code: '',
                  source_airport: '',
                  destination_airport: '',
                  depart_at: '',
                  arrive_at: '',
                  title: '',
                  message: '',
                  languages: '',
                  contact_method: '',
                  contact_value: '',
                });
              }}
              className="flex-1 px-6 py-3 border border-border rounded-lg text-gray-300 hover:bg-surface/50 transition-colors"
            >
              Cancel
            </button>
            <GradientButton
              onClick={handleCreatePost}
              disabled={(() => {
                const selectedCategoryObj = categories.find(c => c.id === formData.category_id);
                const isFlight = selectedCategoryObj?.name === 'Flight Travel';

                if (isFlight) {
                  return !flightData.source_airport.trim() ||
                         !flightData.destination_airport.trim() ||
                         !flightData.depart_at.trim() ||
                         !flightData.arrive_at.trim() ||
                         !flightData.title.trim() ||
                         !flightData.contact_value.trim();
                }

                return !formData.from_location.trim() ||
                       !formData.destination.trim() ||
                       !formData.description.trim();
              })()}
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

      {/* Popup Modal for Popup Ads */}
      {popupAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-lg mx-4 rounded-2xl bg-[#020617] border border-slate-800 shadow-2xl p-5 relative">
            <button
              type="button"
              onClick={() => setPopupAd(null)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-100 text-sm"
            >
              ✕
            </button>

            <h2 className="text-sm sm:text-base font-semibold text-slate-50 mb-2">
              {popupAd.title}
            </h2>

            <img
              src={popupAd.popup_image_url ?? popupAd.image_url ?? ""}
              alt={popupAd.title}
              className="w-full rounded-xl mb-3"
            />

            {popupAd.popup_description && (
              <p className="mb-3 text-xs sm:text-sm text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {popupAd.popup_description}
              </p>
            )}

            {popupAd.redirect_url && (
              <a
                href={popupAd.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md"
              >
                Visit Website
              </a>
            )}
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPost(null);
        }}
        title={selectedPost?.travel_categories?.name === 'Flight Travel' ? 'Flight Travel Details' : 'Travel Plan Details'}
      >
        {selectedPost && (() => {
          const isFlight = selectedPost.travel_categories?.name === 'Flight Travel';

          return (
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b border-border">
                <Avatar
                  src={selectedPost.profiles?.avatar_url}
                  alt={selectedPost.profiles?.full_name || 'User'}
                  size="lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">
                    {selectedPost.profiles?.full_name || 'Unknown User'}
                  </h3>
                </div>
              </div>

              {isFlight ? (
                <div className="space-y-4">
                  {selectedPost.title && (
                    <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                      <label className="block text-xs font-medium text-primary-400 uppercase tracking-wide mb-1">Title</label>
                      <p className="text-white text-lg font-semibold">{selectedPost.title}</p>
                    </div>
                  )}

                  {selectedPost.role && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Participation Role</label>
                      <div className="inline-flex px-3 py-1.5 bg-gradient-primary text-white rounded-full text-sm font-medium">
                        {selectedPost.role}
                      </div>
                    </div>
                  )}

                  {selectedPost.flight_code && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Flight Code</label>
                      <p className="text-white text-lg font-mono font-bold">{selectedPost.flight_code}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-surface-lighter border border-border rounded-lg">
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Origin Airport</label>
                      <p className="text-white font-semibold text-base">{selectedPost.origin_airport || selectedPost.from_location}</p>
                    </div>
                    <div className="p-3 bg-surface-lighter border border-border rounded-lg">
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Destination Airport</label>
                      <p className="text-white font-semibold text-base">{selectedPost.destination_airport || selectedPost.destination}</p>
                    </div>
                  </div>

                  {(selectedPost.depart_at || selectedPost.arrive_at) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedPost.depart_at && (
                        <div className="p-4 bg-surface-lighter border border-border rounded-lg">
                          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Departure</label>
                          <div className="space-y-1">
                            <p className="text-white font-semibold text-base">
                              {new Date(selectedPost.depart_at).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-primary-400 font-bold text-lg">
                              {new Date(selectedPost.depart_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedPost.arrive_at && (
                        <div className="p-4 bg-surface-lighter border border-border rounded-lg">
                          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Arrival</label>
                          <div className="space-y-1">
                            <p className="text-white font-semibold text-base">
                              {new Date(selectedPost.arrive_at).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-primary-400 font-bold text-lg">
                              {new Date(selectedPost.arrive_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPost.description && selectedPost.description !== 'Flight Travel' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                      <p className="text-white whitespace-pre-wrap bg-surface-lighter border border-border rounded-lg p-4">{selectedPost.description}</p>
                    </div>
                  )}

                  {selectedPost.languages && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Languages Spoken</label>
                      <p className="text-white">{selectedPost.languages}</p>
                    </div>
                  )}

                  {selectedPost.contact_method && selectedPost.contact_value && (
                    <div className="p-4 bg-surface-lighter border border-primary-500/30 rounded-lg">
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Contact Information</label>
                      <p className="text-white">
                        <span className="capitalize text-primary-400 font-medium">{selectedPost.contact_method}</span>: <span className="font-semibold">{selectedPost.contact_value}</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg">
                    <span className="text-white">{selectedPost.from_location}</span>
                    <Plane className="w-5 h-5 text-primary-400 flex-shrink-0" />
                    <span className="text-primary-400 font-medium">{selectedPost.destination}</span>
                  </div>

                  {selectedPost.travel_dates && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Travel Dates</label>
                      <p className="text-white">{selectedPost.travel_dates}</p>
                    </div>
                  )}

                  {selectedPost.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                      <p className="text-white whitespace-pre-wrap">{selectedPost.description}</p>
                    </div>
                  )}

                  {selectedPost.budget_range && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Budget Range</label>
                      <p className="text-white">{selectedPost.budget_range}</p>
                    </div>
                  )}

                  {selectedPost.looking_for && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Looking For</label>
                      <p className="text-white">{selectedPost.looking_for}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-gray-400">
                  Posted on {new Date(selectedPost.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <GradientButton
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPost(null);
                }}
                className="w-full"
              >
                Close
              </GradientButton>
            </div>
          );
        })()}
      </Modal>
        </div>
      </main>

      {/* Footer Banner Ads */}
      {(footerLeftAds.length > 0 || footerRightAds.length > 0) && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {footerLeftAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {footerRightAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}

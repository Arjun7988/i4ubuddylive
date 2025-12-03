import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Shield,
  Zap,
  PieChart,
  Wallet,
  Users,
  Calendar,
  Receipt,
  Plane,
  ShoppingBag,
  Bot,
  DollarSign,
  BarChart3,
  CreditCard,
  Target,
  Bell,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play
} from 'lucide-react';
import { GradientButton } from '../components/GradientButton';
import { Header } from '../components/Header';
import { ScrollingServiceBanner } from '../components/ScrollingServiceBanner';
import { useState, useEffect } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '$50M+', label: 'Money Managed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'User Rating' }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <Header />

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-64 h-64 bg-magenta-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative pt-32">

        {/* Hero Section with Fixed Height */}
        <div className="min-h-[500px] flex items-center">
          <ScrollingServiceBanner />
        </div>

        {/* Service 1: Classifieds - Left Image, Right Content */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative group animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative glass glass-border rounded-3xl overflow-hidden p-4">
                <div className="aspect-video bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />
                  <Play className="w-20 h-20 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 cursor-pointer" />
                  <span className="absolute bottom-4 right-4 text-white/60 text-sm">Video Demo</span>
                </div>
              </div>
            </div>
            <div className="space-y-6 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 rounded-full border border-pink-500/20">
                <ShoppingBag className="w-5 h-5 text-pink-400" />
                <span className="text-pink-400 font-semibold">CLASSIFIEDS</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
                Your Trusted{' '}
                <span className="bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
                  Marketplace
                </span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Buy, sell, and discover amazing deals in your trusted community network. Connect with local sellers, browse verified listings, and make secure transactions.
              </p>
              <div className="space-y-4">
                {[
                  'Post unlimited listings with high-quality images',
                  'Search and filter by category, location, and price',
                  'Verified sellers and secure messaging',
                  'Featured listings to boost visibility'
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              <GradientButton
                onClick={() => navigate('/classifieds')}
                className="group"
              >
                Explore Classifieds
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </div>
          </div>
        </section>

        {/* Service 2: Travel Companion - Right Image, Left Content */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-up lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                <Plane className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400 font-semibold">TRAVEL COMPANION</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
                Discover Your{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Travel Buddy
                </span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Connect with fellow adventurers, share journeys, and create unforgettable memories. Find travel companions who match your style and destination preferences.
              </p>
              <div className="glass glass-border rounded-2xl p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Why Travelers Love Us
                </h3>
                {[
                  'Match with verified travelers worldwide',
                  'Share trip itineraries and split costs',
                  'Real-time chat and location sharing',
                  'Safety ratings and reviews system'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                    {feature}
                  </div>
                ))}
              </div>
              <GradientButton
                onClick={() => navigate('/travel')}
                className="group"
              >
                Find Travel Buddies
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </div>
            <div className="relative group animate-fade-in lg:order-2">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative glass glass-border rounded-3xl overflow-hidden p-4">
                <div className="aspect-video bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />
                  <Play className="w-20 h-20 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 cursor-pointer" />
                  <span className="absolute bottom-4 right-4 text-white/60 text-sm">See How It Works</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service 3: Community Chatbot - Centered Card Style */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20 mb-6">
                <Bot className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-semibold">COMMUNITY CHATBOT</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight mb-6">
                Stay Connected with{' '}
                <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                  Community Hub
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Join real-time community discussions, get instant updates, and engage with important announcements all in one place.
              </p>
            </div>

            <div className="relative group animate-slide-up">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative glass glass-border rounded-3xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-8 md:p-12 space-y-6">
                    <h3 className="text-2xl font-heading font-bold text-white">Real-Time Messaging</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Experience seamless communication with instant messaging, image sharing, and threaded replies. Never miss important community updates.
                    </p>
                    <div className="space-y-3">
                      {[
                        'Unlimited messaging with the community',
                        'Share images and media instantly',
                        'Reply to specific messages in threads',
                        'Admin announcements and pinned messages'
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-purple-400" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <GradientButton
                      onClick={() => navigate('/chatbot')}
                      size="sm"
                      className="group"
                    >
                      Join Chat
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </GradientButton>
                  </div>
                  <div className="p-4 flex items-center justify-center bg-gradient-to-br from-purple-500/5 to-violet-500/5">
                    <div className="w-full aspect-square bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                      }} />
                      <Play className="w-16 h-16 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service 4: RSVP Events - Split Screen */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative group animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative glass glass-border rounded-3xl overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 rounded-2xl relative overflow-hidden m-4">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-20 h-20 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 cursor-pointer" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-4 left-4 text-white font-semibold">Event Management Demo</span>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Average Response Time</span>
                    <span className="text-amber-400 font-bold">2 Hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Success Rate</span>
                    <span className="text-amber-400 font-bold">98%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/20">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-semibold">RSVP EVENTS</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
                Plan Perfect{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Events
                </span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Create memorable gatherings with seamless guest management. Send invites, track responses, and coordinate every detail effortlessly.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, label: 'Guest Management' },
                  { icon: Bell, label: 'Auto Reminders' },
                  { icon: Calendar, label: 'Schedule Sync' },
                  { icon: CheckCircle2, label: 'RSVP Tracking' }
                ].map((item, i) => (
                  <div key={i} className="glass glass-border rounded-xl p-4 hover:scale-105 transition-transform">
                    <item.icon className="w-8 h-8 text-amber-400 mb-2" />
                    <span className="text-white text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <GradientButton
                onClick={() => navigate('/rsvp')}
                className="group"
              >
                Create Event
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </div>
          </div>
        </section>

        {/* Service 5: Split Wise - Modern Card Layout */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-up lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <Users className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">SPLIT WISE</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
                Share Expenses{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Fairly
                </span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Split bills with friends effortlessly and keep perfect track of shared expenses. No more awkward money conversations or forgotten IOUs.
              </p>
              <div className="space-y-4">
                <div className="glass glass-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-semibold">Key Features</span>
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="space-y-3">
                    {[
                      'Split bills equally or custom amounts',
                      'Track who owes what in real-time',
                      'Settle up with integrated payments',
                      'Complete expense history and reports'
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <GradientButton
                onClick={() => navigate('/split')}
                className="group"
              >
                Start Splitting
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </div>
            <div className="relative group animate-fade-in lg:order-2">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative glass glass-border rounded-3xl overflow-hidden p-4">
                <div className="aspect-video bg-gradient-to-br from-emerald-500 via-teal-500 to-green-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />
                  <Play className="w-20 h-20 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 cursor-pointer" />
                  <span className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-white text-sm font-semibold">
                    Tutorial
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service 6: Daily Transactions - Dashboard Preview */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
                <Wallet className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-semibold">DAILY TRANSACTIONS</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight mb-6">
                Track Money{' '}
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Automatically
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Monitor every expense, categorize transactions intelligently, and stay on top of your budget with powerful tracking tools.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-slide-up">
              {[
                { icon: BarChart3, label: 'Smart Analytics', desc: 'AI-powered insights' },
                { icon: CreditCard, label: 'Auto Categorize', desc: 'Save time tracking' },
                { icon: Target, label: 'Budget Goals', desc: 'Stay on target' }
              ].map((item, i) => (
                <div key={i} className="glass glass-border rounded-2xl p-6 hover:scale-105 transition-transform">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.label}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="relative group animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative glass glass-border rounded-3xl overflow-hidden p-4">
                <div className="aspect-video bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />
                  <Play className="w-20 h-20 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 cursor-pointer" />
                  <span className="absolute bottom-4 right-4 text-white/80 text-sm">Dashboard Walkthrough</span>
                </div>
              </div>
              <div className="text-center mt-6">
                <GradientButton
                  onClick={() => navigate('/transactions')}
                  className="group"
                >
                  Start Tracking
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </GradientButton>
              </div>
            </div>
          </div>
        </section>

        {/* Service 7: Coupons - Grid Layout */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative group animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
              <div className="relative glass glass-border rounded-3xl overflow-hidden p-4">
                <div className="aspect-video bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />
                  <Play className="w-20 h-20 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 cursor-pointer" />
                  <div className="absolute top-4 right-4 px-4 py-2 bg-white/20 backdrop-blur-xl rounded-full">
                    <span className="text-white font-bold">Save Up to 50%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-full border border-rose-500/20">
                <Receipt className="w-5 h-5 text-rose-400" />
                <span className="text-rose-400 font-semibold">COUPONS & DEALS</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
                Maximize Your{' '}
                <span className="bg-gradient-to-r from-rose-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Savings
                </span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Discover exclusive deals and unlock special offers. Save more on everyday purchases with curated coupons from your favorite brands.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Active Deals', value: '500+' },
                  { label: 'Local Vendors', value: '200+' },
                  { label: 'Categories', value: '50+' },
                  { label: 'Avg. Savings', value: '30%' }
                ].map((stat, i) => (
                  <div key={i} className="glass glass-border rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-rose-400 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
              <GradientButton
                onClick={() => navigate('/coupons')}
                className="group"
              >
                Browse Coupons
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </div>
          </div>
        </section>

        {/* Testimonials / Social Proof */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              What Our Users{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 bg-clip-text text-transparent">
                Say
              </span>
            </h2>
          </div>

          <div className="relative overflow-hidden">
            <div className="flex gap-6 animate-scroll-slow hover:pause-animation pb-4">
              {[
                {
                  quote: "This platform has completely transformed how I manage my finances and connect with my community. The all-in-one approach saves me so much time!",
                  name: "Sarah Johnson",
                  role: "Small Business Owner",
                  rating: 5
                },
                {
                  quote: "The bill splitting feature is a game changer! No more awkward conversations about who owes what. Everything is tracked perfectly.",
                  name: "Michael Chen",
                  role: "Graduate Student",
                  rating: 5
                },
                {
                  quote: "I love the travel companion feature. I've met amazing people and discovered hidden gems through this community. Absolutely worth it!",
                  name: "Emma Rodriguez",
                  role: "Travel Blogger",
                  rating: 5
                },
                {
                  quote: "The RSVP system made planning my wedding so much easier. Guest management was seamless and stress-free. Highly recommend!",
                  name: "David Williams",
                  role: "Event Organizer",
                  rating: 5
                },
                {
                  quote: "Best financial app I've ever used. The budget tracking keeps me on top of my spending, and the interface is beautiful and intuitive.",
                  name: "Jessica Martinez",
                  role: "Marketing Manager",
                  rating: 5
                }
              ].concat([
                {
                  quote: "This platform has completely transformed how I manage my finances and connect with my community. The all-in-one approach saves me so much time!",
                  name: "Sarah Johnson",
                  role: "Small Business Owner",
                  rating: 5
                },
                {
                  quote: "The bill splitting feature is a game changer! No more awkward conversations about who owes what. Everything is tracked perfectly.",
                  name: "Michael Chen",
                  role: "Graduate Student",
                  rating: 5
                },
                {
                  quote: "I love the travel companion feature. I've met amazing people and discovered hidden gems through this community. Absolutely worth it!",
                  name: "Emma Rodriguez",
                  role: "Travel Blogger",
                  rating: 5
                },
                {
                  quote: "The RSVP system made planning my wedding so much easier. Guest management was seamless and stress-free. Highly recommend!",
                  name: "David Williams",
                  role: "Event Organizer",
                  rating: 5
                },
                {
                  quote: "Best financial app I've ever used. The budget tracking keeps me on top of my spending, and the interface is beautiful and intuitive.",
                  name: "Jessica Martinez",
                  role: "Marketing Manager",
                  rating: 5
                }
              ]).map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[400px] glass glass-border rounded-2xl p-8 hover:shadow-glow transition-all duration-300"
                >
                  <div className="flex items-center justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Sparkles key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-white mb-6 leading-relaxed min-h-[120px]">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="text-center">
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="relative overflow-hidden glass glass-border rounded-3xl p-12 md:p-16 max-w-4xl mx-auto text-center animate-fade-in group hover:shadow-glow transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-magenta-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                <span className="text-white">Start Your Journey</span>{' '}
                <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                  Today
                </span>
              </h2>

              <div className="flex items-center justify-center gap-4 flex-wrap">
                <GradientButton size="lg" onClick={() => navigate('/auth')}>
                  Get Started Free
                </GradientButton>
                <GradientButton
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </GradientButton>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                No credit card required • Free forever plan available
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-12 border-t border-border mt-[50px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-8 h-8 text-primary-500" />
                <span className="text-2xl font-heading font-bold text-white">FinanceAI</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Your all-in-one platform for managing finances, connecting with friends,
                and living your best life.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
            <p className="text-gray-500 text-sm">
              &copy; 2025 FinanceAI. Built with AI-powered intelligence.
            </p>
            <button
              onClick={() => navigate('/master-admin/login')}
              className="text-xs text-gray-600 hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Master Admin
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

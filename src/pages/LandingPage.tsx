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
  Sparkles
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

  const services = [
    {
      icon: ShoppingBag,
      title: 'Classifieds',
      description: 'Your complete marketplace for buying, selling, and discovering amazing deals in your trusted community network.',
      color: 'from-pink-500 via-rose-500 to-red-500',
      delay: '0ms',
      path: '/classifieds'
    },
    {
      icon: Plane,
      title: 'Travel Companion',
      description: 'Connect with fellow adventurers, share journeys, and create unforgettable travel memories with like-minded explorers worldwide.',
      color: 'from-cyan-500 via-blue-500 to-indigo-500',
      delay: '100ms',
      path: '/travel'
    },
    {
      icon: Bot,
      title: 'Chatbot',
      description: 'Stay connected with our community messaging hub for real-time updates, announcements, and important notifications.',
      color: 'from-purple-500 via-violet-500 to-purple-600',
      delay: '200ms',
      path: '/chatbot'
    },
    {
      icon: Calendar,
      title: 'RSVP Events',
      description: 'Plan memorable gatherings, track guest responses, and coordinate perfect events with seamless RSVP management tools.',
      color: 'from-amber-500 via-orange-500 to-yellow-500',
      delay: '0ms',
      path: '/rsvp'
    },
    {
      icon: Users,
      title: 'Split Wise',
      description: 'Share expenses fairly with friends, track payments effortlessly, and maintain perfect records of who owes what.',
      color: 'from-emerald-500 via-teal-500 to-green-500',
      delay: '100ms',
      path: '/split'
    },
    {
      icon: Wallet,
      title: 'Daily Transactions',
      description: 'Monitor every expense automatically, categorize transactions intelligently, and stay on top of your budget with powerful tracking.',
      color: 'from-blue-600 via-indigo-600 to-purple-600',
      delay: '200ms',
      path: '/transactions'
    },
    {
      icon: Receipt,
      title: 'Coupons',
      description: 'Discover exclusive deals, unlock special offers, and maximize your savings with curated coupons and promotions near you.',
      color: 'from-rose-500 via-pink-500 to-fuchsia-500',
      delay: '0ms',
      path: '/coupons'
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Real-time Sync',
      description: 'Your data synced across all devices instantly'
    },
    {
      icon: Shield,
      title: 'Bank-level Security',
      description: 'Your financial data is encrypted and secure'
    },
    {
      icon: Target,
      title: 'Goal Tracking',
      description: 'Set and achieve your financial goals'
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Get notified about important financial events'
    }
  ];

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

        {/* Scrolling Service Banner */}
        <ScrollingServiceBanner />

        

        {/* Services Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              Everything You Need in{' '}
              <span className="bg-gradient-vibrant bg-clip-text text-transparent">
                One Place
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful tools to manage your finances, connect with friends, and live your best life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                onClick={() => navigate(service.path)}
                className="group glass glass-border rounded-2xl p-8 hover:shadow-glow transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slide-up cursor-pointer"
                style={{ animationDelay: service.delay }}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-heading font-semibold text-white mb-3 group-hover:text-primary-300 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{service.description}</p>
              </div>
            ))}
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

import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Plane,
  Bot,
  Calendar,
  Users,
  Receipt,
  Wallet,
} from 'lucide-react';

interface Service {
  icon: typeof ShoppingBag;
  title: string;
  titlePart1: string;
  titlePart2: string;
  description: string;
  gradient: string;
  glowColor: string;
}

const services: Service[] = [
  {
    icon: ShoppingBag,
    title: 'Classifieds',
    titlePart1: 'Smart Classifieds',
    titlePart2: 'Faster Deals',
    description: 'Find, post, and connect instantly with trusted listings.',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    glowColor: 'rgba(236, 72, 153, 0.5)',
  },
  {
    icon: Plane,
    title: 'Travel Companion',
    titlePart1: 'Find Your Perfect Travel Companion',
    titlePart2: 'Explore World',
    description: 'Match travellers, plan trips, and explore together.',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    glowColor: 'rgba(59, 130, 246, 0.5)',
  },
  {
    icon: Bot,
    title: 'AI Chatbot',
    titlePart1: 'Smart Community Chatbot',
    titlePart2: 'Message Instantly',
    description: 'Join conversations, post freely, and reply anytime.',
    gradient: 'from-purple-500 via-violet-500 to-purple-600',
    glowColor: 'rgba(168, 85, 247, 0.5)',
  },
  {
    icon: Calendar,
    title: 'RSVP Events',
    titlePart1: 'Quick RSVP for Any Event',
    titlePart2: 'Effortlessly',
    description: 'Send invites, track guests, and manage responses easily.',
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    glowColor: 'rgba(249, 115, 22, 0.5)',
  },
  {
    icon: Users,
    title: 'Split Wise',
    titlePart1: 'Share Bills',
    titlePart2: 'Fairly',
    description: 'Split expenses with friends effortlessly and keep track of who owes what with perfect accuracy.',
    gradient: 'from-emerald-500 via-teal-500 to-green-500',
    glowColor: 'rgba(16, 185, 129, 0.5)',
  },
  {
    icon: Wallet,
    title: 'Daily Transactions',
    titlePart1: 'Track Money',
    titlePart2: 'Automatically',
    description: 'Monitor every expense, categorize transactions, and stay on top of your budget with intelligent tracking.',
    gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    glowColor: 'rgba(79, 70, 229, 0.5)',
  },
  {
    icon: Receipt,
    title: 'Coupons & Deals',
    titlePart1: 'Best Coupons for Everyday',
    titlePart2: 'Savings',
    description: 'Find instant deals, redeem offers, and save more daily.',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    glowColor: 'rgba(244, 114, 182, 0.5)',
  },
];

export function ScrollingServiceBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % services.length);
        setIsAnimating(false);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentService = services[currentIndex];
  const Icon = currentService.icon;

  return (
    <div className="relative w-full overflow-hidden py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${currentService.gradient.replace('from-', 'var(--tw-gradient-from, ')})`,
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div
            className="absolute inset-0 opacity-20 blur-2xl"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${currentService.glowColor}, transparent 70%)`,
            }}
          />

          <div
            className={`relative z-10 p-8 md:p-12 transition-all duration-500 ${
              isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
            }`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl border border-white/30 animate-pulse-slow">
                  <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-white text-xs font-semibold border border-white/30">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  NOW FEATURING
                </div>

                <h2 className="text-4xl md:text-6xl font-heading font-bold leading-tight tracking-tight">
                  <span className="text-white">{currentService.titlePart1}</span> &{' '}
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl">
                    {currentService.titlePart2}
                  </span>
                </h2>

                <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl">
                  {currentService.description}
                </p>
              </div>
            </div>

            <div className="flex justify-center md:justify-start gap-2 mt-6">
              {services.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAnimating(true);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setIsAnimating(false);
                    }, 500);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-8 bg-white shadow-lg'
                      : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to ${services[index].title}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

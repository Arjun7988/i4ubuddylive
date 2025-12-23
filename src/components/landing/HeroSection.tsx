import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  BookOpen,
  Calendar,
  Plane,
  PartyPopper,
  Tag,
  Ticket,
  Split,
  Receipt,
  Bot,
  MessageSquare,
  Plus,
  Users,
  Search,
  ArrowRight,
  Mail
} from 'lucide-react';

const categories = [
  { icon: ShoppingBag, label: 'Classifieds', path: '/classifieds' },
  { icon: BookOpen, label: 'Buddy Services', path: '/buddy-services' },
  { icon: Tag, label: 'Deals Buddy', path: '/deals' },
  { icon: Ticket, label: 'Coupons', path: '/coupons' },
  { icon: MessageSquare, label: 'Community Feed', path: '/chatbot' },
  { icon: Plane, label: 'Travel Companion', path: '/travel' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: PartyPopper, label: 'RSVP', path: '/rsvp' },
  { icon: Split, label: 'Split Bills', path: '/split' },
  { icon: Receipt, label: 'Transactions', path: '/transactions' },
];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT SIDEBAR - Quikr-style Categories */}
        <div className="lg:col-span-3">
          <div
            className="rounded-2xl p-6 backdrop-blur-sm"
            style={{
              background: 'rgba(12, 15, 26, 0.8)',
              border: '1px solid rgba(77, 184, 255, 0.15)'
            }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: '#FFFFFF' }}>
              Explore Services
            </h3>

            <div className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.label}
                    onClick={() => navigate(category.path)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group"
                    style={{
                      background: 'rgba(20, 24, 40, 0.6)',
                      border: '1px solid rgba(77, 184, 255, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(77, 184, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(77, 184, 255, 0.5)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(77, 184, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(20, 24, 40, 0.6)';
                      e.currentTarget.style.borderColor = 'rgba(77, 184, 255, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'rgba(77, 184, 255, 0.2)'
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#4DB8FF' }} />
                    </div>
                    <span
                      className="text-sm font-medium flex-1 text-left"
                      style={{ color: '#C4CBDA' }}
                    >
                      {category.label}
                    </span>
                    <ArrowRight
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#4DB8FF' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT HERO AREA */}
        <div className="lg:col-span-9">
          <div
            className="rounded-[28px] p-8 md:p-12 relative overflow-hidden"
            style={{
              background: 'rgba(16, 21, 38, 0.6)',
              border: '1px solid rgba(77, 184, 255, 0.25)'
            }}
          >
            {/* Gradient Waves */}
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(77, 184, 255, 0.8), transparent 70%)'
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(173, 123, 255, 0.8), transparent 70%)'
              }}
            />

            <div className="relative z-10">
              {/* Hero Text */}
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" style={{ color: '#FFFFFF' }}>
                  Welcome to{' '}
                  <span
                    className="bg-gradient-to-r bg-clip-text text-transparent"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #4DB8FF 0%, #AD7BFF 100%)'
                    }}
                  >
                    i4uBuddy
                  </span>
                  <br />
                  Everything You Need in One Place
                </h1>
                <p className="text-lg md:text-xl max-w-3xl mx-auto" style={{ color: '#C4CBDA' }}>
                  Find services, connect with people, discover events, explore your community.
                </p>
              </div>

              {/* Six Big Neon Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">

                {/* Card 1 - Create a Classified */}
                <div
                  className="rounded-[24px] p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate('/classifieds/new')}
                  style={{
                    background: 'rgba(16, 21, 38, 0.8)',
                    border: '2px solid rgba(173, 123, 255, 0.5)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(173, 123, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(173, 123, 255, 0.2), transparent 70%)',
                      filter: 'blur(20px)'
                    }}
                  />

                  <div className="relative z-10">
                    {/* Icon Bubble */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                      style={{
                        background: 'linear-gradient(135deg, #AD7BFF 0%, #8B5CF6 100%)',
                        boxShadow: '0 8px 32px rgba(173, 123, 255, 0.5)'
                      }}
                    >
                      <Plus className="w-8 h-8" style={{ color: '#FFFFFF' }} />
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-center" style={{ color: '#FFFFFF' }}>
                      Create a Classified
                    </h3>
                    <p className="text-sm text-center" style={{ color: '#C4CBDA' }}>
                      Start selling or find something new.
                    </p>
                  </div>
                </div>

                {/* Card 2 - Find Travel Companions */}
                <div
                  className="rounded-[24px] p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate('/travel')}
                  style={{
                    background: 'rgba(16, 21, 38, 0.8)',
                    border: '2px solid rgba(77, 184, 255, 0.5)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(77, 184, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(77, 184, 255, 0.2), transparent 70%)',
                      filter: 'blur(20px)'
                    }}
                  />

                  <div className="relative z-10">
                    {/* Icon Bubble */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                      style={{
                        background: 'linear-gradient(135deg, #4DB8FF 0%, #2E93D5 100%)',
                        boxShadow: '0 8px 32px rgba(77, 184, 255, 0.5)'
                      }}
                    >
                      <Users className="w-8 h-8" style={{ color: '#FFFFFF' }} />
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-center" style={{ color: '#FFFFFF' }}>
                      Find Travel Companions
                    </h3>
                    <p className="text-sm text-center" style={{ color: '#C4CBDA' }}>
                      Meet people traveling your route.
                    </p>
                  </div>
                </div>

                {/* Card 3 - Discover Events */}
                <div
                  className="rounded-[24px] p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate('/rsvp')}
                  style={{
                    background: 'rgba(16, 21, 38, 0.8)',
                    border: '2px solid rgba(255, 79, 152, 0.5)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(255, 79, 152, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(255, 79, 152, 0.2), transparent 70%)',
                      filter: 'blur(20px)'
                    }}
                  />

                  <div className="relative z-10">
                    {/* Icon Bubble */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                      style={{
                        background: 'linear-gradient(135deg, #FF4F98 0%, #E63980 100%)',
                        boxShadow: '0 8px 32px rgba(255, 79, 152, 0.5)'
                      }}
                    >
                      <Search className="w-8 h-8" style={{ color: '#FFFFFF' }} />
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-center" style={{ color: '#FFFFFF' }}>
                      Discover Events
                    </h3>
                    <p className="text-sm text-center" style={{ color: '#C4CBDA' }}>
                      See what's happening near you.
                    </p>
                  </div>
                </div>

                {/* Card 4 - RSVP */}
                <div
                  className="rounded-[24px] p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate('/rsvp')}
                  style={{
                    background: 'rgba(16, 21, 38, 0.8)',
                    border: '2px solid rgba(30, 223, 203, 0.5)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(30, 223, 203, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(30, 223, 203, 0.2), transparent 70%)',
                      filter: 'blur(20px)'
                    }}
                  />

                  <div className="relative z-10">
                    {/* Icon Bubble */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                      style={{
                        background: 'linear-gradient(135deg, #1EDFCB 0%, #17B5A5 100%)',
                        boxShadow: '0 8px 32px rgba(30, 223, 203, 0.5)'
                      }}
                    >
                      <Mail className="w-8 h-8" style={{ color: '#FFFFFF' }} />
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-center" style={{ color: '#FFFFFF' }}>
                      RSVP
                    </h3>
                    <p className="text-sm text-center" style={{ color: '#C4CBDA' }}>
                      Send invites and track responses.
                    </p>
                  </div>
                </div>

                {/* Card 5 - Community Feed */}
                <div
                  className="rounded-[24px] p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate('/chatbot')}
                  style={{
                    background: 'rgba(16, 21, 38, 0.8)',
                    border: '2px solid rgba(173, 123, 255, 0.5)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(173, 123, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(173, 123, 255, 0.2), transparent 70%)',
                      filter: 'blur(20px)'
                    }}
                  />

                  <div className="relative z-10">
                    {/* Icon Bubble */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                      style={{
                        background: 'linear-gradient(135deg, #AD7BFF 0%, #8B5CF6 100%)',
                        boxShadow: '0 8px 32px rgba(173, 123, 255, 0.5)'
                      }}
                    >
                      <MessageSquare className="w-8 h-8" style={{ color: '#FFFFFF' }} />
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-center" style={{ color: '#FFFFFF' }}>
                      Community Feed
                    </h3>
                    <p className="text-sm text-center" style={{ color: '#C4CBDA' }}>
                      Join conversations and connect.
                    </p>
                  </div>
                </div>

                {/* Card 6 - Buddy Services */}
                <div
                  className="rounded-[24px] p-6 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate('/buddy-services')}
                  style={{
                    background: 'rgba(16, 21, 38, 0.8)',
                    border: '2px solid rgba(77, 184, 255, 0.5)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(77, 184, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(77, 184, 255, 0.2), transparent 70%)',
                      filter: 'blur(20px)'
                    }}
                  />

                  <div className="relative z-10">
                    {/* Icon Bubble */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto"
                      style={{
                        background: 'linear-gradient(135deg, #4DB8FF 0%, #2E93D5 100%)',
                        boxShadow: '0 8px 32px rgba(77, 184, 255, 0.5)'
                      }}
                    >
                      <BookOpen className="w-8 h-8" style={{ color: '#FFFFFF' }} />
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-center" style={{ color: '#FFFFFF' }}>
                      Buddy Services
                    </h3>
                    <p className="text-sm text-center" style={{ color: '#C4CBDA' }}>
                      Find local businesses and services.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

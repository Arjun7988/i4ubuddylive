import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Building2,
  Calendar,
  Plane,
  Users,
  Receipt,
  Wallet,
  CreditCard,
  Bot,
  MessageSquare,
} from 'lucide-react';

const services = [
  { icon: ShoppingBag, title: 'Classifieds', subtitle: 'Buy & Sell Locally', path: '/classifieds', color: 'from-pink-500 to-rose-500' },
  { icon: Building2, title: 'Buddy Services', subtitle: 'Business Directory', path: '/buddy-services', color: 'from-amber-500 to-orange-500' },
  { icon: Calendar, title: 'Events', subtitle: 'Discover Happenings', path: '/rsvp', color: 'from-purple-500 to-violet-500' },
  { icon: Plane, title: 'Travel Companion', subtitle: 'Find Travel Buddies', path: '/travel', color: 'from-cyan-500 to-blue-500' },
  { icon: Users, title: 'RSVP', subtitle: 'Event Management', path: '/rsvp', color: 'from-emerald-500 to-teal-500' },
  { icon: Receipt, title: 'Coupons', subtitle: 'Exclusive Deals', path: '/coupons', color: 'from-rose-500 to-pink-500' },
  { icon: Wallet, title: 'Split Wise', subtitle: 'Share Expenses', path: '/split', color: 'from-green-500 to-emerald-500' },
  { icon: CreditCard, title: 'Transactions', subtitle: 'Track Spending', path: '/transactions', color: 'from-blue-500 to-indigo-500' },
  { icon: Bot, title: 'Chatbot', subtitle: 'AI Assistant', path: '/chatbot', color: 'from-violet-500 to-purple-500' },
  { icon: MessageSquare, title: 'Community Feed', subtitle: 'Connect & Share', path: '/chatbot', color: 'from-fuchsia-500 to-pink-500' },
];

export function ServiceQuickActions() {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {services.map((service, index) => (
          <button
            key={index}
            onClick={() => navigate(service.path)}
            className="glass glass-border rounded-2xl p-6 hover:scale-105 hover:shadow-glow transition-all duration-300 group"
          >
            <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:shadow-glow transition-all duration-300`}>
              <service.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1 text-center">{service.title}</h3>
            <p className="text-gray-400 text-xs text-center">{service.subtitle}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

import {
  Shield,
  Users,
  Zap,
  Heart,
  TrendingUp,
  Clock
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is protected with bank-level encryption and security',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Connect with real people in your area and build lasting relationships',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Zap,
    title: 'All-in-One Platform',
    description: 'Everything you need in one place - no more switching between apps',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: Heart,
    title: 'Easy to Use',
    description: 'Intuitive design that anyone can master in minutes',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'Smart Features',
    description: 'Intelligent tools that help you save time and money',
    gradient: 'from-teal-500 to-emerald-500',
  },
  {
    icon: Clock,
    title: 'Available 24/7',
    description: 'Access your community and services anytime, anywhere',
    gradient: 'from-indigo-500 to-blue-500',
  },
];

export function WhyI4uBuddy() {
  return (
    <div className="relative overflow-hidden glass glass-border rounded-3xl p-8 h-full flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5" />

      <div className="relative z-10 mb-6">
        <h2 className="text-2xl font-heading font-bold text-white">
          Why{' '}
          <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            i4uBuddy
          </span>
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          Join thousands who trust us for their daily needs
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="group relative glass glass-border rounded-2xl p-5 hover:scale-105 transition-all duration-300 overflow-hidden cursor-pointer"
              style={{ background: 'rgba(16, 21, 38, 0.6)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(251, 146, 60, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(77, 184, 255, 0.2)';
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-2xl"
                style={{
                  background: `linear-gradient(135deg, rgba(251, 146, 60, 0.5), rgba(249, 115, 22, 0.5))`
                }}
              />

              <div className="relative z-10 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div>
                  <h3 className="text-white font-bold text-base mb-1 group-hover:text-orange-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mt-6 glass glass-border rounded-2xl p-6 overflow-hidden" style={{ background: 'rgba(16, 21, 38, 0.6)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Trusted by Thousands</h3>
              <p className="text-gray-400 text-xs">Join our growing community</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">50K+</div>
              <div className="text-xs text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">100K+</div>
              <div className="text-xs text-gray-400">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">4.9/5</div>
              <div className="text-xs text-gray-400">User Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Megaphone, Star, TrendingUp, Shield } from 'lucide-react';

export function ClassifiedsBanner() {
  return (
    <div className="relative overflow-hidden glass glass-border rounded-3xl p-8 md:p-12 mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-4xl md:text-5xl font-heading font-bold text-center mb-4">
          <span className="text-white">Buy, Sell, Trade </span>
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Anything
          </span>
        </h2>

        <p className="text-xl text-gray-400 text-center mb-8 max-w-2xl mx-auto">
          Your trusted marketplace for buying and selling items in your community.
          Safe, secure, and simple.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Quality Listings</h3>
            <p className="text-sm text-gray-400">
              Verified and moderated listings for your peace of mind
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Best Deals</h3>
            <p className="text-sm text-gray-400">
              Find amazing deals from trusted sellers in your area
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Safe & Secure</h3>
            <p className="text-sm text-gray-400">
              Protected transactions with verified user profiles
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

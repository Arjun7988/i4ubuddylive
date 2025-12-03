import { Header } from '../components/Header';
import { GlowingCard } from '../components/GlowingCard';
import { Megaphone } from 'lucide-react';

export function ClassifiedsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative pt-[calc(128px+50px)] px-4 lg:px-8 max-w-7xl mx-auto">
        <GlowingCard>
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-4">
              Classifieds
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Buy, sell, and trade items with your community. This feature is coming soon!
            </p>
          </div>
        </GlowingCard>
      </main>
    </div>
  );
}

import { Header } from '../components/Header';
import { GlowingCard } from '../components/GlowingCard';
import { Mail } from 'lucide-react';

export function InvitePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative pt-[calc(128px+50px)] container mx-auto px-4">
        <GlowingCard>
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-4">
              Send Invitations
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Invite friends and family to events and activities. This feature is coming soon!
            </p>
          </div>
        </GlowingCard>
      </main>
    </div>
  );
}

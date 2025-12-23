import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, DollarSign, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { GradientButton } from '../components/GradientButton';
import { Header } from '../components/Header';
import { HeroSection } from '../components/landing/HeroSection';
import { HouseAdCard } from '../components/landing/HouseAdCard';
import { DealsPreview } from '../components/landing/DealsPreview';
import { CouponsPreview } from '../components/landing/CouponsPreview';
import { BuddyServicesPreview } from '../components/landing/BuddyServicesPreview';
import { EventsSidebar } from '../components/landing/EventsSidebar';
import { TravelCompanionPreview } from '../components/landing/TravelCompanionPreview';
import { CommunityHighlights } from '../components/landing/CommunityHighlights';
import { WhyI4uBuddy } from '../components/landing/WhyI4uBuddy';
import { supabase } from '../lib/supabase';

// 🔹 Set this according to the page you are editing
const PAGE_KEY = "HOME";

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

export function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

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

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <div className="min-h-screen overflow-hidden">
      <Header hideNavigation={true} />

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

      <div className="relative pt-20">

        {/* Hero Section */}
        <HeroSection />

        {/* Top Banner Ads */}
        <div className="container mx-auto px-4">
        {(topLeftAds.length > 0 || topRightAds.length > 0) && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                {topLeftAds.map((ad) => (
                  ad.image_url && (
                    <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                    </button>
                  )
                ))}
              </div>
              <div className="space-y-4">
                {topRightAds.map((ad) => (
                  ad.image_url && (
                    <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Three-Column Portal Layout */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT COLUMN - Travel Companions & Events */}
            <div className="lg:col-span-3 space-y-6">
              <TravelCompanionPreview />
              <EventsSidebar />
              <CommunityHighlights />
            </div>

            {/* CENTER COLUMN - Main Content */}
            <div className="lg:col-span-6 space-y-8">
              <BuddyServicesPreview />

              {/* Inline Ads - Display ALL */}
              {inlineAds.length > 0 && (
                <div className="space-y-4">
                  {inlineAds.map((ad) => (
                    ad.image_url && (
                      <button
                        key={ad.id}
                        type="button"
                        onClick={() => handleAdClick(ad)}
                        className="block w-full"
                      >
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="w-full max-h-32 object-cover rounded-xl border border-slate-800 shadow"
                        />
                      </button>
                    )
                  ))}
                </div>
              )}

              <DealsPreview />
              <CouponsPreview />
            </div>

            {/* RIGHT COLUMN - Right Sidebar Ads & Featured Ads */}
            <div className="lg:col-span-3 space-y-6">
              {rightAds.length > 0 ? (
                <div className="space-y-4">
                  {rightAds.map((ad) => (
                    ad.image_url && (
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
                    )
                  ))}
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-heading font-bold text-white mb-4">Featured</h3>
                  <div className="space-y-4">
                    <HouseAdCard
                      imageUrl="https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif"
                      title="Advertise Your Business"
                      description="Reach thousands of local users on i4uBuddy and grow your business."
                      ctaLabel="Learn More"
                      onClick={() => navigate('/classifieds')}
                    />
                    <HouseAdCard
                      imageUrl="https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif"
                      title="Feature Your Event"
                      description="Make your event stand out and get maximum attendance."
                      ctaLabel="Get Started"
                      onClick={() => navigate('/rsvp')}
                    />
                    <HouseAdCard
                      imageUrl="https://media.giphy.com/media/xUPGcl3ijl0vAEyIDK/giphy.gif"
                      title="Boost Your Listing"
                      description="Get your classified seen by more potential buyers today."
                      ctaLabel="Boost Now"
                      onClick={() => navigate('/classifieds')}
                    />
                    <HouseAdCard
                      imageUrl="https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif"
                      title="Promote Your Travel Package"
                      description="Connect with adventure seekers looking for their next trip."
                      ctaLabel="Contact Us"
                      onClick={() => navigate('/travel')}
                    />
                  </div>
                </>
              )}
            </div>

          </div>
        </section>

        {/* Start Your Journey & Why i4uBuddy Side by Side */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

            {/* LEFT: Start Your Journey */}
            <div className="flex flex-col h-full">
              <div className="relative overflow-hidden glass glass-border rounded-3xl p-12 animate-fade-in group hover:shadow-glow transition-all duration-500 flex flex-col justify-center h-full">
                <div className="absolute inset-0 bg-gradient-primary opacity-5 group-hover:opacity-10 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-magenta-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                    <span className="text-white">Start Your Journey</span>{' '}
                    <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                      Today
                    </span>
                  </h2>

                  <p className="text-gray-400 mb-8 text-lg">
                    Join thousands of users who are already enjoying a better way to manage their life, connect with their community, and discover amazing services.
                  </p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
            </div>

            {/* RIGHT: Why i4uBuddy */}
            <div className="flex flex-col h-full">
              <WhyI4uBuddy />
            </div>

          </div>
        </section>

        {/* Footer Banner Ads */}
        {(footerLeftAds.length > 0 || footerRightAds.length > 0) && (
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                {footerLeftAds.map((ad) => (
                  ad.image_url && (
                    <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                    </button>
                  )
                ))}
              </div>
              <div className="space-y-4">
                {footerRightAds.map((ad) => (
                  ad.image_url && (
                    <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-slate-900/50 border-t border-slate-800 mt-20">
          <div className="container mx-auto px-4 py-12">
            {/* Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-8 h-8 text-primary-500" />
                  <span className="text-2xl font-heading font-bold text-white">i4uBuddy</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Your all-in-one platform for managing finances, connecting with friends, and living your best life.
                </p>
                {/* Social Links */}
                <div className="flex items-center gap-3">
                  <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                    <Facebook className="w-4 h-4 text-gray-400 hover:text-white" />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                    <Twitter className="w-4 h-4 text-gray-400 hover:text-white" />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                    <Instagram className="w-4 h-4 text-gray-400 hover:text-white" />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                    <Linkedin className="w-4 h-4 text-gray-400 hover:text-white" />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-colors">
                    <Youtube className="w-4 h-4 text-gray-400 hover:text-white" />
                  </a>
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="font-semibold text-white mb-4">Services</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-primary-400 transition-colors">Finance Tracking</button></li>
                  <li><button onClick={() => navigate('/split')} className="text-gray-400 hover:text-primary-400 transition-colors">Bill Splitting</button></li>
                  <li><button onClick={() => navigate('/rsvp')} className="text-gray-400 hover:text-primary-400 transition-colors">Event Management</button></li>
                  <li><button onClick={() => navigate('/classifieds')} className="text-gray-400 hover:text-primary-400 transition-colors">Classifieds</button></li>
                  <li><button onClick={() => navigate('/buddy-services')} className="text-gray-400 hover:text-primary-400 transition-colors">Buddy Services</button></li>
                </ul>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-semibold text-white mb-4">Features</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => navigate('/travel')} className="text-gray-400 hover:text-primary-400 transition-colors">Travel Companion</button></li>
                  <li><button onClick={() => navigate('/deals')} className="text-gray-400 hover:text-primary-400 transition-colors">Deals</button></li>
                  <li><button onClick={() => navigate('/coupons')} className="text-gray-400 hover:text-primary-400 transition-colors">Coupons</button></li>
                  <li><button onClick={() => navigate('/chat')} className="text-gray-400 hover:text-primary-400 transition-colors">Community Chat</button></li>
                  <li><button onClick={() => navigate('/reports')} className="text-gray-400 hover:text-primary-400 transition-colors">Reports</button></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-semibold text-white mb-4">Contact</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4 text-primary-500" />
                    <span>support@i4ubuddy.com</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-400">
                    <Phone className="w-4 h-4 text-primary-500" />
                    <span>+1 (555) 123-4567</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400">
                    <MapPin className="w-4 h-4 text-primary-500 mt-0.5" />
                    <span>123 Innovation Street<br />Tech City, TC 12345</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-sm">
                <p className="text-gray-500">
                  &copy; 2025 i4uBuddy. All rights reserved.
                </p>
                <a
                  href="https://vspinnovations.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-primary-400 transition-colors"
                >
                  Developed by vspinnovations.com
                </a>
              </div>
              <button
                onClick={() => navigate('/master-admin/login')}
                className="text-xs text-gray-600 hover:text-primary-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800"
              >
                <Shield className="w-3.5 h-3.5" />
                Master Admin
              </button>
            </div>
          </div>
        </footer>
      </div>

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
    </div>
  );
}

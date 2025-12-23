import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export function Footer() {
  const servicesColumn1 = [
    { to: '/classifieds', label: 'Classifieds' },
    { to: '/rsvp', label: 'RSVP Events' },
    { to: '/coupons', label: 'Coupons' },
    { to: '/split', label: 'Split Wise' },
  ];

  const servicesColumn2 = [
    { to: '/travel', label: 'Travel Companion' },
    { to: '/chatbot', label: 'ChatBot' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/transactions', label: 'Transactions' },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-accent-500/5 to-secondary-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent" />

      <div className="relative border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
            <div className="lg:col-span-4 space-y-6">
              <Link to="/" className="inline-block group">
                <img
                  src="/image copy.png"
                  alt="i4uBuddy Logo"
                  className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                Your all-in-one platform for managing finances, connecting with friends,
                and living your best life. Experience the future of smart budgeting.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2.5 rounded-xl bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/50 transition-all duration-300"
                >
                  <Facebook className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2.5 rounded-xl bg-white/5 hover:bg-sky-400/20 border border-white/10 hover:border-sky-400/50 transition-all duration-300"
                >
                  <Twitter className="w-5 h-5 text-gray-400 group-hover:text-sky-400 transition-colors" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2.5 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/50 transition-all duration-300"
                >
                  <Instagram className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2.5 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-600/50 transition-all duration-300"
                >
                  <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 transition-all duration-300"
                >
                  <Youtube className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gradient-primary rounded-full" />
                Services
              </h4>
              <ul className="space-y-3">
                {servicesColumn1.map((service) => (
                  <li key={service.to}>
                    <Link
                      to={service.to}
                      className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all duration-300" />
                      <span>{service.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gradient-primary rounded-full" />
                Features
              </h4>
              <ul className="space-y-3">
                {servicesColumn2.map((service) => (
                  <li key={service.to}>
                    <Link
                      to={service.to}
                      className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-5 group-hover:ml-0 transition-all duration-300" />
                      <span>{service.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <h4 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gradient-primary rounded-full" />
                Get in Touch
              </h4>
              <div className="space-y-4">
                <a
                  href="mailto:contact@i4ubuddy.com"
                  className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-primary-500/10 border border-white/10 hover:border-primary-500/50 transition-all duration-300"
                >
                  <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400 group-hover:scale-110 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors">contact@i4ubuddy.com</p>
                  </div>
                </a>
                <a
                  href="tel:+1234567890"
                  className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-accent-500/10 border border-white/10 hover:border-accent-500/50 transition-all duration-300"
                >
                  <div className="p-2 rounded-lg bg-accent-500/20 text-accent-400 group-hover:scale-110 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors">+1 (234) 567-890</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-secondary-500/20 text-secondary-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-gray-300">Your City, Country</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>&copy; 2025</span>
                <span className="font-semibold text-gray-400">i4ubuddy</span>
                <span>•</span>
                <span>All rights reserved</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Developed by</span>
                <a
                  href="https://www.vspinnovations.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <span className="relative z-10">vspinnovations.com</span>
                  <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

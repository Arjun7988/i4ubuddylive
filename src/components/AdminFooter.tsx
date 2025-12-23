import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminFooter() {
  return (
    <footer className="bg-dark-300/50 border-t border-white/5 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="text-3xl font-bold">
                <span className="text-white">i</span>
                <span className="bg-gradient-primary bg-clip-text text-transparent">4u</span>
                <span className="text-white">BUDDY</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Your all-in-one platform for managing finances, connecting with friends, and living your best life.
              Experience the future of smart budgeting.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-dark-100 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-200 transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-dark-100 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-200 transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-dark-100 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-200 transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-dark-100 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-200 transition-all"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-dark-100 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-200 transition-all"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">Services</h3>
            <ul className="space-y-2">
              <li><Link to="/classifieds" className="text-gray-400 hover:text-white transition-colors text-sm">Classifieds</Link></li>
              <li><Link to="/rsvp" className="text-gray-400 hover:text-white transition-colors text-sm">RSVP Events</Link></li>
              <li><Link to="/coupons" className="text-gray-400 hover:text-white transition-colors text-sm">Coupons</Link></li>
              <li><Link to="/split" className="text-gray-400 hover:text-white transition-colors text-sm">Split Wise</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">Features</h3>
            <ul className="space-y-2">
              <li><Link to="/travel" className="text-gray-400 hover:text-white transition-colors text-sm">Travel Companion</Link></li>
              <li><Link to="/chatbot" className="text-gray-400 hover:text-white transition-colors text-sm">ChatBot</Link></li>
              <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">Dashboard</Link></li>
              <li><Link to="/transactions" className="text-gray-400 hover:text-white transition-colors text-sm">Transactions</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 uppercase text-sm tracking-wider">Get in Touch</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-xs mb-1">Email</p>
                  <a href="mailto:contact@i4ubuddy.com" className="text-gray-300 hover:text-white transition-colors text-sm">
                    contact@i4ubuddy.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-xs mb-1">Phone</p>
                  <a href="tel:+12345678890" className="text-gray-300 hover:text-white transition-colors text-sm">
                    +1 (234) 567-890
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-xs mb-1">Location</p>
                  <p className="text-gray-300 text-sm">Your City, Country</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2025 i4ubuddy • All rights reserved</p>
          <p className="text-gray-500 text-sm">
            Developed by{' '}
            <a
              href="https://vspinnovations.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-400 transition-colors"
            >
              vspinnovations.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

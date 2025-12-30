"use client";

import React from 'react';
import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { BookingCategory } from './types';

interface FooterProps {
  onHomeClick?: () => void;
  onCategoryChange?: (cat: BookingCategory) => void;
}

const Footer: React.FC<FooterProps> = ({ onHomeClick, onCategoryChange }) => {
  return (
    <footer className="bg-background-dark border-t border-surface-dark-lighter py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <button 
              onClick={onHomeClick}
              className="flex items-center gap-3 text-white mb-8 hover:opacity-80 transition-opacity cursor-pointer text-left"
            >
              <BrandLogo size={40} />
              <h2 className="text-xl font-bold font-display">TransferLane</h2>
            </button>
            <p className="text-text-muted text-sm max-w-xs mb-8 leading-relaxed">
              The premium choice for intercity travel, airport transfers, and bespoke chauffeur services across the United Kingdom. Reliable, safe, and comfortable.
            </p>
            <div className="flex gap-6">
              {['FB', 'TW', 'IG', 'LI'].map(social => (
                <a key={social} className="text-text-muted hover:text-primary transition-all font-bold text-xs" href="#">{social}</a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li><Link href="/about" className="hover:text-primary transition-colors text-left">About Us</Link></li>
              <li><button className="hover:text-primary transition-colors text-left">Careers</button></li>
              <li><Link href="/press" className="hover:text-primary transition-colors text-left">Press</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Services</h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li><button onClick={() => onCategoryChange?.(BookingCategory.INTERCITY)} className="hover:text-primary transition-colors text-left">Intercity Rides</button></li>
              <li><button onClick={() => onCategoryChange?.(BookingCategory.AIRPORT)} className="hover:text-primary transition-colors text-left">Airport Transfer</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li><Link href="/help" className="hover:text-primary transition-colors text-left">Help Center</Link></li>
              <li><Link href="/safety" className="hover:text-primary transition-colors text-left">Safety</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors text-left">Terms</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-surface-dark-lighter pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-text-muted text-xs font-medium">© 2024 TransferLane. All rights reserved.</p>
          <div className="flex gap-8 text-xs text-text-muted font-medium">
            <a className="hover:text-white transition-colors" href="#">Privacy</a>
            <Link className="hover:text-white transition-colors" href="/terms">Terms</Link>
            <a className="hover:text-white transition-colors" href="#">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
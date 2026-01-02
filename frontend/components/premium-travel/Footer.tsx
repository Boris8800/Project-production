"use client";

import React from 'react';
import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { useLanguage, Language } from '../../lib/language';

interface FooterProps {
  onHomeClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onHomeClick }) => {
  const { language } = useLanguage();

  const translations = {
    [Language.EN]: {
      desc: 'The premium choice for intercity travel, airport transfers, and bespoke chauffeur services across the United Kingdom.',
      company: 'Company', about: 'About Us', careers: 'Careers', press: 'Press',
      services: 'Services', intercity: 'Intercity Rides', airport: 'Airport Transfer',
      support: 'Support', help: 'Help Center', safety: 'Safety', terms: 'Terms',
      rights: '© 2024 TransferLane. All rights reserved.', privacy: 'Privacy', sitemap: 'Sitemap'
    },
    [Language.ES]: {
      desc: 'La elección premium para viajes interurbanos, traslados al aeropuerto y servicios de chófer en el Reino Unido.',
      company: 'Compañía', about: 'Nosotros', careers: 'Carreras', press: 'Prensa',
      services: 'Servicios', intercity: 'Viajes Interurbanos', airport: 'Traslado Aeropuerto',
      support: 'Soporte', help: 'Centro de Ayuda', safety: 'Seguridad', terms: 'Términos',
      rights: '© 2024 TransferLane. Todos los derechos reservados.', privacy: 'Privacidad', sitemap: 'Mapa del Sitio'
    },
    [Language.FR]: {
      desc: 'Le choix premium pour les voyages interurbains, les transferts aéroport et les services de chauffeur au Royaume-Uni.',
      company: 'Entreprise', about: 'À Propos', careers: 'Carrières', press: 'Presse',
      services: 'Services', intercity: 'Trajets Interurbains', airport: 'Transfert Aéroport',
      support: 'Support', help: 'Centre d\'Aide', safety: 'Sécurité', terms: 'Conditions',
      rights: '© 2024 TransferLane. Tous droits réservés.', privacy: 'Confidentialité', sitemap: 'Plan du Site'
    },
    [Language.DE]: {
      desc: 'Premium-Wahl für Fernreisen, Flughafentransfers und Fahrservice in Großbritannien.',
      company: 'Unternehmen', about: 'Über Uns', careers: 'Karriere', press: 'Presse',
      services: 'Services', intercity: 'Fernfahrten', airport: 'Flughafentransfer',
      support: 'Support', help: 'Hilfe-Center', safety: 'Sicherheit', terms: 'Bedingungen',
      rights: '© 2024 TransferLane. Alle Rechte vorbehalten.', privacy: 'Datenschutz', sitemap: 'Sitemap'
    },
  } as const;

  const t = translations[language];

  return (
    <footer className="bg-background-dark border-t border-surface-dark-lighter py-20">
      <div className="w-full px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <button 
              onClick={onHomeClick}
              className="flex items-center gap-3 text-white mb-8 hover:opacity-80 transition-opacity cursor-pointer text-left"
            >
              <BrandLogo size={52} />
              <h2 className="text-2xl font-bold font-display">TransferLane</h2>
            </button>
            <p className="text-slate-300 text-sm max-w-xs mb-8 leading-relaxed">
              {t.desc}
            </p>
            <div className="flex gap-6">
              {['FB', 'TW', 'IG', 'LI'].map(social => (
                <a key={social} className="text-slate-300 hover:text-primary transition-all font-bold text-xs" href="#">{social}</a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">{t.company}</h4>
            <ul className="space-y-4 text-sm text-slate-300">
              <li><Link href="/about" className="hover:text-primary transition-colors text-left">{t.about}</Link></li>
              <li><button className="hover:text-primary transition-colors text-left">{t.careers}</button></li>
              <li><Link href="/press" className="hover:text-primary transition-colors text-left">{t.press}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">{t.support}</h4>
            <ul className="space-y-4 text-sm text-slate-300">
              <li><Link href="/help" className="hover:text-primary transition-colors text-left">{t.help}</Link></li>
              <li><Link href="/safety" className="hover:text-primary transition-colors text-left">{t.safety}</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors text-left">{t.terms}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-surface-dark-lighter pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-300 text-xs font-medium">{t.rights}</p>
          <div className="flex gap-8 text-xs text-slate-300 font-medium">
            <Link className="hover:text-white transition-colors" href="/privacy">{t.privacy}</Link>
            <Link className="hover:text-white transition-colors" href="/terms">{t.terms}</Link>
            <a className="hover:text-white transition-colors" href="#">{t.sitemap}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import BrandLogo from './BrandLogo';
import { BookingCategory, Language } from '../types';

interface FooterProps {
  onHomeClick?: () => void;
  onCategoryChange?: (cat: BookingCategory) => void;
  onAboutClick?: () => void;
  onTermsClick?: () => void;
  onSafetyClick?: () => void;
  onHelpClick?: () => void;
  onPressClick?: () => void;
  language: Language;
}

const Footer: React.FC<FooterProps> = ({ 
  onHomeClick, 
  onCategoryChange, 
  onAboutClick, 
  onTermsClick,
  onSafetyClick,
  onHelpClick,
  onPressClick,
  language
}) => {
  const translations = {
    [Language.EN]: {
      desc: 'The executive choice for intercity travel, airport transfers, and bespoke chauffeur services across the UK.',
      comp: 'Company', about: 'About Us', careers: 'Careers', press: 'Press',
      serv: 'Services', intercity: 'Intercity Rides', airport: 'Airport Transfer',
      supp: 'Support', help: 'Help Center', safety: 'Safety', terms: 'Terms',
      rights: '© 2024 Transfer Line Inc. All rights reserved.', priv: 'Privacy', map: 'Sitemap'
    },
    [Language.ES]: {
      desc: 'La elección de élite para viajes interurbanos, traslados al aeropuerto y servicios de chófer en el Reino Unido.',
      comp: 'Compañía', about: 'Nosotros', careers: 'Carreras', press: 'Prensa',
      serv: 'Servicios', intercity: 'Viajes interurbanos', airport: 'Traslado aeropuerto',
      // Fix: Renamed 'términos' to 'terms' to resolve the property access error on lines 94 and 103
      supp: 'Soporte', help: 'Centro de ayuda', safety: 'Seguridad', terms: 'Términos',
      rights: '© 2024 Transfer Line Inc. Todos los derechos reservados.', priv: 'Privacidad', map: 'Sitemap'
    },
    [Language.DE]: {
      desc: 'Die exklusive Wahl für Fernreisen, Flughafentransfers und maßgeschneiderte Chauffeurservices in ganz Großbritannien.',
      comp: 'Unternehmen', about: 'Über uns', careers: 'Karriere', press: 'Presse',
      serv: 'Dienstleistungen', intercity: 'Fernfahrten', airport: 'Flughafentransfer',
      supp: 'Support', help: 'Hilfe-Center', safety: 'Sicherheit', terms: 'AGB',
      rights: '© 2024 Transfer Line Inc. Alle Rechte vorbehalten.', priv: 'Datenschutz', map: 'Sitemap'
    },
    [Language.FR]: {
      desc: 'Le choix d\'excellence pour les voyages interurbains, les transferts aéroport et les services de chauffeur sur mesure au Royaume-Uni.',
      comp: 'Entreprise', about: 'À propos', careers: 'Carrières', press: 'Presse',
      serv: 'Services', intercity: 'Trajets interurbains', airport: 'Transfert aéroport',
      supp: 'Support', help: 'Centre d\'aide', safety: 'Sécurité', terms: 'Conditions',
      rights: '© 2024 Transfer Line Inc. Tous droits réservés.', priv: 'Confidentialité', map: 'Sitemap'
    }
  };

  const t = translations[language];

  return (
    <footer className="bg-background-dark border-t border-surface-dark-lighter py-20 w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <button onClick={onHomeClick} className="flex items-center gap-3 text-white mb-8 hover:opacity-80 transition-opacity cursor-pointer text-left">
              <BrandLogo size={40} />
              <h2 className="text-xl font-bold font-display">Transfer Line</h2>
            </button>
            <p className="text-text-muted text-sm max-w-xs mb-8 leading-relaxed">{t.desc}</p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">{t.comp}</h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li><button onClick={onAboutClick} className="hover:text-primary transition-colors text-left">{t.about}</button></li>
              <li><button className="hover:text-primary transition-colors text-left">{t.careers}</button></li>
              <li><button onClick={onPressClick} className="hover:text-primary transition-colors text-left">{t.press}</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">{t.serv}</h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li><button onClick={() => onCategoryChange?.(BookingCategory.INTERCITY)} className="hover:text-primary transition-colors text-left">{t.intercity}</button></li>
              <li><button onClick={() => onCategoryChange?.(BookingCategory.AIRPORT)} className="hover:text-primary transition-colors text-left">{t.airport}</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6">{t.supp}</h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li><button onClick={onHelpClick} className="hover:text-primary transition-colors text-left">{t.help}</button></li>
              <li><button onClick={onSafetyClick} className="hover:text-primary transition-colors text-left">{t.safety}</button></li>
              <li><button onClick={onTermsClick} className="hover:text-primary transition-colors text-left">{t.terms}</button></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-surface-dark-lighter pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-text-muted text-xs font-medium">{t.rights}</p>
          <div className="flex gap-8 text-xs text-text-muted font-medium">
            <a className="hover:text-white transition-colors" href="#">{t.priv}</a>
            <button onClick={onTermsClick} className="hover:text-white transition-colors">{t.terms}</button>
            <a className="hover:text-white transition-colors" href="#">{t.map}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

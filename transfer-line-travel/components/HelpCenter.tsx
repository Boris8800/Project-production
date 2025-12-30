
import React from 'react';
import { Language } from '../types';

interface HelpCenterProps {
  onBack: () => void;
  language: Language;
}

const FAQ_DATA = {
  [Language.EN]: [
    { q: "How do I cancel my booking?", a: "You can cancel via the app up to 24 hours before your scheduled pickup for a full refund." },
    { q: "What is the waiting time policy?", a: "We provide 15 minutes of complimentary waiting time for standard transfers." },
    { q: "Are car seats provided for children?", a: "Yes, we can provide child and booster seats. Please specify during booking." },
    { q: "Can I book a multi-stop journey?", a: "Certainly. For complex itineraries, please contact our concierge team directly." }
  ],
  [Language.ES]: [
    { q: "¿Cómo cancelo mi reserva?", a: "Puede cancelar a través de la aplicación hasta 24 horas antes de la recogida programada para un reembolso completo." },
    { q: "¿Cuál es la política de tiempo de espera?", a: "Ofrecemos 15 minutes de tiempo de espera de cortesía para traslados estándar." },
    { q: "¿Se proporcionan asientos para niños?", a: "Sí, podemos proporcionar asientos infantiles y alzadores. Por favor, especifíquelo al reservar." },
    { q: "¿Puedo reservar un viaje con varias paradas?", a: "Ciertamente. Para itinerarios complejos, póngase en contacto con nuestro equipo." }
  ],
  [Language.DE]: [
    { q: "Wie storniere ich meine Buchung?", a: "Sie können über die App bis zu 24 Stunden vor der geplanten Abholung stornieren, um eine volle Rückerstattung zu erhalten." },
    { q: "Wie lange ist die Wartezeit?", a: "Wir bieten 15 Minuten kostenlose Wartezeit bei Standard-Transfers." },
    { q: "Werden Kindersitze bereitgestellt?", a: "Ja, wir können Kinder- und Sitzerhöhungen bereitstellen. Bitte bei der Buchung angeben." },
    { q: "Kann ich eine Reise mit mehreren Stopps buchen?", a: "Sicherlich. Für komplexe Reiserouten wenden Sie sich bitte direkt an unser Concierge-Team." }
  ],
  [Language.FR]: [
    { q: "Comment annuler ma réservation ?", a: "Vous pouvez annuler via l'application jusqu'à 24 heures avant l'heure prévue pour un remboursement complet." },
    { q: "Quelle est la politique de temps d'attente ?", a: "Nous offrons 15 minutes d'attente gratuites pour les transferts standard." },
    { q: "Des sièges auto sont-ils fournis ?", a: "Oui, nous pouvons fournir des sièges enfant et des rehausseurs. Veuillez le préciser lors de la réservation." },
    { q: "Puis-je réserver un trajet avec plusieurs arrêts ?", a: "Certainement. Pour les itinéraires complexes, veuillez contacter notre équipe." }
  ]
};

const HelpCenter: React.FC<HelpCenterProps> = ({ onBack, language }) => {
  const labels = {
    [Language.EN]: { title: 'How can we assist you?', faq: 'Frequently Asked Questions', back: 'Return to Dashboard' },
    [Language.ES]: { title: '¿Cómo podemos ayudarle?', faq: 'Preguntas Frecuentes', back: 'Volver al Panel' },
    [Language.DE]: { title: 'Wie können wir Ihnen helfen?', faq: 'Häufig Gestellte Fragen', back: 'Zurück zum Dashboard' },
    [Language.FR]: { title: 'Comment pouvons-nous vous aider ?', faq: 'Questions Fréquentes', back: 'Retour au Tableau de Bord' }
  };

  const l = labels[language];

  return (
    <div className="bg-background-light dark:bg-background-dark animate-in fade-in duration-700 min-h-screen">
      <section className="py-20 px-6 bg-slate-900 dark:bg-surface-dark relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 font-display tracking-tight">{l.title}</h1>
          <p className="text-slate-400 font-medium">Find answers to our most common queries below.</p>
        </div>
      </section>

      <section className="py-24 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-12 font-display">{l.faq}</h2>
        <div className="grid gap-6">
          {FAQ_DATA[language].map((item, idx) => (
            <div key={idx} className="p-8 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">{item.q}</h3>
              <p className="text-text-muted font-medium leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 bg-slate-50 dark:bg-surface-dark/30 text-center">
        <button onClick={onBack} className="px-12 py-6 bg-primary text-white font-black rounded-2xl shadow-3xl uppercase tracking-widest text-xs">
          {l.back}
        </button>
      </section>
    </div>
  );
};

export default HelpCenter;

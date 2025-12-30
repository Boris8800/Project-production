
import React, { useState, useRef, useEffect } from 'react';
import { chatWithConcierge } from '../geminiService';
import { Language } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  links?: { uri: string; title: string }[];
}

interface AIConciergeProps {
  language: Language;
}

const AIConcierge: React.FC<AIConciergeProps> = ({ language }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const greetings = {
    [Language.EN]: 'Good day. I am your Transfer Line travel concierge. How may I assist you with your journey today?',
    [Language.ES]: 'Buen día. Soy su conserje de viajes de Transfer Line. ¿Cómo puedo asistirle con su viaje hoy?',
    [Language.DE]: 'Guten Tag. Ich bin Ihr Transfer Line Reise-Concierge. Wie kann ich Ihnen heute bei Ihrer Reise behilflich sein?',
    [Language.FR]: 'Bonjour. Je suis votre concierge de voyage Transfer Line. Comment puis-je vous aider pour votre voyage aujourd\'hui?'
  };

  const labels = {
    [Language.EN]: { header: 'Elite Concierge', sources: 'Verified Sources', placeholder: 'Ask for travel tips...' },
    [Language.ES]: { header: 'Conserje de Élite', sources: 'Fuentes Verificadas', placeholder: 'Pida consejos de viaje...' },
    [Language.DE]: { header: 'Elite-Concierge', sources: 'Verifizierte Quellen', placeholder: 'Reisetipps anfragen...' },
    [Language.FR]: { header: 'Concierge d\'Élite', sources: 'Sources Vérifiées', placeholder: 'Demander des conseils...' }
  };

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: greetings[language] }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset messages when language changes or add a translated greeting
    setMessages([{ role: 'assistant', content: greetings[language] }]);
  }, [language]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    const history = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: m.content }));
    const response = await chatWithConcierge(history, currentInput, language);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', content: response.text, links: response.links }]);
  };

  const l = labels[language];

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <button onClick={() => setIsOpen(!isOpen)} className={`size-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-surface-dark-lighter' : 'bg-primary'} text-white ring-4 ring-primary/20`}>
        <span className="material-symbols-outlined text-3xl">{isOpen ? 'close' : 'support_agent'}</span>
      </button>
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[350px] md:w-[400px] h-[500px] bg-white dark:bg-surface-dark rounded-[32px] shadow-4xl flex flex-col overflow-hidden border border-gray-200 dark:border-white/10 animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 bg-primary text-white flex items-center gap-3">
             <span className="material-symbols-outlined">concierge</span>
             <div>
               <p className="font-black text-xs uppercase tracking-widest">Transfer Line</p>
               <h4 className="font-display text-lg">{l.header}</h4>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`p-5 rounded-[24px] text-xs flex flex-col gap-3 leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-primary text-white self-end rounded-tr-none max-w-[85%]' : 'bg-gray-50 dark:bg-white/5 self-start rounded-tl-none border border-gray-100 dark:border-white/5 max-w-[85%]'}`}>
                <div className="font-medium">{m.content}</div>
                {m.links && m.links.length > 0 && (
                  <div className="mt-2 pt-3 border-t border-black/5 dark:border-white/10 flex flex-col gap-2">
                    <p className="font-black text-[9px] uppercase tracking-widest opacity-60">{l.sources}</p>
                    {m.links.map((link, linkIdx) => (
                      <a key={linkIdx} href={link.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-primary hover:underline truncate max-w-full font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">link</span>
                        {link.title || link.uri}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 self-start bg-gray-50 dark:bg-white/5 p-4 rounded-2xl animate-pulse border border-gray-100 dark:border-white/5">
                <div className="size-1.5 bg-primary rounded-full animate-bounce"></div>
                <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-6 border-t border-gray-100 dark:border-white/5 flex gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              className="flex-1 bg-white dark:bg-white/5 rounded-xl px-4 py-3 text-sm border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              placeholder={l.placeholder} 
            />
            <button onClick={handleSend} className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-xl">send</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConcierge;

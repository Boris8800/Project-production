'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '../../components/premium-travel/Header';
import Footer from '../../components/premium-travel/Footer';

export default function AboutPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => setIsDarkMode((v) => !v);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Header
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
        onHomeClick={() => router.push('/')}
        showNav={false}
        onBookNowClick={() => router.push('/')}
      />

      <main className="flex-grow">
        <section className="relative h-[60vh] min-h-[520px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20s] scale-105"
            style={{
              backgroundImage: `linear-gradient(rgba(12, 11, 9, 0.45), rgba(12, 11, 9, 0.92)), url('https://images.unsplash.com/photo-1449156001931-828420e8f6b4?auto=format&fit=crop&q=85&w=2400')`,
            }}
          />
          <div className="relative z-10 text-center px-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-8 backdrop-blur-md">
              <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">Our Heritage</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
              Defined by <br />
              <span className="text-primary italic font-display">Excellence</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
              Dedicated to reimagining the standards of private intercity travel across the United Kingdom.
            </p>
          </div>
        </section>

        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tight font-display">
                The Transferline Story
              </h2>
              <div className="space-y-6 text-slate-600 dark:text-slate-200 text-lg leading-relaxed">
                <p>
                  Transferline was born from a simple observation: intercity travel often lacks the personal touch and refinement that travellers deserve.
                </p>
                <p>
                  Based in the heart of the UK, we maintain core values of discretion, safety, and uncompromising quality. Our chauffeurs are trained professionals.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-4xl font-black text-primary font-display mb-1">10k+</p>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-[0.2em]">
                    Journeys Completed
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-black text-primary font-display mb-1">99.9%</p>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-[0.2em]">
                    On-Time Reliability
                  </p>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden shadow-4xl border border-gray-200 dark:border-white/10">
                <Image
                  alt="Transferline"
                  src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=1200"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 p-10 bg-primary rounded-[32px] text-white shadow-3xl hidden md:block max-w-[300px]">
                <span className="material-symbols-outlined text-4xl mb-4">format_quote</span>
                <p className="font-bold text-lg leading-tight italic font-display">
                  We don&apos;t just move people; we provide the space for them to be their best selves while traveling.
                </p>
                <p className="mt-4 text-xs font-black uppercase tracking-widest opacity-70">— CEO, Transferline</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-slate-50 dark:bg-surface-dark/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 font-display">
                Our Core Values
              </h2>
              <p className="text-text-muted dark:text-slate-200 max-w-xl mx-auto font-medium">
                The pillars that define every single mile we travel with you.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: 'shield_person',
                  title: 'Absolute Discretion',
                  desc: 'Privacy is the cornerstone of our service. Our chauffeurs are trained in confidentiality.',
                },
                {
                  icon: 'verified',
                  title: 'Uncompromising Safety',
                  desc: 'Every vehicle undergoes rigorous inspections and features the latest safety tech.',
                },
                {
                  icon: 'auto_awesome',
                  title: 'Artisanal Quality',
                  desc: 'From climate control to refreshments, every detail is curated for luxury.',
                },
              ].map((v) => (
                <div
                  key={v.title}
                  className="p-10 bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 rounded-[32px] shadow-sm hover:shadow-2xl transition-all"
                >
                  <div className="size-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-lg shadow-primary/5">
                    <span className="material-symbols-outlined text-3xl">{v.icon}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">{v.title}</h3>
                  <p className="text-slate-500 dark:text-slate-200 text-sm leading-relaxed font-medium">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 text-center px-6">
          <h2 className="text-4xl font-black mb-8 text-slate-900 dark:text-white font-display">Experience the Difference</h2>
          <button
            onClick={() => router.push('/')}
            className="px-12 py-6 bg-primary text-white font-black rounded-2xl shadow-3xl shadow-primary/30 hover:scale-105 transition-transform uppercase tracking-widest text-[10px]"
          >
            Book Your First Journey
          </button>
        </section>
      </main>

      <Footer onHomeClick={() => router.push('/')} />
    </div>
  );
}

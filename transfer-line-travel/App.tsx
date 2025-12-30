
import React, { useState, useEffect } from 'react';
import { BookingCategory, RideData, Language } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Fleet from './components/Fleet';
import Routes from './components/Routes';
import CTA from './components/CTA';
import Footer from './components/Footer';
import RideCompleted from './components/RideCompleted';
import VehicleSelection from './components/VehicleSelection';
import About from './components/About';
import Terms from './components/Terms';
import Safety from './components/Safety';
import HelpCenter from './components/HelpCenter';
import Press from './components/Press';

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<BookingCategory>(BookingCategory.INTERCITY);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [currentView, setCurrentView] = useState<'home' | 'selection' | 'completed' | 'about' | 'terms' | 'safety' | 'help' | 'press'>('home');
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [prefillData, setPrefillData] = useState<{pickup: string, dropoff: string} | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleHome = () => {
    setCurrentView('home');
    setPrefillData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEstimate = (data: RideData) => {
    setRideData(data);
    setCurrentView('selection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setCurrentView('completed');
  };

  const handleCategoryChange = (cat: BookingCategory) => {
    setActiveCategory(cat);
    handleHome();
  };

  const handleQuickRoute = (from: string, to: string) => {
    setPrefillData({ pickup: from, dropoff: to });
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showView = (view: any) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (currentView) {
      case 'about': return <About onBack={handleHome} language={language} />;
      case 'terms': return <Terms onBack={handleHome} language={language} />;
      case 'safety': return <Safety onBack={handleHome} language={language} />;
      case 'help': return <HelpCenter onBack={handleHome} language={language} />;
      case 'press': return <Press onBack={handleHome} language={language} />;
      case 'selection':
        return rideData ? (
          <VehicleSelection 
            rideData={rideData} 
            onSelect={handleVehicleSelect} 
            onBack={() => setCurrentView('home')} 
            language={language}
          />
        ) : null;
      case 'completed':
        return rideData ? (
          <RideCompleted 
            rideData={rideData} 
            selectedVehicle={selectedVehicle}
            onBack={() => setCurrentView('selection')} 
            language={language}
          />
        ) : null;
      default:
        return (
          <>
            <Hero 
              activeCategory={activeCategory} 
              setActiveCategory={setActiveCategory} 
              onEstimate={handleEstimate}
              prefill={prefillData}
              language={language}
            />
            <Features language={language} />
            <Fleet onSelect={handleCategoryChange} language={language} />
            <Routes onRouteSelect={handleQuickRoute} language={language} />
            <CTA onBookClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} language={language} />
          </>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <div className="w-full flex flex-col min-h-screen relative">
        <Header 
          toggleDarkMode={toggleDarkMode}
          isDarkMode={isDarkMode}
          onHomeClick={handleHome}
          onCategoryChange={handleCategoryChange}
          onAboutClick={() => showView('about')}
          language={language}
          setLanguage={setLanguage}
        />
        
        <main className="flex-grow">
          {renderView()}
        </main>

        {currentView !== 'completed' && (
          <Footer 
            onHomeClick={handleHome} 
            onCategoryChange={handleCategoryChange} 
            onAboutClick={() => showView('about')} 
            onTermsClick={() => showView('terms')}
            onSafetyClick={() => showView('safety')}
            onHelpClick={() => showView('help')}
            onPressClick={() => showView('press')}
            language={language}
          />
        )}
      </div>
    </div>
  );
};

export default App;

"use client";

import React, { useEffect, useState } from 'react';
import { RideData, SelectedVehicle } from './types';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import Fleet from './Fleet';
import Routes from './Routes';
import CTA from './CTA';
import Footer from './Footer';
import RideCompleted from './RideCompleted';
import VehicleSelection from './VehicleSelection';

const PremiumTravelApp: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'selection' | 'completed'>('home');
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicle | null>(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEstimate = (data: RideData) => {
    setRideData(data);
    setCurrentView('selection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVehicleSelect = (vehicle: SelectedVehicle) => {
    setSelectedVehicle(vehicle);
    setCurrentView('completed');
  };

  if (currentView === 'selection' && rideData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header 
          toggleDarkMode={toggleDarkMode} 
          isDarkMode={isDarkMode} 
          onHomeClick={handleHome}
        />
        <main className="flex-grow bg-background-light dark:bg-background-dark">
          <VehicleSelection 
            rideData={rideData} 
            onSelect={handleVehicleSelect} 
            onBack={() => setCurrentView('home')} 
          />
        </main>
      </div>
    );
  }

  if (currentView === 'completed' && rideData) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <RideCompleted 
          rideData={rideData} 
          selectedVehicle={selectedVehicle}
          onBack={() => setCurrentView('selection')} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        toggleDarkMode={toggleDarkMode} 
        isDarkMode={isDarkMode} 
        onHomeClick={handleHome}
      />
      <main className="flex-grow">
        <Hero onEstimate={handleEstimate} />
        <Features />
        <Fleet onSelectVehicle={(vehicleName) => {
          // When a vehicle from Fleet is selected, store it and show search form
          setRideData({ 
            pickup: '', 
            dropoff: '', 
            distance: 0, 
            duration: 0,
            selectedVehicleClass: vehicleName 
          });
          setCurrentView('selection');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} />
        <Routes />
        <CTA onBookClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
      </main>
      <Footer onHomeClick={handleHome} />
    </div>
  );
};

export default PremiumTravelApp;


import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", size = 40 }) => {
  return (
    <div 
      className={`bg-slate-900 dark:bg-primary flex items-center justify-center rounded-xl shadow-lg group transition-all ${className}`} 
      style={{ width: size, height: size }}
    >
      <span className="material-symbols-outlined text-white text-[24px] group-hover:scale-110 transition-transform">
        directions_car
      </span>
    </div>
  );
};

export default BrandLogo;

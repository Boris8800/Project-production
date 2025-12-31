
import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", size = 40 }) => {
  return (
    <a
      href="/brand/transferline-logo.png"
      target="_blank"
      rel="noopener noreferrer"
      className={`bg-slate-900 dark:bg-primary flex items-center justify-center rounded-xl shadow-lg group transition-all overflow-hidden cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      aria-label="Open TransferLine logo"
      title="Open logo"
    >
      <img
        src="/brand/transferline-logo.png"
        alt="TransferLine"
        width={size}
        height={size}
        className="block w-full h-full object-contain scale-[1.25] transform-gpu"
        loading="eager"
      />
    </a>
  );
};

export default BrandLogo;

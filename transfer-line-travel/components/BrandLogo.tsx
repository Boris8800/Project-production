
import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", size = 40 }) => {
  const logoSrc = "/brand/transferline-logo-main.png";
  return (
    <a
      href={logoSrc}
      target="_blank"
      rel="noopener noreferrer"
      className={`bg-transparent flex items-center justify-center rounded-xl group transition-all overflow-hidden cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      aria-label="Open TransferLane logo"
      title="Open logo"
    >
      <img
        src={logoSrc}
        alt="TransferLane"
        width={size}
        height={size}
        className="block w-full h-full object-contain scale-[1.25] transform-gpu"
        loading="eager"
      />
    </a>
  );
};

export default BrandLogo;

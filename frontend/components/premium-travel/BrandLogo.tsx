"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 40 }) => {
  const [imgError, setImgError] = useState(false);
  const logoSrc = '/brand/transferline-logo.png';

  return (
    <a
      href={logoSrc}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-xl flex items-center justify-center overflow-hidden cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      aria-label="Open TransferLane logo"
      title="Open logo"
    >
      {!imgError ? (
        <Image
          src={logoSrc}
          alt="TransferLane"
          width={size}
          height={size}
          sizes={`${size}px`}
          className="block w-full h-full object-contain scale-[1.25] transform-gpu"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="4" y="4" width="56" height="56" rx="14" className="fill-background-dark" />
          <path
            d="M18 44c10-16 18-26 28-28"
            className="stroke-primary"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M22 18c10 2 18 10 24 26"
            className="stroke-primary"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.85"
          />
          <circle cx="32" cy="32" r="2" className="fill-primary" />
        </svg>
      )}
    </a>
  );
};

export default BrandLogo;
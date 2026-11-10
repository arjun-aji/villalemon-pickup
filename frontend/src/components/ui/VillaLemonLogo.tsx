import React from 'react';

interface VillaLemonLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'dark' | 'light';
  align?: 'left' | 'center';
}

export const VillaLemonLogo: React.FC<VillaLemonLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'dark',
  align = 'left',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  const isLight = variant === 'light';

  return (
    <div
      className={`inline-flex items-center gap-3 ${
        align === 'center' ? 'flex-col sm:flex-row justify-center text-center sm:text-left' : 'text-left'
      } ${className}`}
    >
      {/* Custom Car + Leaf Emblem matching the reference image */}
      <div className={`relative shrink-0 ${iconSizes[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Leaf sprout growing from the roof */}
          <path
            d="M32 20C32 10 44 8 47 7C47 10 46 19 35 21C34.2 21.1 33.1 20.7 32 20Z"
            fill="#059669"
          />
          <path
            d="M35 17C40 13 44 10 47 7"
            stroke="#D1FAE5"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Car main body silhouette (modern rounded front view) */}
          <path
            d="M18 30C18 27.5 19.5 25.5 22 24.8L26.5 23.5C28 23.1 36 23.1 37.5 23.5L42 24.8C44.5 25.5 46 27.5 46 30V43C46 45.2 44.2 47 42 47H41V49C41 50.7 39.7 52 38 52C36.3 52 35 50.7 35 49V47H29V49C29 50.7 27.7 52 26 52C24.3 52 23 50.7 23 49V47H22C19.8 47 18 45.2 18 43V30Z"
            fill="#00875A"
          />

          {/* Windshield */}
          <path
            d="M23 33C23 31.3 24.3 30 26 30H38C39.7 30 41 31.3 41 33V35H23V33Z"
            fill="white"
            fillOpacity="0.9"
          />

          {/* Left headlight */}
          <circle cx="23.5" cy="41.5" r="2.5" fill="white" />
          {/* Right headlight */}
          <circle cx="40.5" cy="41.5" r="2.5" fill="white" />

          {/* Lower grill */}
          <rect x="28" y="41" width="8" height="2" rx="1" fill="#006644" />
        </svg>
      </div>

      {/* Brand Name & Subtitle */}
      <div className="leading-tight">
        <div className={`font-black tracking-tight ${titleSizes[size]}`}>
          <span className={isLight ? 'text-white' : 'text-[#10243A]'}>VillaLemon </span>
          <span className="text-[#00875A]">Pickup</span>
        </div>
        {showSubtitle && (
          <p
            className={`font-medium tracking-normal mt-0.5 ${subtitleSizes[size]} ${
              isLight ? 'text-slate-300' : 'text-[#64748B]'
            }`}
          >
            Pickup & Driver Management System
          </p>
        )}
      </div>
    </div>
  );
};

export default VillaLemonLogo;


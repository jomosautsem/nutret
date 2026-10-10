import React from 'react';

interface NutriluzLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showSubtitle?: boolean;
  showBadge?: boolean;
  variant?: 'full' | 'icon' | 'horizontal';
  theme?: 'dark' | 'light' | 'auto';
  customLogoUrl?: string;
  className?: string;
}

/**
 * Official SVG Emblem for NUTRILUZ
 * Combines an organic clinical nutrition leaf, radiant sunlight ("Luz"), and health cross geometry.
 */
export const NutriluzEmblem: React.FC<{ sizePx?: number; className?: string }> = ({
  sizePx = 48,
  className = '',
}) => {
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-md ${className}`}
      aria-label="Nutriluz Official Logo Emblem"
    >
      <defs>
        {/* Primary Emerald-Teal Gradient */}
        <linearGradient id="nutriGrad1" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>

        {/* Sunlight & Vitality Golden Accent */}
        <linearGradient id="sunbeamGrad" x1="50" y1="5" x2="95" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="40%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Inner Leaf Shimmer */}
        <linearGradient id="leafInnerGrad" x1="25" y1="35" x2="75" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="60%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Rounded Soft Background Shield */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="26"
        fill="url(#nutriGrad1)"
        className="transition-all duration-300"
      />

      {/* Subtle Clinical Circle Grid / Orbit */}
      <circle
        cx="50"
        cy="50"
        r="36"
        stroke="white"
        strokeOpacity="0.15"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Radiant Sun Beam (Luz) Arcs - Upper Right */}
      <path
        d="M62 20C72 26 80 36 82 48"
        stroke="#FDE047"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
      <circle cx="78" cy="24" r="3.5" fill="#FDE047" />

      {/* Stylized Clinical Cross + Organic Nutrition Leaf Structure */}
      {/* Central Medical Cross Accent (Gentle) */}
      <rect x="47.5" y="28" width="5" height="44" rx="2.5" fill="white" fillOpacity="0.25" />
      <rect x="28" y="47.5" width="44" height="5" rx="2.5" fill="white" fillOpacity="0.25" />

      {/* Primary Left/Center Nutrition Leaf */}
      <path
        d="M50 18C50 18 24 32 24 58C24 72 35 82 50 82C65 82 76 72 76 58C76 32 50 18 50 18Z"
        fill="url(#leafInnerGrad)"
        fillOpacity="0.95"
      />

      {/* Internal Vein / Sprout of Vitality */}
      <path
        d="M50 80C50 80 50 42 66 30"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
      <path
        d="M50 56C42 50 36 50 32 52"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <path
        d="M50 66C56 62 62 62 66 64"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />

      {/* Bright Core Sunlight Sparkle (Luz) */}
      <circle cx="50" cy="38" r="4" fill="#FEF08A" filter="url(#softGlow)" />
      <circle cx="50" cy="38" r="2" fill="white" />
    </svg>
  );
};

export const NutriluzLogo: React.FC<NutriluzLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showBadge = true,
  variant = 'horizontal',
  theme = 'auto',
  customLogoUrl,
  className = '',
}) => {
  // Dimension definitions
  const sizeMap = {
    xs: { px: 28, text: 'text-sm', sub: 'text-[9px]', badge: 'text-[8px] px-1 py-0.2' },
    sm: { px: 36, text: 'text-base', sub: 'text-[10px]', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { px: 46, text: 'text-xl', sub: 'text-[11px]', badge: 'text-[10px] px-2 py-0.5' },
    lg: { px: 58, text: 'text-2xl', sub: 'text-xs', badge: 'text-[10px] px-2.5 py-0.5' },
    xl: { px: 72, text: 'text-3xl', sub: 'text-xs', badge: 'text-[11px] px-2.5 py-1' },
    hero: { px: 92, text: 'text-4xl', sub: 'text-sm', badge: 'text-xs px-3 py-1' },
  };

  const current = sizeMap[size];

  const textColor =
    theme === 'dark'
      ? 'text-white'
      : theme === 'light'
      ? 'text-slate-900'
      : 'text-slate-900 dark:text-white';

  const subColor =
    theme === 'dark'
      ? 'text-slate-400'
      : theme === 'light'
      ? 'text-slate-500'
      : 'text-slate-500 dark:text-slate-400';

  return (
    <div
      className={`inline-flex items-center ${
        variant === 'full' ? 'flex-col text-center gap-3' : 'gap-3'
      } ${className}`}
      role="banner"
      aria-label="Logo Oficial Nutriluz"
    >
      {/* Icon Emblem or Custom Logo */}
      <div className="relative shrink-0 flex items-center justify-center">
        {customLogoUrl ? (
          <div
            className="rounded-2xl overflow-hidden border border-emerald-500/20 bg-white/5 flex items-center justify-center shadow-lg"
            style={{ width: current.px, height: current.px }}
          >
            <img
              src={customLogoUrl}
              alt="Logo Oficial Nutriluz"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                // Fallback to vector emblem if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <NutriluzEmblem sizePx={current.px} />
        )}
      </div>

      {/* Typography & Subtitles */}
      {variant !== 'icon' && (
        <div className={`flex flex-col ${variant === 'full' ? 'items-center' : 'items-start'}`}>
          <div className="flex items-center gap-2 leading-none">
            <span className={`font-black tracking-tight ${current.text} ${textColor}`}>
              NUTRI
              <span className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                LUZ
              </span>
            </span>

            {showBadge && (
              <span
                className={`font-extrabold uppercase rounded-full tracking-wider border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ${current.badge}`}
              >
                CLINICAL OS
              </span>
            )}
          </div>

          {showSubtitle && (
            <p className={`font-semibold tracking-normal mt-1 leading-tight ${current.sub} ${subColor}`}>
              Sistema Clínico & Nutrición Inteligente
            </p>
          )}
        </div>
      )}
    </div>
  );
};

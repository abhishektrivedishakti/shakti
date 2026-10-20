import React from 'react';
import { Car, ShieldCheck } from 'lucide-react';

interface AuthBrandProps {
  compact?: boolean;
  variant?: 'light' | 'dark';
  align?: 'center' | 'start';
}

export const AuthBrand: React.FC<AuthBrandProps> = ({
  compact = false,
  variant = 'light',
  align = 'center',
}) => {
  const isDark = variant === 'dark';
  const alignClass = align === 'start' ? 'items-start text-left' : 'items-center text-center';

  return (
    <div className={`flex flex-col ${alignClass} ${compact ? 'gap-3' : 'gap-5'}`}>
      <div className="relative">
        <div
          className={`auth-logo-mark flex items-center justify-center text-white ${
            compact ? 'h-14 w-14 rounded-2xl' : 'h-[4.25rem] w-[4.25rem] rounded-[1.15rem] sm:h-[4.75rem] sm:w-[4.75rem]'
          }`}
        >
          <Car className={compact ? 'h-7 w-7' : 'h-9 w-9'} strokeWidth={2.15} />
        </div>
        <div
          className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-lg border-2 text-teal-300 ${
            isDark ? 'border-[#0f3d38] bg-[#0b1c2c]' : 'border-white bg-[var(--color-ink)]'
          } ${compact ? 'h-6 w-6' : 'h-7 w-7'}`}
        >
          <ShieldCheck className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </div>
      </div>
      <div className={align === 'start' ? 'max-w-md' : ''}>
        <p
          className={`font-medium tracking-wide ${
            isDark ? 'text-teal-200/80' : 'text-[var(--color-copper)]'
          } ${compact ? 'text-[11px]' : 'text-xs sm:text-[13px]'}`}
        >
          शक्ति ट्रैवल्स एंड टूर्स
        </p>
        <h1
          className={`font-[family-name:var(--font-display)] font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-[var(--color-ink)]'
          } ${compact ? 'mt-0.5 text-xl' : 'mt-1 text-2xl sm:text-[1.85rem]'}`}
        >
          <span className={isDark ? 'text-teal-300' : 'text-[var(--color-copper)]'}>SHAKTI</span>{' '}
          Travels &amp; Tours
        </h1>
        {!compact && (
          <p
            className={`mt-2 max-w-md text-sm leading-relaxed ${
              isDark ? 'text-white/65' : 'text-[var(--color-muted)]'
            } ${align === 'center' ? 'mx-auto' : ''}`}
          >
            Premium fleet, government tenders &amp; tour operations — one trusted workspace for your team.
          </p>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Building2, MapPin, Route, Shield } from 'lucide-react';
import { AuthBrand } from './AuthBrand';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const HERO_SERVICES = [
  { icon: Route, label: 'Fleet & dispatch' },
  { icon: Building2, label: 'Govt tenders' },
  { icon: MapPin, label: 'Outstation tours' },
  { icon: Shield, label: 'Secure staff access' },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="auth-shell min-h-screen">
      <div className="auth-grid lg:grid lg:min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <aside className="auth-hero relative flex min-h-[280px] flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:min-h-screen lg:px-12 lg:py-12">
          <div className="auth-hero-glow pointer-events-none absolute inset-0" aria-hidden />
          <div className="auth-hero-route pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
          <div className="auth-hero-noise pointer-events-none absolute inset-0" aria-hidden />

          <div className="relative z-[1]">
            <AuthBrand variant="dark" align="start" />
          </div>

          <div className="relative z-[1] mt-8 hidden max-w-lg lg:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-200/90">
              Trusted travel partner
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-white xl:text-[1.65rem]">
              Move people. Manage fleet. Deliver on every tender.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              From daily office cabs and outstation duties to GeM contracts, billing, and compliance — your
              operations desk starts here.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-2.5">
              {HERO_SERVICES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-teal-200">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="text-xs font-semibold text-white/85">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-[1] mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/40 lg:mt-0">
            <span>Est. fleet &amp; tour operator · UP &amp; national</span>
            <span className="hidden sm:inline">·</span>
            <span>© {new Date().getFullYear()} Shakti Travels and Tours</span>
          </div>
        </aside>

        <main className="auth-main relative flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="auth-main-pattern pointer-events-none absolute inset-0" aria-hidden />
          <div className="auth-card relative z-[1] w-full max-w-[440px]">
            <div className="auth-card-accent" aria-hidden />
            <div className="mb-6 lg:hidden">
              <AuthBrand compact align="start" />
            </div>
            <div className="auth-card-header mb-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="auth-badge">Team portal</span>
                <span className="text-[11px] font-medium text-[var(--color-muted)]">Staff only</span>
              </div>
              <h2 className="auth-card-title">{title}</h2>
              <p className="auth-card-subtitle">{subtitle}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

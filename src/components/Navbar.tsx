import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Building2,
  Car,
  FileSpreadsheet,
  Receipt,
  Users,
  Fuel,
  Wrench,
  Bell,
  Download,
  Upload,
  RotateCcw,
  LayoutDashboard,
  CreditCard,
  Handshake,
  Scale,
  Wallet,
  Shield,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import {
  downloadServerBackup,
  resetOperationalDataApi,
  restoreServerBackup,
  validateServerBackup,
} from '../api/platformClient';
import { ReminderItem, StaffUser } from '../types';
import { formatCurrency } from '../utils/calculations';

export type ActiveTab =
  | 'dashboard'
  | 'fleet_dispatch'
  | 'our_vehicles'
  | 'company_documents'
  | 'petty_cash'
  | 'daily_payments'
  | 'attached_vendors'
  | 'statutory_payroll'
  | 'tenders'
  | 'vehicles_officers'
  | 'logbook'
  | 'billing'
  | 'drivers_khata'
  | 'fuel'
  | 'maintenance'
  | 'staff_management'
  | 'reminders';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  reminders: ReminderItem[];
  totalVehicles: number;
  activeTendersCount: number;
  pendingBillsAmount: number;
  currentUser?: StaffUser;
  staffUsers?: StaffUser[];
  onSwitchUser?: (staff: StaffUser) => void;
  onLogout?: () => void;
  serverAuthEnabled?: boolean;
  companyDocAlertsCount?: number;
  vehicleDocAlertsCount?: number;
  onOpenBulkImport?: (type?: any) => void;
  onOpenProfileModal?: (type?: any, id?: string) => void;
}

const roleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'office_boy_cashier':
      return 'Cashier';
    case 'fleet_manager':
      return 'Fleet Manager';
    case 'accountant':
      return 'Accountant';
    case 'billing_clerk':
      return 'Billing';
    default:
      return 'Staff';
  }
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  reminders,
  totalVehicles,
  activeTendersCount,
  pendingBillsAmount,
  currentUser,
  staffUsers = [],
  onSwitchUser = () => {},
  onLogout,
  serverAuthEnabled = false,
  companyDocAlertsCount = 0,
  vehicleDocAlertsCount = 0,
  onOpenBulkImport,
  onOpenProfileModal,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const navScrollRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const highSeverityCount = reminders.filter((r) => r.severity === 'high').length;

  const updateNavScrollState = useCallback(() => {
    const el = navScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const handleBackupExport = async () => {
    setIsToolsOpen(false);
    if (serverAuthEnabled) {
      if (!isAdmin) {
        alert('Only an admin can download a full backup.');
        return;
      }
      try {
        await downloadServerBackup();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Backup download failed.');
      }
      return;
    }
    StorageService.exportAllData();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (serverAuthEnabled) {
          if (!isAdmin) {
            alert('Only an admin can restore a backup.');
            return;
          }
          const preview = await validateServerBackup(json);
          const summary = Object.entries(preview.detected || {})
            .filter(([, n]) => typeof n === 'number' && n > 0)
            .map(([k, n]) => `${k}: ${n}`)
            .slice(0, 12)
            .join('\n');
          if (
            !confirm(
              `Restore this backup into the live database?\n\nThis replaces operational data. Staff logins are never overwritten.\n\n${summary || preview.message}\n\nContinue?`
            )
          ) {
            return;
          }
          const result = await restoreServerBackup(json);
          alert(result.message);
          window.location.reload();
          return;
        }
        StorageService.importData(json);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    setIsToolsOpen(false);
    if (serverAuthEnabled) {
      if (!isAdmin) {
        alert('Only an admin can reset operational data.');
        return;
      }
      if (
        !confirm(
          'Clear all operational data on the server? Staff logins stay intact. This cannot be undone.'
        )
      ) {
        return;
      }
      try {
        const result = await resetOperationalDataApi();
        alert(result.message);
        window.location.reload();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Reset failed.');
      }
      return;
    }
    if (confirm('Clear all data and start fresh? This cannot be undone.')) {
      StorageService.clearAllData();
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'fleet_dispatch', label: 'Fleet Dispatch', icon: <Car className="w-4 h-4" /> },
    {
      id: 'our_vehicles',
      label: 'Our Vehicles',
      icon: <Car className="w-4 h-4" />,
      badge: vehicleDocAlertsCount > 0 ? vehicleDocAlertsCount : undefined,
    },
    {
      id: 'company_documents',
      label: 'Company Docs',
      icon: <FileText className="w-4 h-4" />,
      badge: companyDocAlertsCount > 0 ? companyDocAlertsCount : undefined,
    },
    { id: 'petty_cash', label: 'Petty Cash', icon: <Wallet className="w-4 h-4" /> },
    { id: 'daily_payments', label: 'Daily Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'attached_vendors', label: 'Attached Fleet', icon: <Handshake className="w-4 h-4" /> },
    { id: 'statutory_payroll', label: 'EPF & ESI', icon: <Scale className="w-4 h-4" /> },
    { id: 'tenders', label: 'Tenders', icon: <Building2 className="w-4 h-4" /> },
    { id: 'vehicles_officers', label: 'Vehicles & Officers', icon: <Car className="w-4 h-4" /> },
    { id: 'logbook', label: 'Log Book', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'billing', label: 'Govt Billing', icon: <Receipt className="w-4 h-4" /> },
    { id: 'drivers_khata', label: 'Drivers Khata', icon: <Users className="w-4 h-4" /> },
    { id: 'fuel', label: 'Fuel', icon: <Fuel className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
    { id: 'staff_management', label: 'Staff & Roles', icon: <Shield className="w-4 h-4" /> },
    {
      id: 'reminders',
      label: 'Alerts',
      icon: <Bell className="w-4 h-4" />,
      badge: reminders.length,
    },
  ];

  const visibleNavItems = navItems.filter((tab) => {
    if (!currentUser || currentUser.role === 'admin') return true;
    const permKey = (
      tab.id === 'fuel'
        ? 'fuel_manager'
        : tab.id === 'our_vehicles'
          ? 'vehicles_officers'
          : tab.id
    ) as any;
    return (currentUser.permissions as Record<string, any>)?.[permKey]?.canView !== false;
  });

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    updateNavScrollState();
    const onScroll = () => updateNavScrollState();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateNavScrollState) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateNavScrollState);
    // Re-check after fonts/layout settle
    const t = window.setTimeout(updateNavScrollState, 120);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro?.disconnect();
      window.removeEventListener('resize', updateNavScrollState);
      window.clearTimeout(t);
    };
  }, [updateNavScrollState, visibleNavItems.length, activeTab]);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isUserMenuOpen]);

  const scrollNav = (dir: 'left' | 'right') => {
    const el = navScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-ink)_97%,black)] text-white backdrop-blur-md print:hidden">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Brand row */}
        <div className="flex items-center justify-between gap-4 py-3.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="group flex min-w-0 items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 text-white shadow-[0_8px_20px_rgba(15,118,110,0.4)] transition-transform duration-300 group-hover:scale-[1.03]">
              <Car className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div className="font-[family-name:var(--font-display)] text-[1.05rem] font-bold tracking-tight text-white sm:text-lg">
                <span className="text-teal-300">SHAKTI</span> Travels &amp; Tours
              </div>
              <p className="truncate text-xs text-white/45">
                Govt fleet · tender · billing ERP
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 lg:flex">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Tenders</div>
                <div className="text-sm font-semibold text-white">{activeTendersCount}</div>
              </div>
              <div className="h-7 w-px bg-white/10" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Fleet</div>
                <div className="text-sm font-semibold text-white">{totalVehicles}</div>
              </div>
              <div className="h-7 w-px bg-white/10" />
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Pending</div>
                <div className="text-sm font-semibold text-teal-300">
                  {formatCurrency(pendingBillsAmount)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('reminders')}
              className={`relative inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-sm transition-colors ${
                highSeverityCount > 0
                  ? 'border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              title="Alerts & reminders"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
              {reminders.length > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    highSeverityCount > 0 ? 'bg-rose-500 text-white' : 'bg-teal-600 text-white'
                  }`}
                >
                  {reminders.length}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsToolsOpen((v) => !v);
                  setIsUserMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                title="Quick tools"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="hidden md:inline">Tools</span>
              </button>

              {isToolsOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[var(--color-ink-soft)] p-1.5 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenBulkImport?.('vehicles');
                      setIsToolsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-[var(--color-copper-light)]" />
                    Excel import hub
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenProfileModal?.('driver');
                      setIsToolsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <Users className="h-4 w-4 text-[var(--color-copper-light)]" />
                    Edit profiles
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBackupExport()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                    Backup data
                  </button>
                  <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white">
                    <Upload className="h-4 w-4" />
                    Restore backup
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleResetData()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-rose-300 hover:bg-rose-500/15"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset all data
                  </button>
                </div>
              )}
            </div>

            {currentUser && (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen((v) => !v);
                    setIsToolsOpen(false);
                  }}
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  className={`group flex items-center gap-2.5 rounded-xl border py-1.5 pl-1.5 pr-2.5 transition-all duration-200 ${
                    isUserMenuOpen
                      ? 'border-teal-400/35 bg-teal-500/15 shadow-[0_0_0_1px_rgba(45,212,191,0.12)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold text-white ring-2 ring-white/10 ${
                        currentUser.avatarColor || 'bg-[var(--color-copper)]'
                      }`}
                    >
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-ink)] bg-emerald-400"
                      title="Online"
                    />
                  </div>
                  <div className="hidden min-w-0 text-left sm:block">
                    <div className="max-w-[120px] truncate text-xs font-semibold text-white">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] font-medium text-teal-200/70">
                      {roleLabel(currentUser.role)}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180 text-teal-200' : 'group-hover:text-white/70'
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className="nav-user-menu absolute right-0 z-50 mt-2.5 w-[300px] overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(165deg,#12263a_0%,#0f2133_55%,#0c1a28_100%)] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
                  >
                    <div className="relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.04] px-3.5 py-3.5">
                      <div
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(45,212,191,0.14),transparent_55%)]"
                        aria-hidden
                      />
                      <div className="relative flex items-start gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg ring-2 ring-white/15 ${
                            currentUser.avatarColor || 'bg-[var(--color-copper)]'
                          }`}
                        >
                          {currentUser.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-bold text-white">{currentUser.name}</p>
                            <span className="inline-flex items-center rounded-full bg-teal-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-teal-200">
                              {roleLabel(currentUser.role)}
                            </span>
                          </div>
                          {currentUser.email ? (
                            <p className="mt-0.5 truncate text-[11px] text-white/50">{currentUser.email}</p>
                          ) : currentUser.designation ? (
                            <p className="mt-0.5 truncate text-[11px] text-white/50">{currentUser.designation}</p>
                          ) : null}
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300/90">
                            <CheckCircle2 className="h-3 w-3" />
                            {serverAuthEnabled ? 'Secure session active' : 'Local demo session'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {!serverAuthEnabled && (
                      <div className="mt-2 max-h-52 space-y-0.5 overflow-y-auto px-0.5 py-1">
                        <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                          Switch staff
                        </p>
                        {staffUsers.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              onSwitchUser(s);
                              setIsUserMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                              s.id === currentUser.id
                                ? 'bg-teal-500/20 text-white'
                                : 'text-white/70 hover:bg-white/8 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white ${s.avatarColor}`}
                              >
                                {s.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-semibold">{s.name}</div>
                                <div className="text-[10px] text-white/40">{roleLabel(s.role)}</div>
                              </div>
                            </div>
                            {s.id === currentUser.id && (
                              <span className="text-[10px] font-bold text-teal-300">Active</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 space-y-1 border-t border-white/8 pt-2">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setActiveTab('dashboard');
                          setIsUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-white/85 transition-colors hover:bg-white/8 hover:text-white"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8 text-teal-200">
                          <LayoutDashboard className="h-3.5 w-3.5" />
                        </span>
                        Go to dashboard
                      </button>
                      {currentUser.role === 'admin' && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setActiveTab('staff_management');
                            setIsUserMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-white/85 transition-colors hover:bg-white/8 hover:text-white"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8 text-teal-200">
                            <Shield className="h-3.5 w-3.5" />
                          </span>
                          Manage staff &amp; roles
                        </button>
                      )}
                      {serverAuthEnabled && onLogout && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            onLogout();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl border border-rose-400/20 bg-rose-500/[0.08] px-3 py-2.5 text-left text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400/35 hover:bg-rose-500/15"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-200">
                            <LogOut className="h-3.5 w-3.5" />
                          </span>
                          Sign out
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Module nav — scrollable with edge fades + arrows */}
        <div className="relative -mx-1">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollNav('left')}
              className="absolute left-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[var(--color-ink)]/95 text-white shadow-lg transition hover:bg-teal-700"
              aria-label="Scroll modules left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollNav('right')}
              className="absolute right-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[var(--color-ink)]/95 text-teal-200 shadow-lg transition hover:bg-teal-700 hover:text-white"
              aria-label="Scroll modules right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[var(--color-ink)] to-transparent transition-opacity ${
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-[var(--color-ink)] to-transparent transition-opacity ${
              canScrollRight ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <nav
            ref={navScrollRef}
            className="flex gap-0.5 overflow-x-auto scroll-smooth pb-0 scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            aria-label="Modules"
          >
            {visibleNavItems.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-item relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-[13px] font-semibold transition-colors ${
                    isActive
                      ? 'nav-item-active text-white'
                      : 'text-white/45 hover:text-white/85'
                  }`}
                >
                  <span className={isActive ? 'text-teal-300' : ''}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-teal-600 text-white' : 'bg-rose-500/90 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
            {canScrollRight && (
              <span className="flex shrink-0 items-center gap-1 px-3 text-[11px] font-semibold text-teal-300/90">
                More
                <ChevronRight className="h-3.5 w-3.5 animate-pulse" />
              </span>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

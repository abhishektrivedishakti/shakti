import React from 'react';
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
  ShieldCheck,
  CreditCard,
  Handshake,
  Scale,
  Wallet,
  Shield,
  ChevronDown,
  UserCheck,
  Key,
  FileText,
} from 'lucide-react';
import { StorageService } from '../utils/storage';
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
  companyDocAlertsCount?: number;
  vehicleDocAlertsCount?: number;
  onOpenBulkImport?: (type?: any) => void;
  onOpenProfileModal?: (type?: any, id?: string) => void;
}

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
  companyDocAlertsCount = 0,
  vehicleDocAlertsCount = 0,
  onOpenBulkImport,
  onOpenProfileModal,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const highSeverityCount = reminders.filter((r) => r.severity === 'high').length;

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        StorageService.importData(json);
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const navItems: { id: ActiveTab; label: string; hindiLabel: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', hindiLabel: 'डैशबोर्ड', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'fleet_dispatch',
      label: 'Fleet Dispatch Pro',
      hindiLabel: 'फ्लीट डिस्पैच प्रो (3-पार्टी ड्यूटी)',
      icon: <Car className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'our_vehicles',
      label: 'Our Vehicles & Expiries',
      hindiLabel: 'हमारी गाड़ियाँ (PUC/बीमा/फिटनेस)',
      icon: <Car className="w-4 h-4 text-amber-400" />,
      badge: vehicleDocAlertsCount > 0 ? vehicleDocAlertsCount : undefined,
    },
    {
      id: 'company_documents',
      label: 'Company Docs & Expiries',
      hindiLabel: 'कंपनी दस्तावेज़ व एक्सपायरी',
      icon: <FileText className="w-4 h-4 text-cyan-400" />,
      badge: companyDocAlertsCount > 0 ? companyDocAlertsCount : undefined,
    },
    { id: 'petty_cash', label: 'Petty Cash & Float', hindiLabel: 'पेटी कैश व फुटकर खर्च', icon: <Wallet className="w-4 h-4 text-amber-400" /> },
    { id: 'daily_payments', label: 'Daily Payments', hindiLabel: 'दैनिक भुगतान व रोकड़', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'attached_vendors', label: 'Attached Fleet & Vendors', hindiLabel: 'अटैच गाड़ियाँ (मालिक-चालक व वेंडर)', icon: <Handshake className="w-4 h-4 text-emerald-400" /> },
    { id: 'statutory_payroll', label: 'EPF & ESI 100+ Drivers', hindiLabel: 'लेबर लॉ व EPF/ESI (100 ड्राइवर)', icon: <Scale className="w-4 h-4" /> },
    { id: 'tenders', label: 'Tenders & WO', hindiLabel: 'टेंडर व अनुबंध', icon: <Building2 className="w-4 h-4" /> },
    { id: 'vehicles_officers', label: 'Vehicles & Officers', hindiLabel: 'गाड़ी व अधिकारी अलॉटमेंट', icon: <Car className="w-4 h-4" /> },
    { id: 'logbook', label: 'Daily Log Book', hindiLabel: 'दैनिक लॉग बुक', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'billing', label: 'Govt Monthly Billing', hindiLabel: 'सरकारी बिल व क्लेम', icon: <Receipt className="w-4 h-4" /> },
    { id: 'drivers_khata', label: 'Drivers & Khata', hindiLabel: 'ड्राइवर सैलरी व एडवांस', icon: <Users className="w-4 h-4" /> },
    { id: 'fuel', label: 'Fuel Slips & Pump Bills', hindiLabel: 'फ्यूल पर्ची व पंप बिलिंग', icon: <Fuel className="w-4 h-4 text-amber-400" /> },
    { id: 'maintenance', label: 'Maintenance', hindiLabel: 'सर्विस व रिपेयर', icon: <Wrench className="w-4 h-4" /> },
    { id: 'staff_management', label: 'Staff & Roles', hindiLabel: 'स्टाफ व अनुमतियां', icon: <Shield className="w-4 h-4 text-emerald-400" /> },
    {
      id: 'reminders',
      label: 'Payment & Expiries',
      hindiLabel: 'रिमाइंडर्स व अलर्ट्स',
      icon: <Bell className="w-4 h-4" />,
      badge: reminders.length,
    },
  ];

  const visibleNavItems = navItems.filter((tab) => {
    if (!currentUser || currentUser.role === 'admin') return true;
    const permKey = (tab.id === 'fuel' ? 'fuel_manager' : tab.id === 'our_vehicles' ? 'vehicles_officers' : tab.id) as any;
    return (currentUser.permissions as Record<string, any>)?.[permKey]?.canView !== false;
  });

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-800">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-inner font-bold text-lg">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  <span className="text-amber-400">SHAKTI</span> TRAVELS &amp; TOURS
                </span>
                <span className="bg-slate-800 text-indigo-300 text-xs px-2 py-0.5 rounded font-mono border border-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> GeM &amp; Govt Fleet
                </span>
              </div>
              <p className="text-xs text-slate-400">
                शक्ति ट्रैवल्स एंड टूर्स &bull; सरकारी कार्यालय टैक्सी टेंडर, टूर व वाहन प्रबंधन
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden md:flex items-center space-x-4 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Active Tenders</span>
                <span className="font-semibold text-slate-200">{activeTendersCount} depts</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Fleet Assigned</span>
                <span className="font-semibold text-emerald-400">{totalVehicles} Cars</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Govt Pending Bills</span>
                <span className="font-semibold text-amber-400">{formatCurrency(pendingBillsAmount)}</span>
              </div>
            </div>

            {/* Notification Bell Button */}
            <button
              onClick={() => setActiveTab('reminders')}
              className={`relative p-2 rounded-lg border transition-colors flex items-center gap-1.5 ${
                highSeverityCount > 0
                  ? 'bg-rose-950/60 border-rose-700/80 text-rose-300 hover:bg-rose-900/80'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="View Reminders & Expiries"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Alerts</span>
              {reminders.length > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    highSeverityCount > 0 ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'
                  }`}
                >
                  {reminders.length}
                </span>
              )}
            </button>

            {/* Excel Bulk Fast-Track */}
            <button
              onClick={() => {
                if (onOpenBulkImport) {
                  onOpenBulkImport('vehicles');
                } else {
                  setActiveTab('vehicles_officers');
                }
              }}
              className="p-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg border border-emerald-600/70 flex items-center gap-1.5 transition-colors font-bold shadow-xs cursor-pointer"
              title="एक्सेल शीट डाउनलोड करें या भरी हुई शीट अपलोड करें (Bulk Excel & Feeding Hub)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span className="hidden lg:inline text-xs">एक्सेल व फीडिंग हब</span>
            </button>

            {/* Profile Management & Editor Hub */}
            <button
              onClick={() => {
                if (onOpenProfileModal) {
                  onOpenProfileModal('driver');
                } else {
                  setActiveTab('drivers_khata');
                }
              }}
              className="p-2 bg-indigo-700 hover:bg-indigo-600 text-indigo-100 rounded-lg border border-indigo-500/70 flex items-center gap-1.5 transition-colors font-bold shadow-xs cursor-pointer"
              title="चालक, वेंडर, अधिकारी व गाड़ी प्रोफाइल सीधे एडिट व प्रबंधित करें (Manage / Edit Profiles: Drivers, Vendors, Officers, Vehicles)"
            >
              <Users className="w-4 h-4 text-indigo-300" />
              <span className="hidden lg:inline text-xs">👤 प्रोफाइल एडिट / प्रबंधन</span>
            </button>

            {/* Backup & Import Tools */}
            <button
              onClick={() => StorageService.exportAllData()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
              title="Backup all ERP data as JSON"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Backup</span>
            </button>

            <label
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
              title="Restore Data from Backup JSON"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden lg:inline">Restore</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (confirm('क्या आप सभी डेटा साफ़ करके नया शुरू करना चाहते हैं? (Are you sure you want to clear all data and start completely fresh?)')) {
                  StorageService.clearAllData();
                }
              }}
              className="p-2 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 transition-colors"
              title="Clear All Data (सारा डेटा साफ़ करें)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Active Staff User Switcher */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-left transition-colors cursor-pointer"
                  title="स्टाफ बदलें / स्विच करें"
                >
                  <div
                    className={`w-7 h-7 rounded-full ${currentUser.avatarColor || 'bg-indigo-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-inner`}
                  >
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-slate-100 leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-indigo-300 leading-tight font-medium">
                      {currentUser.role === 'admin'
                        ? 'मालिक (Admin)'
                        : currentUser.role === 'office_boy_cashier'
                        ? 'पेटी कैश / ऑफिस बॉय'
                        : currentUser.role === 'fleet_manager'
                        ? 'फ्लीट मैनेजर'
                        : currentUser.role === 'accountant'
                        ? 'मुंशी / अकाउंटेंट'
                        : currentUser.role === 'billing_clerk'
                        ? 'बिलिंग क्लर्क'
                        : 'स्टाफ'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* User Switcher Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-xs">
                    <div className="px-3 py-2 border-b border-slate-700/80">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        स्विच स्टाफ प्रोफाइल (Switch User)
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        वर्तमान सत्र: <strong className="text-white">{currentUser.name}</strong>
                      </div>
                    </div>

                    <div className="py-1 max-h-60 overflow-y-auto space-y-1">
                      {staffUsers.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            onSwitchUser(s);
                            setIsUserMenuOpen(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            s.id === currentUser.id
                              ? 'bg-indigo-600/30 text-white border border-indigo-500/50'
                              : 'hover:bg-slate-700/60 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full ${s.avatarColor} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}
                            >
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-xs leading-tight">{s.name}</div>
                              <div className="text-[10px] text-slate-400 leading-tight">
                                {s.role.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>
                          {s.id === currentUser.id ? (
                            <span className="text-[10px] font-bold text-emerald-400">सक्रिय ✓</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 hover:text-indigo-300">लॉगिन</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-700/80 mt-1">
                      <button
                        onClick={() => {
                          setActiveTab('staff_management');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-center py-1.5 bg-slate-700 hover:bg-slate-600 text-indigo-300 hover:text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        स्टाफ व अनुमतियां प्रबंधित करें
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none text-xs">
          {visibleNavItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <div className="text-left">
                  <span className="block leading-tight">{tab.label}</span>
                  <span
                    className={`block text-[10px] leading-tight ${
                      isActive ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {tab.hindiLabel}
                  </span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                      isActive ? 'bg-indigo-900 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

import React from 'react';
import {
  Building2,
  Car,
  FileSpreadsheet,
  Receipt,
  Users,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Fuel,
  IndianRupee,
  CheckCircle2,
  CreditCard,
  Handshake,
  PauseCircle,
  UserX,
  UserCheck,
  Wallet,
  Sparkles,
  Wrench,
  FileText,
  FolderOpen,
  Download,
  Layers,
  Upload,
  Briefcase,
} from 'lucide-react';
import {
  Tender,
  Vehicle,
  Officer,
  Driver,
  DailyLogEntry,
  MonthlyBill,
  ReminderItem,
  StaffUser,
  PettyCashTransaction,
  CompanyDocument,
} from '../types';
import { formatCurrency, formatDate, getDaysDiff } from '../utils/calculations';
import { ActiveTab } from './Navbar';
import { BulkImportType } from './BulkImportModal';
import {
  downloadVehicleExcelTemplate,
  downloadDriverExcelTemplate,
  downloadOfficerExcelTemplate,
  downloadCombinedFleetExcelTemplate,
} from '../utils/excelTemplateHelper';

interface DashboardViewProps {
  tenders: Tender[];
  vehicles: Vehicle[];
  officers: Officer[];
  drivers: Driver[];
  dailyLogs: DailyLogEntry[];
  bills: MonthlyBill[];
  reminders: ReminderItem[];
  currentUser?: StaffUser;
  staffUsers?: StaffUser[];
  pettyCashTransactions?: PettyCashTransaction[];
  companyDocuments?: CompanyDocument[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewLogModal: () => void;
  onOpenNewBillModal: () => void;
  onOpenAdvanceModal: () => void;
  onOpenPaymentModal?: () => void;
  onOpenBulkImportModal?: (type?: BulkImportType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tenders,
  vehicles,
  officers,
  drivers,
  dailyLogs,
  bills,
  reminders,
  currentUser,
  staffUsers = [],
  pettyCashTransactions = [],
  companyDocuments = [],
  setActiveTab,
  onOpenNewLogModal,
  onOpenNewBillModal,
  onOpenAdvanceModal,
  onOpenPaymentModal,
  onOpenBulkImportModal,
}) => {
  const currentMonthStr = '2026-09';
  const currentMonthLogs = dailyLogs.filter((l) => l.date.startsWith(currentMonthStr));
  const currentMonthKm = currentMonthLogs.reduce((acc, l) => acc + (Number(l.totalKm) || 0), 0);

  const pendingBills = bills.filter((b) => b.paymentStatus === 'submitted' || b.paymentStatus === 'overdue');
  const pendingAmount = pendingBills.reduce((acc, b) => acc + b.netPayableAmount, 0);

  const overdueBills = bills.filter((b) => b.paymentStatus === 'overdue');
  const overdueAmount = overdueBills.reduce((acc, b) => acc + b.netPayableAmount, 0);

  const highSeverityReminders = reminders.filter((r) => r.severity === 'high');

  const haltedVehicles = vehicles.filter(
    (v) => v.status === 'idle_officer_transferred' || v.status === 'surrendered_temporary'
  );

  // Petty cash calculations
  const totalPettyInflow = pettyCashTransactions
    .filter((t) => t.type === 'cash_inflow')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPettyExpenses = pettyCashTransactions
    .filter((t) => t.type === 'cash_expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPettyCashInHand = totalPettyInflow - totalPettyExpenses;
  const pendingVerificationReceipts = pettyCashTransactions.filter(
    (t) => t.type === 'cash_expense' && t.approvalStatus === 'pending_verification'
  ).length;

  // Specific boy balance if current user is office boy
  const currentBoyInflow = pettyCashTransactions
    .filter((t) => t.type === 'cash_inflow' && t.staffUserId === currentUser?.id)
    .reduce((sum, t) => sum + t.amount, 0);
  const currentBoyExpenses = pettyCashTransactions
    .filter((t) => t.type === 'cash_expense' && t.staffUserId === currentUser?.id)
    .reduce((sum, t) => sum + t.amount, 0);
  const currentBoyBalance = currentBoyInflow - currentBoyExpenses;

  // Company Documents Expiry calculations
  const expiredCompanyDocs = companyDocuments.filter((d) => {
    if (d.isLifetime || !d.expiryDate) return false;
    return getDaysDiff(d.expiryDate) < 0;
  });
  const expiringSoonCompanyDocs = companyDocuments.filter((d) => {
    if (d.isLifetime || !d.expiryDate) return false;
    const days = getDaysDiff(d.expiryDate);
    return days >= 0 && days <= (d.alertDaysBefore || 30);
  });

  // Fleet Vehicles Document Expiry calculations (PUC, Insurance, Fitness - 1 Month Alert)
  const vehiclesWithExpiryAlerts = vehicles.filter((v) => {
    const pucDays = v.pucExpiry ? getDaysDiff(v.pucExpiry) : 999;
    const insDays = v.insuranceExpiry ? getDaysDiff(v.insuranceExpiry) : 999;
    const fitDays = v.rtoFitnessExpiry ? getDaysDiff(v.rtoFitnessExpiry) : 999;
    return pucDays <= 30 || insDays <= 30 || fitDays <= 30;
  });

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="page-kicker">Operations overview</span>
          <h2 className="page-title">
            {currentUser ? `Welcome, ${currentUser.name.split(' ')[0]}` : 'Command dashboard'}
          </h2>
          <p className="page-subtitle">
            Fleet health, tender billing, document expiries, and daily operations in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onOpenNewLogModal} className="btn btn-primary">
            <FileSpreadsheet className="h-4 w-4" />
            New log entry
          </button>
          <button type="button" onClick={onOpenNewBillModal} className="btn btn-secondary">
            <Receipt className="h-4 w-4" />
            Raise bill
          </button>
          <button
            type="button"
            onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('combined') : setActiveTab('vehicles_officers'))}
            className="btn btn-ghost"
          >
            <Upload className="h-4 w-4" />
            Excel hub
          </button>
        </div>
      </div>

      {/* Welcome / empty state */}
      {vehicles.length === 0 && tenders.length === 0 && (
        <div className="panel overflow-hidden">
          <div className="border-b border-white/10 bg-[var(--color-ink)] p-5 text-white sm:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="page-kicker !text-teal-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Shakti Travels and Tours • फ्रेश वर्किंग सत्र सक्रिय
                  </span>
                  <span className="badge badge-success !bg-teal-500/20 !text-teal-200">Ready for Production</span>
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold">
                  पुराना डेमो डेटा हटा दिया गया है - अब अपनी कंपनी का वास्तविक डेटा दर्ज करें!
                </h3>
                <p className="max-w-2xl text-xs leading-relaxed text-white/65">
                  सॉफ्टवेयर अब पूरी तरह खाली और फ्रेश है। आप सीधे अपने सरकारी टेंडर अनुबंध, गाड़ियां, ड्राइवर, दैनिक लॉग बुक व कंपनी दस्तावेज जोड़ना शुरू कर सकते हैं।
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button type="button" onClick={() => setActiveTab('tenders')} className="btn btn-accent !text-xs">
                  <Building2 className="h-4 w-4" />
                  + Add Tender (टेंडर)
                </button>
                <button type="button" onClick={() => setActiveTab('vehicles_officers')} className="btn btn-success !text-xs">
                  <UserCheck className="h-4 w-4" />
                  + मालिक-चालक (Driver+Car)
                </button>
                <button type="button" onClick={() => setActiveTab('attached_vendors')} className="btn btn-secondary !text-xs">
                  <Car className="h-4 w-4" />
                  + केवल गाड़ी मालिक
                </button>
                <button
                  type="button"
                  onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('combined') : setActiveTab('vehicles_officers'))}
                  className="btn btn-success !text-xs"
                  title="एक्सेल शीट डाउनलोड करें या भरी हुई शीट अपलोड करें"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  एक्सेल बल्क अपलोड
                </button>
                <button type="button" onClick={() => setActiveTab('company_documents')} className="btn btn-secondary !text-xs">
                  <FileText className="h-4 w-4" />
                  + कंपनी दस्तावेज़
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Shakti Travels & Tours: Company Documents & Expiries Radar Banner */}
      {(expiredCompanyDocs.length > 0 || expiringSoonCompanyDocs.length > 0) && (
        <div className="alert-banner warning">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold">Company document expiry</span>
                <span className="badge badge-danger">
                  {expiredCompanyDocs.length + expiringSoonCompanyDocs.length} docs
                </span>
              </div>
              <p className="mt-1 text-xs opacity-80">
                {expiredCompanyDocs.length > 0 ? `${expiredCompanyDocs.length} expired` : ''}
                {expiredCompanyDocs.length > 0 && expiringSoonCompanyDocs.length > 0 ? ' · ' : ''}
                {expiringSoonCompanyDocs.length > 0 ? `${expiringSoonCompanyDocs.length} expiring soon` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('company_documents')}
              className="btn btn-secondary shrink-0"
            >
              <FileText className="h-4 w-4" />
              Review documents
            </button>
          </div>

          <div className="mt-1 grid w-full basis-full grid-cols-1 gap-  2 text-xs sm:grid-cols-2 lg:grid-cols-3">
            {[...expiredCompanyDocs, ...expiringSoonCompanyDocs].slice(0, 3).map((d) => {
              const diff = getDaysDiff(d.expiryDate!);
              const isPast = diff < 0;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveTab('company_documents')}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-white/70 p-2.5 text-left transition-colors hover:bg-white"
                >
                  <div className="min-w-0 pr-2">
                    <span className="block truncate font-bold text-[var(--color-ink)]">{d.title}</span>
                    <span className="block text-[10px] text-[var(--color-muted)]">{d.docNumber || 'No number'}</span>
                  </div>
                  <span className={`badge shrink-0 ${isPast ? 'badge-danger' : 'badge-warning'}`}>
                    {isPast ? `Expired ${Math.abs(diff)}d` : `${diff}d left`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
                  
      {/* Fleet Vehicles Document Expiry Radar Banner */}
      {vehiclesWithExpiryAlerts.length > 0 && (
        <div className="alert-banner warning">
          <Car className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold">Fleet document expiry</span>
                <span className="badge badge-warning">{vehiclesWithExpiryAlerts.length} vehicles</span>
              </div>
              <p className="mt-1 text-xs opacity-80">
                PUC, insurance, or RTO fitness due within 30 days.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('our_vehicles')}
              className="btn btn-secondary shrink-0"
            >
              <Car className="h-4 w-4" />
              View fleet
            </button>
          </div>
        </div>
      )}

      {/* Officer Transferred / Halted Vehicles Warning Banner */}
      {haltedVehicles.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start space-x-3 text-amber-900 shadow-2xs">
          <PauseCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <span>🛑 {haltedVehicles.length} सरकारी गाड़ियां वर्तमान में बंद हैं (अधिकारी तबादला - पद रिक्त)</span>
                <span className="text-[10px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  गाड़ी बंद / Halted
                </span>
              </h4>
              <button
                onClick={() => setActiveTab('vehicles_officers')}
                className="text-xs font-bold text-amber-900 underline hover:text-amber-950 whitespace-nowrap"
              >
                गाड़ियां देखें व नया अधिकारी अलॉट करें &rarr;
              </button>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              अधिकारी का तबादला हो जाने के कारण शासन आदेशानुसार वाहन संचालन स्थगित है। प्रो-राटा बिलिंग व नए अधिकारी की तैनाती की स्थिति जांचें:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {haltedVehicles.map((hv) => (
                <span key={hv.id} className="bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-md text-[11px] font-medium text-amber-950 flex items-center gap-1.5">
                  <span className="font-mono font-bold">{hv.vehicleNumber}</span>
                  <span className="text-slate-600">({hv.makeModel})</span>
                  <span className="text-amber-800 font-semibold">• {hv.idleSinceDate ? formatDate(hv.idleSinceDate) : 'लागू'} से बंद</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* High-severity reminders */}
      {highSeverityReminders.length > 0 && (
        <div className="alert-banner danger">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-[var(--color-ink)]">
                Urgent attention
              </h4>
              <span className="badge badge-danger">{highSeverityReminders.length} items</span>
            </div>
            <div className="mt-2 space-y-1.5 text-xs text-[var(--color-muted)]">
              {highSeverityReminders.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <strong className="font-semibold text-[var(--color-ink)]">{item.title}</strong>
                    <span className="text-[var(--color-muted)]"> — {item.description}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reminders')}
                    className="shrink-0 font-semibold text-[var(--color-copper)] hover:underline"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Office Boy / Field Cashier Personalized Banner */}
      {currentUser?.role === 'office_boy_cashier' && (
        <div className="panel overflow-hidden">
          <div className="flex flex-col items-start justify-between gap-4 bg-[var(--color-ink)] p-5 text-white md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-200">
                <Wallet className="h-7 w-7" />
              </div>
              <div>
                <span className="page-kicker !text-teal-300">
                  ऑफिस बॉय व फील्ड सहायक काउंटर (Field Runner Desk)
                </span>
                <h3 className="mt-0.5 font-[family-name:var(--font-display)] text-lg font-bold">
                  नमस्ते, {currentUser.name}! आपके हाथ में वर्तमान रोकड़ (Cash in Hand)
                </h3>
                <p className="text-xs text-white/65">
                  गाड़ियों में डलवाया गया ईंधन, पंचर, सर्विसिंग, मोबिल आयल या कोई एक्सेसरीज का खर्च तुरंत यहां दर्ज करें।
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-center">
                <div className="text-[10px] font-medium text-white/70">हाथ में नकद बैलेंस</div>
                <div className="font-mono text-2xl font-bold">{formatCurrency(currentBoyBalance)}</div>
              </div>
              <button type="button" onClick={() => setActiveTab('petty_cash')} className="btn btn-accent !text-xs">
                <Wallet className="h-4 w-4" />
                पेटी कैश में खर्च दर्ज करें →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="stat-card">
          <span className="stat-label">Active tenders</span>
          <span className="stat-value">{tenders.length}</span>
          <p className="stat-meta">Departments under fixed monthly contracts</p>
        </div>

        <div className="stat-card cursor-pointer" onClick={() => setActiveTab('our_vehicles')}>
          <span className="stat-label">Our fleet</span>
          <span className="stat-value">{vehicles.length}</span>
          <p className="stat-meta">
            {vehiclesWithExpiryAlerts.length > 0
              ? `${vehiclesWithExpiryAlerts.length} docs expiring within 30 days`
              : 'PUC, insurance & fitness current'}
          </p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Pending govt bills</span>
          <span className="stat-value !text-[1.35rem]">{formatCurrency(pendingAmount)}</span>
          <p className="stat-meta">
            {pendingBills.length} invoices in clearance
            {overdueAmount > 0 ? ` · ${formatCurrency(overdueAmount)} overdue` : ''}
          </p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Month run (Sep)</span>
          <span className="stat-value !text-[1.35rem]">{currentMonthKm.toLocaleString()} KM</span>
          <p className="stat-meta">{currentMonthLogs.length} certified duty slips</p>
        </div>

        <div className="stat-card cursor-pointer" onClick={() => setActiveTab('petty_cash')}>
          <span className="stat-label">Petty cash</span>
          <span className={`stat-value !text-[1.35rem] ${totalPettyCashInHand >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
            {formatCurrency(totalPettyCashInHand)}
          </span>
          <p className="stat-meta">
            {pendingVerificationReceipts > 0
              ? `${pendingVerificationReceipts} receipts pending verification`
              : 'Float balanced'}
          </p>
        </div>
      </div>

      {/* Bulk Excel Import & Template Download Station */}
      <div className="panel overflow-hidden">
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 bg-[var(--color-ink)] p-5 text-white sm:flex-row sm:items-center sm:p-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="page-kicker !text-teal-300">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                बल्क एक्सेल आयात • Excel Fast-Track
              </span>
              <span className="text-xs text-white/55">
                अधिकारी, गाड़ियाँ व ड्राइवर एक्सेल शीट से अपलोड करें
              </span>
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
              सरकारी अधिकारी, ड्राइवर और गाड़ियों की एक्सेल शीट (Excel Template Download &amp; Auto-Add)
            </h3>
            <p className="max-w-2xl text-xs leading-relaxed text-white/65">
              एक-एक करके जोड़ने की आवश्यकता नहीं है! नीचे से अधिकारी, ड्राइवर या गाड़ी की एक्सेल शीट डाउनलोड करें, विवरण दर्ज करें और अपलोड करते ही सब कुछ सिस्टम में स्वतः सेव व लिंक हो जाएगा।
            </p>
          </div>

          <button
            type="button"
            onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('combined') : setActiveTab('vehicles_officers'))}
            className="btn btn-accent shrink-0"
          >
            <Upload className="h-4 w-4" />
            भरी हुई एक्सेल शीट अपलोड करें (Upload &amp; Add)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3.5 bg-[var(--color-sand)]/40 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          <div className="panel panel-pad space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-ink)] text-teal-300">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[var(--color-ink)]">1. अधिकारी शीट (Officers)</h4>
                <p className="truncate text-[11px] text-[var(--color-muted)]">नाम, पदनाम, विभाग, मोबाइल</p>
              </div>
            </div>
            <p className="text-[11px] leading-normal text-[var(--color-muted)]">
              सरकारी अधिकारियों का पदनाम, विभाग, कमरा, संबद्ध टेंडर व गाड़ी नंबर।
            </p>
            <div className="space-y-1.5 pt-1">
              <button type="button" onClick={downloadOfficerExcelTemplate} className="btn btn-primary w-full !text-xs">
                <Download className="h-3.5 w-3.5" />
                डाउनलोड अधिकारी एक्सेल (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('officers') : setActiveTab('vehicles_officers'))}
                className="btn btn-secondary w-full !text-[11px]"
              >
                <Upload className="h-3 w-3" />
                अधिकारी शीट अपलोड करें
              </button>
            </div>
          </div>

          <div className="panel panel-pad space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Car className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[var(--color-ink)]">2. गाड़ी एक्सेल शीट (Vehicles)</h4>
                <p className="truncate text-[11px] text-[var(--color-muted)]">नंबर, मॉडल, ईंधन, रेंट व फिटनेस</p>
              </div>
            </div>
            <p className="text-[11px] leading-normal text-[var(--color-muted)]">
              कंपनी की गाड़ियां, अटैच गाड़ियां व मालिक-चालक वाहन विवरण शीट।
            </p>
            <div className="space-y-1.5 pt-1">
              <button type="button" onClick={downloadVehicleExcelTemplate} className="btn btn-success w-full !text-xs">
                <Download className="h-3.5 w-3.5" />
                डाउनलोड गाड़ी एक्सेल (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('vehicles') : setActiveTab('vehicles_officers'))}
                className="btn btn-secondary w-full !text-[11px]"
              >
                <Upload className="h-3 w-3" />
                गाड़ी शीट अपलोड करें
              </button>
            </div>
          </div>

          <div className="panel panel-pad space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-info-soft)] text-[var(--color-info)]">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[var(--color-ink)]">3. ड्राइवर एक्सेल शीट (Drivers)</h4>
                <p className="truncate text-[11px] text-[var(--color-muted)]">नाम, फ़ोन, डीएल, वेतन व बैंक</p>
              </div>
            </div>
            <p className="text-[11px] leading-normal text-[var(--color-muted)]">
              कंपनी चालक, ठेका चालक या मालिक-चालक का विवरण भरने हेतु मानक एक्सेल।
            </p>
            <div className="space-y-1.5 pt-1">
              <button type="button" onClick={downloadDriverExcelTemplate} className="btn btn-primary w-full !text-xs">
                <Download className="h-3.5 w-3.5" />
                डाउनलोड ड्राइवर एक्सेल (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('drivers') : setActiveTab('drivers_khata'))}
                className="btn btn-secondary w-full !text-[11px]"
              >
                <Upload className="h-3 w-3" />
                ड्राइवर शीट अपलोड करें
              </button>
            </div>
          </div>

          <div className="panel panel-pad space-y-2.5 border-teal-200">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
                <Layers className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[var(--color-ink)]">4. संयुक्त वर्कबुक (3-in-1)</h4>
                <p className="truncate text-[11px] text-[var(--color-muted)]">अधिकारी + गाड़ी + ड्राइवर</p>
              </div>
            </div>
            <p className="text-[11px] leading-normal text-[var(--color-muted)]">
              एक ही एक्सेल वर्कबुक में अधिकारी, गाड़ियां व ड्राइवर भरकर एक क्लिक में जोड़ें।
            </p>
            <div className="space-y-1.5 pt-1">
              <button type="button" onClick={downloadCombinedFleetExcelTemplate} className="btn btn-accent w-full !text-xs">
                <Download className="h-3.5 w-3.5" />
                डाउनलोड 3-in-1 .xlsx
              </button>
              <button
                type="button"
                onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('combined') : setActiveTab('vehicles_officers'))}
                className="btn btn-secondary w-full !text-[11px]"
              >
                <Upload className="h-3 w-3" />
                संयुक्त शीट अपलोड करें
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operations */}
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-1 border-b border-[var(--color-line)] bg-[var(--color-ink)] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="page-kicker !text-teal-300">Daily operations</span>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
              Quick actions
            </h3>
            <p className="mt-0.5 text-xs text-white/55">
              Jump into the most used workflows — logs, bills, fuel, and payments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            {
              label: 'Fleet dispatch',
              hint: '3-party duty bookings',
              icon: <Car className="h-4 w-4" />,
              onClick: () => setActiveTab('fleet_dispatch'),
              primary: true,
            },
            {
              label: 'Add duty slip',
              hint: 'New log book entry',
              icon: <FileSpreadsheet className="h-4 w-4" />,
              onClick: onOpenNewLogModal,
              primary: true,
            },
            {
              label: 'Calculate govt bill',
              hint: 'Monthly tender claim',
              icon: <Receipt className="h-4 w-4" />,
              onClick: onOpenNewBillModal,
              primary: true,
            },
            {
              label: 'Issue fuel slip',
              hint: 'Pump & vendor slips',
              icon: <Fuel className="h-4 w-4" />,
              onClick: () => setActiveTab('fuel'),
            },
            {
              label: 'Post daily payment',
              hint: 'Cash & bank outflows',
              icon: <CreditCard className="h-4 w-4" />,
              onClick: onOpenPaymentModal ? onOpenPaymentModal : () => setActiveTab('daily_payments'),
            },
            {
              label: 'Driver advance',
              hint: 'Khata payout',
              icon: <IndianRupee className="h-4 w-4" />,
              onClick: onOpenAdvanceModal,
            },
            {
              label: 'Petty cash',
              hint: 'Float & field expenses',
              icon: <Wallet className="h-4 w-4" />,
              onClick: () => setActiveTab('petty_cash'),
            },
            {
              label: 'Attached fleet',
              hint: 'Vendors & owner-drivers',
              icon: <Handshake className="h-4 w-4" />,
              onClick: () => setActiveTab('attached_vendors'),
            },
            {
              label: 'Company docs',
              hint: 'Expiry tracker',
              icon: <FileText className="h-4 w-4" />,
              onClick: () => setActiveTab('company_documents'),
            },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={`group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                action.primary
                  ? 'border-teal-200/80 bg-teal-50/70 hover:border-teal-400 hover:bg-teal-50'
                  : 'border-[var(--color-line)] bg-[var(--color-surface-muted)] hover:border-[var(--color-line-strong)] hover:bg-white'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  action.primary
                    ? 'bg-teal-700 text-white group-hover:bg-teal-600'
                    : 'bg-white text-[var(--color-ink-soft)] shadow-sm group-hover:text-teal-700'
                }`}
              >
                {action.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[var(--color-ink)]">{action.label}</span>
                <span className="block text-[11px] text-[var(--color-muted)]">{action.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Fleet & Officer Deployment Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live Fleet &amp; Officer Deployment Matrix
            </h3>
            <p className="text-xs text-[var(--color-muted)]">
              कहाँ कौन सी गाड़ी, किस अधिकारी के साथ और कौन सा ड्राइवर चल रहा है
            </p>
          </div>
          <button
            onClick={() => setActiveTab('vehicles_officers')}
            className="text-xs text-[var(--color-copper)] font-semibold hover:text-teal-800 flex items-center gap-1"
          >
            Manage Fleet &amp; Change Driver &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Vehicle Details</th>
                <th className="py-3 px-4">Assigned Govt Officer</th>
                <th className="py-3 px-4">Department &amp; Tender</th>
                <th className="py-3 px-4">Active Driver</th>
                <th className="py-3 px-4">Fuel Arrangement</th>
                <th className="py-3 px-4">Sep KM Run</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--color-muted)]">
                    <Car className="w-8 h-8 mx-auto mb-2 text-[var(--color-muted)]" />
                    <p className="font-semibold text-slate-700 text-xs">No vehicles deployed yet &bull; कोई गाड़ी दर्ज नहीं है</p>
                    <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Click &ldquo;Manage Fleet &amp; Change Driver&rdquo; to add your fleet vehicles.</p>
                  </td>
                </tr>
              ) : (
                vehicles.slice(0, 8).map((v) => {
                const off = officers.find((o) => o.id === v.assignedOfficerId);
                const drv = drivers.find((d) => d.id === v.currentDriverId);
                const tender = tenders.find((t) => t.id === v.tenderId);
                const vehLogs = currentMonthLogs.filter((l) => l.vehicleId === v.id);
                const totalKm = vehLogs.reduce((sum, l) => sum + (Number(l.totalKm) || 0), 0);

                return (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{v.vehicleNumber}</div>
                      <div className="text-[11px] text-[var(--color-muted)]">
                        {v.makeModel} &bull; <span className="font-medium text-slate-600">{v.fuelType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {off ? (
                        <div>
                          <div className="font-semibold text-slate-900">{off.name}</div>
                          <div className="text-[11px] text-[var(--color-muted)]">{off.designation}</div>
                          <div className="text-[10px] text-[var(--color-copper)]">{off.mobile}</div>
                        </div>
                      ) : (
                        <span className="text-[var(--color-muted)] italic">Unassigned / Pool</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{tender?.departmentName || '-'}</div>
                      <div className="text-[11px] text-[var(--color-muted)]">{tender?.tenderNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      {drv ? (
                        <div>
                          <div className="font-semibold text-slate-900">{drv.name}</div>
                          <div className="text-[11px] text-[var(--color-muted)]">{drv.phone}</div>
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Salary: {formatCurrency(drv.monthlySalary)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-rose-500 font-medium">No Driver Attached</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {v.fuelPolicy === 'monthly_fixed_budget' ? (
                        <div>
                          <span className="inline-block bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            Fixed Fuel Budget
                          </span>
                          <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                            {formatCurrency(v.monthlyFixedFuelAmount || 0)} / mo
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                            Actual Fuel Slips
                          </span>
                          <div className="text-[10px] text-[var(--color-muted)] mt-0.5">Reimbursed as per bill</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{totalKm} KM</div>
                      <div className="text-[10px] text-[var(--color-muted)]">
                        {tender ? `${tender.includedKms} KM Quota` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveTab('logbook')}
                        className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                      >
                        Log Book
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[var(--color-muted)]">
            Showing top 8 of <strong>{vehicles.length}</strong> deployed vehicles across <strong>{tenders.length}</strong> government tenders
          </span>
          <button
            onClick={() => setActiveTab('vehicles_officers')}
            className="text-[var(--color-copper)] font-bold hover:text-teal-800 flex items-center gap-1"
          >
            View &amp; Search All {vehicles.length} Vehicles &rarr;
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Bills & Critical Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Govt Bills Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Govt Tender Bills &amp; Payment Status
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                विभागों को प्रस्तुत किए गए बिल और भुगतान की स्थिति
              </p>
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="text-xs text-[var(--color-copper)] font-semibold hover:text-teal-800"
            >
              All Bills &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {bills.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-start justify-between gap-3 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{b.billNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        b.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.paymentStatus === 'overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.paymentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    {b.departmentName} &bull; <span className="font-mono text-slate-600">{b.vehicleNumber}</span>
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Month: {b.monthYear} &bull; Due: {formatDate(b.dueDate)} &bull; Run: {b.totalKmsRun} KM (Extra: {b.extraKms} KM)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-slate-900 block">
                    {formatCurrency(b.netPayableAmount)}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)]">
                    Base: {formatCurrency(b.baseAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders & Alerts Box */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Automated Payment Reminders &amp; Expiries
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                बिल फॉलो-अप, फिटनेस, इंश्योरेंस व ड्राइवर पुलिस वेरिफिकेशन अलर्ट्स
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reminders')}
              className="text-xs text-[var(--color-copper)] font-semibold hover:text-teal-800"
            >
              View All ({reminders.length}) &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {reminders.slice(0, 4).map((rem) => (
              <div
                key={rem.id}
                className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                  rem.severity === 'high'
                    ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                    : rem.severity === 'medium'
                    ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="mt-0.5">
                  {rem.severity === 'high' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{rem.title}</div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {rem.description}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('reminders')}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-[10px] font-medium text-slate-700 hover:bg-slate-50 shrink-0 shadow-2xs"
                >
                  Action
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

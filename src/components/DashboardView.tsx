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
    <div className="space-y-6">
      {/* Welcome to Shakti Travels & Tours: Production Clean State Banner */}
      {vehicles.length === 0 && tenders.length === 0 && (
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-700/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Shakti Travels and Tours &bull; फ्रेश वर्किंग सत्र सक्रिय
                </span>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/60">
                  Ready for Production
                </span>
              </div>
              <h3 className="text-xl font-black text-white">
                पुराना डेमो डेटा हटा दिया गया है - अब अपनी कंपनी का वास्तविक डेटा दर्ज करें!
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                सॉफ्टवेयर अब पूरी तरह खाली और फ्रेश है। आप सीधे अपने सरकारी टेंडर अनुबंध, गाड़ियां, ड्राइवर, दैनिक लॉग बुक व कंपनी दस्तावेज जोड़ना शुरू कर सकते हैं।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab('tenders')}
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                + Add Tender (टेंडर)
              </button>
              <button
                onClick={() => setActiveTab('vehicles_officers')}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                + मालिक-चालक (Driver+Car)
              </button>
              <button
                onClick={() => setActiveTab('attached_vendors')}
                className="px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Car className="w-4 h-4" />
                + केवल गाड़ी मालिक
              </button>
              <button
                onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('combined') : setActiveTab('vehicles_officers'))}
                className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                title="एक्सेल शीट डाउनलोड करें या भरी हुई शीट अपलोड करें"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                📥 एक्सेल बल्क अपलोड
              </button>
              <button
                onClick={() => setActiveTab('company_documents')}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                + कंपनी दस्तावेज़
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Shakti Travels & Tours: Company Documents & Expiries Radar Banner */}
      {(expiredCompanyDocs.length > 0 || expiringSoonCompanyDocs.length > 0) && (
        <div className="bg-linear-to-r from-purple-900 to-indigo-950 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-purple-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-amber-500 text-slate-900 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm text-amber-300 uppercase tracking-wide">
                    Shakti Travels and Tours &bull; कंपनी दस्तावेज़ एक्सपायरी अलर्ट (Document Expiry Radar)
                  </span>
                  <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                    {expiredCompanyDocs.length + expiringSoonCompanyDocs.length} Documents
                  </span>
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  कंपनी के {expiredCompanyDocs.length > 0 ? `${expiredCompanyDocs.length} दस्तावेज़ की वैधता समाप्त हो चुकी है` : ''} 
                  {expiredCompanyDocs.length > 0 && expiringSoonCompanyDocs.length > 0 ? ' और ' : ''}
                  {expiringSoonCompanyDocs.length > 0 ? `${expiringSoonCompanyDocs.length} दस्तावेज़ जल्द एक्सपायर होने वाले हैं` : ''}।
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('company_documents')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black shadow-xs shrink-0 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              दस्तावेज़ व एक्सपायरी देखें &rarr;
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {[...expiredCompanyDocs, ...expiringSoonCompanyDocs].slice(0, 3).map((d) => {
              const diff = getDaysDiff(d.expiryDate!);
              const isPast = diff < 0;
              return (
                <div
                  key={d.id}
                  onClick={() => setActiveTab('company_documents')}
                  className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-2.5 rounded-lg border border-white/10 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-white block truncate">{d.title}</span>
                    <span className="text-[10px] text-purple-200 block">{d.docNumber || 'No No.'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${isPast ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-950'}`}>
                    {isPast ? `Expired (${Math.abs(diff)}d ago)` : `In ${diff} days`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fleet Vehicles Document Expiry Radar Banner (PUC, Insurance, Fitness - 1 Month Alert) */}
      {vehiclesWithExpiryAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-amber-500/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shrink-0 mt-0.5">
                <Car className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm text-amber-300 uppercase tracking-wide">
                    हमारी गाड़ियाँ &bull; PUC, बीमा व फिटनेस एक्सपायरी रडार (1-Month Alert)
                  </span>
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full">
                    {vehiclesWithExpiryAlerts.length} गाड़ियाँ अलर्ट पर
                  </span>
                </div>
                <p className="text-xs text-amber-100/90 mt-1">
                  कुल {vehiclesWithExpiryAlerts.length} गाड़ियों के <strong>PUC, इंश्योरेंस या RTO फिटनेस 30 दिन (1 माह) के अंदर एक्सपायर</strong> हो रहे हैं या हो चुके हैं। कमर्शियल व प्राइवेट नंबर प्लेट व चालू ड्राइवर देखें।
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('our_vehicles')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black shadow-xs shrink-0 flex items-center gap-1.5 transition-colors"
            >
              <Car className="w-4 h-4 text-slate-950" />
              हमारी गाड़ियाँ व एक्सपायरी देखें &rarr;
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

      {/* Top Banner Alert if any High-severity overdue bills or compliance */}
      {highSeverityReminders.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-rose-900 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <span>Urgent Attention Required ({highSeverityReminders.length} items)</span>
              <span className="text-xs font-normal bg-rose-200 text-rose-800 px-2 py-0.5 rounded">
                Action Required
              </span>
            </h4>
            <div className="mt-1 text-xs text-rose-800 space-y-1">
              {highSeverityReminders.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span>
                    • <strong>{item.title}</strong>: {item.description}
                  </span>
                  <button
                    onClick={() => setActiveTab('reminders')}
                    className="ml-2 underline font-medium hover:text-rose-950 whitespace-nowrap"
                  >
                    View Alert &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Office Boy / Field Cashier Personalized Banner */}
      {currentUser?.role === 'office_boy_cashier' && (
        <div className="bg-linear-to-r from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                  ऑफिस बॉय व फील्ड सहायक काउंटर (Field Runner Desk)
                </span>
                <h3 className="text-lg font-bold mt-0.5">
                  नमस्ते, {currentUser.name}! आपके हाथ में वर्तमान रोकड़ (Cash in Hand)
                </h3>
                <p className="text-xs text-amber-100">
                  गाड़ियों में डलवाया गया ईंधन, पंचर, सर्विसिंग, मोबिल आयल या कोई एक्सेसरीज का खर्च तुरंत यहां दर्ज करें।
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-white/10 backdrop-blur-xs px-4 py-2 rounded-lg text-center border border-white/20">
                <div className="text-[10px] text-amber-100 font-medium">हाथ में नकद बैलेंस</div>
                <div className="text-2xl font-bold font-mono">
                  {formatCurrency(currentBoyBalance)}
                </div>
              </div>
              <button
                onClick={() => setActiveTab('petty_cash')}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Wallet className="w-4 h-4 text-amber-400" />
                पेटी कैश में खर्च दर्ज करें &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Tenders &amp; Depts
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{tenders.length}</span>
            <span className="text-xs text-emerald-600 font-medium">100% Operational</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            NHAI, PWD, Income Tax Dept monthly fixed contracts
          </p>
        </div>

        <div
          onClick={() => setActiveTab('our_vehicles')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-amber-600 transition-colors">
              हमारी गाड़ियाँ (Our Fleet)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Car className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{vehicles.length}</span>
            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {vehiclesWithExpiryAlerts.length > 0 ? `⚠️ ${vehiclesWithExpiryAlerts.length} Expiring` : '✅ All Valid'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>PUC, बीमा, फिटनेस व ड्राइवर</span>
            <span className="text-indigo-600 font-bold text-[11px] group-hover:underline">देखें &rarr;</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Govt Bills
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700">
              {formatCurrency(pendingAmount)}
            </span>
            {overdueAmount > 0 && (
              <span className="text-xs text-rose-600 font-semibold">
                {formatCurrency(overdueAmount)} Overdue
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {pendingBills.length} invoices under clearance at Treasury / PIU
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Month Run (Sep)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-900">{currentMonthKm.toLocaleString()} KM</span>
            <span className="text-xs text-indigo-600 font-medium">{currentMonthLogs.length} Duty Slips</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Daily logs certified &amp; tracked against tender quotas
          </p>
        </div>

        {/* Petty Cash Float & Balance Card */}
        <div
          onClick={() => setActiveTab('petty_cash')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Petty Cash &bull; पेटी कैश
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${totalPettyCashInHand >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(totalPettyCashInHand)}
            </span>
            {pendingVerificationReceipts > 0 ? (
              <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                {pendingVerificationReceipts} नई पर्चियां
              </span>
            ) : (
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                संतुलित ✓
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            लड़कों के हाथ में नकद व दैनिक फुटकर खर्चे (डीजल, सर्विसिंग, पार्ट्स)
          </p>
        </div>
      </div>

      {/* Bulk Excel Import & Template Download Station */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-emerald-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                बल्क एक्सेल आयात &bull; Excel Fast-Track
              </span>
              <span className="text-xs text-slate-300">
                अधिकारी, गाड़ियाँ व ड्राइवर एक्सेल शीट से अपलोड करें
              </span>
            </div>
            <h3 className="text-lg font-black text-white">
              सरकारी अधिकारी, ड्राइवर और गाड़ियों की एक्सेल शीट (Excel Template Download &amp; Auto-Add)
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              एक-एक करके जोड़ने की आवश्यकता नहीं है! नीचे से अधिकारी, ड्राइवर या गाड़ी की एक्सेल शीट डाउनलोड करें, विवरण दर्ज करें और अपलोड करते ही सब कुछ सिस्टम में स्वतः सेव व लिंक हो जाएगा।
            </p>
          </div>

          <button
            onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('combined') : setActiveTab('vehicles_officers'))}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[3]" />
            <span>📤 भरी हुई एक्सेल शीट अपलोड करें (Upload &amp; Add)</span>
          </button>
        </div>

        {/* 4 Template Download Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* Officer Template */}
          <div className="bg-white/5 hover:bg-white/10 border border-amber-500/30 rounded-xl p-4 transition-colors space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white">1. अधिकारी शीट (Officers)</h4>
                <p className="text-[11px] text-slate-300 truncate">नाम, पदनाम, विभाग, मोबाइल</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              सरकारी अधिकारियों का पदनाम, विभाग, कमरा, संबद्ध टेंडर व गाड़ी नंबर।
            </p>
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={downloadOfficerExcelTemplate}
                className="w-full px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span>डाउनलोड अधिकारी एक्सेल (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('officers') : setActiveTab('vehicles_officers'))}
                className="w-full px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-white/15"
              >
                <Upload className="w-3 h-3 text-amber-300" />
                <span>📤 अधिकारी शीट अपलोड करें</span>
              </button>
            </div>
          </div>

          {/* Vehicle Template */}
          <div className="bg-white/5 hover:bg-white/10 border border-emerald-500/30 rounded-xl p-4 transition-colors space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white">2. गाड़ी एक्सेल शीट (Vehicles)</h4>
                <p className="text-[11px] text-slate-300 truncate">नंबर, मॉडल, ईंधन, रेंट व फिटनेस</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              कंपनी की गाड़ियां, अटैच गाड़ियां व मालिक-चालक वाहन विवरण शीट।
            </p>
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={downloadVehicleExcelTemplate}
                className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>डाउनलोड गाड़ी एक्सेल (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('vehicles') : setActiveTab('vehicles_officers'))}
                className="w-full px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-white/15"
              >
                <Upload className="w-3 h-3 text-emerald-300" />
                <span>📤 गाड़ी शीट अपलोड करें</span>
              </button>
            </div>
          </div>

          {/* Driver Template */}
          <div className="bg-white/5 hover:bg-white/10 border border-indigo-500/30 rounded-xl p-4 transition-colors space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white">3. ड्राइवर एक्सेल शीट (Drivers)</h4>
                <p className="text-[11px] text-slate-300 truncate">नाम, फ़ोन, डीएल, वेतन व बैंक</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              कंपनी चालक, ठेका चालक या मालिक-चालक का विवरण भरने हेतु मानक एक्सेल।
            </p>
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={downloadDriverExcelTemplate}
                className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>डाउनलोड ड्राइवर एक्सेल (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('drivers') : setActiveTab('drivers_khata'))}
                className="w-full px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-white/15"
              >
                <Upload className="w-3 h-3 text-indigo-300" />
                <span>📤 ड्राइवर शीट अपलोड करें</span>
              </button>
            </div>
          </div>

          {/* Combined 3-in-1 Template */}
          <div className="bg-purple-950/30 hover:bg-purple-950/50 border border-purple-500/30 rounded-xl p-4 transition-colors space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-purple-200">4. संयुक्त वर्कबुक (3-in-1)</h4>
                <p className="text-[11px] text-purple-300/80 truncate">अधिकारी + गाड़ी + ड्राइवर</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              एक ही एक्सेल वर्कबुक में अधिकारी, गाड़ियां व ड्राइवर भरकर एक क्लिक में जोड़ें।
            </p>
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={downloadCombinedFleetExcelTemplate}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>डाउनलोड 3-in-1 .xlsx</span>
              </button>
              <button
                type="button"
                onClick={() => (onOpenBulkImportModal ? onOpenBulkImportModal('combined') : setActiveTab('vehicles_officers'))}
                className="w-full px-2 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition-colors shadow-xs"
              >
                <Upload className="w-3 h-3 text-slate-950" />
                <span>📤 संयुक्त शीट अपलोड करें</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operations Bar */}
      <div className="bg-linear-to-r from-slate-900 to-indigo-950 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <span>Quick Actions &bull; त्वरित संचालन</span>
              <span className="text-[11px] font-normal bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/30">
                Daily Operations
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              तुरंत नई लॉग बुक एंट्री करें, टेंडर बिल जनरेट करें या ड्राइवर एडवांस दर्ज करें
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('fleet_dispatch')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Car className="w-4 h-4 text-emerald-200" />
              फ्लीट डिस्पैच प्रो (3-पार्टी ड्यूटी)
            </button>
            <button
              onClick={() => setActiveTab('fuel')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Fuel className="w-4 h-4 text-slate-900" />
              + ईंधन पर्ची जारी करें (Fuel Slip)
            </button>
            <button
              onClick={() => setActiveTab('company_documents')}
              className="px-3.5 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileText className="w-4 h-4 text-cyan-200" />
              + कंपनी दस्तावेज़ व एक्सपायरी (Docs)
            </button>
            <button
              onClick={() => setActiveTab('petty_cash')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Wallet className="w-4 h-4 text-emerald-200" />
              + पेटी कैश खर्च / रोकड़ (Petty Cash)
            </button>
            <button
              onClick={onOpenPaymentModal ? onOpenPaymentModal : () => setActiveTab('daily_payments')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              + Post Daily Payment (दैनिक भुगतान)
            </button>
            <button
              onClick={() => setActiveTab('attached_vendors')}
              className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Handshake className="w-4 h-4" />
              Attached Fleet Hub (मार्केट गाड़ियां)
            </button>
            <button
              onClick={onOpenNewLogModal}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              + Add Duty Slip
            </button>
            <button
              onClick={onOpenNewBillModal}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Receipt className="w-4 h-4" />
              + Calculate Govt Bill
            </button>
            <button
              onClick={onOpenAdvanceModal}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <IndianRupee className="w-4 h-4" />
              + Driver Advance
            </button>
          </div>
        </div>
      </div>

      {/* Active Fleet & Officer Deployment Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live Fleet &amp; Officer Deployment Matrix
            </h3>
            <p className="text-xs text-slate-500">
              कहाँ कौन सी गाड़ी, किस अधिकारी के साथ और कौन सा ड्राइवर चल रहा है
            </p>
          </div>
          <button
            onClick={() => setActiveTab('vehicles_officers')}
            className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1"
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
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Car className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-xs">No vehicles deployed yet &bull; कोई गाड़ी दर्ज नहीं है</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click &ldquo;Manage Fleet &amp; Change Driver&rdquo; to add your fleet vehicles.</p>
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
                      <div className="text-[11px] text-slate-500">
                        {v.makeModel} &bull; <span className="font-medium text-slate-600">{v.fuelType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {off ? (
                        <div>
                          <div className="font-semibold text-slate-900">{off.name}</div>
                          <div className="text-[11px] text-slate-500">{off.designation}</div>
                          <div className="text-[10px] text-indigo-600">{off.mobile}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned / Pool</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{tender?.departmentName || '-'}</div>
                      <div className="text-[11px] text-slate-500">{tender?.tenderNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      {drv ? (
                        <div>
                          <div className="font-semibold text-slate-900">{drv.name}</div>
                          <div className="text-[11px] text-slate-500">{drv.phone}</div>
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
                          <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold">
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
                          <div className="text-[10px] text-slate-500 mt-0.5">Reimbursed as per bill</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{totalKm} KM</div>
                      <div className="text-[10px] text-slate-500">
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
          <span className="text-slate-500">
            Showing top 8 of <strong>{vehicles.length}</strong> deployed vehicles across <strong>{tenders.length}</strong> government tenders
          </span>
          <button
            onClick={() => setActiveTab('vehicles_officers')}
            className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1"
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
              <p className="text-xs text-slate-500">
                विभागों को प्रस्तुत किए गए बिल और भुगतान की स्थिति
              </p>
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
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
                  <p className="text-[11px] text-slate-500">
                    Month: {b.monthYear} &bull; Due: {formatDate(b.dueDate)} &bull; Run: {b.totalKmsRun} KM (Extra: {b.extraKms} KM)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-slate-900 block">
                    {formatCurrency(b.netPayableAmount)}
                  </span>
                  <span className="text-[10px] text-slate-500">
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
              <p className="text-xs text-slate-500">
                बिल फॉलो-अप, फिटनेस, इंश्योरेंस व ड्राइवर पुलिस वेरिफिकेशन अलर्ट्स
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reminders')}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
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

import React, { useState, useMemo } from 'react';
import {
  Car,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Users,
  Phone,
  ExternalLink,
  FileText,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Download,
  AlertCircle,
  Calendar,
  Send,
  Edit2,
  Check,
  Copy,
  Fuel,
  Sparkles,
  Building2,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft,
  FileSpreadsheet,
} from 'lucide-react';
import { Vehicle, Driver, Tender, Officer, DocumentAttachment, Vendor } from '../types';
import { formatDate, getDaysDiff, formatCurrency, getAssignedDriverForVehicle } from '../utils/calculations';
import { DocumentManagerModal } from './DocumentManagerModal';
import { BulkImportModal } from './BulkImportModal';

interface OurVehiclesFleetViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  tenders: Tender[];
  officers: Officer[];
  vendors?: Vendor[];
  onSaveVehicle: (vehicle: Vehicle) => void;
  onBulkImportVehicles?: (vehicles: Vehicle[], vendors?: Vendor[]) => void;
  onBulkImportDrivers?: (drivers: Driver[]) => void;
  onReplaceDriver: (
    vehicleId: string,
    newDriverId: string,
    reason: any,
    effectiveDate: string,
    notes: string
  ) => void;
}

export const OurVehiclesFleetView: React.FC<OurVehiclesFleetViewProps> = ({
  vehicles,
  drivers,
  tenders,
  officers,
  vendors = [],
  onSaveVehicle,
  onBulkImportVehicles = () => {},
  onBulkImportDrivers = () => {},
  onReplaceDriver,
}) => {
  // State for search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpiry, setFilterExpiry] = useState<'all' | 'expiring_30' | 'expired' | 'valid'>('all');
  const [filterDocType, setFilterDocType] = useState<'all' | 'puc' | 'insurance' | 'fitness'>('all');
  const [filterRegType, setFilterRegType] = useState<'all' | 'Commercial' | 'Private'>('all');
  const [filterOwnership, setFilterOwnership] = useState<string>('all');
  const [filterDriverStatus, setFilterDriverStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [vehicleToRenew, setVehicleToRenew] = useState<{ vehicle: Vehicle; docType: 'puc' | 'insurance' | 'fitness' | 'permit' | 'road_tax' } | null>(null);
  const [renewDate, setRenewDate] = useState('');
  const [renewDocNumber, setRenewDocNumber] = useState('');
  const [renewCompany, setRenewCompany] = useState('');

  // WhatsApp Alert Modal
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedVehicleForAlert, setSelectedVehicleForAlert] = useState<Vehicle | null>(null);
  const [copiedAlertText, setCopiedAlertText] = useState(false);

  // Driver Assignment Modal
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [vehicleForDriverAssign, setVehicleForDriverAssign] = useState<Vehicle | null>(null);
  const [selectedNewDriverId, setSelectedNewDriverId] = useState('');
  const [assignEffectiveDate, setAssignEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  // Document Manager Modal (for attachments)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedVehicleForDocs, setSelectedVehicleForDocs] = useState<Vehicle | null>(null);

  // Helper to determine expiry status of a given date (with 30 days = 1 month window)
  const getExpiryDetails = (dateStr?: string) => {
    if (!dateStr) return { status: 'none', label: 'Not Set', days: null, badgeColor: 'bg-slate-100 text-slate-500' };
    const days = getDaysDiff(dateStr);
    if (days < 0) {
      return {
        status: 'expired',
        label: `Expired ${Math.abs(days)}d ago`,
        days,
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        textColor: 'text-rose-600',
        is1MonthAlert: true,
      };
    }
    if (days <= 30) {
      return {
        status: 'expiring_soon',
        label: `${days}d left (1-Month Alert!)`,
        days,
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        textColor: 'text-amber-600',
        is1MonthAlert: true,
      };
    }
    return {
      status: 'valid',
      label: `${days}d left`,
      days,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      textColor: 'text-emerald-600',
      is1MonthAlert: false,
    };
  };

  // Helper to check if vehicle has any document in 1-month alert or expired
  const checkVehicleAlerts = (v: Vehicle) => {
    const puc = getExpiryDetails(v.pucExpiry);
    const ins = getExpiryDetails(v.insuranceExpiry);
    const fit = getExpiryDetails(v.rtoFitnessExpiry);
    const permit = getExpiryDetails(v.permitExpiry);
    const tax = getExpiryDetails(v.roadTaxExpiry);

    const hasExpired = puc.status === 'expired' || ins.status === 'expired' || fit.status === 'expired' || permit.status === 'expired' || tax.status === 'expired';
    const hasExpiringIn30 = puc.status === 'expiring_soon' || ins.status === 'expiring_soon' || fit.status === 'expiring_soon' || permit.status === 'expiring_soon' || tax.status === 'expiring_soon';
    const hasAnyAlert = hasExpired || hasExpiringIn30;

    return {
      puc,
      ins,
      fit,
      permit,
      tax,
      hasExpired,
      hasExpiringIn30,
      hasAnyAlert,
    };
  };

  // Map of drivers for quick lookup
  const driverMap = useMemo(() => {
    const map = new Map<string, Driver>();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers]);

  // Map of tenders and officers
  const tenderMap = useMemo(() => {
    const map = new Map<string, Tender>();
    tenders.forEach((t) => map.set(t.id, t));
    return map;
  }, [tenders]);

  const officerMap = useMemo(() => {
    const map = new Map<string, Officer>();
    officers.forEach((o) => map.set(o.id, o));
    return map;
  }, [officers]);

  // Overall Statistics
  const stats = useMemo(() => {
    let total = vehicles.length;
    let commercial = 0;
    let privateFleet = 0;
    let expiredDocs = 0;
    let expiring30Days = 0;
    let driversAssigned = 0;

    vehicles.forEach((v) => {
      const reg = v.registrationType || 'Commercial';
      if (reg === 'Private') privateFleet++;
      else commercial++;

      if (v.currentDriverId) driversAssigned++;

      const alerts = checkVehicleAlerts(v);
      if (alerts.hasExpired) expiredDocs++;
      else if (alerts.hasExpiringIn30) expiring30Days++;
    });

    return {
      total,
      commercial,
      privateFleet,
      expiredDocs,
      expiring30Days,
      driversAssigned,
      unassignedDrivers: total - driversAssigned,
    };
  }, [vehicles]);

  // Vehicles with critical 1-month or expired alerts for top banner
  const urgentAlertVehicles = useMemo(() => {
    return vehicles
      .filter((v) => {
        const a = checkVehicleAlerts(v);
        return a.hasAnyAlert;
      })
      .slice(0, 10);
  }, [vehicles]);

  // Filtered vehicles list
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const driver = v.currentDriverId ? driverMap.get(v.currentDriverId) : null;
        const tender = tenderMap.get(v.tenderId);
        const officer = v.assignedOfficerId ? officerMap.get(v.assignedOfficerId) : null;

        const matchNum = v.vehicleNumber.toLowerCase().includes(q);
        const matchModel = v.makeModel.toLowerCase().includes(q);
        const matchDriver = driver ? driver.name.toLowerCase().includes(q) || driver.phone.includes(q) : false;
        const matchTender = tender ? tender.departmentName.toLowerCase().includes(q) : false;
        const matchOfficer = officer ? officer.name.toLowerCase().includes(q) : false;

        if (!matchNum && !matchModel && !matchDriver && !matchTender && !matchOfficer) {
          return false;
        }
      }

      // 2. Registration Type Filter (Commercial vs Private)
      const reg = v.registrationType || 'Commercial';
      if (filterRegType !== 'all' && reg !== filterRegType) {
        return false;
      }

      // 3. Ownership Filter
      if (filterOwnership !== 'all' && v.ownershipType !== filterOwnership) {
        return false;
      }

      // 4. Driver Status Filter
      if (filterDriverStatus === 'assigned' && !v.currentDriverId) return false;
      if (filterDriverStatus === 'unassigned' && v.currentDriverId) return false;

      // 5. Expiry Status & Specific Doc Filter
      const alerts = checkVehicleAlerts(v);

      if (filterDocType === 'all') {
        if (filterExpiry === 'expiring_30' && !alerts.hasExpiringIn30) return false;
        if (filterExpiry === 'expired' && !alerts.hasExpired) return false;
        if (filterExpiry === 'valid' && alerts.hasAnyAlert) return false;
      } else {
        // Specific document filter: PUC, Insurance, Fitness
        let targetDocDetails = alerts.puc;
        if (filterDocType === 'insurance') targetDocDetails = alerts.ins;
        if (filterDocType === 'fitness') targetDocDetails = alerts.fit;

        if (filterExpiry === 'expiring_30' && targetDocDetails.status !== 'expiring_soon') return false;
        if (filterExpiry === 'expired' && targetDocDetails.status !== 'expired') return false;
        if (filterExpiry === 'valid' && (targetDocDetails.status === 'expired' || targetDocDetails.status === 'expiring_soon')) return false;
      }

      return true;
    });
  }, [vehicles, searchQuery, filterExpiry, filterDocType, filterRegType, filterOwnership, filterDriverStatus, driverMap, tenderMap, officerMap]);

  // Handlers for Add/Edit
  const handleOpenAddVehicle = () => {
    setEditingVehicle({
      id: `veh-${Date.now()}`,
      vehicleNumber: '',
      makeModel: '',
      vehicleType: 'Sedan',
      fuelType: 'Diesel',
      color: 'White',
      modelYear: 2024,
      ownershipType: 'Company Owned',
      registrationType: 'Commercial',
      tenderId: tenders[0]?.id || '',
      currentOdometer: 10000,
      rtoFitnessExpiry: '',
      insuranceExpiry: '',
      insuranceCompany: 'United India Insurance Co.',
      insurancePolicyNo: '',
      pucExpiry: '',
      roadTaxExpiry: '',
      permitExpiry: '',
      status: 'active',
      fuelPolicy: 'monthly_fixed_budget',
      monthlyFixedFuelAmount: 12000,
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditVehicle = (veh: Vehicle) => {
    setEditingVehicle({
      ...veh,
      registrationType: veh.registrationType || 'Commercial',
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveVehicleForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    if (!editingVehicle.vehicleNumber.trim()) {
      alert('Please enter vehicle registration number (e.g. UP32 AB 1234)');
      return;
    }
    onSaveVehicle(editingVehicle);
    setIsAddEditModalOpen(false);
    setEditingVehicle(null);
  };

  // Quick Document Renewal Handler
  const handleOpenRenewModal = (vehicle: Vehicle, docType: 'puc' | 'insurance' | 'fitness' | 'permit' | 'road_tax') => {
    setVehicleToRenew({ vehicle, docType });
    // suggest date: 6 months for PUC, 1 year for others
    const today = new Date();
    if (docType === 'puc') {
      today.setMonth(today.getMonth() + 6);
    } else {
      today.setFullYear(today.getFullYear() + 1);
    }
    setRenewDate(today.toISOString().split('T')[0]);
    setRenewDocNumber('');
    setRenewCompany(vehicle.insuranceCompany || 'National Insurance Co.');
    setIsRenewModalOpen(true);
  };

  const handleSaveRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleToRenew || !renewDate) return;

    const { vehicle, docType } = vehicleToRenew;
    const updated: Vehicle = { ...vehicle };

    if (docType === 'puc') {
      updated.pucExpiry = renewDate;
    } else if (docType === 'insurance') {
      updated.insuranceExpiry = renewDate;
      if (renewCompany) updated.insuranceCompany = renewCompany;
      if (renewDocNumber) updated.insurancePolicyNo = renewDocNumber;
    } else if (docType === 'fitness') {
      updated.rtoFitnessExpiry = renewDate;
      if (renewDocNumber) updated.fitnessCertNumber = renewDocNumber;
    } else if (docType === 'permit') {
      updated.permitExpiry = renewDate;
      if (renewDocNumber) updated.permitNumber = renewDocNumber;
    } else if (docType === 'road_tax') {
      updated.roadTaxExpiry = renewDate;
      if (renewDocNumber) updated.taxReceiptNumber = renewDocNumber;
    }

    onSaveVehicle(updated);
    setIsRenewModalOpen(false);
    setVehicleToRenew(null);
  };

  // WhatsApp Alert Generator
  const handleOpenWhatsAppAlert = (vehicle: Vehicle) => {
    setSelectedVehicleForAlert(vehicle);
    setCopiedAlertText(false);
    setIsWhatsAppModalOpen(true);
  };

  const generateWhatsAppMessage = (v: Vehicle) => {
    const driver = v.currentDriverId ? driverMap.get(v.currentDriverId) : null;
    const driverName = driver ? driver.name : 'ड्राइवर भाई';
    const alerts = checkVehicleAlerts(v);
    const regLabel = (v.registrationType || 'Commercial') === 'Commercial' ? 'कमर्शियल (पीली नंबर प्लेट)' : 'प्राइवेट (सफ़ेद नंबर प्लेट)';

    let docList = [];
    if (alerts.puc.status === 'expired' || alerts.puc.status === 'expiring_soon') {
      docList.push(`• *PUC (प्रदूषण जांच)*: ${alerts.puc.status === 'expired' ? '🚨 एक्सपायर हो गया!' : '⚠️ 1 माह में एक्सपायरी'} (तारीख: ${formatDate(v.pucExpiry)} - ${alerts.puc.label})`);
    }
    if (alerts.ins.status === 'expired' || alerts.ins.status === 'expiring_soon') {
      docList.push(`• *गाड़ी बीमा (Insurance)*: ${alerts.ins.status === 'expired' ? '🚨 एक्सपायर हो गया!' : '⚠️ 1 माह में एक्सपायरी'} (तारीख: ${formatDate(v.insuranceExpiry)} - ${alerts.ins.label})`);
    }
    if (alerts.fit.status === 'expired' || alerts.fit.status === 'expiring_soon') {
      docList.push(`• *RTO फिटनेस (Fitness)*: ${alerts.fit.status === 'expired' ? '🚨 एक्सपायर हो गया!' : '⚠️ 1 माह में एक्सपायरी'} (तारीख: ${formatDate(v.rtoFitnessExpiry)} - ${alerts.fit.label})`);
    }

    if (docList.length === 0) {
      docList.push(`• PUC: ${formatDate(v.pucExpiry)} (${alerts.puc.label})\n• बीमा: ${formatDate(v.insuranceExpiry)} (${alerts.ins.label})\n• फिटनेस: ${formatDate(v.rtoFitnessExpiry)} (${alerts.fit.label})`);
    }

    return `*SHAKTI TRAVELS & TOURS (शक्ति ट्रैवल्स)*
⚠️ *वाहन दस्तावेज़ एक्सपायरी सूचना (1-Month Advance Notice)*

नमस्ते *${driverName}*,
आपकी गाड़ी का विवरण निम्न प्रकार है:
🚗 *गाड़ी नंबर:* ${v.vehicleNumber} (${v.makeModel})
📑 *प्रकार:* ${regLabel}

*दस्तावेज़ स्थिति:*
${docList.join('\n')}

कृपया तुरंत नजदीकी अधिकृत सेंटर या ट्रांसपोर्ट ऑफिस से संपर्क कर दस्तावेज़ रिन्यू कराएं ताकि सरकारी ड्यूटी में चालान अथवा गाड़ी सीज होने का जोखिम न रहे।

सहायता हेतु संपर्क: शक्ति ट्रैवल्स फ्लीट कंट्रोल रूम (9839000000)`;
  };

  const handleCopyAlertText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAlertText(true);
    setTimeout(() => setCopiedAlertText(false), 2500);
  };

  // Driver Assignment Handlers
  const handleOpenAssignDriverModal = (veh: Vehicle) => {
    setVehicleForDriverAssign(veh);
    setSelectedNewDriverId(veh.currentDriverId || '');
    setAssignEffectiveDate(new Date().toISOString().split('T')[0]);
    setIsAssignDriverModalOpen(true);
  };

  const handleSaveDriverAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForDriverAssign) return;

    if (selectedNewDriverId) {
      onReplaceDriver(
        vehicleForDriverAssign.id,
        selectedNewDriverId,
        'routine_rescheduling',
        assignEffectiveDate,
        'Assigned via Our Vehicles Fleet Management'
      );
    } else {
      // Unassign driver
      const updated = { ...vehicleForDriverAssign, currentDriverId: undefined };
      onSaveVehicle(updated);
    }
    setIsAssignDriverModalOpen(false);
    setVehicleForDriverAssign(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Actions */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 border border-amber-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Fleet &amp; Document Expiry Tracker &bull; 1-Month Advance Alerts
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Car className="w-8 h-8 text-amber-400" />
              <span>हमारी गाड़ियाँ व दस्तावेज़ एक्सपायरी ट्रैकर</span>
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              गाड़ियों की संपूर्ण सूची, कमर्शियल (पीली प्लेट) व प्राइवेट (सफ़ेद प्लेट) विभाजन, चालू ड्राइवर का नाम व फ़ोन नंबर, 
              तथा <strong className="text-amber-300 font-bold">PUC, बीमा (Insurance), और RTO फिटनेस</strong> एक्सपायर होने से 
              <strong className="text-amber-300 font-bold underline ml-1">1 महीना पहले स्वचालित अलर्ट</strong>।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-md transition-all text-xs active:scale-95 border border-emerald-500/40"
              title="एक्सेल शीट डाउनलोड करें या भरी हुई शीट अपलोड करके गाड़ियां व ड्राइवर जोड़ें"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>📥 एक्सेल बल्क अपलोड (Excel Import)</span>
            </button>

            <button
              onClick={handleOpenAddVehicle}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/25 transition-all text-sm active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>नई गाड़ी जोड़ें (Add Vehicle)</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-400 font-medium">कुल गाड़ियाँ</div>
            <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total Fleet</div>
          </div>

          <div className="bg-amber-950/40 p-3.5 rounded-xl border border-amber-500/30">
            <div className="text-xs text-amber-300 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>1 माह में एक्सपायरी</span>
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.expiring30Days}</div>
            <div className="text-[11px] text-amber-200/80 mt-0.5">&le; 30 Days Due Alert</div>
          </div>

          <div className="bg-rose-950/40 p-3.5 rounded-xl border border-rose-500/30">
            <div className="text-xs text-rose-300 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>एक्सपायर दस्तावेज़</span>
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">{stats.expiredDocs}</div>
            <div className="text-[11px] text-rose-200/80 mt-0.5">Expired (&lt; 0 Days)</div>
          </div>

          <div className="bg-yellow-950/30 p-3.5 rounded-xl border border-yellow-500/30">
            <div className="text-xs text-yellow-300 font-semibold flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block"></span>
              <span>कमर्शियल (पीली प्लेट)</span>
            </div>
            <div className="text-2xl font-black text-yellow-300 mt-1">{stats.commercial}</div>
            <div className="text-[11px] text-yellow-200/80 mt-0.5">Commercial Taxis</div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-300 font-semibold flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-white border border-slate-400 inline-block"></span>
              <span>प्राइवेट (सफ़ेद प्लेट)</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">{stats.privateFleet}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Private Vehicles</div>
          </div>

          <div className="bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/30">
            <div className="text-xs text-indigo-300 font-semibold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>ड्राइवर अलॉटेड</span>
            </div>
            <div className="text-2xl font-black text-indigo-300 mt-1">{stats.driversAssigned}</div>
            <div className="text-[11px] text-indigo-200/80 mt-0.5">{stats.unassignedDrivers} Standby/Empty</div>
          </div>
        </div>
      </div>

      {/* 1-Month Early Warning Notification Banner */}
      {(stats.expiring30Days > 0 || stats.expiredDocs > 0) && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-400/50 rounded-2xl p-5 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    ⚠️ 1 महीने पहले का एक्सपायरी अलर्ट (Document Expiry Warning)
                  </h3>
                  <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-xs font-black rounded-full">
                    {stats.expiring30Days + stats.expiredDocs} गाड़ियाँ प्रभावित
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  निम्न गाड़ियों का <strong>PUC, इंश्योरेंस या RTO फिटनेस 30 दिन (1 माह) के अंदर एक्सपायर</strong> हो रहा है या हो चुका है। 
                  तत्काल रिन्यू कराएं या ड्राइवर को व्हाट्सएप चेतावनी भेजें ताकि सरकारी चालान व ज़ब्ती से बचा जा सके।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setFilterExpiry('expiring_30');
                  setFilterDocType('all');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>अलर्ट वाली गाड़ियाँ देखें ({stats.expiring30Days + stats.expiredDocs})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick alert vehicle pills */}
          <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-amber-200/60">
            {urgentAlertVehicles.map((v) => {
              const alerts = checkVehicleAlerts(v);
              const driver = v.currentDriverId ? driverMap.get(v.currentDriverId) : null;
              return (
                <div
                  key={`urg-${v.id}`}
                  className="bg-white/90 border border-amber-300 rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-xs shadow-2xs hover:border-amber-500 transition-colors"
                >
                  <span className="font-mono font-black text-slate-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                    {v.vehicleNumber}
                  </span>
                  <span className="text-slate-600 font-medium truncate max-w-[130px]">
                    {driver ? `👨‍✈️ ${driver.name}` : '❌ कोई ड्राइवर नहीं'}
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    {alerts.puc.is1MonthAlert && (
                      <span className={`px-1.5 py-0.5 rounded font-bold ${alerts.puc.status === 'expired' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
                        PUC: {alerts.puc.label}
                      </span>
                    )}
                    {alerts.ins.is1MonthAlert && (
                      <span className={`px-1.5 py-0.5 rounded font-bold ${alerts.ins.status === 'expired' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
                        बीमा: {alerts.ins.label}
                      </span>
                    )}
                    {alerts.fit.is1MonthAlert && (
                      <span className={`px-1.5 py-0.5 rounded font-bold ${alerts.fit.status === 'expired' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
                        फिटनेस: {alerts.fit.label}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenWhatsAppAlert(v)}
                    title="Send WhatsApp Alert to Driver"
                    className="p-1 rounded hover:bg-emerald-100 text-emerald-700 transition-colors ml-1"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="गाड़ी नंबर (e.g. UP32 AB 1234), मॉडल, ड्राइवर का नाम, मोबाइल नंबर, या टेंडर विभाग खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1 bg-slate-100 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cards View (विस्तृत कार्ड)
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Table View (तालिका)
              </button>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setFilterExpiry('all');
                setFilterDocType('all');
                setFilterRegType('all');
                setFilterOwnership('all');
                setFilterDriverStatus('all');
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Badges Row 1: Expiry Alert Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>एक्सपायरी स्थिति:</span>
          </span>

          <button
            onClick={() => setFilterExpiry('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filterExpiry === 'all'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            सभी गाड़ियाँ ({vehicles.length})
          </button>

          <button
            onClick={() => setFilterExpiry('expiring_30')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ${
              filterExpiry === 'expiring_30'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>⚠️ 1 माह में एक्सपायर होने वाले ({stats.expiring30Days})</span>
          </button>

          <button
            onClick={() => setFilterExpiry('expired')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ${
              filterExpiry === 'expired'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>🚨 एक्सपायर हो चुके ({stats.expiredDocs})</span>
          </button>

          <button
            onClick={() => setFilterExpiry('valid')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ${
              filterExpiry === 'valid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✅ सभी मान्य (All Valid)</span>
          </button>
        </div>

        {/* Filter Badges Row 2: Registration Type (Commercial vs Private) & Docs */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Registration Plate Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">नंबर प्लेट / रजिस्ट्रेशन:</span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={() => setFilterRegType('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterRegType === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterRegType('Commercial')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  filterRegType === 'Commercial' ? 'bg-amber-300 text-slate-950 font-black shadow-2xs' : 'text-slate-700'
                }`}
              >
                <span className="w-2.5 h-2 rounded-xs bg-amber-400 border border-slate-900"></span>
                <span>कमर्शियल (पीली प्लेट)</span>
              </button>
              <button
                onClick={() => setFilterRegType('Private')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  filterRegType === 'Private' ? 'bg-white text-slate-950 font-black shadow-2xs border border-slate-300' : 'text-slate-700'
                }`}
              >
                <span className="w-2.5 h-2 rounded-xs bg-white border border-slate-400"></span>
                <span>प्राइवेट (सफ़ेद प्लेट)</span>
              </button>
            </div>
          </div>

          {/* Specific Document Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">विशिष्ट दस्तावेज़:</span>
            <select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">सभी दस्तावेज़ (PUC, बीमा, फिटनेस)</option>
              <option value="puc">केवल PUC (प्रदूषण)</option>
              <option value="insurance">केवल इंश्योरेंस (बीमा)</option>
              <option value="fitness">केवल RTO फिटनेस</option>
            </select>
          </div>

          {/* Driver Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">ड्राइवर:</span>
            <select
              value={filterDriverStatus}
              onChange={(e) => setFilterDriverStatus(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">सभी (अलॉटेड व खाली)</option>
              <option value="assigned">ड्राइवर अलॉटेड (Assigned)</option>
              <option value="unassigned">बिना ड्राइवर (No Driver / Standby)</option>
            </select>
          </div>

          {/* Ownership Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">स्वामित्व:</span>
            <select
              value={filterOwnership}
              onChange={(e) => setFilterOwnership(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Ownership Types</option>
              <option value="Company Owned">Company Owned (कंपनी की)</option>
              <option value="Attached / Market Hire">Attached / Vendor Fleet</option>
              <option value="Owner-Driver">Owner-Driver (मालिक-ड्राइवर)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          कुल <strong className="text-slate-900 font-bold">{filteredVehicles.length}</strong> गाड़ियाँ प्रदर्शित
          {searchQuery && ` ("${searchQuery}" के लिए)`}
          {filterRegType !== 'all' && ` • ${filterRegType === 'Commercial' ? 'पीली प्लेट (कमर्शियल)' : 'सफ़ेद प्लेट (प्राइवेट)'}`}
          {filterExpiry === 'expiring_30' && ' • 1 माह में एक्सपायर होने वाले'}
          {filterExpiry === 'expired' && ' • एक्सपायर हो चुके'}
        </div>
        <div className="text-[11px] text-slate-400">
          * 30 दिन (&le; 30d) के भीतर एक्सपायर होने पर 1-माह पूर्व चेतावनी दिखाई जाती है
        </div>
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">कोई गाड़ी नहीं मिली</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            आपके चुने गए फिल्टर या खोज शब्दों के अनुसार कोई गाड़ी उपलब्ध नहीं है। फिल्टर रीसेट करें या नई गाड़ी जोड़ें।
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterExpiry('all');
                setFilterDocType('all');
                setFilterRegType('all');
                setFilterOwnership('all');
                setFilterDriverStatus('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
            >
              सभी फिल्टर हटाएं (Reset Filters)
            </button>
            <button
              onClick={handleOpenAddVehicle}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-colors"
            >
              नई गाड़ी जोड़ें
            </button>
          </div>
        </div>
      )}

      {/* CARD VIEW */}
      {viewMode === 'cards' && filteredVehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((v) => {
            const driver =
              (v.currentDriverId ? driverMap.get(v.currentDriverId) : null) ||
              getAssignedDriverForVehicle(v, drivers, officers);
            const tender = tenderMap.get(v.tenderId);
            const officer = v.assignedOfficerId ? officerMap.get(v.assignedOfficerId) : null;
            const alerts = checkVehicleAlerts(v);
            const isCommercial = (v.registrationType || 'Commercial') === 'Commercial';

            return (
              <div
                key={v.id}
                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden ${
                  alerts.hasExpired
                    ? 'border-rose-300 ring-2 ring-rose-200'
                    : alerts.hasExpiringIn30
                    ? 'border-amber-300 ring-2 ring-amber-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Card Top: Number Plate & Registration Badge */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3">
                    {/* Realistic Indian Number Plate Display */}
                    <div className="flex flex-col">
                      <div
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg border-2 shadow-xs font-mono font-black tracking-wider text-base ${
                          isCommercial
                            ? 'bg-amber-300 text-slate-950 border-amber-400'
                            : 'bg-white text-slate-950 border-slate-400'
                        }`}
                      >
                        <span className="text-[10px] mr-1.5 font-bold px-1 rounded bg-black/10 text-slate-800">
                          IND
                        </span>
                        <span>{v.vehicleNumber}</span>
                      </div>
                      
                      {/* Sub-label under plate */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide ${
                            isCommercial
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-200 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {isCommercial ? '🟨 Commercial' : '⬜ Private'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                          👨‍✈️ चालक: {driver?.name || v.driverName || 'अनावंटित'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {v.ownershipType}
                        </span>
                      </div>
                    </div>

                    {/* Quick Edit and Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenWhatsAppAlert(v)}
                        title="Send WhatsApp 1-Month Expiry Alert to Driver"
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditVehicle(v)}
                        title="Edit Vehicle"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Make Model & Fuel */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-slate-500" />
                      <span>{v.makeModel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold">
                        {v.vehicleType}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-amber-600" />
                        <span>{v.fuelType}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body: Driver Section ("KISME KAUN DRIVER ABHI CHALA RAHA HAI") */}
                <div className="p-4 bg-white border-b border-slate-100">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>चालू ड्राइवर (Current Driver)</span>
                    </span>
                    <button
                      onClick={() => handleOpenAssignDriverModal(v)}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold lowercase flex items-center gap-0.5"
                    >
                      <span>{driver ? 'बदलें (Change)' : 'अलॉट करें (Assign)'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {driver ? (
                    <div className="flex items-center justify-between bg-indigo-50/60 rounded-xl p-2.5 border border-indigo-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{driver.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <a href={`tel:${driver.phone}`} className="hover:text-indigo-600 font-mono">
                              {driver.phone}
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenWhatsAppAlert(v)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
                          title="WhatsApp Expiry Reminder to Driver"
                        >
                          <Send className="w-3 h-3" />
                          <span>व्हाट्सएप</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 text-center">
                      <div className="text-xs font-bold text-amber-900">
                        ⚠️ कोई ड्राइवर अलॉट नहीं है (Standby)
                      </div>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        यह गाड़ी बिना ड्राइवर के खड़ी है।
                      </p>
                      <button
                        onClick={() => handleOpenAssignDriverModal(v)}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>ड्राइवर अलॉट करें</span>
                      </button>
                    </div>
                  )}

                  {/* Assigned Officer / Tender Info */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5">
                    <span className="truncate max-w-[170px]" title={tender?.departmentName}>
                      🏛️ {tender ? tender.departmentName.split('(')[0] : 'No Tender'}
                    </span>
                    <span className="truncate max-w-[120px] font-medium text-slate-700" title={officer?.name}>
                      👤 {officer ? officer.name : 'No Officer'}
                    </span>
                  </div>
                </div>

                {/* Card Body: Compliance & Expiry Watch Grid (PUC, Insurance, Fitness) */}
                <div className="p-4 bg-slate-50/40 space-y-2.5">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>दस्तावेज़ एक्सपायरी (PUC, बीमा व फिटनेस)</span>
                    </span>
                    <span className="text-[10px] text-amber-600 font-semibold">
                      1-Month Alert Mode
                    </span>
                  </div>

                  {/* 1. PUC Pollution Certificate */}
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        alerts.puc.status === 'expired' ? 'bg-rose-100 text-rose-700' : alerts.puc.status === 'expiring_soon' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        PUC
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>प्रदूषण (PUC)</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-black border ${alerts.puc.badgeColor}`}>
                            {alerts.puc.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Exp: <span className="font-semibold text-slate-700">{formatDate(v.pucExpiry)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenRenewModal(v, 'puc')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      रिन्यू करें
                    </button>
                  </div>

                  {/* 2. Commercial / Private Insurance */}
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        alerts.ins.status === 'expired' ? 'bg-rose-100 text-rose-700' : alerts.ins.status === 'expiring_soon' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        INS
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>बीमा (Insurance)</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-black border ${alerts.ins.badgeColor}`}>
                            {alerts.ins.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[160px]" title={v.insuranceCompany}>
                          {v.insuranceCompany || 'Policy'}: <span className="font-semibold text-slate-700">{formatDate(v.insuranceExpiry)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenRenewModal(v, 'insurance')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      रिन्यू करें
                    </button>
                  </div>

                  {/* 3. RTO Commercial Fitness */}
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        alerts.fit.status === 'expired' ? 'bg-rose-100 text-rose-700' : alerts.fit.status === 'expiring_soon' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        FIT
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>फिटनेस (Fitness)</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-black border ${alerts.fit.badgeColor}`}>
                            {alerts.fit.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Exp: <span className="font-semibold text-slate-700">{formatDate(v.rtoFitnessExpiry)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenRenewModal(v, 'fitness')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      रिन्यू करें
                    </button>
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedVehicleForDocs(v);
                      setIsDocModalOpen(true);
                    }}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>दस्तावेज़ कॉपी ({v.documents?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsAppAlert(v)}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>व्हाट्सएप अलर्ट</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && filteredVehicles.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">गाड़ी नंबर व मॉडल</th>
                  <th className="py-3.5 px-4">रजिस्ट्रेशन प्रकार</th>
                  <th className="py-3.5 px-4">चालू ड्राइवर (Current Driver)</th>
                  <th className="py-3.5 px-4">PUC एक्सपायरी</th>
                  <th className="py-3.5 px-4">इंश्योरेंस (बीमा)</th>
                  <th className="py-3.5 px-4">RTO फिटनेस</th>
                  <th className="py-3.5 px-4">विभाग / टेंडर</th>
                  <th className="py-3.5 px-4 text-right">कार्रवाई (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredVehicles.map((v) => {
                  const driver = v.currentDriverId ? driverMap.get(v.currentDriverId) : null;
                  const tender = tenderMap.get(v.tenderId);
                  const alerts = checkVehicleAlerts(v);
                  const isCommercial = (v.registrationType || 'Commercial') === 'Commercial';

                  return (
                    <tr
                      key={`tbl-${v.id}`}
                      className={`hover:bg-slate-50 transition-colors ${
                        alerts.hasExpired ? 'bg-rose-50/30' : alerts.hasExpiringIn30 ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Vehicle Number & Plate */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`font-mono font-black px-2 py-0.5 rounded border text-xs ${
                              isCommercial
                                ? 'bg-amber-300 text-slate-950 border-amber-400'
                                : 'bg-white text-slate-950 border-slate-400'
                            }`}
                          >
                            {v.vehicleNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">{v.makeModel}</span>
                        </div>
                      </td>

                      {/* Registration Type: Commercial vs Private */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isCommercial
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {isCommercial ? '🟨 Commercial (पीली)' : '⬜ Private (सफ़ेद)'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{v.ownershipType}</div>
                      </td>

                      {/* Assigned Driver */}
                      <td className="py-3 px-4">
                        {driver ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <span>{driver.name}</span>
                              <a
                                href={`tel:${driver.phone}`}
                                title={`Call ${driver.phone}`}
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{driver.phone}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAssignDriverModal(v)}
                            className="text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded font-bold text-[11px]"
                          >
                            + ड्राइवर अलॉट करें
                          </button>
                        )}
                      </td>

                      {/* PUC Expiry */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{formatDate(v.pucExpiry)}</span>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-black border w-max ${alerts.puc.badgeColor}`}>
                            {alerts.puc.label}
                          </span>
                        </div>
                      </td>

                      {/* Insurance Expiry */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{formatDate(v.insuranceExpiry)}</span>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-black border w-max ${alerts.ins.badgeColor}`}>
                            {alerts.ins.label}
                          </span>
                        </div>
                      </td>

                      {/* Fitness Expiry */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{formatDate(v.rtoFitnessExpiry)}</span>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-black border w-max ${alerts.fit.badgeColor}`}>
                            {alerts.fit.label}
                          </span>
                        </div>
                      </td>

                      {/* Tender Dept */}
                      <td className="py-3 px-4 text-slate-600 max-w-[160px] truncate" title={tender?.departmentName}>
                        {tender ? tender.departmentName : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenWhatsAppAlert(v)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="WhatsApp 1-Month Alert to Driver"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenRenewModal(v, 'puc')}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                            title="Renew Document"
                          >
                            रिन्यू
                          </button>
                          <button
                            onClick={() => handleOpenEditVehicle(v)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="Edit Vehicle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT VEHICLE ================= */}
      {isAddEditModalOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-600" />
                <span>{editingVehicle.vehicleNumber ? 'गाड़ी विवरण संशोधित करें (Edit Vehicle)' : 'नई गाड़ी जोड़ें (Add New Vehicle)'}</span>
              </h2>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicleForm} className="space-y-4 mt-4">
              {/* Row 1: Vehicle Number & Registration Type (Commercial vs Private) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    गाड़ी रजिस्ट्रेशन नंबर (Vehicle No.) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UP32 AB 1234"
                    value={editingVehicle.vehicleNumber}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, vehicleNumber: e.target.value.toUpperCase() })
                    }
                    className="w-full uppercase font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    रजिस्ट्रेशन प्रकार (Commercial / Private) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingVehicle({ ...editingVehicle, registrationType: 'Commercial' })}
                      className={`py-2 px-3 rounded-lg border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                        (editingVehicle.registrationType || 'Commercial') === 'Commercial'
                          ? 'bg-amber-300 border-amber-500 text-slate-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-3 h-2 bg-amber-400 border border-slate-900 rounded-xs"></span>
                      <span>कमर्शियल (पीली)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingVehicle({ ...editingVehicle, registrationType: 'Private' })}
                      className={`py-2 px-3 rounded-lg border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                        editingVehicle.registrationType === 'Private'
                          ? 'bg-white border-slate-600 text-slate-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-3 h-2 bg-white border border-slate-500 rounded-xs"></span>
                      <span>प्राइवेट (सफ़ेद)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Make & Model, Vehicle Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    गाड़ी का नाम व मॉडल (Make &amp; Model) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maruti Swift Dzire ZXi / Innova Crysta"
                    value={editingVehicle.makeModel}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, makeModel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बॉडी टाइप</label>
                  <select
                    value={editingVehicle.vehicleType}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicleType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Sedan">Sedan (Dzire, Amaze)</option>
                    <option value="SUV">SUV (Scorpio, Bolero)</option>
                    <option value="MUV">MUV (Innova, Ertiga)</option>
                    <option value="Hatchback">Hatchback (WagonR)</option>
                    <option value="EV">EV (Tiago/Nexon EV)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Fuel Type & Current Odometer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ईंधन (Fuel)</label>
                  <select
                    value={editingVehicle.fuelType}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, fuelType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">स्वामित्व (Ownership)</label>
                  <select
                    value={editingVehicle.ownershipType}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, ownershipType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Company Owned">Company Owned (कंपनी की)</option>
                    <option value="Attached / Market Hire">Attached / Market Hire (वेंडर)</option>
                    <option value="Owner-Driver">Owner-Driver (मालिक-ड्राइवर)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ओडोमीटर (KM)</label>
                  <input
                    type="number"
                    value={editingVehicle.currentOdometer}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, currentOdometer: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Driver & Tender Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    चालू ड्राइवर (Assigned Driver)
                  </label>
                  <select
                    value={editingVehicle.currentDriverId || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, currentDriverId: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- कोई ड्राइवर नहीं (Standby Pool) --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone}) {d.currentVehicleId === editingVehicle.id ? '★ वर्तमान' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    संलग्न टेंडर / विभाग (Tender)
                  </label>
                  <select
                    value={editingVehicle.tenderId}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, tenderId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {tenders.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.departmentName} ({t.workOrderNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document Expiry Dates Section (PUC, Insurance, Fitness) */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
                <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>दस्तावेज़ एक्सपायरी तिथियां (1-Month Auto Alert Active)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      PUC एक्सपायरी (प्रदूषण)
                    </label>
                    <input
                      type="date"
                      value={editingVehicle.pucExpiry || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, pucExpiry: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      इंश्योरेंस एक्सपायरी (बीमा)
                    </label>
                    <input
                      type="date"
                      value={editingVehicle.insuranceExpiry || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, insuranceExpiry: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      RTO फिटनेस एक्सपायरी
                    </label>
                    <input
                      type="date"
                      value={editingVehicle.rtoFitnessExpiry || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, rtoFitnessExpiry: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      बीमा कंपनी (Insurance Co.)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. United India / ICICI Lombard"
                      value={editingVehicle.insuranceCompany || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, insuranceCompany: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      बीमा पॉलिसी नंबर (Policy No.)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0823003126P100234"
                      value={editingVehicle.insurancePolicyNo || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, insurancePolicyNo: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  सुरक्षित करें (Save Vehicle)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: QUICK DOCUMENT RENEWAL ================= */}
      {isRenewModalOpen && vehicleToRenew && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
                <span>दस्तावेज़ रिन्यू करें (Quick Renewal)</span>
              </h3>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRenewal} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">
                  गाड़ी: <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">{vehicleToRenew.vehicle.vehicleNumber}</span>
                </div>
                <div className="text-slate-600 mt-1">
                  दस्तावेज़:{' '}
                  <strong className="text-indigo-600 uppercase">
                    {vehicleToRenew.docType === 'puc'
                      ? 'PUC (प्रदूषण प्रमाणपत्र)'
                      : vehicleToRenew.docType === 'insurance'
                      ? 'वाहन बीमा (Insurance)'
                      : 'RTO फिटनेस (Fitness)'}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  नई एक्सपायरी तिथि (New Expiry Date) *
                </label>
                <input
                  type="date"
                  required
                  value={renewDate}
                  onChange={(e) => setRenewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                />
                {/* Date presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500">त्वरित जोड़ें:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 6);
                      setRenewDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium"
                  >
                    +6 माह (PUC)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 1);
                      setRenewDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium"
                  >
                    +1 वर्ष (बीमा/फिटनेस)
                  </button>
                </div>
              </div>

              {vehicleToRenew.docType === 'insurance' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    बीमा कंपनी का नाम
                  </label>
                  <input
                    type="text"
                    value={renewCompany}
                    onChange={(e) => setRenewCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  नया रसीद / पॉलिसी / सर्टिफिकेट नंबर (वैकल्पिक)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CERT-2026-99120"
                  value={renewDocNumber}
                  onChange={(e) => setRenewDocNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  रिन्यूवल अपडेट करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: WHATSAPP 1-MONTH ALERT DISPATCHER ================= */}
      {isWhatsAppModalOpen && selectedVehicleForAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <span>ड्राइवर को व्हाट्सएप अलर्ट भेजें (1-Month Expiry Notice)</span>
              </h3>
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Recipient Driver Details */}
              {selectedVehicleForAlert.currentDriverId ? (
                (() => {
                  const driver = driverMap.get(selectedVehicleForAlert.currentDriverId!);
                  return (
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>चालक: {driver?.name}</span>
                          <span className="text-[10px] font-normal text-emerald-700 font-mono">
                            ({driver?.phone})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          गाड़ी: <strong className="font-mono">{selectedVehicleForAlert.vehicleNumber}</strong> ({selectedVehicleForAlert.makeModel})
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                        WhatsApp Ready
                      </span>
                    </div>
                  );
                })()
              ) : (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                  ⚠️ इस गाड़ी पर कोई ड्राइवर अलॉट नहीं है। आप किसी अन्य नंबर पर संदेश भेज सकते हैं।
                </div>
              )}

              {/* Message Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  व्हाट्सएप संदेश पूर्वावलोकन (Message Preview)
                </label>
                <textarea
                  readOnly
                  rows={8}
                  value={generateWhatsAppMessage(selectedVehicleForAlert)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyAlertText(generateWhatsAppMessage(selectedVehicleForAlert))}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  {copiedAlertText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">कॉपी हो गया!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>टेक्स्ट कॉपी करें</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://wa.me/${(() => {
                    const d = selectedVehicleForAlert.currentDriverId ? driverMap.get(selectedVehicleForAlert.currentDriverId) : null;
                    const ph = d ? d.phone.replace(/[^0-9]/g, '') : '';
                    return ph.length === 10 ? `91${ph}` : ph;
                  })()}?text=${encodeURIComponent(generateWhatsAppMessage(selectedVehicleForAlert))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>व्हाट्सएप पर भेजें (Open WhatsApp)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ASSIGN / CHANGE DRIVER ================= */}
      {isAssignDriverModalOpen && vehicleForDriverAssign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>ड्राइवर अलॉटमेंट (Assign Driver)</span>
              </h3>
              <button
                onClick={() => setIsAssignDriverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriverAssignment} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">
                  गाड़ी: <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">{vehicleForDriverAssign.vehicleNumber}</span> ({vehicleForDriverAssign.makeModel})
                </div>
                <div className="text-slate-600 mt-1">
                  वर्तमान चालक:{' '}
                  <strong>
                    {vehicleForDriverAssign.currentDriverId
                      ? driverMap.get(vehicleForDriverAssign.currentDriverId)?.name || 'N/A'
                      : 'कोई नहीं (Unassigned)'}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  नया ड्राइवर चुनें (Select Driver) *
                </label>
                <select
                  value={selectedNewDriverId}
                  onChange={(e) => setSelectedNewDriverId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">-- कोई नहीं (ड्राइवर हटाएं / Standby) --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} &bull; {d.phone} {d.currentVehicleId ? `(वर्तमान: ${d.currentVehicleId})` : '(खाली / Available)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  प्रभावी तिथि (Effective Date)
                </label>
                <input
                  type="date"
                  required
                  value={assignEffectiveDate}
                  onChange={(e) => setAssignEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAssignDriverModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  अलॉटमेंट सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Manager Modal (for scanned RC, Insurance, PUC copy uploads) */}
      {isDocModalOpen && selectedVehicleForDocs && (
        <DocumentManagerModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          entityType="vehicle"
          entity={selectedVehicleForDocs}
          onUpdateEntity={(updated) => {
            onSaveVehicle(updated);
            setSelectedVehicleForDocs(updated);
          }}
        />
      )}

      {/* Bulk Excel Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        initialType="vehicles"
        existingVehicles={vehicles}
        existingDrivers={drivers}
        tenders={tenders}
        vendors={vendors}
        onImportVehicles={onBulkImportVehicles}
        onImportDrivers={onBulkImportDrivers}
      />
    </div>
  );
};

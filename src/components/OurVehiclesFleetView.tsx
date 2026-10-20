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
import { FleetVehicleEditModal } from './FleetVehicleEditModal';

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
    if (!dateStr) return { status: 'none', label: 'Not Set', days: null, badgeColor: 'bg-slate-100 text-[var(--color-muted)]' };
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

  const handleCloseVehicleForm = () => {
    setIsAddEditModalOpen(false);
    setEditingVehicle(null);
  };

  const handleSaveVehicleForm = (vehicle: Vehicle) => {
    onSaveVehicle(vehicle);
    handleCloseVehicleForm();
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
      <div className="panel panel-pad">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="page-kicker">
                <ShieldCheck className="h-3.5 w-3.5" />
                Fleet &amp; Document Expiry Tracker • 1-Month Advance Alerts
              </span>
            </div>
            <h1 className="flex flex-wrap items-center gap-3 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-ink)] text-teal-300">
                <Car className="h-5 w-5" />
              </span>
              <span>हमारी गाड़ियाँ व दस्तावेज़ एक्सपायरी ट्रैकर</span>
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--color-muted)]">
              गाड़ियों की संपूर्ण सूची, कमर्शियल (पीली प्लेट) व प्राइवेट (सफ़ेद प्लेट) विभाजन, चालू ड्राइवर का नाम व फ़ोन नंबर,
              तथा <strong className="font-bold text-teal-800">PUC, बीमा (Insurance), और RTO फिटनेस</strong> एक्सपायर होने से
              <strong className="ml-1 font-bold text-teal-800 underline">1 महीना पहले स्वचालित अलर्ट</strong>।
            </p>
          </div>

          <div className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setIsBulkImportOpen(true)}
              className="btn btn-success shrink-0 whitespace-nowrap !text-xs"
              title="एक्सेल शीट डाउनलोड करें या भरी हुई शीट अपलोड करके गाड़ियां व ड्राइवर जोड़ें"
            >
              <FileSpreadsheet className="h-4 w-4" />
              एक्सेल बल्क अपलोड (Excel Import)
            </button>

            <button
              type="button"
              onClick={handleOpenAddVehicle}
              className="btn btn-primary shrink-0 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              नई गाड़ी जोड़ें (Add Vehicle)
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--color-line)] pt-6 sm:grid-cols-3 lg:grid-cols-6">
          <div className="metric-chip">
            <span className="metric-chip-label">कुल गाड़ियाँ</span>
            <span className="metric-chip-value">{stats.total}</span>
            <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">Total Fleet</span>
          </div>

          <div className="metric-chip border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)]">
            <span className="metric-chip-label inline-flex items-center gap-1 text-[var(--color-warning)]">
              <Clock className="h-3.5 w-3.5" />
              1 माह में एक्सपायरी
            </span>
            <span className="metric-chip-value text-[var(--color-warning)]">{stats.expiring30Days}</span>
            <span className="mt-0.5 block text-[10px] text-[var(--color-warning)]">&le; 30 Days Due Alert</span>
          </div>

          <div className="metric-chip border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)]">
            <span className="metric-chip-label inline-flex items-center gap-1 text-[var(--color-danger)]">
              <AlertTriangle className="h-3.5 w-3.5" />
              एक्सपायर दस्तावेज़
            </span>
            <span className="metric-chip-value text-[var(--color-danger)]">{stats.expiredDocs}</span>
            <span className="mt-0.5 block text-[10px] text-[var(--color-danger)]">Expired (&lt; 0 Days)</span>
          </div>

          <div className="metric-chip">
            <span className="metric-chip-label inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />
              कमर्शियल (पीली प्लेट)
            </span>
            <span className="metric-chip-value">{stats.commercial}</span>
            <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">Commercial Taxis</span>
          </div>

          <div className="metric-chip">
            <span className="metric-chip-label inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border border-[var(--color-line-strong)] bg-white" />
              प्राइवेट (सफ़ेद प्लेट)
            </span>
            <span className="metric-chip-value">{stats.privateFleet}</span>
            <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">Private Vehicles</span>
          </div>

          <div className="metric-chip">
            <span className="metric-chip-label inline-flex items-center gap-1 text-teal-800">
              <UserCheck className="h-3.5 w-3.5" />
              ड्राइवर अलॉटेड
            </span>
            <span className="metric-chip-value text-teal-800">{stats.driversAssigned}</span>
            <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">{stats.unassignedDrivers} Standby/Empty</span>
          </div>
        </div>
      </div>

      {/* 1-Month Early Warning Notification Banner */}
      {(stats.expiring30Days > 0 || stats.expiredDocs > 0) && (
        <div className="panel overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-[var(--color-ink)] via-[var(--color-copper)] to-amber-400" />
          <div className="flex flex-col justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-surface)] p-5 md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-ink)] text-teal-300 shadow-sm ring-2 ring-teal-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">
                    1 महीने पहले का एक्सपायरी अलर्ट (Document Expiry Warning)
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800">
                    <ShieldAlert className="h-3 w-3" />
                    {stats.expiring30Days + stats.expiredDocs} गाड़ियाँ प्रभावित
                  </span>
                  {stats.expiredDocs > 0 && (
                    <span className="badge badge-danger !text-[10px]">{stats.expiredDocs} expired</span>
                  )}
                </div>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[var(--color-muted)]">
                  निम्न गाड़ियों का{' '}
                  <strong className="text-[var(--color-ink)]">
                    PUC, इंश्योरेंस या RTO फिटनेस 30 दिन (1 माह) के अंदर एक्सपायर
                  </strong>{' '}
                  हो रहा है या हो चुका है। तत्काल रिन्यू कराएं या ड्राइवर को व्हाट्सएप चेतावनी भेजें ताकि सरकारी चालान व ज़ब्ती से बचा जा सके।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFilterExpiry('expiring_30');
                setFilterDocType('all');
              }}
              className="btn btn-primary shrink-0 !text-xs"
            >
              अलर्ट वाली गाड़ियाँ देखें ({stats.expiring30Days + stats.expiredDocs})
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 bg-[var(--color-sand)]/40 p-4 sm:p-5">
            {urgentAlertVehicles.map((v) => {
              const alerts = checkVehicleAlerts(v);
              const driver = v.currentDriverId ? driverMap.get(v.currentDriverId) : null;
              return (
                <div
                  key={`urg-${v.id}`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-2 text-xs shadow-[0_1px_2px_rgba(11,28,44,0.03)] transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                >
                  <span className="rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[var(--color-ink)]">
                    {v.vehicleNumber}
                  </span>
                  <span className="max-w-[130px] truncate font-medium text-[var(--color-muted)]">
                    {driver ? driver.name : 'कोई ड्राइवर नहीं'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1 text-[11px]">
                    {alerts.puc.is1MonthAlert && (
                      <span className={alerts.puc.status === 'expired' ? 'badge badge-danger' : 'badge badge-warning'}>
                        PUC: {alerts.puc.label}
                      </span>
                    )}
                    {alerts.ins.is1MonthAlert && (
                      <span className={alerts.ins.status === 'expired' ? 'badge badge-danger' : 'badge badge-warning'}>
                        बीमा: {alerts.ins.label}
                      </span>
                    )}
                    {alerts.fit.is1MonthAlert && (
                      <span className={alerts.fit.status === 'expired' ? 'badge badge-danger' : 'badge badge-warning'}>
                        फिटनेस: {alerts.fit.label}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppAlert(v)}
                    title="Send WhatsApp Alert to Driver"
                    className="ml-0.5 rounded-lg p-1.5 text-[var(--color-copper)] transition-colors hover:bg-teal-50"
                  >
                    <Send className="h-3.5 w-3.5" />
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
            <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="गाड़ी नंबर (e.g. UP32 AB 1234), मॉडल, ड्राइवर का नाम, मोबाइल नंबर, या टेंडर विभाग खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] py-2.5 pl-10 pr-4 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-slate-600 p-1"
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
              className="p-2 text-[var(--color-muted)] hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Badges Row 1: Expiry Alert Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-muted)]" />
            <span>एक्सपायरी स्थिति:</span>
          </span>

          <button
            onClick={() => setFilterExpiry('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filterExpiry === 'all'
                ? 'bg-[var(--color-ink)] text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            सभी गाड़ियाँ ({vehicles.length})
          </button>

          <button
            onClick={() => setFilterExpiry('expiring_30')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 ${
              filterExpiry === 'expiring_30'
                ? 'bg-[var(--color-copper)] text-white shadow-xs'
                : 'bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200'
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
                  filterRegType === 'Commercial' ? 'bg-teal-600 text-white font-black shadow-2xs' : 'text-slate-700'
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
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
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
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
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
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
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
      <div className="flex flex-col gap-1 px-1 text-xs text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          कुल <strong className="font-bold text-[var(--color-ink)]">{filteredVehicles.length}</strong> गाड़ियाँ प्रदर्शित
          {searchQuery && ` ("${searchQuery}" के लिए)`}
          {filterRegType !== 'all' && ` • ${filterRegType === 'Commercial' ? 'पीली प्लेट (कमर्शियल)' : 'सफ़ेद प्लेट (प्राइवेट)'}`}
          {filterExpiry === 'expiring_30' && ' • 1 माह में एक्सपायर होने वाले'}
          {filterExpiry === 'expired' && ' • एक्सपायर हो चुके'}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[var(--color-warning)]">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>30 दिन (≤ 30d) के भीतर एक्सपायर होने पर 1-माह पूर्व चेतावनी दिखाई जाती है</span>
        </div>
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Car className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">कोई गाड़ी नहीं मिली</h3>
          <p className="text-xs text-[var(--color-muted)] mt-1 max-w-md mx-auto">
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
              className="btn btn-success !text-xs"
            >
              नई गाड़ी जोड़ें
            </button>
          </div>
        </div>
      )}

      {/* CARD VIEW */}
      {viewMode === 'cards' && filteredVehicles.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((v) => {
            const driver =
              (v.currentDriverId ? driverMap.get(v.currentDriverId) : null) ||
              getAssignedDriverForVehicle(v, drivers, officers);
            const tender = tenderMap.get(v.tenderId);
            const officer = v.assignedOfficerId ? officerMap.get(v.assignedOfficerId) : null;
            const alerts = checkVehicleAlerts(v);
            const isCommercial = (v.registrationType || 'Commercial') === 'Commercial';

            const docRows: Array<{
              key: 'puc' | 'insurance' | 'fitness';
              code: string;
              title: string;
              expiry: string;
              meta?: string;
              alert: typeof alerts.puc;
            }> = [
              { key: 'puc', code: 'PUC', title: 'प्रदूषण (PUC)', expiry: v.pucExpiry, alert: alerts.puc },
              {
                key: 'insurance',
                code: 'INS',
                title: 'बीमा (Insurance)',
                expiry: v.insuranceExpiry,
                meta: v.insuranceCompany || 'Policy',
                alert: alerts.ins,
              },
              { key: 'fitness', code: 'FIT', title: 'फिटनेस (Fitness)', expiry: v.rtoFitnessExpiry, alert: alerts.fit },
            ];

            return (
              <article
                key={v.id}
                className={`panel group relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(11,28,44,0.08)] ${
                  alerts.hasExpired
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : alerts.hasExpiringIn30
                      ? 'border-amber-300 ring-2 ring-amber-100'
                      : ''
                }`}
              >
                <div
                  className={`h-1 w-full ${
                    alerts.hasExpired
                      ? 'bg-rose-500'
                      : alerts.hasExpiringIn30
                        ? 'bg-[var(--color-warning)]'
                        : 'bg-gradient-to-r from-[var(--color-ink)] via-[var(--color-copper)] to-teal-400'
                  }`}
                />

                {/* Header: plate + meta */}
                <div className="border-b border-[var(--color-line)] bg-[var(--color-surface-muted)]/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div
                        className={`inline-flex max-w-full items-center rounded-lg border-2 px-3 py-1.5 font-mono text-base font-black tracking-wider shadow-sm ${
                          isCommercial
                            ? 'border-[#c9a227] bg-[#f5d76e] text-[var(--color-ink)]'
                            : 'border-[var(--color-line-strong)] bg-white text-[var(--color-ink)]'
                        }`}
                      >
                        <span
                          className={`mr-1.5 rounded px-1 text-[10px] font-bold ${
                            isCommercial ? 'bg-black/10 text-[var(--color-ink)]' : 'bg-[var(--color-ink)] text-white'
                          }`}
                        >
                          IND
                        </span>
                        <span className="truncate">{v.vehicleNumber}</span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                            isCommercial
                              ? 'border border-amber-300 bg-amber-50 text-amber-900'
                              : 'border border-[var(--color-line)] bg-white text-[var(--color-ink)]'
                          }`}
                        >
                          {isCommercial ? 'Commercial' : 'Private'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                          <UserCheck className="h-3 w-3" />
                          चालक: {driver?.name || v.driverName || 'अनावंटित'}
                        </span>
                        <span className="text-[10px] font-medium text-[var(--color-muted)]">{v.ownershipType}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppAlert(v)}
                        title="Send WhatsApp 1-Month Expiry Alert to Driver"
                        className="rounded-lg p-1.5 text-[var(--color-copper)] transition-colors hover:bg-teal-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditVehicle(v)}
                        title="Edit Vehicle"
                        className="rounded-lg p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-sand)] hover:text-[var(--color-ink)]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-1.5 font-bold text-[var(--color-ink)]">
                      <Car className="h-3.5 w-3.5 shrink-0 text-[var(--color-copper)]" />
                      <span className="truncate">{v.makeModel}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-md bg-[var(--color-sand)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-ink)]">
                        {v.vehicleType}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-teal-800">
                        <Fuel className="h-3 w-3" />
                        {v.fuelType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Driver */}
                <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                      <UserCheck className="h-3.5 w-3.5 text-[var(--color-copper)]" />
                      चालू ड्राइवर (Current Driver)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAssignDriverModal(v)}
                      className="inline-flex items-center gap-0.5 font-semibold normal-case tracking-normal text-[var(--color-copper)] hover:underline"
                    >
                      {driver ? 'बदलें (Change)' : 'अलॉट करें (Assign)'}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>

                  {driver ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm font-black text-white shadow-sm ring-2 ring-teal-100">
                          {driver.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[var(--color-ink)]">
                            <span className="truncate">{driver.name}</span>
                            <span className="badge badge-success !px-1.5 !py-0 !text-[10px]">Active</span>
                          </div>
                          <a
                            href={`tel:${driver.phone}`}
                            className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-[var(--color-muted)] hover:text-[var(--color-copper)]"
                          >
                            <Phone className="h-3 w-3" />
                            {driver.phone}
                          </a>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppAlert(v)}
                        className="btn btn-accent !px-2.5 !py-1.5 !text-[11px] shrink-0"
                        title="WhatsApp Expiry Reminder to Driver"
                      >
                        <Send className="h-3 w-3" />
                        व्हाट्सएप
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-[var(--color-warning-soft)] p-3 text-center">
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-900">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        कोई ड्राइवर अलॉट नहीं है (Standby)
                      </div>
                      <p className="mt-0.5 text-[11px] text-amber-800">यह गाड़ी बिना ड्राइवर के खड़ी है।</p>
                      <button
                        type="button"
                        onClick={() => handleOpenAssignDriverModal(v)}
                        className="btn btn-secondary mt-2 !text-xs"
                      >
                        <UserCheck className="h-3 w-3" />
                        ड्राइवर अलॉट करें
                      </button>
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2.5 py-2 text-[11px] text-[var(--color-muted)]">
                    <span className="inline-flex min-w-0 max-w-[55%] items-center gap-1 truncate" title={tender?.departmentName}>
                      <Building2 className="h-3 w-3 shrink-0 text-[var(--color-copper)]" />
                      <span className="truncate">{tender ? tender.departmentName.split('(')[0] : 'No Tender'}</span>
                    </span>
                    <span className="inline-flex min-w-0 max-w-[40%] items-center gap-1 truncate font-medium text-[var(--color-ink)]" title={officer?.name}>
                      <Users className="h-3 w-3 shrink-0 text-[var(--color-muted)]" />
                      <span className="truncate">{officer ? officer.name : 'No Officer'}</span>
                    </span>
                  </div>
                </div>

                {/* Compliance */}
                <div className="flex-1 space-y-2 bg-[var(--color-sand)]/35 p-4">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                    <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-copper)]" />
                      दस्तावेज़ एक्सपायरी (PUC, बीमा व फिटनेस)
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-[var(--color-warning)]">
                      <Clock className="h-3 w-3" />
                      1-Month Alert
                    </span>
                  </div>

                  {docRows.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-2.5 shadow-[0_1px_2px_rgba(11,28,44,0.03)]"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                            row.alert.status === 'expired'
                              ? 'bg-rose-100 text-rose-700'
                              : row.alert.status === 'expiring_soon'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-teal-50 text-teal-800'
                          }`}
                        >
                          {row.code}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[var(--color-ink)]">
                            <span>{row.title}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-black border ${row.alert.badgeColor}`}>
                              {row.alert.label}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-[var(--color-muted)]">
                            {row.meta ? `${row.meta}: ` : 'Exp: '}
                            <span className="font-semibold text-[var(--color-ink)]">{formatDate(row.expiry)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenRenewModal(v, row.key)}
                        className="btn btn-secondary shrink-0 !px-2 !py-1 !text-[11px]"
                      >
                        रिन्यू करें
                      </button>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 border-t border-[var(--color-line)] bg-[var(--color-surface)] p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVehicleForDocs(v);
                      setIsDocModalOpen(true);
                    }}
                    className="btn btn-secondary flex-1 !text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    दस्तावेज़ कॉपी ({v.documents?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppAlert(v)}
                    className="btn btn-accent flex-1 !text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    व्हाट्सएप अलर्ट
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && filteredVehicles.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-surface)] text-[var(--color-ink)] font-semibold uppercase tracking-wider text-[11px]">
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
                                ? 'bg-teal-100 text-teal-950 border-teal-400'
                                : 'bg-white text-slate-950 border-slate-400'
                            }`}
                          >
                            {v.vehicleNumber}
                          </span>
                          <span className="text-[11px] text-[var(--color-muted)] font-medium">{v.makeModel}</span>
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
                        <div className="text-[10px] text-[var(--color-muted)] mt-0.5">{v.ownershipType}</div>
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
                                className="text-teal-700 hover:text-teal-800"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-[11px] text-[var(--color-muted)] font-mono">{driver.phone}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAssignDriverModal(v)}
                            className="text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded font-bold text-[11px]"
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
                            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-slate-800 hover:bg-slate-100"
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
        <FleetVehicleEditModal
          initialVehicle={editingVehicle}
          drivers={drivers}
          tenders={tenders}
          onClose={handleCloseVehicleForm}
          onSave={handleSaveVehicleForm}
        />
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
                className="text-[var(--color-muted)] hover:text-slate-600"
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
                  <strong className="text-teal-700 uppercase">
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
                  <span className="text-[11px] text-[var(--color-muted)]">त्वरित जोड़ें:</span>
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
                className="text-[var(--color-muted)] hover:text-slate-600"
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
                <UserCheck className="w-5 h-5 text-teal-700" />
                <span>ड्राइवर अलॉटमेंट (Assign Driver)</span>
              </h3>
              <button
                onClick={() => setIsAssignDriverModalOpen(false)}
                className="text-[var(--color-muted)] hover:text-slate-600"
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
                  className="btn btn-primary !text-xs"
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

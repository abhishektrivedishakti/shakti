import React, { useState, useEffect } from 'react';
import {
  Users,
  Handshake,
  Briefcase,
  Car,
  X,
  Check,
  Edit2,
  Trash2,
  Phone,
  ShieldCheck,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  Save,
  Search,
  CheckCircle2,
  FileText,
  UserCheck,
  Info,
} from 'lucide-react';
import { Driver, Vendor, Officer, Vehicle, Tender } from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';
import {
  getDriverDisplayCode,
  getOfficerDisplayCode,
  getVendorDisplayCode,
  generateDriverUniqueId,
  generateVendorUniqueId,
  generateOfficerUniqueId,
} from '../utils/idGenerator';
import { ConfirmDialog } from './ConfirmDialog';

export type ProfileEntityType = 'driver' | 'vendor' | 'officer' | 'vehicle';

interface UnifiedProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: ProfileEntityType;
  initialId?: string;
  drivers: Driver[];
  vendors: Vendor[];
  officers: Officer[];
  vehicles: Vehicle[];
  tenders: Tender[];
  onSaveDriver: (driver: Driver) => void | Promise<void>;
  onSaveVendor: (vendor: Vendor) => void | Promise<void>;
  onSaveOfficer: (officer: Officer) => void | Promise<void>;
  onSaveVehicle?: (vehicle: Vehicle) => void | Promise<void>;
  onDeleteDriver?: (driverId: string) => void | Promise<void>;
  onDeleteVendor?: (vendorId: string) => void | Promise<void>;
  onDeleteOfficer?: (officerId: string) => void | Promise<void>;
  apiError?: string;
  onClearApiError?: () => void;
}

export const UnifiedProfileModal: React.FC<UnifiedProfileModalProps> = ({
  isOpen,
  onClose,
  initialType = 'driver',
  initialId,
  drivers,
  vendors,
  officers,
  vehicles,
  tenders,
  onSaveDriver,
  onSaveVendor,
  onSaveOfficer,
  onSaveVehicle = () => {},
  onDeleteDriver,
  onDeleteVendor,
  onDeleteOfficer,
  apiError = '',
  onClearApiError,
}) => {
  const [activeType, setActiveType] = useState<ProfileEntityType>(initialType);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>(initialId || '');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string;
    message: string;
    detail?: string;
  } | null>(null);

  // Editable Form States
  const [driverForm, setDriverForm] = useState<Partial<Driver>>({});
  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({});
  const [officerForm, setOfficerForm] = useState<Partial<Officer>>({});
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({});

  // Sync only when the modal opens / entry point changes — never while drafting "Add new"
  useEffect(() => {
    if (!isOpen) return;
    setActiveType(initialType);
    setIsCreating(false);
    setSaveSuccessMsg(null);
    setSearchQuery('');
    if (initialId) {
      setSelectedId(initialId);
      return;
    }
    if (initialType === 'driver') setSelectedId(drivers[0]?.id || '');
    else if (initialType === 'vendor') setSelectedId(vendors[0]?.id || '');
    else if (initialType === 'officer') setSelectedId(officers[0]?.id || '');
    else if (initialType === 'vehicle') setSelectedId(vehicles[0]?.id || '');
    // intentionally omit list arrays — resetting on every hydrate/save wiped "Add new"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialType, initialId]);

  // Load form from the selected existing record (skip while creating a new draft)
  useEffect(() => {
    if (!isOpen || isCreating) return;

    if (activeType === 'driver') {
      const d = drivers.find((item) => item.id === selectedId);
      if (d) {
        setDriverForm({ ...d });
      } else if (drivers[0]) {
        setSelectedId(drivers[0].id);
        setDriverForm({ ...drivers[0] });
      } else {
        setDriverForm({});
      }
    } else if (activeType === 'vendor') {
      const v = vendors.find((item) => item.id === selectedId);
      if (v) {
        setVendorForm({ ...v });
      } else if (vendors[0]) {
        setSelectedId(vendors[0].id);
        setVendorForm({ ...vendors[0] });
      } else {
        setVendorForm({});
      }
    } else if (activeType === 'officer') {
      const o = officers.find((item) => item.id === selectedId);
      if (o) {
        setOfficerForm({ ...o });
      } else if (officers[0]) {
        setSelectedId(officers[0].id);
        setOfficerForm({ ...officers[0] });
      } else {
        setOfficerForm({});
      }
    } else if (activeType === 'vehicle') {
      const veh = vehicles.find((item) => item.id === selectedId);
      if (veh) {
        setVehicleForm({ ...veh });
      } else if (vehicles[0]) {
        setSelectedId(vehicles[0].id);
        setVehicleForm({ ...vehicles[0] });
      } else {
        setVehicleForm({});
      }
    }
  }, [isOpen, isCreating, activeType, selectedId, drivers, vendors, officers, vehicles]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // SAVE HANDLERS
  // -------------------------------------------------------------
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const plusYearsIso = (years: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().slice(0, 10);
  };

  const digits10 = (raw: string) => raw.replace(/\D/g, '').slice(-10);

  const handleSaveCurrentDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    onClearApiError?.();
    const phone = digits10(driverForm.phone || '');
    if (!driverForm.name?.trim() || phone.length !== 10) {
      setFormError('कृपया चालक का नाम और सही 10-अंकीय मोबाइल नंबर भरें।');
      return;
    }
    const creating = isCreating || !drivers.some((d) => d.id === selectedId);
    const updated: Driver = {
      ...(drivers.find((d) => d.id === selectedId) || {}),
      ...driverForm,
      id: selectedId || driverForm.id || generateDriverUniqueId(drivers),
      driverCode: driverForm.driverCode || selectedId,
      name: driverForm.name.trim(),
      phone,
      address: (driverForm.address || '').trim(),
      licenseNumber: (driverForm.licenseNumber || '').trim(),
      licenseExpiry: driverForm.licenseExpiry || plusYearsIso(5),
      policeVerificationDate: driverForm.policeVerificationDate || todayIso(),
      policeVerificationExpiry: driverForm.policeVerificationExpiry || plusYearsIso(3),
      aadharNumber: (driverForm.aadharNumber || '').trim(),
      joiningDate: driverForm.joiningDate || todayIso(),
      monthlySalary: Number(driverForm.monthlySalary) || 0,
      dailyDaRate: Number(driverForm.dailyDaRate) || 0,
      status: driverForm.status || 'active',
      documents: driverForm.documents || [],
    } as Driver;

    setIsSaving(true);
    try {
      await Promise.resolve(onSaveDriver(updated));
      setIsCreating(false);
      setSelectedId(updated.id);
      setSaveSuccessMsg(
        creating
          ? `नया चालक "${updated.name}" जोड़ दिया गया!`
          : `चालक "${updated.name}" की प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save driver.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCurrentVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    onClearApiError?.();
    const phone = digits10(vendorForm.phone || '');
    if (!vendorForm.name?.trim() || phone.length !== 10) {
      setFormError('कृपया वेंडर का नाम और सही 10-अंकीय मोबाइल नंबर भरें।');
      return;
    }
    const creating = isCreating || !vendors.some((v) => v.id === selectedId);
    const updated: Vendor = {
      ...(vendors.find((v) => v.id === selectedId) || {}),
      ...vendorForm,
      id: selectedId || vendorForm.id || generateVendorUniqueId(vendors),
      name: vendorForm.name.trim(),
      phone,
      contactPerson: vendorForm.contactPerson || vendorForm.name,
    } as Vendor;

    setIsSaving(true);
    try {
      await Promise.resolve(onSaveVendor(updated));
      setIsCreating(false);
      setSelectedId(updated.id);
      setSaveSuccessMsg(
        creating
          ? `नया वेंडर "${updated.name}" जोड़ दिया गया!`
          : `वेंडर/पार्टनर "${updated.name}" की प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save vendor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCurrentOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    onClearApiError?.();
    const mobile = digits10(officerForm.mobile || '');
    if (!officerForm.name?.trim() || mobile.length !== 10) {
      setFormError('कृपया अधिकारी का नाम और सही 10-अंकीय मोबाइल नंबर भरें।');
      return;
    }
    const creating = isCreating || !officers.some((o) => o.id === selectedId);
    const tenderId = officerForm.tenderId || tenders[0]?.id || '';
    if (!tenderId) {
      setFormError('कृपया पहले एक टेंडर जोड़ें — अधिकारी को टेंडर से जोड़ना ज़रूरी है।');
      return;
    }
    const updated: Officer = {
      ...(officers.find((o) => o.id === selectedId) || {}),
      ...officerForm,
      id: selectedId || officerForm.id || generateOfficerUniqueId(officers),
      officerCode: officerForm.officerCode || selectedId,
      name: officerForm.name.trim(),
      mobile,
      tenderId,
      status: officerForm.status || 'active',
    } as Officer;

    setIsSaving(true);
    try {
      await Promise.resolve(onSaveOfficer(updated));
      setIsCreating(false);
      setSelectedId(updated.id);
      setSaveSuccessMsg(
        creating
          ? `नया अधिकारी "${updated.name}" जोड़ दिया गया!`
          : `अधिकारी "${updated.name}" की प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save officer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCurrentVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    onClearApiError?.();
    if (!vehicleForm.vehicleNumber?.trim()) {
      setFormError('कृपया गाड़ी नंबर भरें।');
      return;
    }
    const creating = isCreating || !vehicles.some((v) => v.id === selectedId);
    const tenderId = vehicleForm.tenderId || tenders[0]?.id || '';
    if (!tenderId) {
      setFormError('कृपया पहले एक टेंडर जोड़ें — गाड़ी को टेंडर से जोड़ना ज़रूरी है।');
      return;
    }
    const updated: Vehicle = {
      ...(vehicles.find((v) => v.id === selectedId) || {}),
      ...vehicleForm,
      id: selectedId || vehicleForm.id || `veh-${Date.now()}`,
      vehicleNumber: vehicleForm.vehicleNumber.trim().toUpperCase(),
      tenderId,
      status: vehicleForm.status || 'active',
      documents: vehicleForm.documents || [],
    } as Vehicle;

    setIsSaving(true);
    try {
      await Promise.resolve(onSaveVehicle(updated));
      setIsCreating(false);
      setSelectedId(updated.id);
      setSaveSuccessMsg(
        creating
          ? `नई गाड़ी "${updated.vehicleNumber}" जोड़ दी गई!`
          : `गाड़ी "${updated.vehicleNumber}" का विवरण सफलतापूर्वक अपडेट हो गया!`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Could not save vehicle.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewProfile = () => {
    setSaveSuccessMsg(null);
    setSearchQuery('');
    setIsCreating(true);

    if (activeType === 'driver') {
      const newId = generateDriverUniqueId(drivers);
      const newD: Partial<Driver> = {
        id: newId,
        driverCode: newId,
        name: '',
        phone: '',
        alternatePhone: '',
        address: '',
        licenseNumber: '',
        licenseExpiry: plusYearsIso(5),
        policeVerificationDate: todayIso(),
        policeVerificationExpiry: plusYearsIso(3),
        aadharNumber: '',
        panNumber: '',
        joiningDate: todayIso(),
        status: 'active',
        monthlySalary: 18000,
        dailyDaRate: 300,
        employmentType: 'contractual_khata',
        bankAccountDetails: '',
        documents: [],
      };
      setDriverForm(newD);
      setSelectedId(newId);
    } else if (activeType === 'vendor') {
      const newId = generateVendorUniqueId(vendors);
      const newV: Partial<Vendor> = {
        id: newId,
        vendorCode: newId,
        name: '',
        phone: '',
        contactPerson: '',
        panNumber: '',
        vendorType: 'fleet_vendor',
        monthlyAgreedRatePerVehicle: 32000,
        isTdsApplicable: true,
        tdsRate: 2,
        tdsSection: '194C',
        status: 'active',
      };
      setVendorForm(newV);
      setSelectedId(newId);
    } else if (activeType === 'officer') {
      const newId = generateOfficerUniqueId(officers);
      const newO: Partial<Officer> = {
        id: newId,
        officerCode: newId,
        name: '',
        mobile: '',
        designation: '',
        department: tenders[0]?.departmentName || 'Government Department',
        officeAddress: 'Headquarters',
        tenderId: tenders[0]?.id || '',
        reportingTime: '09:00 AM',
        status: 'active',
      };
      setOfficerForm(newO);
      setSelectedId(newId);
    } else if (activeType === 'vehicle') {
      const newId = `veh-${Date.now()}`;
      const newVeh: Partial<Vehicle> = {
        id: newId,
        vehicleNumber: '',
        makeModel: 'Maruti Dzire / Swift',
        vehicleType: 'Sedan',
        fuelType: 'Diesel',
        color: 'White',
        modelYear: 2024,
        ownershipType: 'Company Owned',
        tenderId: tenders[0]?.id || '',
        currentOdometer: 10000,
        status: 'active',
        documents: [],
      };
      setVehicleForm(newVeh);
      setSelectedId(newId);
    }
  };

  const selectExisting = (id: string) => {
    setIsCreating(false);
    setSelectedId(id);
    setSaveSuccessMsg(null);
  };

  const switchEntityTab = (type: ProfileEntityType) => {
    setActiveType(type);
    setIsCreating(false);
    setSearchQuery('');
    setSaveSuccessMsg(null);
    if (type === 'driver') setSelectedId(drivers[0]?.id || '');
    else if (type === 'vendor') setSelectedId(vendors[0]?.id || '');
    else if (type === 'officer') setSelectedId(officers[0]?.id || '');
    else setSelectedId(vehicles[0]?.id || '');
  };

  const handleDeleteCurrent = () => {
    if (isCreating) {
      setIsCreating(false);
      if (activeType === 'driver') setSelectedId(drivers[0]?.id || '');
      else if (activeType === 'vendor') setSelectedId(vendors[0]?.id || '');
      else if (activeType === 'officer') setSelectedId(officers[0]?.id || '');
      else setSelectedId(vehicles[0]?.id || '');
      return;
    }

    if (activeType === 'driver' && onDeleteDriver) {
      const label = driverForm.name?.trim() || selectedId;
      const code = getDriverDisplayCode({
        ...(drivers.find((d) => d.id === selectedId) || {}),
        ...driverForm,
        id: selectedId,
      } as Driver);
      setDeleteConfirm({
        title: 'चालक हटाएं?',
        message: `क्या आप चालक "${label}" को हटाना चाहते हैं?`,
        detail: code,
      });
      return;
    }
    if (activeType === 'vendor' && onDeleteVendor) {
      const label = vendorForm.name?.trim() || selectedId;
      setDeleteConfirm({
        title: 'वेंडर हटाएं?',
        message: `क्या आप वेंडर "${label}" को हटाना चाहते हैं?`,
        detail: selectedId,
      });
      return;
    }
    if (activeType === 'officer' && onDeleteOfficer) {
      const label = officerForm.name?.trim() || selectedId;
      const code = getOfficerDisplayCode({
        ...(officers.find((o) => o.id === selectedId) || {}),
        ...officerForm,
        id: selectedId,
      } as Officer);
      setDeleteConfirm({
        title: 'अधिकारी हटाएं?',
        message: `क्या आप अधिकारी "${label}" को हटाना चाहते हैं?`,
        detail: code,
      });
    }
  };

  const confirmDeleteCurrent = async () => {
    if (!deleteConfirm) return;
    setFormError(null);
    onClearApiError?.();
    setIsSaving(true);
    try {
      if (activeType === 'driver' && onDeleteDriver) {
        await Promise.resolve(onDeleteDriver(selectedId));
        const next = drivers.find((d) => d.id !== selectedId);
        setSelectedId(next ? next.id : '');
      } else if (activeType === 'vendor' && onDeleteVendor) {
        await Promise.resolve(onDeleteVendor(selectedId));
        const next = vendors.find((v) => v.id !== selectedId);
        setSelectedId(next ? next.id : '');
      } else if (activeType === 'officer' && onDeleteOfficer) {
        await Promise.resolve(onDeleteOfficer(selectedId));
        const next = officers.find((o) => o.id !== selectedId);
        setSelectedId(next ? next.id : '');
      }
      setDeleteConfirm(null);
      setSaveSuccessMsg(null);
    } catch (err: unknown) {
      setDeleteConfirm(null);
      setFormError(err instanceof Error ? err.message : 'Could not delete record.');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // FILTERED LISTS FOR SIDEBAR
  // -------------------------------------------------------------
  const q = searchQuery.toLowerCase().trim();

  const filteredDriversList = drivers.filter(
    (d) => !q || d.name.toLowerCase().includes(q) || d.phone.includes(q) || (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q))
  );

  const filteredVendorsList = vendors.filter(
    (v) => !q || v.name.toLowerCase().includes(q) || v.phone.includes(q) || (v.contactPerson && v.contactPerson.toLowerCase().includes(q))
  );

  const filteredOfficersList = officers.filter(
    (o) => !q || o.name.toLowerCase().includes(q) || o.mobile.includes(q) || (o.designation && o.designation.toLowerCase().includes(q))
  );

  const filteredVehiclesList = vehicles.filter(
    (v) => !q || v.vehicleNumber.toLowerCase().includes(q) || v.makeModel.toLowerCase().includes(q)
  );

  const entityTabs: { type: ProfileEntityType; label: string; count: number; icon: React.ReactNode }[] = [
    { type: 'driver', label: 'Drivers', count: drivers.length, icon: <Users className="h-4 w-4" /> },
    { type: 'vendor', label: 'Vendors', count: vendors.length, icon: <Handshake className="h-4 w-4" /> },
    { type: 'officer', label: 'Officers', count: officers.length, icon: <Briefcase className="h-4 w-4" /> },
    { type: 'vehicle', label: 'Vehicles', count: vehicles.length, icon: <Car className="h-4 w-4" /> },
  ];

  const listTitle =
    activeType === 'driver'
      ? 'Driver list'
      : activeType === 'vendor'
        ? 'Vendor list'
        : activeType === 'officer'
          ? 'Officer list'
          : 'Vehicle list';

  const searchPlaceholder =
    activeType === 'driver'
      ? 'Search name or mobile…'
      : activeType === 'vendor'
        ? 'Search vendor or owner…'
        : activeType === 'officer'
          ? 'Search officer…'
          : 'Search vehicle number…';

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs sm:p-5">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-[var(--color-ink)] p-4 text-white sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 text-white shadow-[0_8px_20px_rgba(15,118,110,0.35)]">
              <Edit2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold tracking-tight sm:text-lg">
                <span>Profile management</span>
                <span className="badge badge-neutral !bg-white/10 !text-teal-200">Live master</span>
              </h3>
              <p className="mt-0.5 text-xs text-white/50">
                Edit drivers, vendors, officers, and vehicles in one place.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Entity tabs */}
        <div className="sticky top-[73px] z-10 shrink-0 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2.5 sm:px-4">
          <div className="segmented w-full max-w-full overflow-x-auto scrollbar-none sm:w-auto">
            {entityTabs.map((tab) => {
              const isActive = activeType === tab.type;
              return (
                <button
                  key={tab.type}
                  type="button"
                  onClick={() => switchEntityTab(tab.type)}
                  className={`segmented-btn inline-flex items-center gap-2 ${isActive ? 'is-active' : ''}`}
                >
                  <span className={isActive ? 'text-teal-700' : ''}>{tab.icon}</span>
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                      isActive ? 'bg-teal-700 text-white' : 'bg-[var(--color-sand-deep)] text-[var(--color-ink-soft)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Success / error alerts (must be visible inside this modal) */}
        {saveSuccessMsg && (
          <div className="alert-banner mx-4 mt-4 !flex-nowrap sm:mx-6">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
            <span className="text-xs font-bold text-[var(--color-ink)]">{saveSuccessMsg}</span>
          </div>
        )}
        {(formError || apiError) && (
          <div className="alert-banner danger mx-4 mt-4 !flex-nowrap sm:mx-6">
            <AlertCircle className="h-5 w-5 shrink-0 text-[var(--color-danger)]" />
            <span className="text-xs font-bold text-[var(--color-danger)]">{formError || apiError}</span>
            <button
              type="button"
              className="ml-auto text-[10px] font-bold uppercase tracking-wide text-[var(--color-danger)]"
              onClick={() => {
                setFormError(null);
                onClearApiError?.();
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-3">
          {/* LEFT SIDEBAR */}
          <div className="panel panel-pad flex max-h-[650px] flex-col space-y-3 lg:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <span className="page-kicker !normal-case !tracking-normal">{listTitle}</span>
              <button type="button" onClick={handleAddNewProfile} className="btn btn-primary !px-2.5 !py-1.5 text-xs">
                + Add new
              </button>
            </div>

            <div className="search-field">
              <Search className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {isCreating && (
                <div className="list-card is-selected text-xs ring-1 ring-teal-600/30">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-teal-800">
                      {activeType === 'driver'
                        ? 'New driver'
                        : activeType === 'vendor'
                          ? 'New vendor'
                          : activeType === 'officer'
                            ? 'New officer'
                            : 'New vehicle'}
                    </span>
                    <span className="badge badge-neutral">Draft</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                    Fill the form on the right, then Save profile
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] text-teal-700">{selectedId}</div>
                </div>
              )}

              {/* Drivers List */}
              {activeType === 'driver' &&
                filteredDriversList.map((d) => {
                  const isSel = !isCreating && d.id === selectedId;
                  const vMatch = vehicles.find((v) => v.id === d.currentVehicleId);
                  return (
                    <div
                      key={d.id}
                      onClick={() => selectExisting(d.id)}
                      className={`list-card text-xs ${isSel ? 'is-selected' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--color-ink)]">{d.name}</span>
                        <span className="badge badge-neutral font-mono">{getDriverDisplayCode(d)}</span>
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-[var(--color-muted)]">{d.phone}</div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--color-muted)]">
                        <span>{vMatch ? vMatch.vehicleNumber : 'Unassigned'}</span>
                        <span className="font-bold text-teal-700">{formatCurrency(d.monthlySalary)}/mo</span>
                      </div>
                    </div>
                  );
                })}

              {/* Vendors List */}
              {activeType === 'vendor' &&
                filteredVendorsList.map((vnd) => {
                  const isSel = !isCreating && vnd.id === selectedId;
                  return (
                    <div
                      key={vnd.id}
                      onClick={() => selectExisting(vnd.id)}
                      className={`list-card text-xs ${isSel ? 'is-selected' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--color-ink)]">{vnd.name}</span>
                        <span className="badge badge-neutral">
                          {vnd.vendorType === 'owner_driver' ? 'Owner-driver' : 'Vendor'}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-[var(--color-muted)]">{vnd.phone}</div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--color-muted)]">
                        <span>{vnd.contactPerson || '—'}</span>
                        <span className="font-mono font-bold text-[var(--color-ink)]">
                          {formatCurrency(vnd.monthlyAgreedRatePerVehicle)}/mo
                        </span>
                      </div>
                    </div>
                  );
                })}

              {/* Officers List */}
              {activeType === 'officer' &&
                filteredOfficersList.map((off) => {
                  const isSel = !isCreating && off.id === selectedId;
                  const vMatch = vehicles.find((v) => v.id === off.assignedVehicleId);
                  return (
                    <div
                      key={off.id}
                      onClick={() => selectExisting(off.id)}
                      className={`list-card text-xs ${isSel ? 'is-selected' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--color-ink)]">{off.name}</span>
                        <span className="badge badge-neutral font-mono">{getOfficerDisplayCode(off)}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-[var(--color-muted)]">{off.designation}</div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--color-muted)]">
                        <span className="font-mono">{off.mobile}</span>
                        <span>{vMatch ? vMatch.vehicleNumber : 'No vehicle'}</span>
                      </div>
                    </div>
                  );
                })}

              {/* Vehicles List */}
              {activeType === 'vehicle' &&
                filteredVehiclesList.map((veh) => {
                  const isSel = !isCreating && veh.id === selectedId;
                  const drvMatch = drivers.find((d) => d.id === veh.currentDriverId);
                  return (
                    <div
                      key={veh.id}
                      onClick={() => selectExisting(veh.id)}
                      className={`list-card text-xs ${isSel ? 'is-selected' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[var(--color-ink)]">{veh.vehicleNumber}</span>
                        <span className="badge badge-neutral">{veh.ownershipType}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">{veh.makeModel}</div>
                      <div className="mt-1.5 text-[10px] font-semibold text-teal-800">
                        {drvMatch?.name || veh.driverName || 'No driver'}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILED EDITABLE PROFILE FORM */}
          <div className="panel panel-pad max-h-[650px] overflow-y-auto lg:col-span-2">
            {/* 1. DRIVER PROFILE FORM */}
            {activeType === 'driver' && driverForm.id && (
              <form onSubmit={handleSaveCurrentDriver} className="space-y-4">
                <div className="flex flex-col gap-3 border-b border-[var(--color-line)] pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">
                      {isCreating ? 'New driver' : 'Driver profile'}
                      <span className="ml-2 font-mono text-sm text-teal-700">
                        {driverForm.name || (isCreating ? '(unsaved)' : '')}
                      </span>
                    </h4>
                    <p className="text-xs text-[var(--color-muted)]">
                      {isCreating
                        ? 'Enter name and mobile, then save to add this driver.'
                        : 'Update contact, salary, license, and bank details.'}
                    </p>
                  </div>

                  <button type="submit" className="btn btn-primary shrink-0" disabled={isSaving}>
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving…' : isCreating ? 'Save new driver' : 'Save profile'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">चालक का पूरा नाम *</label>
                    <input
                      type="text"
                      value={driverForm.name || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर (10 अंक) *</label>
                    <input
                      type="tel"
                      value={driverForm.phone || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">दूसरा मोबाइल (Alternate Phone)</label>
                    <input
                      type="tel"
                      value={driverForm.alternatePhone || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, alternatePhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ड्राइविंग लाइसेंस नंबर (DL No)</label>
                    <input
                      type="text"
                      value={driverForm.licenseNumber || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">डीएल समाप्ति तिथि (License Expiry)</label>
                    <input
                      type="date"
                      value={driverForm.licenseExpiry || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">रोजगार प्रकार (Employment Type)</label>
                    <select
                      value={driverForm.employmentType || 'contractual_khata'}
                      onChange={(e) => setDriverForm({ ...driverForm, employmentType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      <option value="company_statutory">कंपनी नियमित (Company Statutory / EPF)</option>
                      <option value="contractual_khata">अनुबंध / ठेका खाता (Contractual Khata)</option>
                      <option value="owner_driver">मालिक-चालक (Owner-Driver)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मासिक वेतन ₹ (Monthly Salary)</label>
                    <input
                      type="number"
                      value={driverForm.monthlySalary ?? 16500}
                      onChange={(e) => setDriverForm({ ...driverForm, monthlySalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">दैनिक रात्रि भत्ता ₹ (Daily DA Rate)</label>
                    <input
                      type="number"
                      value={driverForm.dailyDaRate ?? 350}
                      onChange={(e) => setDriverForm({ ...driverForm, dailyDaRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">तैनात गाड़ी (Assigned Vehicle)</label>
                    <select
                      value={driverForm.currentVehicleId || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, currentVehicleId: e.target.value || undefined })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      <option value="">कोई गाड़ी आवंटित नहीं (Pool / Standby)</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicleNumber} ({v.makeModel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">स्थिति (Operational Status)</label>
                    <select
                      value={driverForm.status || 'active'}
                      onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      <option value="active">सक्रिय ड्यूटी (Active)</option>
                      <option value="on_leave">छुट्टी पर (On Leave)</option>
                      <option value="inactive">निष्क्रिय / कार्यमुक्त (Inactive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">आधार कार्ड नंबर (Aadhaar No)</label>
                    <input
                      type="text"
                      value={driverForm.aadharNumber || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, aadharNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      placeholder="XXXX XXXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">पैन कार्ड नंबर (PAN No)</label>
                    <input
                      type="text"
                      value={driverForm.panNumber || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, panNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      placeholder="ABCDE1234F"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">बैंक खाता व आईएफएससी (Bank Account &amp; IFSC)</label>
                    <input
                      type="text"
                      value={driverForm.bankAccountDetails || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, bankAccountDetails: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      placeholder="Bank Name, A/c Number, IFSC Code"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">स्थायी पता (Permanent Address)</label>
                    <input
                      type="text"
                      value={driverForm.address || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      placeholder="ग्राम / मोहल्ला, पोस्ट, जिला, राज्य, पिनकोड"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[var(--color-muted)]">
                      यूनिक चालक कोड: <strong className="font-mono text-teal-700">{getDriverDisplayCode(driverForm as Driver)}</strong>
                    </span>
                    {onDeleteDriver && (
                      <button
                        type="button"
                        onClick={handleDeleteCurrent}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        title="चालक रिकॉर्ड हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>हटाएं (Delete)</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Save className="w-4 h-4" />
                    <span>अपडेट सुरक्षित करें (Update Driver)</span>
                  </button>
                </div>
              </form>
            )}

            {/* 2. VENDOR PROFILE FORM */}
            {activeType === 'vendor' && vendorForm.id && (
              <form onSubmit={handleSaveCurrentVendor} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <span>वेंडर / पार्टनर प्रोफ़ाइल विवरण:</span>
                      <span className="text-emerald-700 font-mono font-bold text-sm">
                        {vendorForm.name}
                      </span>
                    </h4>
                    <p className="text-xs text-[var(--color-muted)]">
                      वेंडर का नाम, संपर्क, तय मासिक किराया व TDS दर अपडेट करें
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Save className="w-4 h-4" />
                    <span>वेंडर अपडेट करें (Save Vendor)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">वेंडर / फर्म का नाम *</label>
                    <input
                      type="text"
                      value={vendorForm.name || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">संपर्क व्यक्ति (Contact Person)</label>
                    <input
                      type="text"
                      value={vendorForm.contactPerson || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर (10 अंक) *</label>
                    <input
                      type="tel"
                      value={vendorForm.phone || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">वेंडर श्रेणी (Vendor Category)</label>
                    <select
                      value={vendorForm.vendorType || 'fleet_vendor'}
                      onChange={(e) => setVendorForm({ ...vendorForm, vendorType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      <option value="owner_driver">एकल गाड़ी मालिक (Owner-Driver - 1% TDS)</option>
                      <option value="fleet_vendor">फ्लीट वेंडर / ट्रेवल्स कंपनी (Fleet Vendor - 2% TDS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">तय मासिक किराया ₹ (Monthly Agreed Rent)</label>
                    <input
                      type="number"
                      value={vendorForm.monthlyAgreedRatePerVehicle ?? 32000}
                      onChange={(e) => setVendorForm({ ...vendorForm, monthlyAgreedRatePerVehicle: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">TDS कटौती दर (TDS Rate %)</label>
                    <select
                      value={vendorForm.tdsRate ?? 2}
                      onChange={(e) => setVendorForm({ ...vendorForm, tdsRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-bold text-teal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      <option value={1}>1% (व्यक्तिगत / Owner-Driver 194C)</option>
                      <option value={2}>2% (कंपनी / फर्म 194C)</option>
                      <option value={0}>0% (TDS छूट / Nil TDS Declaration)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">पैन नंबर (PAN Number)</label>
                    <input
                      type="text"
                      value={vendorForm.panNumber || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, panNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">जीएसटी नंबर (GSTIN - यदि है)</label>
                    <input
                      type="text"
                      value={vendorForm.gstin || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      placeholder="09AAAAA0000A1Z5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">बैंक खाता विवरण (Bank Details for Payout)</label>
                    <input
                      type="text"
                      value={vendorForm.bankAccountDetails || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, bankAccountDetails: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      placeholder="Bank Name, A/c Number, IFSC Code"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">पता (Address)</label>
                    <input
                      type="text"
                      value={vendorForm.address || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[var(--color-muted)]">
                      वेंडर कोड: <strong className="font-mono text-emerald-800">{getVendorDisplayCode(vendorForm as Vendor)}</strong>
                    </span>
                    {onDeleteVendor && (
                      <button
                        type="button"
                        onClick={handleDeleteCurrent}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        title="वेंडर रिकॉर्ड हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>हटाएं (Delete)</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Save className="w-4 h-4" />
                    <span>वेंडर अपडेट सुरक्षित करें</span>
                  </button>
                </div>
              </form>
            )}

            {/* 3. OFFICER PROFILE FORM */}
            {activeType === 'officer' && officerForm.id && (
              <form onSubmit={handleSaveCurrentOfficer} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <span>सरकारी अधिकारी प्रोफ़ाइल (Govt Officer):</span>
                      <span className="text-amber-800 font-bold text-sm">{officerForm.name}</span>
                    </h4>
                    <p className="text-xs text-[var(--color-muted)]">
                      अधिकारी का नाम, पदनाम, विभाग, मोबाइल व गाड़ी आवंटन विवरण बदलें
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Save className="w-4 h-4" />
                    <span>अधिकारी सुरक्षित करें</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">अधिकारी का पूरा नाम *</label>
                    <input
                      type="text"
                      value={officerForm.name || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">पदनाम (Designation) *</label>
                    <input
                      type="text"
                      value={officerForm.designation || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, designation: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">विभाग (Department)</label>
                    <input
                      type="text"
                      value={officerForm.department || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर (10 अंक) *</label>
                    <input
                      type="tel"
                      value={officerForm.mobile || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, mobile: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">दूसरा मोबाइल / फ़ोन</label>
                    <input
                      type="tel"
                      value={officerForm.alternatePhone || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, alternatePhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">आवंटित गाड़ी (Assigned Vehicle)</label>
                    <select
                      value={officerForm.assignedVehicleId || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, assignedVehicleId: e.target.value || undefined })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      <option value="">कोई गाड़ी आवंटित नहीं (Vacant)</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicleNumber} ({v.makeModel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">संबंधित टेंडर (Tender Assignment)</label>
                    <select
                      value={officerForm.tenderId || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, tenderId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      {tenders.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.departmentName} &bull; {t.tenderNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">रिपोर्टिंग समय (Reporting Time)</label>
                    <input
                      type="text"
                      value={officerForm.reportingTime || '09:30 AM'}
                      onChange={(e) => setOfficerForm({ ...officerForm, reportingTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      placeholder="e.g. 09:30 AM"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">कार्यालय कक्ष व पता (Office Address / Room)</label>
                    <input
                      type="text"
                      value={officerForm.officeAddress || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, officeAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      placeholder="e.g. कमरा नं. 304, निर्माण भवन, लखनऊ"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">विशेष रूट / निर्देश (Special Instructions)</label>
                    <input
                      type="text"
                      value={officerForm.specialInstructions || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, specialInstructions: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      placeholder="VIP प्रोटोकॉल, साइट निरीक्षण आदि"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[var(--color-muted)]">
                      अधिकारी कोड: <strong className="font-mono text-amber-800">{getOfficerDisplayCode(officerForm as Officer)}</strong>
                    </span>
                    {onDeleteOfficer && (
                      <button
                        type="button"
                        onClick={handleDeleteCurrent}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        title="अधिकारी रिकॉर्ड हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>हटाएं (Delete)</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    <Save className="w-4 h-4" />
                    <span>अधिकारी अपडेट सुरक्षित करें</span>
                  </button>
                </div>
              </form>
            )}

            {/* 4. VEHICLE PROFILE FORM */}
            {activeType === 'vehicle' && vehicleForm.id && (
              <form onSubmit={handleSaveCurrentVehicle} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <span>गाड़ी विवरण (Vehicle Profile):</span>
                      <span className="text-teal-700 font-mono font-bold text-base">
                        {vehicleForm.vehicleNumber}
                      </span>
                    </h4>
                    <p className="text-xs text-[var(--color-muted)]">
                      गाड़ी नंबर, मेक-मॉडल, चालक आवंटन, वेंडर व ओनरशिप विवरण बदलें
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>गाड़ी सुरक्षित करें</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">गाड़ी नंबर (Reg No) *</label>
                    <input
                      type="text"
                      value={vehicleForm.vehicleNumber || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मेक व मॉडल (Make & Model)</label>
                    <input
                      type="text"
                      value={vehicleForm.makeModel || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, makeModel: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  {/* Prominent Driver Assignment & Direct Name */}
                  <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-300 sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-emerald-950 font-black flex items-center gap-1">
                        👨‍✈️ चालू चालक (Current Assigned Driver)
                      </label>
                      <span className="text-[11px] text-emerald-800">
                        ड्राइवर बदलने से उसका नाम सीधे गाड़ी पर दिखने लगेगा
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <select
                        value={vehicleForm.currentDriverId || ''}
                        onChange={(e) => {
                          const matchedD = drivers.find((d) => d.id === e.target.value);
                          setVehicleForm({
                            ...vehicleForm,
                            currentDriverId: e.target.value || undefined,
                            driverName: matchedD ? matchedD.name : undefined,
                            driverPhone: matchedD ? matchedD.phone : undefined,
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-lg font-bold text-slate-900"
                      >
                        <option value="">-- चालक चुनें (Select Driver) --</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            👨‍✈️ {d.name} ({d.phone})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="या सीधे चालक का नाम लिखें (Direct Driver Name)"
                        value={vehicleForm.driverName || ''}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-lg font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">स्वामित्व प्रकार (Ownership)</label>
                    <select
                      value={vehicleForm.ownershipType || 'Company Owned'}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, ownershipType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      <option value="Company Owned">🏢 Company Owned (कंपनी की अपनी)</option>
                      <option value="Owner-Driver">🚗👨‍✈️ Owner-Driver (मालिक ही ड्राइवर)</option>
                      <option value="Attached / Market Hire">🤝 Attached / Market Hire (वेंडर अटैच)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">गाड़ी प्रकार (Type)</label>
                    <select
                      value={vehicleForm.vehicleType || 'Sedan'}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      <option value="Sedan">Sedan (सेडान)</option>
                      <option value="SUV">SUV (एसयूवी)</option>
                      <option value="MUV">MUV (मल्टी-यूटिलिटी)</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="EV">EV (इलेक्ट्रिक)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ईंधन (Fuel)</label>
                    <select
                      value={vehicleForm.fuelType || 'Diesel'}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      <option value="Diesel">Diesel (डीजल)</option>
                      <option value="CNG">CNG (सीएनजी)</option>
                      <option value="Petrol">Petrol (पेट्रोल)</option>
                      <option value="Electric">Electric (इलेक्ट्रिक)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ओडोमीटर (Current KM)</label>
                    <input
                      type="number"
                      value={vehicleForm.currentOdometer ?? 25000}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, currentOdometer: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">टेंडर आवंटन (Tender)</label>
                    <select
                      value={vehicleForm.tenderId || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, tenderId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      {tenders.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.departmentName} &bull; {t.tenderNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">संबंधित अधिकारी (Officer)</label>
                    <select
                      value={vehicleForm.assignedOfficerId || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, assignedOfficerId: e.target.value || undefined })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/25"
                    >
                      <option value="">कोई अधिकारी नहीं (Vacant)</option>
                      {officers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-[var(--color-muted)]">
                    गाड़ी आईडी: <strong className="font-mono text-teal-800">{vehicleForm.id}</strong>
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>गाड़ी अपडेट सुरक्षित करें</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      isOpen={Boolean(deleteConfirm)}
      title={deleteConfirm?.title || ''}
      message={deleteConfirm?.message || ''}
      detail={deleteConfirm?.detail}
      tone="danger"
      confirmLabel="हाँ, हटाएं"
      cancelLabel="रद्द करें"
      onConfirm={confirmDeleteCurrent}
      onCancel={() => setDeleteConfirm(null)}
    />
    </>
  );
};

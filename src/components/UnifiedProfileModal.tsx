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
  onSaveDriver: (driver: Driver) => void;
  onSaveVendor: (vendor: Vendor) => void;
  onSaveOfficer: (officer: Officer) => void;
  onSaveVehicle?: (vehicle: Vehicle) => void;
  onDeleteDriver?: (driverId: string) => void;
  onDeleteVendor?: (vendorId: string) => void;
  onDeleteOfficer?: (officerId: string) => void;
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
}) => {
  const [activeType, setActiveType] = useState<ProfileEntityType>(initialType);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>(initialId || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Editable Form States
  const [driverForm, setDriverForm] = useState<Partial<Driver>>({});
  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({});
  const [officerForm, setOfficerForm] = useState<Partial<Officer>>({});
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({});

  // Sync when opening or when initial values change
  useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
      if (initialId) {
        setSelectedId(initialId);
      } else {
        if (initialType === 'driver') setSelectedId(drivers[0]?.id || '');
        else if (initialType === 'vendor') setSelectedId(vendors[0]?.id || '');
        else if (initialType === 'officer') setSelectedId(officers[0]?.id || '');
        else if (initialType === 'vehicle') setSelectedId(vehicles[0]?.id || '');
      }
      setSaveSuccessMsg(null);
    }
  }, [isOpen, initialType, initialId, drivers, vendors, officers, vehicles]);

  // When selectedId or activeType changes, load form state
  useEffect(() => {
    if (activeType === 'driver') {
      const d = drivers.find((item) => item.id === selectedId) || drivers[0];
      if (d) {
        setDriverForm({ ...d });
        setSelectedId(d.id);
      }
    } else if (activeType === 'vendor') {
      const v = vendors.find((item) => item.id === selectedId) || vendors[0];
      if (v) {
        setVendorForm({ ...v });
        setSelectedId(v.id);
      }
    } else if (activeType === 'officer') {
      const o = officers.find((item) => item.id === selectedId) || officers[0];
      if (o) {
        setOfficerForm({ ...o });
        setSelectedId(o.id);
      }
    } else if (activeType === 'vehicle') {
      const veh = vehicles.find((item) => item.id === selectedId) || vehicles[0];
      if (veh) {
        setVehicleForm({ ...veh });
        setSelectedId(veh.id);
      }
    }
  }, [activeType, selectedId, drivers, vendors, officers, vehicles]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // SAVE HANDLERS
  // -------------------------------------------------------------
  const handleSaveCurrentDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name?.trim() || !driverForm.phone?.trim()) {
      alert('कृपया चालक का नाम और 10-अंकीय मोबाइल नंबर भरें।');
      return;
    }
    const updated: Driver = {
      ...(drivers.find((d) => d.id === selectedId) || {}),
      ...driverForm,
      id: selectedId,
      name: driverForm.name.trim(),
      phone: driverForm.phone.trim(),
    } as Driver;

    onSaveDriver(updated);
    setSaveSuccessMsg(`चालक "${updated.name}" की प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSaveCurrentVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name?.trim() || !vendorForm.phone?.trim()) {
      alert('कृपया वेंडर का नाम और मोबाइल नंबर भरें।');
      return;
    }
    const updated: Vendor = {
      ...(vendors.find((v) => v.id === selectedId) || {}),
      ...vendorForm,
      id: selectedId,
      name: vendorForm.name.trim(),
      phone: vendorForm.phone.trim(),
      contactPerson: vendorForm.contactPerson || vendorForm.name,
    } as Vendor;

    onSaveVendor(updated);
    setSaveSuccessMsg(`वेंडर/पार्टनर "${updated.name}" की प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSaveCurrentOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerForm.name?.trim() || !officerForm.mobile?.trim()) {
      alert('कृपया अधिकारी का नाम और 10-अंकीय मोबाइल नंबर भरें।');
      return;
    }
    const updated: Officer = {
      ...(officers.find((o) => o.id === selectedId) || {}),
      ...officerForm,
      id: selectedId,
      name: officerForm.name.trim(),
      mobile: officerForm.mobile.trim(),
    } as Officer;

    onSaveOfficer(updated);
    setSaveSuccessMsg(`अधिकारी "${updated.name}" की प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSaveCurrentVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.vehicleNumber?.trim()) {
      alert('कृपया गाड़ी नंबर भरें।');
      return;
    }
    const updated: Vehicle = {
      ...(vehicles.find((v) => v.id === selectedId) || {}),
      ...vehicleForm,
      id: selectedId,
      vehicleNumber: vehicleForm.vehicleNumber.trim().toUpperCase(),
    } as Vehicle;

    onSaveVehicle(updated);
    setSaveSuccessMsg(`गाड़ी "${updated.vehicleNumber}" का विवरण सफलतापूर्वक अपडेट हो गया!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleAddNewProfile = () => {
    if (activeType === 'driver') {
      const newId = generateDriverUniqueId(drivers);
      const newD: Partial<Driver> = {
        id: newId,
        name: '',
        phone: '',
        licenseNumber: 'DL-' + Math.floor(1000000000 + Math.random() * 9000000000),
        licenseExpiry: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        status: 'active',
        monthlySalary: 18000,
        dailyDaRate: 300,
      };
      setDriverForm(newD);
      setSelectedId(newId);
    } else if (activeType === 'vendor') {
      const newId = generateVendorUniqueId(vendors);
      const newV: Partial<Vendor> = {
        id: newId,
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
        name: '',
        mobile: '',
        designation: '',
        department: tenders[0]?.departmentName || 'Government Department',
        officeAddress: 'Headquarters',
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
        currentOdometer: 10000,
        status: 'active',
      };
      setVehicleForm(newVeh);
      setSelectedId(newId);
    }
  };

  const handleDeleteCurrent = () => {
    if (activeType === 'driver' && onDeleteDriver) {
      if (confirm(`क्या आप चालक "${driverForm.name || selectedId}" को हटाना चाहते हैं?`)) {
        onDeleteDriver(selectedId);
        const next = drivers.find((d) => d.id !== selectedId);
        setSelectedId(next ? next.id : '');
      }
    } else if (activeType === 'vendor' && onDeleteVendor) {
      if (confirm(`क्या आप वेंडर "${vendorForm.name || selectedId}" को हटाना चाहते हैं?`)) {
        onDeleteVendor(selectedId);
        const next = vendors.find((v) => v.id !== selectedId);
        setSelectedId(next ? next.id : '');
      }
    } else if (activeType === 'officer' && onDeleteOfficer) {
      if (confirm(`क्या आप अधिकारी "${officerForm.name || selectedId}" को हटाना चाहते हैं?`)) {
        onDeleteOfficer(selectedId);
        const next = officers.find((o) => o.id !== selectedId);
        setSelectedId(next ? next.id : '');
      }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>प्रोफ़ाइल प्रबंधन व संपादन हब (Profile Management &amp; Editor)</span>
                <span className="text-[10px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded">
                  Live Master
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                चालक (Driver), वेंडर (Vendor), अधिकारी (Officer) व गाड़ी (Vehicle) की प्रोफ़ाइल सीधे बदलें व सुरक्षित करें
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Entity Category Tabs */}
        <div className="p-3 border-b border-slate-200 bg-slate-100 flex items-center justify-between gap-3 sticky top-[73px] z-10 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => {
                setActiveType('driver');
                setSelectedId(drivers[0]?.id || '');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'driver'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-200" />
              <span>1. चालक प्रोफ़ाइल (Drivers)</span>
              <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {drivers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveType('vendor');
                setSelectedId(vendors[0]?.id || '');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'vendor'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Handshake className="w-4 h-4 text-emerald-200" />
              <span>2. वेंडर व कार मालिक (Vendors)</span>
              <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {vendors.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveType('officer');
                setSelectedId(officers[0]?.id || '');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'officer'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-4 h-4 text-amber-200" />
              <span>3. सरकारी अधिकारी (Officers)</span>
              <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {officers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveType('vehicle');
                setSelectedId(vehicles[0]?.id || '');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'vehicle'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Car className="w-4 h-4 text-teal-200" />
              <span>4. गाड़ी विवरण (Vehicles)</span>
              <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {vehicles.length}
              </span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Two Column Layout: Selector Sidebar + Detail Editor Form */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* LEFT SIDEBAR: LIST SELECTOR */}
          <div className="lg:col-span-1 bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 flex flex-col max-h-[650px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase">
                {activeType === 'driver'
                  ? 'चालक सूची'
                  : activeType === 'vendor'
                  ? 'वेंडर सूची'
                  : activeType === 'officer'
                  ? 'अधिकारी सूची'
                  : 'गाड़ी सूची'}
              </span>
              <button
                type="button"
                onClick={handleAddNewProfile}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>+ नया जोड़ें</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={
                  activeType === 'driver'
                    ? 'चालक का नाम या मोबाइल खोजें...'
                    : activeType === 'vendor'
                    ? 'वेंडर या मालिक खोजें...'
                    : activeType === 'officer'
                    ? 'अधिकारी का नाम खोजें...'
                    : 'गाड़ी नंबर खोजें...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {/* Drivers List */}
              {activeType === 'driver' &&
                filteredDriversList.map((d) => {
                  const isSel = d.id === selectedId;
                  const vMatch = vehicles.find((v) => v.id === d.currentVehicleId);
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSel
                          ? 'bg-indigo-50 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{d.name}</span>
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded">
                          {getDriverDisplayCode(d)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">📞 {d.phone}</div>
                      <div className="text-[10px] text-slate-600 mt-1 flex items-center justify-between">
                        <span>{vMatch ? `🚗 ${vMatch.vehicleNumber}` : 'अनावंटित'}</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(d.monthlySalary)}/mo</span>
                      </div>
                    </div>
                  );
                })}

              {/* Vendors List */}
              {activeType === 'vendor' &&
                filteredVendorsList.map((vnd) => {
                  const isSel = vnd.id === selectedId;
                  return (
                    <div
                      key={vnd.id}
                      onClick={() => setSelectedId(vnd.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSel
                          ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{vnd.name}</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          {vnd.vendorType === 'owner_driver' ? 'मालिक-चालक' : 'वेंडर'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">📞 {vnd.phone}</div>
                      <div className="text-[10px] text-slate-600 mt-1 flex items-center justify-between">
                        <span>{vnd.contactPerson || '-'}</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {formatCurrency(vnd.monthlyAgreedRatePerVehicle)}/गाड़ी
                        </span>
                      </div>
                    </div>
                  );
                })}

              {/* Officers List */}
              {activeType === 'officer' &&
                filteredOfficersList.map((off) => {
                  const isSel = off.id === selectedId;
                  const vMatch = vehicles.find((v) => v.id === off.assignedVehicleId);
                  return (
                    <div
                      key={off.id}
                      onClick={() => setSelectedId(off.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSel
                          ? 'bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{off.name}</span>
                        <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                          {getOfficerDisplayCode(off)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 truncate">{off.designation}</div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                        <span className="font-mono">📞 {off.mobile}</span>
                        <span>{vMatch ? `🚗 ${vMatch.vehicleNumber}` : 'कार खाली'}</span>
                      </div>
                    </div>
                  );
                })}

              {/* Vehicles List */}
              {activeType === 'vehicle' &&
                filteredVehiclesList.map((veh) => {
                  const isSel = veh.id === selectedId;
                  const drvMatch = drivers.find((d) => d.id === veh.currentDriverId);
                  return (
                    <div
                      key={veh.id}
                      onClick={() => setSelectedId(veh.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSel
                          ? 'bg-teal-50 border-teal-500 shadow-xs ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{veh.vehicleNumber}</span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                          {veh.ownershipType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{veh.makeModel}</div>
                      <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                        👨‍✈️ {drvMatch?.name || veh.driverName || 'चालक अनावंटित'}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILED EDITABLE PROFILE FORM */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs overflow-y-auto max-h-[650px]">
            {/* 1. DRIVER PROFILE FORM */}
            {activeType === 'driver' && driverForm.id && (
              <form onSubmit={handleSaveCurrentDriver} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <span>चालक प्रोफ़ाइल विवरण (Driver Profile):</span>
                      <span className="text-indigo-600 font-mono font-bold text-sm">
                        {driverForm.name}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      व्यक्तिगत जानकारी, वेतन, डीएल व बैंक खाते का विवरण अपडेट करें
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>परिवर्तन सुरक्षित करें (Save Profile)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">चालक का पूरा नाम *</label>
                    <input
                      type="text"
                      value={driverForm.name || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर (10 अंक) *</label>
                    <input
                      type="tel"
                      value={driverForm.phone || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">दूसरा मोबाइल (Alternate Phone)</label>
                    <input
                      type="tel"
                      value={driverForm.alternatePhone || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, alternatePhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ड्राइविंग लाइसेंस नंबर (DL No)</label>
                    <input
                      type="text"
                      value={driverForm.licenseNumber || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">डीएल समाप्ति तिथि (License Expiry)</label>
                    <input
                      type="date"
                      value={driverForm.licenseExpiry || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">रोजगार प्रकार (Employment Type)</label>
                    <select
                      value={driverForm.employmentType || 'contractual_khata'}
                      onChange={(e) => setDriverForm({ ...driverForm, employmentType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">दैनिक रात्रि भत्ता ₹ (Daily DA Rate)</label>
                    <input
                      type="number"
                      value={driverForm.dailyDaRate ?? 350}
                      onChange={(e) => setDriverForm({ ...driverForm, dailyDaRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">तैनात गाड़ी (Assigned Vehicle)</label>
                    <select
                      value={driverForm.currentVehicleId || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, currentVehicleId: e.target.value || undefined })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                      placeholder="XXXX XXXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">पैन कार्ड नंबर (PAN No)</label>
                    <input
                      type="text"
                      value={driverForm.panNumber || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, panNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase focus:bg-white"
                      placeholder="ABCDE1234F"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">बैंक खाता व आईएफएससी (Bank Account &amp; IFSC)</label>
                    <input
                      type="text"
                      value={driverForm.bankAccountDetails || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, bankAccountDetails: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      placeholder="Bank Name, A/c Number, IFSC Code"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">स्थायी पता (Permanent Address)</label>
                    <input
                      type="text"
                      value={driverForm.address || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      placeholder="ग्राम / मोहल्ला, पोस्ट, जिला, राज्य, पिनकोड"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">
                      यूनिक चालक कोड: <strong className="font-mono text-indigo-700">{getDriverDisplayCode(driverForm as Driver)}</strong>
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
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
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
                    <p className="text-xs text-slate-500">
                      वेंडर का नाम, संपर्क, तय मासिक किराया व TDS दर अपडेट करें
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">संपर्क व्यक्ति (Contact Person)</label>
                    <input
                      type="text"
                      value={vendorForm.contactPerson || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर (10 अंक) *</label>
                    <input
                      type="tel"
                      value={vendorForm.phone || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">वेंडर श्रेणी (Vendor Category)</label>
                    <select
                      value={vendorForm.vendorType || 'fleet_vendor'}
                      onChange={(e) => setVendorForm({ ...vendorForm, vendorType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">TDS कटौती दर (TDS Rate %)</label>
                    <select
                      value={vendorForm.tdsRate ?? 2}
                      onChange={(e) => setVendorForm({ ...vendorForm, tdsRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-indigo-700 focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">जीएसटी नंबर (GSTIN - यदि है)</label>
                    <input
                      type="text"
                      value={vendorForm.gstin || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase focus:bg-white"
                      placeholder="09AAAAA0000A1Z5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">बैंक खाता विवरण (Bank Details for Payout)</label>
                    <input
                      type="text"
                      value={vendorForm.bankAccountDetails || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, bankAccountDetails: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      placeholder="Bank Name, A/c Number, IFSC Code"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">पता (Address)</label>
                    <input
                      type="text"
                      value={vendorForm.address || ''}
                      onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">
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
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
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
                    <p className="text-xs text-slate-500">
                      अधिकारी का नाम, पदनाम, विभाग, मोबाइल व गाड़ी आवंटन विवरण बदलें
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">पदनाम (Designation) *</label>
                    <input
                      type="text"
                      value={officerForm.designation || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, designation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">विभाग (Department)</label>
                    <input
                      type="text"
                      value={officerForm.department || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर (10 अंक) *</label>
                    <input
                      type="tel"
                      value={officerForm.mobile || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, mobile: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">दूसरा मोबाइल / फ़ोन</label>
                    <input
                      type="tel"
                      value={officerForm.alternatePhone || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, alternatePhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">आवंटित गाड़ी (Assigned Vehicle)</label>
                    <select
                      value={officerForm.assignedVehicleId || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, assignedVehicleId: e.target.value || undefined })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                      placeholder="e.g. 09:30 AM"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">कार्यालय कक्ष व पता (Office Address / Room)</label>
                    <input
                      type="text"
                      value={officerForm.officeAddress || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, officeAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      placeholder="e.g. कमरा नं. 304, निर्माण भवन, लखनऊ"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">विशेष रूट / निर्देश (Special Instructions)</label>
                    <input
                      type="text"
                      value={officerForm.specialInstructions || ''}
                      onChange={(e) => setOfficerForm({ ...officerForm, specialInstructions: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      placeholder="VIP प्रोटोकॉल, साइट निरीक्षण आदि"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">
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
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
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
                    <p className="text-xs text-slate-500">
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 uppercase focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मेक व मॉडल (Make & Model)</label>
                    <input
                      type="text"
                      value={vehicleForm.makeModel || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, makeModel: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">टेंडर आवंटन (Tender)</label>
                    <select
                      value={vehicleForm.tenderId || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, tenderId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:bg-white"
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
                  <span className="text-[11px] text-slate-500">
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
  );
};

import React, { useState, useMemo } from 'react';
import {
  Fuel,
  Plus,
  Receipt,
  Building2,
  Calendar,
  IndianRupee,
  Gauge,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  Car,
  User,
  CreditCard,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  FuelRecord,
  Vehicle,
  Driver,
  FuelPumpVendor,
  FuelSlip,
  FuelVendorMonthlyBill,
  StaffUser,
} from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';
import { FuelSlipPrintModal } from './FuelSlipPrintModal';
import { IssueFuelSlipModal } from './IssueFuelSlipModal';
import { MarkSlipFilledModal } from './MarkSlipFilledModal';
import { CreateFuelVendorBillModal } from './CreateFuelVendorBillModal';
import { FuelVendorBillDetailModal } from './FuelVendorBillDetailModal';
import { PumpVendorModal } from './PumpVendorModal';

interface FuelManagerViewProps {
  fuelRecords: FuelRecord[];
  vehicles: Vehicle[];
  drivers: Driver[];
  fuelPumpVendors?: FuelPumpVendor[];
  fuelSlips?: FuelSlip[];
  fuelVendorBills?: FuelVendorMonthlyBill[];
  currentUser?: StaffUser;
  onAddFuelRecord: (record: FuelRecord) => void;
  onSaveFuelSlip?: (slip: FuelSlip) => void;
  onDeleteFuelSlip?: (slipId: string) => void;
  onSavePumpVendor?: (vendor: FuelPumpVendor) => void;
  onDeletePumpVendor?: (vendorId: string) => void;
  onSaveFuelVendorBill?: (bill: FuelVendorMonthlyBill, linkedSlipIds: string[]) => void;
  onDeleteFuelVendorBill?: (billId: string) => void;
  onPayFuelVendorBill?: (
    billId: string,
    paymentData: { mode: 'bank_transfer' | 'cheque' | 'upi' | 'cash'; ref: string; date: string; amount: number }
  ) => void;
}

type FuelSubTab = 'slips' | 'monthly_bills' | 'pump_vendors' | 'all_refills';

export const FuelManagerView: React.FC<FuelManagerViewProps> = ({
  fuelRecords,
  vehicles,
  drivers,
  fuelPumpVendors = [],
  fuelSlips = [],
  fuelVendorBills = [],
  currentUser,
  onAddFuelRecord,
  onSaveFuelSlip = () => {},
  onDeleteFuelSlip = () => {},
  onSavePumpVendor = () => {},
  onDeletePumpVendor = () => {},
  onSaveFuelVendorBill = () => {},
  onDeleteFuelVendorBill = () => {},
  onPayFuelVendorBill = () => {},
}) => {
  const [activeSubTab, setActiveSubTab] = useState<FuelSubTab>('slips');

  // Modals state
  const [isIssueSlipModalOpen, setIsIssueSlipModalOpen] = useState(false);
  const [printingSlip, setPrintingSlip] = useState<FuelSlip | null>(null);
  const [fillingSlip, setFillingSlip] = useState<FuelSlip | null>(null);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<FuelVendorMonthlyBill | null>(null);
  const [editingPumpVendor, setEditingPumpVendor] = useState<FuelPumpVendor | null | 'new'>(null);
  const [isManualFuelModalOpen, setIsManualFuelModalOpen] = useState(false);

  // Filters for Slips
  const [slipStatusFilter, setSlipStatusFilter] = useState<string>('all');
  const [slipPumpFilter, setSlipPumpFilter] = useState<string>('all');
  const [slipVehicleFilter, setSlipVehicleFilter] = useState<string>('all');
  const [slipSearch, setSlipSearch] = useState<string>('');

  // Filters for All Refills
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');

  // New Fuel Record Form State (for direct entry)
  const [formData, setFormData] = useState<Partial<FuelRecord>>({
    date: new Date().toISOString().slice(0, 10),
    vehicleId: vehicles[0]?.id || '',
    mode: 'monthly_fixed',
    liters: 30,
    ratePerLiter: 89.6,
    totalAmount: 2688,
    odometerKm: 42350,
    fuelType: 'Diesel',
    fuelStation: fuelPumpVendors[0]?.name || 'IOCL Highway Pump',
    receiptNumber: `RCP-${Date.now().toString().slice(-4)}`,
    fullTank: true,
    notes: 'Fuel top-up',
  });

  // Calculate high-level metrics
  const issuedSlipsWaiting = fuelSlips.filter((s) => s.status === 'issued');
  const filledSlipsCount = fuelSlips.filter((s) => s.status === 'filled' || s.status === 'billed');
  const totalFuelLitersThisMonth = useMemo(() => {
    const curMonth = new Date().toISOString().slice(0, 7);
    const slipLiters = fuelSlips
      .filter((s) => (s.fillDate || s.issueDate).startsWith(curMonth) && (s.status === 'filled' || s.status === 'billed'))
      .reduce((sum, s) => sum + (s.actualLiters || 0), 0);
    const recLiters = fuelRecords
      .filter((r) => r.date.startsWith(curMonth) && !r.fuelSlipId)
      .reduce((sum, r) => sum + r.liters, 0);
    return Math.round((slipLiters + recLiters) * 10) / 10;
  }, [fuelSlips, fuelRecords]);

  const pendingBillsTotal = useMemo(() => {
    return fuelVendorBills
      .filter((b) => b.paymentStatus !== 'paid')
      .reduce((sum, b) => sum + b.netPayable, 0);
  }, [fuelVendorBills]);

  // Filtered Fuel Slips
  const filteredSlips = useMemo(() => {
    return fuelSlips
      .filter((s) => {
        const matchesStatus = slipStatusFilter === 'all' || s.status === slipStatusFilter;
        const matchesPump = slipPumpFilter === 'all' || s.pumpVendorId === slipPumpFilter;
        const matchesVehicle = slipVehicleFilter === 'all' || s.vehicleId === slipVehicleFilter;
        const q = slipSearch.trim().toLowerCase();
        const matchesSearch =
          !q ||
          s.slipNumber.toLowerCase().includes(q) ||
          s.vehicleNumber.toLowerCase().includes(q) ||
          s.driverName.toLowerCase().includes(q) ||
          s.pumpVendorName.toLowerCase().includes(q);
        return matchesStatus && matchesPump && matchesVehicle && matchesSearch;
      })
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [fuelSlips, slipStatusFilter, slipPumpFilter, slipVehicleFilter, slipSearch]);

  // Handle Mark Filled confirmation
  const handleConfirmSlipFill = (updatedSlip: FuelSlip, fuelRecord: FuelRecord) => {
    onSaveFuelSlip(updatedSlip);
    onAddFuelRecord(fuelRecord);
  };

  // Direct Fuel Entry Submit
  const handleSaveDirectFuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.totalAmount) {
      alert('Vehicle and Amount are required.');
      return;
    }
    const veh = vehicles.find((v) => v.id === formData.vehicleId);
    const drv = drivers.find((d) => d.id === veh?.currentDriverId);

    const record: FuelRecord = {
      id: `fuel-${Date.now()}`,
      date: formData.date || new Date().toISOString().slice(0, 10),
      vehicleId: formData.vehicleId,
      vehicleNumber: veh?.vehicleNumber || '',
      driverId: drv?.id || 'drv-unassigned',
      driverName: drv?.name || 'Driver',
      mode: (formData.mode as any) || 'monthly_fixed',
      liters: Number(formData.liters) || 0,
      ratePerLiter: Number(formData.ratePerLiter) || 0,
      totalAmount: Number(formData.totalAmount) || 0,
      odometerKm: Number(formData.odometerKm) || 0,
      fuelType: (formData.fuelType as any) || 'Diesel',
      fuelStation: formData.fuelStation || 'Fuel Station',
      receiptNumber: formData.receiptNumber || 'RCP',
      fullTank: formData.fullTank || false,
      notes: formData.notes || '',
    };
    onAddFuelRecord(record);
    setIsManualFuelModalOpen(false);
  };

  // Fixed budget vehicles
  const fixedBudgetVehicles = vehicles.filter((v) => v.fuelPolicy === 'monthly_fixed_budget');

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Fuel Slip &amp; Tied-up Pump Vendor Manager</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold border border-indigo-200">
                  पेट्रोल पंप पर्ची व मासिक बिलिंग
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ऑफिस से ड्राइवर को पर्ची (Indent) देना, पेट्रोल पंप पर तेल भराई, एवं माह के अंत में पंप वेंडर का गाड़ी-वार बिल मिलान
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsIssueSlipModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-4 h-4" />
            + नई फ्यूल पर्ची काटें (Issue Slip)
          </button>
          <button
            onClick={() => setIsCreateBillModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            मासिक वेंडर बिल दर्ज करें
          </button>
        </div>
      </div>

      {/* KPI Stats Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveSubTab('slips')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">पर्चियां जारी (Pending Fill)</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">{issuedSlipsWaiting.length}</span>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
              ड्राइवर के पास
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">पंप पर जाना व तेल भराना बाकी</p>
        </div>

        <div
          onClick={() => setActiveSubTab('pump_vendors')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">अनुबंधित पेट्रोल पंप</span>
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <Building2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-700 font-mono">{fuelPumpVendors.length}</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              Active Tie-up
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">IOCL, BPCL, HPCL क्रेडिट खाते</p>
        </div>

        <div
          onClick={() => setActiveSubTab('monthly_bills')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">मासिक वेंडर बिल बकाया</span>
            <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              <IndianRupee className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-rose-700 font-mono">
              {formatCurrency(pendingBillsTotal)}
            </span>
            <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
              देय (Due)
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {fuelVendorBills.filter((b) => b.paymentStatus !== 'paid').length} बिल भुगतान हेतु लंबित
          </p>
        </div>

        <div
          onClick={() => setActiveSubTab('all_refills')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">माह की कुल डीजल खपत</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-800 font-mono">{totalFuelLitersThisMonth}</span>
            <span className="text-[10px] text-slate-500 font-bold">Liters / Kg</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">चालू माह में गाड़ियों में भरा ईंधन</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('slips')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'slips'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>ईंधन पर्ची / इंडेंट (Fuel Slips)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeSubTab === 'slips' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {fuelSlips.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('monthly_bills')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'monthly_bills'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>मासिक वेंडर बिल व गाड़ी-वार हिसाब (Monthly Bills)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeSubTab === 'monthly_bills' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {fuelVendorBills.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('pump_vendors')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'pump_vendors'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>अनुबंधित पेट्रोल पंप वेंडर (Fuel Pumps)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeSubTab === 'pump_vendors' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {fuelPumpVendors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('all_refills')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'all_refills'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>फिक्स बजट मॉनिटर व सम्पूर्ण लॉग (Fixed Budget &amp; All Logs)</span>
        </button>
      </div>

      {/* TAB 1: FUEL SLIPS (पर्ची जारी व ट्रैकिंग) */}
      {activeSubTab === 'slips' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-semibold">स्थिति:</span>
                <select
                  value={slipStatusFilter}
                  onChange={(e) => setSlipStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="all">All Status (सभी पर्चियां)</option>
                  <option value="issued">पर्ची जारी (Issued - Ready to Fill)</option>
                  <option value="filled">भरा गया (Filled - Recvd at Office)</option>
                  <option value="billed">बिल में शामिल (Billed by Vendor)</option>
                  <option value="cancelled">रद्द (Cancelled)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">पंप:</span>
                <select
                  value={slipPumpFilter}
                  onChange={(e) => setSlipPumpFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Pumps (सभी पंप)</option>
                  {fuelPumpVendors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">गाड़ी:</span>
                <select
                  value={slipVehicleFilter}
                  onChange={(e) => setSlipVehicleFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Vehicles (सभी गाड़ियां)</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="पर्ची नं, गाड़ी या ड्राइवर खोजें..."
                value={slipSearch}
                onChange={(e) => setSlipSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-full sm:w-56"
              />
            </div>
          </div>

          {/* Slips List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Slip No &amp; Date</th>
                    <th className="py-2.5 px-3">Vehicle &amp; Model</th>
                    <th className="py-2.5 px-3">Driver</th>
                    <th className="py-2.5 px-3">Authorized Pump</th>
                    <th className="py-2.5 px-3">Authorized Qty</th>
                    <th className="py-2.5 px-3">Actual Refill (डीजल भराई)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSlips.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        <Fuel className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold">कोई ईंधन पर्ची नहीं मिली।</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          ऊपर '+ नई फ्यूल पर्ची काटें' बटन से नई पर्ची जारी करें।
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredSlips.map((slip) => (
                      <tr key={slip.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-indigo-900 text-xs flex items-center gap-1">
                            <span>{slip.slipNumber}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {formatDate(slip.issueDate)} {slip.issueTime || ''}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-mono font-black text-slate-900 bg-yellow-300 text-[11px] px-1.5 py-0.5 rounded border border-yellow-500 inline-block">
                            {slip.vehicleNumber}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{slip.vehicleModel || 'Fleet Vehicle'}</div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{slip.driverName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{slip.driverPhone || 'No Phone'}</div>
                        </td>

                        <td className="py-2.5 px-3 max-w-xs">
                          <div className="font-semibold text-slate-800">{slip.pumpVendorName}</div>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1 rounded border border-indigo-200">
                            {slip.fuelType}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">
                            {slip.authorizedQuantityType === 'full_tank'
                              ? 'Full Tank'
                              : slip.authorizedQuantityType === 'fixed_amount'
                              ? `₹${slip.authorizedValue}`
                              : `${slip.authorizedValue} Liters`}
                          </div>
                          {slip.openingOdometerKm ? (
                            <div className="text-[10px] font-mono text-slate-500">
                              Odo: {slip.openingOdometerKm.toLocaleString()} KM
                            </div>
                          ) : null}
                        </td>

                        <td className="py-2.5 px-3">
                          {slip.status === 'filled' || slip.status === 'billed' ? (
                            <div>
                              <div className="font-mono font-bold text-emerald-800">
                                {slip.actualLiters} L @ ₹{slip.ratePerLiter} = {formatCurrency(slip.totalAmount || 0)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Rec: {slip.pumpReceiptNumber || 'N/A'} &bull; {slip.fillDate}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-700 italic">पंप से भराई बाकी...</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              slip.status === 'billed'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : slip.status === 'filled'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : slip.status === 'cancelled'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {slip.status === 'billed'
                              ? 'Billed (बिल में शामिल)'
                              : slip.status === 'filled'
                              ? 'Filled (भरा गया)'
                              : slip.status === 'cancelled'
                              ? 'Cancelled'
                              : 'Issued (पर्ची जारी)'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1.5">
                          {slip.status === 'issued' && (
                            <button
                              onClick={() => setFillingSlip(slip)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors shadow-xs"
                            >
                              भराई दर्ज करें
                            </button>
                          )}
                          <button
                            onClick={() => setPrintingSlip(slip)}
                            title="पर्ची प्रिंट करें"
                            className="p-1 border border-slate-300 rounded text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setPrintingSlip(slip);
                            }}
                            title="WhatsApp करें"
                            className="p-1 border border-emerald-300 rounded text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY FUEL VENDOR BILLS (मासिक वेंडर बिल व गाड़ी-वार हिसाब) */}
      {activeSubTab === 'monthly_bills' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                पेट्रोल पंप वेंडर के मासिक बिल व गाड़ी-वार विवरण (Monthly Fuel Vendor Bills)
              </h3>
              <p className="text-xs text-slate-500">
                महीने के अंत में वेंडर से आया बिल दर्ज करें जिसमें किस गाड़ी में कितना ईंधन पड़ा और क्या दर लगी उसका पूरा ब्रेकडाउन रहता है
              </p>
            </div>
            <button
              onClick={() => setIsCreateBillModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              + नया मासिक वेंडर बिल दर्ज करें
            </button>
          </div>

          {fuelVendorBills.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">अभी कोई मासिक वेंडर बिल दर्ज नहीं है</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                जब पेट्रोल पंप वेंडर महीने के अंत में सभी पर्चियों का कुल बिल भेजे, तो आप '+ नया मासिक वेंडर बिल दर्ज करें' पर क्लिक करें। सिस्टम आपकी भरी हुई पर्चियों को स्वतः गाड़ी-वार जोड़कर बिल तैयार कर देगा!
              </p>
              <button
                onClick={() => setIsCreateBillModalOpen(true)}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
              >
                पहला मासिक बिल तैयार करें
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fuelVendorBills.map((bill) => (
                <div
                  key={bill.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-indigo-300 transition-all cursor-pointer group"
                  onClick={() => setSelectedBillForDetail(bill)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {bill.billNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            bill.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {bill.paymentStatus === 'paid' ? 'Paid / चुकता' : 'Payment Pending'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs mt-1">{bill.pumpVendorName}</div>
                      <div className="text-[11px] text-slate-500">
                        माह: <span className="font-bold text-indigo-700">{bill.monthYear}</span> &bull; बिल तारीख: {formatDate(bill.billDate)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Net Payable</span>
                      <span className="font-mono font-black text-emerald-700 text-base">
                        {formatCurrency(bill.netPayable)}
                      </span>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-semibold uppercase">Total Fuel:</span>
                      <span className="font-mono font-bold text-slate-900">{bill.totalLiters.toFixed(1)} Liters</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-semibold uppercase">Billed Vehicles:</span>
                      <span className="font-bold text-slate-900">{bill.vehicleBreakdown.length} गाड़ियां</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-semibold uppercase">Slips Reconciled:</span>
                      <span className="font-bold text-indigo-700">{bill.reconciledSlipsCount} पर्चियां</span>
                    </div>
                  </div>

                  {/* Vehicle Breakdown Preview Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      गाड़ी-वार खपत पूर्वावलोकन (Preview):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {bill.vehicleBreakdown.slice(0, 4).map((vb) => (
                        <span
                          key={vb.vehicleId}
                          className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-700 font-mono"
                        >
                          <strong>{vb.vehicleNumber}</strong>: {vb.totalLiters}L ({formatCurrency(vb.totalAmount)})
                        </span>
                      ))}
                      {bill.vehicleBreakdown.length > 4 && (
                        <span className="text-[10px] text-indigo-600 font-bold self-center">
                          +{bill.vehicleBreakdown.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:underline">
                      गाड़ी-वार पूरा विवरण व प्रिंट देखें &rarr;
                    </span>
                    {bill.paymentStatus !== 'paid' && (
                      <span className="text-rose-600 font-semibold text-[11px]">
                        भुगतान करना बाकी
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TIED-UP FUEL PUMP VENDORS (अनुबंधित पेट्रोल पंप वेंडर) */}
      {activeSubTab === 'pump_vendors' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                अनुबंधित पेट्रोल पंप वेंडर (Tied-up Credit Petrol Pumps)
              </h3>
              <p className="text-xs text-slate-500">
                जिन पेट्रोल पंपों से हमारा फिक्स टाई-अप / मासिक क्रेडिट खाता है
              </p>
            </div>
            <button
              onClick={() => setEditingPumpVendor('new')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              + नया पेट्रोल पंप जोड़ें
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fuelPumpVendors.map((pump) => {
              const pumpSlips = fuelSlips.filter((s) => s.pumpVendorId === pump.id);
              const pumpBills = fuelVendorBills.filter((b) => b.pumpVendorId === pump.id);
              const totalLitersDispensed = pumpSlips
                .filter((s) => s.status === 'filled' || s.status === 'billed')
                .reduce((sum, s) => sum + (s.actualLiters || 0), 0);

              return (
                <div
                  key={pump.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          pump.stationBrand === 'IOCL'
                            ? 'bg-amber-100 text-amber-800'
                            : pump.stationBrand === 'BPCL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {pump.stationBrand} Station
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{pump.name}</h4>
                      <p className="text-[11px] text-slate-500">{pump.location}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact Person:</span>
                      <span className="font-semibold text-slate-900">{pump.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mobile / Phone:</span>
                      <span className="font-mono font-bold text-indigo-700">{pump.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Billing Cycle:</span>
                      <span className="font-semibold text-slate-900">हर माह {pump.billingCycleDay} तारीख</span>
                    </div>
                    {pump.creditLimit ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Credit Line:</span>
                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(pump.creditLimit)}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
                      <span className="text-[10px] text-indigo-700 block uppercase font-bold">Slips Issued</span>
                      <span className="font-bold text-indigo-950 font-mono text-sm">{pumpSlips.length} पर्चियां</span>
                    </div>
                    <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 block uppercase font-bold">Total Liters</span>
                      <span className="font-bold text-emerald-950 font-mono text-sm">{totalLitersDispensed.toFixed(1)} L</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => {
                        setSlipPumpFilter(pump.id);
                        setActiveSubTab('slips');
                      }}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      इस पंप की पर्चियां देखें &rarr;
                    </button>
                    <button
                      onClick={() => setEditingPumpVendor(pump)}
                      className="px-2.5 py-1 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-semibold"
                    >
                      संशोधित करें
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: FIXED BUDGET MONITOR & ALL REFILLS */}
      {activeSubTab === 'all_refills' && (
        <div className="space-y-6">
          {/* Monthly Fixed Fuel Budget Summary */}
          <div className="bg-linear-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span>Driver Monthly Fixed Fuel Budget Monitor (मासिक फिक्स फ्यूल बजट स्थिति)</span>
                  <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded border border-purple-400/30">
                    Fixed Fuel Mode
                  </span>
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  जब ड्राइवर को महीने का फिक्स फ्यूल बजट (जैसे ₹12,000 या ₹13,000) दिया जाता है
                </p>
              </div>
              <span className="text-xs font-semibold bg-white/10 px-3 py-1 rounded-lg">
                {fixedBudgetVehicles.length} Vehicles On Fixed Fuel
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixedBudgetVehicles.map((v) => {
                const drv = drivers.find((d) => d.id === v.currentDriverId);
                const curMonth = new Date().toISOString().slice(0, 7);
                const vehFuel = fuelRecords.filter(
                  (r) => r.vehicleId === v.id && r.mode === 'monthly_fixed' && r.date.startsWith(curMonth)
                );
                const spentThisMonth = vehFuel.reduce((sum, r) => sum + r.totalAmount, 0);
                const budget = v.monthlyFixedFuelAmount || 12000;
                const balance = budget - spentThisMonth;
                const percentUsed = Math.min(100, Math.round((spentThisMonth / budget) * 100));

                return (
                  <div
                    key={v.id}
                    className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono font-bold text-sm text-white">{v.vehicleNumber}</div>
                        <div className="text-[11px] text-purple-200">Driver: {drv?.name || 'Unassigned'}</div>
                      </div>
                      <span className="text-[11px] font-bold text-purple-300">
                        Budget: {formatCurrency(budget)}/mo
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-purple-200 mb-1">
                        <span>Spent: {formatCurrency(spentThisMonth)}</span>
                        <span>Remaining: {formatCurrency(balance)}</span>
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percentUsed > 90 ? 'bg-rose-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-purple-200 flex justify-between border-t border-white/10 pt-2">
                      <span>{vehFuel.length} Refills logged this month</span>
                      <span className={balance >= 0 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                        {balance >= 0
                          ? `In Budget (+${formatCurrency(balance)})`
                          : `Exceeded (-${formatCurrency(Math.abs(balance))})`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Refills Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  All Refill Records &amp; Pump Receipts (सम्पूर्ण ईंधन लॉग)
                </h4>
                <p className="text-xs text-slate-500">सभी ईंधन प्रविष्टियां, रसीद, दर व ओडोमीटर इतिहास</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => setIsManualFuelModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  सीधी रसीद दर्ज करें
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date &amp; Receipt</th>
                    <th className="py-2.5 px-3">Vehicle &amp; Driver</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Quantity &amp; Rate</th>
                    <th className="py-2.5 px-3">Odometer</th>
                    <th className="py-2.5 px-3">Station &amp; Notes</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {fuelRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        कोई ईंधन रिकॉर्ड नहीं मिला।
                      </td>
                    </tr>
                  ) : (
                    fuelRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{formatDate(r.date)}</div>
                          <div className="text-[10px] font-mono text-slate-500">{r.receiptNumber}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 font-mono">{r.vehicleNumber}</div>
                          <div className="text-[11px] text-slate-500">{r.driverName}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              r.mode === 'monthly_fixed'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {r.mode === 'monthly_fixed' ? 'Fixed Budget' : 'Actual Slip'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">
                            {r.liters} {r.fuelType === 'CNG' ? 'Kg' : 'Liters'}
                          </div>
                          <div className="text-[10px] text-slate-500">₹{r.ratePerLiter} / unit</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <div>{r.odometerKm.toLocaleString()} KM</div>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs">
                          <div className="font-medium text-slate-800">{r.fuelStation}</div>
                          <div className="text-[10px] text-slate-500 truncate">{r.notes || '-'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(r.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Issue New Fuel Slip Modal */}
      {isIssueSlipModalOpen && (
        <IssueFuelSlipModal
          vehicles={vehicles}
          drivers={drivers}
          fuelPumpVendors={fuelPumpVendors}
          existingSlips={fuelSlips}
          onClose={() => setIsIssueSlipModalOpen(false)}
          onSaveSlip={(newSlip) => {
            onSaveFuelSlip(newSlip);
            setPrintingSlip(newSlip); // open print preview right away
          }}
        />
      )}

      {/* MODAL 2: Print / WhatsApp Slip Modal */}
      {printingSlip && (
        <FuelSlipPrintModal slip={printingSlip} onClose={() => setPrintingSlip(null)} />
      )}

      {/* MODAL 3: Mark Slip Filled Modal */}
      {fillingSlip && (
        <MarkSlipFilledModal
          slip={fillingSlip}
          onClose={() => setFillingSlip(null)}
          onConfirmFill={handleConfirmSlipFill}
        />
      )}

      {/* MODAL 4: Create Monthly Vendor Bill Modal */}
      {isCreateBillModalOpen && (
        <CreateFuelVendorBillModal
          fuelPumpVendors={fuelPumpVendors}
          fuelSlips={fuelSlips}
          vehicles={vehicles}
          onClose={() => setIsCreateBillModalOpen(false)}
          onSaveBill={(bill, linkedSlipIds) => {
            onSaveFuelVendorBill(bill, linkedSlipIds);
            setSelectedBillForDetail(bill);
          }}
        />
      )}

      {/* MODAL 5: Fuel Vendor Bill Detail & Vehicle Breakdown Modal */}
      {selectedBillForDetail && (
        <FuelVendorBillDetailModal
          bill={selectedBillForDetail}
          onClose={() => setSelectedBillForDetail(null)}
          onPayBill={(billId, paymentData) => {
            onPayFuelVendorBill(billId, paymentData);
            setSelectedBillForDetail(null);
          }}
        />
      )}

      {/* MODAL 6: Add / Edit Tied-up Pump Vendor */}
      {editingPumpVendor && (
        <PumpVendorModal
          vendor={editingPumpVendor === 'new' ? null : editingPumpVendor}
          onClose={() => setEditingPumpVendor(null)}
          onSave={onSavePumpVendor}
        />
      )}

      {/* MODAL 7: Direct Fuel Entry Modal */}
      {isManualFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Record Direct Fuel Entry</h3>
              <button onClick={() => setIsManualFuelModalOpen(false)} className="text-slate-400 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleSaveDirectFuel} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Vehicle *</label>
                <select
                  required
                  value={formData.vehicleId || ''}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.makeModel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Liters *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.liters || ''}
                    onChange={(e) => {
                      const lit = Number(e.target.value);
                      const rate = formData.ratePerLiter || 89.6;
                      setFormData({ ...formData, liters: lit, totalAmount: Math.round(lit * rate * 100) / 100 });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.ratePerLiter || ''}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      const lit = formData.liters || 0;
                      setFormData({ ...formData, ratePerLiter: rate, totalAmount: Math.round(lit * rate * 100) / 100 });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.totalAmount || ''}
                    onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualFuelModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

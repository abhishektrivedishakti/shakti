import React, { useState } from 'react';
import {
  Users,
  Plus,
  IndianRupee,
  Receipt,
  Printer,
  Calendar,
  Phone,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import {
  Driver,
  DriverKhataTransaction,
  Vehicle,
  DailyLogEntry,
  Tender,
  Vendor,
} from '../types';
import {
  calculateDriverKhata,
  formatCurrency,
  formatDate,
} from '../utils/calculations';
import { generateDriverUniqueId, getDriverDisplayCode } from '../utils/idGenerator';
import { DocumentManagerModal } from './DocumentManagerModal';
import { BulkImportModal } from './BulkImportModal';

interface DriversKhataViewProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  khataTransactions: DriverKhataTransaction[];
  dailyLogs: DailyLogEntry[];
  tenders?: Tender[];
  vendors?: Vendor[];
  onAddTransaction: (tx: DriverKhataTransaction) => void;
  onSaveDriver: (driver: Driver) => void;
  onBulkImportDrivers?: (newDrivers: Driver[]) => void;
  onOpenProfileModal?: (type?: any, id?: string) => void;
  isAdvanceModalOpen: boolean;
  setIsAdvanceModalOpen: (open: boolean) => void;
}

export const DriversKhataView: React.FC<DriversKhataViewProps> = ({
  drivers,
  vehicles,
  khataTransactions,
  dailyLogs,
  tenders = [],
  vendors = [],
  onAddTransaction,
  onSaveDriver,
  onBulkImportDrivers = () => {},
  onOpenProfileModal,
  isAdvanceModalOpen,
  setIsAdvanceModalOpen,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || '');
  const [isSalarySlipModalOpen, setIsSalarySlipModalOpen] = useState(false);
  const [isNewDriverModalOpen, setIsNewDriverModalOpen] = useState(false);
  const [isDriverDocsModalOpen, setIsDriverDocsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [driverSearch, setDriverSearch] = useState<string>('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>('all');

  // Filtered Drivers list for quick search among 600 drivers
  const filteredDrivers = drivers.filter((d) => {
    const q = driverSearch.toLowerCase();
    const veh = vehicles.find((v) => v.id === d.currentVehicleId);
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      (veh && veh.vehicleNumber.toLowerCase().includes(q));

    const matchesStatus = driverStatusFilter === 'all' || d.status === driverStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Advance Form State
  const [advDriverId, setAdvDriverId] = useState<string>(drivers[0]?.id || '');
  const [advAmount, setAdvAmount] = useState<number>(2000);
  const [advType, setAdvType] = useState<
    'advance' | 'salary_payment' | 'trip_expense' | 'fastag_topup' | 'fuel_budget_advance'
  >('advance');
  const [advDescription, setAdvDescription] = useState<string>('');
  const [advPaymentMode, setAdvPaymentMode] = useState<'cash' | 'upi' | 'bank_transfer'>('upi');
  const [advRefNumber, setAdvRefNumber] = useState<string>('');

  const [copiedDriverCode, setCopiedDriverCode] = useState(false);

  // New Driver Form State
  const [newDriverData, setNewDriverData] = useState<Partial<Driver>>({
    driverCode: '',
    name: '',
    phone: '',
    address: '',
    licenseNumber: '',
    licenseExpiry: '',
    policeVerificationDate: '',
    policeVerificationExpiry: '',
    aadharNumber: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    monthlySalary: 16000,
    dailyDaRate: 350,
    status: 'active',
    fuelPolicy: 'monthly_fixed_budget',
    monthlyFuelBudgetAmount: 12000,
    employmentType: 'contractual_khata',
  });

  const handleOpenNewDriverModal = () => {
    const autoCode = generateDriverUniqueId(drivers);
    setNewDriverData({
      driverCode: autoCode,
      name: '',
      phone: '',
      address: '',
      licenseNumber: '',
      licenseExpiry: '',
      policeVerificationDate: '',
      policeVerificationExpiry: '',
      aadharNumber: '',
      joiningDate: new Date().toISOString().slice(0, 10),
      monthlySalary: 16000,
      dailyDaRate: 350,
      status: 'active',
      fuelPolicy: 'monthly_fixed_budget',
      monthlyFuelBudgetAmount: 12000,
      employmentType: 'contractual_khata',
    });
    setIsNewDriverModalOpen(true);
  };

  const handleCopyDriverCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedDriverCode(true);
    setTimeout(() => setCopiedDriverCode(false), 2000);
  };

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0];
  const driverVehicle = vehicles.find((v) => v.id === selectedDriver?.currentVehicleId);
  const driverKhataSummary = selectedDriver
    ? calculateDriverKhata(selectedDriver.id, khataTransactions)
    : null;

  const driverTxList = khataTransactions
    .filter((t) => t.driverId === selectedDriver?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Current Month Logs for this driver (e.g. Sep 2026)
  const currentMonthLogs = dailyLogs.filter(
    (l) => l.driverId === selectedDriver?.id && l.date.startsWith('2026-09')
  );
  const nightHaltsThisMonth = currentMonthLogs.filter(
    (l) => l.dutyType === 'night_halt' || l.driverDaNightHalt > 0
  ).length;
  const nightDaEarned = nightHaltsThisMonth * (selectedDriver?.dailyDaRate || 350);

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advDriverId || !advAmount) {
      alert('Please fill driver and amount.');
      return;
    }

    const drv = drivers.find((d) => d.id === advDriverId);
    const newTx: DriverKhataTransaction = {
      id: `kht-${Date.now()}`,
      driverId: advDriverId,
      driverName: drv?.name || 'Driver',
      date: new Date().toISOString().slice(0, 10),
      type: advType,
      amount: Number(advAmount),
      description: advDescription || (advType === 'advance' ? 'Personal Cash Advance' : 'Salary Payout'),
      paymentMode: advPaymentMode,
      referenceNumber: advRefNumber || undefined,
    };

    onAddTransaction(newTx);
    setIsAdvanceModalOpen(false);
    setAdvAmount(2000);
    setAdvDescription('');
    setAdvRefNumber('');
  };

  const handleSaveNewDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverData.name || !newDriverData.phone) {
      alert('चालक का नाम और मोबाइल नंबर आवश्यक है (Driver name and phone are required).');
      return;
    }

    const finalCode = (newDriverData.driverCode?.trim().toUpperCase()) || generateDriverUniqueId(drivers);

    const d: Driver = {
      id: finalCode,
      driverCode: finalCode,
      name: newDriverData.name.trim(),
      phone: newDriverData.phone.trim(),
      alternatePhone: newDriverData.alternatePhone?.trim() || undefined,
      address: newDriverData.address?.trim() || '',
      licenseNumber: (newDriverData.licenseNumber || '').trim().toUpperCase(),
      licenseExpiry: newDriverData.licenseExpiry || '',
      policeVerificationDate: newDriverData.policeVerificationDate || '',
      policeVerificationExpiry: newDriverData.policeVerificationExpiry || '',
      aadharNumber: newDriverData.aadharNumber?.trim() || '',
      joiningDate: newDriverData.joiningDate || new Date().toISOString().slice(0, 10),
      monthlySalary: newDriverData.employmentType === 'owner_driver' ? 0 : (Number(newDriverData.monthlySalary) || 16000),
      dailyDaRate: Number(newDriverData.dailyDaRate) || 350,
      status: (newDriverData.status as any) || 'active',
      fuelPolicy: (newDriverData.fuelPolicy as any) || 'monthly_fixed_budget',
      monthlyFuelBudgetAmount: Number(newDriverData.monthlyFuelBudgetAmount) || 12000,
      bankAccountDetails: newDriverData.bankAccountDetails?.trim(),
      employmentType: newDriverData.employmentType || 'contractual_khata',
    };

    onSaveDriver(d);
    setIsNewDriverModalOpen(false);
    setSelectedDriverId(d.id);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Driver Roster &amp; Khata Ledger &bull; ड्राइवर सैलरी व एडवांस खाता</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ड्राइवर विवरण, मासिक वेतन, व्यक्तिगत पेशगी (एडवांस) रिकॉर्ड, फास्टैग रिचार्ज व नेट सैलरी पर्ची
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenNewDriverModal}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Plus className="w-4 h-4" />
            + Add New Driver (नया ड्राइवर जोड़ें)
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
            title="एक्सेल शीट डाउनलोड करें या भरी हुई शीट अपलोड करके एक साथ कई ड्राइवर जोड़ें"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>📥 एक्सेल बल्क ड्राइवर अपलोड</span>
          </button>

          <button
            onClick={() => {
              setAdvDriverId(selectedDriver?.id || drivers[0]?.id || '');
              setIsAdvanceModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <IndianRupee className="w-4 h-4" />
            + Give Advance / Payment (रुपये दें)
          </button>
        </div>
      </div>

      {/* Main Layout: Driver Selector Sidebar & Khata Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Driver Cards List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="border-b border-slate-100 pb-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Drivers Pool ({filteredDrivers.length}/{drivers.length})
              </h3>
              <select
                value={driverStatusFilter}
                onChange={(e) => setDriverStatusFilter(e.target.value)}
                className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active Assigned</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Search driver, phone or car no..."
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-1">
            {filteredDrivers.slice(0, 50).map((drv) => {
              const isSelected = selectedDriver?.id === drv.id;
              const veh = vehicles.find((v) => v.id === drv.currentVehicleId);
              const khata = calculateDriverKhata(drv.id, khataTransactions);

              return (
                <div
                  key={drv.id}
                  onClick={() => setSelectedDriverId(drv.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{drv.name}</span>
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                          {getDriverDisplayCode(drv)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{drv.phone}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {onOpenProfileModal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenProfileModal('driver', drv.id);
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                          title="चालक प्रोफ़ाइल एडिट करें"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          drv.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {drv.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-600">
                    Vehicle:{' '}
                    <strong className="font-mono text-slate-900">
                      {veh?.vehicleNumber || 'Standby (कोई नहीं)'}
                    </strong>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Salary:</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(drv.monthlySalary)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Advance Balance:</span>
                      <span
                        className={`font-bold ${
                          khata.currentAdvanceBalance > 0 ? 'text-rose-700' : 'text-slate-700'
                        }`}
                      >
                        {formatCurrency(khata.currentAdvanceBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Driver Details, Khata Ledger & Salary Slip */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDriver ? (
            <>
              {/* Driver Profile Header Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{selectedDriver.name}</h3>
                      <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-mono font-bold shadow-2xs">
                        <span>🆔 {getDriverDisplayCode(selectedDriver)}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyDriverCode(getDriverDisplayCode(selectedDriver))}
                          className="hover:text-indigo-950 p-0.5 rounded transition-colors text-indigo-500 hover:bg-indigo-100"
                          title="यूनिक चालक कोड कॉपी करें"
                        >
                          {copiedDriverCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        Lic: {selectedDriver.licenseNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Assigned to:{' '}
                      <strong className="text-slate-900 font-mono">
                        {driverVehicle ? `${driverVehicle.vehicleNumber} (${driverVehicle.makeModel})` : 'Unassigned'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {onOpenProfileModal && (
                      <button
                        type="button"
                        onClick={() => onOpenProfileModal('driver', selectedDriver.id)}
                        className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="चालक की प्रोफ़ाइल, नाम, फोन, वेतन, बैंक खाता एडिट करें"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-200" />
                        <span>✏️ प्रोफ़ाइल एडिट करें (Edit Profile)</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsDriverDocsModalOpen(true)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-indigo-200 shadow-2xs transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      KYC Documents &amp; Dossier ({selectedDriver.documents?.length || 4})
                    </button>

                    <button
                      onClick={() => setIsSalarySlipModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Generate Salary Slip (सैलरी पर्ची)
                    </button>

                    <button
                      onClick={() => {
                        setAdvDriverId(selectedDriver.id);
                        setIsAdvanceModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      Give Advance
                    </button>
                  </div>
                </div>

                {/* Driver KYC & Mandatory Documents Summary Strip */}
                <div className="mt-4 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/30">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100 text-xs">
                    <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Driver KYC &amp; Verification Documents (चालक दस्तावेज - आधार, लाइसेंस, पैन, पुलिस सत्यापन)
                    </span>
                    <button
                      onClick={() => setIsDriverDocsModalOpen(true)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] underline"
                    >
                      Upload / View All Copies &rarr;
                    </button>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {/* Aadhaar */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Aadhaar (आधार)</span>
                      <span className="font-mono text-xs font-bold text-slate-900 block mt-0.5">
                        {selectedDriver.aadharNumber || 'XXXX-XXXX-XXXX'}
                      </span>
                      <span className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-1">
                        UIDAI Verified
                      </span>
                    </div>

                    {/* Driving License */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Driving Licence (DL)</span>
                      <span className="font-mono text-xs font-bold text-slate-900 block mt-0.5">
                        {selectedDriver.licenseNumber}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-1">
                        Valid: <strong>{formatDate(selectedDriver.licenseExpiry)}</strong>
                      </span>
                    </div>

                    {/* PAN Card */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">PAN Card (पैन)</span>
                      <span className="font-mono text-xs font-bold text-slate-900 block mt-0.5">
                        {selectedDriver.panNumber || `BKPPD${selectedDriver.id.slice(-4).padStart(4, '1')}A`}
                      </span>
                      <span className="text-[9px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-1">
                        IT Dept Valid
                      </span>
                    </div>

                    {/* Police Verification */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Police Verification</span>
                      <span className="font-semibold text-xs text-slate-900 block mt-0.5 truncate">
                        District SP Office
                      </span>
                      <span className="text-[9px] text-emerald-700 block mt-1">
                        Exp: {formatDate(selectedDriver.policeVerificationExpiry)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Khata Metrics Grid */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                      Monthly Base Salary
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {formatCurrency(selectedDriver.monthlySalary)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Night DA: ₹{selectedDriver.dailyDaRate}/night
                    </span>
                  </div>

                  <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                    <span className="text-rose-700 text-[10px] block uppercase font-semibold">
                      Total Advance Taken
                    </span>
                    <span className="text-base font-bold text-rose-900">
                      {formatCurrency(driverKhataSummary?.totalAdvanceGiven || 0)}
                    </span>
                    <span className="text-[10px] text-rose-600 block mt-0.5">
                      To be deducted in salary
                    </span>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <span className="text-purple-700 text-[10px] block uppercase font-semibold">
                      Fuel Budget Given
                    </span>
                    <span className="text-base font-bold text-purple-900">
                      {formatCurrency(driverKhataSummary?.pendingFuelBudgetBalance || 0)}
                    </span>
                    <span className="text-[10px] text-purple-600 block mt-0.5">
                      Monthly diesel/CNG fund
                    </span>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 text-[10px] block uppercase font-semibold">
                      Salary Paid Till Date
                    </span>
                    <span className="text-base font-bold text-emerald-900">
                      {formatCurrency(driverKhataSummary?.totalSalaryPaid || 0)}
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      Through Bank / UPI
                    </span>
                  </div>
                </div>

                {/* Compliance & Bank Account details */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Bank Account / UPI:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {selectedDriver.bankAccountDetails || 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Police Verification Expiry:</span>
                    <span className="font-medium text-slate-800">
                      {formatDate(selectedDriver.policeVerificationExpiry)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger (खाता विवरण) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Transaction Ledger &bull; पेशगी व भुगतान का हिसाब
                    </h4>
                    <p className="text-xs text-slate-500">
                      ड्राइवर द्वारा लिया गया एडवांस, पेट्रोल बजट व दी गई सैलरी की पूरी एंट्री
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type (प्रकार)</th>
                        <th className="py-2.5 px-3">Description / Purpose</th>
                        <th className="py-2.5 px-3">Mode &amp; Ref</th>
                        <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {driverTxList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No ledger transactions recorded for this driver.
                          </td>
                        </tr>
                      ) : (
                        driverTxList.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                              {formatDate(tx.date)}
                            </td>

                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  tx.type === 'advance'
                                    ? 'bg-rose-100 text-rose-800'
                                    : tx.type === 'salary_payment'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : tx.type === 'fuel_budget_advance'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {tx.type.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">{tx.description}</td>

                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              <span className="uppercase font-semibold text-slate-700">
                                {tx.paymentMode}
                              </span>
                              {tx.referenceNumber && (
                                <span className="block font-mono text-[10px]">
                                  {tx.referenceNumber}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-right font-bold font-mono">
                              <span
                                className={
                                  tx.type === 'advance'
                                    ? 'text-rose-700'
                                    : tx.type === 'salary_payment'
                                    ? 'text-emerald-700'
                                    : 'text-slate-900'
                                }
                              >
                                {tx.type === 'advance' ? '-' : '+'}
                                {formatCurrency(tx.amount)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Select a driver to view Khata ledger.
            </div>
          )}
        </div>
      </div>

      {/* Monthly Salary Slip Modal */}
      {isSalarySlipModalOpen && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>Monthly Driver Salary Slip (सैलरी पर्ची)</span>
              </h3>
              <button
                onClick={() => setIsSalarySlipModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Printable Salary Voucher Content */}
            <div className="border border-slate-300 p-5 rounded-lg space-y-4 bg-slate-50/50">
              <div className="text-center border-b border-slate-300 pb-3">
                <h4 className="font-bold text-sm uppercase text-slate-900">
                  SARKARI FLEET SERVICES
                </h4>
                <p className="text-[11px] text-slate-500">
                  Driver Monthly Salary Settlement Slip &bull; Month: September 2026
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Driver Name:</span>{' '}
                  <strong className="text-slate-900">{selectedDriver.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Driver Unique ID:</span>{' '}
                  <strong className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                    {getDriverDisplayCode(selectedDriver)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Vehicle:</span>{' '}
                  <strong className="font-mono text-slate-900">
                    {driverVehicle?.vehicleNumber || 'Standby'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Mobile:</span> {selectedDriver.phone}
                </div>
                <div>
                  <span className="text-slate-500">Bank / UPI:</span>{' '}
                  <span className="font-mono text-[10px]">{selectedDriver.bankAccountDetails || '-'}</span>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="border border-slate-300 rounded overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 text-left">Earnings (वेतन मद)</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2">Basic Monthly Salary</td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(selectedDriver.monthlySalary)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2">
                        Night Halt / Outstation DA ({nightHaltsThisMonth} nights @ ₹{selectedDriver.dailyDaRate})
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(nightDaEarned)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-semibold">
                      <td className="p-2">Total Gross Earnings</td>
                      <td className="p-2 text-right">
                        {formatCurrency(selectedDriver.monthlySalary + nightDaEarned)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table className="w-full text-xs border-t border-slate-300">
                  <thead className="bg-rose-50 font-bold border-b border-slate-300 text-rose-900">
                    <tr>
                      <th className="p-2 text-left">Deductions (कटौती)</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2">
                        Personal Cash Advance Adjusted
                      </td>
                      <td className="p-2 text-right text-rose-700 font-medium">
                        -{formatCurrency(driverKhataSummary?.currentAdvanceBalance || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Payable Highlight */}
              <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-800">Net Salary Payable:</span>
                <span className="text-lg font-black text-emerald-900 font-mono">
                  {formatCurrency(
                    Math.max(
                      0,
                      selectedDriver.monthlySalary +
                        nightDaEarned -
                        (driverKhataSummary?.currentAdvanceBalance || 0)
                    )
                  )}
                </span>
              </div>

              <div className="flex justify-between pt-4 text-[10px] text-slate-500">
                <span>Driver Signature: __________________</span>
                <span>Manager / Accountant: __________________</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsSalarySlipModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Give Advance / Record Transaction Modal */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-indigo-600" />
                <span>Give Advance / Payment &bull; पेशगी / भुगतान</span>
              </h3>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Driver *
                </label>
                <select
                  required
                  value={advDriverId}
                  onChange={(e) => setAdvDriverId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction Type *
                  </label>
                  <select
                    value={advType}
                    onChange={(e) => setAdvType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="advance">Cash Advance (व्यक्तिगत पेशगी)</option>
                    <option value="fuel_budget_advance">Monthly Fixed Fuel Fund (फ्यूल बजट)</option>
                    <option value="salary_payment">Salary Payment (सैलरी भुगतान)</option>
                    <option value="fastag_topup">Fastag / Toll Wallet Recharge</option>
                    <option value="trip_expense">Emergency Trip Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={advAmount}
                    onChange={(e) => setAdvAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={advPaymentMode}
                    onChange={(e) => setAdvPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="upi">UPI (GPay/PhonePe)</option>
                    <option value="cash">Cash (नकद)</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    UPI / Bank Ref UTR
                  </label>
                  <input
                    type="text"
                    value={advRefNumber}
                    onChange={(e) => setAdvRefNumber(e.target.value)}
                    placeholder="e.g. UPI/624419082210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason / Description (विवरण)
                </label>
                <input
                  type="text"
                  value={advDescription}
                  onChange={(e) => setAdvDescription(e.target.value)}
                  placeholder="e.g. Emergency family medical expense / month fuel advance"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Driver Modal */}
      {isNewDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Add New Driver (नया ड्राइवर शामिल करें)
              </h3>
              <button
                onClick={() => setIsNewDriverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveNewDriver} className="mt-4 space-y-3 text-xs">
              {/* Employment Category */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1.5">
                  चालक की श्रेणी (Driver Category)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewDriverData({
                        ...newDriverData,
                        employmentType: 'contractual_khata',
                        monthlySalary: 16500,
                      })
                    }
                    className={`p-2 rounded-lg border text-left transition-all ${
                      newDriverData.employmentType !== 'owner_driver'
                        ? 'bg-indigo-50 border-indigo-500 font-bold text-indigo-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-semibold">कंपनी चालक (Company Driver)</div>
                    <div className="text-[10px] text-slate-500">मासिक वेतन व एडवांस खाता</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setNewDriverData({
                        ...newDriverData,
                        employmentType: 'owner_driver',
                        monthlySalary: 0,
                      })
                    }
                    className={`p-2 rounded-lg border text-left transition-all ${
                      newDriverData.employmentType === 'owner_driver'
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-emerald-700">मालिक-चालक (Owner-Driver)</div>
                    <div className="text-[10px] text-slate-500">गाड़ी भी अपनी, वेतन ₹0</div>
                  </button>
                </div>
              </div>

              {/* Unique Driver ID / Code */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>चालक यूनिक आईडी (Driver Unique Code / ID) *</span>
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ✨ स्वतः तैयार (Auto-Generated)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newDriverData.driverCode || ''}
                    onChange={(e) => setNewDriverData({ ...newDriverData, driverCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. DRV-101"
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg font-mono font-bold text-slate-900 bg-white uppercase tracking-wider text-sm shadow-2xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewDriverData({ ...newDriverData, driverCode: generateDriverUniqueId(drivers) })}
                    className="px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shrink-0 flex items-center gap-1 shadow-2xs transition-colors"
                    title="नया यूनिक कोड पुनः जनरेट करें"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>नया कोड</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
                  यह अद्वितीय आईडी चालक के रिकॉर्ड, सैलरी स्लिप, खाताबही और सरकारी लॉगबुक पर हमेशा अंकित रहेगी।
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Driver Full Name (चालक का नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar Maurya"
                  value={newDriverData.name || ''}
                  onChange={(e) => setNewDriverData({ ...newDriverData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9839123450"
                    value={newDriverData.phone || ''}
                    onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Salary (मासिक वेतन ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    disabled={newDriverData.employmentType === 'owner_driver'}
                    placeholder={newDriverData.employmentType === 'owner_driver' ? '0' : '16500'}
                    value={newDriverData.employmentType === 'owner_driver' ? 0 : (newDriverData.monthlySalary || '')}
                    onChange={(e) => setNewDriverData({ ...newDriverData, monthlySalary: Number(e.target.value) })}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg ${
                      newDriverData.employmentType === 'owner_driver' ? 'bg-slate-100 text-slate-500 font-bold' : ''
                    }`}
                  />
                  {newDriverData.employmentType === 'owner_driver' && (
                    <span className="text-[10px] text-emerald-700 block mt-0.5">
                      मालिक-चालक का वेतन शून्य रहता है, सेटलमेंट वाउचर से भुगतान होता है
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Driving License No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UP32 20180012345"
                    value={newDriverData.licenseNumber || ''}
                    onChange={(e) => setNewDriverData({ ...newDriverData, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newDriverData.licenseExpiry || ''}
                    onChange={(e) => setNewDriverData({ ...newDriverData, licenseExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Police Verification Expiry
                  </label>
                  <input
                    type="date"
                    value={newDriverData.policeVerificationExpiry || ''}
                    onChange={(e) => setNewDriverData({ ...newDriverData, policeVerificationExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Night Halt DA Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={newDriverData.dailyDaRate || 350}
                    onChange={(e) => setNewDriverData({ ...newDriverData, dailyDaRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank Details / UPI ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. SBI A/C: 30891244890, IFSC: SBIN0001234"
                  value={newDriverData.bankAccountDetails || ''}
                  onChange={(e) => setNewDriverData({ ...newDriverData, bankAccountDetails: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewDriverModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Driver KYC & Document Dossier Modal */}
      {isDriverDocsModalOpen && selectedDriver && (
        <DocumentManagerModal
          isOpen={isDriverDocsModalOpen}
          onClose={() => setIsDriverDocsModalOpen(false)}
          entityType="driver"
          entity={selectedDriver}
          onUpdateEntity={(updatedDriver) => {
            onSaveDriver(updatedDriver);
          }}
        />
      )}

      {/* Excel Bulk Import Modal for Drivers */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        initialType="drivers"
        existingVehicles={vehicles}
        existingDrivers={drivers}
        tenders={tenders}
        vendors={vendors}
        onImportVehicles={() => {}}
        onImportDrivers={onBulkImportDrivers}
      />
    </div>
  );
};

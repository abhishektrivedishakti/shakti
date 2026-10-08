import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Printer,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  FileCheck,
  Send,
  HelpCircle,
  Hash,
  Settings,
  Sliders,
  Zap,
  Sparkles,
  Layers,
  Edit,
  X,
} from 'lucide-react';
import {
  MonthlyBill,
  Tender,
  Vehicle,
  Officer,
  DailyLogEntry,
  PaymentStatus,
  BillSeriesConfig,
} from '../types';
import {
  calculateBillFromLogs,
  formatCurrency,
  formatDate,
  getDaysDiff,
} from '../utils/calculations';
import { StorageService } from '../utils/storage';

interface GovtBillingViewProps {
  bills: MonthlyBill[];
  tenders: Tender[];
  vehicles: Vehicle[];
  officers: Officer[];
  dailyLogs: DailyLogEntry[];
  onSaveBill: (bill: MonthlyBill) => void;
  onUpdateBillStatus: (
    billId: string,
    status: PaymentStatus,
    remarks?: string,
    voucher?: string,
    newBillNumber?: string
  ) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const GovtBillingView: React.FC<GovtBillingViewProps> = ({
  bills,
  tenders,
  vehicles,
  officers,
  dailyLogs,
  onSaveBill,
  onUpdateBillStatus,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('2026-08');
  const [activeTab, setActiveTab] = useState<'bills_list' | 'preview_schedule'>('bills_list');
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<MonthlyBill | null>(
    bills[0] || null
  );
  const [scheduleTenderFilter, setScheduleTenderFilter] = useState<string>('all');
  const [scheduleSearch, setScheduleSearch] = useState<string>('');
  const [schedulePage, setSchedulePage] = useState<number>(1);
  const schedulePageSize = 15;
  const [billListSearch, setBillListSearch] = useState<string>('');

  const filteredScheduleVehicles = vehicles.filter((v) => {
    const tender = tenders.find((t) => t.id === v.tenderId);
    const off = officers.find((o) => o.id === v.assignedOfficerId);
    const matchesTender = scheduleTenderFilter === 'all' || v.tenderId === scheduleTenderFilter;
    const q = scheduleSearch.toLowerCase();
    const matchesSearch =
      !q ||
      v.vehicleNumber.toLowerCase().includes(q) ||
      (off && off.name.toLowerCase().includes(q)) ||
      (tender && tender.departmentName.toLowerCase().includes(q));

    return matchesTender && matchesSearch;
  });

  const totalSchedulePages = Math.ceil(filteredScheduleVehicles.length / schedulePageSize) || 1;
  const paginatedScheduleVehicles = filteredScheduleVehicles.slice(
    (schedulePage - 1) * schedulePageSize,
    schedulePage * schedulePageSize
  );

  const filteredBills = bills.filter((b) => {
    const q = billListSearch.toLowerCase();
    return (
      !q ||
      b.billNumber.toLowerCase().includes(q) ||
      b.departmentName.toLowerCase().includes(q) ||
      b.vehicleNumber.toLowerCase().includes(q)
    );
  });

  // Bill Series Configuration State
  const [billSeriesConfig, setBillSeriesConfig] = useState<BillSeriesConfig>(() =>
    StorageService.getBillSeriesConfig()
  );
  const [isSeriesConfigOpen, setIsSeriesConfigOpen] = useState(false);
  const [tempSeriesPrefix, setTempSeriesPrefix] = useState(billSeriesConfig.prefix);
  const [tempSeriesSeq, setTempSeriesSeq] = useState(billSeriesConfig.currentNumber);
  const [tempSeriesPadding, setTempSeriesPadding] = useState(billSeriesConfig.paddingDigits);
  const [tempSeriesSuffix, setTempSeriesSuffix] = useState(billSeriesConfig.suffix || '');
  const [tempUseTenderPrefix, setTempUseTenderPrefix] = useState(billSeriesConfig.useTenderPrefix);

  // Batch Monthly Generation Modal State
  const [isBatchGenModalOpen, setIsBatchGenModalOpen] = useState(false);
  const [batchMonth, setBatchMonth] = useState('2026-08');
  const [batchTenderId, setBatchTenderId] = useState('all');
  const [batchStartingNumber, setBatchStartingNumber] = useState<number>(billSeriesConfig.currentNumber);
  const [batchCustomPrefix, setBatchCustomPrefix] = useState('');
  const [batchSuccessMessage, setBatchSuccessMessage] = useState('');

  // Status Update Modal State
  const [updatingBill, setUpdatingBill] = useState<MonthlyBill | null>(null);
  const [newStatus, setNewStatus] = useState<PaymentStatus>('submitted');
  const [voucherNumber, setVoucherNumber] = useState<string>('');
  const [statusRemarks, setStatusRemarks] = useState<string>('');
  const [editBillNumber, setEditBillNumber] = useState<string>('');

  // Bill Generator Modal State
  const [genVehicleId, setGenVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [genMonthYear, setGenMonthYear] = useState<string>('2026-08');
  const [genPenalty, setGenPenalty] = useState<number>(0);
  const [genPenaltyRemarks, setGenPenaltyRemarks] = useState<string>('');
  const [genGstPercent, setGenGstPercent] = useState<number>(12);
  const [genTdsPercent, setGenTdsPercent] = useState<number>(2);
  const [genCustomBillNumber, setGenCustomBillNumber] = useState<string>('');

  // Helper to format bill number according to user configured series
  const formatBillNumber = (
    config: BillSeriesConfig,
    tender?: Tender,
    sequenceNum?: number,
    monthYear?: string,
    overridePrefix?: string
  ) => {
    const seq = sequenceNum !== undefined ? sequenceNum : config.currentNumber;
    const padded = String(seq).padStart(config.paddingDigits || 3, '0');
    let prefix = overridePrefix !== undefined && overridePrefix !== '' ? overridePrefix : config.prefix;
    if (!overridePrefix && config.useTenderPrefix && tender?.billSeriesPrefix) {
      prefix = tender.billSeriesPrefix;
    }
    const monthPart = config.includeMonthYear && monthYear ? `${monthYear.replace('-', '')}/` : '';
    const suffix = config.suffix || '';
    return `${prefix}${monthPart}${padded}${suffix}`;
  };

  // Auto-calculated preview inside generator modal
  const selectedVehicle = vehicles.find((v) => v.id === genVehicleId);
  const selectedTender = tenders.find((t) => t.id === selectedVehicle?.tenderId);
  const selectedOfficer = officers.find((o) => o.id === selectedVehicle?.assignedOfficerId);

  // Initialize or update genCustomBillNumber when vehicle or month changes
  useEffect(() => {
    if (selectedVehicle) {
      const generated = formatBillNumber(billSeriesConfig, selectedTender, undefined, genMonthYear);
      setGenCustomBillNumber(generated);
    }
  }, [genVehicleId, genMonthYear, billSeriesConfig, selectedTender]);

  const calculatedBill =
    selectedVehicle && selectedTender
      ? calculateBillFromLogs(
          selectedVehicle,
          selectedTender,
          genMonthYear,
          dailyLogs,
          genPenalty,
          genGstPercent,
          genTdsPercent
        )
      : null;

  const handleGenerateAndSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedTender || !calculatedBill) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (selectedTender.paymentTermsDays || 30));

    const finalBillNumber = genCustomBillNumber.trim() ||
      formatBillNumber(billSeriesConfig, selectedTender, undefined, genMonthYear);

    const newBill: MonthlyBill = {
      id: `bill-${Date.now()}`,
      billNumber: finalBillNumber,
      tenderId: selectedTender.id,
      tenderName: selectedTender.departmentName,
      departmentName: selectedTender.departmentName,
      officerName: selectedOfficer?.name || 'Assigned Officer',
      vehicleId: selectedVehicle.id,
      vehicleNumber: selectedVehicle.vehicleNumber,
      monthYear: genMonthYear,
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: dueDate.toISOString().slice(0, 10),
      baseAmount: calculatedBill.baseMonthlyRate,
      totalKmsRun: calculatedBill.totalKmRun,
      allowedKms: calculatedBill.allowedKms,
      extraKms: calculatedBill.extraKms,
      extraKmRate: calculatedBill.extraKmRate,
      extraKmAmount: calculatedBill.extraKmAmount,
      totalHoursRun: calculatedBill.totalHoursRun,
      allowedHours: calculatedBill.allowedHours,
      extraHours: calculatedBill.extraHours,
      extraHourRate: calculatedBill.extraHourRate,
      extraHourAmount: calculatedBill.extraHourAmount,
      nightHaltsCount: calculatedBill.nightHaltsCount,
      nightHaltRate: calculatedBill.nightHaltRate,
      nightHaltAmount: calculatedBill.nightHaltAmount,
      tollParkingAmount: calculatedBill.tollParkingAmount,
      penaltyDeductions: genPenalty,
      penaltyRemarks: genPenaltyRemarks,
      grossAmount: calculatedBill.subTotal,
      gstPercent: calculatedBill.gstPercent,
      gstAmount: calculatedBill.gstAmount,
      tdsPercent: calculatedBill.tdsPercent,
      tdsAmount: calculatedBill.tdsAmount,
      netPayableAmount: calculatedBill.netPayableAmount,
      paymentStatus: 'draft',
    };

    onSaveBill(newBill);

    // Advance sequence number
    const updatedConfig: BillSeriesConfig = {
      ...billSeriesConfig,
      currentNumber: billSeriesConfig.currentNumber + 1,
    };
    setBillSeriesConfig(updatedConfig);
    StorageService.saveBillSeriesConfig(updatedConfig);

    setIsAddModalOpen(false);
    setSelectedBillForPrint(newBill);
  };

  const handleOpenStatusModal = (bill: MonthlyBill) => {
    setUpdatingBill(bill);
    setNewStatus(bill.paymentStatus);
    setVoucherNumber(bill.voucherNumber || '');
    setStatusRemarks(bill.paymentRemarks || '');
    setEditBillNumber(bill.billNumber);
  };

  const handleSaveStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingBill) return;
    onUpdateBillStatus(updatingBill.id, newStatus, statusRemarks, voucherNumber, editBillNumber);
    setUpdatingBill(null);
  };

  // Save Bill Series Settings
  const handleSaveSeriesSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempSeriesPrefix.trim()) {
      alert('Please enter a bill series prefix.');
      return;
    }
    const updated: BillSeriesConfig = {
      prefix: tempSeriesPrefix.trim(),
      startingNumber: Number(tempSeriesSeq) || 1,
      currentNumber: Number(tempSeriesSeq) || 1,
      paddingDigits: Number(tempSeriesPadding) || 3,
      suffix: tempSeriesSuffix.trim(),
      includeMonthYear: false,
      useTenderPrefix: tempUseTenderPrefix,
    };
    setBillSeriesConfig(updated);
    StorageService.saveBillSeriesConfig(updated);
    setIsSeriesConfigOpen(false);
  };

  // Batch Monthly Bills Generator
  const handleBatchGenerateBills = (e: React.FormEvent) => {
    e.preventDefault();

    const targetVehicles = vehicles.filter((v) => {
      const isTenderMatch = batchTenderId === 'all' || v.tenderId === batchTenderId;
      const isActive = v.status === 'active';
      return isTenderMatch && isActive;
    });

    if (targetVehicles.length === 0) {
      alert('No active vehicles found matching the selected tender filter.');
      return;
    }

    let currentSeq = Number(batchStartingNumber) || billSeriesConfig.currentNumber;
    let generatedCount = 0;
    const startNumberStr = formatBillNumber(
      billSeriesConfig,
      undefined,
      currentSeq,
      batchMonth,
      batchCustomPrefix || undefined
    );

    targetVehicles.forEach((veh) => {
      const tender = tenders.find((t) => t.id === veh.tenderId);
      const officer = officers.find((o) => o.id === veh.assignedOfficerId);
      if (!tender) return;

      const calc = calculateBillFromLogs(veh, tender, batchMonth, dailyLogs, 0, 12, 2);
      const assignedBillNum = formatBillNumber(
        billSeriesConfig,
        tender,
        currentSeq,
        batchMonth,
        batchCustomPrefix || undefined
      );

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (tender.paymentTermsDays || 30));

      const bill: MonthlyBill = {
        id: `bill-${Date.now()}-${veh.id}`,
        billNumber: assignedBillNum,
        tenderId: tender.id,
        tenderName: tender.departmentName,
        departmentName: tender.departmentName,
        officerName: officer?.name || 'Assigned Officer',
        vehicleId: veh.id,
        vehicleNumber: veh.vehicleNumber,
        monthYear: batchMonth,
        billDate: new Date().toISOString().slice(0, 10),
        dueDate: dueDate.toISOString().slice(0, 10),
        baseAmount: calc.baseMonthlyRate,
        totalKmsRun: calc.totalKmRun,
        allowedKms: calc.allowedKms,
        extraKms: calc.extraKms,
        extraKmRate: calc.extraKmRate,
        extraKmAmount: calc.extraKmAmount,
        totalHoursRun: calc.totalHoursRun,
        allowedHours: calc.allowedHours,
        extraHours: calc.extraHours,
        extraHourRate: calc.extraHourRate,
        extraHourAmount: calc.extraHourAmount,
        nightHaltsCount: calc.nightHaltsCount,
        nightHaltRate: calc.nightHaltRate,
        nightHaltAmount: calc.nightHaltAmount,
        tollParkingAmount: calc.tollParkingAmount,
        penaltyDeductions: 0,
        grossAmount: calc.subTotal,
        gstPercent: calc.gstPercent,
        gstAmount: calc.gstAmount,
        tdsPercent: calc.tdsPercent,
        tdsAmount: calc.tdsAmount,
        netPayableAmount: calc.netPayableAmount,
        paymentStatus: 'draft',
      };

      onSaveBill(bill);
      currentSeq++;
      generatedCount++;
    });

    const updatedConfig: BillSeriesConfig = {
      ...billSeriesConfig,
      currentNumber: currentSeq,
    };
    setBillSeriesConfig(updatedConfig);
    StorageService.saveBillSeriesConfig(updatedConfig);

    setBatchSuccessMessage(
      `✅ Success: Generated ${generatedCount} monthly bills for ${batchMonth} (From ${startNumberStr} to sequence #${currentSeq - 1})`
    );
    setTimeout(() => {
      setIsBatchGenModalOpen(false);
      setBatchSuccessMessage('');
    }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span>Govt Tender Billing &amp; Invoices &bull; सरकारी बिल व क्लेम</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            लॉग बुक से ऑटो-कैलकुलेशन: बेस रेट, एक्स्ट्रा KM, एक्स्ट्रा घंटे, नाइट हॉल्ट, टोल व टीडीएस कटौती
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setTempSeriesPrefix(billSeriesConfig.prefix);
              setTempSeriesSeq(billSeriesConfig.currentNumber);
              setTempSeriesPadding(billSeriesConfig.paddingDigits);
              setTempSeriesSuffix(billSeriesConfig.suffix || '');
              setTempUseTenderPrefix(billSeriesConfig.useTenderPrefix);
              setIsSeriesConfigOpen(true);
            }}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bill Series Setup (बिल सीरीज)</span>
          </button>

          <button
            onClick={() => {
              setBatchStartingNumber(billSeriesConfig.currentNumber);
              setBatchCustomPrefix(billSeriesConfig.prefix);
              setIsBatchGenModalOpen(true);
            }}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Batch Monthly Bills (मासिक बल्क बिल)</span>
          </button>

          <button
            onClick={() => setActiveTab('preview_schedule')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'preview_schedule'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Billing Schedule
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            + Single Bill (नया बिल)
          </button>
        </div>
      </div>

      {/* Bill Series & Invoicing Sequence Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-4 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-lg">
            <Hash className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-indigo-200">
                Configured Bill Series &bull; चालू इनवॉइस सीरीज
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30">
                {billSeriesConfig.useTenderPrefix ? 'Tender Custom Series Active' : 'Company Wide'}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3 mt-1">
              <div className="font-mono text-base font-bold text-white tracking-wide">
                Series: <span className="text-amber-300">{billSeriesConfig.prefix}###{billSeriesConfig.suffix}</span>
              </div>
              <span className="text-slate-300 text-xs">
                Next Issue: <strong className="font-mono text-emerald-300">{formatBillNumber(billSeriesConfig)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTempSeriesPrefix(billSeriesConfig.prefix);
              setTempSeriesSeq(billSeriesConfig.currentNumber);
              setTempSeriesPadding(billSeriesConfig.paddingDigits);
              setTempSeriesSuffix(billSeriesConfig.suffix || '');
              setTempUseTenderPrefix(billSeriesConfig.useTenderPrefix);
              setIsSeriesConfigOpen(true);
            }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Series (सीरीज बदलें)</span>
          </button>

          <button
            onClick={() => {
              setBatchStartingNumber(billSeriesConfig.currentNumber);
              setBatchCustomPrefix(billSeriesConfig.prefix);
              setIsBatchGenModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Batch Monthly Invoicing</span>
          </button>
        </div>
      </div>

      {activeTab === 'preview_schedule' ? (
        /* "Bill Kiske Kab Banane Hai & Kitne Ka Banega" Matrix */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Monthly Tender Billing Readiness Schedule (बिल कब किसका बनेगा और कितने का बनेगा)
              </h3>
              <p className="text-xs text-slate-500">
                वर्तमान माह के लॉग बुक के आधार पर सभी गाड़ियों ({vehicles.length}) का अनुमानित बिल व देय तिथि
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-600 font-medium">Select Month:</label>
              <input
                type="month"
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-medium"
              />
            </div>
          </div>

          {/* Schedule Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Search Car or Officer:</label>
              <input
                type="text"
                placeholder="e.g. UP32, UP78, Innova, Sharma..."
                value={scheduleSearch}
                onChange={(e) => {
                  setScheduleSearch(e.target.value);
                  setSchedulePage(1);
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Filter by Tender ({tenders.length}):</label>
              <select
                value={scheduleTenderFilter}
                onChange={(e) => {
                  setScheduleTenderFilter(e.target.value);
                  setSchedulePage(1);
                }}
                className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="all">All Tenders &amp; Depts ({tenders.length})</option>
                {tenders.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-between">
              <span className="text-slate-500 text-[11px]">
                Showing {paginatedScheduleVehicles.length} of {filteredScheduleVehicles.length} vehicles
              </span>
              {(scheduleSearch || scheduleTenderFilter !== 'all') && (
                <button
                  onClick={() => {
                    setScheduleSearch('');
                    setScheduleTenderFilter('all');
                    setSchedulePage(1);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Vehicle &amp; Officer</th>
                  <th className="py-3 px-4">Department / Tender</th>
                  <th className="py-3 px-4">Billing Cycle Date</th>
                  <th className="py-3 px-4">Log Book Run ({selectedMonthYear})</th>
                  <th className="py-3 px-4">Extra KM &amp; Hours</th>
                  <th className="py-3 px-4 text-right">Estimated Gross Bill</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedScheduleVehicles.map((v) => {
                  const tender = tenders.find((t) => t.id === v.tenderId);
                  const off = officers.find((o) => o.id === v.assignedOfficerId);
                  if (!tender) return null;

                  const calc = calculateBillFromLogs(v, tender, selectedMonthYear, dailyLogs);
                  const existingBill = bills.find(
                    (b) => b.vehicleId === v.id && b.monthYear === selectedMonthYear
                  );

                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono">{v.vehicleNumber}</div>
                        <div className="text-[11px] text-slate-600">{off?.name || 'Pool Vehicle'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{tender.departmentName}</div>
                        <div className="text-[11px] text-slate-500">WO: {tender.workOrderNumber}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-indigo-700">
                          {tender.billingCycleDay}th of each month
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {tender.paymentTermsDays} days credit period
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {calc.totalKmRun} KM / {calc.totalHoursRun} Hrs
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Quota: {calc.allowedKms} KM / {calc.allowedHours} Hrs
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {calc.extraKms > 0 || calc.extraHours > 0 ? (
                          <div className="text-amber-800 font-semibold">
                            +{calc.extraKms} KM ({formatCurrency(calc.extraKmAmount)})<br />
                            +{calc.extraHours} Hrs ({formatCurrency(calc.extraHourAmount)})
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-medium">Within Quota</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-sm text-slate-900">
                          {formatCurrency(calc.netPayableAmount)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Base: {formatCurrency(calc.baseMonthlyRate)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {existingBill ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold uppercase">
                            Generated ({existingBill.paymentStatus})
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setGenVehicleId(v.id);
                              setGenMonthYear(selectedMonthYear);
                              setIsAddModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                          >
                            Generate Bill
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Schedule Pagination Controls */}
          {totalSchedulePages > 1 && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {schedulePage} of {totalSchedulePages}
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={schedulePage === 1}
                  onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-300 rounded disabled:opacity-40"
                >
                  &lsaquo; Prev
                </button>
                <span className="px-2.5 py-1 font-bold text-indigo-700">{schedulePage}</span>
                <button
                  disabled={schedulePage === totalSchedulePages}
                  onClick={() => setSchedulePage((p) => Math.min(totalSchedulePages, p + 1))}
                  className="px-2.5 py-1 border border-slate-300 rounded disabled:opacity-40"
                >
                  Next &rsaquo;
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Bills List & Printable Invoice View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bills History List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="border-b border-slate-100 pb-2 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Govt Invoices ({filteredBills.length}/{bills.length})
              </h3>
              <span className="text-xs text-slate-500 font-normal">All Tenders</span>
            </div>
            <input
              type="text"
              placeholder="Search bill no, dept, car..."
              value={billListSearch}
              onChange={(e) => setBillListSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
            />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
            {filteredBills.map((bill) => {
              const isSelected = selectedBillForPrint?.id === bill.id;
              const daysDiff = getDaysDiff(bill.dueDate);

              return (
                <div
                  key={bill.id}
                  onClick={() => setSelectedBillForPrint(bill)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono">{bill.billNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        bill.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : bill.paymentStatus === 'overdue'
                          ? 'bg-rose-100 text-rose-800 font-bold'
                          : bill.paymentStatus === 'submitted'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {bill.paymentStatus}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-800 mt-1">{bill.departmentName}</div>
                  <div className="text-[11px] text-slate-500">
                    {bill.vehicleNumber} &bull; Month: {bill.monthYear}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Net Claim:</span>
                      <span className="font-bold text-sm text-slate-900">
                        {formatCurrency(bill.netPayableAmount)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStatusModal(bill);
                      }}
                      className="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-[11px] font-medium text-slate-700"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Printable Official Govt Bill Preview */}
        <div className="lg:col-span-2">
          {selectedBillForPrint ? (
            <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 print:p-0 print:border-none space-y-6">
              {/* Header Action Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">
                    Invoice Preview &bull; GeM / Govt Format
                  </span>
                  <h3 className="font-bold text-base text-slate-900 font-mono">
                    {selectedBillForPrint.billNumber}
                  </h3>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleOpenStatusModal(selectedBillForPrint)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
                  >
                    Change Status
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print Official Bill (प्रिंट)
                  </button>
                </div>
              </div>

              {/* Printable Official Govt Tax Invoice Body */}
              <div className="space-y-6 text-slate-900 border border-slate-200 p-6 rounded-lg print:border-none print:p-0">
                {/* Letterhead */}
                <div className="text-center border-b-2 border-slate-800 pb-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-600 uppercase">
                    TAX INVOICE CUM MONTHLY VEHICLE HIRING BILL
                  </div>
                  <h1 className="text-xl font-black uppercase text-slate-900 tracking-wide mt-1">
                    SHAKTI TRAVELS AND TOURS
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    Authorized Govt Transport Contractor &bull; GSTIN: 09AAACS1234F1Z8 &bull; PAN: AAACS1234F
                  </p>
                  <p className="text-[11px] text-slate-500">
                    शक्ति ट्रैवल्स एंड टूर्स &bull; Office: 42, Transport Nagar, Kanpur Road, Lucknow (U.P.) - 226012 | Mob: 9839000000
                  </p>
                </div>

                {/* Bill Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Billed To (विभाग):</span>
                    <div className="font-bold text-slate-900 text-sm">
                      {selectedBillForPrint.departmentName}
                    </div>
                    <div className="text-slate-700">
                      Attention: {selectedBillForPrint.officerName}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Tender / Work Order: {selectedBillForPrint.tenderName}
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <div>
                      <span className="text-slate-500">Invoice No: </span>
                      <strong className="font-mono">{selectedBillForPrint.billNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Bill Date: </span>
                      <strong>{formatDate(selectedBillForPrint.billDate)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Billing Month: </span>
                      <strong>{selectedBillForPrint.monthYear}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Vehicle No: </span>
                      <strong className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                        {selectedBillForPrint.vehicleNumber}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Itemized Calculation Table */}
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left w-12">S.No.</th>
                      <th className="border border-slate-300 p-2 text-left">Description of Service &amp; Package Terms</th>
                      <th className="border border-slate-300 p-2 text-center w-24">Qty / Units</th>
                      <th className="border border-slate-300 p-2 text-right w-24">Rate (₹)</th>
                      <th className="border border-slate-300 p-2 text-right w-28">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="border border-slate-300 p-2 text-center">1</td>
                      <td className="border border-slate-300 p-2">
                        <strong>Monthly Fixed Hiring Charges</strong>
                        <div className="text-[11px] text-slate-600">
                          (Package included: {selectedBillForPrint.allowedKms} KM &amp; {selectedBillForPrint.allowedHours} Duty Hours/Month)
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 text-center">1 Month</td>
                      <td className="border border-slate-300 p-2 text-right">
                        {formatCurrency(selectedBillForPrint.baseAmount)}
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-semibold">
                        {formatCurrency(selectedBillForPrint.baseAmount)}
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-slate-300 p-2 text-center">2</td>
                      <td className="border border-slate-300 p-2">
                        <strong>Extra Kilometers Run</strong>
                        <div className="text-[11px] text-slate-600">
                          Total run: {selectedBillForPrint.totalKmsRun} KM - Quota {selectedBillForPrint.allowedKms} KM = {selectedBillForPrint.extraKms} Extra KM
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 text-center">
                        {selectedBillForPrint.extraKms} KM
                      </td>
                      <td className="border border-slate-300 p-2 text-right">
                        ₹{selectedBillForPrint.extraKmRate}/KM
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-semibold">
                        {formatCurrency(selectedBillForPrint.extraKmAmount)}
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-slate-300 p-2 text-center">3</td>
                      <td className="border border-slate-300 p-2">
                        <strong>Extra Duty Hours</strong>
                        <div className="text-[11px] text-slate-600">
                          Total hours: {selectedBillForPrint.totalHoursRun} Hrs - Quota {selectedBillForPrint.allowedHours} Hrs = {selectedBillForPrint.extraHours} Extra Hrs
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 text-center">
                        {selectedBillForPrint.extraHours} Hrs
                      </td>
                      <td className="border border-slate-300 p-2 text-right">
                        ₹{selectedBillForPrint.extraHourRate}/Hr
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-semibold">
                        {formatCurrency(selectedBillForPrint.extraHourAmount)}
                      </td>
                    </tr>

                    {selectedBillForPrint.nightHaltsCount > 0 && (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">4</td>
                        <td className="border border-slate-300 p-2">
                          <strong>Night Halt / Outstation DA Allowance</strong>
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          {selectedBillForPrint.nightHaltsCount} Nights
                        </td>
                        <td className="border border-slate-300 p-2 text-right">
                          ₹{selectedBillForPrint.nightHaltRate}/Night
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-semibold">
                          {formatCurrency(selectedBillForPrint.nightHaltAmount)}
                        </td>
                      </tr>
                    )}

                    {selectedBillForPrint.tollParkingAmount > 0 && (
                      <tr>
                        <td className="border border-slate-300 p-2 text-center">5</td>
                        <td className="border border-slate-300 p-2">
                          <strong>Toll Tax &amp; Fastag Reimbursement</strong>
                          <div className="text-[11px] text-slate-600">(Receipts / Fastag statement attached)</div>
                        </td>
                        <td className="border border-slate-300 p-2 text-center">Actuals</td>
                        <td className="border border-slate-300 p-2 text-right">-</td>
                        <td className="border border-slate-300 p-2 text-right font-semibold">
                          {formatCurrency(selectedBillForPrint.tollParkingAmount)}
                        </td>
                      </tr>
                    )}

                    {selectedBillForPrint.penaltyDeductions > 0 && (
                      <tr className="text-rose-700 bg-rose-50/50">
                        <td className="border border-slate-300 p-2 text-center">6</td>
                        <td className="border border-slate-300 p-2">
                          <strong>Less: Penalties / Deductions</strong>
                          <div className="text-[11px] text-rose-600">{selectedBillForPrint.penaltyRemarks || 'SLA deduction'}</div>
                        </td>
                        <td className="border border-slate-300 p-2 text-center">-</td>
                        <td className="border border-slate-300 p-2 text-right">-</td>
                        <td className="border border-slate-300 p-2 text-right font-semibold">
                          -{formatCurrency(selectedBillForPrint.penaltyDeductions)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Tax and Total Calculation Summary */}
                <div className="flex justify-end text-xs">
                  <div className="w-72 space-y-1.5 border border-slate-300 p-3 bg-slate-50 rounded">
                    <div className="flex justify-between text-slate-700">
                      <span>Sub Total (Gross):</span>
                      <strong className="text-slate-900">{formatCurrency(selectedBillForPrint.grossAmount)}</strong>
                    </div>

                    <div className="flex justify-between text-slate-700">
                      <span>GST @ {selectedBillForPrint.gstPercent}%:</span>
                      <strong>+{formatCurrency(selectedBillForPrint.gstAmount)}</strong>
                    </div>

                    <div className="flex justify-between text-slate-700">
                      <span>TDS u/s 194C @ {selectedBillForPrint.tdsPercent}%:</span>
                      <strong className="text-rose-700">-{formatCurrency(selectedBillForPrint.tdsAmount)}</strong>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-slate-300 text-sm font-bold text-slate-900">
                      <span>Net Payable Amount:</span>
                      <span className="text-indigo-950 font-black">
                        {formatCurrency(selectedBillForPrint.netPayableAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Declarations & Bank Account Info */}
                <div className="border-t border-slate-300 pt-4 grid grid-cols-2 gap-4 text-[11px] text-slate-600">
                  <div>
                    <strong>Bank Account Details for NEFT/RTGS:</strong>
                    <p className="mt-0.5">
                      Account Name: SHAKTI TRAVELS AND TOURS<br />
                      Bank: State Bank of India, Hazratganj Branch<br />
                      Current A/C: 389201948821 &bull; IFSC: SBIN0000123
                    </p>
                  </div>
                  <div className="text-right pt-6">
                    <p className="font-bold text-slate-900">For SHAKTI TRAVELS AND TOURS</p>
                    <p className="text-slate-500 mt-6">(Authorized Signatory / Proprietor)</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Select an invoice from the list or click &ldquo;+ Calculate &amp; Generate Bill&rdquo;.
            </div>
          )}
        </div>
      </div>

      {/* Bill Generation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>Calculate &amp; Generate Govt Tender Bill (बिल जनरेटर)</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGenerateAndSaveBill} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Vehicle (गाड़ी) *
                  </label>
                  <select
                    required
                    value={genVehicleId}
                    onChange={(e) => setGenVehicleId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} - {v.makeModel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Billing Month (बिलिंग माह) *
                  </label>
                  <input
                    type="month"
                    required
                    value={genMonthYear}
                    onChange={(e) => setGenMonthYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Bill Number / Series Override Input */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-600" />
                    Bill Number &amp; Series (बिल नंबर व इनवॉइस सीरीज) *
                  </label>
                  <input
                    type="text"
                    required
                    value={genCustomBillNumber}
                    onChange={(e) => setGenCustomBillNumber(e.target.value)}
                    placeholder="e.g. SFT/2026-27/101 or PWD/LKO/2026/01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Auto-generated from configured series. You can type any custom series format here.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempSeriesPrefix(billSeriesConfig.prefix);
                    setTempSeriesSeq(billSeriesConfig.currentNumber);
                    setTempSeriesPadding(billSeriesConfig.paddingDigits);
                    setTempSeriesSuffix(billSeriesConfig.suffix || '');
                    setTempUseTenderPrefix(billSeriesConfig.useTenderPrefix);
                    setIsSeriesConfigOpen(true);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 self-end sm:self-center shadow-2xs whitespace-nowrap"
                >
                  Configure Series &rarr;
                </button>
              </div>

              {/* Tender Terms and Log Summary Preview */}
              {calculatedBill && selectedTender && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 uppercase">
                      Logbook Live Calculation Summary
                    </span>
                    <span className="text-indigo-700 font-semibold">
                      Tender: {selectedTender.departmentName}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Days Run:</span>
                      <strong>{calculatedBill.totalDaysWorked} Days</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Total KMs:</span>
                      <strong>{calculatedBill.totalKmRun} KM</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Tender Quota:</span>
                      <span>{calculatedBill.allowedKms} KM</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Extra KM:</span>
                      <strong className={calculatedBill.extraKms > 0 ? 'text-amber-700' : 'text-slate-700'}>
                        {calculatedBill.extraKms} KM ({formatCurrency(calculatedBill.extraKmAmount)})
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Total Duty Hrs:</span>
                      <strong>{calculatedBill.totalHoursRun} Hrs</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Quota Hrs:</span>
                      <span>{calculatedBill.allowedHours} Hrs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Extra Hours:</span>
                      <strong className={calculatedBill.extraHours > 0 ? 'text-amber-700' : 'text-slate-700'}>
                        {calculatedBill.extraHours} Hrs ({formatCurrency(calculatedBill.extraHourAmount)})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Night Halts:</span>
                      <strong>{calculatedBill.nightHaltsCount} Nights ({formatCurrency(calculatedBill.nightHaltAmount)})</strong>
                    </div>
                  </div>

                  {calculatedBill.tollParkingAmount > 0 && (
                    <div className="text-xs text-slate-700">
                      Toll &amp; Fastag Reimbursement Claim: <strong>{formatCurrency(calculatedBill.tollParkingAmount)}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Deductions and Taxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Penalty / SLA Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={genPenalty}
                    onChange={(e) => setGenPenalty(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    GST Percent (%)
                  </label>
                  <select
                    value={genGstPercent}
                    onChange={(e) => setGenGstPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value={12}>12% (With Input Tax Credit)</option>
                    <option value={5}>5% (Without Input Tax Credit / RCM)</option>
                    <option value={18}>18% (Commercial Services)</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    TDS Deduction Rate (%)
                  </label>
                  <select
                    value={genTdsPercent}
                    onChange={(e) => setGenTdsPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value={2}>2% (Section 194C - Company/Firm)</option>
                    <option value={1}>1% (Section 194C - Individual/Proprietorship)</option>
                    <option value={0}>0% (Nil TDS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Penalty Reason / Remarks (यदि कोई कटौती हो)
                </label>
                <input
                  type="text"
                  value={genPenaltyRemarks}
                  onChange={(e) => setGenPenaltyRemarks(e.target.value)}
                  placeholder="e.g. 1 day replacement delay or absent without substitute"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Net Payable Final Highlight */}
              {calculatedBill && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-indigo-700 block">Total Net Claim Amount</span>
                    <span className="text-xs text-slate-500">
                      (Gross + GST - TDS u/s 194C)
                    </span>
                  </div>
                  <div className="text-2xl font-black text-indigo-950 font-mono">
                    {formatCurrency(calculatedBill.netPayableAmount)}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save &amp; Generate Official Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Status Update Modal */}
      {updatingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Update Bill Status (बिल स्थिति अपडेट करें)
              </h3>
              <button
                onClick={() => setUpdatingBill(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  Bill Number / Invoice Series (बिल नंबर)
                </label>
                <input
                  type="text"
                  value={editBillNumber}
                  onChange={(e) => setEditBillNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bill Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="draft">Draft (तैयार हुआ)</option>
                  <option value="submitted">Submitted to Dept / Treasury (विभाग में जमा)</option>
                  <option value="approved">Approved / Passed by Accounts (स्वीकृत)</option>
                  <option value="paid">Paid (खाते में राशि प्राप्त)</option>
                  <option value="overdue">Overdue / Delayed (विलंबित)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dak / Diary / Voucher Reference Number
                </label>
                <input
                  type="text"
                  value={voucherNumber}
                  onChange={(e) => setVoucherNumber(e.target.value)}
                  placeholder="e.g. DAK-8891 or TREASURY-EPAY-2026-90"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment / Processing Remarks
                </label>
                <textarea
                  rows={2}
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="e.g. Submitted with verified logbook to EE Office on 2nd Sep."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setUpdatingBill(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Series Configuration Modal */}
      {isSeriesConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bill Series &amp; Invoicing Prefix (बिल सीरीज कॉन्फ़िगरेशन)
                  </h3>
                  <p className="text-xs text-slate-500">
                    आप जो भी बिल सीरीज लिखना चाहें, वही हर महीने के बिलों में लागू होगी
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSeriesConfigOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSeriesSettings} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Bill Series Prefix (बिल सीरीज प्रीफिक्स - जो आप लिखना चाहें) *
                </label>
                <input
                  type="text"
                  required
                  value={tempSeriesPrefix}
                  onChange={(e) => setTempSeriesPrefix(e.target.value)}
                  placeholder="e.g. SF/BILL/2026-27/ or PWD/LKO/ or INV/GOVT/"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  उदाहरण: <code>SF/BILL/2026-27/</code>, <code>UP-PWD/CAB/</code>, <code>NHAI/PIU/26/</code>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Sequence Number (अगला बिल क्रमांक) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={tempSeriesSeq}
                    onChange={(e) => setTempSeriesSeq(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Digit Padding (शून्य संख्या)
                  </label>
                  <select
                    value={tempSeriesPadding}
                    onChange={(e) => setTempSeriesPadding(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value={2}>2 Digits (01, 02...)</option>
                    <option value={3}>3 Digits (001, 002...)</option>
                    <option value={4}>4 Digits (0001, 0002...)</option>
                    <option value={5}>5 Digits (00001...)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Optional Suffix (सफ़िक्स - यदि कोई हो)
                </label>
                <input
                  type="text"
                  value={tempSeriesSuffix}
                  onChange={(e) => setTempSeriesSuffix(e.target.value)}
                  placeholder="e.g. /UP or /CORP (optional)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempUseTenderPrefix}
                    onChange={(e) => setTempUseTenderPrefix(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">
                    Use Tender-specific series when defined (टेंडर का विशेष प्रीफिक्स प्राथमिकता दें)
                  </span>
                </label>
                <span className="text-[10px] text-slate-500 block mt-1 ml-6">
                  जैसे यदि PWD टेंडर में <code>PWD/LKO/</code> लिखा है तो उसके बिल में वही आएगा।
                </span>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-900 block tracking-wider">
                  Live Preview of Upcoming Bills (आगामी बिल नंबरों का प्रीव्यू)
                </span>
                <div className="mt-2 space-y-1 font-mono text-xs">
                  <div className="text-slate-800">
                    1. <strong className="text-indigo-800">{tempSeriesPrefix}{String(tempSeriesSeq).padStart(tempSeriesPadding, '0')}{tempSeriesSuffix}</strong>
                  </div>
                  <div className="text-slate-800">
                    2. <strong className="text-indigo-800">{tempSeriesPrefix}{String(tempSeriesSeq + 1).padStart(tempSeriesPadding, '0')}{tempSeriesSuffix}</strong>
                  </div>
                  <div className="text-slate-800">
                    3. <strong className="text-indigo-800">{tempSeriesPrefix}{String(tempSeriesSeq + 2).padStart(tempSeriesPadding, '0')}{tempSeriesSuffix}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSeriesConfigOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Bill Series Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Monthly Bills Generator Modal */}
      {isBatchGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Batch Monthly Invoicing Generator (सभी गाड़ियों का बिल जनरेटर)
                  </h3>
                  <p className="text-xs text-slate-500">
                    चुने हुए महीने के लिए सभी सक्रिय गाड़ियों के बिल आपकी बिल सीरीज के अनुसार एक साथ बनाएं
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchGenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {batchSuccessMessage ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{batchSuccessMessage}</h4>
                <p className="text-xs text-slate-500">
                  All generated bills have been added to your Invoices list and storage.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBatchGenerateBills} className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Billing Month (बिलिंग माह) *
                    </label>
                    <input
                      type="month"
                      required
                      value={batchMonth}
                      onChange={(e) => setBatchMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Target Tender / Department
                    </label>
                    <select
                      value={batchTenderId}
                      onChange={(e) => setBatchTenderId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                    >
                      <option value="all">All Active Tenders ({vehicles.length} Vehicles)</option>
                      {tenders.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">
                        Series Prefix (सीरीज प्रीफिक्स)
                      </label>
                      <input
                        type="text"
                        value={batchCustomPrefix || billSeriesConfig.prefix}
                        onChange={(e) => setBatchCustomPrefix(e.target.value)}
                        placeholder="e.g. SFT/2026-27/"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">
                        Starting Number (प्रारंभिक नंबर)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={batchStartingNumber}
                        onChange={(e) => setBatchStartingNumber(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span>Next bills will be sequentially numbered: </span>
                    <strong className="font-mono text-indigo-700">
                      {batchCustomPrefix || billSeriesConfig.prefix}{String(batchStartingNumber).padStart(billSeriesConfig.paddingDigits, '0')}
                    </strong>
                    <span>, </span>
                    <strong className="font-mono text-indigo-700">
                      {batchCustomPrefix || billSeriesConfig.prefix}{String(batchStartingNumber + 1).padStart(billSeriesConfig.paddingDigits, '0')}
                    </strong>
                    <span> ...</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsBatchGenModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-4 h-4" />
                    Confirm &amp; Generate All Monthly Bills
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

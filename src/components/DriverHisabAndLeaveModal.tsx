import React, { useState, useMemo } from 'react';
import {
  X,
  IndianRupee,
  Calendar,
  UserCheck,
  UserX,
  Car,
  Building2,
  Phone,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Printer,
  Share2,
  FileText,
  DollarSign,
  Tag,
  CreditCard,
  Banknote,
  Send,
  HelpCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Driver,
  Vehicle,
  Officer,
  Tender,
  DriverKhataTransaction,
  DriverLeaveRecord,
  DailyPaymentEntry,
  StaffUser,
  DriverKhataTransactionType,
} from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';

interface DriverHisabAndLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'payments' | 'leaves' | 'monthly_hisab';
  preSelectedTenderId?: string;
  preSelectedVehicleId?: string;
  preSelectedOfficerId?: string;
  preSelectedDriverId?: string;
  tenders: VehicleTender[] | Tender[];
  vehicles: Vehicle[];
  officers: Officer[];
  drivers: Driver[];
  khataTransactions: DriverKhataTransaction[];
  driverLeaves: DriverLeaveRecord[];
  dailyPayments?: DailyPaymentEntry[];
  currentUser?: StaffUser;
  onAddTransaction: (tx: DriverKhataTransaction) => void;
  onAddDailyPayment?: (entry: DailyPaymentEntry) => void;
  onAddDriverLeave: (leave: DriverLeaveRecord) => void;
  onDeleteDriverLeave?: (leaveId: string) => void;
  onDeleteTransaction?: (txId: string) => void;
}

type VehicleTender = Tender;

export const DriverHisabAndLeaveModal: React.FC<DriverHisabAndLeaveModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'payments',
  preSelectedTenderId,
  preSelectedVehicleId,
  preSelectedOfficerId,
  preSelectedDriverId,
  tenders,
  vehicles,
  officers,
  drivers,
  khataTransactions,
  driverLeaves,
  dailyPayments = [],
  currentUser,
  onAddTransaction,
  onAddDailyPayment,
  onAddDriverLeave,
  onDeleteDriverLeave,
  onDeleteTransaction,
}) => {
  if (!isOpen) return null;

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'payments' | 'leaves' | 'monthly_hisab'>(initialTab);

  // Selected Entity State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    if (preSelectedVehicleId) return preSelectedVehicleId;
    if (preSelectedTenderId) {
      const v = vehicles.find((veh) => veh.tenderId === preSelectedTenderId);
      if (v) return v.id;
    }
    return vehicles[0]?.id || '';
  });

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  const selectedOfficer = useMemo(() => {
    if (preSelectedOfficerId) {
      const o = officers.find((off) => off.id === preSelectedOfficerId);
      if (o) return o;
    }
    if (selectedVehicle?.assignedOfficerId) {
      return officers.find((o) => o.id === selectedVehicle.assignedOfficerId);
    }
    return officers.find((o) => o.assignedVehicleId === selectedVehicleId);
  }, [officers, selectedVehicle, selectedVehicleId, preSelectedOfficerId]);

  const selectedTender = useMemo(() => {
    const tid = selectedVehicle?.tenderId || selectedOfficer?.tenderId || preSelectedTenderId;
    return tenders.find((t) => t.id === tid);
  }, [tenders, selectedVehicle, selectedOfficer, preSelectedTenderId]);

  // Selected Driver: either vehicle driver or preselected
  const [selectedDriverId, setSelectedDriverId] = useState<string>(() => {
    if (preSelectedDriverId) return preSelectedDriverId;
    if (selectedVehicle?.currentDriverId) return selectedVehicle.currentDriverId;
    if (selectedOfficer?.currentDriverId) return selectedOfficer.currentDriverId;
    return drivers[0]?.id || '';
  });

  // Keep driver synced when vehicle changes if not explicitly overridden
  const handleVehicleChange = (newVehId: string) => {
    setSelectedVehicleId(newVehId);
    const v = vehicles.find((veh) => veh.id === newVehId);
    if (v?.currentDriverId) {
      setSelectedDriverId(v.currentDriverId);
    }
  };

  const selectedDriver = useMemo(() => {
    return drivers.find((d) => d.id === selectedDriverId);
  }, [drivers, selectedDriverId]);

  // -------------------------------------------------------------
  // TAB 1: PAYMENT & PAST RECORD FORM STATE
  // -------------------------------------------------------------
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentAmount, setPaymentAmount] = useState<number | ''>(2000);
  const [paymentCategory, setPaymentCategory] = useState<DriverKhataTransactionType>('advance');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank_transfer'>('cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentDesc, setPaymentDesc] = useState<string>('मासिक वेतन अग्रिम (Salary advance)');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string>('');
  const [filterMonthPayHistory, setFilterMonthPayHistory] = useState<string>('all');

  const paymentCategoryOptions: { value: DriverKhataTransactionType; label: string; desc: string }[] = [
    { value: 'advance', label: 'वेतन अग्रिम (Salary Advance)', desc: 'मासिक वेतन में से पहले दिया गया एडवांस' },
    { value: 'salary_payment', label: 'मासिक वेतन भुगतान (Salary Payment)', desc: 'महीने का पूरा या शेष वेतन भुगतान' },
    { value: 'da_food_expense', label: 'दैनिक भोजन / मार्ग भत्ता (Food/DA)', desc: 'ड्यूटी के दौरान खाना व स्थानीय भत्ता' },
    { value: 'trip_expense', label: 'आउटस्टेशन / ट्रिप व्यय (Trip Expense)', desc: 'बाहरी टूर, होटल व नाइट हॉल्ट खर्च' },
    { value: 'fastag_topup', label: 'फास्टैग रिचार्ज (FASTag Toll)', desc: 'गाड़ी के टोल हेतु दिया गया पैसा' },
    { value: 'fuel_budget_advance', label: 'आपातकालीन ईंधन / पंचर (Emergency Fuel/Repair)', desc: 'रास्ते में डीजल या पंचर हेतु नकद' },
    { value: 'bonus', label: 'बोनस / अतिरिक्त ड्यूटी (Bonus/Incentive)', desc: 'त्योहार या अच्छी सेवा पर अतिरिक्त पारितोषिक' },
    { value: 'penalty_deduction', label: 'जुर्माना / चालान कटौती (Penalty)', desc: 'लापरवाही या ट्रैफिक चालान की कटौती' },
    { value: 'other', label: 'अन्य भुगतान (Other Expense)', desc: 'अन्य कोई फुटकर दिया गया भुगतान' },
  ];

  const quickDescriptions: string[] = [
    'महीने का अग्रिम (Monthly advance)',
    'रास्ते का खाना-खर्चा व मार्ग भत्ता',
    'त्योहार / शादी अग्रिम',
    'आउटस्टेशन ट्रिप हेतु नकद अग्रिम',
    'गाड़ी धुलाई व फुटकर खर्च',
    'मासिक पूरा हिसाब चुकता',
  ];

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !paymentAmount || paymentAmount <= 0) return;

    const numAmount = Number(paymentAmount);
    const txId = `dkt-manual-${Date.now()}`;
    const autoRef = paymentRef.trim() || `${paymentMode.toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newTx: DriverKhataTransaction = {
      id: txId,
      driverId: selectedDriver.id,
      driverName: selectedDriver.name,
      date: paymentDate,
      type: paymentCategory,
      amount: numAmount,
      description: paymentDesc.trim() || `Payment via ${paymentMode.toUpperCase()}`,
      paymentMode: paymentMode,
      referenceNumber: autoRef,
      tenderId: selectedTender?.id,
      vehicleId: selectedVehicle?.id,
      vehicleNumber: selectedVehicle?.vehicleNumber,
      officerId: selectedOfficer?.id,
      recordedBy: currentUser?.name || 'कार्यालय व्यवस्थापक',
    };

    onAddTransaction(newTx);

    // Also mirror to Daily Payments master if handler provided
    if (onAddDailyPayment) {
      const dailyCategory =
        paymentCategory === 'salary_payment'
          ? 'driver_salary'
          : paymentCategory === 'fuel_budget_advance'
          ? 'fuel'
          : paymentCategory === 'fastag_topup'
          ? 'fastag_toll'
          : paymentCategory === 'trip_expense' || paymentCategory === 'da_food_expense'
          ? 'emergency_expense'
          : 'driver_advance';

      const dailyEntry: DailyPaymentEntry = {
        id: `dp-dkt-${Date.now()}`,
        date: paymentDate,
        category: dailyCategory,
        amount: numAmount,
        paymentMode: paymentMode === 'bank_transfer' ? 'bank_transfer' : paymentMode,
        referenceNumber: autoRef,
        payeeName: selectedDriver.name,
        payeeType: 'driver',
        driverId: selectedDriver.id,
        vehicleId: selectedVehicle?.id,
        vehicleNumber: selectedVehicle?.vehicleNumber,
        description: `[${selectedVehicle?.vehicleNumber || 'वाहन'}] ${paymentDesc} (चालक: ${selectedDriver.name})`,
        autoRoutedTo: 'Driver Khata & Payments',
        recordedBy: currentUser?.name || 'कार्यालय व्यवस्थापक',
      };
      onAddDailyPayment(dailyEntry);
    }

    setPaymentSuccessMsg(`₹${numAmount.toLocaleString('en-IN')} का भुगतान सफलतापूर्वक दर्ज हो गया!`);
    setTimeout(() => setPaymentSuccessMsg(''), 3500);

    // Reset some fields
    setPaymentAmount('');
    setPaymentRef('');
  };

  // Driver's complete khata transactions
  const driverTransactions = useMemo(() => {
    if (!selectedDriver) return [];
    return khataTransactions
      .filter((t) => t.driverId === selectedDriver.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [khataTransactions, selectedDriver]);

  // Filtered transactions for Tab 1 history list
  const filteredTransactions = useMemo(() => {
    if (filterMonthPayHistory === 'all') return driverTransactions;
    return driverTransactions.filter((t) => t.date.startsWith(filterMonthPayHistory));
  }, [driverTransactions, filterMonthPayHistory]);

  const totalFilteredPaid = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type !== 'penalty_deduction')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // -------------------------------------------------------------
  // TAB 2: DRIVER LEAVE & SUBSTITUTE (BADLI) FORM STATE
  // "Kab chutti li, us din ka hisab, uski jagah kaun gaya"
  // -------------------------------------------------------------
  const [leaveStartDate, setLeaveStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [leaveEndDate, setLeaveEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [leaveTotalDays, setLeaveTotalDays] = useState<number>(1);
  const [leaveReason, setLeaveReason] = useState<string>('बीमारी / स्वास्थ्य अवकाश');
  const [hasSubstitute, setHasSubstitute] = useState<boolean>(true);
  const [substituteType, setSubstituteType] = useState<'registered_driver' | 'temporary_driver' | 'none'>('registered_driver');
  const [substituteRegisteredDriverId, setSubstituteRegisteredDriverId] = useState<string>('');
  const [substituteTempName, setSubstituteTempName] = useState<string>('');
  const [substituteTempPhone, setSubstituteTempPhone] = useState<string>('');
  const [dailySubstitutePay, setDailySubstitutePay] = useState<number>(550);
  const [substitutePayMode, setSubstitutePayMode] = useState<'cash' | 'upi' | 'bank_transfer'>('cash');
  const [deductFromMainDriver, setDeductFromMainDriver] = useState<boolean>(true);
  const [customDeductionAmount, setCustomDeductionAmount] = useState<number | ''>('');
  const [leaveNotes, setLeaveNotes] = useState<string>('');
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState<string>('');

  // Auto calculate total days when dates change
  const handleStartDateChange = (val: string) => {
    setLeaveStartDate(val);
    if (val && leaveEndDate && val <= leaveEndDate) {
      const d1 = new Date(val).getTime();
      const d2 = new Date(leaveEndDate).getTime();
      const diff = Math.max(1, Math.round((d2 - d1) / (1000 * 3600 * 24)) + 1);
      setLeaveTotalDays(diff);
      updateDeductionEstimate(diff);
    }
  };

  const handleEndDateChange = (val: string) => {
    setLeaveEndDate(val);
    if (leaveStartDate && val && leaveStartDate <= val) {
      const d1 = new Date(leaveStartDate).getTime();
      const d2 = new Date(val).getTime();
      const diff = Math.max(1, Math.round((d2 - d1) / (1000 * 3600 * 24)) + 1);
      setLeaveTotalDays(diff);
      updateDeductionEstimate(diff);
    }
  };

  const updateDeductionEstimate = (days: number) => {
    if (!selectedDriver) return;
    const dailySalary = Math.round((selectedDriver.monthlySalary || 16500) / 30);
    setCustomDeductionAmount(dailySalary * days);
  };

  // Calculated main driver deduction amount
  const computedDeductionAmount = useMemo(() => {
    if (!deductFromMainDriver) return 0;
    if (customDeductionAmount !== '' && typeof customDeductionAmount === 'number') {
      return customDeductionAmount;
    }
    const dailySal = Math.round((selectedDriver?.monthlySalary || 16500) / 30);
    return dailySal * leaveTotalDays;
  }, [deductFromMainDriver, customDeductionAmount, selectedDriver, leaveTotalDays]);

  const computedTotalSubstituteCost = useMemo(() => {
    if (!hasSubstitute || substituteType === 'none') return 0;
    return dailySubstitutePay * leaveTotalDays;
  }, [hasSubstitute, substituteType, dailySubstitutePay, leaveTotalDays]);

  const handleSaveLeaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    let subName = '';
    let subPhone = '';
    if (hasSubstitute && substituteType === 'registered_driver') {
      const regDrv = drivers.find((d) => d.id === substituteRegisteredDriverId);
      subName = regDrv?.name || 'रजिस्टर्ड चालक';
      subPhone = regDrv?.phone || '';
    } else if (hasSubstitute && substituteType === 'temporary_driver') {
      subName = substituteTempName.trim() || 'बदली चालक (अस्थायी)';
      subPhone = substituteTempPhone.trim();
    }

    const leaveRecord: DriverLeaveRecord = {
      id: `dlr-${Date.now()}`,
      driverId: selectedDriver.id,
      driverName: selectedDriver.name,
      vehicleId: selectedVehicle?.id || 'unknown-veh',
      vehicleNumber: selectedVehicle?.vehicleNumber || 'वाहन',
      tenderId: selectedTender?.id || '',
      tenderName: selectedTender?.departmentName,
      officerId: selectedOfficer?.id,
      officerName: selectedOfficer?.name,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      totalDays: leaveTotalDays,
      leaveReason: leaveReason,
      hasSubstitute: hasSubstitute && substituteType !== 'none',
      substituteDriverType: substituteType,
      substituteDriverId: substituteType === 'registered_driver' ? substituteRegisteredDriverId : undefined,
      substituteDriverName: subName || undefined,
      substituteDriverPhone: subPhone || undefined,
      dailySubstitutePay: hasSubstitute && substituteType !== 'none' ? dailySubstitutePay : 0,
      totalSubstitutePaid: computedTotalSubstituteCost,
      substitutePaymentMode: substitutePayMode,
      deductFromMainDriverSalary: deductFromMainDriver,
      deductionAmount: computedDeductionAmount,
      notes: leaveNotes.trim() || `अवकाश ${leaveTotalDays} दिन (${leaveReason})`,
      recordedBy: currentUser?.name || 'कार्यालय व्यवस्थापक',
      createdAt: new Date().toISOString(),
    };

    onAddDriverLeave(leaveRecord);

    // If substitute driver was paid money, auto log a payment entry so cash is tracked
    if (computedTotalSubstituteCost > 0 && onAddDailyPayment) {
      const paymentEntry: DailyPaymentEntry = {
        id: `dp-sub-${Date.now()}`,
        date: leaveStartDate,
        category: 'emergency_expense',
        amount: computedTotalSubstituteCost,
        paymentMode: substitutePayMode,
        payeeName: subName || 'बदली चालक',
        payeeType: 'driver',
        vehicleId: selectedVehicle?.id,
        vehicleNumber: selectedVehicle?.vehicleNumber,
        description: `बदली चालक भुगतान (${leaveTotalDays} दिन x ₹${dailySubstitutePay}) - मुख्य चालक: ${selectedDriver.name} छुट्टी पर`,
        autoRoutedTo: 'Driver Badli & Daily Payments',
        recordedBy: currentUser?.name || 'कार्यालय व्यवस्थापक',
      };
      onAddDailyPayment(paymentEntry);
    }

    setLeaveSuccessMsg(
      `छुट्टी व बदली रिकॉर्ड (${leaveTotalDays} दिन) सफलतापूर्वक दर्ज हो गया!`
    );
    setTimeout(() => setLeaveSuccessMsg(''), 3500);

    // Reset notes
    setLeaveNotes('');
    setSubstituteTempName('');
    setSubstituteTempPhone('');
  };

  // Driver's complete leave history
  const driverLeavesList = useMemo(() => {
    if (!selectedDriver) return [];
    return driverLeaves
      .filter((l) => l.driverId === selectedDriver.id)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [driverLeaves, selectedDriver]);

  // -------------------------------------------------------------
  // TAB 3: MONTHLY HISAB & BALANCE SHEET
  // -------------------------------------------------------------
  const [selectedHisabMonth, setSelectedHisabMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7); // e.g. "2026-09"
  });

  // Calculate days in the selected month
  const monthDaysCount = useMemo(() => {
    const [year, month] = selectedHisabMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate() || 30;
  }, [selectedHisabMonth]);

  // Leaves in this month for this driver
  const monthlyLeaves = useMemo(() => {
    if (!selectedDriver) return [];
    return driverLeavesList.filter((l) => l.startDate.startsWith(selectedHisabMonth));
  }, [driverLeavesList, selectedHisabMonth]);

  const monthlyLeavesDays = useMemo(() => {
    return monthlyLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
  }, [monthlyLeaves]);

  const monthlyLeaveDeductions = useMemo(() => {
    return monthlyLeaves.reduce((sum, l) => sum + (l.deductFromMainDriverSalary ? l.deductionAmount || 0 : 0), 0);
  }, [monthlyLeaves]);

  // Payments / Advances given in this month to this driver
  const monthlyTransactions = useMemo(() => {
    if (!selectedDriver) return [];
    return driverTransactions.filter((t) => t.date.startsWith(selectedHisabMonth));
  }, [driverTransactions, selectedHisabMonth]);

  const monthlyAdvancesPaid = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === 'advance' || t.type === 'fuel_budget_advance' || t.type === 'fastag_topup')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const monthlySalaryPaid = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === 'salary_payment')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const monthlyDaFoodBonus = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === 'da_food_expense' || t.type === 'trip_expense' || t.type === 'bonus')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const monthlyPenalties = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type === 'penalty_deduction')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const totalMonthlyOutflowToDriver = useMemo(() => {
    return monthlyTransactions
      .filter((t) => t.type !== 'penalty_deduction')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  // Final Net Balance Calculation
  const baseSalary = selectedDriver?.monthlySalary || 16500;
  const netEarnedWage = Math.max(0, baseSalary - monthlyLeaveDeductions - monthlyPenalties + monthlyDaFoodBonus);
  const remainingDueToDriver = Math.round(netEarnedWage - totalMonthlyOutflowToDriver);

  // Quick Action: Pre-fill settle balance
  const handleQuickSettleBalance = () => {
    if (remainingDueToDriver <= 0) return;
    setActiveTab('payments');
    setPaymentAmount(remainingDueToDriver);
    setPaymentCategory('salary_payment');
    setPaymentDesc(`मासिक वेतन फाइनल हिसाब चुकता (${selectedHisabMonth})`);
  };

  // Printable Monthly Driver Slip modal / print view trigger
  const [showPrintSlip, setShowPrintSlip] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs sm:p-5">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 bg-[var(--color-ink)] p-4 text-white sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="page-kicker !text-teal-300">
                  <IndianRupee className="h-3.5 w-3.5" />
                  चालक हिसाब, भुगतान व छुट्टी-बदली हब
                </span>
                <span className="badge badge-neutral !bg-white/10 !text-white/55">Single-Window Contextual Entry</span>
              </div>
              <h2 className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                <span>{selectedDriver?.name || 'चालक चुनें'}</span>
                <span className="rounded-lg bg-white/10 px-2 py-0.5 text-sm font-medium text-teal-200">
                  मासिक मूल वेतन: {formatCurrency(selectedDriver?.monthlySalary || 16500)}
                </span>
              </h2>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
                  <Car className="h-3.5 w-3.5 text-teal-300" />
                  <strong className="text-white/90">वाहन</strong>
                  {selectedVehicle?.vehicleNumber || 'असाइन नहीं'}
                  {selectedVehicle?.makeModel ? ` · ${selectedVehicle.makeModel}` : ''}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
                  <UserCheck className="h-3.5 w-3.5 text-teal-300" />
                  <strong className="text-white/90">अधिकारी</strong>
                  {selectedOfficer?.name || 'रिक्त'}
                  {selectedOfficer?.designation ? ` · ${selectedOfficer.designation}` : ''}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
                  <Building2 className="h-3.5 w-3.5 text-teal-300" />
                  <strong className="text-white/90">टेंडर</strong>
                  {selectedTender?.departmentName || 'सामान्य फ्लीट'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/10 p-1.5 text-white/55 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white/45">वाहन बदलें</span>
              <select
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id} className="text-slate-900">
                    {v.vehicleNumber} - {v.makeModel}
                    {v.assignedOfficerId ? ` (${officers.find((o) => o.id === v.assignedOfficerId)?.name})` : ''}
                  </option>
                ))}
              </select>

              <span className="ml-1 text-white/45">चालक बदलें</span>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id} className="text-slate-900">
                    {d.name} ({formatCurrency(d.monthlySalary)}/माह) - {d.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-white/55">
              संपर्क <strong className="text-white/85">{selectedDriver?.phone || 'N/A'}</strong>
              {' · '}
              जॉइनिंग {selectedDriver?.joiningDate ? formatDate(selectedDriver.joiningDate) : '—'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2.5 sm:px-5">
          <div className="segmented overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`segmented-btn inline-flex items-center gap-2 ${activeTab === 'payments' ? 'is-active' : ''}`}
            >
              <IndianRupee className="h-4 w-4" />
              चालक को भुगतान व पिछला हिसाब
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  activeTab === 'payments' ? 'bg-teal-700 text-white' : 'bg-[var(--color-sand-deep)] text-[var(--color-ink-soft)]'
                }`}
              >
                {driverTransactions.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leaves')}
              className={`segmented-btn inline-flex items-center gap-2 ${activeTab === 'leaves' ? 'is-active' : ''}`}
            >
              <Calendar className="h-4 w-4" />
              छुट्टी व बदली ड्राइवर
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  activeTab === 'leaves' ? 'bg-teal-700 text-white' : 'bg-[var(--color-sand-deep)] text-[var(--color-ink-soft)]'
                }`}
              >
                {driverLeavesList.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monthly_hisab')}
              className={`segmented-btn inline-flex items-center gap-2 ${activeTab === 'monthly_hisab' ? 'is-active' : ''}`}
            >
              <FileText className="h-4 w-4" />
              मासिक हिसाब-किताब व पर्ची
              {remainingDueToDriver > 0 && (
                <span className="badge badge-danger">Due: ₹{remainingDueToDriver}</span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-sand)]/70 p-4 sm:p-6">

          {/* ============================================================== */}
          {/* TAB 1: PAYMENTS & PAST RECORD ENTRY */}
          {/* ============================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {paymentSuccessMsg && (
                <div className="alert-banner">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
                  <span className="text-sm font-semibold text-[var(--color-ink)]">{paymentSuccessMsg}</span>
                </div>
              )}

              {/* RECORD PAYMENT FORM CARD */}
              <div className="panel panel-pad">
                <div className="mb-4 flex flex-col gap-2 border-b border-[var(--color-line)] pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">
                      <Plus className="h-4 w-4 text-teal-700" />
                      + चालक को भुगतान / पिछला रिकॉर्ड दर्ज करें
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      चालक के खाते में नया या पिछली तारीख का भुगतान जोड़ें।
                    </p>
                  </div>
                  <span className="badge badge-neutral">चालक: {selectedDriver?.name}</span>
                </div>

                <form onSubmit={handleSavePayment} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                        भुगतान तारीख (Date) *
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                      />
                      <span className="text-[11px] text-[var(--color-muted)]">पिछली तारीख भी चुन सकते हैं</span>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                        किस चीज़ के लिए दिया? (Purpose / Reason) *
                      </label>
                      <select
                        value={paymentCategory}
                        onChange={(e) => {
                          const cat = e.target.value as DriverKhataTransactionType;
                          setPaymentCategory(cat);
                          const opt = paymentCategoryOptions.find((o) => o.value === cat);
                          if (opt) setPaymentDesc(opt.label);
                        }}
                        className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                      >
                        {paymentCategoryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                        दी गई राशि (Amount ₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 font-bold text-[var(--color-muted)]">₹</span>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="2000"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2 pl-7 text-xs font-bold text-[var(--color-ink)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                        भुगतान का माध्यम (Mode) *
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as any)}
                        className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                      >
                        <option value="cash">नकद (Cash)</option>
                        <option value="upi">UPI / PhonePe / GPay</option>
                        <option value="bank_transfer">बैंक ट्रांसफर / NEFT</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                        विवरण / टिप्पणी (Details / Notes)
                      </label>
                      <input
                        type="text"
                        value={paymentDesc}
                        onChange={(e) => setPaymentDesc(e.target.value)}
                        placeholder="जैसे: त्योहार अग्रिम, रास्ते का खाना-खर्चा, या पूर्ण वेतन चुकता"
                        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                      />
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-[var(--color-muted)]">त्वरित विवरण:</span>
                        {quickDescriptions.map((desc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPaymentDesc(desc)}
                            className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] text-[var(--color-ink)] transition-colors hover:border-teal-600/40 hover:bg-teal-50"
                          >
                            {desc}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                        UTR / ट्रांजैक्शन संदर्भ # (वैकल्पिक)
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. UPI-9218204 or Cash Receipt"
                        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                      <CheckCircle2 className="h-4 w-4 text-teal-600" />
                      <span>यह भुगतान चालक के खाते व मुख्य डेली पेमेंट जर्नल दोनों में स्वतः दर्ज हो जाएगा।</span>
                    </div>

                    <button type="submit" className="btn btn-primary">
                      <Plus className="h-4 w-4" />
                      + भुगतान दर्ज करें (Save Payment)
                    </button>
                  </div>
                </form>
              </div>

              {/* PAYMENT HISTORY */}
              <div className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-teal-700" />
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-ink)]">
                      {selectedDriver?.name} को अब तक दिए गए भुगतानों का इतिहास
                    </h3>
                    <span className="text-xs text-[var(--color-muted)]">
                      (कुल {filteredTransactions.length} एंट्रियां)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--color-muted)]">माह चुनें:</span>
                    <input
                      type="month"
                      value={filterMonthPayHistory === 'all' ? '' : filterMonthPayHistory}
                      onChange={(e) => setFilterMonthPayHistory(e.target.value || 'all')}
                      className="rounded-lg border border-[var(--color-line)] bg-white p-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                    {filterMonthPayHistory !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setFilterMonthPayHistory('all')}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        सभी देखें
                      </button>
                    )}
                    <span className="badge badge-success">
                      कुल दिया: ₹{totalFilteredPaid.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="px-4 py-12 text-center text-[var(--color-muted)]">
                    <IndianRupee className="mx-auto mb-2 h-10 w-10 opacity-30" />
                    <p className="text-sm font-medium text-[var(--color-ink)]">इस चालक के लिए कोई पिछला भुगतान रिकॉर्ड नहीं मिला।</p>
                    <p className="mt-1 text-xs">ऊपर दिए गए फॉर्म से पुराना या नया भुगतान दर्ज करें।</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
                        <tr>
                          <th className="p-3">तारीख (Date)</th>
                          <th className="p-3">किस चीज़ के लिए (Purpose)</th>
                          <th className="p-3">माध्यम (Mode)</th>
                          <th className="p-3">विवरण / नोट्स</th>
                          <th className="p-3 text-right">राशि (Amount)</th>
                          <th className="p-3 text-center">कार्रवाई</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-line)] text-[var(--color-ink)]">
                        {filteredTransactions.map((tx) => {
                          const isPenalty = tx.type === 'penalty_deduction';
                          const isSalary = tx.type === 'salary_payment';
                          return (
                            <tr key={tx.id} className="transition-colors hover:bg-[var(--color-surface-muted)]">
                              <td className="whitespace-nowrap p-3 font-medium">
                                {formatDate(tx.date)}
                              </td>
                              <td className="p-3">
                                <span
                                  className={
                                    isSalary
                                      ? 'badge badge-success'
                                      : isPenalty
                                      ? 'badge badge-danger'
                                      : tx.type === 'trip_expense' || tx.type === 'da_food_expense'
                                      ? 'badge badge-info'
                                      : 'badge badge-warning'
                                  }
                                >
                                  {tx.type === 'salary_payment'
                                    ? 'मासिक वेतन'
                                    : tx.type === 'advance'
                                    ? 'वेतन अग्रिम'
                                    : tx.type === 'da_food_expense'
                                    ? 'भोजन / DA'
                                    : tx.type === 'trip_expense'
                                    ? 'ट्रिप व्यय'
                                    : tx.type === 'fastag_topup'
                                    ? 'फास्टैग'
                                    : tx.type === 'penalty_deduction'
                                    ? 'कटौती/पेनल्टी'
                                    : tx.type === 'bonus'
                                    ? 'बोनस'
                                    : 'अग्रिम/व्यय'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap p-3 text-xs font-semibold uppercase text-[var(--color-muted)]">
                                {tx.paymentMode} {tx.referenceNumber ? `(${tx.referenceNumber})` : ''}
                              </td>
                              <td className="max-w-xs truncate p-3 text-[var(--color-muted)]">
                                {tx.description || '-'}
                                {tx.vehicleNumber && (
                                  <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">
                                    वाहन: {tx.vehicleNumber}
                                  </span>
                                )}
                              </td>
                              <td
                                className={`whitespace-nowrap p-3 text-right font-bold ${
                                  isPenalty ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink)]'
                                }`}
                              >
                                {isPenalty ? `-₹${tx.amount.toLocaleString('en-IN')}` : `₹${tx.amount.toLocaleString('en-IN')}`}
                              </td>
                              <td className="p-3 text-center">
                                {onDeleteTransaction && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteTransaction(tx.id)}
                                    title="हटाएं"
                                    className="rounded p-1 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: DRIVER LEAVE & SUBSTITUTE ("US DIN KA HISAB") */}
          {/* ============================================================== */}
          {activeTab === 'leaves' && (
            <div className="space-y-6">
              {leaveSuccessMsg && (
                <div className="alert-banner">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
                  <span className="text-sm font-semibold text-[var(--color-ink)]">{leaveSuccessMsg}</span>
                </div>
              )}

              {/* RECORD LEAVE & SUBSTITUTE FORM CARD */}
              <div className="panel panel-pad">
                <div className="mb-4 flex flex-col gap-2 border-b border-[var(--color-line)] pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">
                      <UserX className="h-4 w-4 text-teal-700" />
                      <span>चालक छुट्टी व बदली ड्राइवर दर्ज करें ("उस दिन का हिसाब व कौन गया")</span>
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      ड्राइवर ने कब छुट्टी ली, उसकी जगह बदली में कौन गया, और उस दिन का क्या हिसाब (वेतन कटौती / बदली भुगतान) रहा।
                    </p>
                  </div>
                  <span className="badge badge-neutral">
                    मुख्य चालक: {selectedDriver?.name}
                  </span>
                </div>

                <form onSubmit={handleSaveLeaveRecord} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                        छुट्टी प्रारंभ तारीख (From Date) *
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveStartDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                        छुट्टी समाप्ति तारीख (To Date) *
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveEndDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                        कुल अनुपस्थित दिन (Total Days) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          value={leaveTotalDays}
                          onChange={(e) => {
                            const d = Math.max(1, Number(e.target.value));
                            setLeaveTotalDays(d);
                            updateDeductionEstimate(d);
                          }}
                          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2 text-xs font-bold text-[var(--color-ink)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-[var(--color-muted)]">दिन</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                      छुट्टी का कारण (Reason for Absence) *
                    </label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <select
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="rounded-lg border border-[var(--color-line)] bg-white p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                      >
                        <option value="बीमारी / स्वास्थ्य अवकाश">बीमारी / स्वास्थ्य अवकाश (Sick Leave)</option>
                        <option value="घरेलू / पारिवारिक कार्य">घरेलू / पारिवारिक कार्य (Personal Work)</option>
                        <option value="शादी / समारोह में गए">शादी / मांगलिक समारोह (Wedding/Function)</option>
                        <option value="गांव प्रस्थान / आवश्यक कार्य">गांव गए हैं (Native Village Visit)</option>
                        <option value="बिना पूर्व सूचना अनुपस्थित">बिना पूर्व सूचना अनुपस्थित (Absent without info)</option>
                        <option value="अधिकारी द्वारा अधिकृत अवकाश">अधिकारी द्वारा स्वीकृत अवकाश (Sanctioned Leave)</option>
                        <option value="अन्य कारण">अन्य कारण (Other)</option>
                      </select>

                      <input
                        type="text"
                        value={leaveNotes}
                        onChange={(e) => setLeaveNotes(e.target.value)}
                        placeholder="विस्तृत टिप्पणी (जैसे: 2 दिन के लिए भाई की शादी में गए हैं)"
                        className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Substitute driver */}
                  <div className="space-y-3 rounded-xl border border-teal-200/70 bg-teal-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-900">
                        <ArrowRightLeft className="h-4 w-4 text-teal-700" />
                        <span>उसकी जगह कौन गया? (बदली ड्राइवर / Substitute Deployment)</span>
                      </span>

                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <label className="flex cursor-pointer items-center gap-1.5 font-medium text-[var(--color-ink)]">
                          <input
                            type="radio"
                            name="subType"
                            checked={substituteType === 'registered_driver'}
                            onChange={() => {
                              setHasSubstitute(true);
                              setSubstituteType('registered_driver');
                            }}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span>कंपनी का रजिस्टर्ड ड्राइवर</span>
                        </label>

                        <label className="flex cursor-pointer items-center gap-1.5 font-medium text-[var(--color-ink)]">
                          <input
                            type="radio"
                            name="subType"
                            checked={substituteType === 'temporary_driver'}
                            onChange={() => {
                              setHasSubstitute(true);
                              setSubstituteType('temporary_driver');
                            }}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span>अस्थायी / बाहरी बदली चालक</span>
                        </label>

                        <label className="flex cursor-pointer items-center gap-1.5 font-medium text-[var(--color-muted)]">
                          <input
                            type="radio"
                            name="subType"
                            checked={substituteType === 'none'}
                            onChange={() => {
                              setHasSubstitute(false);
                              setSubstituteType('none');
                            }}
                            className="text-[var(--color-muted)] focus:ring-teal-500"
                          />
                          <span>कोई नहीं (गाड़ी बंद / खड़ी रही)</span>
                        </label>
                      </div>
                    </div>

                    {substituteType === 'registered_driver' && (
                      <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                            बदली में गए चालक का चयन करें *
                          </label>
                          <select
                            required
                            value={substituteRegisteredDriverId}
                            onChange={(e) => setSubstituteRegisteredDriverId(e.target.value)}
                            className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                          >
                            <option value="">-- ड्राइवर चुनें --</option>
                            {drivers
                              .filter((d) => d.id !== selectedDriver?.id)
                              .map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name} ({d.phone})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                            दैनिक बदली दर (Daily Rate ₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={dailySubstitutePay}
                            onChange={(e) => setDailySubstitutePay(Number(e.target.value))}
                            className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                            कुल देय बदली भुगतान
                          </label>
                          <div className="rounded-lg border border-teal-300 bg-white p-2 text-xs font-bold text-teal-900 sm:text-sm">
                            ₹{computedTotalSubstituteCost.toLocaleString('en-IN')}{' '}
                            <span className="text-[11px] font-normal text-[var(--color-muted)]">
                              ({leaveTotalDays} दिन x ₹{dailySubstitutePay})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {substituteType === 'temporary_driver' && (
                      <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                            अस्थायी बदली चालक का नाम *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. मनोज कुमार / सोनू"
                            value={substituteTempName}
                            onChange={(e) => setSubstituteTempName(e.target.value)}
                            className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                            मोबाइल नंबर
                          </label>
                          <input
                            type="tel"
                            placeholder="98390XXXXX"
                            value={substituteTempPhone}
                            onChange={(e) => setSubstituteTempPhone(e.target.value)}
                            className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                            दैनिक भुगतान दर (₹/दिन)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={dailySubstitutePay}
                            onChange={(e) => setDailySubstitutePay(Number(e.target.value))}
                            className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Main driver deduction */}
                  <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-teal-700" />
                        <span className="text-xs font-bold text-[var(--color-ink)]">
                          उस दिन का हिसाब (मुख्य चालक से वेतन कटौती)
                        </span>
                      </div>

                      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--color-ink)]">
                        <input
                          type="checkbox"
                          checked={deductFromMainDriver}
                          onChange={(e) => setDeductFromMainDriver(e.target.checked)}
                          className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span>मुख्य ड्राइवर के मासिक वेतन से कटेगा</span>
                      </label>
                    </div>

                    {deductFromMainDriver ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-[var(--color-line)] bg-white p-2.5">
                          <span className="block text-[11px] text-[var(--color-muted)]">दैनिक वेतन दर (अनुमानित)</span>
                          <span className="text-sm font-bold text-[var(--color-ink)]">
                            ₹{Math.round((selectedDriver?.monthlySalary || 16500) / 30)} / दिन
                          </span>
                          <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">
                            (मूल वेतन ₹{selectedDriver?.monthlySalary} / 30 दिन)
                          </span>
                        </div>

                        <div className="rounded-lg border border-[var(--color-line)] bg-white p-2.5">
                          <span className="block text-[11px] text-[var(--color-muted)]">कुल काटी जाने वाली राशि</span>
                          <div className="mt-0.5 flex items-center gap-1">
                            <span className="text-sm font-bold text-[var(--color-danger)]">₹</span>
                            <input
                              type="number"
                              value={computedDeductionAmount}
                              onChange={(e) => setCustomDeductionAmount(e.target.value ? Number(e.target.value) : '')}
                              className="w-28 rounded border border-[var(--color-line)] p-1 text-sm font-bold text-[var(--color-danger)] focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                            />
                          </div>
                          <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">
                            (ज़रूरत अनुसार बदल भी सकते हैं)
                          </span>
                        </div>

                        <div className="flex flex-col justify-center rounded-lg border border-[var(--color-line)] bg-white p-2.5">
                          <span className="block text-[11px] text-[var(--color-muted)]">अंतिम स्थिति</span>
                          <span className="text-xs font-semibold text-[var(--color-ink)]">
                            मासिक हिसाब में से ₹{computedDeductionAmount} स्वतः कम हो जाएगा।
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-[var(--color-success-soft)] p-2 text-xs text-[var(--color-success)]">
                        वेतन कटौती बंद है (ड्राइवर को सवेतन अवकाश / पेड लीव माना जाएगा)।
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button type="submit" className="btn btn-primary">
                      <Plus className="h-4 w-4" />
                      छुट्टी व बदली रिकॉर्ड दर्ज करें (Save Leave & Substitute)
                    </button>
                  </div>
                </form>
              </div>

              {/* LEAVE & SUBSTITUTE HISTORY LOG */}
              <div className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-700" />
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-ink)]">
                      {selectedDriver?.name} की छुट्टी व बदली ड्राइवर का पूरा रिकॉर्ड
                    </h3>
                  </div>
                  <span className="badge badge-warning">
                    कुल छुट्टियां: {driverLeavesList.length} बार (
                    {driverLeavesList.reduce((s, l) => s + l.totalDays, 0)} दिन)
                  </span>
                </div>

                {driverLeavesList.length === 0 ? (
                  <div className="px-4 py-10 text-center text-[var(--color-muted)]">
                    <UserCheck className="mx-auto mb-2 h-10 w-10 text-teal-600 opacity-30" />
                    <p className="text-sm font-medium text-[var(--color-ink)]">इस चालक का कोई अवकाश या बदली रिकॉर्ड नहीं है।</p>
                    <p className="mt-1 text-xs">
                      जब भी ड्राइवर छुट्टी पर जाए तो ऊपर से उसकी एंट्री करें।
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--color-line)]">
                    {driverLeavesList.map((leave) => (
                      <div
                        key={leave.id}
                        className="flex flex-col items-start justify-between gap-4 p-4 text-xs transition-colors hover:bg-[var(--color-surface-muted)] sm:flex-row sm:items-center sm:text-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[var(--color-ink)]">
                              {formatDate(leave.startDate)}{' '}
                              {leave.endDate !== leave.startDate ? `से ${formatDate(leave.endDate)}` : ''}
                            </span>
                            <span className="badge badge-danger">
                              {leave.totalDays} दिन अनुपस्थित
                            </span>
                            <span className="badge badge-neutral">
                              कारण: {leave.leaveReason}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                            <span>
                              <strong className="text-[var(--color-ink)]">बदली ड्राइवर (Who replaced):</strong>{' '}
                              {leave.hasSubstitute ? (
                                <span className="font-semibold text-teal-800">
                                  {leave.substituteDriverName || 'बदली चालक'}{' '}
                                  {leave.substituteDriverPhone ? `(${leave.substituteDriverPhone})` : ''}
                                  {leave.totalSubstitutePaid > 0 && ` - भुगतान ₹${leave.totalSubstitutePaid}`}
                                </span>
                              ) : (
                                <span className="text-[var(--color-muted)]">कोई नहीं (गाड़ी बंद)</span>
                              )}
                            </span>

                            <span>
                              <strong className="text-[var(--color-ink)]">वेतन कटौती (Salary cut):</strong>{' '}
                              {leave.deductFromMainDriverSalary ? (
                                <span className="font-bold text-[var(--color-danger)]">-₹{leave.deductionAmount}</span>
                              ) : (
                                <span className="font-semibold text-[var(--color-success)]">शून्य (सवेतन)</span>
                              )}
                            </span>
                          </div>

                          {leave.notes && (
                            <p className="mt-0.5 text-xs italic text-[var(--color-muted)]">"{leave.notes}"</p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                          {onDeleteDriverLeave && (
                            <button
                              type="button"
                              onClick={() => onDeleteDriverLeave(leave.id)}
                              className="rounded p-1 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                              title="हटाएं"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: MONTHLY HISAB & BALANCE SHEET */}
          {/* ============================================================== */}
          {activeTab === 'monthly_hisab' && (
            <div className="space-y-6">
              {/* Month Selector Bar */}
              <div className="panel panel-pad flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-teal-700" />
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-ink)]">
                      माह-वार ड्राइवर हिसाब व बैलेंस शीट (Monthly Account Sheet)
                    </h3>
                    <p className="text-xs text-[var(--color-muted)]">
                      महीने भर के दिन, छुट्टियां, बदली हिसाब, कुल अग्रिम व शुद्ध देय राशि
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-[var(--color-ink)]">माह चुनें:</label>
                  <input
                    type="month"
                    value={selectedHisabMonth}
                    onChange={(e) => setSelectedHisabMonth(e.target.value)}
                    className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                  />
                  <button type="button" onClick={() => setShowPrintSlip(true)} className="btn btn-primary">
                    <Printer className="h-3.5 w-3.5" />
                    पर्ची प्रिंट / WhatsApp
                  </button>
                </div>
              </div>

              {/* MONTHLY SUMMARY METRIC CARDS */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="panel p-3.5">
                  <span className="block text-[11px] font-semibold uppercase text-[var(--color-muted)]">
                    1. मूल वेतन (Base)
                  </span>
                  <div className="mt-1 text-base font-bold text-[var(--color-ink)] sm:text-lg">
                    ₹{baseSalary.toLocaleString('en-IN')}
                  </div>
                  <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">
                    {monthDaysCount} दिन का तय मासिक वेतन
                  </span>
                </div>

                <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-3.5">
                  <span className="block text-[11px] font-semibold uppercase text-[var(--color-warning)]">
                    2. छुट्टियां (Leaves)
                  </span>
                  <div className="mt-1 text-base font-bold text-[var(--color-danger)] sm:text-lg">
                    -{formatCurrency(monthlyLeaveDeductions)}
                  </div>
                  <span className="mt-0.5 block text-[10px] text-[var(--color-warning)]">
                    {monthlyLeavesDays} दिन अनुपस्थित
                  </span>
                </div>

                <div className="panel p-3.5">
                  <span className="block text-[11px] font-semibold uppercase text-[var(--color-info)]">
                    3. भत्ते / बोनस (DA/Bonus)
                  </span>
                  <div className="mt-1 text-base font-bold text-[var(--color-info)] sm:text-lg">
                    +{formatCurrency(monthlyDaFoodBonus)}
                  </div>
                  <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">
                    ट्रिप, भोजन व अतिरिक्त कार्य
                  </span>
                </div>

                <div className="panel p-3.5">
                  <span className="block text-[11px] font-semibold uppercase text-[var(--color-ink)]">
                    4. अर्जित वेतन (Net Earned)
                  </span>
                  <div className="mt-1 text-base font-bold text-teal-700 sm:text-lg">
                    ₹{netEarnedWage.toLocaleString('en-IN')}
                  </div>
                  <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">
                    कटौती उपरांत वास्तविक वेतन
                  </span>
                </div>

                <div className="panel p-3.5">
                  <span className="block text-[11px] font-semibold uppercase text-[var(--color-muted)]">
                    5. कुल दिया भुगतान (Paid)
                  </span>
                  <div className="mt-1 text-base font-bold text-[var(--color-ink)] sm:text-lg">
                    ₹{totalMonthlyOutflowToDriver.toLocaleString('en-IN')}
                  </div>
                  <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">
                    अग्रिम + वेतन + फुटकर
                  </span>
                </div>

                <div
                  className={`rounded-xl border p-3.5 ${
                    remainingDueToDriver > 0
                      ? 'border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)]'
                      : remainingDueToDriver === 0
                      ? 'border-[var(--color-success)]/40 bg-[var(--color-success-soft)]'
                      : 'border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)]'
                  }`}
                >
                  <span className="block text-[11px] font-bold uppercase text-[var(--color-ink)]">
                    6. शुद्ध बकाया (Balance)
                  </span>
                  <div className="mt-1 text-base font-black sm:text-lg">
                    {remainingDueToDriver > 0 ? (
                      <span className="text-[var(--color-danger)]">₹{remainingDueToDriver.toLocaleString('en-IN')}</span>
                    ) : remainingDueToDriver === 0 ? (
                      <span className="text-[var(--color-success)]">पूर्ण चुकता</span>
                    ) : (
                      <span className="text-[var(--color-warning)]">₹{Math.abs(remainingDueToDriver)} एडवांस</span>
                    )}
                  </div>
                  <span className="mt-0.5 block text-[10px] opacity-80 text-[var(--color-muted)]">
                    {remainingDueToDriver > 0
                      ? 'ड्राइवर को देना शेष'
                      : remainingDueToDriver === 0
                      ? 'कोई बकाया नहीं'
                      : 'अग्रिम अधिक गया है'}
                  </span>
                </div>
              </div>

              {remainingDueToDriver > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--color-ink)] p-4 text-white">
                  <div>
                    <h4 className="text-sm font-bold">
                      चालक {selectedDriver?.name} का माह {selectedHisabMonth} का ₹{remainingDueToDriver.toLocaleString('en-IN')} बकाया है
                    </h4>
                    <p className="mt-0.5 text-xs text-white/75">
                      एक क्लिक में शेष राशि का वेतन भुगतान दर्ज करें और खाता क्लोज करें।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickSettleBalance}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[var(--color-ink)] transition-colors hover:bg-teal-50 sm:text-sm"
                  >
                    <IndianRupee className="h-4 w-4" />
                    शेष ₹{remainingDueToDriver} का भुगतान करें
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="panel panel-pad space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2.5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)]">
                      <Calendar className="h-4 w-4 text-teal-700" />
                      <span>माह की छुट्टियां व बदली विवरण</span>
                    </h4>
                    <span className="badge badge-warning">
                      कुल {monthlyLeavesDays} दिन
                    </span>
                  </div>

                  {monthlyLeaves.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--color-muted)]">
                      इस माह चालक ने कोई छुट्टी नहीं ली (पूर्ण उपस्थिति)।
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {monthlyLeaves.map((l) => (
                        <div key={l.id} className="flex items-start justify-between gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2.5">
                          <div>
                            <span className="block font-bold text-[var(--color-ink)]">
                              {formatDate(l.startDate)} ({l.totalDays} दिन)
                            </span>
                            <span className="block text-[var(--color-muted)]">कारण: {l.leaveReason}</span>
                            <span className="mt-0.5 block text-[var(--color-muted)]">
                              बदली चालक: <strong className="text-[var(--color-ink)]">{l.substituteDriverName || 'कोई नहीं'}</strong>
                            </span>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="block font-bold text-[var(--color-danger)]">
                              कटौती: -₹{l.deductionAmount}
                            </span>
                            {l.totalSubstitutePaid > 0 && (
                              <span className="block text-[10px] text-[var(--color-muted)]">
                                बदली खर्च: ₹{l.totalSubstitutePaid}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="panel panel-pad space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2.5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)]">
                      <IndianRupee className="h-4 w-4 text-teal-700" />
                      <span>माह में दिए गए भुगतानों की तारीख-वार सूची</span>
                    </h4>
                    <span className="badge badge-neutral">
                      कुल: ₹{totalMonthlyOutflowToDriver.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {monthlyTransactions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--color-muted)]">
                      इस माह में अब तक कोई भुगतान दर्ज नहीं किया गया।
                    </div>
                  ) : (
                    <div className="max-h-60 space-y-2 overflow-y-auto pr-1 text-xs">
                      {monthlyTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--color-ink)]">{formatDate(tx.date)}</span>
                              <span className="badge badge-info">
                                {tx.type === 'advance'
                                  ? 'अग्रिम'
                                  : tx.type === 'salary_payment'
                                  ? 'वेतन'
                                  : tx.type === 'da_food_expense'
                                  ? 'भोजन DA'
                                  : 'व्यय'}
                              </span>
                            </div>
                            <span className="block max-w-[220px] truncate text-[var(--color-muted)]">
                              {tx.description}
                            </span>
                          </div>

                          <div className="whitespace-nowrap text-right font-bold text-[var(--color-ink)]">
                            ₹{tx.amount.toLocaleString('en-IN')}
                            <span className="block text-[10px] font-normal uppercase text-[var(--color-muted)]">
                              {tx.paymentMode}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="h-2 w-2 rounded-full bg-teal-600" />
            <span>
              चालक: <strong className="text-[var(--color-ink)]">{selectedDriver?.name}</strong>
              {' | '}
              वाहन: <strong className="text-[var(--color-ink)]">{selectedVehicle?.vehicleNumber}</strong>
              {' | '}
              टेंडर: <strong className="text-[var(--color-ink)]">{selectedTender?.departmentName}</strong>
            </span>
          </div>

          <button type="button" onClick={onClose} className="btn btn-primary">
            बंद करें (Close)
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* PRINTABLE / SHAREABLE MONTHLY DRIVER HISAB SLIP MODAL */}
      {/* ============================================================== */}
      {showPrintSlip && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                चालक मासिक वेतन व हिसाब पर्ची (Driver Monthly Slip)
              </h3>
              <button
                onClick={() => setShowPrintSlip(false)}
                className="text-[var(--color-muted)] hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Content */}
            <div id="driver-slip-print-area" className="p-4 border border-slate-300 rounded-xl bg-slate-50/50 text-xs space-y-3 font-mono">
              <div className="text-center border-b pb-2">
                <h4 className="font-bold text-sm text-slate-900 uppercase">
                  शक्ति ट्रैवल्स एंड टूर्स (Shakti Travels & Tours)
                </h4>
                <p className="text-[11px] text-slate-600">
                  चालक मासिक वेतन व हिसाब पर्ची - माह: {selectedHisabMonth}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div><strong>चालक का नाम:</strong> {selectedDriver?.name}</div>
                <div><strong>मोबाइल:</strong> {selectedDriver?.phone}</div>
                <div><strong>गाड़ी नंबर:</strong> {selectedVehicle?.vehicleNumber}</div>
                <div><strong>टेंडर/विभाग:</strong> {selectedTender?.departmentName}</div>
                <div><strong>अधिकारी:</strong> {selectedOfficer?.name}</div>
                <div><strong>तय मूल वेतन:</strong> ₹{baseSalary}</div>
              </div>

              <div className="border-t border-b py-2 space-y-1">
                <div className="flex justify-between">
                  <span>माह के कुल दिन:</span>
                  <span>{monthDaysCount} दिन</span>
                </div>
                <div className="flex justify-between">
                  <span>छुट्टी / अनुपस्थित दिन:</span>
                  <span>{monthlyLeavesDays} दिन</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>छुट्टी वेतन कटौती:</span>
                  <span>-₹{monthlyLeaveDeductions}</span>
                </div>
                {monthlyDaFoodBonus > 0 && (
                  <div className="flex justify-between text-blue-700 font-bold">
                    <span>भत्ता / अतिरिक्त ड्यूटी:</span>
                    <span>+₹{monthlyDaFoodBonus}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                  <span>अर्जित वेतन (Net Earned):</span>
                  <span>₹{netEarnedWage}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">दिए गए अग्रिम / भुगतान विवरण:</span>
                {monthlyTransactions.length === 0 ? (
                  <div className="text-[var(--color-muted)] italic">कोई पूर्व भुगतान नहीं</div>
                ) : (
                  <div className="space-y-1">
                    {monthlyTransactions.map((t) => (
                      <div key={t.id} className="flex justify-between text-[11px]">
                        <span>{t.date} - {t.description} ({t.paymentMode}):</span>
                        <span className="font-bold">₹{t.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between border-t mt-1.5 pt-1 font-bold">
                  <span>कुल दिया गया भुगतान:</span>
                  <span>₹{totalMonthlyOutflowToDriver}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-200/80 font-bold text-slate-900 flex justify-between text-sm">
                <span>शुद्ध शेष देय / बकाया राशि:</span>
                <span className={remainingDueToDriver > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                  ₹{remainingDueToDriver} {remainingDueToDriver === 0 ? '(पूर्ण चुकता)' : ''}
                </span>
              </div>

              <div className="pt-6 flex justify-between text-[10px] text-[var(--color-muted)]">
                <div className="border-t border-slate-400 pt-1 w-32 text-center">
                  चालक के हस्ताक्षर
                </div>
                <div className="border-t border-slate-400 pt-1 w-36 text-center">
                  अधिकृत हस्ताक्षरकर्ता (Shakti)
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="btn btn-primary"
              >
                <Printer className="h-4 w-4" />
                प्रिंट निकालें (Print)
              </button>

              <button
                onClick={() => {
                  const text = `*शक्ति ट्रैवल्स एंड टूर्स - चालक हिसाब पर्ची*\nचालक: ${selectedDriver?.name} (${selectedDriver?.phone})\nगाड़ी: ${selectedVehicle?.vehicleNumber}\nमाह: ${selectedHisabMonth}\nमूल वेतन: ₹${baseSalary}\nछुट्टी: ${monthlyLeavesDays} दिन (-₹${monthlyLeaveDeductions})\nअर्जित वेतन: ₹${netEarnedWage}\nकुल दिया गया अग्रिम: ₹${totalMonthlyOutflowToDriver}\n*शुद्ध शेष बकाया:* ₹${remainingDueToDriver}`;
                  navigator.clipboard.writeText(text);
                  alert('व्हाट्सएप हेतु हिसाब टेक्स्ट कॉपी हो गया!');
                }}
                className="btn btn-success"
              >
                <Share2 className="h-4 w-4" />
                व्हाट्सएप कॉपी (Copy WhatsApp)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

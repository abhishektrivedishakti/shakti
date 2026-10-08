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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* MODAL HEADER WITH CONTEXT INDICATORS */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  चालक हिसाब, भुगतान व छुट्टी-बदली हब
                </span>
                <span className="text-xs text-slate-400">
                  (Single-Window Contextual Entry)
                </span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{selectedDriver?.name || 'चालक चुनें'}</span>
                <span className="text-sm font-normal text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                  मासिक मूल वेतन: {formatCurrency(selectedDriver?.monthlySalary || 16500)}
                </span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-2 flex-wrap">
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  <strong>गाड़ी:</strong> {selectedVehicle?.vehicleNumber || 'अनावंटित'} ({selectedVehicle?.makeModel || 'Model'})
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <strong>अधिकारी:</strong> {selectedOfficer?.name || 'पद रिक्त / सामान्य'} ({selectedOfficer?.designation || 'Dept'})
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <strong>टेंडर:</strong> {selectedTender?.departmentName || 'सामान्य फ्लीट'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Selectors bar if user wants to switch vehicle/driver inside the same tender */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-medium">वाहन बदलें:</span>
              <select
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} - {v.makeModel} {v.assignedOfficerId ? `(${officers.find(o => o.id === v.assignedOfficerId)?.name})` : ''}
                  </option>
                ))}
              </select>

              <span className="text-slate-400 font-medium ml-2">चालक बदलें:</span>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({formatCurrency(d.monthlySalary)}/माह) - {d.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-slate-300">
              संपर्क: <strong>{selectedDriver?.phone || 'N/A'}</strong> | ज्वाइनिंग:{' '}
              {selectedDriver?.joiningDate ? formatDate(selectedDriver.joiningDate) : '2026-01-01'}
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION STRIP */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex space-x-1 sm:space-x-2 py-2">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'payments'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <IndianRupee className="w-4 h-4" />
              <span>💰 चालक को भुगतान व पिछला हिसाब</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs ${activeTab === 'payments' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {driverTransactions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'leaves'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>🗓️ छुट्टी व बदली ड्राइवर ("उस दिन का हिसाब")</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs ${activeTab === 'leaves' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {driverLeavesList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('monthly_hisab')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'monthly_hisab'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>📊 मासिक हिसाब-किताब व पर्ची</span>
              {remainingDueToDriver > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-rose-500 text-white font-bold animate-pulse">
                  देय: ₹{remainingDueToDriver}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center text-xs text-slate-500">
            <span>✨ टेंडर व अधिकारी में रहते हुए तुरंत एंट्री</span>
          </div>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">

          {/* ============================================================== */}
          {/* TAB 1: PAYMENTS & PAST RECORD ENTRY */}
          {/* ============================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {paymentSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              {/* RECORD PAYMENT FORM CARD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <span>चालक को भुगतान / पिछला रिकॉर्ड दर्ज करें</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      (यदि आपने पहले कभी भी ड्राइवर को किसी भी चीज़ के लिए पैसा दिया हो, तो पिछली तारीख चुनकर तुरंत हिसाब में जोड़ें)
                    </p>
                  </div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-full border border-indigo-100">
                    चालक: {selectedDriver?.name}
                  </span>
                </div>

                <form onSubmit={handleSavePayment} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        भुगतान तारीख (Date) *
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400">पिछली तारीख भी चुन सकते हैं</span>
                    </div>

                    {/* Category / Reason ("Kis cheez ke liye") */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                      >
                        {paymentCategoryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        दी गई राशि (Amount ₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="2000"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                          className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 pl-7 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Payment Mode */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        भुगतान का माध्यम (Mode) *
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as any)}
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      >
                        <option value="cash">💵 नकद (Cash)</option>
                        <option value="upi">📱 UPI / PhonePe / GPay</option>
                        <option value="bank_transfer">🏦 बैंक ट्रांसफर / NEFT</option>
                      </select>
                    </div>
                  </div>

                  {/* Description & Reference */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        विवरण / टिप्पणी (Details / Notes)
                      </label>
                      <input
                        type="text"
                        value={paymentDesc}
                        onChange={(e) => setPaymentDesc(e.target.value)}
                        placeholder="जैसे: त्योहार अग्रिम, रास्ते का खाना-खर्चा, या पूर्ण वेतन चुकता"
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      {/* Quick chips */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="text-[11px] text-slate-400">त्वरित विवरण:</span>
                        {quickDescriptions.map((desc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPaymentDesc(desc)}
                            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                          >
                            {desc}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        UTR / ट्रांजैक्शन संदर्भ # (वैकल्पिक)
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. UPI-9218204 or Cash Receipt"
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>यह भुगतान चालक के खाते व मुख्य डेली पेमेंट जर्नल दोनों में स्वतः दर्ज हो जाएगा।</span>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>भुगतान दर्ज करें (Save Payment)</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* PAYMENT HISTORY FOR THIS DRIVER */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-slate-600" />
                    <h3 className="font-bold text-slate-800 text-sm">
                      {selectedDriver?.name} को अब तक दिए गए भुगतानों का इतिहास
                    </h3>
                    <span className="text-xs text-slate-500 font-normal">
                      (कुल {filteredTransactions.length} एंट्रियां)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600">माह चुनें:</span>
                    <input
                      type="month"
                      value={filterMonthPayHistory === 'all' ? '' : filterMonthPayHistory}
                      onChange={(e) => setFilterMonthPayHistory(e.target.value || 'all')}
                      className="text-xs border border-slate-300 rounded-lg p-1.5 focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                    {filterMonthPayHistory !== 'all' && (
                      <button
                        onClick={() => setFilterMonthPayHistory('all')}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        सभी देखें
                      </button>
                    )}
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-lg border border-emerald-200">
                      कुल दिया: ₹{totalFilteredPaid.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">इस चालक के लिए कोई पिछला भुगतान रिकॉर्ड नहीं मिला।</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ऊपर दिए गए फॉर्म से पुराना या नया भुगतान दर्ज करें।
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-100/70 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">तारीख (Date)</th>
                          <th className="p-3">किस चीज़ के लिए (Purpose)</th>
                          <th className="p-3">माध्यम (Mode)</th>
                          <th className="p-3">विवरण / नोट्स</th>
                          <th className="p-3 text-right">राशि (Amount)</th>
                          <th className="p-3 text-center">कार्रवाई</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {filteredTransactions.map((tx) => {
                          const isPenalty = tx.type === 'penalty_deduction';
                          const isSalary = tx.type === 'salary_payment';
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-medium whitespace-nowrap text-slate-900">
                                {formatDate(tx.date)}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    isSalary
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : isPenalty
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : tx.type === 'trip_expense' || tx.type === 'da_food_expense'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
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
                              <td className="p-3 uppercase text-xs font-semibold text-slate-500 whitespace-nowrap">
                                {tx.paymentMode} {tx.referenceNumber ? `(${tx.referenceNumber})` : ''}
                              </td>
                              <td className="p-3 text-slate-600 max-w-xs truncate">
                                {tx.description || '-'}
                                {tx.vehicleNumber && (
                                  <span className="text-[10px] text-slate-400 block">
                                    वाहन: {tx.vehicleNumber}
                                  </span>
                                )}
                              </td>
                              <td
                                className={`p-3 text-right font-bold whitespace-nowrap ${
                                  isPenalty ? 'text-rose-600' : 'text-slate-900'
                                }`}
                              >
                                {isPenalty ? `-₹${tx.amount.toLocaleString('en-IN')}` : `₹${tx.amount.toLocaleString('en-IN')}`}
                              </td>
                              <td className="p-3 text-center">
                                {onDeleteTransaction && (
                                  <button
                                    onClick={() => onDeleteTransaction(tx.id)}
                                    title="हटाएं"
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span>{leaveSuccessMsg}</span>
                </div>
              )}

              {/* RECORD LEAVE & SUBSTITUTE FORM CARD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <UserX className="w-4 h-4 text-amber-600" />
                      <span>चालक छुट्टी व बदली ड्राइवर दर्ज करें ("उस दिन का हिसाब व कौन गया")</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ड्राइवर ने कब छुट्टी ली, उसकी जगह बदली में कौन गया, और उस दिन का क्या हिसाब (वेतन कटौती / बदली भुगतान) रहा।
                    </p>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                    मुख्य चालक: {selectedDriver?.name}
                  </span>
                </div>

                <form onSubmit={handleSaveLeaveRecord} className="space-y-4">
                  {/* Dates & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        छुट्टी प्रारंभ तारीख (From Date) *
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveStartDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        छुट्टी समाप्ति तारीख (To Date) *
                      </label>
                      <input
                        type="date"
                        required
                        value={leaveEndDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                          className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400">दिन</span>
                      </div>
                    </div>
                  </div>

                  {/* Reason for Leave */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      छुट्टी का कारण (Reason for Absence) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        className="text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                      >
                        <option value="बीमारी / स्वास्थ्य अवकाश">🏥 बीमारी / स्वास्थ्य अवकाश (Sick Leave)</option>
                        <option value="घरेलू / पारिवारिक कार्य">🏠 घरेलू / पारिवारिक कार्य (Personal Work)</option>
                        <option value="शादी / समारोह में गए">🎉 शादी / मांगलिक समारोह (Wedding/Function)</option>
                        <option value="गांव प्रस्थान / आवश्यक कार्य">🌾 गांव गए हैं (Native Village Visit)</option>
                        <option value="बिना पूर्व सूचना अनुपस्थित">⚠️ बिना पूर्व सूचना अनुपस्थित (Absent without info)</option>
                        <option value="अधिकारी द्वारा अधिकृत अवकाश">📋 अधिकारी द्वारा स्वीकृत अवकाश (Sanctioned Leave)</option>
                        <option value="अन्य कारण">अन्य कारण (Other)</option>
                      </select>

                      <input
                        type="text"
                        value={leaveNotes}
                        onChange={(e) => setLeaveNotes(e.target.value)}
                        placeholder="विस्तृत टिप्पणी (जैसे: 2 दिन के लिए भाई की शादी में गए हैं)"
                        className="text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* "USKI JAGAH KAUN GAYA" - SUBSTITUTE DRIVER SECTION */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                        <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                        <span>उसकी जगह कौन गया? (बदली ड्राइवर / Substitute Deployment)</span>
                      </span>

                      <div className="flex items-center gap-4 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                          <input
                            type="radio"
                            name="subType"
                            checked={substituteType === 'registered_driver'}
                            onChange={() => {
                              setHasSubstitute(true);
                              setSubstituteType('registered_driver');
                            }}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span>कंपनी का रजिस्टर्ड ड्राइवर</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                          <input
                            type="radio"
                            name="subType"
                            checked={substituteType === 'temporary_driver'}
                            onChange={() => {
                              setHasSubstitute(true);
                              setSubstituteType('temporary_driver');
                            }}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span>अस्थायी / बाहरी बदली चालक</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-500">
                          <input
                            type="radio"
                            name="subType"
                            checked={substituteType === 'none'}
                            onChange={() => {
                              setHasSubstitute(false);
                              setSubstituteType('none');
                            }}
                            className="text-slate-400 focus:ring-slate-400"
                          />
                          <span>कोई नहीं (गाड़ी बंद / खड़ी रही)</span>
                        </label>
                      </div>
                    </div>

                    {/* Sub driver inputs */}
                    {substituteType === 'registered_driver' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            बदली में गए चालक का चयन करें *
                          </label>
                          <select
                            required
                            value={substituteRegisteredDriverId}
                            onChange={(e) => setSubstituteRegisteredDriverId(e.target.value)}
                            className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
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
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            दैनिक बदली दर (Daily Rate ₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={dailySubstitutePay}
                            onChange={(e) => setDailySubstitutePay(Number(e.target.value))}
                            className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            कुल देय बदली भुगतान
                          </label>
                          <div className="p-2 bg-white rounded-lg border border-amber-300 font-bold text-amber-900 text-xs sm:text-sm">
                            ₹{computedTotalSubstituteCost.toLocaleString('en-IN')}{' '}
                            <span className="text-[11px] font-normal text-slate-500">
                              ({leaveTotalDays} दिन x ₹{dailySubstitutePay})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {substituteType === 'temporary_driver' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            अस्थायी बदली चालक का नाम *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. मनोज कुमार / सोनू"
                            value={substituteTempName}
                            onChange={(e) => setSubstituteTempName(e.target.value)}
                            className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            मोबाइल नंबर
                          </label>
                          <input
                            type="tel"
                            placeholder="98390XXXXX"
                            value={substituteTempPhone}
                            onChange={(e) => setSubstituteTempPhone(e.target.value)}
                            className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            दैनिक भुगतान दर (₹/दिन)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={dailySubstitutePay}
                            onChange={(e) => setDailySubstitutePay(Number(e.target.value))}
                            className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* "USS DIN KA HISAB" - MAIN DRIVER DEDUCTION CALCULATION */}
                  <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-700" />
                        <span className="text-xs font-bold text-slate-800">
                          उस दिन का हिसाब (मुख्य चालक से वेतन कटौती)
                        </span>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deductFromMainDriver}
                          onChange={(e) => setDeductFromMainDriver(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                        />
                        <span>मुख्य ड्राइवर के मासिक वेतन से कटेगा</span>
                      </label>
                    </div>

                    {deductFromMainDriver ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[11px] text-slate-500 block">दैनिक वेतन दर (अनुमानित)</span>
                          <span className="font-bold text-slate-800 text-sm">
                            ₹{Math.round((selectedDriver?.monthlySalary || 16500) / 30)} / दिन
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            (मूल वेतन ₹{selectedDriver?.monthlySalary} / 30 दिन)
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[11px] text-slate-500 block">कुल काटी जाने वाली राशि</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-sm font-bold text-rose-600">₹</span>
                            <input
                              type="number"
                              value={computedDeductionAmount}
                              onChange={(e) => setCustomDeductionAmount(e.target.value ? Number(e.target.value) : '')}
                              className="w-28 text-sm font-bold text-rose-600 border border-slate-300 rounded p-1 focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            (ज़रूरत अनुसार बदल भी सकते हैं)
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-center">
                          <span className="text-[11px] text-slate-500 block">अंतिम स्थिति</span>
                          <span className="text-xs font-semibold text-slate-700">
                            मासिक हिसाब में से ₹{computedDeductionAmount} स्वतः कम हो जाएगा।
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 text-xs">
                        वेतन कटौती बंद है (ड्राइवर को सवेतन अवकाश / पेड लीव माना जाएगा)।
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>छुट्टी व बदली रिकॉर्ड दर्ज करें (Save Leave & Substitute)</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* LEAVE & SUBSTITUTE HISTORY LOG */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-slate-800 text-sm">
                      {selectedDriver?.name} की छुट्टी व बदली ड्राइवर का पूरा रिकॉर्ड
                    </h3>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full">
                    कुल छुट्टियां: {driverLeavesList.length} बार (
                    {driverLeavesList.reduce((s, l) => s + l.totalDays, 0)} दिन)
                  </span>
                </div>

                {driverLeavesList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                    <p className="text-sm font-medium">इस चालक का कोई अवकाश या बदली रिकॉर्ड नहीं है।</p>
                    <p className="text-xs text-slate-400 mt-1">
                      जब भी ड्राइवर छुट्टी पर जाए तो ऊपर से उसकी एंट्री करें।
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {driverLeavesList.map((leave) => (
                      <div
                        key={leave.id}
                        className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs sm:text-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              {formatDate(leave.startDate)}{' '}
                              {leave.endDate !== leave.startDate ? `से ${formatDate(leave.endDate)}` : ''}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              {leave.totalDays} दिन अनुपस्थित
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                              कारण: {leave.leaveReason}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                            <span>
                              <strong>बदली ड्राइवर (Who replaced):</strong>{' '}
                              {leave.hasSubstitute ? (
                                <span className="text-amber-800 font-semibold">
                                  {leave.substituteDriverName || 'बदली चालक'}{' '}
                                  {leave.substituteDriverPhone ? `(${leave.substituteDriverPhone})` : ''}
                                  {leave.totalSubstitutePaid > 0 && ` - भुगतान ₹${leave.totalSubstitutePaid}`}
                                </span>
                              ) : (
                                <span className="text-slate-400">कोई नहीं (गाड़ी बंद)</span>
                              )}
                            </span>

                            <span>
                              <strong>वेतन कटौती (Salary cut):</strong>{' '}
                              {leave.deductFromMainDriverSalary ? (
                                <span className="text-rose-600 font-bold">-₹{leave.deductionAmount}</span>
                              ) : (
                                <span className="text-emerald-600 font-semibold">शून्य (सवेतन)</span>
                              )}
                            </span>
                          </div>

                          {leave.notes && (
                            <p className="text-xs text-slate-500 italic mt-0.5">"{leave.notes}"</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                          {onDeleteDriverLeave && (
                            <button
                              onClick={() => onDeleteDriverLeave(leave.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors"
                              title="हटाएं"
                            >
                              <Trash2 className="w-4 h-4" />
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
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      माह-वार ड्राइवर हिसाब व बैलेंस शीट (Monthly Account Sheet)
                    </h3>
                    <p className="text-xs text-slate-500">
                      महीने भर के दिन, छुट्टियां, बदली हिसाब, कुल अग्रिम व शुद्ध देय राशि
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-700">माह चुनें:</label>
                  <input
                    type="month"
                    value={selectedHisabMonth}
                    onChange={(e) => setSelectedHisabMonth(e.target.value)}
                    className="text-xs sm:text-sm font-bold border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                  />
                  <button
                    onClick={() => setShowPrintSlip(true)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>पर्ची प्रिंट / WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* MONTHLY SUMMARY METRIC CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Base Salary */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    1. मूल वेतन (Base)
                  </span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                    ₹{baseSalary.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {monthDaysCount} दिन का तय मासिक वेतन
                  </span>
                </div>

                {/* 2. Leaves & Deductions */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
                  <span className="text-[11px] font-semibold text-amber-700 block uppercase">
                    2. छुट्टियां (Leaves)
                  </span>
                  <div className="text-base sm:text-lg font-bold text-rose-600 mt-1">
                    -{formatCurrency(monthlyLeaveDeductions)}
                  </div>
                  <span className="text-[10px] text-amber-800 block mt-0.5">
                    {monthlyLeavesDays} दिन अनुपस्थित
                  </span>
                </div>

                {/* 3. Extra Allowance / DA */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-blue-700 block uppercase">
                    3. भत्ते / बोनस (DA/Bonus)
                  </span>
                  <div className="text-base sm:text-lg font-bold text-blue-600 mt-1">
                    +{formatCurrency(monthlyDaFoodBonus)}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ट्रिप, भोजन व अतिरिक्त कार्य
                  </span>
                </div>

                {/* 4. Net Earned Salary */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-700 block uppercase">
                    4. अर्जित वेतन (Net Earned)
                  </span>
                  <div className="text-base sm:text-lg font-bold text-indigo-700 mt-1">
                    ₹{netEarnedWage.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    कटौती उपरांत वास्तविक वेतन
                  </span>
                </div>

                {/* 5. Payments / Advances Given */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    5. कुल दिया भुगतान (Paid)
                  </span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                    ₹{totalMonthlyOutflowToDriver.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    अग्रिम + वेतन + फुटकर
                  </span>
                </div>

                {/* 6. NET BALANCE DUE */}
                <div
                  className={`p-3.5 rounded-xl border shadow-xs ${
                    remainingDueToDriver > 0
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : remainingDueToDriver === 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase block">
                    6. शुद्ध बकाया (Balance)
                  </span>
                  <div className="text-base sm:text-lg font-black mt-1">
                    {remainingDueToDriver > 0 ? (
                      <span className="text-rose-600">₹{remainingDueToDriver.toLocaleString('en-IN')}</span>
                    ) : remainingDueToDriver === 0 ? (
                      <span className="text-emerald-700">पूर्ण चुकता</span>
                    ) : (
                      <span className="text-amber-700">₹{Math.abs(remainingDueToDriver)} एडवांस</span>
                    )}
                  </div>
                  <span className="text-[10px] opacity-80 block mt-0.5">
                    {remainingDueToDriver > 0
                      ? 'ड्राइवर को देना शेष'
                      : remainingDueToDriver === 0
                      ? 'कोई बकाया नहीं'
                      : 'अग्रिम अधिक गया है'}
                  </span>
                </div>
              </div>

              {/* QUICK SETTLEMENT BAR IF BALANCE DUE */}
              {remainingDueToDriver > 0 && (
                <div className="p-4 bg-gradient-to-r from-rose-500 to-amber-600 text-white rounded-2xl shadow-sm flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="font-bold text-sm">
                      चालक {selectedDriver?.name} का माह {selectedHisabMonth} का ₹{remainingDueToDriver.toLocaleString('en-IN')} बकाया है
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      एक क्लिक में शेष राशि का वेतन भुगतान दर्ज करें और खाता क्लोज करें।
                    </p>
                  </div>

                  <button
                    onClick={handleQuickSettleBalance}
                    className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <IndianRupee className="w-4 h-4" />
                    <span>शेष ₹{remainingDueToDriver} का भुगतान करें</span>
                  </button>
                </div>
              )}

              {/* DETAILED MONTHLY STATEMENT: TWO COLUMNS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Monthly Leaves & Substitute Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>माह की छुट्टियां व बदली विवरण</span>
                    </h4>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      कुल {monthlyLeavesDays} दिन
                    </span>
                  </div>

                  {monthlyLeaves.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      इस माह चालक ने कोई छुट्टी नहीं ली (पूर्ण उपस्थिति)।
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {monthlyLeaves.map((l) => (
                        <div key={l.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {formatDate(l.startDate)} ({l.totalDays} दिन)
                            </span>
                            <span className="text-slate-500 block">कारण: {l.leaveReason}</span>
                            <span className="text-slate-600 block mt-0.5">
                              बदली चालक: <strong>{l.substituteDriverName || 'कोई नहीं'}</strong>
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-rose-600 font-bold block">
                              कटौती: -₹{l.deductionAmount}
                            </span>
                            {l.totalSubstitutePaid > 0 && (
                              <span className="text-slate-500 text-[10px] block">
                                बदली खर्च: ₹{l.totalSubstitutePaid}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Itemized Payments Made in this Month */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-indigo-600" />
                      <span>माह में दिए गए भुगतानों की तारीख-वार सूची</span>
                    </h4>
                    <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      कुल: ₹{totalMonthlyOutflowToDriver.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {monthlyTransactions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      इस माह में अब तक कोई भुगतान दर्ज नहीं किया गया।
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs max-h-60 overflow-y-auto pr-1">
                      {monthlyTransactions.map((tx) => (
                        <div key={tx.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{formatDate(tx.date)}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                                {tx.type === 'advance'
                                  ? 'अग्रिम'
                                  : tx.type === 'salary_payment'
                                  ? 'वेतन'
                                  : tx.type === 'da_food_expense'
                                  ? 'भोजन DA'
                                  : 'व्यय'}
                              </span>
                            </div>
                            <span className="text-slate-500 block truncate max-w-[220px]">
                              {tx.description}
                            </span>
                          </div>

                          <div className="text-right font-bold text-slate-900 whitespace-nowrap">
                            ₹{tx.amount.toLocaleString('en-IN')}
                            <span className="text-[10px] text-slate-400 font-normal block uppercase">
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

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              चालक: <strong>{selectedDriver?.name}</strong> | वाहन: <strong>{selectedVehicle?.vehicleNumber}</strong> | टेंडर: <strong>{selectedTender?.departmentName}</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
          >
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
                className="text-slate-400 hover:text-slate-700 p-1"
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
                  <div className="text-slate-400 italic">कोई पूर्व भुगतान नहीं</div>
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

              <div className="pt-6 flex justify-between text-[10px] text-slate-500">
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>प्रिंट निकालें (Print)</span>
              </button>

              <button
                onClick={() => {
                  const text = `*शक्ति ट्रैवल्स एंड टूर्स - चालक हिसाब पर्ची*\nचालक: ${selectedDriver?.name} (${selectedDriver?.phone})\nगाड़ी: ${selectedVehicle?.vehicleNumber}\nमाह: ${selectedHisabMonth}\nमूल वेतन: ₹${baseSalary}\nछुट्टी: ${monthlyLeavesDays} दिन (-₹${monthlyLeaveDeductions})\nअर्जित वेतन: ₹${netEarnedWage}\nकुल दिया गया अग्रिम: ₹${totalMonthlyOutflowToDriver}\n*शुद्ध शेष बकाया:* ₹${remainingDueToDriver}`;
                  navigator.clipboard.writeText(text);
                  alert('व्हाट्सएप हेतु हिसाब टेक्स्ट कॉपी हो गया!');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>व्हाट्सएप कॉपी (Copy WhatsApp)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

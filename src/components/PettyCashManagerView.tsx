import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Car,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Fuel,
  Wrench,
  Sparkles,
  Coffee,
  FileText,
  DollarSign,
  AlertCircle,
  UserCheck,
  Building2,
  Check,
  X,
  CreditCard,
  User,
} from 'lucide-react';
import {
  PettyCashTransaction,
  PettyCashExpenseCategory,
  StaffUser,
  Vehicle,
} from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';

interface PettyCashManagerViewProps {
  pettyCashTransactions: PettyCashTransaction[];
  staffUsers: StaffUser[];
  vehicles: Vehicle[];
  currentUser: StaffUser;
  onAddTransaction: (txn: PettyCashTransaction) => void;
  onUpdateTransaction: (txn: PettyCashTransaction) => void;
}

export const PettyCashManagerView: React.FC<PettyCashManagerViewProps> = ({
  pettyCashTransactions,
  staffUsers,
  vehicles,
  currentUser,
  onAddTransaction,
  onUpdateTransaction,
}) => {
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [isGiveCashModalOpen, setIsGiveCashModalOpen] = useState(false);
  const [isRecordExpenseModalOpen, setIsRecordExpenseModalOpen] = useState(false);

  // Form State: Give Cash to Boy / Staff
  const [giveCashStaffId, setGiveCashStaffId] = useState<string>(
    staffUsers.find((s) => s.role === 'office_boy_cashier')?.id || staffUsers[0]?.id || ''
  );
  const [giveCashAmount, setGiveCashAmount] = useState<number>(5000);
  const [giveCashDate, setGiveCashDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [giveCashTime, setGiveCashTime] = useState<string>('10:00');
  const [giveCashMode, setGiveCashMode] = useState<'Cash' | 'UPI / PhonePe' | 'Card'>('Cash');
  const [giveCashNotes, setGiveCashNotes] = useState<string>('दैनिक फुटकर खर्च हेतु नकद अग्रिम (Cash Float)');

  // Form State: Record Expense
  const [expenseStaffId, setExpenseStaffId] = useState<string>(
    currentUser.role === 'office_boy_cashier' ? currentUser.id : staffUsers.find((s) => s.role === 'office_boy_cashier')?.id || staffUsers[0]?.id || ''
  );
  const [expenseCategory, setExpenseCategory] = useState<PettyCashExpenseCategory>('fuel_emergency');
  const [expenseAmount, setExpenseAmount] = useState<number>(500);
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expenseTime, setExpenseTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [expenseVehicleId, setExpenseVehicleId] = useState<string>('');
  const [expensePayee, setExpensePayee] = useState<string>('');
  const [expenseSlipNo, setExpenseSlipNo] = useState<string>(`SLIP-${Math.floor(100 + Math.random() * 900)}`);
  const [expenseMode, setExpenseMode] = useState<'Cash' | 'UPI / PhonePe' | 'Card'>('Cash');
  const [expenseNotes, setExpenseNotes] = useState<string>('');

  // Calculate live balances per staff member
  const staffBalances = useMemo(() => {
    const balances: Record<string, { staff: StaffUser; totalInflow: number; totalExpense: number; cashInHand: number }> = {};
    
    staffUsers.forEach((s) => {
      balances[s.id] = { staff: s, totalInflow: 0, totalExpense: 0, cashInHand: 0 };
    });

    pettyCashTransactions.forEach((txn) => {
      if (!balances[txn.staffUserId]) {
        balances[txn.staffUserId] = {
          staff: { id: txn.staffUserId, name: txn.staffUserName, designation: 'Staff', role: 'office_boy_cashier' } as any,
          totalInflow: 0,
          totalExpense: 0,
          cashInHand: 0,
        };
      }

      if (txn.type === 'cash_inflow') {
        balances[txn.staffUserId].totalInflow += txn.amount;
      } else if (txn.type === 'cash_expense') {
        balances[txn.staffUserId].totalExpense += txn.amount;
      }
    });

    Object.keys(balances).forEach((sId) => {
      balances[sId].cashInHand = balances[sId].totalInflow - balances[sId].totalExpense;
    });

    return balances;
  }, [staffUsers, pettyCashTransactions]);

  // Overall Totals
  const overallInflow = useMemo(
    () => pettyCashTransactions.filter((t) => t.type === 'cash_inflow').reduce((sum, t) => sum + t.amount, 0),
    [pettyCashTransactions]
  );
  const overallExpenses = useMemo(
    () => pettyCashTransactions.filter((t) => t.type === 'cash_expense').reduce((sum, t) => sum + t.amount, 0),
    [pettyCashTransactions]
  );
  const overallCashInHand = overallInflow - overallExpenses;
  const pendingCount = useMemo(
    () => pettyCashTransactions.filter((t) => t.type === 'cash_expense' && t.approvalStatus === 'pending_verification').length,
    [pettyCashTransactions]
  );

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return pettyCashTransactions.filter((txn) => {
      const matchesStaff = selectedStaffFilter === 'all' || txn.staffUserId === selectedStaffFilter;
      const matchesCat =
        selectedCategoryFilter === 'all' ||
        (selectedCategoryFilter === 'cash_inflow' && txn.type === 'cash_inflow') ||
        txn.category === selectedCategoryFilter;
      const matchesStatus =
        selectedStatusFilter === 'all' || txn.approvalStatus === selectedStatusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        txn.staffUserName.toLowerCase().includes(q) ||
        (txn.vehicleNumber && txn.vehicleNumber.toLowerCase().includes(q)) ||
        (txn.payeeOrVendor && txn.payeeOrVendor.toLowerCase().includes(q)) ||
        (txn.billSlipNumber && txn.billSlipNumber.toLowerCase().includes(q)) ||
        txn.notes.toLowerCase().includes(q);

      return matchesStaff && matchesCat && matchesStatus && matchesSearch;
    });
  }, [pettyCashTransactions, selectedStaffFilter, selectedCategoryFilter, selectedStatusFilter, searchQuery]);

  const handleGiveCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffUsers.find((s) => s.id === giveCashStaffId);
    if (!staff || giveCashAmount <= 0) {
      alert('कृपया वैध स्टाफ और अग्रिम राशि दर्ज करें।');
      return;
    }

    const newTxn: PettyCashTransaction = {
      id: `pc-${Date.now()}`,
      type: 'cash_inflow',
      staffUserId: staff.id,
      staffUserName: staff.name,
      date: giveCashDate,
      time: giveCashTime,
      amount: Number(giveCashAmount),
      notes: giveCashNotes.trim() || 'ऑफिस से नकद अग्रिम दिया गया',
      paymentMode: giveCashMode,
      approvalStatus: 'approved',
      approvedByAdmin: currentUser.name,
      approvedAt: `${giveCashDate} ${giveCashTime}`,
    };

    onAddTransaction(newTxn);
    setIsGiveCashModalOpen(false);
    setGiveCashAmount(5000);
    setGiveCashNotes('दैनिक फुटकर खर्च हेतु नकद अग्रिम (Cash Float)');
  };

  const handleRecordExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffUsers.find((s) => s.id === expenseStaffId);
    if (!staff || expenseAmount <= 0) {
      alert('कृपया वैध खर्च राशि दर्ज करें।');
      return;
    }

    const veh = vehicles.find((v) => v.id === expenseVehicleId);

    const newTxn: PettyCashTransaction = {
      id: `pc-${Date.now()}`,
      type: 'cash_expense',
      staffUserId: staff.id,
      staffUserName: staff.name,
      date: expenseDate,
      time: expenseTime,
      amount: Number(expenseAmount),
      category: expenseCategory,
      vehicleId: veh?.id,
      vehicleNumber: veh?.vehicleNumber,
      payeeOrVendor: expensePayee.trim(),
      billSlipNumber: expenseSlipNo.trim(),
      notes: expenseNotes.trim() || 'दैनिक फील्ड खर्च',
      paymentMode: expenseMode,
      approvalStatus: currentUser.role === 'admin' ? 'approved' : 'pending_verification',
      approvedByAdmin: currentUser.role === 'admin' ? currentUser.name : undefined,
      approvedAt: currentUser.role === 'admin' ? `${expenseDate} ${expenseTime}` : undefined,
    };

    onAddTransaction(newTxn);
    setIsRecordExpenseModalOpen(false);
    setExpenseAmount(500);
    setExpenseNotes('');
    setExpensePayee('');
    setExpenseSlipNo(`SLIP-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleToggleApproval = (txn: PettyCashTransaction) => {
    const updated: PettyCashTransaction = {
      ...txn,
      approvalStatus: txn.approvalStatus === 'approved' ? 'pending_verification' : 'approved',
      approvedByAdmin: txn.approvalStatus === 'approved' ? undefined : currentUser.name,
      approvedAt: txn.approvalStatus === 'approved' ? undefined : new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    onUpdateTransaction(updated);
  };

  const getCategoryLabel = (cat?: PettyCashExpenseCategory) => {
    switch (cat) {
      case 'fuel_emergency':
        return { label: 'ईंधन / पेट्रोल पंप (Fuel)', color: 'bg-blue-100 text-blue-800' };
      case 'servicing_puncture':
        return { label: 'सर्विसिंग / पंचर (Service)', color: 'bg-amber-100 text-amber-800' };
      case 'vehicle_accessories':
        return { label: 'गाड़ी एक्सेसरीज (Accessories)', color: 'bg-purple-100 text-purple-800' };
      case 'fastag_toll_cash':
        return { label: 'फास्टैग / नकद टोल (Fastag/Toll)', color: 'bg-indigo-100 text-indigo-800' };
      case 'car_wash_cleaning':
        return { label: 'गाड़ी धुलाई व सफाई (Car Wash)', color: 'bg-cyan-100 text-cyan-800' };
      case 'driver_refreshments':
        return { label: 'चालक चाय-नाश्ता (Refreshment)', color: 'bg-rose-100 text-rose-800' };
      case 'rto_puc_cash':
        return { label: 'PUC / प्रदूषण रसीद', color: 'bg-emerald-100 text-emerald-800' };
      case 'office_errands':
        return { label: 'रसीद बुक / कार्यालय खर्च', color: 'bg-slate-100 text-slate-800' };
      default:
        return { label: 'अन्य फुटकर खर्च (Misc)', color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <span>Petty Cash &amp; Field Expenses &bull; पेटी कैश व दैनिक फुटकर खर्च खाता</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ऑफिस बॉय या फील्ड सुपरवाइजर को नकद अग्रिम देना, गाड़ियों का ईंधन, पंचर, एक्सेसरीज व फुटकर खर्चों का सटीक हिसाब
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsGiveCashModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            + लड़के को नकद दें (Give Cash Float)
          </button>

          <button
            onClick={() => setIsRecordExpenseModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Receipt className="w-4 h-4" />
            + दैनिक खर्च दर्ज करें (Add Expense)
          </button>
        </div>
      </div>

      {/* Cash In Hand & Imprest Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Total Cash In Hand */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
            कुल हाथ में नकद बैलेंस (Net Cash in Hand)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${overallCashInHand >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(overallCashInHand)}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live Balance
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            कुल प्राप्त अग्रिम - कुल स्वीकृत खर्च
          </p>
        </div>

        {/* Total Inflow / Advance Given */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
            ऑफिस से दिया गया कुल नकद (Total Advances)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-700 font-mono">
              {formatCurrency(overallInflow)}
            </span>
            <span className="text-[11px] font-semibold text-blue-600">Float Given</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            कार्यालय द्वारा लड़कों/स्टाफ को हस्तांतरित
          </p>
        </div>

        {/* Total Expenses Recorded */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
            कुल किया गया दैनिक खर्च (Total Expenses)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-700 font-mono">
              {formatCurrency(overallExpenses)}
            </span>
            <span className="text-[11px] font-semibold text-rose-600">Disbursed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            फ्यूल, पंचर, एक्सेसरीज व फुटकर खर्च
          </p>
        </div>

        {/* Pending Approval Slips */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
            सत्यापन हेतु लंबित पर्चियां (Pending Verification)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700 font-mono">
              {pendingCount} Slips
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${pendingCount > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
              {pendingCount > 0 ? 'Action Needed' : 'All Clear'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            मालिक/एडमिन द्वारा पास करने हेतु बाकी
          </p>
        </div>
      </div>

      {/* Staff Cash In Hand Cards: Sonu Pal, Vikram, Suresh etc. */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>स्टाफ अनुसार हाथ में नकद बैलेंस (Staff Cash-in-Hand Float):</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            किस लड़के के पास अभी कितना नकद बाकी है
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {Object.values(staffBalances)
            .filter((item) => item.totalInflow > 0 || item.totalExpense > 0 || item.staff.role === 'office_boy_cashier')
            .map(({ staff, totalInflow, totalExpense, cashInHand }) => (
              <div
                key={staff.id}
                onClick={() => setSelectedStaffFilter(staff.id)}
                className={`p-3 bg-white rounded-lg border transition-all cursor-pointer shadow-2xs hover:border-indigo-300 ${
                  selectedStaffFilter === staff.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900">{staff.name}</div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                    {staff.role === 'office_boy_cashier' ? 'पेटी कैश बॉय' : staff.role === 'fleet_manager' ? 'फ्लीट मैनेजर' : 'स्टाफ'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">{staff.designation}</div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-semibold">हाथ में नकद:</span>
                    <span className={`text-base font-bold font-mono ${cashInHand >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatCurrency(cashInHand)}
                    </span>
                  </div>
                  <div className="text-right text-[10px] text-slate-500">
                    <div>मिला: {formatCurrency(totalInflow)}</div>
                    <div>खर्च: {formatCurrency(totalExpense)}</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Search Expense, Vehicle, Shop or Slip No:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. UP32, Sonu, Puncture, Wiper, Tea, BPCL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              स्टाफ सदस्य (Staff Member):
            </label>
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Staff ({staffUsers.length})</option>
              {staffUsers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              खर्च श्रेणी (Category):
            </label>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Transactions</option>
              <option value="cash_inflow">📥 ऑफिस से नकद प्राप्त (Cash Inflow)</option>
              <option value="fuel_emergency">⛽ ईंधन / पेट्रोल पंप (Fuel)</option>
              <option value="servicing_puncture">🔧 सर्विसिंग / पंचर (Service)</option>
              <option value="vehicle_accessories">✨ गाड़ी एक्सेसरीज (Accessories)</option>
              <option value="fastag_toll_cash">💳 फास्टैग / नकद टोल</option>
              <option value="car_wash_cleaning">🚿 गाड़ी धुलाई व सफाई</option>
              <option value="driver_refreshments">☕ चालक चाय-नाश्ता</option>
              <option value="rto_puc_cash">📄 PUC / प्रदूषण रसीद</option>
              <option value="office_errands">🏢 रसीद बुक / कार्यालय खर्च</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              स्वीकृति स्थिति (Status):
            </label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Status</option>
              <option value="approved">स्वीकृत / पास (Approved)</option>
              <option value="pending_verification">सत्यापन बाकी (Pending)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
          <span>
            Showing <strong>{filteredTransactions.length}</strong> transactions
          </span>
          {(selectedStaffFilter !== 'all' || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStaffFilter('all');
                setSelectedCategoryFilter('all');
                setSelectedStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Reset Filters &times;
            </button>
          )}
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">तारीख व समय</th>
                <th className="p-3">स्टाफ सदस्य (लड़का)</th>
                <th className="p-3">प्रकार व श्रेणी (Category)</th>
                <th className="p-3">गाड़ी नंबर / टेंडर</th>
                <th className="p-3">दुकानदार / वेंडर व रसीद संख्या</th>
                <th className="p-3 text-right">राशि (Amount)</th>
                <th className="p-3">स्थिति (Status)</th>
                <th className="p-3">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((item) => {
                const isInflow = item.type === 'cash_inflow';
                const catInfo = getCategoryLabel(item.category);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{formatDate(item.date)}</div>
                      <div className="text-[10px] text-slate-400">{item.time || '10:00 AM'}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.staffUserName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">{item.paymentMode}</span>
                    </td>

                    <td className="p-3">
                      {isInflow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ऑफिस नकद अग्रिम (Cash Float)
                        </span>
                      ) : (
                        <div>
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${catInfo.color}`}>
                            {catInfo.label}
                          </span>
                          <p className="text-[11px] text-slate-600 mt-1 max-w-xs leading-snug">
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      {item.vehicleNumber ? (
                        <div>
                          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.vehicleNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">कार्यालय / सामान्य</span>
                      )}
                    </td>

                    <td className="p-3">
                      {item.payeeOrVendor ? (
                        <div>
                          <div className="font-semibold text-slate-800">{item.payeeOrVendor}</div>
                          {item.billSlipNumber && (
                            <span className="font-mono text-[10px] text-slate-500">
                              Slip: {item.billSlipNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <span className={`font-mono font-bold text-sm ${isInflow ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {isInflow ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(item.amount)}`}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-max ${
                          item.approvalStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.approvalStatus === 'approved' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            पास (Approved)
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            सत्यापन बाकी
                          </>
                        )}
                      </span>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {item.type === 'cash_expense' && (
                        <button
                          onClick={() => handleToggleApproval(item)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                            item.approvalStatus === 'approved'
                              ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500 shadow-2xs'
                          }`}
                        >
                          {item.approvalStatus === 'approved' ? 'Unapprove' : 'बिल पास करें ✓'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Give Cash to Boy / Float */}
      {isGiveCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <span>लड़के को नकद अग्रिम दें (Give Cash Float)</span>
              </h3>
              <button
                onClick={() => setIsGiveCashModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGiveCashSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  स्टाफ सदस्य / लड़का चुनें (Select Staff / Office Boy) *
                </label>
                <select
                  required
                  value={giveCashStaffId}
                  onChange={(e) => setGiveCashStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  दी जाने वाली नकद राशि (Amount in ₹) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  step={100}
                  placeholder="e.g. 5000"
                  value={giveCashAmount || ''}
                  onChange={(e) => setGiveCashAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    तारीख (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={giveCashDate}
                    onChange={(e) => setGiveCashDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    भुगतान माध्यम (Mode)
                  </label>
                  <select
                    value={giveCashMode}
                    onChange={(e) => setGiveCashMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Cash">Cash (नकद)</option>
                    <option value="UPI / PhonePe">UPI / PhonePe / GPay</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  विवरण / रिमार्क्स (Notes)
                </label>
                <input
                  type="text"
                  placeholder="e.g. गाड़ियों के फ्यूल व इमरजेंसी पंचर हेतु नकद"
                  value={giveCashNotes}
                  onChange={(e) => setGiveCashNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGiveCashModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-2xs"
                >
                  नकद दर्ज करें (Save Advance)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Record Daily Expense */}
      {isRecordExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>दैनिक खर्च दर्ज करें (Record Field Expense)</span>
              </h3>
              <button
                onClick={() => setIsRecordExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRecordExpenseSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    किसने खर्च किया (Spent By) *
                  </label>
                  <select
                    required
                    value={expenseStaffId}
                    onChange={(e) => setExpenseStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    {staffUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    खर्च श्रेणी (Category) *
                  </label>
                  <select
                    required
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as PettyCashExpenseCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="fuel_emergency">⛽ आपातकालीन ईंधन / पेट्रोल पंप</option>
                    <option value="servicing_puncture">🔧 सर्विसिंग / पंचर / आयल</option>
                    <option value="vehicle_accessories">✨ गाड़ी एक्सेसरीज (मैट्स, सीट कवर, बल्ब)</option>
                    <option value="fastag_toll_cash">💳 फास्टैग रिचार्ज / नकद टोल</option>
                    <option value="car_wash_cleaning">🚿 गाड़ी धुलाई व सफाई सामग्री</option>
                    <option value="driver_refreshments">☕ चालक चाय-नाश्ता (लेट नाइट ड्यूटी)</option>
                    <option value="rto_puc_cash">📄 PUC / प्रदूषण रसीद नकद</option>
                    <option value="office_errands">🏢 रसीद बुक / कार्यालय फुटकर खर्च</option>
                    <option value="other_misc">📦 अन्य फुटकर खर्च</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    खर्च राशि (Amount in ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 750"
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    संबद्ध गाड़ी (Vehicle - यदि किसी गाड़ी के लिए है)
                  </label>
                  <select
                    value={expenseVehicleId}
                    onChange={(e) => setExpenseVehicleId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">-- गाड़ी आवश्यक नहीं (General) --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.makeModel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    दुकान / वेंडर का नाम (Shop / Vendor)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gupta Tyres, Car Shringar Gomti Nagar"
                    value={expensePayee}
                    onChange={(e) => setExpensePayee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    बिल / पर्ची नंबर (Cash Slip / Bill No)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SLIP-401"
                    value={expenseSlipNo}
                    onChange={(e) => setExpenseSlipNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    तारीख (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    भुगतान माध्यम (Mode)
                  </label>
                  <select
                    value={expenseMode}
                    onChange={(e) => setExpenseMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Cash">Cash (पेटी कैश से नकद)</option>
                    <option value="UPI / PhonePe">UPI / PhonePe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  खर्च का विवरण (Remarks / Notes) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. नई 7D मैट्स लगवाईं व वाइपर ब्लेड बदले"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecordExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-2xs"
                >
                  खर्च दर्ज करें (Save Expense)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

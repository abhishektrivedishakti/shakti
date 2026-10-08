import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  ArrowRight,
  Filter,
  Search,
  Printer,
  Calendar,
  IndianRupee,
  CheckCircle2,
  FileSpreadsheet,
  Users,
  Car,
  Fuel,
  Wrench,
  ShieldAlert,
} from 'lucide-react';
import {
  DailyPaymentEntry,
  PaymentCategory,
  Driver,
  Vehicle,
  Vendor,
} from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';

interface DailyPaymentsJournalViewProps {
  dailyPayments: DailyPaymentEntry[];
  drivers: Driver[];
  vehicles: Vehicle[];
  vendors: Vendor[];
  onAddPayment: (payment: DailyPaymentEntry) => void;
  onAddBatchPayments?: (payments: DailyPaymentEntry[]) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

interface BatchPaymentRow {
  id: string;
  category: PaymentCategory;
  driverId?: string;
  vehicleId?: string;
  vendorId?: string;
  payeeName: string;
  amount: number;
  paymentMode: 'cash' | 'upi' | 'bank_transfer';
  referenceNumber: string;
  description: string;
}

export const DailyPaymentsJournalView: React.FC<DailyPaymentsJournalViewProps> = ({
  dailyPayments,
  drivers,
  vehicles,
  vendors,
  onAddPayment,
  onAddBatchPayments,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Batch Payment Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchDate, setBatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchRows, setBatchRows] = useState<BatchPaymentRow[]>([
    {
      id: 'row-1',
      category: 'driver_advance',
      driverId: drivers[0]?.id || '',
      vehicleId: vehicles[0]?.id || '',
      payeeName: drivers[0]?.name || 'Driver',
      amount: 1500,
      paymentMode: 'upi',
      referenceNumber: '',
      description: 'Daily cash advance for trip',
    },
    {
      id: 'row-2',
      category: 'fuel',
      driverId: drivers[1]?.id || '',
      vehicleId: vehicles[1]?.id || '',
      payeeName: 'Indian Oil Fuel Station',
      amount: 3200,
      paymentMode: 'upi',
      referenceNumber: '',
      description: 'Diesel tank fill for official tour',
    },
    {
      id: 'row-3',
      category: 'fastag_toll',
      driverId: drivers[2]?.id || '',
      vehicleId: vehicles[2]?.id || '',
      payeeName: 'NETC Fastag Wallet',
      amount: 1000,
      paymentMode: 'upi',
      referenceNumber: '',
      description: 'Expressway toll wallet recharge',
    },
  ]);

  // New Payment Form State
  const [formData, setFormData] = useState<Partial<DailyPaymentEntry>>({
    date: new Date().toISOString().slice(0, 10),
    category: 'driver_advance',
    amount: 2000,
    paymentMode: 'upi',
    payeeType: 'driver',
    driverId: drivers[0]?.id || '',
    payeeName: drivers[0]?.name || '',
    vehicleId: vehicles[0]?.id || '',
    vehicleNumber: vehicles[0]?.vehicleNumber || '',
    description: '',
    referenceNumber: '',
  });

  const handleCategoryChange = (category: PaymentCategory) => {
    let payeeType: any = 'other';
    let payeeName = '';
    let driverId = '';
    let vendorId = '';

    if (category === 'driver_advance' || category === 'driver_salary') {
      payeeType = 'driver';
      const drv = drivers[0];
      driverId = drv?.id || '';
      payeeName = drv?.name || '';
    } else if (category === 'vendor_rent') {
      payeeType = 'vendor';
      const vnd = vendors[0];
      vendorId = vnd?.id || '';
      payeeName = vnd?.name || '';
    } else if (category === 'fuel') {
      payeeType = 'fuel_pump';
      payeeName = 'Indian Oil / HPCL Fuel Station';
    } else if (category === 'maintenance') {
      payeeType = 'workshop';
      payeeName = 'Authorized Workshop';
    } else if (category === 'fastag_toll') {
      payeeType = 'toll';
      payeeName = 'NETC Fastag Wallet Topup';
    }

    setFormData({
      ...formData,
      category,
      payeeType,
      payeeName,
      driverId,
      vendorId,
    });
  };

  const handleVehicleSelect = (vId: string) => {
    const veh = vehicles.find((v) => v.id === vId);
    if (!veh) return;
    const drv = drivers.find((d) => d.id === veh.currentDriverId);

    setFormData({
      ...formData,
      vehicleId: vId,
      vehicleNumber: veh.vehicleNumber,
      driverId: drv ? drv.id : formData.driverId,
      payeeName:
        formData.category === 'driver_advance' && drv
          ? drv.name
          : formData.category === 'vendor_rent' && veh.vendorName
          ? veh.vendorName
          : formData.payeeName,
      vendorId: veh.vendorId || formData.vendorId,
    });
  };

  const getAutoRouteDestination = (cat: PaymentCategory): string => {
    switch (cat) {
      case 'driver_advance':
        return 'Driver Advance Khata';
      case 'driver_salary':
        return 'Driver Salary Settlement';
      case 'vendor_rent':
        return 'Vendor & Owner-Driver Ledger';
      case 'fuel':
        return 'Fuel Tracking & Vehicle Cost';
      case 'maintenance':
        return 'Vehicle Maintenance Records';
      case 'fastag_toll':
        return 'Fastag Wallet & Vehicle Ledger';
      case 'police_challan':
        return 'Vehicle Compliance & Challan Log';
      default:
        return 'General Fleet Expense Journal';
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const cat = formData.category || 'driver_advance';
    const autoRoute = getAutoRouteDestination(cat);

    const newPayment: DailyPaymentEntry = {
      id: `pay-${Date.now()}`,
      date: formData.date || new Date().toISOString().slice(0, 10),
      category: cat,
      amount: Number(formData.amount),
      paymentMode: formData.paymentMode || 'upi',
      referenceNumber: formData.referenceNumber || undefined,
      payeeName: formData.payeeName || 'Payee',
      payeeType: (formData.payeeType as any) || 'other',
      driverId: formData.driverId || undefined,
      vendorId: formData.vendorId || undefined,
      vehicleId: formData.vehicleId || undefined,
      vehicleNumber: formData.vehicleNumber || undefined,
      description: formData.description || `${cat.replace('_', ' ')} payment`,
      autoRoutedTo: autoRoute,
      recordedBy: 'Finance / Dispatch Desk',
    };

    onAddPayment(newPayment);
    setIsAddModalOpen(false);
    setFormData({
      ...formData,
      amount: 2000,
      description: '',
      referenceNumber: '',
    });
  };

  const handleAddBatchRow = () => {
    setBatchRows([
      ...batchRows,
      {
        id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        category: 'driver_advance',
        driverId: drivers[0]?.id || '',
        vehicleId: vehicles[0]?.id || '',
        payeeName: drivers[0]?.name || 'Driver',
        amount: 1000,
        paymentMode: 'upi',
        referenceNumber: '',
        description: 'Driver cash advance',
      },
    ]);
  };

  const handleRemoveBatchRow = (id: string) => {
    if (batchRows.length <= 1) return;
    setBatchRows(batchRows.filter((r) => r.id !== id));
  };

  const handleUpdateBatchRow = (id: string, updates: Partial<BatchPaymentRow>) => {
    setBatchRows(
      batchRows.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...updates };
          if (updates.category) {
            if (updates.category === 'driver_advance' || updates.category === 'driver_salary') {
              const drv = drivers.find((d) => d.id === (updated.driverId || drivers[0]?.id));
              updated.payeeName = drv?.name || 'Driver';
            } else if (updates.category === 'vendor_rent') {
              const vnd = vendors.find((v) => v.id === (updated.vendorId || vendors[0]?.id));
              updated.payeeName = vnd?.name || 'Vendor';
            } else if (updates.category === 'fuel') {
              updated.payeeName = 'Indian Oil / HPCL Station';
            } else if (updates.category === 'maintenance') {
              updated.payeeName = 'Authorized Workshop';
            } else if (updates.category === 'fastag_toll') {
              updated.payeeName = 'NETC Fastag Wallet';
            }
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleSaveBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = batchRows.filter((r) => r.amount > 0);
    if (validRows.length === 0) {
      alert('Please enter at least one payment with an amount greater than 0.');
      return;
    }

    const createdPayments: DailyPaymentEntry[] = validRows.map((row, idx) => {
      const veh = vehicles.find((v) => v.id === row.vehicleId);
      const drv = drivers.find((d) => d.id === row.driverId);
      const vnd = vendors.find((v) => v.id === row.vendorId);
      const autoRoute = getAutoRouteDestination(row.category);

      let payeeType: any = 'other';
      if (row.category === 'driver_advance' || row.category === 'driver_salary') payeeType = 'driver';
      else if (row.category === 'vendor_rent') payeeType = 'vendor';
      else if (row.category === 'fuel') payeeType = 'fuel_pump';
      else if (row.category === 'maintenance') payeeType = 'workshop';
      else if (row.category === 'fastag_toll') payeeType = 'toll';

      return {
        id: `pay-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        date: batchDate,
        category: row.category,
        amount: Number(row.amount),
        paymentMode: row.paymentMode,
        referenceNumber: row.referenceNumber || undefined,
        payeeName:
          row.payeeName ||
          (payeeType === 'driver' ? drv?.name : payeeType === 'vendor' ? vnd?.name : 'Payee') ||
          'Payee',
        payeeType,
        driverId: row.driverId || undefined,
        vendorId: row.vendorId || undefined,
        vehicleId: row.vehicleId || undefined,
        vehicleNumber: veh?.vehicleNumber || undefined,
        description: row.description || `${row.category.replace('_', ' ')} recorded in batch daybook`,
        autoRoutedTo: autoRoute,
        recordedBy: 'Daily Daybook Sheet',
      };
    });

    if (onAddBatchPayments) {
      onAddBatchPayments(createdPayments);
    } else {
      createdPayments.forEach((p) => onAddPayment(p));
    }

    setIsBatchModalOpen(false);
  };

  // Filter payments
  const filteredPayments = dailyPayments.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesDate = !dateFilter || p.date === dateFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      p.payeeName.toLowerCase().includes(q) ||
      (p.vehicleNumber && p.vehicleNumber.toLowerCase().includes(q)) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q);

    return matchesCat && matchesDate && matchesQuery;
  });

  const totalAmountFiltered = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Universal Daily Payments &amp; Expense Journal
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded font-semibold border border-emerald-200">
              Smart Auto-Routing Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Single entry point: Record any payment (Driver Advance, Vendor Rent, Fuel, Fastag, Workshop), and it automatically posts to that Driver&apos;s Khata, Vehicle&apos;s Cost, or Vendor&apos;s Payout Ledger!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Printer className="w-4 h-4" />
            Print Payment Sheet
          </button>

          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            + Multi-Payment Batch Sheet (एक साथ कई पेमेंट)
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            + Record Single Payment
          </button>
        </div>
      </div>

      {/* Auto-Routing Smart Explanation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-indigo-700 font-semibold">
            <Users className="w-4 h-4" />
            <span>Driver Advances</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Automatically deducts from the driver&apos;s monthly salary slip.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-purple-700 font-semibold">
            <Car className="w-4 h-4" />
            <span>Vendor Vehicle Rent</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Automatically posts to Vendor / Owner-Driver monthly settlement voucher.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-700 font-semibold">
            <Fuel className="w-4 h-4" />
            <span>Fuel &amp; Fastag</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Links to vehicle odometer and reconciles driver fixed fuel budget.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 text-amber-700 font-semibold">
            <Wrench className="w-4 h-4" />
            <span>Garage Repairs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Updates vehicle service history and monthly maintenance report.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="lg:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Search by Payee, Vehicle Number, Description or UTR:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Rajesh, UP32, Balaji, Indian Oil, UPI/6244..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Categories ({dailyPayments.length})</option>
              <option value="driver_advance">Driver Cash Advances</option>
              <option value="driver_salary">Driver Salary Payouts</option>
              <option value="vendor_rent">Vendor Vehicle Rent Payouts</option>
              <option value="fuel">Fuel Station Bills</option>
              <option value="maintenance">Workshop &amp; Repair Bills</option>
              <option value="fastag_toll">Fastag &amp; Toll Topups</option>
              <option value="police_challan">Traffic Challan / Fine</option>
              <option value="emergency_expense">Trip / Emergency Expense</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Specific Date:
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2.5">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong>{filteredPayments.length}</strong> payments
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Total Disbursed: <strong className="text-slate-900 font-bold">{formatCurrency(totalAmountFiltered)}</strong>
            </span>
          </div>

          {(searchQuery || selectedCategory !== 'all' || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setDateFilter('');
                setCurrentPage(1);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Clear Filters &times;
            </button>
          )}
        </div>
      </div>

      {/* Daily Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Date &amp; ID</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Payee &amp; Target Vehicle</th>
                <th className="py-3 px-3">Purpose &amp; Description</th>
                <th className="py-3 px-3">Mode &amp; Reference UTR</th>
                <th className="py-3 px-3">Auto-Routed Ledger</th>
                <th className="py-3 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment entries found matching your search. Click &ldquo;+ Record Daily Payment&rdquo; to add one.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formatDate(p.date)}</div>
                        <div className="text-[10px] font-mono text-slate-400">{p.id}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            p.category === 'driver_advance'
                              ? 'bg-rose-100 text-rose-800'
                              : p.category === 'vendor_rent'
                              ? 'bg-purple-100 text-purple-800'
                              : p.category === 'fuel'
                              ? 'bg-blue-100 text-blue-800'
                              : p.category === 'maintenance'
                              ? 'bg-amber-100 text-amber-800'
                              : p.category === 'driver_salary'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{p.payeeName}</div>
                        {p.vehicleNumber && (
                          <div className="text-[11px] font-mono text-indigo-700 font-semibold">
                            {p.vehicleNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-slate-800 text-[11px] line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold uppercase text-slate-700 text-[11px]">
                          {p.paymentMode}
                        </span>
                        {p.referenceNumber && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {p.referenceNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{p.autoRoutedTo}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-sm text-slate-900 font-mono">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} payments
            </span>

            <div className="flex items-center space-x-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2.5 py-1 border border-slate-300 rounded disabled:opacity-40"
              >
                &laquo; First
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-300 rounded disabled:opacity-40"
              >
                &lsaquo; Prev
              </button>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-300 rounded disabled:opacity-40"
              >
                Next &rsaquo;
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2.5 py-1 border border-slate-300 rounded disabled:opacity-40"
              >
                Last &raquo;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>Record Daily Payment &bull; भुगतान दर्ज करें</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-4 text-xs">
              {/* Payment Category Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Purpose / Category (भुगतान का प्रकार) *
                </label>
                <select
                  required
                  value={formData.category || 'driver_advance'}
                  onChange={(e) => handleCategoryChange(e.target.value as PaymentCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="driver_advance">Driver Cash Advance (ड्राइवर पेशगी - Auto Khata)</option>
                  <option value="driver_salary">Driver Salary Payout (सैलरी भुगतान)</option>
                  <option value="vendor_rent">Vendor / Owner-Driver Vehicle Rent (मार्केट अटैच गाड़ी किराया)</option>
                  <option value="fuel">Fuel Pump Payment / Top-up (डीजल/पेट्रोल/CNG)</option>
                  <option value="maintenance">Workshop / Garage Service &amp; Parts (सर्विस/रिपेयर)</option>
                  <option value="fastag_toll">Fastag &amp; Expressway Toll Recharge (फास्टैग)</option>
                  <option value="police_challan">Traffic Challan / Fine Settlement (चालान)</option>
                  <option value="emergency_expense">Trip / Emergency Expense (आकस्मिक खर्च)</option>
                </select>
              </div>

              {/* Target Vehicle & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Related Vehicle (संबंधित गाड़ी)
                  </label>
                  <select
                    value={formData.vehicleId || ''}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">-- Select or Leave General --</option>
                    {vehicles.slice(0, 100).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.makeModel}) - {v.ownershipType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Payee Name & Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payee Name (किसे भुगतान किया) *
                </label>
                {formData.category === 'driver_advance' || formData.category === 'driver_salary' ? (
                  <select
                    required
                    value={formData.driverId || ''}
                    onChange={(e) => {
                      const drv = drivers.find((d) => d.id === e.target.value);
                      setFormData({
                        ...formData,
                        driverId: e.target.value,
                        payeeName: drv?.name || '',
                        vehicleId: drv?.currentVehicleId || formData.vehicleId,
                        vehicleNumber: vehicles.find((v) => v.id === drv?.currentVehicleId)?.vehicleNumber || formData.vehicleNumber,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.slice(0, 150).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                ) : formData.category === 'vendor_rent' ? (
                  <>
                    <select
                      required
                      value={formData.vendorId || ''}
                      onChange={(e) => {
                        const vnd = vendors.find((v) => v.id === e.target.value);
                        setFormData({
                          ...formData,
                          vendorId: e.target.value,
                          payeeName: vnd?.name || '',
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="">-- Choose Vendor / Owner-Driver --</option>
                      {vendors.map((vnd) => (
                        <option key={vnd.id} value={vnd.id}>
                          {vnd.name} ({vnd.phone}) &bull; TDS: {vnd.isTdsApplicable === false || vnd.tdsRate === 0 ? '0% (छूट)' : `${vnd.tdsRate}%`}
                        </option>
                      ))}
                    </select>
                    {formData.vendorId && (() => {
                      const selectedV = vendors.find((v) => v.id === formData.vendorId);
                      if (!selectedV) return null;
                      return (
                        <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                          <span>
                            TDS नियम:{' '}
                            <strong className="text-indigo-700">
                              {selectedV.isTdsApplicable === false || selectedV.tdsRate === 0
                                ? '0% छूट (Nil TDS)'
                                : `${selectedV.tdsRate}% u/s ${selectedV.tdsSection || '194C'}`}
                            </strong>
                          </span>
                          <span>PAN: <strong className="font-mono text-slate-800">{selectedV.panNumber || 'N/A'}</strong></span>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indian Oil Dealer, Maruti Workshop, Fastag Wallet"
                    value={formData.payeeName || ''}
                    onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                )}
              </div>

              {/* Amount and Payment Mode */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formData.paymentMode || 'upi'}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash (नकद)</option>
                    <option value="bank_transfer">Bank Transfer (NEFT / RTGS)</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference UTR / Cheque / Slip Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/624419082210 or NEFT/SBI/99120"
                  value={formData.referenceNumber || ''}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Purpose / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emergency family cash advance / Oil filter replacement / Fastag balance"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Dynamic Auto-Routing Banner */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold block">Smart Auto-Routing Enabled:</span>
                  <span className="text-[11px] text-emerald-700">
                    This payment will be automatically synchronized with{' '}
                    <strong>{getAutoRouteDestination(formData.category || 'driver_advance')}</strong>.
                  </span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Post Payment &amp; Auto-Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Payment Daybook Sheet Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-linear-to-r from-purple-900 to-indigo-900 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-purple-300" />
                  <h3 className="text-base font-bold">
                    Daily Multi-Payment Daybook Sheet (दैनिक रोकड़ व बहु-भुगतान प्रविष्टि)
                  </h3>
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  Enter today&apos;s disbursements in one unified sheet. Each entry automatically updates that driver&apos;s Khata, vehicle maintenance/fuel records, or vendor payout account!
                </p>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBatchSubmit} className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-purple-50/70 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-purple-950">
                    Daybook Posting Date:
                  </label>
                  <input
                    type="date"
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    required
                    className="px-3 py-1.5 border border-purple-300 rounded-lg text-xs bg-white font-medium"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-purple-700">Total Rows: </span>
                    <strong className="text-purple-950 font-bold">{batchRows.length}</strong>
                  </div>
                  <div className="h-4 w-px bg-purple-200" />
                  <div>
                    <span className="text-purple-700">Total Outflow: </span>
                    <strong className="text-emerald-700 font-bold text-sm">
                      {formatCurrency(batchRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0))}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Multi-Row Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[420px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[150px]">Payment Category</th>
                      <th className="py-2.5 px-3 min-w-[170px]">Vehicle / Driver</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Payee / Beneficiary</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Amount (₹)</th>
                      <th className="py-2.5 px-3 min-w-[100px]">Mode</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Ref / UTR / Slip</th>
                      <th className="py-2.5 px-3 min-w-[150px]">Description / Note</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.category}
                            onChange={(e) =>
                              handleUpdateBatchRow(row.id, { category: e.target.value as any })
                            }
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                          >
                            <option value="driver_advance">Driver Advance</option>
                            <option value="driver_salary">Driver Salary</option>
                            <option value="vendor_rent">Vendor Vehicle Rent</option>
                            <option value="fuel">Fuel (Diesel/CNG)</option>
                            <option value="maintenance">Workshop / Repairs</option>
                            <option value="fastag_toll">Fastag Recharge</option>
                            <option value="police_challan">Traffic Fine / Challan</option>
                            <option value="emergency_expense">Other Trip Expense</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          {row.category === 'driver_advance' || row.category === 'driver_salary' ? (
                            <select
                              value={row.driverId || ''}
                              onChange={(e) => {
                                const drv = drivers.find((d) => d.id === e.target.value);
                                handleUpdateBatchRow(row.id, {
                                  driverId: e.target.value,
                                  payeeName: drv?.name || 'Driver',
                                });
                              }}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                            >
                              {drivers.slice(0, 50).map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name} ({d.phone.slice(-5)})
                                </option>
                              ))}
                            </select>
                          ) : row.category === 'vendor_rent' ? (
                            <select
                              value={row.vendorId || ''}
                              onChange={(e) => {
                                const vnd = vendors.find((v) => v.id === e.target.value);
                                handleUpdateBatchRow(row.id, {
                                  vendorId: e.target.value,
                                  payeeName: vnd?.name || 'Vendor',
                                });
                              }}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                            >
                              {vendors.map((vnd) => (
                                <option key={vnd.id} value={vnd.id}>
                                  {vnd.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={row.vehicleId || ''}
                              onChange={(e) => {
                                const veh = vehicles.find((v) => v.id === e.target.value);
                                handleUpdateBatchRow(row.id, {
                                  vehicleId: e.target.value,
                                  driverId: veh?.currentDriverId,
                                });
                              }}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white font-mono"
                            >
                              {vehicles.slice(0, 50).map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.vehicleNumber} ({v.makeModel.split(' ')[0]})
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.payeeName}
                            onChange={(e) =>
                              handleUpdateBatchRow(row.id, { payeeName: e.target.value })
                            }
                            placeholder="Payee name"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={row.amount || ''}
                            onChange={(e) =>
                              handleUpdateBatchRow(row.id, { amount: Number(e.target.value) })
                            }
                            placeholder="Amount ₹"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-bold font-mono text-right"
                            required
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.paymentMode}
                            onChange={(e) =>
                              handleUpdateBatchRow(row.id, { paymentMode: e.target.value as any })
                            }
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                          >
                            <option value="upi">UPI (GPay/PhonePe)</option>
                            <option value="cash">Cash (नकद)</option>
                            <option value="bank_transfer">Bank NEFT/RTGS</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.referenceNumber}
                            onChange={(e) =>
                              handleUpdateBatchRow(row.id, { referenceNumber: e.target.value })
                            }
                            placeholder="UTR / Slip No."
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) =>
                              handleUpdateBatchRow(row.id, { description: e.target.value })
                            }
                            placeholder="Duty / Purpose remarks"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchRow(row.id)}
                            disabled={batchRows.length <= 1}
                            className="text-slate-400 hover:text-rose-600 font-bold p-1 disabled:opacity-30"
                            title="Remove row"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleAddBatchRow}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Another Payment Row
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Post All {batchRows.length} Payments &amp; Auto-Update Accounts
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

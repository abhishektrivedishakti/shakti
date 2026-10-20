import React, { useState } from 'react';
import { BookingRecord, DispatcherProfile } from '../../types';
import {
  IndianRupee,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Shield,
  Building2,
  Users,
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/dispatchFormatters';

interface FinanceAnalyticsProps {
  bookings: BookingRecord[];
  dispatcher: DispatcherProfile;
}

export const FinanceAnalytics: React.FC<FinanceAnalyticsProps> = ({ bookings, dispatcher }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'this_month' | 'last_month'>('all');

  // Filter bookings based on period
  const filteredBookings = bookings.filter((b) => {
    if (selectedPeriod === 'all') return true;
    const bookingDate = new Date(b.reportingDate);
    const now = new Date();
    if (selectedPeriod === 'this_month') {
      return (
        bookingDate.getMonth() === now.getMonth() &&
        bookingDate.getFullYear() === now.getFullYear()
      );
    }
    if (selectedPeriod === 'last_month') {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return (
        bookingDate.getMonth() === lastMonth &&
        bookingDate.getFullYear() === lastMonthYear
      );
    }
    return true;
  });

  // Financial sums
  const totalGrossAmount = filteredBookings.reduce((sum, b) => sum + (b.tariff.grossClientAmount || 0), 0);
  const totalGstAmount = filteredBookings.reduce((sum, b) => sum + (b.tariff.gstAmount || 0), 0);
  const totalNetBillable = filteredBookings.reduce((sum, b) => sum + (b.tariff.netClientBillable || 0), 0);

  const totalDriverWages = filteredBookings.reduce((sum, b) => sum + (b.tariff.driverBaseWage || 0), 0);
  const totalDriverExtraHours = filteredBookings.reduce((sum, b) => sum + (b.tariff.driverExtraHoursPay || 0), 0);
  const totalDriverNightDa = filteredBookings.reduce((sum, b) => sum + (b.tariff.driverNightDa || 0), 0);
  const totalDriverGrossPay = totalDriverWages + totalDriverExtraHours + totalDriverNightDa;

  const totalAdvanceDeductions = filteredBookings.reduce((sum, b) => sum + (b.tariff.driverAdvanceDeduction || 0), 0);
  const totalNetDriverPayable = filteredBookings.reduce((sum, b) => sum + (b.tariff.netDriverPayable || 0), 0);
  const totalTollParking = filteredBookings.reduce((sum, b) => sum + (b.tariff.tollParkingAmount || 0), 0);

  // Client Payment Statuses
  const totalPaidByClient = filteredBookings
    .filter((b) => b.clientPaymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.tariff.netClientBillable || 0), 0);

  const totalOutstandingClient = totalNetBillable - totalPaidByClient;

  // Driver Settlement Statuses
  const totalDriverSettled = filteredBookings
    .filter((b) => b.driverPaymentStatus === 'settled')
    .reduce((sum, b) => sum + (b.tariff.netDriverPayable || 0), 0);

  const totalDriverPending = totalNetDriverPayable - totalDriverSettled;

  // Operating Margin
  const totalCompanyOperatingMargin = totalNetBillable - totalDriverGrossPay - totalTollParking;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="panel panel-pad flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white shadow-lg">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-ink)]">
                फ्लीट वित्तीय व जीएसटी ऑडिट (Finance & Tax Audit)
              </h1>
              <p className="text-xs text-[var(--color-muted)]">
                GSTIN: {dispatcher.gstin} | PAN: {dispatcher.pan} | बैंक: {dispatcher.bankName || 'SBI'}
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="segmented">
          <button
            type="button"
            onClick={() => setSelectedPeriod('all')}
            className={`segmented-btn ${selectedPeriod === 'all' ? 'is-active' : ''}`}
          >
            समस्त रिकॉर्ड (All Time)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('this_month')}
            className={`segmented-btn ${selectedPeriod === 'this_month' ? 'is-active' : ''}`}
          >
            इस माह (This Month)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('last_month')}
            className={`segmented-btn ${selectedPeriod === 'last_month' ? 'is-active' : ''}`}
          >
            गत माह (Last Month)
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Billed & Outstanding */}
        <div className="panel panel-pad">
          <div className="flex items-center justify-between text-xs text-teal-700 font-semibold uppercase">
            <span>क्लाइंट बिलिंग व वसूली</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-[var(--color-ink)]">{formatCurrencyINR(totalNetBillable)}</div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>प्राप्त राशि (Received):</span>
              <span className="text-teal-700 font-bold">{formatCurrencyINR(totalPaidByClient)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>बकाया क्लेम (Outstanding):</span>
              <span className="text-amber-700 font-bold">{formatCurrencyINR(totalOutstandingClient)}</span>
            </div>
          </div>
        </div>

        {/* Driver Payroll & Settlement */}
        <div className="panel panel-pad">
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold uppercase">
            <span>चालक मजदूरी व एडवांस</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{formatCurrencyINR(totalNetDriverPayable)}</div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>चुकता वेतन (Settled):</span>
              <span className="text-teal-700 font-bold">{formatCurrencyINR(totalDriverSettled)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>लंबित भुगतान (Pending):</span>
              <span className="text-rose-600 font-bold">{formatCurrencyINR(totalDriverPending)}</span>
            </div>
          </div>
        </div>

        {/* Operating Margin & Profitability */}
        <div className="panel panel-pad">
          <div className="flex items-center justify-between text-xs text-teal-700 font-semibold uppercase">
            <span>शुद्ध परिचालन लाभ (Net Operating Margin)</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-teal-700">{formatCurrencyINR(totalCompanyOperatingMargin)}</div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>जीएसटी देयता (GST 5%):</span>
              <span className="text-[var(--color-info)] font-bold">{formatCurrencyINR(totalGstAmount)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>टोल/पार्किंग रीइंबर्समेंट:</span>
              <span className="text-[var(--color-muted)] font-medium">{formatCurrencyINR(totalTollParking)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Ledger Audit Table */}
      <div className="panel overflow-hidden">
        <div className="p-4 border-b border-[var(--color-line)] flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-700" />
            ड्यूटी-वाइज बिलिंग व प्रॉफिट शीट (Duty Audit Breakdown)
          </h2>
          <span className="text-xs text-[var(--color-muted)]">{filteredBookings.length} ड्यूटी ऑडिट रिकॉर्ड</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--color-muted)]">
            <thead className="bg-[var(--color-surface-muted)] text-[var(--color-muted)] font-semibold border-b border-[var(--color-line)]">
              <tr>
                <th className="px-3.5 py-3">बुकिंग सं.</th>
                <th className="px-3.5 py-3">क्लाइंट व तारीख</th>
                <th className="px-3.5 py-3">पैकेज दर</th>
                <th className="px-3.5 py-3">एक्स्ट्रा KM/घंटे</th>
                <th className="px-3.5 py-3">टोल/पार्किंग</th>
                <th className="px-3.5 py-3">सकल बिल</th>
                <th className="px-3.5 py-3">GST 5%</th>
                <th className="px-3.5 py-3">नेट बिलिंग</th>
                <th className="px-3.5 py-3">ड्राइवर शुद्ध देय</th>
                <th className="px-3.5 py-3 text-right">कंपनी मार्जिन</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)] font-mono">
              {filteredBookings.map((b) => {
                const extraCosts = (b.tariff.extraKmCost || 0) + (b.tariff.extraHourCost || 0);
                const margin = (b.tariff.netClientBillable || 0) - (b.tariff.netDriverPayable || 0) - (b.tariff.tollParkingAmount || 0);
                return (
                  <tr key={b.id} className="hover:bg-[var(--color-sand)] transition">
                    <td className="px-3.5 py-3 font-bold text-teal-700">{b.bookingNumber}</td>
                    <td className="px-3.5 py-3 font-sans">
                      <div className="text-[var(--color-ink)] font-medium truncate max-w-[150px]">{b.client.name}</div>
                      <div className="text-[11px] text-[var(--color-muted)] font-mono">{b.reportingDate}</div>
                    </td>
                    <td className="px-3.5 py-3 text-[var(--color-muted)] font-sans">{b.tariff.packageName}</td>
                    <td className="px-3.5 py-3 text-amber-700">+{formatCurrencyINR(extraCosts)}</td>
                    <td className="px-3.5 py-3 text-[var(--color-muted)]">{formatCurrencyINR(b.tariff.tollParkingAmount || 0)}</td>
                    <td className="px-3.5 py-3 text-[var(--color-ink)]">{formatCurrencyINR(b.tariff.grossClientAmount)}</td>
                    <td className="px-3.5 py-3 text-teal-700">{formatCurrencyINR(b.tariff.gstAmount)}</td>
                    <td className="px-3.5 py-3 font-bold text-[var(--color-info)]">{formatCurrencyINR(b.tariff.netClientBillable)}</td>
                    <td className="px-3.5 py-3 font-bold text-amber-700">{formatCurrencyINR(b.tariff.netDriverPayable)}</td>
                    <td className="px-3.5 py-3 text-right font-bold text-teal-700">{formatCurrencyINR(margin)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

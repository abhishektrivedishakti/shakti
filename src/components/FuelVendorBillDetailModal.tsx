import React, { useState } from 'react';
import {
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  Car,
  Fuel,
  IndianRupee,
  Calendar,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { FuelVendorMonthlyBill, FuelVendorBillVehicleSummary } from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';

interface FuelVendorBillDetailModalProps {
  bill: FuelVendorMonthlyBill | null;
  onClose: () => void;
  onPayBill: (billId: string, paymentData: { mode: 'bank_transfer' | 'cheque' | 'upi' | 'cash'; ref: string; date: string; amount: number }) => void;
}

export const FuelVendorBillDetailModal: React.FC<FuelVendorBillDetailModalProps> = ({
  bill,
  onClose,
  onPayBill,
}) => {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payMode, setPayMode] = useState<'bank_transfer' | 'cheque' | 'upi' | 'cash'>('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    onPayBill(bill.id, {
      mode: payMode,
      ref: payRef || `PAY-${Date.now().toString().slice(-6)}`,
      date: payDate,
      amount: bill.netPayable,
    });
    setIsPayModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  पेट्रोल पंप मासिक वेंडर बिल व गाड़ी-वार विवरण
                </h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                    bill.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : bill.paymentStatus === 'partially_paid'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {bill.paymentStatus === 'paid' ? 'Paid / चुकता' : 'Payment Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {bill.pumpVendorName} &bull; बिल संख्या: <span className="font-mono font-bold text-slate-700">{bill.billNumber}</span> &bull; माह: {bill.monthYear}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              प्रिंट विवरण
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2">
              &times;
            </button>
          </div>
        </div>

        {/* Printable Formal Statement Container */}
        <div className="space-y-4">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Fuel Pump Station</span>
              <span className="font-bold text-slate-900 text-sm">{bill.pumpVendorName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Billing Period</span>
              <span className="font-bold text-indigo-700 text-sm">{bill.monthYear}</span>
              <div className="text-[10px] text-slate-500">Bill Date: {formatDate(bill.billDate)}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Fuel Dispensed</span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                {bill.totalLiters.toFixed(2)} Liters
              </span>
              <div className="text-[10px] text-slate-500">{bill.reconciledSlipsCount} Slips Reconciled</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Net Payable Amount</span>
              <span className="font-black text-emerald-700 text-base font-mono">
                {formatCurrency(bill.netPayable)}
              </span>
              {bill.tdsAmount && bill.tdsAmount > 0 ? (
                <div className="text-[10px] text-rose-600 font-semibold font-mono">
                  TDS: -{formatCurrency(bill.tdsAmount)} ({bill.tdsRate}% u/s {bill.tdsSection || '194Q'})
                </div>
              ) : (
                <div className="text-[10px] text-slate-400">TDS: ₹0 (Nil)</div>
              )}
              {bill.paymentStatus === 'paid' && bill.paidDate && (
                <div className="text-[10px] text-emerald-600 font-semibold">
                  Paid on {formatDate(bill.paidDate)}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle-wise breakdown title */}
          <div className="flex items-center justify-between pt-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4 text-indigo-600" />
              <span>गाड़ी-वार ईंधन खपत व बिलिंग विवरण (Vehicle-Wise Fuel Consumption &amp; Billing)</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              Total <strong>{bill.vehicleBreakdown.length}</strong> Vehicles Billed
            </span>
          </div>

          {/* Vehicle-wise Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Vehicle Number &amp; Model</th>
                  <th className="py-2.5 px-3">Driver Name</th>
                  <th className="py-2.5 px-3 text-center">Refills Count</th>
                  <th className="py-2.5 px-3 text-right">Total Liters</th>
                  <th className="py-2.5 px-3 text-right">Avg Rate (₹/L)</th>
                  <th className="py-2.5 px-3 text-right">Total Cost (₹)</th>
                  <th className="py-2.5 px-3 text-right">% of Bill</th>
                  <th className="py-2.5 px-3">Parchi / Slip Nos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {bill.vehicleBreakdown.map((vb) => {
                  const percentOfTotal = bill.totalAmount > 0 ? ((vb.totalAmount / bill.totalAmount) * 100).toFixed(1) : '0';
                  return (
                    <tr key={vb.vehicleId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3">
                        <div className="font-bold font-mono text-slate-900 bg-yellow-300/80 text-[11px] px-1.5 py-0.5 rounded border border-yellow-400 inline-block">
                          {vb.vehicleNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{vb.makeModel || 'Fleet Vehicle'}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {vb.driverName || 'Unassigned'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {vb.refillCount} बार
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-900">
                        {vb.totalLiters.toFixed(1)} L
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        ₹{vb.avgRate.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(vb.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-500">
                        {percentOfTotal}%
                      </td>
                      <td className="py-2.5 px-3 text-[10px] font-mono text-indigo-600 max-w-xs truncate" title={vb.slipNumbers.join(', ')}>
                        {vb.slipNumbers.join(', ') || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-slate-700 uppercase font-black">
                    Fleet Total (कुल योग)
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {bill.vehicleBreakdown.reduce((sum, v) => sum + v.refillCount, 0)} Refills
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-indigo-900">
                    {bill.totalLiters.toFixed(1)} L
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    ₹{(bill.totalAmount / (bill.totalLiters || 1)).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-sm">
                    {formatCurrency(bill.netPayable)}
                  </td>
                  <td className="py-2.5 px-3 text-right">100%</td>
                  <td className="py-2.5 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment & Verification footer */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800">
                बिल सत्यापन व टिप्पणी: {bill.notes || 'मासिक पेट्रोल पंप पर्ची मिलान पूर्ण व स्वीकृत।'}
              </div>
              {bill.paymentStatus === 'paid' && (
                <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  भुगतान विवरण: {bill.paymentMode?.toUpperCase()} | Ref: {bill.paymentReference || 'N/A'} | Date: {bill.paidDate}
                </div>
              )}
            </div>

            {bill.paymentStatus !== 'paid' && (
              <button
                onClick={() => setIsPayModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors shrink-0 print:hidden"
              >
                <CreditCard className="w-4 h-4" />
                पंप वेंडर को भुगतान दर्ज करें (Pay Bill)
              </button>
            )}
          </div>
        </div>

        {/* Payment Confirmation Sub-Modal */}
        {isPayModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>पंप बिल भुगतान प्रविष्टि (Record Payment)</span>
                </h4>
                <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 text-lg">&times;</button>
              </div>

              <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel Pump Vendor</label>
                  <input
                    type="text"
                    disabled
                    value={bill.pumpVendorName}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total Net Payable (₹)</label>
                    <input
                      type="text"
                      disabled
                      value={formatCurrency(bill.netPayable)}
                      className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 font-black font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Mode *</label>
                    <select
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="bank_transfer">Bank NEFT/RTGS</option>
                      <option value="cheque">Cheque (चेक)</option>
                      <option value="upi">UPI / QR Code</option>
                      <option value="cash">Cash (कार्यालय नकद)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">UTR / Cheque / Ref No.</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UTR/SBI/2026/8912"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  नोट: यह भुगतान आपके दैनिक भुगतान व रोकड़ बही (Daily Payments Journal) में भी स्वतः दर्ज हो जाएगा।
                </p>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs"
                  >
                    भुगतान सुरक्षित करें
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BookingRecord, DispatcherProfile } from '../../types';
import { formatCurrencyINR } from '../../utils/dispatchFormatters';
import { FileText, Printer, CheckCircle2, X, Download, ShieldCheck } from 'lucide-react';

interface ClientSettlementModalProps {
  booking: BookingRecord;
  dispatcher: DispatcherProfile;
  onClose: () => void;
  onUpdateStatus: (bookingId: string, status: 'unbilled' | 'invoiced' | 'paid' | 'overdue', invoiceNo?: string) => void;
}

export const ClientSettlementModal: React.FC<ClientSettlementModalProps> = ({
  booking,
  dispatcher,
  onClose,
  onUpdateStatus,
}) => {
  const [invoiceNo, setInvoiceNo] = useState(
    booking.clientInvoiceNumber || `INV-${new Date().getFullYear()}-${booking.bookingNumber.replace(/\D/g, '').padStart(3, '0')}`
  );
  const [paymentStatus, setPaymentStatus] = useState(booking.clientPaymentStatus);

  const t = booking.tariff;
  const taxableAmount = t.grossClientAmount;
  const cgstAmount = Math.round((taxableAmount * (t.gstRatePercent / 200)) * 10) / 10;
  const sgstAmount = cgstAmount;
  const totalInvoice = taxableAmount + cgstAmount + sgstAmount;

  const handleSaveStatus = () => {
    onUpdateStatus(booking.id, paymentStatus, invoiceNo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">क्लाइंट टैक्स इनवॉइस व सेटलमेंट (Tax Invoice &amp; Audit)</h3>
              <p className="text-xs text-slate-400">GST इनवॉइस जनरेट करें व भुगतान स्थिति ट्रैक करें</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> प्रिंट इनवॉइस
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Sheet */}
        <div className="mt-4 p-6 bg-white text-slate-900 rounded-xl border border-slate-300 font-sans text-xs space-y-4 print:border-none print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                {dispatcher.companyName}
              </h2>
              <p className="text-[11px] text-slate-600">{dispatcher.tagline}</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-sm">{dispatcher.address}</p>
              <p className="text-[10px] text-slate-700 font-semibold mt-0.5">
                GSTIN: <span className="font-mono">{dispatcher.gstin}</span> | PAN: <span className="font-mono">{dispatcher.pan}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase rounded">
                टैक्स इनवॉइस (Tax Invoice)
              </span>
              <p className="mt-2 text-[11px]">
                <span className="text-slate-500">Invoice No:</span>{' '}
                <strong className="font-mono text-sm">{invoiceNo}</strong>
              </p>
              <p className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
              <p className="text-[10px] text-slate-500">Booking Ref: <strong className="font-mono">{booking.bookingNumber}</strong></p>
            </div>
          </div>

          {/* Billed To / Client Box */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded border border-slate-200 text-[11px]">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To (ग्राहक):</span>
              <strong className="text-slate-900 text-xs block mt-0.5">{booking.client.name}</strong>
              <p className="text-slate-600 mt-0.5">{booking.client.billingAddress}</p>
              {booking.client.gstin && (
                <p className="text-slate-700 font-mono mt-0.5">Client GSTIN: {booking.client.gstin}</p>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duty Details:</span>
              <p className="mt-0.5">सवारी: <strong>{booking.passenger.name}</strong> ({booking.passenger.designation || 'Officer'})</p>
              <p>गाड़ी: <strong className="font-mono">{booking.vehicleNumber}</strong> ({booking.vehicleModel})</p>
              <p>रूट: {booking.pickupLocation} ➔ {booking.dropLocation}</p>
              <p>दिनांक: {booking.reportingDate} ({booking.tariff.packageName})</p>
            </div>
          </div>

          {/* Line Item Table */}
          <table className="w-full border-collapse border border-slate-300 text-left text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">विवरण (Description of Services)</th>
                <th className="p-2 border-r border-slate-300 text-center w-24">HSN / SAC</th>
                <th className="p-2 border-r border-slate-300 text-right w-24">दर (Rate)</th>
                <th className="p-2 text-right w-28">राशि (Amount ₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 border-r border-slate-200">
                  वाहन किराया: {booking.tariff.packageName} (Quota: {booking.tariff.baseHours} Hr / {booking.tariff.baseKm} KM)
                </td>
                <td className="p-2 border-r border-slate-200 text-center font-mono">996601</td>
                <td className="p-2 border-r border-slate-200 text-right font-mono">₹{booking.tariff.baseRate}</td>
                <td className="p-2 text-right font-mono font-bold">₹{booking.tariff.baseRate}</td>
              </tr>
              {booking.tariff.extraKmRun > 0 && (
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-200">
                    अतिरिक्त दूरी (Extra KM): {booking.tariff.extraKmRun} KM @ ₹{booking.tariff.extraKmRate}/KM
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono">996601</td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono">₹{booking.tariff.extraKmRate}</td>
                  <td className="p-2 text-right font-mono font-bold">₹{booking.tariff.extraKmCost}</td>
                </tr>
              )}
              {booking.tariff.extraHoursRun > 0 && (
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-200">
                    अतिरिक्त समय (Extra Hours): {booking.tariff.extraHoursRun} Hrs @ ₹{booking.tariff.extraHourRate}/Hr
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono">996601</td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono">₹{booking.tariff.extraHourRate}</td>
                  <td className="p-2 text-right font-mono font-bold">₹{booking.tariff.extraHourCost}</td>
                </tr>
              )}
              {booking.tariff.tollParkingAmount > 0 && (
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-200">टोल टैक्स व अधिकृत पार्किंग रसीद (Actual Reimbursement)</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono">996601</td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono">Actuals</td>
                  <td className="p-2 text-right font-mono font-bold">₹{booking.tariff.tollParkingAmount}</td>
                </tr>
              )}
              {booking.tariff.nightHaltAmount > 0 && (
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-200">नाइट हाल्ट / ड्राइवर आउटस्टेशन भत्ता (Night Halt Allowance)</td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono">996601</td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono">₹{booking.tariff.nightHaltRate}</td>
                  <td className="p-2 text-right font-mono font-bold">₹{booking.tariff.nightHaltAmount}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-b border-slate-300 bg-slate-50 font-semibold">
                <td colSpan={3} className="p-2 text-right border-r border-slate-300">कर योग्य मूल्य (Taxable Value):</td>
                <td className="p-2 text-right font-mono font-bold">{formatCurrencyINR(taxableAmount)}</td>
              </tr>
              <tr className="border-b border-slate-300 text-slate-600">
                <td colSpan={3} className="p-1.5 text-right border-r border-slate-300 text-[11px]">
                  CGST ({booking.tariff.gstRatePercent / 2}%):
                </td>
                <td className="p-1.5 text-right font-mono">{formatCurrencyINR(cgstAmount)}</td>
              </tr>
              <tr className="border-b border-slate-300 text-slate-600">
                <td colSpan={3} className="p-1.5 text-right border-r border-slate-300 text-[11px]">
                  SGST ({booking.tariff.gstRatePercent / 2}%):
                </td>
                <td className="p-1.5 text-right font-mono">{formatCurrencyINR(sgstAmount)}</td>
              </tr>
              <tr className="bg-slate-900 text-white font-black text-sm">
                <td colSpan={3} className="p-2.5 text-right">कुल देय राशि (Net Invoice Amount):</td>
                <td className="p-2.5 text-right font-mono text-emerald-300">{formatCurrencyINR(totalInvoice)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Bank Payment Details */}
          <div className="flex justify-between items-end pt-3 border-t border-slate-300 text-[11px]">
            <div>
              <p className="font-bold text-slate-800">भुगतान विवरण (Bank Payment Details):</p>
              <p className="text-slate-600 font-mono mt-0.5">
                Bank: {dispatcher.bankName} | A/C: {dispatcher.bankAccountNo} | IFSC: {dispatcher.ifscCode}
              </p>
              <p className="text-slate-600 font-mono">UPI ID: {dispatcher.upiId}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500">For {dispatcher.companyName}</p>
              <div className="h-10"></div>
              <p className="font-bold border-t border-slate-300 pt-1">अधिकृत हस्ताक्षरकर्ता (Authorized Signatory)</p>
            </div>
          </div>
        </div>

        {/* Status Control Footer */}
        <div className="mt-5 p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">इनवॉइस नंबर (Invoice No)</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono font-bold text-white w-44"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">भुगतान स्थिति (Status)</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-semibold text-white"
              >
                <option value="unbilled">Unbilled (इनवॉइस नहीं बनी)</option>
                <option value="invoiced">Invoiced (बिल भेजा गया)</option>
                <option value="paid">Paid (भुगतान प्राप्त हो गया ✓)</option>
                <option value="overdue">Overdue (भुगतान लंबित)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveStatus}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>✓ स्थिति अपडेट करें</span>
          </button>
        </div>
      </div>
    </div>
  );
};

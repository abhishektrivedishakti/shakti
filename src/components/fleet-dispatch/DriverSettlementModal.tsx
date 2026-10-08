import React, { useState } from 'react';
import { BookingRecord, DispatcherProfile } from '../../types';
import { formatCurrencyINR } from '../../utils/dispatchFormatters';
import { Users, Printer, CheckCircle2, X, Wallet, ArrowDownRight } from 'lucide-react';

interface DriverSettlementModalProps {
  booking: BookingRecord;
  dispatcher: DispatcherProfile;
  onClose: () => void;
  onUpdateDriverPayment: (bookingId: string, status: 'pending' | 'partially_paid' | 'settled', paidAmount: number) => void;
}

export const DriverSettlementModal: React.FC<DriverSettlementModalProps> = ({
  booking,
  dispatcher,
  onClose,
  onUpdateDriverPayment,
}) => {
  const t = booking.tariff;
  const [driverPaid, setDriverPaid] = useState<number>(booking.driverPaidAmount || t.netDriverPayable);
  const [driverStatus, setDriverStatus] = useState(booking.driverPaymentStatus);

  const handleSave = () => {
    onUpdateDriverPayment(booking.id, driverStatus, driverPaid);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">चालक ड्यूटी भुगतान पर्ची (Driver Settlement Voucher)</h3>
              <p className="text-xs text-slate-400">
                चालक: <strong className="text-white">{booking.driverName}</strong> &bull; {booking.vehicleNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> प्रिंट पर्ची
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Driver Voucher Sheet */}
        <div className="mt-4 p-5 bg-white text-slate-900 rounded-xl border border-slate-300 font-sans text-xs space-y-4 print:border-none print:p-0">
          <div className="text-center border-b border-slate-300 pb-2">
            <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">{dispatcher.companyName}</h3>
            <p className="text-[10px] text-slate-500">वाहन चालक दैनिक ड्यूटी भुगतान वाउचर | चालान: {booking.bookingNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-[11px]">
            <div>
              <p><span className="text-slate-500">चालक का नाम:</span> <strong>{booking.driverName}</strong></p>
              <p className="mt-0.5"><span className="text-slate-500">मोबाइल:</span> <span className="font-mono">{booking.driverPhone}</span></p>
            </div>
            <div className="text-right">
              <p><span className="text-slate-500">गाड़ी:</span> <strong className="font-mono">{booking.vehicleNumber}</strong></p>
              <p className="mt-0.5"><span className="text-slate-500">दिनांक:</span> {booking.reportingDate}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border border-slate-300 text-left">मद विवरण (Payment Heads)</th>
                <th className="p-2 border border-slate-300 text-right w-28">राशि (Amount ₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-300">दैनिक मूल मानदेय (Base Duty Wage):</td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold">₹{t.driverBaseWage}</td>
              </tr>
              {t.driverExtraHoursPay > 0 && (
                <tr>
                  <td className="p-2 border border-slate-300">अतिरिक्त समय / ओवरटाइम मानदेय (Overtime Pay):</td>
                  <td className="p-2 border border-slate-300 text-right font-mono font-bold">₹{t.driverExtraHoursPay}</td>
                </tr>
              )}
              {t.driverNightDa > 0 && (
                <tr>
                  <td className="p-2 border border-slate-300">रात्रि विश्राम भत्ता (Night Halt DA):</td>
                  <td className="p-2 border border-slate-300 text-right font-mono font-bold">₹{t.driverNightDa}</td>
                </tr>
              )}
              {t.tollParkingAmount > 0 && (
                <tr>
                  <td className="p-2 border border-slate-300">टोल व पार्किंग नकद प्रतिपूर्ति (Toll Reimbursement):</td>
                  <td className="p-2 border border-slate-300 text-right font-mono font-bold">₹{t.tollParkingAmount}</td>
                </tr>
              )}
              {t.driverAdvanceDeduction > 0 && (
                <tr className="bg-rose-50 text-rose-800">
                  <td className="p-2 border border-slate-300 font-semibold">पूर्व में दी गई पेशगी / एडवांस कटौती (-):</td>
                  <td className="p-2 border border-slate-300 text-right font-mono font-bold">- ₹{t.driverAdvanceDeduction}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-black text-sm">
                <td className="p-2 text-right border border-slate-900">कुल शुद्ध देय चालक (Net Payout):</td>
                <td className="p-2 text-right border border-slate-900 font-mono text-emerald-300">
                  {formatCurrencyINR(t.netDriverPayable + (t.tollParkingAmount || 0))}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="pt-6 flex justify-between items-end text-xs">
            <div className="text-center">
              <div className="w-32 border-b border-slate-400 mb-1"></div>
              <p className="text-[10px] text-slate-500">अकाउंटेंट / कैशियर हस्ताक्षर</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-slate-400 mb-1"></div>
              <p className="text-[10px] text-slate-500">चालक प्राप्ति हस्ताक्षर ({booking.driverName})</p>
            </div>
          </div>
        </div>

        {/* Update Payout Status Controls */}
        <div className="mt-5 p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">भुगतान की गई राशि (₹)</label>
              <input
                type="number"
                value={driverPaid}
                onChange={(e) => setDriverPaid(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono font-bold text-white w-32"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">भुगतान स्थिति (Status)</label>
              <select
                value={driverStatus}
                onChange={(e) => setDriverStatus(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-semibold text-white"
              >
                <option value="pending">Pending (भुगतान बाकी)</option>
                <option value="partially_paid">Partially Paid (आंशिक भुगतान)</option>
                <option value="settled">Settled (पूरा भुगतान चुकता ✓)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>✓ सुरक्षित करें</span>
          </button>
        </div>
      </div>
    </div>
  );
};

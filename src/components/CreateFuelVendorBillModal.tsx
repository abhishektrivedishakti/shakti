import React, { useState, useMemo } from 'react';
import { Fuel, Building2, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  FuelPumpVendor,
  FuelSlip,
  FuelVendorMonthlyBill,
  FuelVendorBillVehicleSummary,
  Vehicle,
} from '../types';
import { formatCurrency } from '../utils/calculations';

interface CreateFuelVendorBillModalProps {
  fuelPumpVendors: FuelPumpVendor[];
  fuelSlips: FuelSlip[];
  vehicles: Vehicle[];
  onClose: () => void;
  onSaveBill: (bill: FuelVendorMonthlyBill, linkedSlipIds: string[]) => void;
}

export const CreateFuelVendorBillModal: React.FC<CreateFuelVendorBillModalProps> = ({
  fuelPumpVendors,
  fuelSlips,
  vehicles,
  onClose,
  onSaveBill,
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedPumpId, setSelectedPumpId] = useState(fuelPumpVendors[0]?.id || '');
  const [monthYear, setMonthYear] = useState(currentMonth);
  const [billNumber, setBillNumber] = useState(
    `FPB-${monthYear.replace('-', '')}-${Date.now().toString().slice(-4)}`
  );
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('मासिक फ्यूल पर्ची मिलान उपरांत बिल तैयार किया गया।');

  const selectedPump = fuelPumpVendors.find((p) => p.id === selectedPumpId);
  const [isTdsApplicable, setIsTdsApplicable] = useState<boolean>(selectedPump?.isTdsApplicable ?? false);
  const [tdsRate, setTdsRate] = useState<number>(selectedPump?.tdsRate ?? 0.1);
  const [tdsSection, setTdsSection] = useState<string>(selectedPump?.tdsSection || '194Q');

  const handlePumpSelect = (pId: string) => {
    setSelectedPumpId(pId);
    const pump = fuelPumpVendors.find((p) => p.id === pId);
    setIsTdsApplicable(pump?.isTdsApplicable ?? false);
    setTdsRate(pump?.tdsRate ?? 0.1);
    setTdsSection(pump?.tdsSection || '194Q');
  };

  // Auto-find filled slips for this pump and month
  const matchingSlips = useMemo(() => {
    return fuelSlips.filter((s) => {
      const isSamePump = s.pumpVendorId === selectedPumpId;
      const dateToCheck = s.fillDate || s.issueDate;
      const isSameMonth = dateToCheck.startsWith(monthYear);
      return isSamePump && isSameMonth && s.status !== 'cancelled';
    });
  }, [fuelSlips, selectedPumpId, monthYear]);

  // Aggregate by vehicle
  const autoBreakdown = useMemo(() => {
    const map = new Map<string, {
      vehicleId: string;
      vehicleNumber: string;
      makeModel?: string;
      driverName?: string;
      slips: FuelSlip[];
    }>();

    matchingSlips.forEach((s) => {
      const vId = s.vehicleId;
      if (!map.has(vId)) {
        const veh = vehicles.find((v) => v.id === vId);
        map.set(vId, {
          vehicleId: vId,
          vehicleNumber: s.vehicleNumber,
          makeModel: s.vehicleModel || veh?.makeModel,
          driverName: s.driverName,
          slips: [],
        });
      }
      map.get(vId)!.slips.push(s);
    });

    const summaries: FuelVendorBillVehicleSummary[] = [];
    map.forEach((item) => {
      const totalLiters = item.slips.reduce((sum, s) => sum + (s.actualLiters || s.authorizedValue || 0), 0);
      const totalAmount = item.slips.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const avgRate = totalLiters > 0 ? totalAmount / totalLiters : 89.6;
      summaries.push({
        vehicleId: item.vehicleId,
        vehicleNumber: item.vehicleNumber,
        makeModel: item.makeModel,
        driverName: item.driverName,
        refillCount: item.slips.length,
        totalLiters: Math.round(totalLiters * 100) / 100,
        avgRate: Math.round(avgRate * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        slipNumbers: item.slips.map((s) => s.slipNumber),
      });
    });

    return summaries;
  }, [matchingSlips, vehicles]);

  const totalCompiledLiters = autoBreakdown.reduce((sum, v) => sum + v.totalLiters, 0);
  const totalCompiledAmount = autoBreakdown.reduce((sum, v) => sum + v.totalAmount, 0);
  const grossAfterDiscount = Math.max(0, totalCompiledAmount - Number(discount || 0));
  const effectiveTdsRate = isTdsApplicable ? Number(tdsRate || 0) : 0;
  const calculatedTds = Math.round((grossAfterDiscount * effectiveTdsRate) / 100);
  const netPayable = Math.max(0, grossAfterDiscount - calculatedTds);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPump) {
      alert('कृपया पेट्रोल पंप चुनें।');
      return;
    }

    const bill: FuelVendorMonthlyBill = {
      id: `fvbill-${Date.now()}`,
      billNumber: billNumber.trim() || `FP-${Date.now()}`,
      pumpVendorId: selectedPump.id,
      pumpVendorName: selectedPump.name,
      monthYear,
      billDate,
      dueDate: dueDate || undefined,
      totalLiters: totalCompiledLiters,
      totalAmount: totalCompiledAmount,
      discountOrRebate: Number(discount) || 0,
      isTdsApplicable,
      tdsRate: effectiveTdsRate,
      tdsAmount: calculatedTds,
      tdsSection: isTdsApplicable ? tdsSection : undefined,
      netPayable,
      paymentStatus: 'pending',
      vehicleBreakdown: autoBreakdown,
      reconciledSlipsCount: matchingSlips.length,
      notes: notes.trim(),
      verifiedBy: 'Fleet Accounts Team',
    };

    const linkedSlipIds = matchingSlips.map((s) => s.id);
    onSaveBill(bill, linkedSlipIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                मासिक पेट्रोल पंप वेंडर बिल दर्ज करें (Create Fuel Vendor Bill)
              </h3>
              <p className="text-[11px] text-slate-500">पंप वेंडर से प्राप्त बिल दर्ज करें व पर्ची मिलान करें</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fuel Pump Vendor *</label>
              <select
                required
                value={selectedPumpId}
                onChange={(e) => handlePumpSelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-indigo-50/50 font-bold"
              >
                {fuelPumpVendors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Month (बिलिंग माह) *</label>
              <input
                type="month"
                required
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vendor Bill No. *</label>
              <input
                type="text"
                required
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bill Date *</label>
              <input
                type="date"
                required
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Auto Reconciled Slips & Breakdown Preview */}
          <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>पर्ची मिलान व गाड़ी-वार स्वतः गणना (Auto Slips Reconciled)</span>
                </span>
                <p className="text-[10px] text-slate-500">
                  इस वेंडर व माह के कुल <strong>{matchingSlips.length}</strong> पर्चियां मिलीं
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-black text-indigo-950">
                  {totalCompiledLiters.toFixed(1)} L &bull; {formatCurrency(totalCompiledAmount)}
                </span>
              </div>
            </div>

            {autoBreakdown.length === 0 ? (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  इस महीने ({monthYear}) हेतु इस पंप पर अभी कोई 'भरा हुआ (Filled)' पर्ची उपलब्ध नहीं है। आप नीचे सीधे विवरण दर्ज कर सकते हैं।
                </span>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-2.5">Vehicle</th>
                      <th className="py-1.5 px-2.5">Driver</th>
                      <th className="py-1.5 px-2.5 text-center">Refills</th>
                      <th className="py-1.5 px-2.5 text-right">Liters</th>
                      <th className="py-1.5 px-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {autoBreakdown.map((vb) => (
                      <tr key={vb.vehicleId} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900">{vb.vehicleNumber}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{vb.driverName}</td>
                        <td className="py-1.5 px-2.5 text-center font-semibold">{vb.refillCount}</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-semibold">{vb.totalLiters.toFixed(1)} L</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(vb.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FUEL BILL TDS CONTROLS */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 text-xs block">
                  TDS कटौती विकल्प (TDS Deduction on Fuel Bill)
                </span>
                <span className="text-[10px] text-slate-500">
                  {selectedPump?.name} {selectedPump?.panNumber ? `(PAN: ${selectedPump.panNumber})` : ''}
                </span>
              </div>
              <div className="inline-flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsTdsApplicable(true)}
                  className={`px-2.5 py-1 rounded transition-all ${
                    isTdsApplicable ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  TDS काटना है
                </button>
                <button
                  type="button"
                  onClick={() => setIsTdsApplicable(false)}
                  className={`px-2.5 py-1 rounded transition-all ${
                    !isTdsApplicable ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  TDS नहीं काटना (0%)
                </button>
              </div>
            </div>

            {isTdsApplicable ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    TDS Rate (% दर चुनें):
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[0.1, 1, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setTdsRate(rate)}
                        className={`px-2 py-1 rounded-lg border text-xs font-bold transition-all ${
                          tdsRate === rate
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={tdsRate !== 0.1 && tdsRate !== 1 && tdsRate !== 2 ? tdsRate : ''}
                        onChange={(e) => setTdsRate(Number(e.target.value))}
                        className="w-12 text-xs font-bold py-1 outline-hidden"
                        placeholder="कस्टम"
                      />
                      <span className="text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-50 p-2 rounded-lg border border-rose-200 text-xs">
                  <span className="text-[10px] text-rose-800 font-semibold block">
                    TDS कटौती ({effectiveTdsRate}% u/s {tdsSection}):
                  </span>
                  <span className="font-bold text-rose-700 font-mono text-sm">
                    -{formatCurrency(calculatedTds)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                <span>Nil TDS: इस फ्यूल बिल से 0% TDS कटेगा।</span>
                <span className="font-mono font-bold text-emerald-800">₹0 TDS</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount / Rebate (छूट यदि कोई हो)</label>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="₹0"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Net Payable to Pump (शुद्ध भुगतान)</label>
              <input
                type="text"
                disabled
                value={formatCurrency(netPayable)}
                className="w-full px-3 py-1.5 border border-emerald-300 bg-emerald-50 rounded-lg font-black font-mono text-emerald-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Verification Remarks / मुंशी टिप्पणी</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified with driver duty slips and pump meter reading"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-xs"
            >
              मासिक बिल सुरक्षित करें (Save Bill)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

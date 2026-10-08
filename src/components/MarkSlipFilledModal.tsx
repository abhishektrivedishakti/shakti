import React, { useState } from 'react';
import { Fuel, CheckCircle2, IndianRupee, Gauge } from 'lucide-react';
import { FuelSlip, FuelRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';

interface MarkSlipFilledModalProps {
  slip: FuelSlip | null;
  onClose: () => void;
  onConfirmFill: (updatedSlip: FuelSlip, fuelRecord: FuelRecord) => void;
}

export const MarkSlipFilledModal: React.FC<MarkSlipFilledModalProps> = ({
  slip,
  onClose,
  onConfirmFill,
}) => {
  if (!slip) return null;

  const [actualLiters, setActualLiters] = useState<number>(
    slip.actualLiters || (slip.authorizedQuantityType === 'liters' ? slip.authorizedValue : 35)
  );
  const [ratePerLiter, setRatePerLiter] = useState<number>(slip.ratePerLiter || 89.6);
  const [totalAmount, setTotalAmount] = useState<number>(
    slip.totalAmount || Math.round(actualLiters * (slip.ratePerLiter || 89.6) * 100) / 100
  );
  const [fillDate, setFillDate] = useState<string>(
    slip.fillDate || new Date().toISOString().slice(0, 10)
  );
  const [fillTime, setFillTime] = useState<string>(
    slip.fillTime || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [closingOdo, setClosingOdo] = useState<number>(
    slip.closingOdometerKm || (slip.openingOdometerKm ? slip.openingOdometerKm + 120 : 0)
  );
  const [pumpReceiptNumber, setPumpReceiptNumber] = useState<string>(
    slip.pumpReceiptNumber || `RCP-${Date.now().toString().slice(-4)}`
  );
  const [notes, setNotes] = useState<string>(slip.notes || '');

  const handleLitersRateChange = (liters: number, rate: number) => {
    setActualLiters(liters);
    setRatePerLiter(rate);
    setTotalAmount(Math.round(liters * rate * 100) / 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualLiters || !ratePerLiter) {
      alert('कृपया डीजल मात्रा व दर दर्ज करें।');
      return;
    }

    const updatedSlip: FuelSlip = {
      ...slip,
      status: 'filled',
      actualLiters: Number(actualLiters),
      ratePerLiter: Number(ratePerLiter),
      totalAmount: Number(totalAmount),
      fillDate,
      fillTime,
      closingOdometerKm: Number(closingOdo) || slip.openingOdometerKm,
      pumpReceiptNumber: pumpReceiptNumber.trim(),
      notes: notes.trim(),
    };

    const fuelRecord: FuelRecord = {
      id: `fuel-slip-${slip.id}`,
      date: fillDate,
      vehicleId: slip.vehicleId,
      vehicleNumber: slip.vehicleNumber,
      driverId: slip.driverId,
      driverName: slip.driverName,
      mode: 'slip',
      liters: Number(actualLiters),
      ratePerLiter: Number(ratePerLiter),
      totalAmount: Number(totalAmount),
      odometerKm: Number(closingOdo) || (slip.openingOdometerKm || 0),
      fuelType: slip.fuelType,
      fuelStation: slip.pumpVendorName,
      receiptNumber: pumpReceiptNumber || slip.slipNumber,
      fullTank: slip.authorizedQuantityType === 'full_tank',
      notes: `कार्यालय पर्ची: ${slip.slipNumber} | ${notes}`,
      recordedBy: 'Fleet Office',
      fuelSlipId: slip.id,
      pumpVendorId: slip.pumpVendorId,
    };

    onConfirmFill(updatedSlip, fuelRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl my-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">पंप से भराई दर्ज करें (Record Dispensed Fuel)</h3>
              <p className="text-[11px] text-slate-500">पर्ची: {slip.slipNumber} &bull; {slip.vehicleNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 text-xs grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">गाड़ी व चालक:</span>
            <span className="font-bold text-slate-900">{slip.vehicleNumber}</span>
            <div className="text-[10px] text-slate-600">{slip.driverName}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">पेट्रोल पंप:</span>
            <span className="font-bold text-indigo-900">{slip.pumpVendorName}</span>
            <div className="text-[10px] text-indigo-700">स्वीकृत: {slip.authorizedQuantityType === 'full_tank' ? 'Full Tank' : `${slip.authorizedValue} ${slip.authorizedQuantityType === 'fixed_amount' ? '₹' : 'L'}`}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fill Date (तारीख) *</label>
              <input
                type="date"
                required
                value={fillDate}
                onChange={(e) => setFillDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time (समय)</label>
              <input
                type="time"
                value={fillTime}
                onChange={(e) => setFillTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Liters and Rate with automatic calculation */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Actual Liters *</label>
              <input
                type="number"
                step="0.01"
                required
                value={actualLiters || ''}
                onChange={(e) => handleLitersRateChange(Number(e.target.value), ratePerLiter)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-indigo-700 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rate / L (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={ratePerLiter || ''}
                onChange={(e) => handleLitersRateChange(actualLiters, Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={totalAmount || ''}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-black font-mono text-emerald-800 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pump Receipt / Bill No.</label>
              <input
                type="text"
                required
                placeholder="e.g. IOC-55410"
                value={pumpReceiptNumber}
                onChange={(e) => setPumpReceiptNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Closing Odometer (KM)</label>
              <input
                type="number"
                placeholder="e.g. 45320"
                value={closingOdo || ''}
                onChange={(e) => setClosingOdo(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pump Dispenser / Attendant Remark</label>
            <input
              type="text"
              placeholder="e.g. Tank full verified by attendant"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs"
            >
              भराई पूर्ण दर्ज करें (Confirm Refill)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

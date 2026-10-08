import React, { useState } from 'react';
import { Fuel, Car, User, Clock, Calendar, Check, AlertCircle, Building2 } from 'lucide-react';
import { Vehicle, Driver, FuelPumpVendor, FuelSlip } from '../types';

interface IssueFuelSlipModalProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  fuelPumpVendors: FuelPumpVendor[];
  existingSlips: FuelSlip[];
  onClose: () => void;
  onSaveSlip: (slip: FuelSlip) => void;
}

export const IssueFuelSlipModal: React.FC<IssueFuelSlipModalProps> = ({
  vehicles,
  drivers,
  fuelPumpVendors,
  existingSlips,
  onClose,
  onSaveSlip,
}) => {
  // Generate next slip number
  const nextSlipSeq = existingSlips.length + 101;
  const defaultSlipNumber = `SLIP-2026-${String(nextSlipSeq).padStart(3, '0')}`;

  const [slipNumber, setSlipNumber] = useState(defaultSlipNumber);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [issueTime, setIssueTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedPumpVendorId, setSelectedPumpVendorId] = useState(fuelPumpVendors[0]?.id || '');
  const [fuelType, setFuelType] = useState<'Diesel' | 'Petrol' | 'CNG'>('Diesel');
  const [authQtyType, setAuthQtyType] = useState<'liters' | 'full_tank' | 'fixed_amount'>('liters');
  const [authValue, setAuthValue] = useState<number>(35);
  const [odometerKm, setOdometerKm] = useState<number>(vehicles[0]?.currentOdometer || 0);
  const [notes, setNotes] = useState('');

  // When vehicle changes, update driver and fuel type automatically
  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const veh = vehicles.find((v) => v.id === vId);
    if (veh) {
      if (veh.currentDriverId) {
        setSelectedDriverId(veh.currentDriverId);
      }
      setFuelType(veh.fuelType === 'CNG' ? 'CNG' : veh.fuelType === 'Petrol' ? 'Petrol' : 'Diesel');
      setOdometerKm(veh.currentOdometer || 0);
    }
  };

  // Sync initial driver on mount
  React.useEffect(() => {
    if (vehicles[0]) {
      handleVehicleChange(vehicles[0].id);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === selectedVehicleId);
    const drv = drivers.find((d) => d.id === (selectedDriverId || veh?.currentDriverId));
    const pump = fuelPumpVendors.find((p) => p.id === selectedPumpVendorId);

    if (!veh || !pump) {
      alert('कृपया गाड़ी एवं अधिकृत पेट्रोल पंप का चयन करें।');
      return;
    }

    const newSlip: FuelSlip = {
      id: `fslip-${Date.now()}`,
      slipNumber: slipNumber.trim() || `SLIP-${Date.now().toString().slice(-4)}`,
      issueDate,
      issueTime,
      vehicleId: veh.id,
      vehicleNumber: veh.vehicleNumber,
      vehicleModel: veh.makeModel,
      driverId: drv?.id || 'unassigned',
      driverName: drv?.name || 'Driver / चालक',
      driverPhone: drv?.phone || '',
      pumpVendorId: pump.id,
      pumpVendorName: pump.name,
      fuelType,
      authorizedQuantityType: authQtyType,
      authorizedValue: authQtyType === 'full_tank' ? 0 : Number(authValue) || 0,
      openingOdometerKm: Number(odometerKm) || 0,
      issuedBy: 'कार्यालय मुंशी / Fleet Office',
      status: 'issued',
      notes: notes.trim(),
    };

    onSaveSlip(newSlip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">नई ईंधन पर्ची जारी करें (Issue Fuel Slip)</h3>
              <p className="text-[11px] text-slate-500">ड्राइवर को ऑफिस से पेट्रोल पंप हेतु अधिकृत पर्ची दें</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Slip Number and Date Time */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parchi / Slip No. *</label>
              <input
                type="text"
                required
                value={slipNumber}
                onChange={(e) => setSlipNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Issue Date *</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time</label>
              <input
                type="time"
                value={issueTime}
                onChange={(e) => setIssueTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          {/* Vehicle and Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select Vehicle (गाड़ी चुनें) *</span>
              </label>
              <select
                required
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} &bull; {v.makeModel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Driver (चालक)</span>
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Default Assigned Driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tied-up Fuel Pump Vendor */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Authorized Fuel Pump (अधिकृत पेट्रोल पंप वेंडर) *</span>
            </label>
            <select
              required
              value={selectedPumpVendorId}
              onChange={(e) => setSelectedPumpVendorId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-indigo-50/50 font-bold text-slate-900"
            >
              {fuelPumpVendors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.location} ({p.stationBrand})
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type & Authorized Quantity */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fuel Type (ईंधन प्रकार)</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Diesel">Diesel (डीजल)</option>
                  <option value="Petrol">Petrol (पेट्रोल)</option>
                  <option value="CNG">CNG (गैस)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opening Odometer (KM)</label>
                <input
                  type="number"
                  value={odometerKm || ''}
                  onChange={(e) => setOdometerKm(Number(e.target.value))}
                  placeholder="e.g. 45200"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Authorized Fuel Quantity (स्वीकृत मात्रा) *</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setAuthQtyType('liters')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    authQtyType === 'liters'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Liters / Kg (लीटर)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthQtyType('full_tank')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    authQtyType === 'full_tank'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Full Tank (टैंक फुल)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthQtyType('fixed_amount')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    authQtyType === 'fixed_amount'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Fixed ₹ (राशि)
                </button>
              </div>

              {authQtyType === 'liters' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={authValue || ''}
                    onChange={(e) => setAuthValue(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-indigo-700 text-sm"
                  />
                  <span className="text-slate-600 font-semibold">{fuelType === 'CNG' ? 'Kg' : 'Liters'} स्वीकृत</span>
                </div>
              )}

              {authQtyType === 'fixed_amount' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={authValue || ''}
                    onChange={(e) => setAuthValue(Number(e.target.value))}
                    className="w-36 px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-indigo-700 text-sm font-mono"
                  />
                  <span className="text-slate-600 font-semibold">अधिकतम का ईंधन</span>
                </div>
              )}

              {authQtyType === 'full_tank' && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  चालक को गाड़ी का टैंक पूर्ण भरने (Full Tank) की अनुमति दी गई है।
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / कार्यालय निर्देश</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VIP Inspection Duty / Highway Tour"
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              पर्ची जारी करें (Issue Slip)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

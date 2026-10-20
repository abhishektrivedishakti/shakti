import React, { useState } from 'react';
import { Car, ShieldAlert, X } from 'lucide-react';
import type { Driver, Tender, Vehicle } from '../types';

interface FleetVehicleEditModalProps {
  initialVehicle: Vehicle;
  drivers: Driver[];
  tenders: Tender[];
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
}

/**
 * Owns its own draft state so form field changes (e.g. Commercial ↔ Private)
 * do not re-render the parent fleet list / card grid.
 */
export const FleetVehicleEditModal: React.FC<FleetVehicleEditModalProps> = ({
  initialVehicle,
  drivers,
  tenders,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<Vehicle>(initialVehicle);
  const isEdit = Boolean(initialVehicle.vehicleNumber);

  const patch = (partial: Partial<Vehicle>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.vehicleNumber.trim()) {
      alert('Please enter vehicle registration number (e.g. UP32 AB 1234)');
      return;
    }
    onSave(draft);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-teal-700" />
            <span>
              {isEdit
                ? 'गाड़ी विवरण संशोधित करें (Edit Vehicle)'
                : 'नई गाड़ी जोड़ें (Add New Vehicle)'}
            </span>
          </h2>
          <button type="button" onClick={onClose} className="text-[var(--color-muted)] hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                गाड़ी रजिस्ट्रेशन नंबर (Vehicle No.) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UP32 AB 1234"
                value={draft.vehicleNumber}
                onChange={(e) => patch({ vehicleNumber: e.target.value.toUpperCase() })}
                className="w-full uppercase font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                रजिस्ट्रेशन प्रकार (Commercial / Private) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => patch({ registrationType: 'Commercial' })}
                  className={`py-2 px-3 rounded-lg border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    (draft.registrationType || 'Commercial') === 'Commercial'
                      ? 'bg-teal-100 border-teal-500 text-teal-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-3 h-2 bg-amber-400 border border-slate-900 rounded-xs" />
                  <span>कमर्शियल (पीली)</span>
                </button>

                <button
                  type="button"
                  onClick={() => patch({ registrationType: 'Private' })}
                  className={`py-2 px-3 rounded-lg border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    draft.registrationType === 'Private'
                      ? 'bg-white border-slate-600 text-slate-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-3 h-2 bg-white border border-slate-500 rounded-xs" />
                  <span>प्राइवेट (सफ़ेद)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                गाड़ी का नाम व मॉडल (Make &amp; Model) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maruti Swift Dzire ZXi / Innova Crysta"
                value={draft.makeModel}
                onChange={(e) => patch({ makeModel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">बॉडी टाइप</label>
              <select
                value={draft.vehicleType}
                onChange={(e) => patch({ vehicleType: e.target.value as Vehicle['vehicleType'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="Sedan">Sedan (Dzire, Amaze)</option>
                <option value="SUV">SUV (Scorpio, Bolero)</option>
                <option value="MUV">MUV (Innova, Ertiga)</option>
                <option value="Hatchback">Hatchback (WagonR)</option>
                <option value="EV">EV (Tiago/Nexon EV)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ईंधन (Fuel)</label>
              <select
                value={draft.fuelType}
                onChange={(e) => patch({ fuelType: e.target.value as Vehicle['fuelType'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">स्वामित्व (Ownership)</label>
              <select
                value={draft.ownershipType}
                onChange={(e) => patch({ ownershipType: e.target.value as Vehicle['ownershipType'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="Company Owned">Company Owned (कंपनी की)</option>
                <option value="Attached / Market Hire">Attached / Market Hire (वेंडर)</option>
                <option value="Owner-Driver">Owner-Driver (मालिक-ड्राइवर)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ओडोमीटर (KM)</label>
              <input
                type="number"
                value={draft.currentOdometer}
                onChange={(e) => patch({ currentOdometer: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                चालू ड्राइवर (Assigned Driver)
              </label>
              <select
                value={draft.currentDriverId || ''}
                onChange={(e) => patch({ currentDriverId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">-- कोई ड्राइवर नहीं (Standby Pool) --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone}) {d.currentVehicleId === draft.id ? '★ वर्तमान' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                संलग्न टेंडर / विभाग (Tender)
              </label>
              <select
                value={draft.tenderId}
                onChange={(e) => patch({ tenderId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {tenders.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.departmentName} ({t.workOrderNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>दस्तावेज़ एक्सपायरी तिथियां (1-Month Auto Alert Active)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  PUC एक्सपायरी (प्रदूषण)
                </label>
                <input
                  type="date"
                  value={draft.pucExpiry || ''}
                  onChange={(e) => patch({ pucExpiry: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  इंश्योरेंस एक्सपायरी (बीमा)
                </label>
                <input
                  type="date"
                  value={draft.insuranceExpiry || ''}
                  onChange={(e) => patch({ insuranceExpiry: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  RTO फिटनेस एक्सपायरी
                </label>
                <input
                  type="date"
                  value={draft.rtoFitnessExpiry || ''}
                  onChange={(e) => patch({ rtoFitnessExpiry: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  बीमा कंपनी (Insurance Co.)
                </label>
                <input
                  type="text"
                  placeholder="e.g. United India / ICICI Lombard"
                  value={draft.insuranceCompany || ''}
                  onChange={(e) => patch({ insuranceCompany: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  बीमा पॉलिसी नंबर (Policy No.)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0823003126P100234"
                  value={draft.insurancePolicyNo || ''}
                  onChange={(e) => patch({ insurancePolicyNo: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              रद्द करें (Cancel)
            </button>
            <button type="submit" className="btn btn-primary !text-xs">
              सुरक्षित करें (Save Vehicle)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

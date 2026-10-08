import React, { useState } from 'react';
import { Building2, Fuel, Phone, MapPin, CreditCard } from 'lucide-react';
import { FuelPumpVendor } from '../types';

interface PumpVendorModalProps {
  vendor?: FuelPumpVendor | null;
  onClose: () => void;
  onSave: (vendor: FuelPumpVendor) => void;
}

export const PumpVendorModal: React.FC<PumpVendorModalProps> = ({ vendor, onClose, onSave }) => {
  const [name, setName] = useState(vendor?.name || '');
  const [stationBrand, setStationBrand] = useState<'IOCL' | 'BPCL' | 'HPCL' | 'Reliance' | 'Nayara' | 'Other'>(
    vendor?.stationBrand || 'IOCL'
  );
  const [location, setLocation] = useState(vendor?.location || '');
  const [contactPerson, setContactPerson] = useState(vendor?.contactPerson || '');
  const [phone, setPhone] = useState(vendor?.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(vendor?.alternatePhone || '');
  const [panNumber, setPanNumber] = useState(vendor?.panNumber || '');
  const [gstin, setGstin] = useState(vendor?.gstin || '');
  const [creditLimit, setCreditLimit] = useState<number>(vendor?.creditLimit || 200000);
  const [billingCycleDay, setBillingCycleDay] = useState<number>(vendor?.billingCycleDay || 1);
  const [isTdsApplicable, setIsTdsApplicable] = useState<boolean>(vendor?.isTdsApplicable ?? false);
  const [tdsRate, setTdsRate] = useState<number>(vendor?.tdsRate ?? 0.1);
  const [tdsSection, setTdsSection] = useState<string>(vendor?.tdsSection || '194Q');
  const [tdsExemptionReason, setTdsExemptionReason] = useState<string>(
    vendor?.tdsExemptionReason || 'वार्षिक क्रय सीमा ₹50 लाख से कम (Under Section 194Q Threshold)'
  );
  const [bankDetails, setBankDetails] = useState(vendor?.bankDetails || '');
  const [notes, setNotes] = useState(vendor?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('कृपया पंप का नाम व मोबाइल नंबर दर्ज करें।');
      return;
    }

    const savedVendor: FuelPumpVendor = {
      id: vendor?.id || `pump-${Date.now()}`,
      name: name.trim(),
      stationBrand,
      location: location.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      panNumber: panNumber.trim().toUpperCase() || undefined,
      gstin: gstin.trim() || undefined,
      creditLimit: Number(creditLimit) || 0,
      billingCycleDay: Number(billingCycleDay) || 1,
      isTdsApplicable,
      tdsRate: isTdsApplicable ? Number(tdsRate) : 0,
      tdsSection: isTdsApplicable ? tdsSection : undefined,
      tdsExemptionReason: !isTdsApplicable ? tdsExemptionReason : undefined,
      bankDetails: bankDetails.trim() || undefined,
      status: vendor?.status || 'active',
      notes: notes.trim() || undefined,
    };

    onSave(savedVendor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {vendor ? 'पेट्रोल पंप विवरण संशोधित करें' : 'नया अनुबंधित पेट्रोल पंप जोड़ें'}
              </h3>
              <p className="text-[11px] text-slate-500">Tied-up Credit Fuel Pump Vendor Master</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pump Station Name (पंप का नाम) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Kisan Petroleum Service (IOCL)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Oil Brand (कंपनी) *</label>
              <select
                value={stationBrand}
                onChange={(e) => setStationBrand(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="IOCL">Indian Oil (IOCL)</option>
                <option value="BPCL">Bharat Petroleum (BPCL)</option>
                <option value="HPCL">Hindustan Petroleum (HPCL)</option>
                <option value="Reliance">Reliance Petroleum</option>
                <option value="Nayara">Nayara Energy / Essar</option>
                <option value="Other">Other Fuel Station</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Billing Cycle Day</label>
              <select
                value={billingCycleDay}
                onChange={(e) => setBillingCycleDay(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value={1}>1st of Month (माह की पहली तारीख)</option>
                <option value={25}>25th of Month (25 तारीख)</option>
                <option value={30}>Month End (माह का अंतिम दिन)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Station Address / Location (स्थान) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Faizabad Road, Chinhat, Lucknow"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Manager / Contact Person *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Chandra Agrawal"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile / WhatsApp Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 9415011999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">PAN Card Number</label>
              <input
                type="text"
                placeholder="e.g. AAAFK1234F"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN (यदि हो)</label>
              <input
                type="text"
                placeholder="09AAAFK1234F1Z8"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Credit Limit (₹)</label>
              <input
                type="number"
                step="10000"
                placeholder="e.g. 200000"
                value={creditLimit || ''}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="flex flex-col justify-end">
              <span className="text-[11px] text-slate-500 mb-1">Billing Cycle: Day {billingCycleDay}</span>
            </div>
          </div>

          {/* FUEL VENDOR TDS CONFIGURATION */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  TDS (टैक्स कटौती) विकल्प
                </span>
                <span className="text-[11px] text-slate-500">
                  क्या इस पेट्रोल पंप के मासिक बिल से TDS काटना है?
                </span>
              </div>
              <div className="inline-flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsTdsApplicable(true)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    isTdsApplicable ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  हाँ (Yes)
                </button>
                <button
                  type="button"
                  onClick={() => setIsTdsApplicable(false)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    !isTdsApplicable ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  नहीं (No TDS)
                </button>
              </div>
            </div>

            {isTdsApplicable ? (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    TDS Rate (% दर)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[0.1, 1, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setTdsRate(rate)}
                        className={`px-2 py-1 rounded border text-xs font-bold transition-all ${
                          tdsRate === rate
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={tdsRate !== 0.1 && tdsRate !== 1 && tdsRate !== 2 ? tdsRate : ''}
                      onChange={(e) => setTdsRate(Number(e.target.value))}
                      placeholder="अन्य %"
                      className="w-16 px-1.5 py-1 text-xs border border-slate-300 rounded font-bold bg-white text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Income Tax Section
                  </label>
                  <select
                    value={tdsSection}
                    onChange={(e) => setTdsSection(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  >
                    <option value="194Q">Sec 194Q (Purchase of Goods / Fuel - 0.1%)</option>
                    <option value="194C">Sec 194C (Contract - 1% / 2%)</option>
                    <option value="Other">अन्य (Other)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                  TDS न काटने का कारण:
                </label>
                <select
                  value={tdsExemptionReason}
                  onChange={(e) => setTdsExemptionReason(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
                >
                  <option value="वार्षिक क्रय सीमा ₹50 लाख से कम (Under Section 194Q Threshold)">
                    वार्षिक क्रय सीमा ₹50 लाख से कम (Under Section 194Q Threshold)
                  </option>
                  <option value="सरकारी PSU ऑइल कंपनी पंप छूट">
                    सरकारी PSU ऑइल कंपनी पंप छूट (Govt PSU Exempt)
                  </option>
                  <option value="अन्य छूट">अन्य छूट</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bank Payment Details (बैंक खाता)</label>
            <input
              type="text"
              placeholder="e.g. SBI A/C: 31089200192, IFSC: SBIN0001234"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Agreement Terms / Notes</label>
            <input
              type="text"
              placeholder="e.g. 30 Days credit period, slips must match monthly statement"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              सुरक्षित करें (Save Vendor)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BookingRecord, DutyTariff, DutyTypeCategory, CustomTariffPackage } from '../../types';
import { formatCurrencyINR } from '../../utils/dispatchFormatters';
import {
  Calculator,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookmarkPlus,
  Clock,
  Car,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  loadCustomTariffPackages,
  saveCustomTariffPackages,
} from '../../utils/directoryStorage';

interface DutyTariffModalProps {
  booking: BookingRecord;
  onClose: () => void;
  onUpdateTariff: (bookingId: string, updatedTariff: DutyTariff) => void;
}

export const DutyTariffModal: React.FC<DutyTariffModalProps> = ({
  booking,
  onClose,
  onUpdateTariff,
}) => {
  const [tariff, setTariff] = useState<DutyTariff>({
    ...booking.tariff,
    isPendingPackage:
      booking.tariff.isPendingPackage ||
      booking.tariff.packageType === 'pending_assignment',
  });

  const [customPackages, setCustomPackages] = useState<CustomTariffPackage[]>(() => {
    return loadCustomTariffPackages();
  });

  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    tariff.packageType === 'custom_package'
  );
  const [saveAsCustomTemplate, setSaveAsCustomTemplate] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Recalculate computed values
  const handleRecalculate = (updated: Partial<DutyTariff>) => {
    const next = { ...tariff, ...updated };

    const extraKmCost = Math.max(0, next.extraKmRun) * next.extraKmRate;
    const extraHourCost = Math.max(0, next.extraHoursRun) * next.extraHourRate;
    const grossClient =
      (next.isPendingPackage ? 0 : next.baseRate) +
      extraKmCost +
      extraHourCost +
      Number(next.tollParkingAmount || 0) +
      Number(next.stateTaxPermitCost || 0) +
      Number(next.nightHaltAmount || 0);

    const gstAmount = Math.round(grossClient * (next.gstRatePercent / 100) * 10) / 10;
    const netClientBillable = grossClient + gstAmount;

    // Driver settlement
    const netDriverPayable =
      next.driverBaseWage +
      next.driverExtraHoursPay +
      next.driverNightDa -
      next.driverAdvanceDeduction;

    setTariff({
      ...next,
      extraKmCost,
      extraHourCost,
      grossClientAmount: grossClient,
      gstAmount,
      netClientBillable,
      netDriverPayable,
    });
  };

  // Apply a standard or custom package preset
  const handleApplyPackagePreset = (pkg: {
    category: DutyTypeCategory;
    packageName: string;
    baseRate: number;
    baseHours: number;
    baseKm: number;
    extraKmRate: number;
    extraHourRate: number;
    nightHaltRate: number;
    driverWage: number;
  }) => {
    setIsCustomMode(pkg.category === 'custom_package');
    handleRecalculate({
      packageType: pkg.category,
      packageName: pkg.packageName,
      isPendingPackage: false,
      baseRate: pkg.baseRate,
      baseHours: pkg.baseHours,
      baseKm: pkg.baseKm,
      extraKmRate: pkg.extraKmRate,
      extraHourRate: pkg.extraHourRate,
      nightHaltRate: pkg.nightHaltRate,
      driverBaseWage: pkg.driverWage,
    });
  };

  // Mark package as pending assignment
  const handleSetPending = () => {
    setIsCustomMode(false);
    handleRecalculate({
      packageType: 'pending_assignment',
      packageName: 'Pending Tariff Assignment (पैकेज बाद में तय होगा)',
      isPendingPackage: true,
      baseRate: 0,
    });
  };

  // Save current customized package to custom templates library
  const handleSaveToLibrary = () => {
    if (!tariff.packageName || tariff.packageName.trim().length === 0) {
      alert('Please enter a package name to save.');
      return;
    }
    const newPkg: CustomTariffPackage = {
      id: `custom-pkg-${Date.now()}`,
      packageName: tariff.packageName.trim(),
      category: 'custom_package',
      baseRate: tariff.baseRate,
      baseHours: tariff.baseHours,
      baseKm: tariff.baseKm,
      extraKmRate: tariff.extraKmRate,
      extraHourRate: tariff.extraHourRate,
      nightHaltRate: tariff.nightHaltRate,
      driverWage: tariff.driverBaseWage,
      description: 'Customized Tariff Package',
    };

    const updated = [newPkg, ...customPackages];
    setCustomPackages(updated);
    saveCustomTariffPackages(updated);
    setSaveSuccessMsg(`Package "${newPkg.packageName}" saved to Custom Library!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveAsCustomTemplate && isCustomMode) {
      handleSaveToLibrary();
    }
    onUpdateTariff(booking.id, tariff);
    onClose();
  };

  const isPending = tariff.isPendingPackage || tariff.packageType === 'pending_assignment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Duty Tariff &amp; Fare Management</h3>
                <span className="text-xs text-slate-400 font-normal">(किराया व पैकेज निर्धारण)</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Duty Booking: <strong className="font-mono text-emerald-400">{booking.bookingNumber}</strong> &bull; {booking.passenger.name} ({booking.vehicleNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pending Package Notification Banner */}
        {isPending ? (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300">
                Tariff Package Pending (पैकेज तय करना शेष):
              </div>
              <p className="text-slate-300 leading-relaxed">
                This duty was booked without a finalized package. You can select a standard package below, choose a custom package, or enter custom rates now to finalize the billable fare.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Active Package: <strong>{tariff.packageName}</strong> &bull; Base Fare: <strong>₹{tariff.baseRate}</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Can be changed or customized below</span>
          </div>
        )}

        {/* PACKAGE SELECTION & CUSTOMIZATION PALETTE */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Select or Customize Duty Package (पैकेज चुनें या अनुकूलित करें)</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Click any preset to apply instantly, or click Custom to customize rates on-the-fly.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSetPending}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isPending
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900 border border-slate-700 text-amber-300 hover:bg-slate-800'
              }`}
              title="Leave package as pending to be decided later"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Decide Later (बाद में तय करें)</span>
            </button>
          </div>

          {/* Quick Package Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() =>
                handleApplyPackagePreset({
                  category: 'local_8hr_80km',
                  packageName: '8 Hours / 80 KM Local Inspection',
                  baseRate: 2400,
                  baseHours: 8,
                  baseKm: 80,
                  extraKmRate: 14,
                  extraHourRate: 150,
                  nightHaltRate: 350,
                  driverWage: 600,
                })
              }
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                tariff.packageType === 'local_8hr_80km' && !isPending
                  ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500 text-white shadow'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="text-xs font-bold">8 Hr / 80 KM Local</div>
              <div className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">₹2,400</div>
              <div className="text-[10px] text-slate-500 mt-0.5">+₹14/KM &bull; +₹150/Hr</div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleApplyPackagePreset({
                  category: 'local_12hr_100km',
                  packageName: '12 Hours / 100 KM Full Day Inspection',
                  baseRate: 3100,
                  baseHours: 12,
                  baseKm: 100,
                  extraKmRate: 14,
                  extraHourRate: 150,
                  nightHaltRate: 350,
                  driverWage: 750,
                })
              }
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                tariff.packageType === 'local_12hr_100km' && !isPending
                  ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500 text-white shadow'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="text-xs font-bold">12 Hr / 100 KM Full Day</div>
              <div className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">₹3,100</div>
              <div className="text-[10px] text-slate-500 mt-0.5">+₹14/KM &bull; +₹150/Hr</div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleApplyPackagePreset({
                  category: 'outstation',
                  packageName: 'Outstation Tour (250 KM Minimum)',
                  baseRate: 4200,
                  baseHours: 12,
                  baseKm: 250,
                  extraKmRate: 16,
                  extraHourRate: 180,
                  nightHaltRate: 450,
                  driverWage: 900,
                })
              }
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                tariff.packageType === 'outstation' && !isPending
                  ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500 text-white shadow'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="text-xs font-bold">Outstation Tour (250 KM)</div>
              <div className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">₹4,200</div>
              <div className="text-[10px] text-slate-500 mt-0.5">+₹16/KM &bull; Night DA ₹450</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCustomMode(true);
                handleRecalculate({
                  packageType: 'custom_package',
                  isPendingPackage: false,
                  packageName:
                    tariff.packageType === 'custom_package' && tariff.packageName
                      ? tariff.packageName
                      : 'Special Custom Duty Package',
                });
              }}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                isCustomMode && !isPending
                  ? 'bg-purple-950/80 border-purple-500 ring-1 ring-purple-500 text-white shadow'
                  : 'bg-slate-900/80 border-slate-800 text-purple-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Custom Package</span>
              </div>
              <div className="text-[11px] text-purple-400 font-medium mt-0.5">Define Your Own</div>
              <div className="text-[10px] text-slate-500 mt-0.5">अनुकूलित दरें व घंटे</div>
            </button>
          </div>

          {/* Saved Custom Packages Palette (if any) */}
          {customPackages.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 uppercase tracking-wider">
                Saved Custom Packages Library (सहेजे गए पैकेज):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {customPackages.map((cp) => (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() =>
                      handleApplyPackagePreset({
                        category: cp.category,
                        packageName: cp.packageName,
                        baseRate: cp.baseRate,
                        baseHours: cp.baseHours,
                        baseKm: cp.baseKm,
                        extraKmRate: cp.extraKmRate,
                        extraHourRate: cp.extraHourRate,
                        nightHaltRate: cp.nightHaltRate,
                        driverWage: cp.driverWage,
                      })
                    }
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-[11px] text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{cp.packageName}</span>
                    <span className="font-mono text-emerald-400 font-bold">₹{cp.baseRate}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TARIFF DETAILS FORM */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Section 1: Base Package Settings */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Base Package Tariff (मूल पैकेज दरें)</span>
              </h4>
              {isCustomMode && (
                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  className="px-2.5 py-1 bg-purple-950 text-purple-300 border border-purple-700/80 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-purple-900 transition cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Save as Reusable Package
                </button>
              )}
            </div>

            {saveSuccessMsg && (
              <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveSuccessMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">
                  Package Name / Description (पैकेज का नाम)
                </label>
                <input
                  type="text"
                  value={tariff.packageName}
                  onChange={(e) => handleRecalculate({ packageName: e.target.value })}
                  placeholder="e.g. 8 Hours / 80 KM Local Inspection"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Base Fare / Rate (₹) {isPending && '(Provisional)'}
                </label>
                <input
                  type="number"
                  value={tariff.baseRate}
                  onChange={(e) => handleRecalculate({ baseRate: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Quota (शामिल घंटे व KM)</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={tariff.baseHours}
                      onChange={(e) => handleRecalculate({ baseHours: Number(e.target.value) })}
                      className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-center"
                    />
                    <span className="text-slate-500">Hrs</span>
                  </div>
                  <span className="text-slate-600">/</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={tariff.baseKm}
                      onChange={(e) => handleRecalculate({ baseKm: Number(e.target.value) })}
                      className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-center"
                    />
                    <span className="text-slate-500">KM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Extra KM Rate & Extra Hour Rate in Base */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-800/60">
              <div>
                <label className="block text-slate-400 mb-1">Extra KM Rate (₹/KM)</label>
                <input
                  type="number"
                  value={tariff.extraKmRate}
                  onChange={(e) => handleRecalculate({ extraKmRate: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Extra Hour Rate (₹/Hr)</label>
                <input
                  type="number"
                  value={tariff.extraHourRate}
                  onChange={(e) => handleRecalculate({ extraHourRate: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Night Halt Rate (₹/Night)</label>
                <input
                  type="number"
                  value={tariff.nightHaltRate}
                  onChange={(e) => handleRecalculate({ nightHaltRate: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Driver Base Wage (₹)</label>
                <input
                  type="number"
                  value={tariff.driverBaseWage}
                  onChange={(e) => handleRecalculate({ driverBaseWage: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Extra Actual Run, Hours & Tolls */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>2. Extra Utilization &amp; Reimbursements (अतिरिक्त उपयोग व भत्ते)</span>
              <span className="text-[11px] text-slate-400 font-normal">Actual Duty Run</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Extra KM Run (किमी)</label>
                <input
                  type="number"
                  value={tariff.extraKmRun}
                  onChange={(e) => handleRecalculate({ extraKmRun: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-emerald-400 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  @ ₹{tariff.extraKmRate}/KM = ₹{tariff.extraKmCost}
                </span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Extra Hours Run (घंटे)</label>
                <input
                  type="number"
                  step="0.5"
                  value={tariff.extraHoursRun}
                  onChange={(e) => handleRecalculate({ extraHoursRun: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-emerald-400 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  @ ₹{tariff.extraHourRate}/Hr = ₹{tariff.extraHourCost}
                </span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Toll &amp; Parking Receipts (₹)</label>
                <input
                  type="number"
                  value={tariff.tollParkingAmount}
                  onChange={(e) => handleRecalculate({ tollParkingAmount: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">टोल व पार्किंग रसीद</span>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Night Halt / DA (₹)</label>
                <input
                  type="number"
                  value={tariff.nightHaltAmount}
                  onChange={(e) => handleRecalculate({ nightHaltAmount: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">रात्रि विश्राम भत्ता</span>
              </div>
            </div>
          </div>

          {/* Section 3: Client Billable Summary */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-emerald-300 font-bold block text-sm">
                Gross Client Billable Amount (कुल देय राशि):
              </span>
              <span className="text-slate-400 text-[11px] leading-relaxed block mt-0.5">
                Base: {formatCurrencyINR(tariff.baseRate)} + Extra KM: {formatCurrencyINR(tariff.extraKmCost)} + Extra Time: {formatCurrencyINR(tariff.extraHourCost)} + Tolls: {formatCurrencyINR(tariff.tollParkingAmount)} + GST ({tariff.gstRatePercent}%): {formatCurrencyINR(tariff.gstAmount)}
              </span>
            </div>
            <div className="text-right sm:text-right shrink-0">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatCurrencyINR(tariff.netClientBillable)}
              </span>
              <span className="block text-[10px] text-slate-400">Total Net Billable</span>
            </div>
          </div>

          {/* Section 4: Driver Payout Audit */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>3. Driver Payout Calculation (चालक मानदेय व भुगतान)</span>
              <span className="text-amber-400 font-mono font-bold">
                Net Payable: {formatCurrencyINR(tariff.netDriverPayable)}
              </span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Driver Base Wage (₹)</label>
                <input
                  type="number"
                  value={tariff.driverBaseWage}
                  onChange={(e) => handleRecalculate({ driverBaseWage: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Overtime Pay (₹)</label>
                <input
                  type="number"
                  value={tariff.driverExtraHoursPay}
                  onChange={(e) => handleRecalculate({ driverExtraHoursPay: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Night DA Allowance (₹)</label>
                <input
                  type="number"
                  value={tariff.driverNightDa}
                  onChange={(e) => handleRecalculate({ driverNightDa: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Advance Deduction (-) (₹)</label>
                <input
                  type="number"
                  value={tariff.driverAdvanceDeduction}
                  onChange={(e) => handleRecalculate({ driverAdvanceDeduction: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-rose-400 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel (रद्द करें)
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition"
            >
              <Save className="w-4 h-4" />
              <span>✓ Save &amp; Apply Tariff (दरें सुरक्षित करें)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

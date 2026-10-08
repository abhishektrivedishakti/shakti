import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Calendar,
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { MaintenanceRecord, Vehicle, ServiceType } from '../types';
import { formatCurrency, formatDate, getDaysDiff } from '../utils/calculations';

interface MaintenanceViewProps {
  maintenanceRecords: MaintenanceRecord[];
  vehicles: Vehicle[];
  onAddMaintenanceRecord: (record: MaintenanceRecord) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenanceRecords,
  vehicles,
  onAddMaintenanceRecord,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Maintenance Form State
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    date: new Date().toISOString().slice(0, 10),
    vehicleId: vehicles[0]?.id || '',
    serviceType: 'scheduled',
    odometerKm: 42000,
    garageName: 'Maruti Authorized Service',
    cost: 4500,
    partsReplaced: 'Engine Oil 5W30, Oil Filter, Air Filter',
    description: 'Periodic routine paid service and brake checkup',
    invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
    nextServiceDueKm: 52000,
    nextServiceDueDate: '',
  });

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.cost) {
      alert('Vehicle and Cost are required.');
      return;
    }

    const veh = vehicles.find((v) => v.id === formData.vehicleId);
    const rec: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      date: formData.date || new Date().toISOString().slice(0, 10),
      vehicleId: formData.vehicleId,
      vehicleNumber: veh?.vehicleNumber || '',
      serviceType: (formData.serviceType as ServiceType) || 'scheduled',
      odometerKm: Number(formData.odometerKm) || 0,
      garageName: formData.garageName || 'Authorized Workshop',
      cost: Number(formData.cost) || 0,
      partsReplaced: formData.partsReplaced || '',
      description: formData.description || 'Maintenance service',
      invoiceNumber: formData.invoiceNumber || '',
      nextServiceDueKm: formData.nextServiceDueKm ? Number(formData.nextServiceDueKm) : undefined,
      nextServiceDueDate: formData.nextServiceDueDate || undefined,
    };

    onAddMaintenanceRecord(rec);
    setIsModalOpen(false);
  };

  const filteredRecords = maintenanceRecords
    .filter((r) => selectedVehicleId === 'all' || r.vehicleId === selectedVehicleId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalMaintenanceCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-600" />
            <span>Monthly Fleet Maintenance &amp; Repairs &bull; मेंटेनेंस व सर्विस रिपोर्ट</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            गाड़ियों की सर्विसिंग, इंजन ऑयल, टायर, एसी रिपेयर व आरटीओ पासिंग खर्चों का संपूर्ण हिसाब
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            + Add Service Record (सर्विस / रिपेयर दर्ज करें)
          </button>
        </div>
      </div>

      {/* Fleet Maintenance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {vehicles.map((v) => {
          const vehRecords = maintenanceRecords.filter((r) => r.vehicleId === v.id);
          const totalSpent = vehRecords.reduce((sum, r) => sum + r.cost, 0);
          const lastService = vehRecords.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];

          return (
            <div
              key={v.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono font-bold text-sm text-slate-900">{v.vehicleNumber}</div>
                  <div className="text-[11px] text-slate-500">{v.makeModel}</div>
                </div>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono">
                  {v.currentOdometer.toLocaleString()} KM
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total Spent:</span>
                  <strong className="text-slate-900">{formatCurrency(totalSpent)}</strong>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Last Service:</span>
                  <span>{lastService ? formatDate(lastService.date) : 'N/A'}</span>
                </div>
              </div>

              {lastService?.nextServiceDueKm && (
                <div className="text-[11px] text-indigo-700 font-medium flex items-center justify-between pt-1">
                  <span>Next Due At:</span>
                  <span className="font-mono font-bold">
                    {lastService.nextServiceDueKm.toLocaleString()} KM
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Records Table with Vehicle Filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-sm text-slate-900">
              Maintenance History &amp; Garage Invoices
            </h4>
            <p className="text-xs text-slate-500">
              सभी सर्विस बिल, बदले गए पुर्जे व वर्कशॉप का विवरण
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-500">Filter Vehicle:</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Fleet (सभी गाड़ियाँ)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} ({v.makeModel})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="bg-slate-100 px-3 py-1 rounded text-slate-700">
            Total Records: <strong>{filteredRecords.length}</strong>
          </span>
          <span className="bg-emerald-50 px-3 py-1 rounded text-emerald-800 font-semibold">
            Total Maintenance Cost: {formatCurrency(totalMaintenanceCost)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date &amp; Inv No.</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Service Type</th>
                <th className="py-2.5 px-3">Odometer</th>
                <th className="py-2.5 px-3">Parts Replaced / Work Description</th>
                <th className="py-2.5 px-3">Garage / Workshop</th>
                <th className="py-2.5 px-3 text-right">Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{formatDate(rec.date)}</div>
                    <div className="text-[10px] font-mono text-slate-500">{rec.invoiceNumber || '-'}</div>
                  </td>

                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {rec.vehicleNumber}
                  </td>

                  <td className="py-2.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-800">
                      {rec.serviceType.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono">
                    {rec.odometerKm.toLocaleString()} KM
                  </td>

                  <td className="py-2.5 px-3 max-w-xs">
                    <div className="font-medium text-slate-900">{rec.description}</div>
                    {rec.partsReplaced && (
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={rec.partsReplaced}>
                        Parts: {rec.partsReplaced}
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-slate-600">
                    {rec.garageName}
                  </td>

                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                    {formatCurrency(rec.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" />
                <span>Add Maintenance / Repair Record (सर्विस खर्च दर्ज करें)</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Vehicle *
                  </label>
                  <select
                    required
                    value={formData.vehicleId || ''}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.makeModel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Service Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Service Type *
                  </label>
                  <select
                    value={formData.serviceType || 'scheduled'}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="scheduled">Periodic Scheduled Service (नियमित सर्विस)</option>
                    <option value="engine_oil">Engine Oil &amp; Filter Change</option>
                    <option value="brake_suspension">Brakes &amp; Suspension Repair</option>
                    <option value="tyres">Tyres Replacement / Alignment</option>
                    <option value="ac_repair">Air Conditioner (AC) Service</option>
                    <option value="denting_painting">Denting &amp; Painting</option>
                    <option value="rto_passing">RTO Fitness Passing / Inspection</option>
                    <option value="other">Other Running Repairs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Odometer at Service (KM)
                  </label>
                  <input
                    type="number"
                    value={formData.odometerKm || ''}
                    onChange={(e) => setFormData({ ...formData, odometerKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Repair Cost (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    placeholder="4500"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Garage / Workshop Bill No.
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber || ''}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    placeholder="e.g. CAS/INV/26-08812"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Workshop / Garage Name
                </label>
                <input
                  type="text"
                  value={formData.garageName || ''}
                  onChange={(e) => setFormData({ ...formData, garageName: e.target.value })}
                  placeholder="e.g. Maruti Competent Automobiles / Local Authorized Garage"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Work Details / Description *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 40,000 KM paid service, brake shoe cleaning, engine oil replaced"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Parts Replaced List (बदले गए सामान)
                </label>
                <input
                  type="text"
                  value={formData.partsReplaced || ''}
                  onChange={(e) => setFormData({ ...formData, partsReplaced: e.target.value })}
                  placeholder="e.g. 5W30 Synthetic Oil (3.1L), OEM Oil filter, Air filter"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Service Target Odometer (KM)
                  </label>
                  <input
                    type="number"
                    value={formData.nextServiceDueKm || ''}
                    onChange={(e) => setFormData({ ...formData, nextServiceDueKm: Number(e.target.value) })}
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Service Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.nextServiceDueDate || ''}
                    onChange={(e) => setFormData({ ...formData, nextServiceDueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

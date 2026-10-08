import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  FileCheck,
  Filter,
  Search,
} from 'lucide-react';
import {
  DailyLogEntry,
  Vehicle,
  Driver,
  Officer,
  Tender,
  DutyType,
} from '../types';
import { formatDate, formatCurrency } from '../utils/calculations';

interface LogBookViewProps {
  dailyLogs: DailyLogEntry[];
  vehicles: Vehicle[];
  drivers: Driver[];
  officers: Officer[];
  tenders: Tender[];
  onAddLog: (entry: DailyLogEntry) => void;
  onToggleVerified: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const LogBookView: React.FC<LogBookViewProps> = ({
  dailyLogs,
  vehicles,
  drivers,
  officers,
  tenders,
  onAddLog,
  onToggleVerified,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [dutyTypeFilter, setDutyTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [logPage, setLogPage] = useState<number>(1);
  const logsPerPage = 20;

  // New Log Form State
  const [formData, setFormData] = useState<Partial<DailyLogEntry>>({
    date: new Date().toISOString().slice(0, 10),
    vehicleId: vehicles[0]?.id || '',
    openingKm: 42350,
    closingKm: 42460,
    openingTime: '08:30',
    closingTime: '19:30',
    startLocation: 'Officer Residence, Gomti Nagar',
    endLocation: 'Head Office & Field Sites',
    purpose: 'Routine office commute and site inspection',
    dutyType: 'local',
    tollParkingCost: 0,
    driverDaNightHalt: 0,
    acUsed: true,
    slipNumber: `DS-${Date.now().toString().slice(-4)}`,
    isVerifiedByOfficer: true,
    officerRemarks: 'Duty verified',
  });

  const handleVehicleChangeInModal = (vId: string) => {
    const veh = vehicles.find((v) => v.id === vId);
    if (!veh) return;

    // Find latest log for this vehicle to auto-populate opening KM
    const vehicleLogs = dailyLogs
      .filter((l) => l.vehicleId === vId)
      .sort((a, b) => b.closingKm - a.closingKm);
    const lastClosing = vehicleLogs[0]?.closingKm || veh.currentOdometer;

    setFormData({
      ...formData,
      vehicleId: vId,
      openingKm: lastClosing,
      closingKm: lastClosing + 80,
    });
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.date) {
      alert('Vehicle and Date are required');
      return;
    }

    const veh = vehicles.find((v) => v.id === formData.vehicleId);
    const drv = drivers.find((d) => d.id === veh?.currentDriverId);
    const off = officers.find((o) => o.id === veh?.assignedOfficerId);
    const tender = tenders.find((t) => t.id === veh?.tenderId);

    const openKm = Number(formData.openingKm) || 0;
    const closeKm = Number(formData.closingKm) || openKm;
    const totalKm = Math.max(0, closeKm - openKm);

    // Calculate hours from HH:mm
    let totalHours = 10;
    if (formData.openingTime && formData.closingTime) {
      const [h1, m1] = formData.openingTime.split(':').map(Number);
      const [h2, m2] = formData.closingTime.split(':').map(Number);
      const mins1 = h1 * 60 + m1;
      const mins2 = h2 * 60 + m2;
      const diffMins = mins2 >= mins1 ? mins2 - mins1 : 1440 - mins1 + mins2;
      totalHours = Math.round((diffMins / 60) * 10) / 10;
    }

    const entry: DailyLogEntry = {
      id: `log-${Date.now()}`,
      date: formData.date || new Date().toISOString().slice(0, 10),
      vehicleId: formData.vehicleId,
      vehicleNumber: veh?.vehicleNumber || '',
      driverId: drv?.id || 'drv-unassigned',
      driverName: drv?.name || 'Unassigned',
      officerId: off?.id || 'off-unassigned',
      officerName: off?.name || 'Officer',
      tenderId: tender?.id || '',
      openingKm: openKm,
      closingKm: closeKm,
      totalKm,
      openingTime: formData.openingTime || '09:00',
      closingTime: formData.closingTime || '19:00',
      totalHours,
      startLocation: formData.startLocation || 'Office',
      endLocation: formData.endLocation || 'Headquarters',
      purpose: formData.purpose || 'Official Duty',
      dutyType: (formData.dutyType as DutyType) || 'local',
      tollParkingCost: Number(formData.tollParkingCost) || 0,
      driverDaNightHalt: Number(formData.driverDaNightHalt) || 0,
      acUsed: formData.acUsed !== undefined ? formData.acUsed : true,
      slipNumber: formData.slipNumber || `DS-${Date.now().toString().slice(-4)}`,
      isVerifiedByOfficer: formData.isVerifiedByOfficer || true,
      officerRemarks: formData.officerRemarks || '',
    };

    onAddLog(entry);
    setIsAddModalOpen(false);
  };

  const filteredLogs = useMemo(() => {
    return dailyLogs
      .filter((log) => {
        const matchesMonth = log.date.startsWith(selectedMonth);
        const matchesVeh = selectedVehicleId === 'all' || log.vehicleId === selectedVehicleId;
        const matchesType = dutyTypeFilter === 'all' || log.dutyType === dutyTypeFilter;
        const matchesSearch =
          !searchQuery ||
          log.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.officerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.slipNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.purpose.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesMonth && matchesVeh && matchesType && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dailyLogs, selectedMonth, selectedVehicleId, dutyTypeFilter, searchQuery]);

  // Aggregate stats for current filter
  const totalKmRun = filteredLogs.reduce((sum, l) => sum + (Number(l.totalKm) || 0), 0);
  const totalHoursRun = filteredLogs.reduce((sum, l) => sum + (Number(l.totalHours) || 0), 0);
  const totalToll = filteredLogs.reduce((sum, l) => sum + (Number(l.tollParkingCost) || 0), 0);
  const nightHalts = filteredLogs.filter((l) => l.dutyType === 'night_halt' || l.driverDaNightHalt > 0).length;

  const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (logPage - 1) * logsPerPage,
    logPage * logsPerPage
  );

  const currentTender =
    selectedVehicleId !== 'all'
      ? tenders.find((t) => t.id === vehicles.find((v) => v.id === selectedVehicleId)?.tenderId)
      : null;

  return (
    <div className="space-y-6">
      {/* Top Controls Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Daily Log Book &amp; Duty Slips &bull; दैनिक लॉग बुक व ड्यूटी स्लिप</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            गाड़ी का प्रारंभिक व अंतिम किलोमीटर, अधिकारी द्वारा प्रमाणित ड्यूटी स्लिप, टोल व रात्रि विश्राम
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Printer className="w-4 h-4" />
            Print Log Sheet (प्रिंट निकालें)
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            + New Duty Entry (नई एंट्री)
          </button>
        </div>
      </div>

      {/* Month & Vehicle Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-medium text-slate-600 mb-1">Select Month (माह):</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-600 mb-1">Vehicle (गाड़ी):</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Vehicles (सभी गाड़ियाँ)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} - {v.makeModel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-600 mb-1">Duty Type:</label>
            <select
              value={dutyTypeFilter}
              onChange={(e) => setDutyTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Duties (सभी)</option>
              <option value="local">Local Office Duty</option>
              <option value="outstation">Outstation / Inter-district</option>
              <option value="inspection">Site Inspection (साइट मुआयना)</option>
              <option value="night_halt">Night Halt (रात्रि प्रवास)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-600 mb-1">Search Slip / Purpose:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search slip, driver, officer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Selected Month Summary Badges */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-slate-100 px-3 py-1 rounded-md text-slate-700 font-medium">
              Total Days Logged: <strong className="text-slate-900">{filteredLogs.length} days</strong>
            </span>

            <span className="bg-indigo-50 px-3 py-1 rounded-md text-indigo-800 font-medium border border-indigo-100">
              Total KMs Run: <strong className="text-indigo-950">{totalKmRun} KM</strong>
              {currentTender && (
                <span className="text-slate-500 font-normal ml-1">
                  (Quota: {currentTender.includedKms} KM)
                </span>
              )}
            </span>

            <span className="bg-emerald-50 px-3 py-1 rounded-md text-emerald-800 font-medium border border-emerald-100">
              Total Duty Hours: <strong className="text-emerald-950">{Math.round(totalHoursRun * 10) / 10} Hrs</strong>
            </span>

            <span className="bg-amber-50 px-3 py-1 rounded-md text-amber-800 font-medium border border-amber-100">
              Toll &amp; Parking: <strong>{formatCurrency(totalToll)}</strong>
            </span>

            {nightHalts > 0 && (
              <span className="bg-purple-50 px-3 py-1 rounded-md text-purple-800 font-medium border border-purple-100">
                Night Halts: <strong>{nightHalts} Nights</strong>
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 italic">
            Click on &lsquo;Verified&rsquo; badge to toggle officer signature verification
          </div>
        </div>
      </div>

      {/* Log Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Date &amp; Slip No.</th>
                <th className="py-3 px-3">Vehicle &amp; Driver</th>
                <th className="py-3 px-3">Officer &amp; Route / Purpose</th>
                <th className="py-3 px-3">Odometer (Opening &rarr; Closing)</th>
                <th className="py-3 px-3 text-center">Total KM</th>
                <th className="py-3 px-3">Duty Time &amp; Hours</th>
                <th className="py-3 px-3">Toll / DA</th>
                <th className="py-3 px-3 text-center">Officer Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No log entries found for this vehicle and month. Click &quot;+ New Duty Entry&quot; to add one.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{formatDate(log.date)}</div>
                      <div className="text-[10px] font-mono text-indigo-700 font-medium">
                        {log.slipNumber}
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                        {log.dutyType}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 font-mono">{log.vehicleNumber}</div>
                      <div className="text-[11px] text-slate-600">{log.driverName}</div>
                      {log.acUsed && (
                        <span className="text-[9px] text-emerald-700 font-medium">AC On</span>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-semibold text-slate-900">{log.officerName}</div>
                      <div className="text-[11px] text-slate-600 truncate" title={log.purpose}>
                        {log.purpose}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        Route: {log.startLocation} &rarr; {log.endLocation}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div>Open: {log.openingKm} KM</div>
                      <div>Close: {log.closingKm} KM</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {log.totalKm} KM
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div>{log.openingTime} - {log.closingTime}</div>
                      <span className="text-indigo-700 font-semibold">{log.totalHours} Hrs</span>
                    </td>

                    <td className="py-3 px-3 text-xs">
                      {log.tollParkingCost > 0 ? (
                        <div className="font-semibold text-slate-900">
                          Toll: {formatCurrency(log.tollParkingCost)}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                      {log.driverDaNightHalt > 0 && (
                        <div className="text-[10px] text-purple-700 font-semibold">
                          DA: ₹{log.driverDaNightHalt}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onToggleVerified(log.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          log.isVerifiedByOfficer
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Click to toggle officer signature verification"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{log.isVerifiedByOfficer ? 'Signed' : 'Pending'}</span>
                      </button>
                      {log.officerRemarks && (
                        <div className="text-[9px] text-slate-500 mt-1 max-w-[120px] mx-auto truncate" title={log.officerRemarks}>
                          {log.officerRemarks}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Navigation Bar */}
        {totalLogPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Showing <strong>{(logPage - 1) * logsPerPage + 1}</strong> to{' '}
              <strong>{Math.min(logPage * logsPerPage, filteredLogs.length)}</strong> of{' '}
              <strong>{filteredLogs.length}</strong> entries (Page {logPage} of {totalLogPages})
            </span>

            <div className="flex items-center space-x-1.5">
              <button
                disabled={logPage === 1}
                onClick={() => setLogPage(1)}
                className="px-2.5 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 font-medium"
              >
                &laquo; First
              </button>
              <button
                disabled={logPage === 1}
                onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 font-medium"
              >
                &lsaquo; Prev
              </button>
              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-100">
                {logPage} / {totalLogPages}
              </span>
              <button
                disabled={logPage === totalLogPages}
                onClick={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 font-medium"
              >
                Next &rsaquo;
              </button>
              <button
                disabled={logPage === totalLogPages}
                onClick={() => setLogPage(totalLogPages)}
                className="px-2.5 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 font-medium"
              >
                Last &raquo;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add New Duty Log Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <span>Add Daily Duty Slip (दैनिक ड्यूटी स्लिप दर्ज करें)</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Vehicle *
                  </label>
                  <select
                    required
                    value={formData.vehicleId || ''}
                    onChange={(e) => handleVehicleChangeInModal(e.target.value)}
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
                    Duty Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Duty Slip / Book Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slipNumber || ''}
                    onChange={(e) => setFormData({ ...formData, slipNumber: e.target.value })}
                    placeholder="e.g. DS-2026-09-018"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Odometer and Times */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Opening KM (शुरुआती) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.openingKm || ''}
                    onChange={(e) => setFormData({ ...formData, openingKm: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Closing KM (अंतिम) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.closingKm || ''}
                    onChange={(e) => setFormData({ ...formData, closingKm: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Opening Time (24h)
                  </label>
                  <input
                    type="time"
                    value={formData.openingTime || '09:00'}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Closing Time (24h)
                  </label>
                  <input
                    type="time"
                    value={formData.closingTime || '19:00'}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Run Calculation Preview */}
              <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span>
                  Total Run:{' '}
                  <strong>
                    {Math.max(0, (Number(formData.closingKm) || 0) - (Number(formData.openingKm) || 0))} KM
                  </strong>
                </span>
                <span>Air Conditioner (AC): {formData.acUsed ? 'Active' : 'Off'}</span>
              </div>

              {/* Locations and Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Start Location (प्रारंभ स्थान)
                  </label>
                  <input
                    type="text"
                    value={formData.startLocation || ''}
                    onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                    placeholder="e.g. Officer Residence Gomti Nagar"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    End Location / Destination (गंतव्य)
                  </label>
                  <input
                    type="text"
                    value={formData.endLocation || ''}
                    onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                    placeholder="e.g. Camp Office / Field Site"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Purpose of Journey / Official Duty (यात्रा का उद्देश्य) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.purpose || ''}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g. Site inspection of highway bridge, court attendance, departmental meeting"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Duty Type & Extra Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Duty Nature
                  </label>
                  <select
                    value={formData.dutyType || 'local'}
                    onChange={(e) => setFormData({ ...formData, dutyType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="local">Local Office Commute (स्थानीय)</option>
                    <option value="outstation">Outstation (जनपद से बाहर)</option>
                    <option value="inspection">Field / Site Inspection</option>
                    <option value="night_halt">Night Halt (रात्रि विश्राम)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Toll &amp; Parking Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.tollParkingCost || 0}
                    onChange={(e) => setFormData({ ...formData, tollParkingCost: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Night Halt DA (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.driverDaNightHalt || 0}
                    onChange={(e) => setFormData({ ...formData, driverDaNightHalt: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Officer Verification Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center space-x-2 pt-4">
                  <input
                    type="checkbox"
                    id="isVerified"
                    checked={formData.isVerifiedByOfficer || false}
                    onChange={(e) => setFormData({ ...formData, isVerifiedByOfficer: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="isVerified" className="text-xs font-semibold text-slate-800">
                    Duty Slip Signed / Verified by Officer
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Officer Remarks (अधिकारी की टिप्पणी)
                  </label>
                  <input
                    type="text"
                    value={formData.officerRemarks || ''}
                    onChange={(e) => setFormData({ ...formData, officerRemarks: e.target.value })}
                    placeholder="Satisfactory duty / Certified"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Duty Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

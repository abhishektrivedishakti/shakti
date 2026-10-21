import React, { useState, useMemo } from 'react';
import {
  Scale,
  ShieldCheck,
  Printer,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Car,
  FileText,
  CreditCard,
  Users,
  AlertTriangle,
  Award,
  BadgePercent,
  ExternalLink,
  X,
  Stamp,
  MapPin,
} from 'lucide-react';
import {
  StatutoryPayrollEntry,
  Driver,
  Vehicle,
  Tender,
} from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';

interface StatutoryLabourComplianceViewProps {
  statutoryPayroll: StatutoryPayrollEntry[];
  drivers: Driver[];
  vehicles: Vehicle[];
  tenders: Tender[];
  onSavePayrollEntry: (entry: StatutoryPayrollEntry) => void;
  onEnrollDriver: (driverId: string, uan: string, esicIp: string, basic: number, vda: number, hra: number) => void;
}

export const StatutoryLabourComplianceView: React.FC<StatutoryLabourComplianceViewProps> = ({
  statutoryPayroll,
  drivers,
  vehicles,
  tenders,
  onSavePayrollEntry,
  onEnrollDriver,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tenderFilter, setTenderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Modals state
  const [selectedEntryForSlip, setSelectedEntryForSlip] = useState<StatutoryPayrollEntry | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [selectedTenderForCertificate, setSelectedTenderForCertificate] = useState<string>(tenders[0]?.id || '');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Enroll Form State
  const nonStatutoryDrivers = drivers.filter(
    (d) => d.employmentType !== 'company_statutory' && d.status === 'active'
  );
  const [enrollDriverId, setEnrollDriverId] = useState<string>(nonStatutoryDrivers[0]?.id || '');
  const [enrollUan, setEnrollUan] = useState<string>('101928' + String(Math.floor(100000 + Math.random() * 900000)));
  const [enrollEsicIp, setEnrollEsicIp] = useState<string>('219800' + String(Math.floor(10000 + Math.random() * 90000)));
  const [enrollBasic, setEnrollBasic] = useState<number>(15600);
  const [enrollVda, setEnrollVda] = useState<number>(1820);
  const [enrollHra, setEnrollHra] = useState<number>(1500);

  // Filtered entries for selected month
  const filteredEntries = useMemo(() => {
    return statutoryPayroll.filter((entry) => {
      const matchesMonth = !selectedMonth || entry.monthYear === selectedMonth;
      const matchesTender = tenderFilter === 'all' || entry.tenderId === tenderFilter;
      const matchesStatus = statusFilter === 'all' || entry.paymentStatus === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        entry.driverName.toLowerCase().includes(q) ||
        entry.uanNumber.includes(q) ||
        entry.esicIpNumber.includes(q) ||
        entry.vehicleNumber.toLowerCase().includes(q) ||
        entry.tenderName.toLowerCase().includes(q);

      return matchesMonth && matchesTender && matchesStatus && matchesQuery;
    });
  }, [statutoryPayroll, selectedMonth, tenderFilter, statusFilter, searchQuery]);

  // Aggregate Metrics for this month
  const metrics = useMemo(() => {
    const totalDrivers = filteredEntries.length;
    const totalGrossWages = filteredEntries.reduce((sum, e) => sum + e.grossEarned, 0);
    const totalEpfEmployee = filteredEntries.reduce((sum, e) => sum + e.epfEmployee12, 0);
    const totalEpfEmployer = filteredEntries.reduce((sum, e) => sum + e.epfEmployer13, 0);
    const totalEpfChallan = totalEpfEmployee + totalEpfEmployer;

    const totalEsicEmployee = filteredEntries.reduce((sum, e) => sum + e.esicEmployee075, 0);
    const totalEsicEmployer = filteredEntries.reduce((sum, e) => sum + e.esicEmployer325, 0);
    const totalEsicChallan = totalEsicEmployee + totalEsicEmployer;

    const totalNetTakeHome = filteredEntries.reduce((sum, e) => sum + e.netInHandSalary, 0);
    const totalBonus = filteredEntries.reduce((sum, e) => sum + e.statutoryBonus833, 0);
    const totalCtc = filteredEntries.reduce((sum, e) => sum + e.totalCtcOutflow, 0);

    return {
      totalDrivers,
      totalGrossWages,
      totalEpfChallan,
      totalEsicChallan,
      totalNetTakeHome,
      totalBonus,
      totalCtc,
    };
  }, [filteredEntries]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / pageSize) || 1;
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Export ECR File (EPFO format)
  const handleExportEpfEcr = () => {
    const headers = 'UAN#Member Name#Gross Wages#EPF Wages#EPS Wages#EDLI Wages#EE Share (12%)#EPS Share (8.33%)#ER Share (3.67%)#NCP Days\n';
    const rows = filteredEntries.map((e) => {
      const epfWage = Math.min(15000, e.basicWage + e.vdaWage);
      const epsShare = Math.round(epfWage * 0.0833);
      const erShare = Math.round(epfWage * 0.0367);
      return `${e.uanNumber}#${e.driverName.toUpperCase()}#${e.grossEarned}#${epfWage}#${epfWage}#${epfWage}#${e.epfEmployee12}#${epsShare}#${erShare}#0`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EPFO_ECR_PAYROLL_${selectedMonth}.csv`;
    a.click();
  };

  // Export ESIC Return Sheet
  const handleExportEsic = () => {
    const headers = 'IP Number,IP Name,No. of Days for which wages paid,Total Monthly Wages,Reason Code for Zero Working Days,Last Working Day\n';
    const rows = filteredEntries.map((e) => {
      return `"${e.esicIpNumber}","${e.driverName}",${e.payableDays},${e.grossEarned},0,`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ESIC_MONTHLY_RETURN_${selectedMonth}.csv`;
    a.click();
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollDriverId) {
      alert('Please select a driver to enroll.');
      return;
    }
    onEnrollDriver(enrollDriverId, enrollUan, enrollEsicIp, enrollBasic, enrollVda, enrollHra);
    setIsEnrollModalOpen(false);
  };

  const selectedCertTender = tenders.find((t) => t.id === selectedTenderForCertificate) || tenders[0];
  const certDrivers = filteredEntries.filter((e) => e.tenderId === selectedCertTender?.id);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="panel panel-pad flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-800" />
            <h2 className="text-lg font-bold text-slate-900">
              Govt Labour Law, Minimum Wages &amp; EPF/ESIC Payroll
            </h2>
            <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-semibold border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100+ Enrolled Commercial Drivers
            </span>
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Mandatory statutory payroll register for GeM, PWD, NHAI &amp; PSU cab hiring tenders. Manages Central/State Sphere Skilled Commercial Drivers, EPFO ECR, and ESIC returns.
          </p>
        </div>

        <div className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setIsCertificateModalOpen(true)}
            className="btn btn-primary shrink-0 !text-xs whitespace-nowrap"
            title="Generate Certificate of EPF & ESIC Deposit for GeM / PWD billing"
          >
            <FileText className="h-4 w-4" />
            GeM Compliance Certificate
          </button>

          <button
            type="button"
            onClick={handleExportEpfEcr}
            className="btn btn-secondary shrink-0 !text-xs whitespace-nowrap"
            title="Download CSV formatted for EPFO ECR direct upload"
          >
            <Download className="h-4 w-4" />
            EPFO ECR Sheet
          </button>

          <button
            type="button"
            onClick={handleExportEsic}
            className="btn btn-success shrink-0 !text-xs whitespace-nowrap"
            title="Download CSV for ESIC portal upload"
          >
            <Download className="h-4 w-4" />
            ESIC Return
          </button>

          <button
            type="button"
            onClick={() => setIsEnrollModalOpen(true)}
            className="btn btn-accent shrink-0 !text-xs whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Enroll Driver to EPF/ESI
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-muted)] text-[10px] font-bold uppercase tracking-wider block">
              Compliant Drivers
            </span>
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.totalDrivers} Drivers
            </span>
            <span className="text-xs text-teal-700 font-semibold">100% Skilled</span>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mt-1">
            Enrolled with 12-digit UAN &amp; ESIC IP
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-muted)] text-[10px] font-bold uppercase tracking-wider block">
              Monthly Wage Bill
            </span>
            <CreditCard className="w-4 h-4 text-sky-700" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--color-ink)] font-mono">
              {formatCurrency(metrics.totalGrossWages)}
            </span>
            <span className="text-xs text-[var(--color-muted)]">Gross Wages</span>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mt-1">
            ₹15,600 Basic + ₹1,820 VDA + HRA
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-muted)] text-[10px] font-bold uppercase tracking-wider block">
              EPF Challan (12% + 13%)
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-900 font-mono">
              {formatCurrency(metrics.totalEpfChallan)}
            </span>
            <span className="text-xs text-blue-600 font-semibold">TRRN Deposited</span>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mt-1">
            Employee ₹1,800 + Employer ₹1,950
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-muted)] text-[10px] font-bold uppercase tracking-wider block">
              ESIC Challan (0.75% + 3.25%)
            </span>
            <BadgePercent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-900 font-mono">
              {formatCurrency(metrics.totalEsicChallan)}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">4% Total</span>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mt-1">
            Net In-Hand Disbursed: {formatCurrency(metrics.totalNetTakeHome)}
          </p>
        </div>
      </div>

      {/* Statutory Formula Explanation Banner */}
      <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-4 text-xs text-[var(--color-ink)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Scale className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-[var(--color-ink)]">
              Statutory Wage &amp; Deduction Formulas Applied (Govt GeM / Labour Law Mandatory Standards):
            </span>
            <span className="text-[11px] text-teal-800 leading-relaxed block mt-0.5">
              &bull; <strong>Minimum Wage:</strong> Skilled Driver Basic ₹15,600 + VDA ₹1,820 + HRA ₹1,500 = Gross ₹18,920/month &bull; 
              <strong> EPF Employee (12%):</strong> ₹1,800 (capped at ₹15,000 statutory limit) &bull; 
              <strong> ESIC Employee (0.75%):</strong> ₹142 &bull; 
              <strong> Employer EPF (13%):</strong> ₹1,950 (8.33% EPS Pension + 3.67% EPF + 1% EDLI/Admin) &bull; 
              <strong> Employer ESIC (3.25%):</strong> ₹615 &bull; 
              <strong> Statutory Bonus:</strong> 8.33% (₹1,300).
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="bg-white px-2.5 py-1 rounded-md text-[11px] font-mono font-bold text-[var(--color-ink)] border border-teal-200">
            TRRN: 1012608001928
          </span>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Audit Ready
          </span>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Search by Driver Name, UAN, ESIC IP, or Car Number:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search driver, UAN, vehicle..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-muted)] absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Compliance Month:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
            >
              <option value="2026-08">August 2026 (Deposited)</option>
              <option value="2026-09">September 2026 (In Progress)</option>
              <option value="2026-07">July 2026 (Audited)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Govt Tender / Department:
            </label>
            <select
              value={tenderFilter}
              onChange={(e) => {
                setTenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
            >
              <option value="all">All Govt Tenders ({tenders.length})</option>
              {tenders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.departmentName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              EPF/ESIC Deposit Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
            >
              <option value="all">All Statuses ({filteredEntries.length})</option>
              <option value="deposited">Challan Deposited &amp; TRRN Generated</option>
              <option value="processed">Processed / Bank UTR Ready</option>
              <option value="draft">Draft Calculation</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-[var(--color-muted)]">
          <span>
            Displaying <strong>{filteredEntries.length}</strong> drivers enrolled under statutory labour law for <strong>{selectedMonth}</strong>
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium flex items-center gap-1 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Monthly Wage Register
            </button>
          </div>
        </div>
      </div>

      {/* Main Statutory Payroll Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Driver &amp; UAN / ESI</th>
                <th className="py-3 px-3">Tender &amp; Vehicle</th>
                <th className="py-3 px-2 text-center">Days</th>
                <th className="py-3 px-3 text-right">Basic + VDA</th>
                <th className="py-3 px-3 text-right">Gross Wages</th>
                <th className="py-3 px-3 text-right text-blue-700">EPF 12% (EE)</th>
                <th className="py-3 px-3 text-right text-emerald-700">ESI 0.75%</th>
                <th className="py-3 px-3 text-right font-bold">Net Take-Home</th>
                <th className="py-3 px-3 text-right text-slate-600">Employer EPF+ESI</th>
                <th className="py-3 px-3 text-center">Status &amp; Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedEntries.map((entry) => {
                const employerTotal = entry.epfEmployer13 + entry.esicEmployer325;

                return (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{entry.driverName}</div>
                      <div className="text-[10px] text-[var(--color-muted)] font-mono">
                        UAN: <strong className="text-slate-800">{entry.uanNumber}</strong>
                      </div>
                      <div className="text-[10px] text-[var(--color-muted)] font-mono">
                        ESI IP: <strong className="text-slate-800">{entry.esicIpNumber}</strong>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 truncate max-w-[170px]" title={entry.tenderName}>
                        {entry.tenderName}
                      </div>
                      <div className="font-mono text-[10px] text-teal-800 font-bold">
                        {entry.vehicleNumber}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono">
                      <span className="font-bold text-slate-900">{entry.payableDays}</span>
                      <div className="text-[10px] text-[var(--color-muted)]">
                        {entry.daysWorked}W + {entry.weeklyOffs}O
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono">
                      <div>{formatCurrency(entry.basicWage + entry.vdaWage)}</div>
                      <div className="text-[10px] text-[var(--color-muted)]">
                        ({formatCurrency(entry.basicWage)} + {formatCurrency(entry.vdaWage)})
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(entry.grossEarned)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-blue-700 font-semibold">
                      -{formatCurrency(entry.epfEmployee12)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                      -{formatCurrency(entry.esicEmployee075)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                      {formatCurrency(entry.netInHandSalary)}
                      {entry.advancesDeduction > 0 && (
                        <div className="text-[10px] text-rose-600 font-normal">
                          (Adv: -{formatCurrency(entry.advancesDeduction)})
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      <div>+{formatCurrency(employerTotal)}</div>
                      <div className="text-[10px] text-[var(--color-muted)]">
                        (PF: {formatCurrency(entry.epfEmployer13)} | ESI: {formatCurrency(entry.esicEmployer325)})
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-semibold uppercase">
                          {entry.paymentStatus}
                        </span>
                        <button
                          onClick={() => setSelectedEntryForSlip(entry)}
                          className="text-[11px] text-teal-700 hover:text-teal-800 font-semibold underline flex items-center gap-0.5"
                        >
                          <FileText className="w-3 h-3" />
                          Pay Slip
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredEntries.length} compliant drivers)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white border border-slate-300 rounded font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white border border-slate-300 rounded font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Statutory Pay Slip Modal */}
      {selectedEntryForSlip && (
        <div className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-[var(--color-surface)] text-[var(--color-ink)] p-4 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-500" />
                <h3 className="font-bold text-sm">
                  Statutory Salary Slip &bull; {selectedEntryForSlip.monthYear}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn btn-primary !px-3 !py-1 !text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Slip
                </button>
                <button
                  onClick={() => setSelectedEntryForSlip(null)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Slip Container */}
            <div className="p-6 space-y-4 text-xs text-slate-900 bg-white">
              <div className="text-center border-b-2 border-[var(--color-line)] pb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-muted)]">
                  PAYSLIP UNDER MINIMUM WAGES ACT &amp; PAYMENT OF WAGES RULES
                </span>
                <h2 className="text-lg font-black uppercase text-slate-900 mt-0.5">
                  SARKARI FLEET SERVICES
                </h2>
                <p className="text-[11px] text-slate-600">
                  Tender Transport Contractor &bull; 42, Transport Nagar, Lucknow, UP
                </p>
                <p className="text-[10px] text-[var(--color-muted)] font-mono">
                  EPFO Est Code: UP/LKO/0034812/000 &bull; ESIC Code: 21000889120001001
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 text-[11px]">
                <div>
                  <div><span className="text-[var(--color-muted)]">Employee Name: </span><strong>{selectedEntryForSlip.driverName}</strong></div>
                  <div><span className="text-[var(--color-muted)]">Designation: </span><strong>Commercial Driver (Skilled)</strong></div>
                  <div><span className="text-[var(--color-muted)]">EPF UAN: </span><strong className="font-mono">{selectedEntryForSlip.uanNumber}</strong></div>
                  <div><span className="text-[var(--color-muted)]">ESIC IP No: </span><strong className="font-mono">{selectedEntryForSlip.esicIpNumber}</strong></div>
                </div>

                <div className="text-right">
                  <div><span className="text-[var(--color-muted)]">Pay Period: </span><strong>{selectedEntryForSlip.monthYear}</strong></div>
                  <div><span className="text-[var(--color-muted)]">Assigned Vehicle: </span><strong className="font-mono">{selectedEntryForSlip.vehicleNumber}</strong></div>
                  <div><span className="text-[var(--color-muted)]">Govt Tender: </span><strong>{selectedEntryForSlip.tenderName}</strong></div>
                  <div><span className="text-[var(--color-muted)]">Payable Days: </span><strong>{selectedEntryForSlip.payableDays} Days</strong></div>
                </div>
              </div>

              {/* Earnings & Deductions Dual Column */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-300 rounded overflow-hidden">
                  <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
                    Earnings (₹)
                  </div>
                  <div className="p-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Basic Minimum Wage</span>
                      <strong className="font-mono">{formatCurrency(selectedEntryForSlip.basicWage)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Variable DA (VDA)</span>
                      <strong className="font-mono">{formatCurrency(selectedEntryForSlip.vdaWage)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>House Rent Allowance (HRA)</span>
                      <strong className="font-mono">{formatCurrency(selectedEntryForSlip.hraWage)}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 bg-slate-50 -mx-2 -mb-2 p-2">
                      <span>Gross Wages</span>
                      <span className="font-mono">{formatCurrency(selectedEntryForSlip.grossEarned)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 rounded overflow-hidden">
                  <div className="bg-slate-100 p-2 font-bold text-slate-800 border-b border-slate-300">
                    Deductions (₹)
                  </div>
                  <div className="p-2 space-y-1.5">
                    <div className="flex justify-between text-blue-700">
                      <span>EPF (12% of Wage)</span>
                      <strong className="font-mono">-{formatCurrency(selectedEntryForSlip.epfEmployee12)}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>ESIC (0.75% of Gross)</span>
                      <strong className="font-mono">-{formatCurrency(selectedEntryForSlip.esicEmployee075)}</strong>
                    </div>
                    {selectedEntryForSlip.advancesDeduction > 0 && (
                      <div className="flex justify-between text-rose-700">
                        <span>Salary Advance Recovered</span>
                        <strong className="font-mono">-{formatCurrency(selectedEntryForSlip.advancesDeduction)}</strong>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-rose-800 bg-slate-50 -mx-2 -mb-2 p-2">
                      <span>Total Deductions</span>
                      <span className="font-mono">-{formatCurrency(selectedEntryForSlip.totalEmployeeDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Box */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-emerald-950">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                    Net Take-Home Salary (Disbursed in Bank)
                  </span>
                  <span className="text-xl font-black font-mono">
                    {formatCurrency(selectedEntryForSlip.netInHandSalary)}
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    Transferred via {selectedEntryForSlip.bankUtr || 'NEFT/RTGS'} on {formatDate(selectedEntryForSlip.salaryPaidDate || '2026-09-07')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono block text-[var(--color-muted)]">
                    EPF TRRN: {selectedEntryForSlip.epfTrrnChallan}
                  </span>
                  <span className="text-[10px] font-mono block text-[var(--color-muted)]">
                    ESIC Challan: {selectedEntryForSlip.esicChallanNo}
                  </span>
                </div>
              </div>

              {/* Employer Contributions Note */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-600 flex justify-between">
                <span>Employer EPF Contribution (13%): <strong>{formatCurrency(selectedEntryForSlip.epfEmployer13)}</strong></span>
                <span>Employer ESIC Contribution (3.25%): <strong>{formatCurrency(selectedEntryForSlip.esicEmployer325)}</strong></span>
                <span>Statutory Bonus (8.33%): <strong>{formatCurrency(selectedEntryForSlip.statutoryBonus833)}</strong></span>
              </div>

              <div className="pt-8 flex justify-between text-[11px] text-[var(--color-muted)] border-t border-slate-200">
                <div>
                  <div className="h-6 w-32 border-b border-slate-400" />
                  <span className="block mt-1">Driver Signature</span>
                </div>
                <div className="text-right">
                  <div className="h-6 w-32 border-b border-slate-400 ml-auto" />
                  <span className="block mt-1">Authorized Contractor Seal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GeM / Govt Tender Labour Compliance Certificate */}
      {isCertificateModalOpen && selectedCertTender && (
        <div className="fixed inset-0 z-50 bg-[var(--color-ink)]/55 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl max-w-4xl w-full border border-[var(--color-line)] overflow-hidden my-4 sm:my-8 flex flex-col max-h-[94vh]">
            {/* Sticky toolbar */}
            <div className="sticky top-0 z-20 print:hidden border-b border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur-md">
              <div className="px-4 py-3 sm:px-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-800">
                      GeM &amp; Govt Tender
                    </p>
                    <h3 className="font-bold text-sm sm:text-base text-[var(--color-ink)] leading-snug">
                      Statutory Labour Law Compliance Certificate
                    </h3>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                  <label className="relative flex-1 lg:min-w-[260px]">
                    <span className="sr-only">Select tender</span>
                    <Building2 className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)]" />
                    <select
                      value={selectedTenderForCertificate}
                      onChange={(e) => setSelectedTenderForCertificate(e.target.value)}
                      className="w-full appearance-none pl-8 pr-8 py-2 text-xs font-semibold bg-[var(--color-sand-deep)] text-[var(--color-ink)] border border-[var(--color-line-strong)] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    >
                      {tenders.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.departmentName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Official Certificate
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCertificateModalOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-muted)] text-[var(--color-muted)] hover:bg-[var(--color-sand-deep)] hover:text-[var(--color-ink)] transition-colors self-end sm:self-auto"
                    aria-label="Close certificate"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable certificate sheet */}
            <div className="overflow-y-auto flex-1 bg-[linear-gradient(180deg,#f3f6f4_0%,#eef2f0_100%)] print:bg-white">
              <div className="p-3 sm:p-6 print:p-0">
                <article className="relative mx-auto max-w-3xl bg-white text-slate-900 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] border border-slate-200/90 print:shadow-none print:border-0">
                  {/* Decorative edge rails */}
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-teal-800 via-teal-600 to-amber-600 print:hidden" />
                  <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-amber-600 via-teal-600 to-teal-800 print:hidden" />

                  <div className="relative px-5 py-6 sm:px-9 sm:py-8 space-y-6 text-[12px] leading-relaxed">
                    {/* Letterhead */}
                    <header className="text-center space-y-3 pb-5 border-b border-slate-200">
                      <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-900">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Annexure · Statutory Labour &amp; Social Security
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-teal-800/80 text-teal-800 bg-[radial-gradient(circle_at_30%_30%,#ecfdf5,white)]">
                          <Stamp className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                          Sarkari Fleet Services
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-600 max-w-xl">
                          Govt Authorized Cab &amp; Fleet Service Provider · 42, Transport Nagar, Lucknow, Uttar Pradesh
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        {[
                          ['PAN', 'AAAFS1234F'],
                          ['GSTIN', '09AAAFS1234F1Z8'],
                          ['EPFO Est ID', 'UP/LKO/0034812/000'],
                        ].map(([label, value]) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[10px] text-slate-700"
                          >
                            <span className="font-sans font-semibold text-slate-500">{label}</span>
                            {value}
                          </span>
                        ))}
                      </div>
                    </header>

                    {/* Meta grid */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#f1f5f4_100%)] p-3.5 sm:p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          To Authority
                        </p>
                        <p className="text-sm font-bold text-slate-900 leading-snug">
                          {selectedCertTender.authorityOffice}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-600 flex items-start gap-1.5">
                          <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-teal-700" />
                          <span>{selectedCertTender.departmentName}</span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Document refs
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Compliant
                          </span>
                        </div>
                        <dl className="space-y-1.5 text-[11px]">
                          <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-slate-200 pb-1.5">
                            <dt className="text-slate-500">Tender / Bid No</dt>
                            <dd className="font-mono font-bold text-slate-900 text-right">
                              {selectedCertTender.tenderNumber}
                            </dd>
                          </div>
                          <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-slate-200 pb-1.5">
                            <dt className="text-slate-500">Work Order No</dt>
                            <dd className="font-mono font-bold text-slate-900 text-right">
                              {selectedCertTender.workOrderNumber}
                            </dd>
                          </div>
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-slate-500">Compliance Month</dt>
                            <dd className="font-bold text-teal-800 tabular-nums">{selectedMonth}</dd>
                          </div>
                        </dl>
                      </div>
                    </section>

                    {/* Declaration */}
                    <section className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="h-px flex-1 bg-slate-200" />
                        <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.08em] text-slate-900 text-center">
                          To Whomsoever It May Concern · Bill Submission Certificate
                        </h4>
                        <span className="h-px flex-1 bg-slate-200" />
                      </div>
                      <p className="text-justify text-slate-700 leading-relaxed text-[11px] sm:text-xs">
                        This is to certify that in compliance with the terms and conditions of GeM Tender / Contract{' '}
                        <strong className="text-slate-900">{selectedCertTender.workOrderNumber}</strong> for hiring of
                        commercial cab services, all commercial drivers deployed on government duty have been paid wages
                        not less than the statutory Minimum Wages fixed by the appropriate government.
                      </p>
                      <p className="text-justify text-slate-700 leading-relaxed text-[11px] sm:text-xs">
                        Further, it is certified that the statutory contributions under the{' '}
                        <strong className="text-slate-900">
                          Employees&apos; Provident Funds and Miscellaneous Provisions Act, 1952 (EPF)
                        </strong>{' '}
                        and{' '}
                        <strong className="text-slate-900">Employees&apos; State Insurance Act, 1948 (ESIC)</strong> have
                        been duly deposited with the designated authorities within the prescribed due dates as detailed
                        below:
                      </p>
                    </section>

                    {/* Deposit table */}
                    <section className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Deposit proof summary
                        </p>
                        <p className="text-[10px] font-semibold text-slate-500">
                          {certDrivers.length || 15} drivers covered
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] min-w-[560px]">
                          <thead>
                            <tr className="bg-teal-900 text-teal-50">
                              <th className="p-2.5 text-left font-semibold">Statutory Head</th>
                              <th className="p-2.5 text-left font-semibold">Challan / TRRN</th>
                              <th className="p-2.5 text-left font-semibold">Date of Deposit</th>
                              <th className="p-2.5 text-right font-semibold">Drivers</th>
                              <th className="p-2.5 text-right font-semibold">Total Deposited</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr className="bg-white hover:bg-slate-50/80">
                              <td className="p-2.5 font-semibold text-slate-800">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                  EPF &amp; EPS
                                </span>
                              </td>
                              <td className="p-2.5">
                                <span className="font-mono font-bold text-indigo-700 tracking-tight">
                                  TRRN 1012608001928
                                </span>
                              </td>
                              <td className="p-2.5 font-mono text-slate-600">07-09-2026</td>
                              <td className="p-2.5 text-right font-mono tabular-nums">
                                {certDrivers.length || 15}
                              </td>
                              <td className="p-2.5 text-right font-bold tabular-nums text-slate-900">
                                {formatCurrency((certDrivers.length || 15) * 3750)}
                              </td>
                            </tr>
                            <tr className="bg-slate-50/50 hover:bg-slate-50">
                              <td className="p-2.5 font-semibold text-slate-800">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                                  ESIC
                                </span>
                              </td>
                              <td className="p-2.5">
                                <span className="font-mono font-bold text-teal-700 tracking-tight">
                                  ESIC-CHAL-202608-4412
                                </span>
                              </td>
                              <td className="p-2.5 font-mono text-slate-600">08-09-2026</td>
                              <td className="p-2.5 text-right font-mono tabular-nums">
                                {certDrivers.length || 15}
                              </td>
                              <td className="p-2.5 text-right font-bold tabular-nums text-slate-900">
                                {formatCurrency((certDrivers.length || 15) * 757)}
                              </td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-100/90 border-t border-slate-200">
                              <td colSpan={4} className="p-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Combined statutory deposit
                              </td>
                              <td className="p-2.5 text-right font-black tabular-nums text-teal-900">
                                {formatCurrency((certDrivers.length || 15) * (3750 + 757))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </section>

                    {/* Signature block */}
                    <footer className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-200">
                      <div className="space-y-2 text-[11px] text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-700" />
                          <span>
                            <span className="text-slate-500">Date:</span>{' '}
                            <strong className="text-slate-800">
                              {formatDate(new Date().toISOString().slice(0, 10))}
                            </strong>
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-teal-700" />
                          <span>
                            <span className="text-slate-500">Place:</span>{' '}
                            <strong className="text-slate-800">Lucknow, Uttar Pradesh</strong>
                          </span>
                        </p>
                      </div>

                      <div className="text-right space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-900">
                          For Sarkari Fleet Services
                        </p>
                        <div className="ml-auto h-16 w-44 rounded-lg border border-dashed border-slate-300 bg-[radial-gradient(circle_at_70%_40%,rgba(13,148,136,0.06),transparent_55%)] flex items-end justify-center pb-2">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                            Signature &amp; stamp
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-500">Authorized Signatory</p>
                      </div>
                    </footer>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Enroll Driver to Statutory Payroll Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-[var(--color-surface)] text-[var(--color-ink)] border-b border-[var(--color-line)] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-sm">
                  Enroll Driver to Govt Labour Law &amp; EPF/ESI
                </h3>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Driver:
                </label>
                <select
                  value={enrollDriverId}
                  onChange={(e) => setEnrollDriverId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} &bull; {d.phone} ({d.employmentType || 'contractual'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    12-Digit EPF UAN Number:
                  </label>
                  <input
                    type="text"
                    value={enrollUan}
                    onChange={(e) => setEnrollUan(e.target.value)}
                    required
                    maxLength={12}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    10-Digit ESIC IP Number:
                  </label>
                  <input
                    type="text"
                    value={enrollEsicIp}
                    onChange={(e) => setEnrollEsicIp(e.target.value)}
                    required
                    maxLength={10}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Basic Wage (₹):
                  </label>
                  <input
                    type="number"
                    value={enrollBasic}
                    onChange={(e) => setEnrollBasic(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Variable DA (₹):
                  </label>
                  <input
                    type="number"
                    value={enrollVda}
                    onChange={(e) => setEnrollVda(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    HRA (₹):
                  </label>
                  <input
                    type="number"
                    value={enrollHra}
                    onChange={(e) => setEnrollHra(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-[var(--color-ink)] leading-snug">
                <span className="font-bold block">Automatic Calculation:</span>
                <span>
                  Gross: <strong>{formatCurrency(enrollBasic + enrollVda + enrollHra)}</strong> &bull; 
                  EPF (12%): <strong>{formatCurrency(Math.round(Math.min(15000, enrollBasic + enrollVda) * 0.12))}</strong> &bull; 
                  ESIC (0.75%): <strong>{formatCurrency(Math.round((enrollBasic + enrollVda + enrollHra) * 0.0075))}</strong>
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Enroll Driver &amp; Post to Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

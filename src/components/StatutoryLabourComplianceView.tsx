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
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Govt Labour Law, Minimum Wages &amp; EPF/ESIC Payroll
            </h2>
            <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-semibold border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100+ Enrolled Commercial Drivers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory statutory payroll register for GeM, PWD, NHAI &amp; PSU cab hiring tenders. Manages Central/State Sphere Skilled Commercial Drivers, EPFO ECR, and ESIC returns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCertificateModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Generate Certificate of EPF & ESIC Deposit for GeM / PWD billing"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            GeM Compliance Certificate
          </button>

          <button
            onClick={handleExportEpfEcr}
            className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Download CSV formatted for EPFO ECR direct upload"
          >
            <Download className="w-4 h-4" />
            EPFO ECR Sheet
          </button>

          <button
            onClick={handleExportEsic}
            className="px-3 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Download CSV for ESIC portal upload"
          >
            <Download className="w-4 h-4" />
            ESIC Return
          </button>

          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            + Enroll Driver to EPF/ESI
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
              Compliant Drivers
            </span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.totalDrivers} Drivers
            </span>
            <span className="text-xs text-indigo-600 font-semibold">100% Skilled</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Enrolled with 12-digit UAN &amp; ESIC IP
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
              Monthly Wage Bill
            </span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-900 font-mono">
              {formatCurrency(metrics.totalGrossWages)}
            </span>
            <span className="text-xs text-slate-400">Gross Wages</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            ₹15,600 Basic + ₹1,820 VDA + HRA
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
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
          <p className="text-[11px] text-slate-500 mt-1">
            Employee ₹1,800 + Employer ₹1,950
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
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
          <p className="text-[11px] text-slate-500 mt-1">
            Net In-Hand Disbursed: {formatCurrency(metrics.totalNetTakeHome)}
          </p>
        </div>
      </div>

      {/* Statutory Formula Explanation Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 text-xs text-indigo-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Scale className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-indigo-900">
              Statutory Wage &amp; Deduction Formulas Applied (Govt GeM / Labour Law Mandatory Standards):
            </span>
            <span className="text-[11px] text-indigo-800 leading-relaxed block mt-0.5">
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
          <span className="bg-white px-2.5 py-1 rounded-md text-[11px] font-mono font-bold text-indigo-900 border border-indigo-200">
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
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
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

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
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
                      <div className="text-[10px] text-slate-500 font-mono">
                        UAN: <strong className="text-slate-800">{entry.uanNumber}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ESI IP: <strong className="text-slate-800">{entry.esicIpNumber}</strong>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 truncate max-w-[170px]" title={entry.tenderName}>
                        {entry.tenderName}
                      </div>
                      <div className="font-mono text-[10px] text-indigo-700 font-bold">
                        {entry.vehicleNumber}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono">
                      <span className="font-bold text-slate-900">{entry.payableDays}</span>
                      <div className="text-[10px] text-slate-400">
                        {entry.daysWorked}W + {entry.weeklyOffs}O
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono">
                      <div>{formatCurrency(entry.basicWage + entry.vdaWage)}</div>
                      <div className="text-[10px] text-slate-400">
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
                      <div className="text-[10px] text-slate-400">
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
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-0.5"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  Statutory Salary Slip &bull; {selectedEntryForSlip.monthYear}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Slip
                </button>
                <button
                  onClick={() => setSelectedEntryForSlip(null)}
                  className="text-white/80 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Slip Container */}
            <div className="p-6 space-y-4 text-xs text-slate-900 bg-white">
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  PAYSLIP UNDER MINIMUM WAGES ACT &amp; PAYMENT OF WAGES RULES
                </span>
                <h2 className="text-lg font-black uppercase text-slate-900 mt-0.5">
                  SARKARI FLEET SERVICES
                </h2>
                <p className="text-[11px] text-slate-600">
                  Tender Transport Contractor &bull; 42, Transport Nagar, Lucknow, UP
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  EPFO Est Code: UP/LKO/0034812/000 &bull; ESIC Code: 21000889120001001
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 text-[11px]">
                <div>
                  <div><span className="text-slate-500">Employee Name: </span><strong>{selectedEntryForSlip.driverName}</strong></div>
                  <div><span className="text-slate-500">Designation: </span><strong>Commercial Driver (Skilled)</strong></div>
                  <div><span className="text-slate-500">EPF UAN: </span><strong className="font-mono">{selectedEntryForSlip.uanNumber}</strong></div>
                  <div><span className="text-slate-500">ESIC IP No: </span><strong className="font-mono">{selectedEntryForSlip.esicIpNumber}</strong></div>
                </div>

                <div className="text-right">
                  <div><span className="text-slate-500">Pay Period: </span><strong>{selectedEntryForSlip.monthYear}</strong></div>
                  <div><span className="text-slate-500">Assigned Vehicle: </span><strong className="font-mono">{selectedEntryForSlip.vehicleNumber}</strong></div>
                  <div><span className="text-slate-500">Govt Tender: </span><strong>{selectedEntryForSlip.tenderName}</strong></div>
                  <div><span className="text-slate-500">Payable Days: </span><strong>{selectedEntryForSlip.payableDays} Days</strong></div>
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
                  <span className="text-[10px] font-mono block text-slate-500">
                    EPF TRRN: {selectedEntryForSlip.epfTrrnChallan}
                  </span>
                  <span className="text-[10px] font-mono block text-slate-500">
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

              <div className="pt-8 flex justify-between text-[11px] text-slate-500 border-t border-slate-200">
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
      {isCertificateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  GeM &amp; Govt Tender Statutory Labour Law Compliance Certificate
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTenderForCertificate}
                  onChange={(e) => setSelectedTenderForCertificate(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-800 text-white border border-slate-700 rounded"
                >
                  {tenders.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.departmentName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Official Certificate
                </button>
                <button
                  onClick={() => setIsCertificateModalOpen(false)}
                  className="text-white/80 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Certificate Body */}
            <div className="p-8 space-y-6 text-slate-900 bg-white leading-relaxed text-xs">
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <span className="text-[11px] uppercase font-bold tracking-widest text-slate-500">
                  ANNEXURE - STATUTORY LABOUR &amp; SOCIAL SECURITY COMPLIANCE DECLARATION
                </span>
                <h2 className="text-xl font-black uppercase text-slate-900 mt-1">
                  SARKARI FLEET SERVICES
                </h2>
                <p className="text-xs text-slate-600">
                  Govt Authorized Cab &amp; Fleet Service Provider &bull; 42, Transport Nagar, Lucknow
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  PAN: AAAFS1234F &bull; GSTIN: 09AAAFS1234F1Z8 &bull; EPFO Est ID: UP/LKO/0034812/000
                </p>
              </div>

              <div className="border border-slate-300 p-4 rounded-lg bg-slate-50">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">To Authority:</span>
                    <strong className="text-sm">{selectedCertTender.authorityOffice}</strong>
                    <div className="text-slate-600 mt-0.5">{selectedCertTender.departmentName}</div>
                  </div>
                  <div className="text-right">
                    <div><span className="text-slate-500">Tender / Bid No: </span><strong className="font-mono">{selectedCertTender.tenderNumber}</strong></div>
                    <div><span className="text-slate-500">Work Order No: </span><strong className="font-mono">{selectedCertTender.workOrderNumber}</strong></div>
                    <div><span className="text-slate-500">Compliance Month: </span><strong>{selectedMonth}</strong></div>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-sm text-slate-900 mb-2">
                  TO WHOMSOEVER IT MAY CONCERN / BILL SUBMISSION CERTIFICATE
                </p>
                <p className="text-justify text-slate-700 leading-normal">
                  This is to certify that in compliance with the terms and conditions of GeM Tender / Contract <strong>{selectedCertTender.workOrderNumber}</strong> for hiring of commercial cab services, all commercial drivers deployed on government duty have been paid wages not less than the statutory Minimum Wages fixed by the appropriate government.
                </p>
                <p className="text-justify text-slate-700 leading-normal mt-2">
                  Further, it is certified that the statutory contributions under the <strong>Employees&apos; Provident Funds and Miscellaneous Provisions Act, 1952 (EPF)</strong> and <strong>Employees&apos; State Insurance Act, 1948 (ESIC)</strong> have been duly deposited with the designated authorities within the prescribed due dates as detailed below:
                </p>
              </div>

              {/* Deposit Proof Summary */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5 text-left">Statutory Head</th>
                      <th className="p-2.5 text-left">Challan / TRRN Reference</th>
                      <th className="p-2.5 text-left">Date of Deposit</th>
                      <th className="p-2.5 text-right">Drivers Covered</th>
                      <th className="p-2.5 text-right">Total Deposited (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="p-2.5 font-sans font-semibold">Employees&apos; Provident Fund (EPF &amp; EPS)</td>
                      <td className="p-2.5 font-bold text-blue-700">TRRN 1012608001928</td>
                      <td className="p-2.5">07-09-2026</td>
                      <td className="p-2.5 text-right">{certDrivers.length || 15}</td>
                      <td className="p-2.5 text-right font-bold">{formatCurrency((certDrivers.length || 15) * 3750)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans font-semibold">Employees&apos; State Insurance (ESIC)</td>
                      <td className="p-2.5 font-bold text-emerald-700">ESIC-CHAL-202608-4412</td>
                      <td className="p-2.5">08-09-2026</td>
                      <td className="p-2.5 text-right">{certDrivers.length || 15}</td>
                      <td className="p-2.5 text-right font-bold">{formatCurrency((certDrivers.length || 15) * 757)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-8 flex justify-between text-xs text-slate-600 border-t border-slate-200">
                <div>
                  <span className="block text-slate-500">Date: {formatDate(new Date().toISOString().slice(0, 10))}</span>
                  <span className="block text-slate-500">Place: Lucknow, Uttar Pradesh</span>
                </div>
                <div className="text-right">
                  <span className="font-bold block text-slate-900">For SARKARI FLEET SERVICES</span>
                  <div className="h-8" />
                  <span className="block text-slate-500 font-medium">Authorized Signatory &amp; Stamp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Enroll Driver to Statutory Payroll Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-indigo-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-sm">
                  Enroll Driver to Govt Labour Law &amp; EPF/ESI
                </h3>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
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

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 leading-snug">
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
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

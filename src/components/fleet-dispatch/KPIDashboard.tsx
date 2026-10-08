import React from 'react';
import { BookingRecord, DispatcherProfile } from '../../types';
import {
  TrendingUp,
  Car,
  Users,
  Receipt,
  IndianRupee,
  Activity,
  CheckCircle2,
  Clock,
  Fuel,
  ShieldCheck,
  Building2,
  PieChart,
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/dispatchFormatters';

interface KPIDashboardProps {
  bookings: BookingRecord[];
  dispatcher: DispatcherProfile;
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ bookings, dispatcher }) => {
  // Aggregate Metrics
  const totalBookings = bookings.length;
  const activeTrips = bookings.filter((b) => b.status === 'active_enroute' || b.status === 'dispatched').length;
  const completedTrips = bookings.filter((b) => b.status === 'completed' || b.status === 'settled' || b.status === 'billed').length;
  const scheduledTrips = bookings.filter((b) => b.status === 'scheduled').length;

  const totalGrossRevenue = bookings.reduce((sum, b) => sum + (b.tariff.grossClientAmount || 0), 0);
  const totalGstCollected = bookings.reduce((sum, b) => sum + (b.tariff.gstAmount || 0), 0);
  const totalNetBillable = bookings.reduce((sum, b) => sum + (b.tariff.netClientBillable || 0), 0);
  const totalDriverWages = bookings.reduce((sum, b) => sum + (b.tariff.netDriverPayable || 0), 0);
  const totalTollParking = bookings.reduce((sum, b) => sum + (b.tariff.tollParkingAmount || 0), 0);

  // Net Company Margin (Billing minus Driver Payout minus Tolls)
  const netOperatingMargin = totalNetBillable - totalDriverWages - totalTollParking;
  const profitMarginPercent = totalNetBillable > 0 ? ((netOperatingMargin / totalNetBillable) * 100).toFixed(1) : '0';

  // Client Wise Revenue Aggregation
  const clientRevenueMap: Record<string, { count: number; revenue: number }> = {};
  bookings.forEach((b) => {
    const clientName = b.client.name || 'General';
    if (!clientRevenueMap[clientName]) {
      clientRevenueMap[clientName] = { count: 0, revenue: 0 };
    }
    clientRevenueMap[clientName].count += 1;
    clientRevenueMap[clientName].revenue += b.tariff.netClientBillable || 0;
  });

  const sortedClients = Object.entries(clientRevenueMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  // Duty Package Distribution
  const packageDistributionMap: Record<string, number> = {};
  bookings.forEach((b) => {
    const pkg = b.tariff.packageName || 'General Package';
    packageDistributionMap[pkg] = (packageDistributionMap[pkg] || 0) + 1;
  });

  // Total KM run
  const totalKmRun = bookings.reduce((sum, b) => sum + (b.tariff.baseKm + (b.tariff.extraKmRun || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                फ्लीट रेवेन्यू व केपीआई एनालिटिक्स (Fleet Revenue & KPI Dashboard)
              </h1>
              <p className="text-xs text-slate-400">
                {dispatcher.companyName} | ड्यूटी वॉल्यूम, मार्जिन, चालक देयता व टैक्स विश्लेषण
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>लाइव डेटा सिंक: </span>
          <span className="font-semibold text-white">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Top 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Billing */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">कुल नेट बिलिंग</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-white">{formatCurrencyINR(totalNetBillable)}</div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-slate-300 font-medium">सकल: {formatCurrencyINR(totalGrossRevenue)}</span>
            <span>+ GST {formatCurrencyINR(totalGstCollected)}</span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Operating Margin */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">शुद्ध कंपनी मार्जिन</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-400">{formatCurrencyINR(netOperatingMargin)}</div>
          <div className="mt-2 text-xs text-emerald-300 font-semibold flex items-center gap-1">
            <span>प्रॉफ़िट मार्जिन: {profitMarginPercent}%</span>
            <span className="text-slate-400 font-normal">(चालक व टोल काटकर)</span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Driver Disbursements */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">चालक मजदूरी देय</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-300">{formatCurrencyINR(totalDriverWages)}</div>
          <div className="mt-2 text-xs text-slate-400">
            टोल/पार्किंग रीइंबर्समेंट: <span className="text-slate-300 font-medium">{formatCurrencyINR(totalTollParking)}</span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Total Distance & Trips */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">कुल ड्यूटी व रन</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-white">{totalBookings} <span className="text-sm font-normal text-slate-400">ड्यूटी</span></div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-indigo-300 font-semibold">{totalKmRun.toLocaleString()} KM रन</span>
            <span>• {completedTrips} पूर्ण</span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Two Column Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients by Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              शीर्ष सरकारी विभाग / क्लाइंट बिलिंग
            </h2>
            <span className="text-xs text-slate-400">रैंकिंग अनुसार</span>
          </div>

          <div className="space-y-3">
            {sortedClients.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">कोई क्लाइंट डेटा नहीं है।</p>
            ) : (
              sortedClients.map(([name, data], idx) => {
                const percentage = totalNetBillable > 0 ? (data.revenue / totalNetBillable) * 100 : 0;
                return (
                  <div key={name} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-200 truncate max-w-[220px]" title={name}>
                          {name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-cyan-300">{formatCurrencyINR(data.revenue)}</span>
                        <span className="text-xs text-slate-500 ml-2">({data.count} ड्यूटी)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Duty Package Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              ड्यूटी पैकेज व फेयर कैटेगरी
            </h2>
            <span className="text-xs text-slate-400">उपयोगिता शेयर</span>
          </div>

          <div className="space-y-3">
            {Object.entries(packageDistributionMap).map(([pkgName, count]) => {
              const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
              return (
                <div key={pkgName} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-300">{pkgName}</span>
                    <span className="font-bold text-emerald-400">
                      {count} ट्रिप <span className="text-xs text-slate-500 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fleet Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-center">
          <div className="text-xs text-blue-400 font-semibold flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            शेड्यूल (Scheduled)
          </div>
          <div className="text-2xl font-black text-white mt-1">{scheduledTrips}</div>
          <div className="text-[11px] text-slate-500">आगामी ड्यूटी</div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-center">
          <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            ऑन-ड्यूटी (Active)
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{activeTrips}</div>
          <div className="text-[11px] text-slate-500">गाड़ी रोड पर है</div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-center">
          <div className="text-xs text-purple-400 font-semibold flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            संपन्न (Completed)
          </div>
          <div className="text-2xl font-black text-purple-300 mt-1">{completedTrips}</div>
          <div className="text-[11px] text-slate-500">सफलतापूर्वक समाप्त</div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-center">
          <div className="text-xs text-cyan-400 font-semibold flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            जीएसटी ऑडिट रेडी
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-1">100%</div>
          <div className="text-[11px] text-slate-500">टैक्स इनवॉइस कम्पलायंट</div>
        </div>
      </div>
    </div>
  );
};

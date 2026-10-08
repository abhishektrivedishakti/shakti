import React, { useState } from 'react';
import {
  BookingRecord,
  DispatcherProfile,
  DutyStatus,
} from '../../types';
import {
  Search,
  Filter,
  Plus,
  MessageCircle,
  Calculator,
  Receipt,
  Users,
  Calendar,
  Clock,
  Car,
  MapPin,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Download,
  IndianRupee,
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/dispatchFormatters';
import { DutyTariffModal } from './DutyTariffModal';
import { ClientSettlementModal } from './ClientSettlementModal';
import { DriverSettlementModal } from './DriverSettlementModal';

interface MasterRegisterProps {
  bookings: BookingRecord[];
  dispatcher: DispatcherProfile;
  onUpdateBooking: (booking: BookingRecord) => void;
  onDeleteBooking: (id: string) => void;
  onOpenWhatsApp: (booking: BookingRecord) => void;
  onNewBookingClick?: () => void;
}

export const MasterRegister: React.FC<MasterRegisterProps> = ({
  bookings,
  dispatcher,
  onUpdateBooking,
  onDeleteBooking,
  onOpenWhatsApp,
  onNewBookingClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [selectedTariffBooking, setSelectedTariffBooking] = useState<BookingRecord | null>(null);
  const [selectedClientSettlementBooking, setSelectedClientSettlementBooking] = useState<BookingRecord | null>(null);
  const [selectedDriverSettlementBooking, setSelectedDriverSettlementBooking] = useState<BookingRecord | null>(null);

  // Status badges & text in Hindi / English
  const getStatusBadge = (status: DutyStatus) => {
    switch (status) {
      case 'active_enroute':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            रूट पर है (En-route)
          </span>
        );
      case 'dispatched':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            रवाना (Dispatched)
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            शेड्यूल (Scheduled)
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-purple-400" />
            संपन्न (Completed)
          </span>
        );
      case 'billed':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <Receipt className="w-3 h-3 text-cyan-400" />
            बिल जनरेटेड (Billed)
          </span>
        );
      case 'settled':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-700/60 text-slate-300 border border-slate-600 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-slate-400" />
            पूर्ण चुकता (Settled)
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            रद्द (Cancelled)
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.passenger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.dropLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesClient = clientFilter === 'all' || b.client.name === clientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  // Unique clients for filter dropdown
  const uniqueClients = Array.from(new Set(bookings.map((b) => b.client.name)));

  // KPI Calculations
  const totalBookingsCount = bookings.length;
  const activeEnrouteCount = bookings.filter((b) => b.status === 'active_enroute' || b.status === 'dispatched').length;
  const totalGrossRevenue = bookings.reduce((acc, b) => acc + (b.tariff.netClientBillable || 0), 0);
  const totalDriverPendingPay = bookings.reduce(
    (acc, b) => (b.driverPaymentStatus !== 'settled' ? acc + (b.tariff.netDriverPayable || 0) : acc),
    0
  );

  const handleQuickStatusChange = (booking: BookingRecord, newStatus: DutyStatus) => {
    const updated: BookingRecord = {
      ...booking,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateBooking(updated);
  };

  const handleExportCSV = () => {
    const headers = [
      'Booking No',
      'Date',
      'Status',
      'Client',
      'Booker',
      'Passenger',
      'Vehicle No',
      'Driver',
      'Pickup',
      'Drop',
      'Package',
      'Gross Amount',
      'Net Billable',
      'Driver Net Payable',
      'Client Payment Status',
      'Driver Settlement',
    ];

    const rows = filteredBookings.map((b) => [
      `"${b.bookingNumber}"`,
      `"${b.reportingDate} ${b.reportingTime}"`,
      `"${b.status}"`,
      `"${b.client.name}"`,
      `"${b.booker.name}"`,
      `"${b.passenger.name}"`,
      `"${b.vehicleNumber}"`,
      `"${b.driverName}"`,
      `"${b.pickupLocation}"`,
      `"${b.dropLocation}"`,
      `"${b.tariff.packageName}"`,
      b.tariff.grossClientAmount,
      b.tariff.netClientBillable,
      b.tariff.netDriverPayable,
      `"${b.clientPaymentStatus}"`,
      `"${b.driverPaymentStatus}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fleet_Duty_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast KPI Cards */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                मास्टर ड्यूटी रजिस्टर (Duty Master Register)
                <span className="text-xs px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full font-medium">
                  {filteredBookings.length} रिकॉर्ड
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                शासकीय व वीआईपी फ्लीट 3-पार्टी बुकिंग, लाइव ड्यूटी स्टेटस, व्हाट्सएप स्लिप व रसीदें
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {onNewBookingClick && (
            <button
              onClick={onNewBookingClick}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              नई ड्यूटी बुक करें (New Booking)
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium flex items-center gap-2 transition cursor-pointer"
            title="ड्यूटी रजिस्टर एक्सेल CSV डाउनलोड करें"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            CSV निर्यात
          </button>
        </div>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">कुल ड्यूटी रिकॉर्ड्स</div>
          <div className="text-2xl font-bold text-white mt-1">{totalBookingsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">मास्टर डेटाबेस में दर्ज</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            सक्रिय व ऑन-ड्यूटी
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{activeEnrouteCount} गाड़ियां</div>
          <div className="text-[11px] text-slate-500 mt-0.5">फील्ड या रास्ते में</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-cyan-400 font-medium">कुल सकल बिलिंग (Gross Billable)</div>
          <div className="text-2xl font-bold text-cyan-300 mt-1">{formatCurrencyINR(totalGrossRevenue)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">जीएसटी सहित नेट देय</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-amber-400 font-medium">चालक बकाया वेतन (Driver Payable)</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{formatCurrencyINR(totalDriverPendingPay)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">डीजल व एडवांस काटकर शेष</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="खोजें: गाड़ी, ड्राइवर, बुकिंग #, वीआईपी, विभाग..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>स्टेटस:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">सभी स्टेटस (All)</option>
              <option value="scheduled">शेड्यूल (Scheduled)</option>
              <option value="dispatched">रवाना (Dispatched)</option>
              <option value="active_enroute">ऑन-रूट (Active Enroute)</option>
              <option value="completed">संपन्न (Completed)</option>
              <option value="billed">बिल बन गया (Billed)</option>
              <option value="settled">पूर्ण चुकता (Settled)</option>
              <option value="cancelled">रद्द (Cancelled)</option>
            </select>
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>विभाग/पार्टी:</span>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[180px] truncate cursor-pointer"
            >
              <option value="all">सभी पार्टी (All Clients)</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">बुकिंग संदर्भ व दिनांक</th>
                <th className="px-4 py-3.5">क्लाइंट व बुक करने वाले</th>
                <th className="px-4 py-3.5">सवारी / VIP अधिकारी</th>
                <th className="px-4 py-3.5">आवंटित वाहन व चालक</th>
                <th className="px-4 py-3.5">रूट व स्थान</th>
                <th className="px-4 py-3.5">ड्यूटी पैकेज व राशि</th>
                <th className="px-4 py-3.5 text-center">स्टेटस</th>
                <th className="px-4 py-3.5 text-center">एक्शन / स्लिप्स</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <Car className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    कोई ड्यूटी रिकॉर्ड नहीं मिला। कृपया फ़िल्टर बदलें या नई ड्यूटी दर्ज करें।
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    {/* Booking No & Date */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-indigo-400 font-mono">{b.bookingNumber}</span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {b.reportingDate}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {b.reportingTime}
                      </div>
                    </td>

                    {/* Client & Booker */}
                    <td className="px-4 py-3.5 align-top max-w-[200px]">
                      <div className="font-medium text-slate-200 truncate" title={b.client.name}>
                        {b.client.name}
                      </div>
                      <div className="text-xs text-indigo-400 font-medium mt-0.5 truncate" title={b.booker.name}>
                        👤 {b.booker.name}
                      </div>
                      {b.booker.phone && (
                        <div className="text-[11px] text-slate-500 font-mono">{b.booker.phone}</div>
                      )}
                    </td>

                    {/* Passenger / VIP */}
                    <td className="px-4 py-3.5 align-top max-w-[190px]">
                      <div className="font-semibold text-white flex items-center gap-1.5 truncate">
                        {b.passenger.isVIP && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold">
                            VIP
                          </span>
                        )}
                        <span className="truncate" title={b.passenger.name}>
                          {b.passenger.name}
                        </span>
                      </div>
                      {b.passenger.designation && (
                        <div className="text-xs text-slate-400 truncate">{b.passenger.designation}</div>
                      )}
                      <div className="text-[11px] text-slate-500 font-mono">{b.passenger.phone}</div>
                    </td>

                    {/* Vehicle & Driver */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-mono font-bold text-amber-300 text-xs flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-amber-400" />
                        {b.vehicleNumber}
                      </div>
                      <div className="text-xs text-slate-400">{b.vehicleModel}</div>
                      <div className="text-xs text-slate-300 font-medium mt-1">👨‍✈️ {b.driverName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{b.driverPhone}</div>
                    </td>

                    {/* Route & Locations */}
                    <td className="px-4 py-3.5 align-top max-w-[200px]">
                      <div className="text-xs text-slate-300 flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="truncate" title={b.pickupLocation}>
                          {b.pickupLocation}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-start gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                        <span className="truncate" title={b.dropLocation}>
                          {b.dropLocation}
                        </span>
                      </div>
                      {b.garageOutKm && (
                        <div className="text-[11px] text-slate-500 font-mono mt-1">
                          गैरेज स्टार्ट: {b.garageOutKm} KM {b.garageInKm ? `➔ इन: ${b.garageInKm} KM` : ''}
                        </div>
                      )}
                    </td>

                    {/* Tariff & Amount */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="text-xs font-medium text-slate-200">{b.tariff.packageName}</div>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">
                        {formatCurrencyINR(b.tariff.netClientBillable)}
                      </div>
                      <div className="text-[11px] text-amber-400/90 font-medium">
                        ड्राइवर: {formatCurrencyINR(b.tariff.netDriverPayable)}
                      </div>
                    </td>

                    {/* Status with Quick Toggle */}
                    <td className="px-4 py-3.5 align-top text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {getStatusBadge(b.status)}
                        <select
                          value={b.status}
                          onChange={(e) => handleQuickStatusChange(b, e.target.value as DutyStatus)}
                          className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="scheduled">शेड्यूल</option>
                          <option value="dispatched">रवाना</option>
                          <option value="active_enroute">ऑन-रूट</option>
                          <option value="completed">संपन्न</option>
                          <option value="billed">बिल जनरेटेड</option>
                          <option value="settled">पूर्ण चुकता</option>
                          <option value="cancelled">रद्द</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions & Slips */}
                    <td className="px-4 py-3.5 align-top text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {/* WhatsApp Slip Studio Button */}
                        <button
                          onClick={() => onOpenWhatsApp(b)}
                          className="p-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 rounded-lg hover:bg-emerald-900/80 transition cursor-pointer"
                          title="व्हाट्सएप ड्यूटी स्लिप (Driver, Pax, Booker)"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Tariff & Extra Rates Modal Button */}
                        <button
                          onClick={() => setSelectedTariffBooking(b)}
                          className="p-1.5 bg-indigo-950/60 text-indigo-400 border border-indigo-800/80 rounded-lg hover:bg-indigo-900/80 transition cursor-pointer"
                          title="टैरिफ दर व अतिरिक्त KM/घंटे हिसाब"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>

                        {/* Client Settlement / GST Invoice Modal Button */}
                        <button
                          onClick={() => setSelectedClientSettlementBooking(b)}
                          className="p-1.5 bg-cyan-950/60 text-cyan-400 border border-cyan-800/80 rounded-lg hover:bg-cyan-900/80 transition cursor-pointer"
                          title="क्लाइंट टैक्स इनवॉइस व जीएसटी निपटान"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {/* Driver Settlement Modal Button */}
                        <button
                          onClick={() => setSelectedDriverSettlementBooking(b)}
                          className="p-1.5 bg-amber-950/60 text-amber-400 border border-amber-800/80 rounded-lg hover:bg-amber-900/80 transition cursor-pointer"
                          title="चालक मजदूरी पर्ची व भुगतान निपटान"
                        >
                          <Users className="w-4 h-4" />
                        </button>

                        {/* Delete Booking */}
                        <button
                          onClick={() => onDeleteBooking(b.id)}
                          className="p-1.5 bg-rose-950/60 text-rose-400 border border-rose-800/80 rounded-lg hover:bg-rose-900/80 transition cursor-pointer"
                          title="ड्यूटी रिकॉर्ड हटाएं"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Duty Tariff Modal */}
      {selectedTariffBooking && (
        <DutyTariffModal
          booking={selectedTariffBooking}
          onClose={() => setSelectedTariffBooking(null)}
          onUpdateTariff={(_bookingId, updatedTariff) => {
            const updatedBooking: BookingRecord = {
              ...selectedTariffBooking,
              tariff: updatedTariff,
              updatedAt: new Date().toISOString(),
            };
            onUpdateBooking(updatedBooking);
            setSelectedTariffBooking(null);
          }}
        />
      )}

      {/* Client Settlement / Tax Invoice Modal */}
      {selectedClientSettlementBooking && (
        <ClientSettlementModal
          booking={selectedClientSettlementBooking}
          dispatcher={dispatcher}
          onClose={() => setSelectedClientSettlementBooking(null)}
          onUpdateStatus={(_bookingId, status, invoiceNo) => {
            const updatedBooking: BookingRecord = {
              ...selectedClientSettlementBooking,
              clientPaymentStatus: status,
              clientInvoiceNumber: invoiceNo,
              updatedAt: new Date().toISOString(),
            };
            onUpdateBooking(updatedBooking);
            setSelectedClientSettlementBooking(null);
          }}
        />
      )}

      {/* Driver Settlement Modal */}
      {selectedDriverSettlementBooking && (
        <DriverSettlementModal
          booking={selectedDriverSettlementBooking}
          dispatcher={dispatcher}
          onClose={() => setSelectedDriverSettlementBooking(null)}
          onUpdateDriverPayment={(_bookingId, status, paidAmount) => {
            const updatedBooking: BookingRecord = {
              ...selectedDriverSettlementBooking,
              driverPaymentStatus: status,
              driverPaidAmount: paidAmount,
              updatedAt: new Date().toISOString(),
            };
            onUpdateBooking(updatedBooking);
            setSelectedDriverSettlementBooking(null);
          }}
        />
      )}
    </div>
  );
};

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
          <span className="badge badge-success inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-600" />
            रूट पर है (En-route)
          </span>
        );
      case 'dispatched':
        return (
          <span className="badge badge-warning inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            रवाना (Dispatched)
          </span>
        );
      case 'scheduled':
        return (
          <span className="badge badge-info inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            शेड्यूल (Scheduled)
          </span>
        );
      case 'completed':
        return (
          <span className="badge badge-neutral inline-flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-teal-700" />
            संपन्न (Completed)
          </span>
        );
      case 'billed':
        return (
          <span className="badge badge-info inline-flex items-center gap-1.5">
            <Receipt className="h-3 w-3" />
            बिल जनरेटेड (Billed)
          </span>
        );
      case 'settled':
        return (
          <span className="badge badge-neutral inline-flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3" />
            पूर्ण चुकता (Settled)
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge badge-danger inline-flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" />
            रद्द (Cancelled)
          </span>
        );
      default:
        return <span className="badge badge-neutral">{status}</span>;
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
      <div className="panel panel-pad flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-ink)] text-teal-300">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h1 className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
              मास्टर ड्यूटी रजिस्टर (Duty Master Register)
              <span className="badge badge-neutral">{filteredBookings.length} रिकॉर्ड</span>
            </h1>
            <p className="text-xs text-[var(--color-muted)]">
              शासकीय व वीआईपी फ्लीट 3-पार्टी बुकिंग, लाइव ड्यूटी स्टेटस, व्हाट्सएप स्लिप व रसीदें
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-nowrap items-center gap-2 overflow-x-auto md:w-auto">
          {onNewBookingClick && (
            <button type="button" onClick={onNewBookingClick} className="btn btn-primary shrink-0 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              नई ड्यूटी बुक करें (New Booking)
            </button>
          )}
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-secondary shrink-0 whitespace-nowrap"
            title="ड्यूटी रजिस्टर एक्सेल CSV डाउनलोड करें"
          >
            <Download className="h-4 w-4" />
            CSV निर्यात
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="metric-chip">
          <span className="metric-chip-label">कुल ड्यूटी रिकॉर्ड्स</span>
          <span className="metric-chip-value">{totalBookingsCount}</span>
          <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">मास्टर डेटाबेस में दर्ज</span>
        </div>
        <div className="metric-chip">
          <span className="metric-chip-label inline-flex items-center gap-1.5 text-teal-700">
            <span className="h-2 w-2 animate-ping rounded-full bg-teal-600" />
            सक्रिय व ऑन-ड्यूटी
          </span>
          <span className="metric-chip-value text-teal-800">{activeEnrouteCount} गाड़ियां</span>
          <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">फील्ड या रास्ते में</span>
        </div>
        <div className="metric-chip">
          <span className="metric-chip-label">कुल सकल बिलिंग (Gross Billable)</span>
          <span className="metric-chip-value text-[var(--color-info)]">{formatCurrencyINR(totalGrossRevenue)}</span>
          <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">जीएसटी सहित नेट देय</span>
        </div>
        <div className="metric-chip">
          <span className="metric-chip-label text-[var(--color-warning)]">चालक बकाया वेतन (Driver Payable)</span>
          <span className="metric-chip-value text-[var(--color-warning)]">{formatCurrencyINR(totalDriverPendingPay)}</span>
          <span className="mt-0.5 block text-[10px] text-[var(--color-muted)]">डीजल व एडवांस काटकर शेष</span>
        </div>
      </div>

      <div className="panel panel-pad flex flex-col items-center justify-between gap-3 md:flex-row">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="खोजें: गाड़ी, ड्राइवर, बुकिंग #, वीआईपी, विभाग..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] py-2 pl-9 pr-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
            <Filter className="h-3.5 w-3.5" />
            <span>स्टेटस:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cursor-pointer rounded-lg border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-teal-600/30"
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

          <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
            <span>विभाग/पार्टी:</span>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="max-w-[180px] cursor-pointer truncate rounded-lg border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-teal-600/30"
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

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--color-ink)]">
            <thead className="border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] text-xs font-semibold text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3.5">बुकिंग संदर्भ व दिनांक</th>
                <th className="px-4 py-3.5">क्लाइंट व बुक करने वाले</th>
                <th className="px-4 py-3.5">सवारी / VIP अधिकारी</th>
                <th className="px-4 py-3.5">आवंटित वाहन व चालक</th>
                <th className="px-4 py-3.5">रूट व स्थान</th>
                <th className="px-4 py-3.5">ड्यूटी पैकेज व राशि</th>
                <th className="px-4 py-3.5 text-center">स्टेटस</th>
                <th className="min-w-[11.5rem] whitespace-nowrap px-4 py-3.5 text-center">एक्शन / स्लिप्स</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[var(--color-muted)]">
                    <Car className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    कोई ड्यूटी रिकॉर्ड नहीं मिला। कृपया फ़िल्टर बदलें या नई ड्यूटी दर्ज करें।
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="transition hover:bg-[var(--color-surface-muted)]">
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-mono font-bold text-teal-800">{b.bookingNumber}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                        <Calendar className="h-3 w-3" />
                        {b.reportingDate}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                        <Clock className="h-3 w-3" />
                        {b.reportingTime}
                      </div>
                    </td>

                    <td className="max-w-[200px] px-4 py-3.5 align-top">
                      <div className="truncate font-medium text-[var(--color-ink)]" title={b.client.name}>
                        {b.client.name}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-medium text-teal-700" title={b.booker.name}>
                        {b.booker.name}
                      </div>
                      {b.booker.phone && (
                        <div className="font-mono text-[11px] text-[var(--color-muted)]">{b.booker.phone}</div>
                      )}
                    </td>

                    <td className="max-w-[190px] px-4 py-3.5 align-top">
                      <div className="flex items-center gap-1.5 truncate font-semibold text-[var(--color-ink)]">
                        {b.passenger.isVIP && <span className="badge badge-warning">VIP</span>}
                        <span className="truncate" title={b.passenger.name}>
                          {b.passenger.name}
                        </span>
                      </div>
                      {b.passenger.designation && (
                        <div className="truncate text-xs text-[var(--color-muted)]">{b.passenger.designation}</div>
                      )}
                      <div className="font-mono text-[11px] text-[var(--color-muted)]">{b.passenger.phone}</div>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-[var(--color-warning)]">
                        <Car className="h-3.5 w-3.5" />
                        {b.vehicleNumber}
                      </div>
                      <div className="text-xs text-[var(--color-muted)]">{b.vehicleModel}</div>
                      <div className="mt-1 text-xs font-medium text-[var(--color-ink)]">{b.driverName}</div>
                      <div className="font-mono text-[11px] text-[var(--color-muted)]">{b.driverPhone}</div>
                    </td>

                    <td className="max-w-[200px] px-4 py-3.5 align-top">
                      <div className="flex items-start gap-1 text-xs text-[var(--color-ink)]">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-teal-600" />
                        <span className="truncate" title={b.pickupLocation}>
                          {b.pickupLocation}
                        </span>
                      </div>
                      <div className="mt-1 flex items-start gap-1 text-xs text-[var(--color-muted)]">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[var(--color-danger)]" />
                        <span className="truncate" title={b.dropLocation}>
                          {b.dropLocation}
                        </span>
                      </div>
                      {b.garageOutKm && (
                        <div className="mt-1 font-mono text-[11px] text-[var(--color-muted)]">
                          गैरेज स्टार्ट: {b.garageOutKm} KM {b.garageInKm ? `➔ इन: ${b.garageInKm} KM` : ''}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <div className="text-xs font-medium text-[var(--color-ink)]">{b.tariff.packageName}</div>
                      <div className="mt-0.5 text-sm font-bold text-[var(--color-info)]">
                        {formatCurrencyINR(b.tariff.netClientBillable)}
                      </div>
                      <div className="text-[11px] font-medium text-[var(--color-warning)]">
                        ड्राइवर: {formatCurrencyINR(b.tariff.netDriverPayable)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-top text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {getStatusBadge(b.status)}
                        <select
                          value={b.status}
                          onChange={(e) => handleQuickStatusChange(b, e.target.value as DutyStatus)}
                          className="cursor-pointer rounded border border-[var(--color-line)] bg-white px-1.5 py-0.5 text-[11px] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-teal-600/30"
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

                    <td className="whitespace-nowrap px-4 py-3.5 align-middle text-center">
                      <div className="inline-flex flex-nowrap items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenWhatsApp(b)}
                          className="shrink-0 cursor-pointer rounded-lg border border-teal-200 bg-teal-50 p-1.5 text-teal-700 transition hover:bg-teal-100"
                          title="व्हाट्सएप ड्यूटी स्लिप (Driver, Pax, Booker)"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTariffBooking(b)}
                          className="shrink-0 cursor-pointer rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-1.5 text-[var(--color-ink)] transition hover:border-teal-300 hover:bg-teal-50"
                          title="टैरिफ दर व अतिरिक्त KM/घंटे हिसाब"
                        >
                          <Calculator className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedClientSettlementBooking(b)}
                          className="shrink-0 cursor-pointer rounded-lg border border-sky-200 bg-sky-50 p-1.5 text-sky-700 transition hover:bg-sky-100"
                          title="क्लाइंट टैक्स इनवॉइस व जीएसटी निपटान"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDriverSettlementBooking(b)}
                          className="shrink-0 cursor-pointer rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-800 transition hover:bg-amber-100"
                          title="चालक मजदूरी पर्ची व भुगतान निपटान"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteBooking(b.id)}
                          className="shrink-0 cursor-pointer rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-700 transition hover:bg-rose-100"
                          title="ड्यूटी रिकॉर्ड हटाएं"
                        >
                          <Trash2 className="h-4 w-4" />
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

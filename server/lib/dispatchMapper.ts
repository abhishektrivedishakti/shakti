import type {
  DispatchBooking as DbBooking,
  DispatchProfile as DbProfile,
  DispatchTariffPackage as DbTariff,
  DispatchDirectory as DbDirectory,
} from '../generated/prisma';
import type {
  BookingRecord,
  BookerDetails,
  ClientDetails,
  CustomTariffPackage,
  DispatcherProfile,
  DutyStatus,
  DutyTariff,
  PassengerDetails,
  SavedDirectory,
} from '../../src/types';
import { num, optStr, str } from './bodyParsers';
import { asJsonInput } from './jsonInput';

export const DEFAULT_DISPATCH_PROFILE: DispatcherProfile = {
  companyName: 'Shakti Travels and Tours',
  tagline: '',
  gstin: '',
  pan: '',
  address: '',
  supportPhone: '',
  bookingEmail: '',
};

export const EMPTY_DIRECTORY: SavedDirectory = {
  clients: [],
  bookers: [],
  passengers: [],
  vehicles: [],
  drivers: [],
};

const DUTY_STATUSES: DutyStatus[] = [
  'scheduled',
  'dispatched',
  'active_enroute',
  'completed',
  'billed',
  'settled',
  'cancelled',
];

function asObject<T>(raw: unknown, fallback: T): T {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as T;
  return fallback;
}

function asArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

export function mapDbProfileToApi(row: DbProfile): DispatcherProfile {
  return {
    companyName: row.companyName,
    tagline: row.tagline,
    gstin: row.gstin,
    pan: row.pan,
    address: row.address,
    supportPhone: row.supportPhone,
    bookingEmail: row.bookingEmail,
    bankName: row.bankName ?? undefined,
    bankAccountNo: row.bankAccountNo ?? undefined,
    ifscCode: row.ifscCode ?? undefined,
    upiId: row.upiId ?? undefined,
    dutySlipTerms: row.dutySlipTerms ?? undefined,
  };
}

export function profileDataFromBody(body: Record<string, unknown>) {
  return {
    companyName: str(body.companyName, DEFAULT_DISPATCH_PROFILE.companyName),
    tagline: str(body.tagline, DEFAULT_DISPATCH_PROFILE.tagline),
    gstin: str(body.gstin),
    pan: str(body.pan),
    address: str(body.address),
    supportPhone: str(body.supportPhone),
    bookingEmail: str(body.bookingEmail),
    bankName: optStr(body.bankName),
    bankAccountNo: optStr(body.bankAccountNo),
    ifscCode: optStr(body.ifscCode),
    upiId: optStr(body.upiId),
    dutySlipTerms: optStr(body.dutySlipTerms),
  };
}

export function mapDbDirectoryToApi(row: DbDirectory): SavedDirectory {
  return {
    clients: asArray<ClientDetails>(row.clients),
    bookers: asArray<BookerDetails>(row.bookers),
    passengers: asArray<PassengerDetails>(row.passengers),
    vehicles: asArray(row.vehicles),
    drivers: asArray(row.drivers),
  };
}

export function directoryDataFromBody(body: Record<string, unknown>) {
  return {
    clients: asJsonInput(Array.isArray(body.clients) ? body.clients : []),
    bookers: asJsonInput(Array.isArray(body.bookers) ? body.bookers : []),
    passengers: asJsonInput(Array.isArray(body.passengers) ? body.passengers : []),
    vehicles: asJsonInput(Array.isArray(body.vehicles) ? body.vehicles : []),
    drivers: asJsonInput(Array.isArray(body.drivers) ? body.drivers : []),
  };
}

export function mapDbTariffToApi(row: DbTariff): CustomTariffPackage {
  return {
    id: row.id,
    packageName: row.packageName,
    category: row.category as CustomTariffPackage['category'],
    baseRate: row.baseRate,
    baseHours: row.baseHours,
    baseKm: row.baseKm,
    extraKmRate: row.extraKmRate,
    extraHourRate: row.extraHourRate,
    nightHaltRate: row.nightHaltRate,
    driverWage: row.driverWage,
    description: row.description ?? undefined,
  };
}

export function tariffPackageDataFromBody(body: Record<string, unknown>) {
  return {
    packageName: str(body.packageName),
    category: str(body.category, 'custom_package') || 'custom_package',
    baseRate: num(body.baseRate),
    baseHours: num(body.baseHours),
    baseKm: num(body.baseKm),
    extraKmRate: num(body.extraKmRate),
    extraHourRate: num(body.extraHourRate),
    nightHaltRate: num(body.nightHaltRate),
    driverWage: num(body.driverWage),
    description: optStr(body.description),
  };
}

const EMPTY_CLIENT: ClientDetails = { name: '', billingAddress: '' };
const EMPTY_BOOKER: BookerDetails = { name: '', phone: '' };
const EMPTY_PASSENGER: PassengerDetails = { name: '', phone: '' };
const EMPTY_TARIFF: DutyTariff = {
  packageType: 'pending_assignment',
  packageName: '',
  baseRate: 0,
  baseHours: 0,
  baseKm: 0,
  extraKmRate: 0,
  extraHourRate: 0,
  nightHaltRate: 0,
  driverDaRate: 0,
  extraKmRun: 0,
  extraHoursRun: 0,
  extraKmCost: 0,
  extraHourCost: 0,
  tollParkingAmount: 0,
  stateTaxPermitCost: 0,
  nightHaltAmount: 0,
  grossClientAmount: 0,
  gstRatePercent: 5,
  gstAmount: 0,
  netClientBillable: 0,
  driverBaseWage: 0,
  driverExtraHoursPay: 0,
  driverNightDa: 0,
  driverAdvanceDeduction: 0,
  netDriverPayable: 0,
};

export function mapDbBookingToApi(row: DbBooking): BookingRecord {
  const status = (DUTY_STATUSES.includes(row.status as DutyStatus)
    ? row.status
    : 'scheduled') as DutyStatus;
  return {
    id: row.id,
    bookingNumber: row.bookingNumber,
    tenderId: row.tenderId ?? undefined,
    tenderNumber: row.tenderNumber ?? undefined,
    date: row.date,
    status,
    client: asObject<ClientDetails>(row.client, EMPTY_CLIENT),
    booker: asObject<BookerDetails>(row.booker, EMPTY_BOOKER),
    passenger: asObject<PassengerDetails>(row.passenger, EMPTY_PASSENGER),
    vehicleId: row.vehicleId ?? undefined,
    vehicleNumber: row.vehicleNumber,
    vehicleModel: row.vehicleModel,
    vehicleClass: row.vehicleClass,
    driverId: row.driverId ?? undefined,
    driverName: row.driverName,
    driverPhone: row.driverPhone,
    reportingDate: row.reportingDate,
    reportingTime: row.reportingTime,
    releaseDate: row.releaseDate ?? undefined,
    releaseTime: row.releaseTime ?? undefined,
    pickupLocation: row.pickupLocation,
    dropLocation: row.dropLocation,
    routeStops: row.routeStops ?? undefined,
    garageOutKm: row.garageOutKm,
    garageInKm: row.garageInKm ?? undefined,
    totalKmRun: row.totalKmRun ?? undefined,
    garageOutTime: row.garageOutTime ?? undefined,
    garageInTime: row.garageInTime ?? undefined,
    totalHoursRun: row.totalHoursRun ?? undefined,
    tariff: asObject<DutyTariff>(row.tariff, EMPTY_TARIFF),
    clientInvoiceNumber: row.clientInvoiceNumber ?? undefined,
    clientPaymentStatus:
      (row.clientPaymentStatus as BookingRecord['clientPaymentStatus']) || 'unbilled',
    clientPaidAmount: row.clientPaidAmount ?? undefined,
    driverPaymentStatus:
      (row.driverPaymentStatus as BookingRecord['driverPaymentStatus']) || 'pending',
    driverPaidAmount: row.driverPaidAmount ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString?.() ?? undefined,
  };
}

export function bookingDataFromBody(body: Record<string, unknown>) {
  const statusRaw = str(body.status, 'scheduled') || 'scheduled';
  const status = DUTY_STATUSES.includes(statusRaw as DutyStatus) ? statusRaw : 'scheduled';
  const clientPay = str(body.clientPaymentStatus, 'unbilled') || 'unbilled';
  const driverPay = str(body.driverPaymentStatus, 'pending') || 'pending';
  const tariff =
    body.tariff && typeof body.tariff === 'object' ? body.tariff : EMPTY_TARIFF;
  const client =
    body.client && typeof body.client === 'object' ? body.client : EMPTY_CLIENT;
  const booker =
    body.booker && typeof body.booker === 'object' ? body.booker : EMPTY_BOOKER;
  const passenger =
    body.passenger && typeof body.passenger === 'object' ? body.passenger : EMPTY_PASSENGER;

  return {
    bookingNumber: str(body.bookingNumber),
    tenderId: optStr(body.tenderId),
    tenderNumber: optStr(body.tenderNumber),
    date: str(body.date, new Date().toISOString().slice(0, 10)),
    status,
    client: asJsonInput(client) ?? asJsonInput(EMPTY_CLIENT)!,
    booker: asJsonInput(booker) ?? asJsonInput(EMPTY_BOOKER)!,
    passenger: asJsonInput(passenger) ?? asJsonInput(EMPTY_PASSENGER)!,
    vehicleId: optStr(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    vehicleModel: str(body.vehicleModel),
    vehicleClass: str(body.vehicleClass),
    driverId: optStr(body.driverId),
    driverName: str(body.driverName),
    driverPhone: str(body.driverPhone),
    reportingDate: str(body.reportingDate),
    reportingTime: str(body.reportingTime),
    releaseDate: optStr(body.releaseDate),
    releaseTime: optStr(body.releaseTime),
    pickupLocation: str(body.pickupLocation),
    dropLocation: str(body.dropLocation),
    routeStops: optStr(body.routeStops),
    garageOutKm: num(body.garageOutKm),
    garageInKm: body.garageInKm === undefined || body.garageInKm === null || body.garageInKm === ''
      ? null
      : num(body.garageInKm),
    totalKmRun:
      body.totalKmRun === undefined || body.totalKmRun === null || body.totalKmRun === ''
        ? null
        : num(body.totalKmRun),
    garageOutTime: optStr(body.garageOutTime),
    garageInTime: optStr(body.garageInTime),
    totalHoursRun:
      body.totalHoursRun === undefined || body.totalHoursRun === null || body.totalHoursRun === ''
        ? null
        : num(body.totalHoursRun),
    tariff: asJsonInput(tariff) ?? asJsonInput(EMPTY_TARIFF)!,
    clientInvoiceNumber: optStr(body.clientInvoiceNumber),
    clientPaymentStatus:
      clientPay === 'invoiced' || clientPay === 'paid' || clientPay === 'overdue'
        ? clientPay
        : 'unbilled',
    clientPaidAmount:
      body.clientPaidAmount === undefined || body.clientPaidAmount === null
        ? null
        : num(body.clientPaidAmount),
    driverPaymentStatus:
      driverPay === 'partially_paid' || driverPay === 'settled' ? driverPay : 'pending',
    driverPaidAmount:
      body.driverPaidAmount === undefined || body.driverPaidAmount === null
        ? null
        : num(body.driverPaidAmount),
    notes: optStr(body.notes),
    createdAt: str(body.createdAt, new Date().toISOString()) || new Date().toISOString(),
  };
}

export function computeDispatchKpi(bookings: BookingRecord[]) {
  const totalBookings = bookings.length;
  const activeTrips = bookings.filter(
    (b) => b.status === 'active_enroute' || b.status === 'dispatched'
  ).length;
  const completedTrips = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'settled' || b.status === 'billed'
  ).length;
  const scheduledTrips = bookings.filter((b) => b.status === 'scheduled').length;
  const totalGrossRevenue = bookings.reduce((s, b) => s + (b.tariff.grossClientAmount || 0), 0);
  const totalGstCollected = bookings.reduce((s, b) => s + (b.tariff.gstAmount || 0), 0);
  const totalNetBillable = bookings.reduce((s, b) => s + (b.tariff.netClientBillable || 0), 0);
  const totalDriverWages = bookings.reduce((s, b) => s + (b.tariff.netDriverPayable || 0), 0);
  const totalTollParking = bookings.reduce((s, b) => s + (b.tariff.tollParkingAmount || 0), 0);
  const netOperatingMargin = totalNetBillable - totalDriverWages - totalTollParking;
  const totalKmRun = bookings.reduce(
    (s, b) => s + (b.tariff.baseKm + (b.tariff.extraKmRun || 0)),
    0
  );

  const clientRevenueMap: Record<string, { count: number; revenue: number }> = {};
  for (const b of bookings) {
    const name = b.client.name || 'General';
    if (!clientRevenueMap[name]) clientRevenueMap[name] = { count: 0, revenue: 0 };
    clientRevenueMap[name].count += 1;
    clientRevenueMap[name].revenue += b.tariff.netClientBillable || 0;
  }

  return {
    totalBookings,
    activeTrips,
    completedTrips,
    scheduledTrips,
    totalGrossRevenue,
    totalGstCollected,
    totalNetBillable,
    totalDriverWages,
    totalTollParking,
    netOperatingMargin,
    profitMarginPercent:
      totalNetBillable > 0
        ? Number(((netOperatingMargin / totalNetBillable) * 100).toFixed(1))
        : 0,
    totalKmRun,
    topClients: Object.entries(clientRevenueMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, v]) => ({ name, ...v })),
  };
}

export function computeDispatchFinance(
  bookings: BookingRecord[],
  period: 'all' | 'this_month' | 'last_month' = 'all'
) {
  const now = new Date();
  const filtered = bookings.filter((b) => {
    if (period === 'all') return true;
    const bookingDate = new Date(b.reportingDate);
    if (period === 'this_month') {
      return (
        bookingDate.getMonth() === now.getMonth() &&
        bookingDate.getFullYear() === now.getFullYear()
      );
    }
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return bookingDate.getMonth() === lastMonth && bookingDate.getFullYear() === lastMonthYear;
  });

  const totalGrossAmount = filtered.reduce((s, b) => s + (b.tariff.grossClientAmount || 0), 0);
  const totalGstAmount = filtered.reduce((s, b) => s + (b.tariff.gstAmount || 0), 0);
  const totalNetBillable = filtered.reduce((s, b) => s + (b.tariff.netClientBillable || 0), 0);
  const totalDriverWages = filtered.reduce((s, b) => s + (b.tariff.driverBaseWage || 0), 0);
  const totalDriverExtraHours = filtered.reduce(
    (s, b) => s + (b.tariff.driverExtraHoursPay || 0),
    0
  );
  const totalDriverNightDa = filtered.reduce((s, b) => s + (b.tariff.driverNightDa || 0), 0);
  const totalDriverGrossPay = totalDriverWages + totalDriverExtraHours + totalDriverNightDa;
  const totalAdvanceDeductions = filtered.reduce(
    (s, b) => s + (b.tariff.driverAdvanceDeduction || 0),
    0
  );
  const totalNetDriverPayable = filtered.reduce(
    (s, b) => s + (b.tariff.netDriverPayable || 0),
    0
  );
  const totalTollParking = filtered.reduce((s, b) => s + (b.tariff.tollParkingAmount || 0), 0);
  const totalPaidByClient = filtered
    .filter((b) => b.clientPaymentStatus === 'paid')
    .reduce((s, b) => s + (b.tariff.netClientBillable || 0), 0);
  const totalDriverSettled = filtered
    .filter((b) => b.driverPaymentStatus === 'settled')
    .reduce((s, b) => s + (b.tariff.netDriverPayable || 0), 0);

  return {
    period,
    bookingCount: filtered.length,
    totalGrossAmount,
    totalGstAmount,
    totalNetBillable,
    totalDriverWages,
    totalDriverExtraHours,
    totalDriverNightDa,
    totalDriverGrossPay,
    totalAdvanceDeductions,
    totalNetDriverPayable,
    totalTollParking,
    totalPaidByClient,
    totalOutstandingClient: totalNetBillable - totalPaidByClient,
    totalDriverSettled,
    totalDriverPending: totalNetDriverPayable - totalDriverSettled,
    totalCompanyOperatingMargin: totalNetBillable - totalDriverGrossPay - totalTollParking,
  };
}

export function buildSlipPayload(booking: BookingRecord, dispatcher: DispatcherProfile) {
  const driverSlip =
    `*🚨 ${dispatcher.companyName.toUpperCase()} - अधिकृत वाहन ड्यूटी आदेश*\n` +
    `-----------------------------------------\n` +
    `*ड्यूटी सं. (Booking No):* ${booking.bookingNumber}\n` +
    `*दिनांक:* ${booking.reportingDate} | *समय:* ${booking.reportingTime}\n` +
    `*गाड़ी नंबर:* ${booking.vehicleNumber} (${booking.vehicleModel})\n` +
    `*सवारी / मुख्य अधिकारी:* ${booking.passenger.name} (${booking.passenger.designation || 'VIP'})\n` +
    `*सवारी फोन:* ${booking.passenger.phone || 'उपलब्ध नहीं'}\n` +
    `*बुक करने वाले अधिकारी:* ${booking.booker.name} (${booking.booker.phone})\n` +
    `*बिलिंग पार्टी / विभाग:* ${booking.client.name}\n` +
    `*पिकअप स्थल:* ${booking.pickupLocation}\n` +
    `*गंतव्य / साइट:* ${booking.dropLocation}\n` +
    `*शुरुआती गैरेज मीटर:* ${booking.garageOutKm} KM\n` +
    `*ड्यूटी पैकेज:* ${booking.tariff.packageName}\n` +
    `*विशेष निर्देश:* ${booking.passenger.specialRequests || 'एसी चालू रखें, वर्दी में उपस्थित हों व गाड़ी साफ रखें।'}\n` +
    `-----------------------------------------\n` +
    `_कंट्रोल रूम 24x7 हेल्पलाइन: ${dispatcher.supportPhone}_\n` +
    `_कृपया समय पर पहुंचें और विनम्र व्यवहार रखें।_`;

  const passengerSlip =
    `*🙏 आदरणीय ${booking.passenger.name} जी, सादर प्रणाम।*\n` +
    `*${dispatcher.companyName}* द्वारा आपके शासकीय कार्य हेतु वाहन आवंटित कर दिया गया है:\n` +
    `-----------------------------------------\n` +
    `*वाहन नंबर:* ${booking.vehicleNumber}\n` +
    `*वाहन मॉडल:* ${booking.vehicleModel} (${booking.vehicleClass})\n` +
    `*अधिकृत चालक (Driver):* ${booking.driverName}\n` +
    `*चालक मोबाइल:* ${booking.driverPhone}\n` +
    `*रिपोर्टिंग समय:* ${booking.reportingTime} (${booking.reportingDate})\n` +
    `*पिकअप स्थल:* ${booking.pickupLocation}\n` +
    `*गंतव्य:* ${booking.dropLocation}\n` +
    `*बुकिंग संदर्भ:* ${booking.bookingNumber}\n` +
    `-----------------------------------------\n` +
    `गाड़ी में एसी, साफ-सफाई व सुरक्षा के उच्चतम मानक सुनिश्चित किए गए हैं।\n` +
    `किसी भी असुविधा या बदलाव हेतु तुरंत कंट्रोल रूम: *${dispatcher.supportPhone}* पर कॉल करें।\n` +
    `_शुभ यात्रा!_`;

  const bookerSlip =
    `*✅ वाहन बुकिंग एवं अलॉटमेंट पुष्टिकरण (Duty Allocation Confirmed)*\n` +
    `*सेवा प्रदाता:* ${dispatcher.companyName} (GSTIN: ${dispatcher.gstin})\n` +
    `-----------------------------------------\n` +
    `*बुकिंग संदर्भ:* ${booking.bookingNumber}\n` +
    `*क्लाइंट / विभाग:* ${booking.client.name}\n` +
    `*आवेदक (Booker):* ${booking.booker.name} (${booking.booker.phone})\n` +
    `*यात्री / अधिकारी:* ${booking.passenger.name} (${booking.passenger.phone})\n` +
    `*तारीख व समय:* ${booking.reportingDate} at ${booking.reportingTime}\n` +
    `*आवंटित गाड़ी:* ${booking.vehicleNumber} (${booking.vehicleModel})\n` +
    `*चालक:* ${booking.driverName} (${booking.driverPhone})\n` +
    `*रूट:* ${booking.pickupLocation} ➔ ${booking.dropLocation}\n` +
    `*पैकेज दर:* ${booking.tariff.packageName} - बेस दर ₹${booking.tariff.baseRate}\n` +
    `-----------------------------------------\n` +
    `_सत्यापन हेतु ड्यूटी स्लिप चालक के पास उपलब्ध रहेगी। धन्यवाद!_`;

  return {
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
    driverSlip,
    passengerSlip,
    bookerSlip,
    print: {
      bookingNumber: booking.bookingNumber,
      vehicleNumber: booking.vehicleNumber,
      driverName: booking.driverName,
      passengerName: booking.passenger.name,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      reportingDate: booking.reportingDate,
      reportingTime: booking.reportingTime,
      packageName: booking.tariff.packageName,
      netClientBillable: booking.tariff.netClientBillable,
      netDriverPayable: booking.tariff.netDriverPayable,
    },
  };
}

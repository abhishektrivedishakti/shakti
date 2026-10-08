import { BookingRecord, DispatcherProfile } from '../types';

export const formatCurrencyINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * 1. DRIVER DUTY SLIP (व्हाट्सएप चालक ड्यूटी आदेश)
 */
export const generateDriverWhatsAppSlip = (booking: BookingRecord, dispatcher: DispatcherProfile): string => {
  return (
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
    `_कृपया समय पर पहुंचें और विनम्र व्यवहार रखें।_`
  );
};

/**
 * 2. PASSENGER / VIP SLIP (सवार अधिकारी / यात्री स्वागत स्लिप)
 */
export const generatePassengerWhatsAppSlip = (booking: BookingRecord, dispatcher: DispatcherProfile): string => {
  return (
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
    `_शुभ यात्रा!_`
  );
};

/**
 * 3. BOOKER / CLIENT CONFIRMATION SLIP (बुकर / बिलिंग पार्टी पुष्टि स्लिप)
 */
export const generateBookerWhatsAppSlip = (booking: BookingRecord, dispatcher: DispatcherProfile): string => {
  return (
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
    `*पैकेज दर:* ${booking.tariff.packageName} - बेस दर ₹${booking.tariff.baseRate} (एक्स्ट्रा ₹${booking.tariff.extraKmRate}/KM, ₹${booking.tariff.extraHourRate}/Hr)\n` +
    `-----------------------------------------\n` +
    `_सत्यापन हेतु ड्यूटी स्लिप चालक के पास उपलब्ध रहेगी। धन्यवाद!_`
  );
};

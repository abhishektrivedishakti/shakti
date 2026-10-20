import React, { useState } from 'react';
import { BookingRecord, DispatcherProfile } from '../../types';
import {
  generateDriverWhatsAppSlip,
  generatePassengerWhatsAppSlip,
  generateBookerWhatsAppSlip,
} from '../../utils/dispatchFormatters';
import {
  MessageSquare,
  Users,
  Briefcase,
  Copy,
  Check,
  ExternalLink,
  Car,
  Clock,
  Sparkles,
  Send,
  Building2,
} from 'lucide-react';

interface WhatsAppSlipStudioProps {
  booking: BookingRecord;
  dispatcher: DispatcherProfile;
  allBookings: BookingRecord[];
  onSelectBooking: (booking: BookingRecord) => void;
}

export const WhatsAppSlipStudio: React.FC<WhatsAppSlipStudioProps> = ({
  booking,
  dispatcher,
  allBookings,
  onSelectBooking,
}) => {
  const [activeSlipType, setActiveSlipType] = useState<'driver' | 'passenger' | 'booker'>('driver');
  const [copied, setCopied] = useState(false);

  const driverSlipText = generateDriverWhatsAppSlip(booking, dispatcher);
  const passengerSlipText = generatePassengerWhatsAppSlip(booking, dispatcher);
  const bookerSlipText = generateBookerWhatsAppSlip(booking, dispatcher);

  const currentText =
    activeSlipType === 'driver'
      ? driverSlipText
      : activeSlipType === 'passenger'
      ? passengerSlipText
      : bookerSlipText;

  const targetMobile =
    activeSlipType === 'driver'
      ? booking.driverPhone
      : activeSlipType === 'passenger'
      ? booking.passenger.phone
      : booking.booker.phone;

  const targetName =
    activeSlipType === 'driver'
      ? `${booking.driverName} (चालक)`
      : activeSlipType === 'passenger'
      ? `${booking.passenger.name} (सवार अधिकारी)`
      : `${booking.booker.name} (बुकर / क्लाइंट)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = (targetMobile || '').replace(/\D/g, '');
  const whatsAppUrl = cleanPhone
    ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(currentText)}`
    : '';

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="panel panel-pad flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="badge badge-success inline-flex items-center gap-1 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Studio &bull; 1-क्लिक डिजिटल स्लिप जनरेटर
            </span>
          </div>
          <h2 className="text-xl font-black text-[var(--color-ink)]">व्हाट्सएप स्लिप स्टूडियो (Instant Duty Slips)</h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            ड्राइवर, मुख्य सवार अधिकारी और बुकर तीनों के लिए अलग-अलग प्री-फॉर्मेटेड व्हाट्सएप ड्यूटी संदेश जारी करें।
          </p>
        </div>

        {/* Duty Selector Dropdown */}
        <div className="bg-[var(--color-surface-muted)] p-2.5 rounded-xl border border-[var(--color-line)] shrink-0">
          <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">
            ड्यूटी चालान चुनें:
          </label>
          <select
            value={booking.id}
            onChange={(e) => {
              const b = allBookings.find((x) => x.id === e.target.value);
              if (b) onSelectBooking(b);
            }}
            className="px-3 py-1.5 bg-white border border-[var(--color-line-strong)] rounded-lg text-xs font-mono font-bold text-[var(--color-ink)] focus:ring-2 focus:ring-teal-600"
          >
            {allBookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bookingNumber} &bull; {b.passenger.name} ({b.vehicleNumber}) - {b.reportingTime}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: 3 Slip Type Tabs & Duty Meta */}
        <div className="space-y-3">
          <div className="panel p-3 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] px-1 block">
              स्लिप प्राप्तकर्ता (Choose Recipient):
            </span>

            {/* 1. Driver Slip Tab */}
            <button
              onClick={() => setActiveSlipType('driver')}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                activeSlipType === 'driver'
                  ? 'bg-teal-50 border-teal-600 text-[var(--color-ink)] shadow-md'
                  : 'bg-[var(--color-surface-muted)] border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-teal-700">
                  <Car className="w-4 h-4" />
                  <span>1. चालक ड्यूटी आदेश (Driver Slip)</span>
                </span>
                <span className="text-[10px] font-mono bg-teal-50 px-1.5 py-0.5 rounded text-teal-700">
                  {booking.driverPhone}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mt-1">{booking.driverName}</p>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                गाड़ी, अधिकारी का नाम, पिकअप स्थल व विशेष निर्देश
              </p>
            </button>

            {/* 2. Passenger / VIP Slip Tab */}
            <button
              onClick={() => setActiveSlipType('passenger')}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                activeSlipType === 'passenger'
                  ? 'bg-teal-50 border-teal-500 text-[var(--color-ink)] shadow-md'
                  : 'bg-[var(--color-surface-muted)] border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-teal-700">
                  <Users className="w-4 h-4" />
                  <span>2. सवार अधिकारी स्लिप (Pax / VIP)</span>
                </span>
                <span className="text-[10px] font-mono bg-teal-50 px-1.5 py-0.5 rounded text-teal-700">
                  {booking.passenger.phone}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mt-1">{booking.passenger.name}</p>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                गाड़ी नंबर, चालक का नाम व फोन नंबर, कंट्रोल रूम नंबर
              </p>
            </button>

            {/* 3. Booker Confirmation Slip Tab */}
            <button
              onClick={() => setActiveSlipType('booker')}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                activeSlipType === 'booker'
                  ? 'bg-amber-50 border-amber-500 text-[var(--color-ink)] shadow-md'
                  : 'bg-[var(--color-surface-muted)] border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-amber-700">
                  <Briefcase className="w-4 h-4" />
                  <span>3. बुकर / क्लाइंट स्लिप (Booker)</span>
                </span>
                <span className="text-[10px] font-mono bg-amber-50 px-1.5 py-0.5 rounded text-amber-700">
                  {booking.booker.phone}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] mt-1">{booking.booker.name}</p>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                बुकिंग पुष्टि, आवंटित वाहन, ड्यूटी पैकेज व सुपरवाइजर संपर्क
              </p>
            </button>
          </div>

          {/* Quick Duty Summary Box */}
          <div className="panel p-4 text-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">
              वर्तमान ड्यूटी सारांश:
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">गाड़ी नंबर:</span>
                <strong className="font-mono text-[var(--color-ink)]">{booking.vehicleNumber} ({booking.vehicleModel})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">रिपोर्टिंग समय:</span>
                <strong className="text-teal-700 font-mono">{booking.reportingTime} ({booking.reportingDate})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">पिकअप:</span>
                <span className="text-[var(--color-ink)] text-right truncate max-w-[180px]">{booking.pickupLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">गंतव्य:</span>
                <span className="text-[var(--color-ink)] text-right truncate max-w-[180px]">{booking.dropLocation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2-Columns: Message Preview & Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="panel panel-pad space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-[var(--color-ink)]">संदेश पूर्वावलोकन (Live Preview)</span>
                <span className="text-xs text-[var(--color-muted)]">&bull; प्रेषित: {targetName}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 bg-[var(--color-sand-deep)] hover:bg-[var(--color-sand)] text-[var(--color-ink)] rounded-lg text-xs font-bold flex items-center gap-1.5 border border-[var(--color-line-strong)] transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-4 h-4 text-teal-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'कॉपी हो गया ✓' : 'टेक्स्ट कॉपी करें'}</span>
                </button>

                {whatsAppUrl ? (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>सीधे WhatsApp खोलें</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-[var(--color-muted)] italic">फोन नंबर दर्ज नहीं</span>
                )}
              </div>
            </div>

            {/* WhatsApp Styled Message Bubble */}
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl relative">
              <div className="absolute top-2 right-3 text-[10px] text-teal-700/60 font-mono">
                WhatsApp Preview
              </div>
              <pre className="font-sans text-xs text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed select-all">
                {currentText}
              </pre>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] pt-1">
              <span>💡 टिप: ऊपर दिए गए बटन से सीधे उनके मोबाइल नंबर पर व्हाट्सएप चैट खुल जाएगी।</span>
              <span className="font-mono text-[var(--color-muted)]">{currentText.length} वर्ण (Characters)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

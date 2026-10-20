import React, { useState, useEffect } from 'react';
import { BookingRecord, DispatcherProfile } from '../../types';
import {
  Navigation,
  MapPin,
  Radio,
  AlertTriangle,
  Play,
  Square,
  Share2,
  Car,
  Clock,
  Battery,
  Wifi,
  Phone,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface GPSRelaySimulatorProps {
  bookings: BookingRecord[];
  dispatcher: DispatcherProfile;
}

interface SimulatedVehicle {
  bookingId: string;
  bookingNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  passengerName: string;
  currentLocation: string;
  latitude: number;
  longitude: number;
  speedKmH: number;
  status: 'moving' | 'idle' | 'stopped' | 'sos';
  batteryPercent: number;
  signalStrength: number;
  etaMinutes: number;
}

export const GPSRelaySimulator: React.FC<GPSRelaySimulatorProps> = ({ bookings, dispatcher }) => {
  // Extract active and dispatched trips
  const activeBookings = bookings.filter(
    (b) => b.status === 'active_enroute' || b.status === 'dispatched' || b.status === 'scheduled'
  );

  // Initial vehicles simulation state
  const [vehicles, setVehicles] = useState<SimulatedVehicle[]>(() => {
    return (activeBookings.length > 0 ? activeBookings : bookings.slice(0, 4)).map((b, idx) => ({
      bookingId: b.id,
      bookingNumber: b.bookingNumber,
      vehicleNumber: b.vehicleNumber,
      driverName: b.driverName,
      driverPhone: b.driverPhone,
      passengerName: b.passenger.name,
      currentLocation: idx % 2 === 0 ? 'शहीद पथ, गोमती नगर विस्तार, लखनऊ' : 'कानपुर रोड, सरोजिनी नगर, अमौसी',
      latitude: 26.8467 + (Math.random() - 0.5) * 0.05,
      longitude: 80.9462 + (Math.random() - 0.5) * 0.05,
      speedKmH: idx % 2 === 0 ? 54 : 38,
      status: 'moving',
      batteryPercent: 94 - idx * 4,
      signalStrength: 4,
      etaMinutes: 25 + idx * 10,
    }));
  });

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [selectedVehicle, setSelectedVehicle] = useState<SimulatedVehicle | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Background GPS Ping simulation interval
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status === 'sos' || v.status === 'stopped') return v;
          const deltaSpeed = Math.floor((Math.random() - 0.5) * 6);
          const newSpeed = Math.max(20, Math.min(85, v.speedKmH + deltaSpeed));
          const newEta = Math.max(5, v.etaMinutes - 1);
          return {
            ...v,
            speedKmH: newSpeed,
            etaMinutes: newEta,
            latitude: v.latitude + (Math.random() - 0.49) * 0.001,
            longitude: v.longitude + (Math.random() - 0.49) * 0.001,
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleTriggerSOS = (vehicleNumber: string) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.vehicleNumber === vehicleNumber
          ? { ...v, status: v.status === 'sos' ? 'moving' : 'sos', speedKmH: 0 }
          : v
      )
    );
  };

  const handleShareTrackingLink = (v: SimulatedVehicle) => {
    const link = `https://shaktitravels.live/track/${v.bookingNumber.toLowerCase()}?lat=${v.latitude.toFixed(
      4
    )}&lng=${v.longitude.toFixed(4)}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(v.bookingNumber);
    setTimeout(() => setCopiedLink(null), 3000);

    // Also offer WhatsApp link
    const waText = encodeURIComponent(
      `*🚨 लाइव वाहन ट्रैकिंग लिंक - ${dispatcher.companyName}*\n` +
        `गाड़ी: ${v.vehicleNumber}\n` +
        `सवारी: ${v.passengerName}\n` +
        `ड्राइवर: ${v.driverName} (${v.driverPhone})\n` +
        `वर्तमान लोकेशन: ${v.currentLocation}\n` +
        `लाइव लिंक: ${link}`
    );
    window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="panel panel-pad flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white shadow-lg">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                लाइव जीपीएस रिले ट्रैकिंग (GPS Relay Simulator)
                <span className="badge badge-success">
                  {vehicles.length} वाहन ऑन-रडार
                </span>
              </h1>
              <p className="text-xs text-[var(--color-muted)]">
                फ्लीट रियल-टाइम टेलीमैटिक्स, स्पीडोमीटर, गति नियंत्रण, आपातकालीन एसओएस व लाइव ट्रैकिंग शेयर
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Control Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`text-xs ${isSimulating ? 'btn btn-success' : 'btn btn-secondary'}`}
          >
            {isSimulating ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                सिमुलेटर चालू है (Live Relay ON)
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                सिमुलेशन शुरू करें (Start Relay)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Active Tracked Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((v) => (
          <div
            key={v.bookingId}
            className={`bg-white border rounded-2xl p-5 shadow-lg relative transition-all ${
              v.status === 'sos'
                ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-500/30'
                : 'border-[var(--color-line)] hover:border-[var(--color-line-strong)]'
            }`}
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--color-ink)] font-mono">{v.vehicleNumber}</div>
                  <div className="text-[11px] text-teal-700 font-medium">ड्यूटी #{v.bookingNumber}</div>
                </div>
              </div>

              {/* Status pill */}
              {v.status === 'sos' ? (
                <span className="px-2.5 py-1 text-xs font-black rounded-full bg-rose-600 text-white animate-bounce flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  SOS अलार्म
                </span>
              ) : (
                <span className="badge badge-success inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  {v.speedKmH} KM/H
                </span>
              )}
            </div>

            {/* Middle telemetry metrics */}
            <div className="py-3.5 space-y-2 text-xs">
              <div className="flex items-start gap-1.5 text-[var(--color-muted)]">
                <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                <span className="truncate">{v.currentLocation}</span>
              </div>

              <div className="flex items-center justify-between text-[var(--color-muted)] pt-1">
                <span>सवारी (VIP):</span>
                <span className="text-[var(--color-ink)] font-semibold truncate max-w-[150px]">{v.passengerName}</span>
              </div>

              <div className="flex items-center justify-between text-[var(--color-muted)]">
                <span>चालक (Driver):</span>
                <span className="text-[var(--color-ink)] font-medium">
                  {v.driverName} ({v.driverPhone})
                </span>
              </div>

              <div className="flex items-center justify-between text-[var(--color-muted)]">
                <span>अपेक्षित समय (ETA):</span>
                <span className="text-[var(--color-info)] font-bold">{v.etaMinutes} मिनट शेष</span>
              </div>
            </div>

            {/* Bottom hardware sensor bar */}
            <div className="pt-3 border-t border-[var(--color-line)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-teal-700" />
                  {v.batteryPercent}%
                </span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-teal-700" />
                  4G LTE
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTriggerSOS(v.vehicleNumber)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    v.status === 'sos'
                      ? 'btn btn-success !px-2.5 !py-1'
                      : 'border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                  title="एसओएस आपातकालीन अलार्म चालू/बंद करें"
                >
                  {v.status === 'sos' ? 'रीसेट' : 'SOS'}
                </button>

                <button
                  type="button"
                  onClick={() => handleShareTrackingLink(v)}
                  className="btn btn-success !px-2.5 !py-1 text-xs"
                  title="व्हाट्सएप पर लाइव ट्रैकिंग लिंक शेयर करें"
                >
                  <Share2 className="w-3 h-3" />
                  शेयर लिंक
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {copiedLink && (
        <div className="alert-banner fixed bottom-6 right-6 z-50 animate-fade-in shadow-2xl">
          <CheckCircle className="h-4 w-4 text-teal-700" />
          <span className="text-sm font-semibold">
            ड्यूटी #{copiedLink} का लाइव ट्रैकिंग लिंक कॉपी व शेयर कर दिया गया!
          </span>
        </div>
      )}
    </div>
  );
};

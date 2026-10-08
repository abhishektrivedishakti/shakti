import React, { useState, useEffect } from 'react';
import {
  BookingRecord,
  DispatcherProfile,
  SavedDirectory,
  Vehicle,
  Driver,
  Officer,
  Tender,
} from '../../types';
import { initialDispatcherProfile, sampleBookings } from '../../utils/dispatchSampleData';
import { loadSavedDirectory, saveDirectoryToStorage } from '../../utils/directoryStorage';
import { MasterRegister } from './MasterRegister';
import { BookingForm } from './BookingForm';
import { WhatsAppSlipStudio } from './WhatsAppSlipStudio';
import { KPIDashboard } from './KPIDashboard';
import { FinanceAnalytics } from './FinanceAnalytics';
import { GPSRelaySimulator } from './GPSRelaySimulator';
import { SavedDirectoryManager } from './SavedDirectoryManager';
import { ExportStandaloneModal } from './ExportStandaloneModal';
import {
  Car,
  FileSpreadsheet,
  Plus,
  MessageCircle,
  TrendingUp,
  IndianRupee,
  Radio,
  Users,
  Download,
  Settings,
  X,
  Save,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

interface FleetDispatchProViewProps {
  erpVehicles?: Vehicle[];
  erpDrivers?: Driver[];
  erpOfficers?: Officer[];
  erpTenders?: Tender[];
}

export const FleetDispatchProView: React.FC<FleetDispatchProViewProps> = ({
  erpVehicles = [],
  erpDrivers = [],
  erpOfficers = [],
  erpTenders = [],
}) => {
  // 1. Dispatcher Profile State (Company Details, GST, Contact)
  const [dispatcher, setDispatcher] = useState<DispatcherProfile>(() => {
    try {
      const saved = localStorage.getItem('fleetdispatch_dispatcher_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialDispatcherProfile;
  });

  // 2. Bookings Master State (All duty records)
  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('fleetdispatch_bookings_master');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return sampleBookings;
  });

  // 3. Saved Directory State (Clients, Official Bookers, Vehicles, Drivers)
  const [savedDirectory, setSavedDirectory] = useState<SavedDirectory>(() => {
    return loadSavedDirectory(bookings);
  });

  // Merge ERP vehicles, drivers, and officers into savedDirectory seamlessly
  useEffect(() => {
    setSavedDirectory((prev) => {
      const updated = { ...prev };
      let changed = false;

      // Add vehicles from ERP
      erpVehicles.forEach((v) => {
        if (v.vehicleNumber && !updated.vehicles.some((ex) => ex.vehicleNumber === v.vehicleNumber)) {
          updated.vehicles.push({
            vehicleNumber: v.vehicleNumber,
            vehicleModel: `${v.makeModel || 'Fleet'} (${v.vehicleType || 'Sedan'})`,
            vehicleClass: v.vehicleType || 'Sedan',
          });
          changed = true;
        }
      });

      // Add drivers from ERP
      erpDrivers.forEach((d) => {
        if (d.name && !updated.drivers.some((ex) => ex.name === d.name)) {
          updated.drivers.push({
            name: d.name,
            phone: d.phone || '',
          });
          changed = true;
        }
      });

      // Add officers from ERP as VIP passengers
      erpOfficers.forEach((o) => {
        if (o.name && !updated.passengers.some((ex) => ex.name === o.name)) {
          updated.passengers.push({
            id: o.id || `PAX-${Date.now()}`,
            name: o.name,
            phone: o.mobile || o.alternatePhone || '',
            designation: o.designation || 'Government Officer',
            isVIP: true,
            specialRequests: 'शासकीय वाहन सेवा प्रोटोकॉल लागू',
          });
          changed = true;
        }
      });

      if (changed) {
        saveDirectoryToStorage(updated);
        return updated;
      }
      return prev;
    });
  }, [erpVehicles, erpDrivers, erpOfficers]);

  // Auto-sync Bookings to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('fleetdispatch_bookings_master', JSON.stringify(bookings));
    } catch (e) {
      console.error(e);
    }
  }, [bookings]);

  // Auto-sync Dispatcher Profile to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('fleetdispatch_dispatcher_profile', JSON.stringify(dispatcher));
    } catch (e) {
      console.error(e);
    }
  }, [dispatcher]);

  // Active Tab & Modal States
  const [activeTab, setActiveTab] = useState<
    'register' | 'new-booking' | 'analytics' | 'finance' | 'gps-relay' | 'whatsapp' | 'directory'
  >('register');
  const [selectedBookingForSlip, setSelectedBookingForSlip] = useState<BookingRecord | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Settings Modal temp state
  const [tempDispatcher, setTempDispatcher] = useState<DispatcherProfile>(dispatcher);

  // Handlers for Add, Edit, Delete Duty
  const handleCreateBooking = (newRecord: BookingRecord) => {
    setBookings((prev) => [newRecord, ...prev]);
    setActiveTab('register');
  };

  const handleUpdateBooking = (updatedRecord: BookingRecord) => {
    setBookings((prev) => prev.map((b) => (b.id === updatedRecord.id ? updatedRecord : b)));
  };

  const handleDeleteBooking = (id: string) => {
    if (window.confirm('क्या आप इस ड्यूटी रिकॉर्ड को रजिस्टर से हटाना चाहते हैं?')) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Fleet Dispatch Pro Sub-Navigation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-wide">
                  फ्लीट डिस्पैच प्रो (Fleet Dispatch Pro)
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
                  v2.5 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {dispatcher.companyName} | 3-पार्टी ड्यूटी बुकिंग, 1-क्लिक व्हाट्सएप स्लिप, लाइव GPS व टैक्स इनवॉइस
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTempDispatcher(dispatcher);
                setShowSettingsModal(true);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="कंपनी व डिस्पैचर प्रोफाइल सेटिंग्स"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              प्रोफ़ाइल सेटिंग्स
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow"
              title="1-क्लिक HTML व JSON बैकअप डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              एक्सपोर्ट व बैकअप
            </button>

            <button
              onClick={() => setActiveTab('new-booking')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              नई बुकिंग (New Duty)
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'register'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            मास्टर ड्यूटी रजिस्टर
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-black/30 rounded-full font-mono">
              {bookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('new-booking')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'new-booking'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            नई बुकिंग फॉर्म
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            केपीआई डैशबोर्ड
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'finance'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            वित्तीय ऑडिट व GST
          </button>

          <button
            onClick={() => setActiveTab('gps-relay')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'gps-relay'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            लाइव GPS रिले
          </button>

          <button
            onClick={() => {
              if (!selectedBookingForSlip && bookings.length > 0) {
                setSelectedBookingForSlip(bookings[0]);
              }
              setActiveTab('whatsapp');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            व्हाट्सएप स्लिप स्टूडियो
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'directory'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            सेव्ड डायरेक्टरी
          </button>
        </div>
      </div>

      {/* Main Tab View Render */}
      <div className="min-h-[500px]">
        {activeTab === 'register' && (
          <MasterRegister
            bookings={bookings}
            dispatcher={dispatcher}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            onOpenWhatsApp={(booking) => {
              setSelectedBookingForSlip(booking);
              setActiveTab('whatsapp');
            }}
            onNewBookingClick={() => setActiveTab('new-booking')}
          />
        )}

        {activeTab === 'new-booking' && (
          <BookingForm
            dispatcher={dispatcher}
            savedDirectory={savedDirectory}
            erpTenders={erpTenders}
            onSubmitBooking={handleCreateBooking}
            onCancel={() => setActiveTab('register')}
          />
        )}

        {activeTab === 'analytics' && (
          <KPIDashboard bookings={bookings} dispatcher={dispatcher} />
        )}

        {activeTab === 'finance' && (
          <FinanceAnalytics bookings={bookings} dispatcher={dispatcher} />
        )}

        {activeTab === 'gps-relay' && (
          <GPSRelaySimulator bookings={bookings} dispatcher={dispatcher} />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppSlipStudio
            booking={selectedBookingForSlip || bookings[0]}
            dispatcher={dispatcher}
            allBookings={bookings}
            onSelectBooking={(b) => setSelectedBookingForSlip(b)}
          />
        )}

        {activeTab === 'directory' && (
          <SavedDirectoryManager
            savedDirectory={savedDirectory}
            onUpdateDirectory={(updated) => {
              setSavedDirectory(updated);
              saveDirectoryToStorage(updated);
            }}
          />
        )}
      </div>

      {/* Standalone Code & JSON Exporter Modal */}
      {showExportModal && (
        <ExportStandaloneModal
          bookings={bookings}
          dispatcher={dispatcher}
          onClose={() => setShowExportModal(false)}
          onImportBackup={(importedBookings) => {
            setBookings(importedBookings);
            setShowExportModal(false);
          }}
        />
      )}

      {/* Dispatcher Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                कंपनी व डिस्पैचर प्रोफ़ाइल सेटिंग्स
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">कंपनी का नाम</label>
                <input
                  type="text"
                  value={tempDispatcher.companyName}
                  onChange={(e) => setTempDispatcher({ ...tempDispatcher, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">टैगलाइन / सेवा विवरण</label>
                <input
                  type="text"
                  value={tempDispatcher.tagline}
                  onChange={(e) => setTempDispatcher({ ...tempDispatcher, tagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={tempDispatcher.gstin}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, gstin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">PAN नंबर</label>
                  <input
                    type="text"
                    value={tempDispatcher.pan}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, pan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">कंट्रोल रूम 24x7 हेल्पलाइन</label>
                  <input
                    type="text"
                    value={tempDispatcher.supportPhone}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, supportPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">ईमेल</label>
                  <input
                    type="email"
                    value={tempDispatcher.bookingEmail}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, bookingEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ऑफिस पता</label>
                <input
                  type="text"
                  value={tempDispatcher.address}
                  onChange={(e) => setTempDispatcher({ ...tempDispatcher, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">बैंक नाम व शाखा</label>
                  <input
                    type="text"
                    value={tempDispatcher.bankName || ''}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, bankName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">खाता संख्या (A/C No)</label>
                  <input
                    type="text"
                    value={tempDispatcher.bankAccountNo || ''}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, bankAccountNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">IFSC कोड</label>
                  <input
                    type="text"
                    value={tempDispatcher.ifscCode || ''}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, ifscCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">UPI आईडी</label>
                  <input
                    type="text"
                    value={tempDispatcher.upiId || ''}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, upiId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ड्यूटी स्लिप नियम व शर्तें</label>
                <textarea
                  rows={3}
                  value={tempDispatcher.dutySlipTerms || ''}
                  onChange={(e) => setTempDispatcher({ ...tempDispatcher, dutySlipTerms: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                रद्द करें
              </button>
              <button
                onClick={() => {
                  setDispatcher(tempDispatcher);
                  setShowSettingsModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                प्रोफाइल सेव करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

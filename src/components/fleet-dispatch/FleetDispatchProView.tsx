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
import { initialDispatcherProfile } from '../../utils/dispatchSampleData';
import {
  loadSavedDirectory,
  saveCustomTariffPackages,
  saveDirectoryToStorage,
} from '../../utils/directoryStorage';
import {
  bulkImportDispatchBookingsApi,
  createDispatchBookingApi,
  deleteDispatchBookingApi,
  fetchDispatchBookings,
  fetchDispatchDirectory,
  fetchDispatchProfile,
  fetchDispatchTariffs,
  updateDispatchBookingApi,
  updateDispatchDirectoryApi,
  updateDispatchProfileApi,
} from '../../api/dispatchClient';
import { getStoredAuthToken } from '../../api/authClient';
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
  Loader2,
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
  const [dispatcher, setDispatcher] = useState<DispatcherProfile>(() => {
    try {
      const saved = localStorage.getItem('fleetdispatch_dispatcher_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return initialDispatcherProfile;
  });

  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('fleetdispatch_bookings_master');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [];
  });

  const [savedDirectory, setSavedDirectory] = useState<SavedDirectory>(() => {
    return loadSavedDirectory(bookings);
  });

  const [loadingApi, setLoadingApi] = useState(false);
  const [apiError, setApiError] = useState('');

  // Hydrate from central API once authenticated
  useEffect(() => {
    if (!getStoredAuthToken()) return;
    let cancelled = false;
    (async () => {
      setLoadingApi(true);
      try {
        const [apiBookings, apiProfile, apiDirectory, apiTariffs] = await Promise.all([
          fetchDispatchBookings(),
          fetchDispatchProfile(),
          fetchDispatchDirectory(),
          fetchDispatchTariffs(),
        ]);

        if (cancelled) return;
        setBookings(apiBookings);
        localStorage.setItem('fleetdispatch_bookings_master', JSON.stringify(apiBookings));
        setDispatcher(apiProfile);
        localStorage.setItem('fleetdispatch_dispatcher_profile', JSON.stringify(apiProfile));
        setSavedDirectory(apiDirectory);
        saveDirectoryToStorage(apiDirectory);
        if (apiTariffs.length > 0) saveCustomTariffPackages(apiTariffs);
        setApiError('');
      } catch (err: unknown) {
        if (!cancelled) {
          setApiError(err instanceof Error ? err.message : 'Could not load Fleet Dispatch from server.');
        }
      } finally {
        if (!cancelled) setLoadingApi(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Merge ERP vehicles, drivers, and officers into savedDirectory (local UX helper)
  useEffect(() => {
    setSavedDirectory((prev) => {
      const updated = { ...prev };
      let changed = false;

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

      erpDrivers.forEach((d) => {
        if (d.name && !updated.drivers.some((ex) => ex.name === d.name)) {
          updated.drivers.push({
            name: d.name,
            phone: d.phone || '',
          });
          changed = true;
        }
      });

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
        if (getStoredAuthToken()) {
          void updateDispatchDirectoryApi(updated).catch(() => undefined);
        }
        return updated;
      }
      return prev;
    });
  }, [erpVehicles, erpDrivers, erpOfficers]);

  useEffect(() => {
    try {
      localStorage.setItem('fleetdispatch_bookings_master', JSON.stringify(bookings));
    } catch {
      /* ignore */
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem('fleetdispatch_dispatcher_profile', JSON.stringify(dispatcher));
    } catch {
      /* ignore */
    }
  }, [dispatcher]);

  const [activeTab, setActiveTab] = useState<
    'register' | 'new-booking' | 'analytics' | 'finance' | 'gps-relay' | 'whatsapp' | 'directory'
  >('register');
  const [selectedBookingForSlip, setSelectedBookingForSlip] = useState<BookingRecord | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [tempDispatcher, setTempDispatcher] = useState<DispatcherProfile>(dispatcher);

  const handleCreateBooking = async (newRecord: BookingRecord) => {
    const snapshot = bookings;
    setBookings((prev) => [newRecord, ...prev]);
    setActiveTab('register');
    try {
      const saved = await createDispatchBookingApi(newRecord);
      setBookings((prev) => [
        saved,
        ...prev.filter((b) => b.id !== saved.id && b.id !== newRecord.id),
      ]);
      setApiError('');
    } catch (err: unknown) {
      setBookings(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save booking.';
      setApiError(msg);
      alert(msg);
    }
  };

  const handleUpdateBooking = async (updatedRecord: BookingRecord) => {
    const snapshot = bookings;
    setBookings((prev) => prev.map((b) => (b.id === updatedRecord.id ? updatedRecord : b)));
    try {
      const saved = await updateDispatchBookingApi(updatedRecord.id, updatedRecord);
      setBookings((prev) => prev.map((b) => (b.id === saved.id ? saved : b)));
      setApiError('');
    } catch (err: unknown) {
      setBookings(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not update booking.';
      setApiError(msg);
      alert(msg);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm('क्या आप इस ड्यूटी रिकॉर्ड को रजिस्टर से हटाना चाहते हैं?')) return;
    const snapshot = bookings;
    setBookings((prev) => prev.filter((b) => b.id !== id));
    try {
      await deleteDispatchBookingApi(id);
      setApiError('');
    } catch (err: unknown) {
      setBookings(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not delete booking.';
      setApiError(msg);
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {(loadingApi || apiError) && (
        <div
          className={`panel panel-pad flex items-center gap-2 text-sm ${
            apiError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'text-[var(--color-muted)]'
          }`}
        >
          {loadingApi && <Loader2 className="h-4 w-4 animate-spin" />}
          {loadingApi ? 'Loading Fleet Dispatch from central system…' : apiError}
        </div>
      )}
      {/* Fleet Dispatch Pro Sub-Navigation Header */}
      <div className="panel panel-pad">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--color-line)] pb-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-ink)] text-teal-300">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--color-ink)]">
                  फ्लीट डिस्पैच प्रो (Fleet Dispatch Pro)
                </h1>
                <span className="badge badge-success">v2.5 Enterprise</span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                {dispatcher.companyName} | 3-पार्टी ड्यूटी बुकिंग, 1-क्लिक व्हाट्सएप स्लिप, लाइव GPS व टैक्स इनवॉइस
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setTempDispatcher(dispatcher);
                setShowSettingsModal(true);
              }}
              className="btn btn-secondary shrink-0 whitespace-nowrap !text-xs"
              title="कंपनी व डिस्पैचर प्रोफाइल सेटिंग्स"
            >
              <Settings className="h-3.5 w-3.5" />
              प्रोफ़ाइल सेटिंग्स
            </button>

            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="btn btn-secondary shrink-0 whitespace-nowrap !text-xs"
              title="1-क्लिक HTML व JSON बैकअप डाउनलोड करें"
            >
              <Download className="h-3.5 w-3.5" />
              एक्सपोर्ट व बैकअप
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('new-booking')}
              className="btn btn-primary shrink-0 whitespace-nowrap !text-xs"
            >
              <Plus className="h-4 w-4" />
              नई बुकिंग (New Duty)
            </button>
          </div>
        </div>

        <div className="segmented mt-3 overflow-x-auto scrollbar-none">
          {(
            [
              { id: 'register' as const, icon: <FileSpreadsheet className="h-4 w-4" />, label: 'मास्टर ड्यूटी रजिस्टर', count: bookings.length },
              { id: 'new-booking' as const, icon: <Plus className="h-4 w-4" />, label: 'नई बुकिंग फॉर्म' },
              { id: 'analytics' as const, icon: <TrendingUp className="h-4 w-4" />, label: 'केपीआई डैशबोर्ड' },
              { id: 'finance' as const, icon: <IndianRupee className="h-4 w-4" />, label: 'वित्तीय ऑडिट व GST' },
              { id: 'gps-relay' as const, icon: <Radio className="h-4 w-4" />, label: 'लाइव GPS रिले' },
              { id: 'whatsapp' as const, icon: <MessageCircle className="h-4 w-4" />, label: 'व्हाट्सएप स्लिप स्टूडियो' },
              { id: 'directory' as const, icon: <Users className="h-4 w-4" />, label: 'सेव्ड डायरेक्टरी' },
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'whatsapp' && !selectedBookingForSlip && bookings.length > 0) {
                  setSelectedBookingForSlip(bookings[0]);
                }
                setActiveTab(tab.id);
              }}
              className={`segmented-btn inline-flex shrink-0 items-center gap-2 ${activeTab === tab.id ? 'is-active' : ''}`}
            >
              {tab.icon}
              {tab.label}
              {'count' in tab && tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                    activeTab === tab.id
                      ? 'bg-teal-700 text-white'
                      : 'bg-[var(--color-sand-deep)] text-[var(--color-ink-soft)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
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
              if (getStoredAuthToken()) {
                void updateDispatchDirectoryApi(updated)
                  .then((saved) => {
                    setSavedDirectory(saved);
                    saveDirectoryToStorage(saved);
                  })
                  .catch((err: unknown) => {
                    alert(err instanceof Error ? err.message : 'Could not save directory.');
                  });
              }
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
            if (getStoredAuthToken() && importedBookings.length > 0) {
              void bulkImportDispatchBookingsApi(importedBookings)
                .then((saved) => setBookings(saved))
                .catch((err: unknown) => {
                  alert(err instanceof Error ? err.message : 'Could not import bookings to server.');
                });
            }
          }}
        />
      )}

      {/* Dispatcher Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-[var(--color-ink)]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="panel panel-pad w-full max-w-xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
              <h3 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-700" />
                कंपनी व डिस्पैचर प्रोफ़ाइल सेटिंग्स
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--color-sand-deep)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[var(--color-muted)] block mb-1">कंपनी का नाम</label>
                <input
                  type="text"
                  value={tempDispatcher.companyName}
                  onChange={(e) => setTempDispatcher({ ...tempDispatcher, companyName: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)]"
                />
              </div>

              <div>
                <label className="text-[var(--color-muted)] block mb-1">टैगलाइन / सेवा विवरण</label>
                <input
                  type="text"
                  value={tempDispatcher.tagline}
                  onChange={(e) => setTempDispatcher({ ...tempDispatcher, tagline: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--color-muted)] block mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={tempDispatcher.gstin}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, gstin: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[var(--color-muted)] block mb-1">PAN नंबर</label>
                  <input
                    type="text"
                    value={tempDispatcher.pan}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, pan: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--color-muted)] block mb-1">कंट्रोल रूम 24x7 हेल्पलाइन</label>
                  <input
                    type="text"
                    value={tempDispatcher.supportPhone}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, supportPhone: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[var(--color-muted)] block mb-1">ईमेल</label>
                  <input
                    type="email"
                    value={tempDispatcher.bookingEmail}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, bookingEmail: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[var(--color-muted)] block mb-1">ऑफिस पता</label>
                <input
                  type="text"
                  value={tempDispatcher.address}
                  onChange={(e) => setTempDispatcher({ ...tempDispatcher, address: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--color-muted)] block mb-1">बैंक नाम व शाखा</label>
                  <input
                    type="text"
                    value={tempDispatcher.bankName || ''}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, bankName: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--color-muted)] block mb-1">खाता संख्या (A/C No)</label>
                  <input
                    type="text"
                    value={tempDispatcher.bankAccountNo || ''}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, bankAccountNo: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--color-muted)] block mb-1">IFSC कोड</label>
                  <input
                    type="text"
                    value={tempDispatcher.ifscCode || ''}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, ifscCode: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[var(--color-muted)] block mb-1">UPI आईडी</label>
                  <input
                    type="text"
                    value={tempDispatcher.upiId || ''}
                    onChange={(e) => setTempDispatcher({ ...tempDispatcher, upiId: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[var(--color-muted)] block mb-1">ड्यूटी स्लिप नियम व शर्तें</label>
                <textarea
                  rows={3}
                  value={tempDispatcher.dutySlipTerms || ''}
                  onChange={(e) => setTempDispatcher({ ...tempDispatcher, dutySlipTerms: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-line)] bg-white p-2 text-[var(--color-ink)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-line)]">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-secondary text-xs"
              >
                रद्द करें
              </button>
              <button
                onClick={() => {
                  void (async () => {
                    try {
                      const saved = getStoredAuthToken()
                        ? await updateDispatchProfileApi(tempDispatcher)
                        : tempDispatcher;
                      setDispatcher(saved);
                      setShowSettingsModal(false);
                      setApiError('');
                    } catch (err: unknown) {
                      alert(err instanceof Error ? err.message : 'Could not save dispatcher profile.');
                    }
                  })();
                }}
                className="btn btn-success text-xs"
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

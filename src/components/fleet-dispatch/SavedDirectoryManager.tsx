import React, { useState } from 'react';
import {
  SavedDirectory,
  ClientDetails,
  BookerDetails,
  PassengerDetails,
} from '../../types';
import {
  Building2,
  Users,
  Car,
  Briefcase,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface SavedDirectoryManagerProps {
  savedDirectory: SavedDirectory;
  onUpdateDirectory: (updated: SavedDirectory) => void;
}

export const SavedDirectoryManager: React.FC<SavedDirectoryManagerProps> = ({
  savedDirectory,
  onUpdateDirectory,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'bookers' | 'passengers' | 'vehicles' | 'drivers'>('clients');

  // Form states for adding new items
  const [showAddModal, setShowAddModal] = useState(false);

  // New Client Form
  const [clientName, setClientName] = useState('');
  const [clientGstin, setClientGstin] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientContactPerson, setClientContactPerson] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // New Booker Form
  const [bookerName, setBookerName] = useState('');
  const [bookerPhone, setBookerPhone] = useState('');
  const [bookerDesignation, setBookerDesignation] = useState('');
  const [bookerOffice, setBookerOffice] = useState('');

  // New Passenger Form
  const [paxName, setPaxName] = useState('');
  const [paxPhone, setPaxPhone] = useState('');
  const [paxDesignation, setPaxDesignation] = useState('');
  const [paxIsVIP, setPaxIsVIP] = useState(true);
  const [paxSpecialRequests, setPaxSpecialRequests] = useState('');

  // New Vehicle Form
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleClass, setVehicleClass] = useState('Sedan');

  // New Driver Form
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Handlers for Add
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    const newClient: ClientDetails = {
      id: `CLI-${Date.now().toString().slice(-4)}`,
      name: clientName.trim(),
      gstin: clientGstin.trim(),
      billingAddress: clientAddress.trim(),
      billingContactPerson: clientContactPerson.trim(),
      billingPhone: clientPhone.trim(),
    };
    onUpdateDirectory({
      ...savedDirectory,
      clients: [newClient, ...savedDirectory.clients],
    });
    setClientName('');
    setClientGstin('');
    setClientAddress('');
    setClientContactPerson('');
    setClientPhone('');
    setShowAddModal(false);
  };

  const handleAddBooker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookerName.trim()) return;
    const newBooker: BookerDetails = {
      id: `BKR-${Date.now().toString().slice(-4)}`,
      name: bookerName.trim(),
      phone: bookerPhone.trim(),
      designation: bookerDesignation.trim(),
      officeOrRoom: bookerOffice.trim(),
    };
    onUpdateDirectory({
      ...savedDirectory,
      bookers: [newBooker, ...savedDirectory.bookers],
    });
    setBookerName('');
    setBookerPhone('');
    setBookerDesignation('');
    setBookerOffice('');
    setShowAddModal(false);
  };

  const handleAddPassenger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paxName.trim()) return;
    const newPax: PassengerDetails = {
      id: `PAX-${Date.now().toString().slice(-4)}`,
      name: paxName.trim(),
      phone: paxPhone.trim(),
      designation: paxDesignation.trim(),
      isVIP: paxIsVIP,
      specialRequests: paxSpecialRequests.trim(),
    };
    onUpdateDirectory({
      ...savedDirectory,
      passengers: [newPax, ...savedDirectory.passengers],
    });
    setPaxName('');
    setPaxPhone('');
    setPaxDesignation('');
    setPaxSpecialRequests('');
    setShowAddModal(false);
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) return;
    onUpdateDirectory({
      ...savedDirectory,
      vehicles: [
        {
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          vehicleModel: vehicleModel.trim(),
          vehicleClass: vehicleClass.trim(),
        },
        ...savedDirectory.vehicles,
      ],
    });
    setVehicleNumber('');
    setVehicleModel('');
    setShowAddModal(false);
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;
    onUpdateDirectory({
      ...savedDirectory,
      drivers: [
        { name: driverName.trim(), phone: driverPhone.trim() },
        ...savedDirectory.drivers,
      ],
    });
    setDriverName('');
    setDriverPhone('');
    setShowAddModal(false);
  };

  // Delete Handlers
  const handleDeleteClient = (index: number) => {
    if (window.confirm('क्या आप इस क्लाइंट को डायरेक्टरी से हटाना चाहते हैं?')) {
      const updated = savedDirectory.clients.filter((_, i) => i !== index);
      onUpdateDirectory({ ...savedDirectory, clients: updated });
    }
  };

  const handleDeleteBooker = (index: number) => {
    if (window.confirm('क्या आप इस बुकर को डायरेक्टरी से हटाना चाहते हैं?')) {
      const updated = savedDirectory.bookers.filter((_, i) => i !== index);
      onUpdateDirectory({ ...savedDirectory, bookers: updated });
    }
  };

  const handleDeletePassenger = (index: number) => {
    if (window.confirm('क्या आप इस वीआईपी/यात्री को हटाना चाहते हैं?')) {
      const updated = savedDirectory.passengers.filter((_, i) => i !== index);
      onUpdateDirectory({ ...savedDirectory, passengers: updated });
    }
  };

  const handleDeleteVehicle = (index: number) => {
    if (window.confirm('क्या आप इस वाहन को हटाना चाहते हैं?')) {
      const updated = savedDirectory.vehicles.filter((_, i) => i !== index);
      onUpdateDirectory({ ...savedDirectory, vehicles: updated });
    }
  };

  const handleDeleteDriver = (index: number) => {
    if (window.confirm('क्या आप इस चालक को हटाना चाहते हैं?')) {
      const updated = savedDirectory.drivers.filter((_, i) => i !== index);
      onUpdateDirectory({ ...savedDirectory, drivers: updated });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                सेव्ड डायरेक्टरी मैनेजर (Saved Directory & Contacts)
              </h1>
              <p className="text-xs text-slate-400">
                सरकारी विभाग, वीआईपी अधिकारी, आवेदक, वाहन व चालक का ऑटो-सुझाव डेटाबेस
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          नया संपर्क जोड़ें (Add New)
        </button>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex flex-wrap gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveSubTab('clients')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'clients'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          सरकारी विभाग / क्लाइंट ({savedDirectory.clients.length})
        </button>

        <button
          onClick={() => setActiveSubTab('bookers')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'bookers'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          अधिकृत बुकर / पीए ({savedDirectory.bookers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('passengers')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'passengers'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          सवारी / वीआईपी अधिकारी ({savedDirectory.passengers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('vehicles')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'vehicles'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Car className="w-4 h-4" />
          फ्लीट गाड़ियां ({savedDirectory.vehicles.length})
        </button>

        <button
          onClick={() => setActiveSubTab('drivers')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'drivers'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          चालक सूची ({savedDirectory.drivers.length})
        </button>
      </div>

      {/* Directory Content List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Clients Tab */}
        {activeSubTab === 'clients' && (
          <div className="divide-y divide-slate-800">
            {savedDirectory.clients.map((c, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    {c.name}
                  </div>
                  {c.gstin && (
                    <div className="text-xs text-slate-400 font-mono">GSTIN: {c.gstin}</div>
                  )}
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {c.billingAddress}
                  </div>
                  {c.billingContactPerson && (
                    <div className="text-xs text-indigo-400">
                      संपर्क अधिकारी: {c.billingContactPerson} ({c.billingPhone || 'N/A'})
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteClient(idx)}
                  className="p-2 text-rose-400 hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                  title="हटाएं"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bookers Tab */}
        {activeSubTab === 'bookers' && (
          <div className="divide-y divide-slate-800">
            {savedDirectory.bookers.map((b, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    {b.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    पद: <span className="text-slate-200">{b.designation || 'Staff Officer'}</span> | कमरा/ऑफिस: {b.officeOrRoom || 'N/A'}
                  </div>
                  <div className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {b.phone}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteBooker(idx)}
                  className="p-2 text-rose-400 hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                  title="हटाएं"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Passengers Tab */}
        {activeSubTab === 'passengers' && (
          <div className="divide-y divide-slate-800">
            {savedDirectory.passengers.map((p, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {p.isVIP && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-bold">
                        VIP
                      </span>
                    )}
                    {p.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    पद: <span className="text-slate-200">{p.designation || 'Officer'}</span>
                  </div>
                  <div className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {p.phone}
                  </div>
                  {p.specialRequests && (
                    <div className="text-xs text-slate-500 italic">
                      निर्देश: {p.specialRequests}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeletePassenger(idx)}
                  className="p-2 text-rose-400 hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                  title="हटाएं"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Vehicles Tab */}
        {activeSubTab === 'vehicles' && (
          <div className="divide-y divide-slate-800">
            {savedDirectory.vehicles.map((v, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                <div className="space-y-1">
                  <div className="text-sm font-mono font-bold text-amber-300 flex items-center gap-2">
                    <Car className="w-4 h-4 text-amber-400" />
                    {v.vehicleNumber}
                  </div>
                  <div className="text-xs text-slate-300">
                    {v.vehicleModel} ({v.vehicleClass})
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteVehicle(idx)}
                  className="p-2 text-rose-400 hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                  title="हटाएं"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drivers Tab */}
        {activeSubTab === 'drivers' && (
          <div className="divide-y divide-slate-800">
            {savedDirectory.drivers.map((d, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    {d.name}
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    {d.phone}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteDriver(idx)}
                  className="p-2 text-rose-400 hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                  title="हटाएं"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                नया संपर्क जोड़ें ({activeSubTab.toUpperCase()})
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clients Form */}
            {activeSubTab === 'clients' && (
              <form onSubmit={handleAddClient} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">विभाग / कंपनी नाम *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. Public Works Department"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">जीएसटी नंबर (GSTIN)</label>
                  <input
                    type="text"
                    placeholder="09AAAGP1234E1Z1"
                    value={clientGstin}
                    onChange={(e) => setClientGstin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">बिलिंग पता</label>
                  <input
                    type="text"
                    placeholder="Nirman Bhawan, Lucknow"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">संपर्क अधिकारी</label>
                    <input
                      type="text"
                      placeholder="Account Officer"
                      value={clientContactPerson}
                      onChange={(e) => setClientContactPerson(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">फोन नंबर</label>
                    <input
                      type="text"
                      placeholder="0522-2234567"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold mt-4"
                >
                  क्लाइंट डायरेक्टरी में सेव करें
                </button>
              </form>
            )}

            {/* Bookers Form */}
            {activeSubTab === 'bookers' && (
              <form onSubmit={handleAddBooker} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">आवेदक / अधिकारी नाम *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. Er. Pradeep Sharma (PA)"
                    value={bookerName}
                    onChange={(e) => setBookerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">मोबाइल नंबर *</label>
                  <input
                    type="text"
                    required
                    placeholder="9415011223"
                    value={bookerPhone}
                    onChange={(e) => setBookerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">पद / पदनाम</label>
                    <input
                      type="text"
                      placeholder="Staff Officer"
                      value={bookerDesignation}
                      onChange={(e) => setBookerDesignation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">कमरा / अनुभाग</label>
                    <input
                      type="text"
                      placeholder="Room 304"
                      value={bookerOffice}
                      onChange={(e) => setBookerOffice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold mt-4"
                >
                  बुकर डायरेक्टरी में सेव करें
                </button>
              </form>
            )}

            {/* Passengers Form */}
            {activeSubTab === 'passengers' && (
              <form onSubmit={handleAddPassenger} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">सवारी / VIP नाम *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. Er. Ramesh Chandra Sharma"
                    value={paxName}
                    onChange={(e) => setPaxName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">मोबाइल नंबर *</label>
                  <input
                    type="text"
                    required
                    placeholder="9839011223"
                    value={paxPhone}
                    onChange={(e) => setPaxPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">पद / प्रोटोकॉल</label>
                  <input
                    type="text"
                    placeholder="Chief Engineer"
                    value={paxDesignation}
                    onChange={(e) => setPaxDesignation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="vip_check"
                    checked={paxIsVIP}
                    onChange={(e) => setPaxIsVIP(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                  />
                  <label htmlFor="vip_check" className="text-xs text-amber-300 font-semibold cursor-pointer">
                    वीआईपी / उच्चाधिकारी प्रोटोकॉल लागू
                  </label>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">विशेष निर्देश</label>
                  <input
                    type="text"
                    placeholder="एसी लगातार चालू रहे, पानी की बोतल..."
                    value={paxSpecialRequests}
                    onChange={(e) => setPaxSpecialRequests(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold mt-4"
                >
                  सवारी डायरेक्टरी में सेव करें
                </button>
              </form>
            )}

            {/* Vehicles Form */}
            {activeSubTab === 'vehicles' && (
              <form onSubmit={handleAddVehicle} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">गाड़ी नंबर *</label>
                  <input
                    type="text"
                    required
                    placeholder="UP32 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">मॉडल / मेक</label>
                  <input
                    type="text"
                    placeholder="Maruti Suzuki Dzire VXI"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">श्रेणी (Class)</label>
                  <select
                    value={vehicleClass}
                    onChange={(e) => setVehicleClass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  >
                    <option value="Sedan">Sedan (Dzire, Etios)</option>
                    <option value="SUV / Luxury">SUV / Luxury (Innova Crysta)</option>
                    <option value="SUV">SUV (Scorpio, Bolero)</option>
                    <option value="Premium Sedan">Premium Sedan (City, Ciaz)</option>
                    <option value="MUV 7-Seater">MUV 7-Seater (Ertiga)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold mt-4"
                >
                  गाड़ी डायरेक्टरी में सेव करें
                </button>
              </form>
            )}

            {/* Drivers Form */}
            {activeSubTab === 'drivers' && (
              <form onSubmit={handleAddDriver} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">चालक का नाम *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. राजेश कुमार यादव"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">मोबाइल नंबर *</label>
                  <input
                    type="text"
                    required
                    placeholder="9839011223"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold mt-4"
                >
                  चालक डायरेक्टरी में सेव करें
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

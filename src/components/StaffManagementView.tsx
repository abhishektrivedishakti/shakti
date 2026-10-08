import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Lock,
  Edit2,
  Check,
  X,
  Eye,
  Settings,
  UserCheck,
  Building2,
  Wallet,
  Car,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import {
  StaffUser,
  StaffRole,
  ModulePermissionKey,
} from '../types';

interface StaffManagementViewProps {
  staffUsers: StaffUser[];
  currentUser: StaffUser;
  onSaveStaffUser: (user: StaffUser) => void;
  onSwitchUser: (user: StaffUser) => void;
}

const MODULE_DEFINITIONS: { key: ModulePermissionKey; label: string; hindiLabel: string; desc: string }[] = [
  { key: 'dashboard', label: 'Executive Dashboard', hindiLabel: 'मुख्य डैशबोर्ड', desc: 'अवलोकन, मुख्य आंकड़े व जरूरी सूचनाएं' },
  { key: 'tenders', label: 'Govt Tenders & SLAs', hindiLabel: 'टेंडर व अनुबंध', desc: 'सरकारी टेंडर, नियम व कॉन्ट्रैक्ट दस्तावेज' },
  { key: 'vehicles_officers', label: 'Vehicles & Officers', hindiLabel: 'गाड़ियां व अधिकारी', desc: 'गाड़ी अलॉटमेंट, तबादला व ड्राइवर बदलाव' },
  { key: 'logbook', label: 'Daily Duty Log Book', hindiLabel: 'दैनिक लॉग बुक', desc: 'किलोमीटर, समय, ड्यूटी स्लिप व अफसर हस्ताक्षर' },
  { key: 'billing', label: 'Govt Billing & Claims', hindiLabel: 'सरकारी मासिक बिलिंग', desc: 'मासिक बिल, अतिरिक्त KM/घंटे व GST/TDS' },
  { key: 'drivers_khata', label: 'Drivers Khata & Advances', hindiLabel: 'ड्राइवर खाता व पेशगी', desc: 'ड्राइवर वेतन, नकद पेशगी व सैलरी स्लिप' },
  { key: 'fuel_manager', label: 'Fuel & Petrol Pumps', hindiLabel: 'ईंधन व पेट्रोल पंप', desc: 'डीजल पर्चियां, पंप हिसाब व फिक्स बजट' },
  { key: 'maintenance', label: 'Fleet Maintenance', hindiLabel: 'वर्कशॉप व मेंटेनेंस', desc: 'सर्विसिंग, मरम्मत व स्पेयर पार्ट्स खर्च' },
  { key: 'daily_payments', label: 'Daily Payments Journal', hindiLabel: 'दैनिक भुगतान रोजिनामचा', desc: 'ड्राइवर, पंप, वर्कशॉप व वेंडर भुगतान' },
  { key: 'attached_vendors', label: 'Attached Fleet & Vendors', hindiLabel: 'अटैच फ्लीट व वेंडर', desc: 'बाजार की गाड़ियां, किराया व हिसाब' },
  { key: 'statutory_payroll', label: 'Statutory Labour Compliance', hindiLabel: 'श्रम कानून व EPF/ESIC', desc: 'न्यूनतम मजदूरी, पीएफ चालान व बोनस' },
  { key: 'petty_cash', label: 'Petty Cash & Field Expenses', hindiLabel: 'पेटी कैश व फुटकर खर्च', desc: 'लड़कों को नकद अग्रिम, पंचर, एक्सेसरीज' },
  { key: 'reminders', label: 'Expiry & Reminders Center', hindiLabel: 'दस्तावेज चेतावनी', desc: 'फिटनेस, बीमा, प्रदूषण व टैक्स नवीनीकरण' },
  { key: 'staff_management', label: 'Staff & Role Permissions', hindiLabel: 'स्टाफ व अनुमतियां', desc: 'नया स्टाफ जोड़ना व परमिशन कंट्रोल' },
];

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staffUsers,
  currentUser,
  onSaveStaffUser,
  onSwitchUser,
}) => {
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<StaffUser | null>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);

  // New Staff Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffDesig, setNewStaffDesig] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('office_boy_cashier');
  const [newStaffMobile, setNewStaffMobile] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('1234');
  const [newStaffColor, setNewStaffColor] = useState('bg-indigo-600');

  // Permission Matrix Preset helper
  const applyRolePreset = (role: StaffRole, currentPerms: StaffUser['permissions']) => {
    const updated = { ...currentPerms };
    MODULE_DEFINITIONS.forEach((mod) => {
      if (role === 'admin') {
        updated[mod.key] = { canView: true, canEdit: true };
      } else if (role === 'fleet_manager') {
        const allowed = ['dashboard', 'vehicles_officers', 'logbook', 'fuel_manager', 'maintenance', 'reminders', 'petty_cash'];
        const isAllowed = allowed.includes(mod.key);
        updated[mod.key] = { canView: isAllowed, canEdit: isAllowed };
      } else if (role === 'accountant') {
        const allowed = ['dashboard', 'billing', 'daily_payments', 'drivers_khata', 'attached_vendors', 'statutory_payroll', 'petty_cash'];
        const isAllowed = allowed.includes(mod.key);
        updated[mod.key] = { canView: isAllowed, canEdit: isAllowed };
      } else if (role === 'office_boy_cashier') {
        const allowed = ['petty_cash', 'fuel_manager', 'logbook'];
        const isAllowed = allowed.includes(mod.key);
        updated[mod.key] = { canView: isAllowed, canEdit: isAllowed && mod.key !== 'logbook' };
      } else if (role === 'billing_clerk') {
        const allowed = ['dashboard', 'logbook', 'billing', 'tenders'];
        const isAllowed = allowed.includes(mod.key);
        updated[mod.key] = { canView: isAllowed, canEdit: mod.key === 'billing' || mod.key === 'logbook' };
      }
    });
    return updated;
  };

  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffMobile.trim()) {
      alert('स्टाफ सदस्य का नाम और मोबाइल नंबर आवश्यक है।');
      return;
    }

    const defaultPerms: any = {};
    MODULE_DEFINITIONS.forEach((m) => {
      defaultPerms[m.key] = { canView: false, canEdit: false };
    });
    const presetPerms = applyRolePreset(newStaffRole, defaultPerms);

    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      name: newStaffName.trim(),
      designation: newStaffDesig.trim() || 'Staff Member',
      role: newStaffRole,
      mobile: newStaffMobile.trim(),
      email: newStaffEmail.trim(),
      pin: newStaffPin.trim() || '1234',
      avatarColor: newStaffColor,
      status: 'active',
      permissions: presetPerms,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onSaveStaffUser(newStaff);
    setIsAddStaffModalOpen(false);
    setNewStaffName('');
    setNewStaffDesig('');
    setNewStaffMobile('');
    setNewStaffEmail('');
    setNewStaffPin('1234');
  };

  const handleSavePermissionEdit = () => {
    if (selectedStaffForEdit) {
      onSaveStaffUser(selectedStaffForEdit);
      setSelectedStaffForEdit(null);
    }
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'admin':
        return { label: 'मालिक / मुख्य प्रशासक (Admin)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'fleet_manager':
        return { label: 'फ्लीट मैनेजर (Fleet Operations)', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'accountant':
        return { label: 'मुंशी / लेखाकार (Accountant)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'office_boy_cashier':
        return { label: 'पेटी कैश / ऑफिस बॉय (Cashier)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'billing_clerk':
        return { label: 'सरकारी बिलिंग क्लर्क (Billing)', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: 'कस्टम स्टाफ (Custom Staff)', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span>Staff Accounts &amp; Role-Based Access Control (RBAC) &bull; स्टाफ व अनुमति नियंत्रण</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            कार्यालय के प्रत्येक कर्मचारी (एडमिन, मुंशी, फ्लीट मैनेजर, पेटी कैश बॉय) का अलग खाता बनाएं और तय करें कि वह कौन से टैब देख व भर सकता है
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            + नया स्टाफ जोड़ें (Add Staff Member)
          </button>
        </div>
      </div>

      {/* Staff User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staffUsers.map((staff) => {
          const roleInfo = getRoleBadge(staff.role);
          const isCurrent = currentUser.id === staff.id;
          const accessibleModulesCount = Object.values(staff.permissions || {}).filter((p) => p.canView).length;

          return (
            <div
              key={staff.id}
              className={`bg-white rounded-xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                isCurrent ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-5">
                {/* Header with Avatar & Active Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full ${staff.avatarColor || 'bg-indigo-600'} text-white font-bold flex items-center justify-center text-sm shadow-2xs`}
                    >
                      {staff.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{staff.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                            सक्रिय (Logged In)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{staff.designation}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      staff.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {staff.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Role Pill */}
                <div className="mt-3">
                  <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>

                {/* Contact & PIN Details */}
                <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Phone className="w-3 h-3" /> मोबाइल:
                    </span>
                    <span className="font-mono font-semibold text-slate-800">{staff.mobile}</span>
                  </div>

                  {staff.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Mail className="w-3 h-3" /> ईमेल:
                      </span>
                      <span className="text-slate-700 truncate max-w-[170px]">{staff.email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Key className="w-3 h-3" /> 4-Digit Login PIN:
                    </span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-200">
                      {staff.pin}
                    </span>
                  </div>
                </div>

                {/* Accessible Modules Summary */}
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span>अनुमतियां (Permitted Modules):</span>
                    <span className="font-bold text-indigo-700">
                      {staff.role === 'admin' ? '14 / 14 (All Access)' : `${accessibleModulesCount} / 14 Modules`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {MODULE_DEFINITIONS.filter((m) => staff.role === 'admin' || staff.permissions?.[m.key]?.canView).slice(0, 6).map((m) => (
                      <span key={m.key} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {m.hindiLabel}
                      </span>
                    ))}
                    {accessibleModulesCount > 6 && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                        +{accessibleModulesCount - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                <button
                  onClick={() => setSelectedStaffForEdit(staff)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-lg flex items-center gap-1 shadow-2xs text-[11px]"
                >
                  <Settings className="w-3 h-3 text-indigo-600" />
                  अनुमतियां बदलें (Permissions)
                </button>

                {!isCurrent ? (
                  <button
                    onClick={() => onSwitchUser(staff)}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-2xs text-[11px] flex items-center gap-1"
                  >
                    <UserCheck className="w-3 h-3" />
                    इस रूप में लॉगिन करें &rarr;
                  </button>
                ) : (
                  <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> एक्टिव सेशन
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Edit Permissions for Staff Member */}
      {selectedStaffForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <span>अनुमति नियंत्रण (Permissions Matrix): {selectedStaffForEdit.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  तय करें कि यह स्टाफ कौन-कौन सा मॉड्यूल देख सकता है व नया डाटा दर्ज/एडिट कर सकता है
                </p>
              </div>
              <button
                onClick={() => setSelectedStaffForEdit(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Role Preset Quick Switcher */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1.5 text-[11px] uppercase">
                  त्वरित रोल प्रीसेट लागू करें (Apply Role Preset):
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['admin', 'fleet_manager', 'accountant', 'office_boy_cashier', 'billing_clerk'] as StaffRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        const updated = applyRolePreset(r, selectedStaffForEdit.permissions);
                        setSelectedStaffForEdit({
                          ...selectedStaffForEdit,
                          role: r,
                          permissions: updated,
                        });
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                        selectedStaffForEdit.role === r
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {r === 'admin'
                        ? 'Admin (Full)'
                        : r === 'fleet_manager'
                        ? 'Fleet Manager'
                        : r === 'accountant'
                        ? 'Accountant'
                        : r === 'office_boy_cashier'
                        ? 'Office Boy / Cashier'
                        : 'Billing Clerk'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Module Checklist Matrix */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-3">मॉड्यूल / विभाग (Module)</th>
                      <th className="p-3 text-center w-24">देखें (Can View)</th>
                      <th className="p-3 text-center w-24">एडिट करें (Can Edit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MODULE_DEFINITIONS.map((m) => {
                      const perm = selectedStaffForEdit.permissions?.[m.key] || { canView: false, canEdit: false };

                      return (
                        <tr key={m.key} className="hover:bg-slate-50/80">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{m.hindiLabel} ({m.label})</div>
                            <div className="text-[11px] text-slate-500">{m.desc}</div>
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.canView}
                              onChange={(e) => {
                                const newPerms = {
                                  ...selectedStaffForEdit.permissions,
                                  [m.key]: {
                                    canView: e.target.checked,
                                    canEdit: e.target.checked ? perm.canEdit : false,
                                  },
                                };
                                setSelectedStaffForEdit({ ...selectedStaffForEdit, permissions: newPerms });
                              }}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.canEdit}
                              disabled={!perm.canView}
                              onChange={(e) => {
                                const newPerms = {
                                  ...selectedStaffForEdit.permissions,
                                  [m.key]: {
                                    ...perm,
                                    canEdit: e.target.checked,
                                  },
                                };
                                setSelectedStaffForEdit({ ...selectedStaffForEdit, permissions: newPerms });
                              }}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-30"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Login PIN & Status Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    4-Digit Login PIN (लॉगिन पिन):
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={selectedStaffForEdit.pin}
                    onChange={(e) => setSelectedStaffForEdit({ ...selectedStaffForEdit, pin: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    खाता स्थिति (Account Status):
                  </label>
                  <select
                    value={selectedStaffForEdit.status}
                    onChange={(e) => setSelectedStaffForEdit({ ...selectedStaffForEdit, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="active">Active (सक्रिय)</option>
                    <option value="inactive">Inactive (निलंबित / बंद)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStaffForEdit(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissionEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-2xs"
                >
                  अनुमतियां सुरक्षित करें (Save Permissions)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add New Staff Member */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>नया स्टाफ सदस्य जोड़ें (Add Staff User)</span>
              </h3>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateStaffSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    स्टाफ का नाम (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. सोनू पाल"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    पदनाम (Designation) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Boy / Field Assistant"
                    value={newStaffDesig}
                    onChange={(e) => setNewStaffDesig(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    रोल / पद (Role Preset) *
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="office_boy_cashier">ऑफिस बॉय / पेटी कैश बॉय (Office Boy)</option>
                    <option value="fleet_manager">फ्लीट मैनेजर (Fleet Operations)</option>
                    <option value="accountant">मुंशी / अकाउंटेंट (Accounts)</option>
                    <option value="billing_clerk">बिलिंग क्लर्क (Billing Clerk)</option>
                    <option value="field_supervisor">फील्ड सुपरवाइजर (Supervisor)</option>
                    <option value="admin">मालिक / एडमिन (Full Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    4-Digit Login PIN *
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="e.g. 1234"
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    मोबाइल नंबर (Mobile) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9838012345"
                    value={newStaffMobile}
                    onChange={(e) => setNewStaffMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ईमेल (Email ID - Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. staff@sarkarifleet.in"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  अवतार रंग (Badge Color):
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { color: 'bg-indigo-600', label: 'Indigo' },
                    { color: 'bg-blue-600', label: 'Blue' },
                    { color: 'bg-emerald-600', label: 'Green' },
                    { color: 'bg-amber-600', label: 'Amber' },
                    { color: 'bg-purple-600', label: 'Purple' },
                    { color: 'bg-rose-600', label: 'Rose' },
                  ].map((c) => (
                    <div
                      key={c.color}
                      onClick={() => setNewStaffColor(c.color)}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${c.color} ${
                        newStaffColor === c.color ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                💡 <strong>नोट:</strong> स्टाफ सदस्य को रोल के अनुसार स्वतः अनुमतियां मिलेंगी। बाद में आप 'अनुमतियां बदलें' बटन से किसी भी मॉड्यूल को ऑन/ऑफ कर सकते हैं।
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-2xs"
                >
                  स्टाफ खाता बनाएं (Create Account)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import type { ModulePermissionKey, StaffRole } from '../../src/types';

export type PermissionsMap = Record<ModulePermissionKey, { canView: boolean; canEdit: boolean }>;

export const MODULE_KEYS: ModulePermissionKey[] = [
  'dashboard',
  'company_documents',
  'tenders',
  'vehicles_officers',
  'logbook',
  'billing',
  'drivers_khata',
  'fuel_manager',
  'maintenance',
  'daily_payments',
  'attached_vendors',
  'statutory_payroll',
  'petty_cash',
  'fleet_dispatch',
  'reminders',
  'staff_management',
];

function blankPermissions(canView = false, canEdit = false): PermissionsMap {
  return MODULE_KEYS.reduce((acc, key) => {
    acc[key] = { canView, canEdit };
    return acc;
  }, {} as PermissionsMap);
}

export function fullAdminPermissions(): PermissionsMap {
  return blankPermissions(true, true);
}

export function defaultStaffPermissions(): PermissionsMap {
  const base = blankPermissions(false, false);
  base.dashboard = { canView: true, canEdit: false };
  base.company_documents = { canView: true, canEdit: false };
  base.reminders = { canView: true, canEdit: false };
  return base;
}

export function permissionsForRole(role: StaffRole): PermissionsMap {
  if (role === 'admin') return fullAdminPermissions();

  const base = blankPermissions(false, false);

  const allow = (keys: ModulePermissionKey[], editKeys?: ModulePermissionKey[]) => {
    keys.forEach((k) => {
      base[k] = { canView: true, canEdit: editKeys ? editKeys.includes(k) : true };
    });
  };

  switch (role) {
    case 'fleet_manager':
      allow([
        'dashboard',
        'company_documents',
        'vehicles_officers',
        'logbook',
        'fuel_manager',
        'maintenance',
        'reminders',
        'petty_cash',
        'drivers_khata',
        'attached_vendors',
        'fleet_dispatch',
      ]);
      base.dashboard = { canView: true, canEdit: false };
      base.company_documents = { canView: true, canEdit: false };
      base.reminders = { canView: true, canEdit: false };
      break;
    case 'accountant':
      allow([
        'dashboard',
        'billing',
        'daily_payments',
        'drivers_khata',
        'attached_vendors',
        'statutory_payroll',
        'petty_cash',
        'fuel_manager',
        'company_documents',
        'reminders',
      ]);
      base.dashboard = { canView: true, canEdit: false };
      break;
    case 'field_supervisor':
      allow([
        'dashboard',
        'vehicles_officers',
        'logbook',
        'fuel_manager',
        'maintenance',
        'petty_cash',
        'drivers_khata',
        'reminders',
      ]);
      base.dashboard = { canView: true, canEdit: false };
      break;
    case 'office_boy_cashier':
      allow(['petty_cash', 'fuel_manager', 'logbook', 'dashboard'], ['petty_cash', 'fuel_manager']);
      base.dashboard = { canView: true, canEdit: false };
      base.logbook = { canView: true, canEdit: false };
      break;
    case 'billing_clerk':
      allow(['dashboard', 'logbook', 'billing', 'tenders', 'reminders'], ['billing', 'logbook']);
      base.dashboard = { canView: true, canEdit: false };
      base.tenders = { canView: true, canEdit: false };
      base.reminders = { canView: true, canEdit: false };
      break;
    case 'custom':
    default:
      return defaultStaffPermissions();
  }

  return base;
}

export const ROLE_TEMPLATES: Array<{
  role: StaffRole;
  label: string;
  description: string;
}> = [
  { role: 'admin', label: 'Admin', description: 'Full access to every module' },
  { role: 'fleet_manager', label: 'Fleet Manager', description: 'Vehicles, logs, fuel, maintenance' },
  { role: 'accountant', label: 'Accountant', description: 'Billing, payments, khata, payroll' },
  { role: 'field_supervisor', label: 'Field Supervisor', description: 'Field ops, fuel, petty cash' },
  { role: 'office_boy_cashier', label: 'Cashier / Office Boy', description: 'Petty cash and fuel slips' },
  { role: 'billing_clerk', label: 'Billing Clerk', description: 'Logbook and government billing' },
  { role: 'custom', label: 'Custom', description: 'Manually assigned permissions' },
];

export function normalizePermissions(input: unknown): PermissionsMap {
  const base = defaultStaffPermissions();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Record<string, { canView?: boolean; canEdit?: boolean }>;
  for (const key of MODULE_KEYS) {
    if (raw[key]) {
      base[key] = {
        canView: Boolean(raw[key].canView),
        canEdit: Boolean(raw[key].canEdit),
      };
    }
  }
  return base;
}

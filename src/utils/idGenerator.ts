import { Driver, Vendor, Officer } from '../types';

/**
 * Extracts numeric parts from strings like 'DRV-105', 'drv-42', 'VND-OD-102'
 */
function extractMaxNumber(items: Array<{ id: string; code?: string }>, prefixPattern: RegExp): number {
  let max = 0;
  items.forEach((item) => {
    const candidates = [item.code, item.id].filter(Boolean) as string[];
    candidates.forEach((str) => {
      const match = str.match(prefixPattern);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > max) {
          max = num;
        }
      } else {
        // Fallback: match any digits
        const numMatch = str.match(/(\d+)/);
        if (numMatch && numMatch[1]) {
          const num = parseInt(numMatch[1], 10);
          if (!isNaN(num) && num > max && num < 1000000000) { // skip raw timestamps
            max = num;
          }
        }
      }
    });
  });
  return max;
}

/**
 * Generates an authentic Unique Driver Code (अद्वितीय चालक कोड)
 * Format: DRV-101, DRV-102, DRV-103...
 */
export function generateDriverUniqueId(existingDrivers: Driver[] = []): string {
  const max = extractMaxNumber(
    existingDrivers.map((d) => ({ id: d.id, code: d.driverCode })),
    /drv(?:-|\s*)(\d+)/i
  );

  const startBase = max >= 100 ? max + 1 : Math.max(101, max + 1);
  let candidate = `DRV-${startBase}`;
  let counter = startBase;

  // Verify candidate is 100% unique in existing list
  const existingSet = new Set(
    existingDrivers.flatMap((d) => [d.id.toUpperCase(), (d.driverCode || '').toUpperCase()]).filter(Boolean)
  );

  while (existingSet.has(candidate.toUpperCase())) {
    counter++;
    candidate = `DRV-${counter}`;
  }

  return candidate;
}

/**
 * Generates an authentic Unique Vendor Code (अद्वितीय वेंडर कोड)
 * Format: 
 * - Regular/Fleet: VND-101, VND-102...
 * - Owner-Driver: VND-OD-101, VND-OD-102...
 * - Fuel Pump: VND-FP-101...
 */
export function generateVendorUniqueId(
  existingVendors: Vendor[] = [],
  vendorType: string = 'fleet_vendor'
): string {
  const isOwnerDriver = vendorType === 'owner_driver';
  const isFuel = vendorType === 'fuel_vendor';

  const prefix = isOwnerDriver ? 'VND-OD' : isFuel ? 'VND-FP' : 'VND';
  const pattern = new RegExp(`${prefix}(?:-|\\s*)(\\d+)`, 'i');

  const max = extractMaxNumber(
    existingVendors.map((v) => ({ id: v.id, code: v.vendorCode })),
    pattern
  );

  const startBase = max >= 100 ? max + 1 : Math.max(101, max + 1);
  let candidate = `${prefix}-${startBase}`;
  let counter = startBase;

  const existingSet = new Set(
    existingVendors.flatMap((v) => [v.id.toUpperCase(), (v.vendorCode || '').toUpperCase()]).filter(Boolean)
  );

  while (existingSet.has(candidate.toUpperCase())) {
    counter++;
    candidate = `${prefix}-${counter}`;
  }

  return candidate;
}

/**
 * Generates an authentic Unique Officer Code (अद्वितीय सरकारी अधिकारी कोड)
 * Format: OFF-101, OFF-102...
 */
export function generateOfficerUniqueId(existingOfficers: Officer[] = []): string {
  const max = extractMaxNumber(
    existingOfficers.map((o) => ({ id: o.id, code: o.officerCode })),
    /off(?:-|\s*)(\d+)/i
  );

  const startBase = max >= 100 ? max + 1 : Math.max(101, max + 1);
  let candidate = `OFF-${startBase}`;
  let counter = startBase;

  const existingSet = new Set(
    existingOfficers.flatMap((o) => [o.id.toUpperCase(), (o.officerCode || '').toUpperCase()]).filter(Boolean)
  );

  while (existingSet.has(candidate.toUpperCase())) {
    counter++;
    candidate = `OFF-${counter}`;
  }

  return candidate;
}

/**
 * Formats a clean driver display code
 */
export function getDriverDisplayCode(driver?: Partial<Driver> | null): string {
  if (!driver) return 'DRV-??';
  if (driver.driverCode) return driver.driverCode;
  if (driver.id) {
    if (driver.id.startsWith('drv-') || driver.id.startsWith('DRV-')) {
      const num = driver.id.replace(/^[a-zA-Z-]+/, '');
      if (num && num.length < 8) return `DRV-${num}`;
    }
    return driver.id.toUpperCase().slice(0, 10);
  }
  return 'DRV-??';
}

/**
 * Formats a clean vendor display code
 */
export function getVendorDisplayCode(vendor?: Partial<Vendor> | null): string {
  if (!vendor) return 'VND-??';
  if (vendor.vendorCode) return vendor.vendorCode;
  if (vendor.id) {
    if (vendor.id.startsWith('vnd-') || vendor.id.startsWith('VND-')) {
      const parts = vendor.id.split('-');
      if (parts.length >= 2 && parts[parts.length - 1].length < 8) {
        return vendor.id.toUpperCase();
      }
    }
    return vendor.id.toUpperCase().slice(0, 10);
  }
  return 'VND-??';
}

/**
 * Formats a clean officer display code
 */
export function getOfficerDisplayCode(officer?: Partial<Officer> | null): string {
  if (!officer) return 'OFF-??';
  if (officer.officerCode) return officer.officerCode;
  if (officer.id) {
    if (officer.id.startsWith('off-') || officer.id.startsWith('OFF-')) {
      return officer.id.toUpperCase();
    }
    return `OFF-${officer.id.slice(0, 6).toUpperCase()}`;
  }
  return 'OFF-??';
}

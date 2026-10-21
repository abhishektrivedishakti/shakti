import { BookingRecord, SavedDirectory, CustomTariffPackage } from '../types';

const DIRECTORY_STORAGE_KEY = 'fleetdispatch_saved_directory';
const CUSTOM_TARIFFS_STORAGE_KEY = 'fleetdispatch_custom_tariff_packages';

export const loadCustomTariffPackages = (): CustomTariffPackage[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_TARIFFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading custom tariffs:', e);
  }
  return [];
};

export const saveCustomTariffPackages = (packages: CustomTariffPackage[]): void => {
  try {
    localStorage.setItem(CUSTOM_TARIFFS_STORAGE_KEY, JSON.stringify(packages));
  } catch (e) {
    console.error('Error saving custom tariffs:', e);
  }
};

export const EMPTY_SAVED_DIRECTORY: SavedDirectory = {
  clients: [],
  bookers: [],
  passengers: [],
  vehicles: [],
  drivers: [],
};

/** Alias kept for existing imports */
export const defaultSavedDirectory: SavedDirectory = EMPTY_SAVED_DIRECTORY;

export const loadSavedDirectory = (bookings: BookingRecord[] = []): SavedDirectory => {
  try {
    const raw = localStorage.getItem(DIRECTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.clients) && parsed.clients.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading saved directory:', e);
  }

  // If no stored directory, derive from default and any bookings
  const directory: SavedDirectory = { ...defaultSavedDirectory };

  if (bookings && bookings.length > 0) {
    bookings.forEach((b) => {
      if (b.client?.name && !directory.clients.some((c) => c.name === b.client.name)) {
        directory.clients.push({
          id: `CLI-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          ...b.client,
        });
      }
      if (b.booker?.name && !directory.bookers.some((k) => k.name === b.booker.name)) {
        directory.bookers.push({
          id: `BKR-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          ...b.booker,
        });
      }
      if (b.passenger?.name && !directory.passengers.some((p) => p.name === b.passenger.name)) {
        directory.passengers.push({
          id: `PAX-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          ...b.passenger,
        });
      }
      if (b.vehicleNumber && !directory.vehicles.some((v) => v.vehicleNumber === b.vehicleNumber)) {
        directory.vehicles.push({
          vehicleNumber: b.vehicleNumber,
          vehicleModel: b.vehicleModel || 'Fleet Vehicle',
          vehicleClass: b.vehicleClass || 'Sedan',
        });
      }
      if (b.driverName && !directory.drivers.some((d) => d.name === b.driverName)) {
        directory.drivers.push({
          name: b.driverName,
          phone: b.driverPhone || '',
        });
      }
    });
  }

  return directory;
};

export const saveDirectoryToStorage = (directory: SavedDirectory): void => {
  try {
    localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(directory));
  } catch (e) {
    console.error('Error saving directory to localStorage:', e);
  }
};

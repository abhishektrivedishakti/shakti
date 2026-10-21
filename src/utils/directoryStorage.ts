import { BookingRecord, SavedDirectory, CustomTariffPackage } from '../types';

/** In-memory only — directory/tariffs are loaded/saved via the API. */
let memoryTariffs: CustomTariffPackage[] = [];
let memoryDirectory: SavedDirectory | null = null;

export const loadCustomTariffPackages = (): CustomTariffPackage[] => memoryTariffs;

export const saveCustomTariffPackages = (packages: CustomTariffPackage[]): void => {
  memoryTariffs = Array.isArray(packages) ? packages : [];
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
  if (memoryDirectory) return memoryDirectory;

  const directory: SavedDirectory = {
    clients: [],
    bookers: [],
    passengers: [],
    vehicles: [],
    drivers: [],
  };

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
  memoryDirectory = directory;
};

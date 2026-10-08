import { BookingRecord, SavedDirectory, CustomTariffPackage } from '../types';

const DIRECTORY_STORAGE_KEY = 'fleetdispatch_saved_directory';
const CUSTOM_TARIFFS_STORAGE_KEY = 'fleetdispatch_custom_tariff_packages';

export const DEFAULT_CUSTOM_TARIFF_PACKAGES: CustomTariffPackage[] = [
  {
    id: 'pkg-local-8-80',
    packageName: '8 Hours / 80 KM Standard Local (मानक लोकल)',
    category: 'local_8hr_80km',
    baseRate: 2400,
    baseHours: 8,
    baseKm: 80,
    extraKmRate: 14,
    extraHourRate: 150,
    nightHaltRate: 350,
    driverWage: 600,
    description: 'Standard office & local inspection duty (मानक कार्यालय व साइट इंस्पेक्शन)',
  },
  {
    id: 'pkg-local-12-100',
    packageName: '12 Hours / 100 KM Full Day (पूरा दिन फील्ड)',
    category: 'local_12hr_100km',
    baseRate: 3100,
    baseHours: 12,
    baseKm: 100,
    extraKmRate: 14,
    extraHourRate: 150,
    nightHaltRate: 350,
    driverWage: 750,
    description: 'Extended full-day official tour & corridor inspection',
  },
  {
    id: 'pkg-outstation-250',
    packageName: 'Outstation Tour (250 KM Min / बाहरी दौरा)',
    category: 'outstation',
    baseRate: 4200,
    baseHours: 12,
    baseKm: 250,
    extraKmRate: 16,
    extraHourRate: 180,
    nightHaltRate: 450,
    driverWage: 900,
    description: 'Inter-district site visits & expressway journeys',
  },
  {
    id: 'pkg-airport-transfer',
    packageName: 'Airport / Station Transfer (4 Hr / 40 KM)',
    category: 'airport_station_transfer',
    baseRate: 1600,
    baseHours: 4,
    baseKm: 40,
    extraKmRate: 14,
    extraHourRate: 150,
    nightHaltRate: 300,
    driverWage: 450,
    description: 'Airport/railway station VIP pick & drop',
  },
  {
    id: 'pkg-vvip-luxury',
    packageName: 'VVIP Crysta Luxury (8 Hr / 80 KM लक्जरी)',
    category: 'custom_package',
    baseRate: 3600,
    baseHours: 8,
    baseKm: 80,
    extraKmRate: 20,
    extraHourRate: 250,
    nightHaltRate: 500,
    driverWage: 800,
    description: 'Innova Crysta VIP official escort duty',
  },
];

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
  return DEFAULT_CUSTOM_TARIFF_PACKAGES;
};

export const saveCustomTariffPackages = (packages: CustomTariffPackage[]): void => {
  try {
    localStorage.setItem(CUSTOM_TARIFFS_STORAGE_KEY, JSON.stringify(packages));
  } catch (e) {
    console.error('Error saving custom tariffs:', e);
  }
};

export const defaultSavedDirectory: SavedDirectory = {
  clients: [
    {
      id: 'CLI-01',
      name: 'Public Works Department (PWD Nirman Bhawan)',
      gstin: '09AAAGP1234E1Z1',
      billingAddress: 'Nirman Bhawan, Ashok Marg, Hazratganj, Lucknow',
      billingContactPerson: 'Executive Engineer (Accounts)',
      billingPhone: '0522-2234567',
    },
    {
      id: 'CLI-02',
      name: 'National Highways Authority of India (NHAI RO Lucknow)',
      gstin: '07AAACN0123M1Z8',
      billingAddress: 'Vibhuti Khand, Gomti Nagar, Lucknow',
      billingContactPerson: 'General Manager (Tech / Fleet)',
      billingPhone: '0522-2720050',
    },
    {
      id: 'CLI-03',
      name: 'Uttar Pradesh Power Corporation Limited (UPPCL Shakti Bhawan)',
      gstin: '09AAAUP1234F1Z0',
      billingAddress: 'Shakti Bhawan, 14 Ashok Marg, Lucknow',
      billingContactPerson: 'Director (Operations & Admin)',
      billingPhone: '0522-2287701',
    },
    {
      id: 'CLI-04',
      name: 'State Disaster Management Authority (UPSDMA)',
      gstin: '09AAAGS7788K1Z5',
      billingAddress: 'Bapu Bhawan, Sachivalaya, Lucknow',
      billingContactPerson: 'Control Officer',
      billingPhone: '0522-2239011',
    },
  ],
  bookers: [
    {
      id: 'BKR-01',
      name: 'Er. Pradeep Sharma (PA to Chief Engineer)',
      phone: '9415011223',
      designation: 'Staff Officer / PA',
      officeOrRoom: 'Room 304, Third Floor, Nirman Bhawan',
    },
    {
      id: 'BKR-02',
      name: 'Shri Arvind Verma (Private Secretary)',
      phone: '9838044556',
      designation: 'PS to Project Director',
      officeOrRoom: 'NHAI Project Office, Gomti Nagar',
    },
    {
      id: 'BKR-03',
      name: 'Smt. Vandana Shukla (Section Officer)',
      phone: '9450099881',
      designation: 'Admin Section Incharge',
      officeOrRoom: 'UPPCL Room 112, Shakti Bhawan',
    },
  ],
  passengers: [
    {
      id: 'PAX-01',
      name: 'Er. Ramesh Chandra Sharma',
      phone: '9839011223',
      designation: 'Chief Engineer (Roads & Bridges)',
      isVIP: true,
      specialRequests: 'गाड़ी में एसी लगातार चालू रहे, सफेद सीट कवर व वाटर बॉटल रखी रहे।',
    },
    {
      id: 'PAX-02',
      name: 'Dr. Vivek Anand (IAS)',
      phone: '9415055667',
      designation: 'Special Secretary (Infrastructure)',
      isVIP: true,
      specialRequests: 'समय की पाबंदी अनिवार्य, ड्राइवर वर्दी में रहे।',
    },
    {
      id: 'PAX-03',
      name: 'Er. Alok Ranjan (Project Director NHAI)',
      phone: '9839912345',
      designation: 'Project Director (Lucknow-Kanpur Corridor)',
      isVIP: false,
      specialRequests: 'टोल प्लाजा और साइट निरीक्षण हेतु एक्सप्रेसवे परमिट आवश्यक।',
    },
  ],
  vehicles: [
    { vehicleNumber: 'UP32 AB 1234', vehicleModel: 'Maruti Suzuki Dzire VXI', vehicleClass: 'Sedan' },
    { vehicleNumber: 'UP32 CD 5678', vehicleModel: 'Toyota Innova Crysta 2.4 VX', vehicleClass: 'SUV / Luxury' },
    { vehicleNumber: 'UP32 EF 9012', vehicleModel: 'Mahindra Scorpio-N Z8', vehicleClass: 'SUV' },
    { vehicleNumber: 'UP32 GH 3456', vehicleModel: 'Honda City ZX (Automatic)', vehicleClass: 'Premium Sedan' },
    { vehicleNumber: 'UP32 JK 7890', vehicleModel: 'Maruti Ertiga ZXI CNG', vehicleClass: 'MUV 7-Seater' },
  ],
  drivers: [
    { name: 'Rajesh Kumar Yadav', phone: '9839011223' },
    { name: 'Sunil Kumar Mishra', phone: '9450123456' },
    { name: 'Mohammad Imran Ali', phone: '9838765432' },
    { name: 'Dharmendra Singh', phone: '9415987654' },
    { name: 'Rameshwar Dayal', phone: '9792112233' },
  ],
};

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

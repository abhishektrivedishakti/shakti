import React, { useState } from 'react';
import {
  BookingRecord,
  DispatcherProfile,
  SavedDirectory,
  DutyTypeCategory,
  DutyStatus,
  Tender,
} from '../../types';
import {
  Building2,
  Users,
  Briefcase,
  Car,
  Clock,
  MapPin,
  Calendar,
  Save,
  X,
  Sparkles,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Search,
  RotateCcw,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface BookingFormProps {
  dispatcher: DispatcherProfile;
  savedDirectory: SavedDirectory;
  erpTenders?: Tender[];
  onSubmitBooking: (booking: BookingRecord) => void;
  onCancel: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  dispatcher,
  savedDirectory,
  erpTenders = [],
  onSubmitBooking,
  onCancel,
}) => {
  const nextId = `BK-${Date.now().toString().slice(-4)}`;

  // Form State
  const [bookingNumber, setBookingNumber] = useState(nextId);
  const [reportingDate, setReportingDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportingTime, setReportingTime] = useState('08:30 AM');
  const [pickupLocation, setPickupLocation] = useState('कमरा 304, निर्माण भवन, हजरतगंज, लखनऊ');
  const [dropLocation, setDropLocation] = useState('साइट निरीक्षण व रीजनल कार्यालय');
  const [routeStops, setRouteStops] = useState('');

  // Tender Auto-Fill States
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');
  const [tenderSearch, setTenderSearch] = useState<string>('');
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('सरकारी ऑन-कॉल वाहन ड्यूटी');

  // 1. Client / Billed To
  const [clientName, setClientName] = useState(savedDirectory.clients[0]?.name || 'Public Works Department (PWD)');
  const [clientGstin, setClientGstin] = useState(savedDirectory.clients[0]?.gstin || '09AAAGP1234E1Z1');
  const [clientAddress, setClientAddress] = useState(savedDirectory.clients[0]?.billingAddress || 'Nirman Bhawan, Lucknow');

  // 2. Official Booker
  const [bookerName, setBookerName] = useState(savedDirectory.bookers[0]?.name || 'Er. Pradeep Sharma (PA)');
  const [bookerPhone, setBookerPhone] = useState(savedDirectory.bookers[0]?.phone || '9415011223');
  const [bookerDesignation, setBookerDesignation] = useState(savedDirectory.bookers[0]?.designation || 'Staff Officer');
  const [bookerRoom, setBookerRoom] = useState(savedDirectory.bookers[0]?.officeOrRoom || 'Room 304');

  // 3. Passenger / VIP
  const [paxName, setPaxName] = useState(savedDirectory.passengers[0]?.name || 'Er. Ramesh Chandra Sharma');
  const [paxPhone, setPaxPhone] = useState(savedDirectory.passengers[0]?.phone || '9839011223');
  const [paxDesignation, setPaxDesignation] = useState(savedDirectory.passengers[0]?.designation || 'Chief Engineer (Roads)');
  const [paxIsVIP, setPaxIsVIP] = useState(true);
  const [paxSpecial, setPaxSpecial] = useState('एसी चालू रहे, सफेद सीट कवर व वाटर बॉटल रखी रहे।');

  // 4. Vehicle & Driver
  const [vehicleNumber, setVehicleNumber] = useState(savedDirectory.vehicles[0]?.vehicleNumber || 'UP32 AB 1234');
  const [vehicleModel, setVehicleModel] = useState(savedDirectory.vehicles[0]?.vehicleModel || 'Maruti Suzuki Dzire VXI');
  const [vehicleClass, setVehicleClass] = useState(savedDirectory.vehicles[0]?.vehicleClass || 'Sedan');
  const [driverName, setDriverName] = useState(savedDirectory.drivers[0]?.name || 'Rajesh Kumar Yadav');
  const [driverPhone, setDriverPhone] = useState(savedDirectory.drivers[0]?.phone || '9839011223');
  const [garageOutKm, setGarageOutKm] = useState(42150);

  // 5. Tariff Package
  const [packageType, setPackageType] = useState<DutyTypeCategory>('local_8hr_80km');
  const [packageName, setPackageName] = useState('8 Hours / 80 KM Local Duty');
  const [baseRate, setBaseRate] = useState(2400);
  const [baseHours, setBaseHours] = useState(8);
  const [baseKm, setBaseKm] = useState(80);
  const [extraKmRate, setExtraKmRate] = useState(14);
  const [extraHourRate, setExtraHourRate] = useState(150);
  const [nightHaltRate, setNightHaltRate] = useState(350);
  const [driverWage, setDriverWage] = useState(600);

  const handlePackageChange = (type: DutyTypeCategory) => {
    setPackageType(type);
    if (type === 'local_8hr_80km') {
      setPackageName('8 Hours / 80 KM Local Duty');
      setBaseRate(2400);
      setBaseHours(8);
      setBaseKm(80);
      setExtraKmRate(14);
      setExtraHourRate(150);
      setNightHaltRate(350);
      setDriverWage(600);
    } else if (type === 'local_12hr_100km') {
      setPackageName('12 Hours / 100 KM Full Day Duty');
      setBaseRate(3100);
      setBaseHours(12);
      setBaseKm(100);
      setExtraKmRate(14);
      setExtraHourRate(150);
      setNightHaltRate(350);
      setDriverWage(700);
    } else if (type === 'outstation') {
      setPackageName('Outstation Tour 250 KM Minimum');
      setBaseRate(4200);
      setBaseHours(12);
      setBaseKm(250);
      setExtraKmRate(16);
      setExtraHourRate(180);
      setNightHaltRate(400);
      setDriverWage(800);
    } else if (type === 'airport_station_transfer') {
      setPackageName('Airport / Station Transfer 4 Hrs / 40 KM');
      setBaseRate(1600);
      setBaseHours(4);
      setBaseKm(40);
      setExtraKmRate(14);
      setExtraHourRate(150);
      setNightHaltRate(350);
      setDriverWage(500);
    } else if (type === 'custom_package') {
      setPackageName('Custom Duty Package / अनुकूलित पैकेज');
      setBaseRate(2800);
      setBaseHours(10);
      setBaseKm(100);
      setExtraKmRate(15);
      setExtraHourRate(160);
      setNightHaltRate(400);
      setDriverWage(650);
    } else if (type === 'pending_assignment') {
      setPackageName('Pending Tariff Assignment (पैकेज बाद में तय होगा)');
      setBaseRate(0);
      setBaseHours(0);
      setBaseKm(0);
      setExtraKmRate(14);
      setExtraHourRate(150);
      setNightHaltRate(350);
      setDriverWage(500);
    }
  };

  // Automatic Tender Selection & Auto-Fill Handler
  const handleApplyTender = (tender: Tender) => {
    setSelectedTenderId(tender.id);
    setTenderSearch(tender.departmentName + (tender.tenderNumber ? ` (${tender.tenderNumber})` : ''));

    // 1. Department / Client Auto-Fill
    if (tender.departmentName) setClientName(tender.departmentName);
    if (tender.onCallDefaults?.clientGstin) {
      setClientGstin(tender.onCallDefaults.clientGstin);
    } else {
      setClientGstin('09AAAGP1234E1Z1');
    }
    if (tender.onCallDefaults?.clientBillingAddress) {
      setClientAddress(tender.onCallDefaults.clientBillingAddress);
    } else if (tender.authorityOffice) {
      setClientAddress(tender.authorityOffice);
    }

    // 2. Official Booker Auto-Fill
    if (tender.onCallDefaults?.defaultBookerName) {
      setBookerName(tender.onCallDefaults.defaultBookerName);
    } else if (tender.contactPerson) {
      setBookerName(tender.contactPerson);
    }
    if (tender.onCallDefaults?.defaultBookerPhone) {
      setBookerPhone(tender.onCallDefaults.defaultBookerPhone);
    } else if (tender.contactPhone) {
      setBookerPhone(tender.contactPhone);
    }
    if (tender.onCallDefaults?.defaultBookerDesignation) {
      setBookerDesignation(tender.onCallDefaults.defaultBookerDesignation);
    } else if (tender.officerDesignationsSummary) {
      setBookerDesignation(tender.officerDesignationsSummary);
    }
    if (tender.onCallDefaults?.defaultBookerRoom) {
      setBookerRoom(tender.onCallDefaults.defaultBookerRoom);
    }

    // 3. Location Auto-Fill
    if (tender.onCallDefaults?.defaultPickupLocation) {
      setPickupLocation(tender.onCallDefaults.defaultPickupLocation);
    } else if (tender.authorityOffice) {
      setPickupLocation(tender.authorityOffice);
    }
    if (tender.onCallDefaults?.defaultDropLocation) {
      setDropLocation(tender.onCallDefaults.defaultDropLocation);
    }

    // 4. Tariff Rates Auto-Fill
    if (tender.onCallDefaults?.defaultPackageType) {
      handlePackageChange(tender.onCallDefaults.defaultPackageType);
    }
    if (tender.onCallDefaults?.baseRate) {
      setBaseRate(tender.onCallDefaults.baseRate);
    } else if (tender.baseMonthlyRate) {
      setBaseRate(Math.round(tender.baseMonthlyRate / 26 / 100) * 100);
    }
    if (tender.onCallDefaults?.extraKmRate) {
      setExtraKmRate(tender.onCallDefaults.extraKmRate);
    } else if (tender.extraKmRate) {
      setExtraKmRate(tender.extraKmRate);
    }
    if (tender.onCallDefaults?.extraHourRate) {
      setExtraHourRate(tender.onCallDefaults.extraHourRate);
    } else if (tender.extraHourRate) {
      setExtraHourRate(tender.extraHourRate);
    }
    if (tender.onCallDefaults?.nightHaltRate) {
      setNightHaltRate(tender.onCallDefaults.nightHaltRate);
    } else if (tender.nightHaltRate) {
      setNightHaltRate(tender.nightHaltRate);
    }
    if (tender.onCallDefaults?.driverDaRate) {
      setDriverWage(tender.onCallDefaults.driverDaRate * 2);
    }
    if (tender.onCallDefaults?.specialInstructions) {
      setPaxSpecial(tender.onCallDefaults.specialInstructions);
    }

    // 5. Notes / Contract Reference
    const contractTag =
      tender.contractType === 'on_call'
        ? 'ऑन-कॉल ड्यूटी'
        : tender.contractType === 'hybrid'
        ? 'हाइब्रिड ऑन-कॉल'
        : 'मासिक अनुबंध';
    const refNotes = `टेंडर सं: ${tender.tenderNumber || 'N/A'} | WO: ${tender.workOrderNumber || 'N/A'} (${contractTag})`;
    setNotes(refNotes);

    setAutoFilledNotice(
      `टेंडर '${tender.departmentName}' से क्लाइंट, बुकर, पिकअप स्थल एवं दरें अपने आप भर दी गई हैं!`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paxName || !vehicleNumber || !driverName || !pickupLocation || !dropLocation) {
      alert('कृपया सवारी, गाड़ी, ड्राइवर और पिकअप-ड्रॉप लोकेशन अवश्य भरें।');
      return;
    }

    const isPending = packageType === 'pending_assignment';
    const grossClient = isPending ? 0 : baseRate;
    const gstRatePercent = isPending ? 0 : 5;
    const gstAmount = isPending ? 0 : Math.round((grossClient * (gstRatePercent / 100)) * 10) / 10;
    const netClientBillable = isPending ? 0 : grossClient + gstAmount;

    const newBooking: BookingRecord = {
      id: `BK-${Date.now()}`,
      bookingNumber: bookingNumber.toUpperCase(),
      date: reportingDate,
      status: 'scheduled' as DutyStatus,
      client: {
        name: clientName,
        gstin: clientGstin,
        billingAddress: clientAddress,
      },
      booker: {
        name: bookerName,
        phone: bookerPhone,
        designation: bookerDesignation,
        officeOrRoom: bookerRoom,
      },
      passenger: {
        name: paxName,
        phone: paxPhone,
        designation: paxDesignation,
        isVIP: paxIsVIP,
        specialRequests: paxSpecial,
      },
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      vehicleModel,
      vehicleClass,
      driverName,
      driverPhone,
      reportingDate,
      reportingTime,
      pickupLocation,
      dropLocation,
      routeStops: routeStops || undefined,
      garageOutKm,
      tariff: {
        packageType,
        packageName,
        isPendingPackage: isPending,
        customPackageTitle: packageType === 'custom_package' ? packageName : undefined,
        baseRate: isPending ? 0 : baseRate,
        baseHours: isPending ? 0 : baseHours,
        baseKm: isPending ? 0 : baseKm,
        extraKmRate,
        extraHourRate,
        nightHaltRate,
        driverDaRate: 300,
        extraKmRun: 0,
        extraHoursRun: 0,
        extraKmCost: 0,
        extraHourCost: 0,
        tollParkingAmount: 0,
        stateTaxPermitCost: 0,
        nightHaltAmount: 0,
        grossClientAmount: grossClient,
        gstRatePercent,
        gstAmount,
        netClientBillable,
        driverBaseWage: driverWage,
        driverExtraHoursPay: 0,
        driverNightDa: 0,
        driverAdvanceDeduction: 0,
        netDriverPayable: driverWage,
      },
      clientPaymentStatus: 'unbilled',
      driverPaymentStatus: 'pending',
      tenderId: selectedTenderId || undefined,
      tenderNumber: tenderSearch || undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString().slice(0, 16),
      updatedAt: new Date().toISOString().slice(0, 16),
    };

    onSubmitBooking(newBooking);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 3-Party Dispatch Engine
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">नई वाहन बुकिंग व ड्यूटी अलॉटमेंट (New Booking)</h2>
          <p className="text-xs text-slate-400">
            3-Party Structure: बिलिंग क्लाइंट, बुकर अधिकारी एवं मुख्य सवारी का विवरण दर्ज करें
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
        >
          रद्द करें
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* TENDER REFERENCE & AUTOMATIC ON-CALL AUTO-FILL STATION */}
        <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/40 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                  <FileText className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>टेंडर / वर्क आर्डर चुनें (Tender / Work Order Auto-Fill)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-full font-bold">
                    ऑटो-फिल सक्रिय
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                जैसे ही आप ऑन-कॉल या मासिक टेंडर चुनेंगे या उसका नाम लिखेंगे — विभाग का नाम, GSTIN, बुकर, दरें और पिकअप स्थल अपने आप भर जाएंगे।
              </p>
            </div>

            {/* Quick 1-Click On-Call Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">त्वरित ऑन-कॉल:</span>
              <button
                type="button"
                onClick={() => {
                  setClientName('Public Works Department (PWD Nirman Bhawan)');
                  setClientGstin('09AAAGP1234E1Z1');
                  setClientAddress('Nirman Bhawan, Ashok Marg, Hazratganj, Lucknow');
                  setBookerName('Er. Pradeep Sharma (PA)');
                  setBookerPhone('9415011223');
                  setBookerDesignation('Staff Officer / PA to Chief Engineer');
                  setBookerRoom('Room 304, Third Floor');
                  setPickupLocation('कमरा नं. 304, निर्माण भवन, हजरतगंज, लखनऊ');
                  setDropLocation('साइट निरीक्षण व रीजनल क्वालिटी लैब उन्नाव');
                  handlePackageChange('local_8hr_80km');
                  setBaseRate(2400);
                  setExtraKmRate(14);
                  setExtraHourRate(150);
                  setNightHaltRate(350);
                  setDriverWage(600);
                  setTenderSearch('PWD/CAB/2026-03 - Public Works Department');
                  setNotes('PWD ऑन-कॉल स्वीकृत वाहन ड्यूटी | WO-PWD-2026-C');
                  setAutoFilledNotice('लोक निर्माण विभाग (PWD) ऑन-कॉल ड्यूटी का सारा बेसिक विवरण स्वतः भर दिया गया है!');
                }}
                className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/80 rounded-lg text-[10px] font-bold transition cursor-pointer"
              >
                ⚡ PWD ऑन-कॉल (8Hr/80KM)
              </button>

              <button
                type="button"
                onClick={() => {
                  setClientName('National Highways Authority of India (NHAI RO Lucknow)');
                  setClientGstin('07AAACN0123M1Z8');
                  setClientAddress('Vibhuti Khand, Gomti Nagar, Lucknow');
                  setBookerName('Shri Arvind Verma (Private Secretary)');
                  setBookerPhone('9838044556');
                  setBookerDesignation('PS to Project Director');
                  setBookerRoom('NHAI Project Office');
                  setPickupLocation('एनएचएआई क्षेत्रीय कार्यालय, विभूति खंड, गोमती नगर');
                  setDropLocation('लखनऊ-कानपुर एक्सप्रेसवे पैकेज 2 साइट');
                  handlePackageChange('local_12hr_100km');
                  setBaseRate(3100);
                  setExtraKmRate(15);
                  setExtraHourRate(160);
                  setNightHaltRate(400);
                  setDriverWage(750);
                  setTenderSearch('NHAI/RO/LKO/2025/11 - NHAI Expressways');
                  setNotes('NHAI साइट इंस्पेक्शन ऑन-कॉल ड्यूटी | WO-NHAI-EXP-02');
                  setAutoFilledNotice('एनएचएआई (NHAI) 12Hr/100KM साइट निरीक्षण का सारा विवरण स्वतः भर दिया गया है!');
                }}
                className="px-2.5 py-1 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/80 rounded-lg text-[10px] font-bold transition cursor-pointer"
              >
                ⚡ NHAI साइट (12Hr/100KM)
              </button>

              <button
                type="button"
                onClick={() => {
                  setClientName('UP Power Corporation Limited (UPPCL Shakti Bhawan)');
                  setClientGstin('09AAAUP1234F1Z0');
                  setClientAddress('Shakti Bhawan, 14 Ashok Marg, Lucknow');
                  setBookerName('Smt. Vandana Shukla (Section Officer)');
                  setBookerPhone('9450099881');
                  setBookerDesignation('Admin Section Incharge');
                  setBookerRoom('Room 112, Shakti Bhawan');
                  setPickupLocation('शक्ति भवन, 14 अशोक मार्ग, लखनऊ');
                  setDropLocation('ट्रांसमिशन सबस्टेशन व क्षेत्रीय बैठक');
                  handlePackageChange('local_8hr_80km');
                  setBaseRate(2500);
                  setExtraKmRate(14);
                  setExtraHourRate(150);
                  setNightHaltRate(350);
                  setDriverWage(600);
                  setTenderSearch('UPPCL/CAB/2025 - UPPCL Shakti Bhawan');
                  setNotes('पावर कारपोरेशन आकस्मिक ऑन-कॉल ड्यूटी');
                  setAutoFilledNotice('UPPCL शक्ति भवन ऑन-कॉल ड्यूटी का सारा विवरण स्वतः भर दिया गया है!');
                }}
                className="px-2.5 py-1 bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border border-purple-700/80 rounded-lg text-[10px] font-bold transition cursor-pointer"
              >
                ⚡ UPPCL शक्ति भवन (On-Call)
              </button>
            </div>
          </div>

          {/* Tender Dropdown & Search Field */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            {/* Tender Dropdown Selector */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                टेंडर सूची में से चुनें (Select Tender Dropdown):
              </label>
              <select
                value={selectedTenderId}
                onChange={(e) => {
                  const tId = e.target.value;
                  setSelectedTenderId(tId);
                  const matched = erpTenders.find((t) => t.id === tId);
                  if (matched) {
                    handleApplyTender(matched);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">-- टेंडर चुनें (Choose Tender to Auto-Fill) --</option>
                {erpTenders.map((t) => {
                  const tag =
                    t.contractType === 'on_call'
                      ? '[⚡ ऑन-कॉल]'
                      : t.contractType === 'hybrid'
                      ? '[🔄 हाइब्रिड]'
                      : '[📅 मासिक]';
                  return (
                    <option key={t.id} value={t.id}>
                      {tag} {t.departmentName} - {t.tenderNumber || t.workOrderNumber}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Direct Input Search for Tender */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                या टेंडर / विभाग का नाम लिखें (Type Tender Name/Number):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tenderSearch}
                  onChange={(e) => {
                    const q = e.target.value;
                    setTenderSearch(q);
                    if (q.trim().length > 1) {
                      const match = erpTenders.find(
                        (t) =>
                          t.departmentName.toLowerCase().includes(q.toLowerCase()) ||
                          t.tenderNumber.toLowerCase().includes(q.toLowerCase()) ||
                          t.workOrderNumber.toLowerCase().includes(q.toLowerCase())
                      );
                      if (match) {
                        handleApplyTender(match);
                      }
                    }
                  }}
                  placeholder="उदा. PWD, NHAI, RDSO, GeM या सिंचाई विभाग..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Auto-Fill Confirmation Notification Banner */}
          {autoFilledNotice && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{autoFilledNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoFilledNotice(null)}
                className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-0.5"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {/* SECTION 1: 3-PARTY ARCHITECTURE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Party 1: Billed To / Client */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-indigo-400 flex items-center gap-1.5 text-xs">
                <Building2 className="w-4 h-4" />
                <span>1. Billed To (बिलिंग पार्टी / विभाग)</span>
              </h3>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">क्लाइंट / सरकारी विभाग का नाम *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Public Works Department"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">GSTIN नंबर (वैकल्पिक)</label>
              <input
                type="text"
                value={clientGstin}
                onChange={(e) => setClientGstin(e.target.value.toUpperCase())}
                placeholder="09AAAGP1234E1Z1"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">बिलिंग पता (Address)</label>
              <textarea
                rows={2}
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="कार्यालय पता"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Party 2: Official Booker */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                <Briefcase className="w-4 h-4" />
                <span>2. Official Booker (बुकर / सहायक)</span>
              </h3>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">बुकर का नाम (Booker Name) *</label>
              <input
                type="text"
                required
                value={bookerName}
                onChange={(e) => setBookerName(e.target.value)}
                placeholder="e.g. Er. Pradeep Sharma"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">बुकर मोबाइल नंबर *</label>
              <input
                type="tel"
                required
                value={bookerPhone}
                onChange={(e) => setBookerPhone(e.target.value)}
                placeholder="10 अंक मोबाइल"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">पदनाम व कमरा (Office / Room)</label>
              <input
                type="text"
                value={bookerRoom}
                onChange={(e) => setBookerRoom(e.target.value)}
                placeholder="e.g. Room 304, Third Floor"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
              />
            </div>
          </div>

          {/* Party 3: Passenger / VIP */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                <Users className="w-4 h-4" />
                <span>3. Passenger / VIP (सवार अधिकारी)</span>
              </h3>
              <label className="flex items-center gap-1 text-[10px] text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paxIsVIP}
                  onChange={(e) => setPaxIsVIP(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>VIP Protocol</span>
              </label>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">अधिकारी / सवारी का नाम *</label>
              <input
                type="text"
                required
                value={paxName}
                onChange={(e) => setPaxName(e.target.value)}
                placeholder="e.g. Er. Ramesh Chandra Sharma"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">सवारी मोबाइल नंबर *</label>
              <input
                type="tel"
                required
                value={paxPhone}
                onChange={(e) => setPaxPhone(e.target.value)}
                placeholder="10 अंक मोबाइल"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">पदनाम (Designation)</label>
              <input
                type="text"
                value={paxDesignation}
                onChange={(e) => setPaxDesignation(e.target.value)}
                placeholder="Chief Engineer"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: SCHEDULE & ROUTE */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>शेड्यूल व यात्रा रूट (Schedule &amp; Routing)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">रिपोर्टिंग दिनांक (Date) *</label>
              <input
                type="date"
                required
                value={reportingDate}
                onChange={(e) => setReportingDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">रिपोर्टिंग समय (Time) *</label>
              <input
                type="text"
                required
                value={reportingTime}
                onChange={(e) => setReportingTime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">पिकअप स्थल (Pickup Location) *</label>
              <input
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">गंतव्य / साइट (Destination) *</label>
              <input
                type="text"
                required
                value={dropLocation}
                onChange={(e) => setDropLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">रूट व हॉल्ट (Via / Stops)</label>
              <input
                type="text"
                value={routeStops}
                onChange={(e) => setRouteStops(e.target.value)}
                placeholder="e.g. हजरतगंज ➔ ट्रांसपोर्ट नगर ➔ उन्नाव"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: VEHICLE & DRIVER */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <Car className="w-4 h-4 text-emerald-400" />
            <span>वाहन व चालक आवंटन (Vehicle &amp; Driver Allocation)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">गाड़ी नंबर (Vehicle No) *</label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="UP32 AB 1234"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">मॉडल (Make &amp; Model)</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Dzire / Innova"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">चालक का नाम (Driver) *</label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">चालक फोन (Phone) *</label>
              <input
                type="tel"
                required
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">प्रस्थान गैरेज मीटर (Start KM):</span>
            <input
              type="number"
              value={garageOutKm}
              onChange={(e) => setGarageOutKm(Number(e.target.value))}
              className="w-32 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono font-bold"
            />
          </div>
        </div>

        {/* SECTION 4: TARIFF & PACKAGES */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>ड्यूटी टैरिफ व पैकेज (Tariff Package)</span>
            </h3>
            <span className="text-emerald-400 font-bold font-mono">अनुमानित बेस: ₹{baseRate}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { id: 'local_8hr_80km', label: '8 Hr / 80 KM Local', rate: '₹2,400', badge: 'लोकल ड्यूटी' },
              { id: 'local_12hr_100km', label: '12 Hr / 100 KM Full', rate: '₹3,100', badge: 'फुल डे' },
              { id: 'outstation', label: 'Outstation 250 KM', rate: '₹4,200+', badge: 'आउटस्टेशन' },
              { id: 'airport_station_transfer', label: 'Airport Transfer', rate: '₹1,600', badge: 'एयरपोर्ट/स्टेशन' },
              { id: 'custom_package', label: 'Custom Package', rate: 'अपनी दरें', badge: 'अनुकूलित' },
              { id: 'pending_assignment', label: 'Package Not Decided', rate: 'बाद में तय होगा', badge: 'लंबित पैकेज' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePackageChange(p.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  packageType === p.id
                    ? p.id === 'pending_assignment'
                      ? 'bg-amber-950/60 border-amber-500 font-bold text-amber-200 shadow-md ring-1 ring-amber-500/50'
                      : p.id === 'custom_package'
                      ? 'bg-purple-950/60 border-purple-500 font-bold text-purple-200 shadow-md ring-1 ring-purple-500/50'
                      : 'bg-emerald-950/70 border-emerald-500 font-bold text-white shadow-2xs ring-1 ring-emerald-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-400 font-medium">{p.badge}</div>
                <div className="text-xs font-semibold mt-0.5 truncate">{p.label}</div>
                <div
                  className={`text-[10px] font-mono mt-1 ${
                    p.id === 'pending_assignment'
                      ? 'text-amber-400 font-bold'
                      : p.id === 'custom_package'
                      ? 'text-purple-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {p.rate}
                </div>
              </button>
            ))}
          </div>

          {/* Pending Assignment Alert Notice */}
          {packageType === 'pending_assignment' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
              <span className="text-base">⚠️</span>
              <div>
                <span className="font-bold">पैकेज अभी तय नहीं है (Package Undecided): </span>
                ड्यूटी अभी सामान्य रूप से बुक हो जाएगी। यात्रा संपन्न होने के बाद या रेट तय होने पर आप मास्टर ड्यूटी रजिस्टर में कभी भी <span className="font-semibold text-white underline">"पैकेज असाइन करें"</span> बटन दबाकर इसे किसी भी पसंदीदा पैकेज में शामिल कर सकेंगे।
              </div>
            </div>
          )}

          {/* Custom Package Extra Parameters */}
          {packageType === 'custom_package' && (
            <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl space-y-2">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <span>✨ अनुकूलित पैकेज विवरण (Custom Package Details)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">पैकेज का नाम (Package Title)</label>
                  <input
                    type="text"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="e.g. VIP Inspection 10 Hr / 120 KM"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-purple-700/60 rounded text-slate-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">शामिल घंटे (Base Hours)</label>
                  <input
                    type="number"
                    value={baseHours}
                    onChange={(e) => setBaseHours(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-purple-700/60 rounded text-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">शामिल KM (Base KM)</label>
                  <input
                    type="number"
                    value={baseKm}
                    onChange={(e) => setBaseKm(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-purple-700/60 rounded text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div>
              <label className="block text-slate-400 mb-1">बेस दर (Base ₹)</label>
              <input
                type="number"
                disabled={packageType === 'pending_assignment'}
                value={baseRate}
                onChange={(e) => setBaseRate(Number(e.target.value))}
                className={`w-full px-2.5 py-1.5 bg-slate-900 border rounded text-slate-200 font-mono font-bold ${
                  packageType === 'pending_assignment'
                    ? 'border-slate-800 opacity-50 cursor-not-allowed'
                    : 'border-slate-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">एक्स्ट्रा KM दर (₹/KM)</label>
              <input
                type="number"
                value={extraKmRate}
                onChange={(e) => setExtraKmRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">एक्स्ट्रा घंटा दर (₹/Hr)</label>
              <input
                type="number"
                value={extraHourRate}
                onChange={(e) => setExtraHourRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">नाइट DA (₹)</label>
              <input
                type="number"
                value={nightHaltRate}
                onChange={(e) => setNightHaltRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">चालक मानदेय (₹)</label>
              <input
                type="number"
                value={driverWage}
                onChange={(e) => setDriverWage(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Tender Reference Notes & Special Directives */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
          <label className="block text-slate-400 font-semibold text-xs flex items-center justify-between">
            <span>अनुबंध संदर्भ, वर्क आर्डर व विशेष निर्देश (Contract Reference &amp; Notes)</span>
            <span className="text-[10px] text-indigo-400">टेंडर से स्वतः अपडेटेड</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. टेंडर सं: PWD/CAB/2026-03 | WO: WO-PWD-2026-C | ऑन-कॉल स्वीकृत ड्यूटी"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold"
          >
            रद्द करें
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transform active:scale-95 transition-all"
          >
            <Save className="w-4 h-4 stroke-[3]" />
            <span>✓ ड्यूटी बुकिंग जारी करें (Save &amp; Dispatch)</span>
          </button>
        </div>
      </form>
    </div>
  );
};

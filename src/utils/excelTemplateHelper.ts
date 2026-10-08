import * as XLSX from 'xlsx';
import { Vehicle, Driver, Tender, Vendor } from '../types';

/**
 * Downloads a sample Excel (.xlsx) file for Bulk Vehicle Import
 * Includes explicit, dedicated columns for Driver Name, Driver Mobile, Officer, Tender and Ownership!
 */
export function downloadVehicleExcelTemplate() {
  const headers = [
    'Vehicle Number * (गाड़ी नंबर)',
    'Make & Model * (मेक व मॉडल)',
    'Vehicle Type (प्रकार: Sedan/SUV/MUV/Hatchback/EV)',
    'Fuel Type (ईंधन: Diesel/CNG/Petrol/Electric)',
    'Ownership Type (स्वामित्व: Company Owned / Owner-Driver / Attached)',
    'Driver Name (चालक का नाम)',
    'Driver Mobile (चालक का मोबाइल नंबर 10 अंक)',
    'Driver DL Number (चालक डीएल नंबर)',
    'Driver Monthly Salary ₹ (चालक मासिक वेतन)',
    'Assigned Officer Name (तैनात अधिकारी का नाम)',
    'Tender Name or Number (टेंडर का नाम या नंबर)',
    'Vendor / Owner Name (वेंडर या कार मालिक का नाम)',
    'Monthly Rent to Vendor ₹ (वेंडर तय मासिक किराया)',
    'Current Odometer KM (वर्तमान किमी)',
    'Fitness Expiry (फिटनेस समाप्ति YYYY-MM-DD)',
    'Insurance Expiry (बीमा समाप्ति YYYY-MM-DD)',
    'PUC Expiry (प्रदूषण समाप्ति YYYY-MM-DD)',
    'Road Tax Expiry (रोड टैक्स YYYY-MM-DD)',
    'Permit Expiry (परमिट समाप्ति YYYY-MM-DD)',
  ];

  const sampleRows = [
    [
      'UP32 AB 1234',
      'Maruti Swift Dzire ZXi',
      'Sedan',
      'Diesel',
      'Company Owned',
      'Rajesh Kumar Yadav',
      '9415012345',
      'DL-UP3220180029381',
      16500,
      'Er. Ramesh Chandra Sharma',
      'PWD PWD/CAB/2026-03',
      'Shakti Travels and Tours',
      0,
      24500,
      '2028-06-30',
      '2027-04-15',
      '2026-12-31',
      '2028-12-31',
      '2028-06-30',
    ],
    [
      'UP32 LN 8844',
      'Maruti Swift Dzire VXi',
      'Sedan',
      'Diesel',
      'Owner-Driver',
      'Santosh Kumar Maurya',
      '9415088440',
      'DL-UP3220190044120',
      0,
      'Smt. Sunita Verma PCS',
      'GeM-GEM/2026/B/874129',
      'Santosh Kumar Maurya',
      32000,
      35200,
      '2028-06-30',
      '2027-03-31',
      '2026-11-30',
      '2028-12-31',
      '2028-06-30',
    ],
    [
      'UP32 MK 4501',
      'Toyota Innova Crysta 2.4 VX',
      'SUV',
      'Diesel',
      'Attached / Market Hire',
      'Dinesh Chandra Verma',
      '9839011223',
      'DL-UP3220200055198',
      17000,
      'Shri Alok Kumar IAS',
      'NHAI NHAI/RO/UP/2026-01',
      'Shree Balaji Tour & Fleet Services',
      34000,
      41800,
      '2027-12-31',
      '2027-02-28',
      '2026-12-31',
      '2028-12-31',
      '2027-08-31',
    ],
    [
      'UP32 KZ 9912',
      'Maruti Ertiga VXi CNG',
      'MUV',
      'CNG',
      'Company Owned',
      'Mohammad Aslam',
      '9792033445',
      'DL-UP3220170011890',
      16500,
      'Er. Pradeep Kumar Patel',
      'GeM-GEM/2026/B/874129',
      'Shakti Travels and Tours',
      0,
      18900,
      '2028-08-31',
      '2027-05-31',
      '2026-10-31',
      '2028-12-31',
      '2028-08-31',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  ws['!cols'] = [
    { wch: 18 }, // Vehicle Number
    { wch: 28 }, // Make & Model
    { wch: 16 }, // Vehicle Type
    { wch: 14 }, // Fuel Type
    { wch: 22 }, // Ownership Type
    { wch: 24 }, // Driver Name
    { wch: 18 }, // Driver Mobile
    { wch: 22 }, // Driver DL
    { wch: 16 }, // Driver Salary
    { wch: 28 }, // Officer Name
    { wch: 26 }, // Tender Name
    { wch: 32 }, // Vendor Name
    { wch: 18 }, // Monthly Rent
    { wch: 16 }, // Odometer
    { wch: 16 }, // Fitness
    { wch: 16 }, // Insurance
    { wch: 16 }, // PUC
    { wch: 16 }, // Road Tax
    { wch: 16 }, // Permit
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vehicles_Master');

  const instructionRows = [
    ['शक्ति ट्रैवल्स एंड टूर्स - गाड़ी व ड्राइवर बल्क अपलोड निर्देश (Instructions)'],
    ['1. गाड़ी नंबर (Vehicle Number) और मेक व मॉडल (Make & Model) अनिवार्य (Required) हैं।'],
    ['2. "Driver Name (चालक का नाम)" और "Driver Mobile (मोबाइल)": यदि आप यहाँ ड्राइवर का नाम लिखते हैं, तो सिस्टम ऑटोमैटिक ड्राइवर बनाकर उस गाड़ी से लिंक कर देगा!'],
    ['3. स्वामित्व प्रकार (Ownership Type):'],
    ['   - Company Owned (कंपनी की अपनी गाड़ी)'],
    ['   - Owner-Driver (मालिक ही ड्राइवर है - इसमें ड्राइवर वेतन 0 और वेंडर किराया तय भरें)'],
    ['   - Attached / Market Hire (वेंडर अटैच गाड़ी)'],
    ['4. ईंधन प्रकार (Fuel Type): Diesel, CNG, Petrol, Electric'],
    ['5. यदि Owner-Driver या Attached गाड़ी है, तो वेंडर का नाम व तय मासिक किराया अवश्य भरें।'],
    ['6. तारीखें YYYY-MM-DD प्रारूप (जैसे 2027-04-15) में दर्ज करें।'],
  ];
  const wsHelp = XLSX.utils.aoa_to_sheet(instructionRows);
  XLSX.utils.book_append_sheet(wb, wsHelp, 'Help_Instructions');

  XLSX.writeFile(wb, 'Shakti_Travels_Vehicles_Bulk_Template.xlsx');
}

/**
 * Downloads plain CSV version of Vehicle Template
 */
export function downloadVehicleCsvTemplate() {
  const csvContent =
    'Vehicle Number,Make & Model,Vehicle Type,Fuel Type,Ownership Type,Driver Name,Driver Mobile,Driver DL Number,Driver Monthly Salary,Assigned Officer Name,Tender Name,Vendor Name,Monthly Rent,Current KM,Fitness Expiry,Insurance Expiry,PUC Expiry,Road Tax Expiry,Permit Expiry\n' +
    'UP32 AB 1234,Maruti Swift Dzire ZXi,Sedan,Diesel,Company Owned,Rajesh Kumar Yadav,9415012345,DL-UP3220180029381,16500,Er. Ramesh Chandra Sharma,PWD PWD/CAB/2026-03,Shakti Travels,0,24500,2028-06-30,2027-04-15,2026-12-31,2028-12-31,2028-06-30\n' +
    'UP32 LN 8844,Maruti Swift Dzire VXi,Sedan,Diesel,Owner-Driver,Santosh Kumar Maurya,9415088440,DL-UP3220190044120,0,Smt. Sunita Verma PCS,GeM-GEM/2026/B/874129,Santosh Kumar Maurya,32000,35200,2028-06-30,2027-03-31,2026-11-30,2028-12-31,2028-06-30\n' +
    'UP32 MK 4501,Toyota Innova Crysta,SUV,Diesel,Attached / Market Hire,Dinesh Chandra Verma,9839011223,DL-UP3220200055198,17000,Shri Alok Kumar IAS,NHAI/RO/UP/2026-01,Shree Balaji Tour Services,34000,41800,2027-12-31,2027-02-28,2026-12-31,2028-12-31,2027-08-31\n' +
    'UP32 KZ 9912,Maruti Ertiga VXi CNG,MUV,CNG,Company Owned,Mohammad Aslam,9792033445,DL-UP3220170011890,16500,Er. Pradeep Kumar Patel,GeM-GEM/2026/B/874129,Shakti Travels,0,18900,2028-08-31,2027-05-31,2026-10-31,2028-12-31,2028-08-31\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Shakti_Travels_Vehicles_Template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads a sample Excel (.xlsx) file for Bulk Driver Import
 */
export function downloadDriverExcelTemplate() {
  const headers = [
    'Driver Name * (चालक का नाम)',
    'Mobile Number * (मोबाइल नंबर)',
    'Alternate Mobile (दूसरा मोबाइल)',
    'Driving License No. * (डीएल नंबर)',
    'License Expiry (डीएल समाप्ति YYYY-MM-DD)',
    'Driver Category (श्रेणी: Company Driver / Owner-Driver / Contractual)',
    'Monthly Salary ₹ (मासिक वेतन - Owner-Driver हेतु 0)',
    'Daily Outstation DA Rate ₹ (दैनिक रात्रि भत्ता)',
    'PAN Number (पैन कार्ड नंबर)',
    'Aadhaar Number (आधार कार्ड नंबर)',
    'Assigned Vehicle Number (तैनात गाड़ी नंबर e.g. UP32 AB 1234)',
    'Bank Account & IFSC (बैंक खाता व आईएफएससी)',
    'Permanent Address (स्थायी पता)',
    'Joining Date (कार्यभार ग्रहण तिथि YYYY-MM-DD)',
    'Police Verification Expiry (पुलिस सत्यापन वैधता)',
  ];

  const sampleRows = [
    [
      'Rajesh Kumar Yadav',
      '9415012345',
      '9839098765',
      'DL-UP3220180029381',
      '2030-12-31',
      'Company Driver',
      16500,
      350,
      'ABCDE1234F',
      '4521 8901 2345',
      'UP32 AB 1234',
      'SBI A/c 30192837461, IFSC: SBIN0001234',
      'ग्राम बख्शी का तालाब, लखनऊ',
      '2025-04-01',
      '2028-12-31',
    ],
    [
      'Santosh Kumar Maurya',
      '9415088440',
      '',
      'DL-UP3220190044120',
      '2031-06-30',
      'Owner-Driver',
      0,
      350,
      'ABCDM5678G',
      '8912 3456 7890',
      'UP32 LN 8844',
      'PNB A/c 08910021001234, IFSC: PUNB0089100',
      'मलिहाबाद, लखनऊ',
      '2025-08-01',
      '2028-12-31',
    ],
    [
      'Dinesh Chandra Verma',
      '9839011223',
      '9450099887',
      'DL-UP3220200055198',
      '2032-09-30',
      'Company Driver',
      16000,
      350,
      'XYZPV9876Q',
      '3124 5678 9012',
      'UP32 MK 4501',
      'HDFC A/c 501002341298, IFSC: HDFC0000123',
      'आलमबाग, लखनऊ',
      '2026-02-15',
      '2028-12-31',
    ],
    [
      'Mohammad Aslam',
      '9792033445',
      '',
      'DL-UP3220170011890',
      '2029-11-30',
      'Company Driver',
      17000,
      350,
      'ASLMP4321R',
      '7890 1234 5678',
      'UP32 KZ 9912',
      'BOB A/c 123401009876, IFSC: BARB0ALAMBA',
      'चौक, लखनऊ',
      '2024-11-01',
      '2027-12-31',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  ws['!cols'] = [
    { wch: 24 }, // Driver Name
    { wch: 18 }, // Mobile
    { wch: 18 }, // Alternate Phone
    { wch: 24 }, // License No
    { wch: 16 }, // License Expiry
    { wch: 20 }, // Category
    { wch: 16 }, // Salary
    { wch: 14 }, // DA
    { wch: 16 }, // PAN
    { wch: 18 }, // Aadhaar
    { wch: 20 }, // Assigned Vehicle
    { wch: 32 }, // Bank details
    { wch: 30 }, // Address
    { wch: 16 }, // Joining Date
    { wch: 16 }, // Police Verification
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Drivers_Master');

  const instructionRows = [
    ['शक्ति ट्रैवल्स एंड टूर्स - चालक बल्क अपलोड निर्देश (Instructions)'],
    ['1. चालक का नाम (Driver Name), मोबाइल नंबर (Mobile Number) व डीएल नंबर अनिवार्य हैं।'],
    ['2. यदि चालक अपनी गाड़ी खुद चलाएगा, तो श्रेणी (Category) में "Owner-Driver" लिखें और मासिक वेतन में 0 दर्ज करें।'],
    ['3. यदि सामान्य कंपनी चालक है, तो "Company Driver" लिखें और मासिक वेतन (जैसे 16500) भरें।'],
    ['4. यदि किसी गाड़ी पर तुरंत तैनात करना है, तो "Assigned Vehicle Number" में सही गाड़ी नंबर (उदा. UP32 AB 1234) लिखें।'],
    ['5. तारीखें YYYY-MM-DD प्रारूप (उदा. 2030-12-31) में दर्ज करें।'],
  ];
  const wsHelp = XLSX.utils.aoa_to_sheet(instructionRows);
  XLSX.utils.book_append_sheet(wb, wsHelp, 'Help_Instructions');

  XLSX.writeFile(wb, 'Shakti_Travels_Drivers_Bulk_Template.xlsx');
}

/**
 * Downloads plain CSV version of Driver Template
 */
export function downloadDriverCsvTemplate() {
  const csvContent =
    'Driver Name,Mobile Number,Alternate Mobile,DL Number,License Expiry,Category,Monthly Salary,Daily DA Rate,PAN Number,Aadhaar Number,Assigned Vehicle,Bank Details,Address,Joining Date,Police Verification Expiry\n' +
    'Rajesh Kumar Yadav,9415012345,9839098765,DL-UP3220180029381,2030-12-31,Company Driver,16500,350,ABCDE1234F,4521 8901 2345,UP32 AB 1234,"SBI A/c 30192837461, SBIN0001234",Bakshi Ka Talab Lucknow,2025-04-01,2028-12-31\n' +
    'Santosh Kumar Maurya,9415088440,,DL-UP3220190044120,2031-06-30,Owner-Driver,0,350,ABCDM5678G,8912 3456 7890,UP32 LN 8844,"PNB A/c 08910021001234, PUNB0089100",Malihabad Lucknow,2025-08-01,2028-12-31\n' +
    'Dinesh Chandra Verma,9839011223,9450099887,DL-UP3220200055198,2032-09-30,Company Driver,16000,350,XYZPV9876Q,3124 5678 9012,UP32 MK 4501,"HDFC A/c 501002341298, HDFC0000123",Alambagh Lucknow,2026-02-15,2028-12-31\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Shakti_Travels_Drivers_Template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads a sample Excel (.xlsx) file for Bulk Officer Import
 */
export function downloadOfficerExcelTemplate() {
  const headers = [
    'Officer Name * (अधिकारी का नाम)',
    'Designation * (पदनाम e.g. Chief Engineer / SDM)',
    'Department * (विभाग e.g. PWD / NHAI / Revenue)',
    'Mobile Number * (मोबाइल नंबर 10 अंक)',
    'Alternate Phone (दूसरा फ़ोन नंबर)',
    'Office Address (कार्यालय कक्ष व पता)',
    'Tender Name or Number * (टेंडर अनुबंध का नाम या नंबर)',
    'Assigned Vehicle Number (तैनात गाड़ी नंबर e.g. UP32 AB 1234)',
    'Reporting Time (रिपोर्टिंग समय e.g. 09:30 AM)',
    'Official Email (ईमेल)',
    'Special Instructions / Route (विशेष निर्देश या रूट)',
  ];

  const sampleRows = [
    [
      'Er. Ramesh Chandra Sharma',
      'Chief Engineer (Roads & Bridges)',
      'PWD Nirman Bhawan',
      '9415011223',
      '9839011223',
      'कमरा नं. 304, निर्माण भवन, लखनऊ',
      'PWD PWD/CAB/2026-03',
      'UP32 AB 1234',
      '09:30 AM',
      'ce.roads.pwd@up.gov.in',
      'दैनिक कार्यालय आवागमन व राज्यमार्ग साइट निरीक्षण',
    ],
    [
      'Shri Alok Kumar IAS',
      'Project Director',
      'NHAI Regional Office',
      '9415022334',
      '',
      'एनएचएआई रीजनल ऑफिस, विभूति खंड, गोमती नगर',
      'NHAI NHAI/RO/UP/2026-01',
      'UP32 MK 4501',
      '09:00 AM',
      'pd.lucknow@nhai.org',
      'वीआईपी प्रोटोकॉल व लखनऊ-अयोध्या हाईवे निरीक्षण',
    ],
    [
      'Smt. Sunita Verma PCS',
      'Additional District Magistrate (E)',
      'Collectorate Lucknow',
      '9450033445',
      '9415033445',
      'कक्ष संख्या 12, कलेक्ट्रेट परिसर, हजरतगंज',
      'GeM-GEM/2026/B/874129',
      'UP32 LN 8844',
      '09:30 AM',
      'adm.lko@up.gov.in',
      'प्रशासनिक कार्य व कानून व्यवस्था ड्यूटी',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  ws['!cols'] = [
    { wch: 28 }, // Officer Name
    { wch: 32 }, // Designation
    { wch: 24 }, // Department
    { wch: 18 }, // Mobile
    { wch: 18 }, // Alternate Phone
    { wch: 36 }, // Office Address
    { wch: 26 }, // Tender
    { wch: 22 }, // Vehicle
    { wch: 16 }, // Reporting Time
    { wch: 26 }, // Email
    { wch: 38 }, // Special Instructions
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Officers_Master');

  const instructionRows = [
    ['शक्ति ट्रैवल्स एंड टूर्स - सरकारी अधिकारी बल्क अपलोड निर्देश (Instructions)'],
    ['1. अधिकारी का नाम, पदनाम, विभाग और मोबाइल नंबर अनिवार्य हैं।'],
    ['2. "Tender Name or Number" में संबंधित टेंडर का नाम लिखें।'],
    ['3. यदि किसी गाड़ी पर तैनात करना है, तो "Assigned Vehicle Number" में सही गाड़ी नंबर लिखें।'],
  ];
  const wsHelp = XLSX.utils.aoa_to_sheet(instructionRows);
  XLSX.utils.book_append_sheet(wb, wsHelp, 'Help_Instructions');

  XLSX.writeFile(wb, 'Shakti_Travels_Officers_Bulk_Template.xlsx');
}

/**
 * Downloads plain CSV version of Officer Template
 */
export function downloadOfficerCsvTemplate() {
  const csvContent =
    'Officer Name,Designation,Department,Mobile Number,Alternate Phone,Office Address,Tender Name or Number,Assigned Vehicle Number,Reporting Time,Official Email,Special Instructions\n' +
    'Er. Ramesh Chandra Sharma,Chief Engineer (Roads),PWD Nirman Bhawan,9415011223,9839011223,Room 304 Nirman Bhawan Lucknow,PWD PWD/CAB/2026-03,UP32 AB 1234,09:30 AM,ce.pwd@up.gov.in,Site Inspection\n' +
    'Shri Alok Kumar IAS,Project Director,NHAI Regional Office,9415022334,,NHAI Gomti Nagar Lucknow,NHAI NHAI/RO/UP/2026-01,UP32 MK 4501,09:00 AM,pd.lko@nhai.org,Expressway Inspection\n' +
    'Smt. Sunita Verma PCS,ADM Executive,Collectorate Lucknow,9450033445,9415033445,Collectorate Hazratganj,GeM-GEM/2026/B/874129,UP32 LN 8844,09:30 AM,adm.lko@up.gov.in,Administrative Duty\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Shakti_Travels_Officers_Template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads a sample Excel (.xlsx) file for Tenders Bulk Import
 */
export function downloadTenderExcelTemplate() {
  const headers = [
    'Tender Number * (टेंडर नंबर)',
    'Department Name * (विभाग का नाम)',
    'Authority Office * (प्राधिकरण कार्यालय)',
    'Start Date (शुरुआत तिथि YYYY-MM-DD)',
    'End Date (समाप्ति तिथि YYYY-MM-DD)',
    'Monthly Sanctioned Budget ₹ (मासिक बजट)',
    'Service Scope (स्कोप: vehicle_driver_fuel / vehicle_driver / vehicle_only)',
    'Vehicles Required Count (कुल आवश्यक गाड़ियाँ)',
    'Contact Officer Name (नोडल अधिकारी)',
    'Contact Officer Phone (मोबाइल नंबर)',
  ];

  const sampleRows = [
    [
      'PWD/CAB/2026-03',
      'Public Works Department (PWD UP)',
      'Nirman Bhawan Lucknow',
      '2026-04-01',
      '2027-03-31',
      240000,
      'vehicle_driver_fuel',
      4,
      'Er. Ramesh Chandra Sharma',
      '9415011223',
    ],
    [
      'NHAI/RO/UP/2026-01',
      'National Highways Authority of India',
      'Regional Office Gomti Nagar',
      '2026-01-01',
      '2026-12-31',
      180000,
      'vehicle_driver_fuel',
      3,
      'Shri Alok Kumar IAS',
      '9415022334',
    ],
    [
      'GEM/2026/B/874129',
      'Collectorate Lucknow (Revenue Dept)',
      'DM Office Hazratganj',
      '2026-02-01',
      '2027-01-31',
      150000,
      'vehicle_driver_fuel',
      2,
      'Smt. Sunita Verma PCS',
      '9450033445',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 24 }, { wch: 34 }, { wch: 30 }, { wch: 16 }, { wch: 16 },
    { wch: 24 }, { wch: 24 }, { wch: 16 }, { wch: 24 }, { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tenders_Master');
  XLSX.writeFile(wb, 'Shakti_Travels_Tenders_Bulk_Template.xlsx');
}

/**
 * Downloads plain CSV version of Tender Template
 */
export function downloadTenderCsvTemplate() {
  const csvContent =
    'Tender Number,Department Name,Authority Office,Start Date,End Date,Monthly Budget,Service Scope,Vehicles Required,Contact Officer,Contact Phone\n' +
    'PWD/CAB/2026-03,Public Works Department (PWD UP),Nirman Bhawan Lucknow,2026-04-01,2027-03-31,240000,vehicle_driver_fuel,4,Er. Ramesh Chandra Sharma,9415011223\n' +
    'NHAI/RO/UP/2026-01,National Highways Authority of India,Regional Office Gomti Nagar,2026-01-01,2026-12-31,180000,vehicle_driver_fuel,3,Shri Alok Kumar IAS,9415022334\n' +
    'GEM/2026/B/874129,Collectorate Lucknow (Revenue Dept),DM Office Hazratganj,2026-02-01,2027-01-31,150000,vehicle_driver_fuel,2,Smt. Sunita Verma PCS,9450033445\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Shakti_Travels_Tenders_Template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads sample Excel file for Daily Duty / Bookings
 */
export function downloadDutyBookingExcelTemplate() {
  const headers = [
    'Duty Date * (तारीख YYYY-MM-DD)',
    'Duty Slip / GR No * (पर्ची / जीआर नंबर)',
    'Client / Department Name * (विभाग या ग्राहक)',
    'Vehicle Number * (गाड़ी नंबर)',
    'Driver Name * (चालक का नाम)',
    'Driver Phone (चालक मोबाइल)',
    'Pickup Location (पिकअप स्थान)',
    'Drop Location (ड्रॉप स्थान)',
    'Duty Package (पैकेज e.g. local_8hr_80km / outstation / custom_package)',
    'Base Rate ₹ (तय दर)',
    'Garage Out KM (गैरेज स्टार्ट किमी)',
    'Garage In KM (गैरेज समाप्ति किमी)',
  ];

  const sampleRows = [
    [
      '2026-10-06',
      'GR-2026-1001',
      'Public Works Department (PWD UP)',
      'UP32 AB 1234',
      'Rajesh Kumar Yadav',
      '9415012345',
      'Nirman Bhawan Lucknow',
      'Sitapur Road Inspection',
      'local_8hr_80km',
      2400,
      24500,
      24585,
    ],
    [
      '2026-10-06',
      'GR-2026-1002',
      'NHAI Regional Office',
      'UP32 MK 4501',
      'Dinesh Chandra Verma',
      '9839011223',
      'Gomti Nagar RO',
      'Ayodhya Highway Site',
      'local_12hr_100km',
      3100,
      41800,
      41920,
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 16 }, { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 24 },
    { wch: 18 }, { wch: 26 }, { wch: 26 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily_Duty_Bookings');
  XLSX.writeFile(wb, 'Shakti_Travels_Duty_Register_Template.xlsx');
}

/**
 * Downloads plain CSV version of Duty/Booking Template
 */
export function downloadDutyBookingCsvTemplate() {
  const csvContent =
    'Duty Date,Duty Slip No,Client Name,Vehicle Number,Driver Name,Driver Phone,Pickup Location,Drop Location,Package,Base Rate,Garage Out KM,Garage In KM\n' +
    '2026-10-06,GR-2026-1001,PWD Nirman Bhawan,UP32 AB 1234,Rajesh Kumar Yadav,9415012345,Nirman Bhawan,Sitapur Road,local_8hr_80km,2400,24500,24585\n' +
    '2026-10-06,GR-2026-1002,NHAI Gomti Nagar,UP32 MK 4501,Dinesh Chandra Verma,9839011223,Gomti Nagar,Ayodhya Highway,local_12hr_100km,3100,41800,41920\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Shakti_Travels_Duty_Register_Template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads a sample Excel file for Vendors & Car Owners Import
 */
export function downloadVendorExcelTemplate() {
  const headers = [
    'Vendor / Owner Name * (वेंडर या कार मालिक का नाम)',
    'Mobile Number * (मोबाइल नंबर 10 अंक)',
    'Contact Person (संपर्क व्यक्ति)',
    'Vendor Type (प्रकार: owner_driver / fleet_vendor)',
    'Monthly Agreed Rate ₹ (तय मासिक किराया)',
    'TDS Applicable (लागू: Yes / No)',
    'TDS Rate % (दर: 1% या 2%)',
    'PAN Number (पैन नंबर)',
    'Bank Account & IFSC (बैंक खाता व आईएफएससी)',
    'City & Address (शहर व पता)',
  ];

  const sampleRows = [
    [
      'Santosh Kumar Maurya',
      '9415088440',
      'Santosh Maurya',
      'owner_driver',
      32000,
      'Yes',
      1,
      'ABCDM5678G',
      'PNB A/c 08910021001234, PUNB0089100',
      'Malihabad Lucknow',
    ],
    [
      'Shree Balaji Tour & Fleet Services',
      '9839055443',
      'Rakesh Shukla',
      'fleet_vendor',
      34000,
      'Yes',
      2,
      'BLJFS9876P',
      'HDFC A/c 501004561234, HDFC0000456',
      'Indira Nagar Lucknow',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 32 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 20 },
    { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 34 }, { wch: 26 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vendors_Master');
  XLSX.writeFile(wb, 'Shakti_Travels_Vendors_Bulk_Template.xlsx');
}

/**
 * Downloads plain CSV version of Vendor Template
 */
export function downloadVendorCsvTemplate() {
  const csvContent =
    'Vendor Name,Mobile Number,Contact Person,Vendor Type,Monthly Rate,TDS Applicable,TDS Rate,PAN Number,Bank Details,Address\n' +
    'Santosh Kumar Maurya,9415088440,Santosh Maurya,owner_driver,32000,Yes,1,ABCDM5678G,"PNB A/c 08910021001234, PUNB0089100",Malihabad Lucknow\n' +
    'Shree Balaji Tour & Fleet Services,9839055443,Rakesh Shukla,fleet_vendor,34000,Yes,2,BLJFS9876P,"HDFC A/c 501004561234, HDFC0000456",Indira Nagar Lucknow\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Shakti_Travels_Vendors_Template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads a combined Excel workbook containing Vehicles, Drivers, Officers AND Tenders sheets
 */
export function downloadCombinedFleetExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // 1. Vehicles Sheet (with explicit Driver Name and Mobile columns)
  const vehicleHeaders = [
    'Vehicle Number * (गाड़ी नंबर)',
    'Make & Model * (मेक व मॉडल)',
    'Vehicle Type (प्रकार: Sedan/SUV/MUV/Hatchback/EV)',
    'Fuel Type (ईंधन: Diesel/CNG/Petrol/Electric)',
    'Ownership Type (स्वामित्व: Company Owned / Owner-Driver / Attached)',
    'Driver Name (चालक का नाम)',
    'Driver Mobile (चालक का मोबाइल नंबर 10 अंक)',
    'Driver DL Number (चालक का डीएल नंबर)',
    'Driver Monthly Salary ₹ (चालक मासिक वेतन)',
    'Assigned Officer Name (तैनात अधिकारी का नाम)',
    'Tender Name or Number (टेंडर का नाम या नंबर)',
    'Vendor / Owner Name (वेंडर या कार मालिक का नाम)',
    'Monthly Rent to Vendor ₹ (वेंडर तय मासिक किराया)',
    'Current Odometer KM (वर्तमान किमी)',
    'Fitness Expiry (फिटनेस समाप्ति YYYY-MM-DD)',
    'Insurance Expiry (बीमा समाप्ति YYYY-MM-DD)',
    'PUC Expiry (प्रदूषण समाप्ति YYYY-MM-DD)',
    'Road Tax Expiry (रोड टैक्स YYYY-MM-DD)',
    'Permit Expiry (परमिट समाप्ति YYYY-MM-DD)',
  ];

  const vehicleSampleRows = [
    [
      'UP32 AB 1234',
      'Maruti Swift Dzire ZXi',
      'Sedan',
      'Diesel',
      'Company Owned',
      'Rajesh Kumar Yadav',
      '9415012345',
      'DL-UP3220180029381',
      16500,
      'Er. Ramesh Chandra Sharma',
      'PWD PWD/CAB/2026-03',
      'Shakti Travels and Tours',
      0,
      24500,
      '2028-06-30',
      '2027-04-15',
      '2026-12-31',
      '2028-12-31',
      '2028-06-30',
    ],
    [
      'UP32 LN 8844',
      'Maruti Swift Dzire VXi',
      'Sedan',
      'Diesel',
      'Owner-Driver',
      'Santosh Kumar Maurya',
      '9415088440',
      'DL-UP3220190044120',
      0,
      'Smt. Sunita Verma PCS',
      'GeM-GEM/2026/B/874129',
      'Santosh Kumar Maurya',
      32000,
      35200,
      '2028-06-30',
      '2027-03-31',
      '2026-11-30',
      '2028-12-31',
      '2028-06-30',
    ],
    [
      'UP32 MK 4501',
      'Toyota Innova Crysta 2.4 VX',
      'SUV',
      'Diesel',
      'Attached / Market Hire',
      'Dinesh Chandra Verma',
      '9839011223',
      'DL-UP3220200055198',
      17000,
      'Shri Alok Kumar IAS',
      'NHAI NHAI/RO/UP/2026-01',
      'Shree Balaji Tour & Fleet Services',
      34000,
      41800,
      '2027-12-31',
      '2027-02-28',
      '2026-12-31',
      '2028-12-31',
      '2027-08-31',
    ],
  ];

  const wsVeh = XLSX.utils.aoa_to_sheet([vehicleHeaders, ...vehicleSampleRows]);
  wsVeh['!cols'] = [
    { wch: 18 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 22 },
    { wch: 24 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 28 },
    { wch: 26 }, { wch: 32 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
    { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVeh, 'Vehicles_Master');

  // 2. Drivers Sheet
  const driverHeaders = [
    'Driver Name * (चालक का नाम)',
    'Mobile Number * (मोबाइल नंबर)',
    'Alternate Mobile (दूसरा मोबाइल)',
    'Driving License No. * (डीएल नंबर)',
    'License Expiry (डीएल समाप्ति YYYY-MM-DD)',
    'Driver Category (श्रेणी: Company Driver / Owner-Driver / Contractual)',
    'Monthly Salary ₹ (मासिक वेतन - Owner-Driver हेतु 0)',
    'Daily Outstation DA Rate ₹ (दैनिक रात्रि भत्ता)',
    'PAN Number (पैन कार्ड नंबर)',
    'Aadhaar Number (आधार कार्ड नंबर)',
    'Assigned Vehicle Number (तैनात गाड़ी नंबर e.g. UP32 AB 1234)',
    'Bank Account & IFSC (बैंक खाता व आईएफएससी)',
    'Permanent Address (स्थायी पता)',
    'Joining Date (कार्यभार ग्रहण तिथि YYYY-MM-DD)',
    'Police Verification Expiry (पुलिस सत्यापन वैधता)',
  ];

  const driverSampleRows = [
    [
      'Rajesh Kumar Yadav',
      '9415012345',
      '9839098765',
      'DL-UP3220180029381',
      '2030-12-31',
      'Company Driver',
      16500,
      350,
      'ABCDE1234F',
      '4521 8901 2345',
      'UP32 AB 1234',
      'SBI A/c 30192837461, IFSC: SBIN0001234',
      'ग्राम बख्शी का तालाब, लखनऊ',
      '2025-04-01',
      '2028-12-31',
    ],
    [
      'Santosh Kumar Maurya',
      '9415088440',
      '',
      'DL-UP3220190044120',
      '2031-06-30',
      'Owner-Driver',
      0,
      350,
      'ABCDM5678G',
      '8912 3456 7890',
      'UP32 LN 8844',
      'PNB A/c 08910021001234, IFSC: PUNB0089100',
      'मलिहाबाद, लखनऊ',
      '2025-08-01',
      '2028-12-31',
    ],
    [
      'Dinesh Chandra Verma',
      '9839011223',
      '9450099887',
      'DL-UP3220200055198',
      '2032-09-30',
      'Company Driver',
      16000,
      350,
      'XYZPV9876Q',
      '3124 5678 9012',
      'UP32 MK 4501',
      'HDFC A/c 501002341298, IFSC: HDFC0000123',
      'आलमबाग, लखनऊ',
      '2026-02-15',
      '2028-12-31',
    ],
  ];

  const wsDrv = XLSX.utils.aoa_to_sheet([driverHeaders, ...driverSampleRows]);
  wsDrv['!cols'] = [
    { wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 24 }, { wch: 16 },
    { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 18 },
    { wch: 20 }, { wch: 32 }, { wch: 30 }, { wch: 16 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDrv, 'Drivers_Master');

  // 3. Officers Sheet
  const officerHeaders = [
    'Officer Name * (अधिकारी का नाम)',
    'Designation * (पदनाम e.g. Chief Engineer / SDM)',
    'Department * (विभाग e.g. PWD / NHAI / Revenue)',
    'Mobile Number * (मोबाइल नंबर 10 अंक)',
    'Alternate Phone (दूसरा फ़ोन नंबर)',
    'Office Address (कार्यालय कक्ष व पता)',
    'Tender Name or Number * (टेंडर अनुबंध का नाम या नंबर)',
    'Assigned Vehicle Number (तैनात गाड़ी नंबर e.g. UP32 AB 1234)',
    'Reporting Time (रिपोर्टिंग समय e.g. 09:30 AM)',
    'Official Email (ईमेल)',
    'Special Instructions / Route (विशेष निर्देश या रूट)',
  ];

  const officerSampleRows = [
    [
      'Er. Ramesh Chandra Sharma',
      'Chief Engineer (Roads & Bridges)',
      'PWD Nirman Bhawan',
      '9415011223',
      '9839011223',
      'कमरा नं. 304, निर्माण भवन, लखनऊ',
      'PWD PWD/CAB/2026-03',
      'UP32 AB 1234',
      '09:30 AM',
      'ce.roads.pwd@up.gov.in',
      'दैनिक कार्यालय आवागमन व राज्यमार्ग साइट निरीक्षण',
    ],
    [
      'Shri Alok Kumar IAS',
      'Project Director',
      'NHAI Regional Office',
      '9415022334',
      '',
      'एनएचएआई रीजनल ऑफिस, विभूति खंड, गोमती नगर',
      'NHAI NHAI/RO/UP/2026-01',
      'UP32 MK 4501',
      '09:00 AM',
      'pd.lucknow@nhai.org',
      'वीआईपी प्रोटोकॉल व लखनऊ-अयोध्या हाईवे निरीक्षण',
    ],
  ];

  const wsOff = XLSX.utils.aoa_to_sheet([officerHeaders, ...officerSampleRows]);
  wsOff['!cols'] = [
    { wch: 28 }, { wch: 32 }, { wch: 24 }, { wch: 18 }, { wch: 18 },
    { wch: 36 }, { wch: 26 }, { wch: 22 }, { wch: 16 }, { wch: 26 }, { wch: 38 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOff, 'Officers_Master');

  // 4. Tenders Sheet
  const tenderHeaders = [
    'Tender Number * (टेंडर नंबर)',
    'Department Name * (विभाग का नाम)',
    'Authority Office * (प्राधिकरण कार्यालय)',
    'Start Date (शुरुआत तिथि YYYY-MM-DD)',
    'End Date (समाप्ति तिथि YYYY-MM-DD)',
    'Monthly Sanctioned Budget ₹ (मासिक बजट)',
    'Service Scope (स्कोप: vehicle_driver_fuel)',
    'Vehicles Required Count (कुल आवश्यक गाड़ियाँ)',
  ];

  const tenderSampleRows = [
    [
      'PWD/CAB/2026-03',
      'Public Works Department (PWD UP)',
      'Nirman Bhawan Lucknow',
      '2026-04-01',
      '2027-03-31',
      240000,
      'vehicle_driver_fuel',
      4,
    ],
    [
      'NHAI/RO/UP/2026-01',
      'National Highways Authority of India',
      'Regional Office Gomti Nagar',
      '2026-01-01',
      '2026-12-31',
      180000,
      'vehicle_driver_fuel',
      3,
    ],
  ];

  const wsTender = XLSX.utils.aoa_to_sheet([tenderHeaders, ...tenderSampleRows]);
  wsTender['!cols'] = [
    { wch: 24 }, { wch: 34 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTender, 'Tenders_Master');

  // 5. Instructions Sheet
  const instructions = [
    ['शक्ति ट्रैवल्स एंड टूर्स - संयुक्त मास्टर फ्लीट एक्सेल गाइड (Combined Master Fleet Import Guide)'],
    [''],
    ['महत्वपूर्ण निर्देश (Guidelines):'],
    ['1. इस एकल एक्सेल फाइल में 4 मुख्य शीट हैं:'],
    ['   - "Vehicles_Master" (गाड़ियों व उनके चालकों के लिए)'],
    ['   - "Drivers_Master" (चालकों के लिए)'],
    ['   - "Officers_Master" (सरकारी अधिकारियों के लिए)'],
    ['   - "Tenders_Master" (टेंडर अनुबंधों के लिए)'],
    ['2. "Vehicles_Master" शीट में "Driver Name" और "Driver Mobile" कॉलम दिए गए हैं। यहाँ नाम लिखते ही सॉफ्टवेयर ड्राइवर को अपने आप बनाकर गाड़ी से जोड़ देता है!'],
    ['3. यदि कोई व्यक्ति अपनी गाड़ी खुद चलाता है (Owner-Driver), तो Ownership Type में "Owner-Driver" लिखें।'],
    ['4. फाइल भरने के बाद सॉफ्टवेयर के "एक्सेल बल्क अपलोड व फीडिंग सेंटर" में अपलोड करें - सॉफ्टवेयर सभी शीट को पढ़कर आपस में लिंक कर देगा!'],
  ];
  const wsInst = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions_गाइड');

  XLSX.writeFile(wb, 'Shakti_Travels_Combined_Master_Template.xlsx');
}

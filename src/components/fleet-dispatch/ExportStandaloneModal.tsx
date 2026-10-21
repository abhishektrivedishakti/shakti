import React, { useState } from 'react';
import { BookingRecord, DispatcherProfile } from '../../types';
import {
  Download,
  Upload,
  FileCode,
  Database,
  X,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface ExportStandaloneModalProps {
  bookings: BookingRecord[];
  dispatcher: DispatcherProfile;
  onClose: () => void;
  onImportBackup: (importedBookings: BookingRecord[]) => void;
}

export const ExportStandaloneModal: React.FC<ExportStandaloneModalProps> = ({
  bookings,
  dispatcher,
  onClose,
  onImportBackup,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // 1. Export JSON Database
  const handleExportJSON = () => {
    const data = {
      app: 'Fleet Dispatch Pro',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      dispatcher,
      totalRecords: bookings.length,
      bookings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FleetDispatchPro_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Export Standalone HTML
  const handleExportHTML = () => {
    const serializedBookings = JSON.stringify(bookings);
    const serializedDispatcher = JSON.stringify(dispatcher);

    const htmlContent = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${dispatcher.companyName} - Fleet Dispatch Master</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background-color: #f4f7f9; color: #0b1c2c; }
  </style>
</head>
<body class="p-6 max-w-7xl mx-auto">
  <div class="bg-white border border-[#dce3ec] p-6 rounded-2xl mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-black text-[#0b1c2c]">${dispatcher.companyName}</h1>
      <p class="text-sm text-[#64748b]">${dispatcher.tagline} | GSTIN: ${dispatcher.gstin}</p>
    </div>
    <div class="text-right">
      <span class="text-xs text-teal-700 font-mono font-semibold">ऑफलाइन स्टैंडअलोन बैकअप</span>
      <div class="text-xs text-[#64748b]">${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="bg-white border border-[#dce3ec] rounded-2xl overflow-hidden shadow-xl">
    <div class="p-4 border-b border-[#dce3ec] flex justify-between items-center">
      <h2 class="font-bold text-[#0b1c2c] text-base">मास्टर ड्यूटी रजिस्टर (${bookings.length} रिकॉर्ड्स)</h2>
      <button onclick="window.print()" class="px-3 py-1.5 bg-[#0b1c2c] text-white rounded-lg text-xs font-semibold cursor-pointer">प्रिंट / PDF</button>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-[#64748b]">
        <thead class="bg-[#f5f7fa] text-[#64748b] font-semibold border-b border-[#dce3ec]">
          <tr>
            <th class="p-3">बुकिंग सं.</th>
            <th class="p-3">तारीख व समय</th>
            <th class="p-3">क्लाइंट / विभाग</th>
            <th class="p-3">सवारी / VIP</th>
            <th class="p-3">गाड़ी व चालक</th>
            <th class="p-3">पिकअप व ड्रॉप</th>
            <th class="p-3">पैकेज दर</th>
            <th class="p-3 text-right">कुल बिलिंग</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#dce3ec]">
          ${bookings
            .map(
              (b) => `
            <tr class="hover:bg-[#eef2f6]">
              <td class="p-3 font-mono font-bold text-teal-700">${b.bookingNumber}</td>
              <td class="p-3">${b.reportingDate}<br><span class="text-[#64748b]">${b.reportingTime}</span></td>
              <td class="p-3 font-medium text-[#0b1c2c]">${b.client.name}<br><span class="text-teal-700 text-[11px]">👤 ${b.booker.name}</span></td>
              <td class="p-3 font-semibold text-[#0b1c2c]">${b.passenger.name}<br><span class="text-[#64748b] text-[11px]">${b.passenger.designation || ''}</span></td>
              <td class="p-3 font-mono text-amber-700">${b.vehicleNumber}<br><span class="text-[#64748b] text-[11px] font-sans">👨‍✈️ ${b.driverName}</span></td>
              <td class="p-3 text-[#64748b]">🚩 ${b.pickupLocation}<br>➔ ${b.dropLocation}</td>
              <td class="p-3 text-[#64748b]">${b.tariff.packageName}</td>
              <td class="p-3 text-right font-bold text-[#0369a1]">₹${b.tariff.netClientBillable.toLocaleString('en-IN')}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>

  <script>
    window.__FLEET_DISPATCH_DATA__ = {
      dispatcher: ${serializedDispatcher},
      bookings: ${serializedBookings}
    };
    console.log("Fleet Dispatch Pro data loaded:", window.__FLEET_DISPATCH_DATA__);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fleet_Dispatch_Master_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 3. Import JSON Backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.bookings)) {
          onImportBackup(parsed.bookings);
          setImportStatus(`सफलतापूर्वक ${parsed.bookings.length} ड्यूटी रिकॉर्ड्स रिस्टोर कर लिए गए!`);
        } else if (Array.isArray(parsed)) {
          onImportBackup(parsed);
          setImportStatus(`सफलतापूर्वक ${parsed.length} ड्यूटी रिकॉर्ड्स रिस्टोर कर लिए गए!`);
        } else {
          setImportStatus('अमान्य JSON प्रारूप। कृप्या वैध बैकअप फ़ाइल चुनें।');
        }
      } catch (err) {
        setImportStatus('फ़ाइल पढ़ने में त्रुटि। कृपया सही JSON फ़ाइल चुनें।');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-ink)]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="panel panel-pad w-full max-w-xl space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-ink)]">
                डेटा एक्सपोर्ट व स्टैंडअलोन बैकअप (Export & Backup)
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                1-क्लिक स्टैंडअलोन HTML फ़ाइल, JSON डेटाबेस व रिस्टोर
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-sand-deep)] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1-Click Standalone HTML */}
          <div className="bg-[var(--color-surface-muted)] border border-[var(--color-line)] p-4 rounded-xl flex flex-col justify-between hover:border-[var(--color-line-strong)] transition">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <FileCode className="w-4 h-4" />
                स्टैंडअलोन HTML फ़ाइल
              </div>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                पूरा ड्यूटी रजिस्टर और डेटा एक सिंगल HTML फ़ाइल में डाउनलोड करें, जिसे बिना इंटरनेट किसी भी ब्राउज़र में खोला जा सकता है।
              </p>
            </div>
            <button
              onClick={handleExportHTML}
              className="btn btn-success mt-4 w-full text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              डाउनलोड HTML
            </button>
          </div>

          {/* JSON Database Backup */}
          <div className="bg-[var(--color-surface-muted)] border border-[var(--color-line)] p-4 rounded-xl flex flex-col justify-between hover:border-[var(--color-line-strong)] transition">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <Database className="w-4 h-4" />
                JSON डेटाबेस बैकअप
              </div>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                पूरा डेटाबेस (क्लाइंट, बुकर, गाड़ियां, टैरिफ व ड्यूटीज) सुरक्षित JSON फॉर्मेट में सेव करें ताकि कभी भी पुनः लोड किया जा सके।
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="btn btn-primary mt-4 w-full text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              डाउनलोड JSON
            </button>
          </div>
        </div>

        {/* Restore Backup Section */}
        <div className="bg-[var(--color-surface-muted)] border border-[var(--color-line)] p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
            <Upload className="w-4 h-4" />
            बैकअप से डेटा रिस्टोर करें (Restore from JSON)
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            यदि आपके पास पहले से सेव किया हुआ JSON बैकअप है, तो उसे यहाँ अपलोड करके सारा रिकॉर्ड वापस ला सकते हैं:
          </p>

          <label className="block w-full cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-xs text-[var(--color-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-ink)] file:text-white hover:file:bg-[var(--color-ink-soft)] file:cursor-pointer"
            />
          </label>

          {importStatus && (
            <div className="text-xs p-2.5 rounded-lg bg-teal-50 border border-teal-600/20 text-teal-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

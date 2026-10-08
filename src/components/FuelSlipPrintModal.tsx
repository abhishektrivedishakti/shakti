import React from 'react';
import { Printer, X, Share2, CheckCircle2, Fuel } from 'lucide-react';
import { FuelSlip } from '../types';
import { formatDate } from '../utils/calculations';

interface FuelSlipPrintModalProps {
  slip: FuelSlip | null;
  onClose: () => void;
}

export const FuelSlipPrintModal: React.FC<FuelSlipPrintModalProps> = ({ slip, onClose }) => {
  if (!slip) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const text = `*शक्ति ट्रैवल्स एंड टूर्स - ईंधन पर्ची / FUEL SLIP*
पर्ची संख्या: ${slip.slipNumber}
दिनांक: ${formatDate(slip.issueDate)} ${slip.issueTime || ''}
गाड़ी संख्या: ${slip.vehicleNumber} (${slip.vehicleModel || 'Fleet Vehicle'})
चालक: ${slip.driverName} (${slip.driverPhone || 'N/A'})
पेट्रोल पंप: ${slip.pumpVendorName}
ईंधन प्रकार: ${slip.fuelType}
स्वीकृत मात्रा: ${slip.authorizedQuantityType === 'full_tank' ? 'Full Tank (टैंक फुल)' : slip.authorizedQuantityType === 'fixed_amount' ? `₹${slip.authorizedValue} का` : `${slip.authorizedValue} Liters`}
ओडोमीटर: ${slip.openingOdometerKm ? `${slip.openingOdometerKm} KM` : 'N/A'}
जारीकर्ता: ${slip.issuedBy}

कृपया यह पर्ची पेट्रोल पंप पर दिखाकर ईंधन भरवाएं एवं रसीद कार्यालय में जमा करें।`;

    window.open(`https://wa.me/${slip.driverPhone ? '91' + slip.driverPhone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">कार्यालय ईंधन पर्ची (Official Fuel Slip / Chit)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
        </div>

        {/* Printable Paper Slip Template */}
        <div className="border-2 border-dashed border-slate-400 rounded-xl p-5 bg-amber-50/40 text-slate-900 font-sans space-y-4 shadow-inner">
          <div className="text-center border-b-2 border-slate-800 pb-3">
            <h2 className="text-lg font-black tracking-wider text-slate-900 uppercase">
              SHAKTI TRAVELS &amp; TOURS
            </h2>
            <p className="text-[11px] font-semibold text-slate-700">
              Government Fleet Contractor &bull; Taxi, Cab &amp; Bus Services
            </p>
            <p className="text-[10px] text-slate-500">Transport Nagar / Faizabad Road, Lucknow (UP)</p>
            <div className="mt-2 inline-block bg-slate-900 text-white font-mono text-xs font-bold px-3 py-0.5 rounded">
              VEHICLE FUEL INDENT / ईंधन पर्ची
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono font-bold border-b border-slate-300 pb-2">
            <span>SLIP NO: <span className="text-indigo-900 underline">{slip.slipNumber}</span></span>
            <span>DATE: {formatDate(slip.issueDate)} {slip.issueTime || ''}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Authorized Fuel Pump / पेट्रोल पंप:</span>
              <span className="font-bold text-slate-900 text-sm">{slip.pumpVendorName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Fuel Type / प्रकार:</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {slip.fuelType}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Vehicle No / गाड़ी नंबर:</span>
              <span className="font-mono font-black text-slate-900 text-sm bg-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500">
                {slip.vehicleNumber}
              </span>
              <div className="text-[10px] text-slate-600 mt-0.5">{slip.vehicleModel || 'Fleet Vehicle'}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Driver Name / चालक:</span>
              <span className="font-bold text-slate-900">{slip.driverName}</span>
              <div className="text-[10px] font-mono text-slate-600">{slip.driverPhone || 'Mobile: N/A'}</div>
            </div>
          </div>

          <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-200 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-indigo-700 block uppercase font-bold">Authorized Fuel Qty / स्वीकृत मात्रा:</span>
                <span className="font-black text-indigo-950 text-base">
                  {slip.authorizedQuantityType === 'full_tank'
                    ? 'FULL TANK (टैंक फुल)'
                    : slip.authorizedQuantityType === 'fixed_amount'
                    ? `₹${slip.authorizedValue.toLocaleString('en-IN')} (फिक्स राशि)`
                    : `${slip.authorizedValue} LITERS / KG`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Opening Odometer:</span>
                <span className="font-mono font-bold text-slate-800">
                  {slip.openingOdometerKm ? `${slip.openingOdometerKm.toLocaleString()} KM` : '____ KM'}
                </span>
              </div>
            </div>
          </div>

          {/* Actual Refill Section if Filled */}
          {slip.status === 'filled' && (
            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-300 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span>Filled: {slip.actualLiters} L @ ₹{slip.ratePerLiter}/L</span>
                <span>Total: ₹{slip.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[10px] text-emerald-700 flex justify-between font-mono">
                <span>Receipt: {slip.pumpReceiptNumber || 'N/A'}</span>
                <span>Filled on: {slip.fillDate}</span>
              </div>
            </div>
          )}

          {/* Signatures & Seal Section */}
          <div className="pt-6 grid grid-cols-3 gap-2 text-center text-[10px] border-t border-slate-300 mt-4 text-slate-600 font-semibold">
            <div className="border-t border-slate-400 pt-1">
              <p>चालक हस्ताक्षर</p>
              <p className="text-[9px] text-slate-400">(Driver Sign)</p>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <p>जारीकर्ता मुंशी / मैनेजर</p>
              <p className="text-[9px] text-slate-500 font-bold">{slip.issuedBy}</p>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <p>पंप मोहर व रसीद</p>
              <p className="text-[9px] text-slate-400">(Pump Stamp)</p>
            </div>
          </div>

          <p className="text-[9px] text-center text-slate-400 italic">
            नोट: यह पर्ची केवल अधिकृत पेट्रोल पंप पर ही मान्य है। ईंधन भराने के बाद रसीद व पर्ची तुरंत कार्यालय में जमा करें।
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2 print:hidden">
          <button
            onClick={handleWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            ड्राइवर को WhatsApp करें
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              बंद करें
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              प्रिंट पर्ची (Print Slip)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

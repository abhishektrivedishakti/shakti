import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Building2,
  Car,
  Users,
  ExternalLink,
} from 'lucide-react';
import { ReminderItem, MonthlyBill, Tender } from '../types';
import { formatCurrency, formatDate, getDaysDiff } from '../utils/calculations';

interface RemindersCenterViewProps {
  reminders: ReminderItem[];
  bills: MonthlyBill[];
  tenders: Tender[];
}

export const RemindersCenterView: React.FC<RemindersCenterViewProps> = ({
  reminders,
  bills,
  tenders,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedReminderForDraft, setSelectedReminderForDraft] = useState<ReminderItem | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const filteredReminders = reminders.filter((r) => {
    if (filterType === 'all') return true;
    return r.type === filterType;
  });

  const handleOpenDraft = (rem: ReminderItem) => {
    setSelectedReminderForDraft(rem);
    setCopiedText(false);
  };

  const generateReminderText = (rem: ReminderItem): string => {
    const bill = bills.find((b) => b.id === rem.metadata.billId);
    const tender = tenders.find((t) => t.id === rem.metadata.tenderId);

    if (rem.type === 'bill_overdue' && bill) {
      const days = Math.abs(getDaysDiff(bill.dueDate));
      return `To,\nThe Accounts Officer / Executive Engineer,\n${bill.departmentName}\n\nSubject: Request for expedited payment release of Vehicle Hiring Bill No: ${bill.billNumber}\n\nRespected Sir/Madam,\nThis is a humble reminder regarding our monthly vehicle hiring bill for vehicle ${bill.vehicleNumber} (Month: ${bill.monthYear}) amounting to ${formatCurrency(bill.netPayableAmount)} submitted on ${formatDate(bill.billDate)} under Work Order ${tender?.workOrderNumber || 'N/A'}.\n\nAs per tender terms, payment was due on ${formatDate(bill.dueDate)} (overdue by ${days} days). Kindly expedite the passing and release through Treasury / PFMS.\n\nThanking you,\nSincerely,\nAuthorized Signatory\nShakti Travels and Tours (Mob: 9839000000)`;
    }

    if (rem.type === 'bill_due' && tender) {
      return `To,\nThe Office Incharge,\n${tender.departmentName}\n\nSubject: Submission of Monthly Vehicle Hiring Bill & Certified Logbook\n\nDear Sir,\nPlease find enclosed our vehicle hiring monthly bill and verified daily duty slips for the current billing cycle under Work Order ${tender.workOrderNumber}. Kindly process the voucher.\n\nRegards,\nShakti Travels and Tours`;
    }

    if (rem.type === 'company_doc_expiry') {
      return `*SHAKTI TRAVELS AND TOURS (शक्ति ट्रैवल्स एंड टूर्स)*\n⚠️ *COMPANY DOCUMENT EXPIRY NOTICE*\nDocument: ${rem.title}\nDetails: ${rem.description}\nTarget Expiry Date: ${formatDate(rem.dueDate)}\nKindly initiate renewal at earliest to prevent disruption in Govt e-Tenders & operations.`;
    }

    return `Reminder Alert: ${rem.title}\nDetails: ${rem.description}\nTarget Date: ${formatDate(rem.dueDate)}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <span>Automated Payment Reminders &amp; Expiries &bull; अलर्ट्स व रिमाइंडर्स</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            सरकारी विभागों को बिल भुगतान तगादा, बिल जमा करने की अंतिम तिथि व फिटनेस/इंश्योरेंस नवीनीकरण
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Alerts ({reminders.length})
          </button>
          <button
            onClick={() => setFilterType('bill_overdue')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'bill_overdue'
                ? 'bg-white text-rose-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overdue Bills
          </button>
          <button
            onClick={() => setFilterType('company_doc_expiry')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'company_doc_expiry'
                ? 'bg-white text-purple-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Company Docs Expiries
          </button>
          <button
            onClick={() => setFilterType('doc_expiry')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'doc_expiry'
                ? 'bg-white text-amber-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vehicle Expiries
          </button>
          <button
            onClick={() => setFilterType('police_verification')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'police_verification'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Driver Verifications
          </button>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">All Clear! No pending urgent alerts.</p>
            <p className="text-xs text-slate-500 mt-0.5">
              All vehicle compliances, driver verification and govt bill payments are on track.
            </p>
          </div>
        ) : (
          filteredReminders.map((rem) => {
            const isHigh = rem.severity === 'high';

            return (
              <div
                key={rem.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isHigh
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : rem.severity === 'medium'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="mt-0.5 shrink-0">
                    {isHigh ? (
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <Clock className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm leading-snug">{rem.title}</h4>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded ${
                          isHigh ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {rem.severity} Priority
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                      {rem.description}
                    </p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-0.5">
                      <span>Due Date: <strong>{formatDate(rem.dueDate)}</strong></span>
                      {rem.metadata.entityName && (
                        <span>&bull; Entity: <strong>{rem.metadata.entityName}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {(rem.type === 'bill_overdue' || rem.type === 'bill_due') && (
                    <button
                      onClick={() => handleOpenDraft(rem)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Draft Reminder Notice (तगादा पत्र)
                    </button>
                  )}

                  {rem.type === 'doc_expiry' && (
                    <a
                      href="https://parivahan.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Parivahan RTO Portal
                    </a>
                  )}

                  {rem.type === 'police_verification' && (
                    <a
                      href="https://uppolice.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      UP Cop Portal
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reminder Notice Generator Modal */}
      {selectedReminderForDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <span>Govt Payment Follow-up Notice (तगादा पत्र)</span>
              </h3>
              <button
                onClick={() => setSelectedReminderForDraft(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600">
              विभाग के लेखा अधिकारी अथवा कार्यपालक अभियंता को भेजने हेतु अधिकृत तगादा संदेश:
            </p>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {generateReminderText(selectedReminderForDraft)}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                You can copy and send via WhatsApp, Email or Official DAK letter.
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedReminderForDraft(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Close
                </button>

                <button
                  onClick={() => handleCopy(generateReminderText(selectedReminderForDraft))}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied! (कॉपी हो गया)</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Notice (कॉपी करें)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

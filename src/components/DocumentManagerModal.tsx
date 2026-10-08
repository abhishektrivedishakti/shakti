import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Eye,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Car,
  User,
  CreditCard,
  FileCheck,
  BadgeCheck,
  Hash,
} from 'lucide-react';
import {
  DocumentAttachment,
  DocumentCategory,
  Vehicle,
  Driver,
  Tender,
} from '../types';
import { formatDate, getDaysDiff } from '../utils/calculations';

interface DocumentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'vehicle' | 'driver' | 'tender';
  entity: Vehicle | Driver | Tender | null;
  onUpdateEntity: (updatedEntity: any) => void;
}

export const DocumentManagerModal: React.FC<DocumentManagerModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entity,
  onUpdateEntity,
}) => {
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<DocumentAttachment | null>(null);
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload Form State
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(
    entityType === 'vehicle'
      ? 'rc'
      : entityType === 'driver'
      ? 'driving_license'
      : 'work_order'
  );
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [uploadAuthority, setUploadAuthority] = useState('');
  const [uploadIssueDate, setUploadIssueDate] = useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFileDataUrl, setUploadFileDataUrl] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState('');

  if (!isOpen || !entity) return null;

  // Derive existing documents or build standard checklist
  const documents: DocumentAttachment[] = (entity as any).documents || [];

  // Helper to get entity display label
  const getEntityTitle = () => {
    if (entityType === 'vehicle') {
      const v = entity as Vehicle;
      return `${v.vehicleNumber} (${v.makeModel})`;
    }
    if (entityType === 'driver') {
      const d = entity as Driver;
      return `${d.name} (Lic: ${d.licenseNumber})`;
    }
    const t = entity as Tender;
    return `${t.departmentName} &bull; ${t.tenderNumber}`;
  };

  const getCategoryName = (cat: DocumentCategory) => {
    switch (cat) {
      case 'rc': return 'RC (Registration Certificate)';
      case 'insurance': return 'Commercial Insurance Policy';
      case 'puc': return 'PUC (Pollution Certificate)';
      case 'tax': return 'Road Tax Receipt';
      case 'fitness': return 'Commercial Fitness Certificate';
      case 'permit': return 'Commercial Taxi Permit';
      case 'aadhaar': return 'Aadhaar Card (आधार)';
      case 'driving_license': return 'Commercial Driving License (DL)';
      case 'pan': return 'PAN Card (स्थाई खाता संख्या)';
      case 'police_verification': return 'Police Verification (चरित्र सत्यापन)';
      case 'work_order': return 'Work Order / LOA (कार्य आदेश)';
      case 'tender_agreement': return 'Tender Agreement / Contract Copy';
      case 'emd_bg': return 'EMD / Bank Guarantee / FDR';
      case 'gem_contract': return 'GeM Contract Sanction Order';
      default: return 'Official Document';
    }
  };

  // Handle local file read to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadFileDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit New / Updated Document
  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle) {
      alert('Please enter a Document Title.');
      return;
    }

    const newDoc: DocumentAttachment = {
      id: `doc-${Date.now()}`,
      title: uploadTitle,
      category: uploadCategory,
      documentNumber: uploadDocNumber || undefined,
      issuingAuthority: uploadAuthority || undefined,
      issueDate: uploadIssueDate || undefined,
      expiryDate: uploadExpiryDate || undefined,
      fileName: uploadFileName || `${uploadCategory}_doc.pdf`,
      fileType: uploadFileName?.toLowerCase().endsWith('.png') || uploadFileName?.toLowerCase().endsWith('.jpg') || uploadFileName?.toLowerCase().endsWith('.jpeg') ? 'image' : 'pdf',
      fileUrl: uploadFileDataUrl || undefined,
      fileSize: uploadFileName ? '1.8 MB' : '1.2 MB',
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      verified: true,
      notes: uploadNotes || undefined,
    };

    // Filter out previous version of this specific category if re-uploading
    const updatedDocs = [
      ...documents.filter((d) => d.category !== uploadCategory || d.id === newDoc.id),
      newDoc,
    ];

    // Propagate updates to the entity root fields for seamless integrity
    let updatedEntity: any = { ...entity, documents: updatedDocs };

    if (entityType === 'vehicle') {
      const v = updatedEntity as Vehicle;
      if (uploadCategory === 'insurance' && uploadExpiryDate) {
        v.insuranceExpiry = uploadExpiryDate;
        if (uploadDocNumber) v.insurancePolicyNo = uploadDocNumber;
        if (uploadAuthority) v.insuranceCompany = uploadAuthority;
      } else if (uploadCategory === 'puc' && uploadExpiryDate) {
        v.pucExpiry = uploadExpiryDate;
      } else if (uploadCategory === 'fitness' && uploadExpiryDate) {
        v.rtoFitnessExpiry = uploadExpiryDate;
        if (uploadDocNumber) v.fitnessCertNumber = uploadDocNumber;
      } else if (uploadCategory === 'tax' && uploadExpiryDate) {
        v.roadTaxExpiry = uploadExpiryDate;
        if (uploadDocNumber) v.taxReceiptNumber = uploadDocNumber;
      } else if (uploadCategory === 'permit' && uploadExpiryDate) {
        v.permitExpiry = uploadExpiryDate;
        if (uploadDocNumber) v.permitNumber = uploadDocNumber;
      } else if (uploadCategory === 'rc' && uploadDocNumber) {
        v.rcNumber = uploadDocNumber;
      }
      updatedEntity = v;
    } else if (entityType === 'driver') {
      const d = updatedEntity as Driver;
      if (uploadCategory === 'driving_license' && uploadExpiryDate) {
        d.licenseExpiry = uploadExpiryDate;
        if (uploadDocNumber) d.licenseNumber = uploadDocNumber;
      } else if (uploadCategory === 'police_verification' && uploadExpiryDate) {
        d.policeVerificationExpiry = uploadExpiryDate;
        if (uploadIssueDate) d.policeVerificationDate = uploadIssueDate;
      } else if (uploadCategory === 'aadhaar' && uploadDocNumber) {
        d.aadharNumber = uploadDocNumber;
      } else if (uploadCategory === 'pan' && uploadDocNumber) {
        d.panNumber = uploadDocNumber;
      }
      updatedEntity = d;
    } else if (entityType === 'tender') {
      const t = updatedEntity as Tender;
      if (uploadCategory === 'work_order' && uploadDocNumber) {
        t.workOrderNumber = uploadDocNumber;
      } else if (uploadCategory === 'emd_bg' && uploadDocNumber) {
        t.emdDetails = `BG #${uploadDocNumber} Exp: ${uploadExpiryDate || 'N/A'}`;
      } else if (uploadCategory === 'tender_agreement' && uploadDocNumber) {
        t.agreementNumber = uploadDocNumber;
      }
      updatedEntity = t;
    }

    onUpdateEntity(updatedEntity);
    setIsUploadFormOpen(false);
    resetUploadForm();
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadDocNumber('');
    setUploadAuthority('');
    setUploadIssueDate('');
    setUploadExpiryDate('');
    setUploadNotes('');
    setUploadFileDataUrl('');
    setUploadFileName('');
  };

  const handleDeleteDocument = (docId: string) => {
    if (!confirm('Are you sure you want to remove this document record?')) return;
    const updatedDocs = documents.filter((d) => d.id !== docId);
    onUpdateEntity({ ...entity, documents: updatedDocs });
  };

  // Helper to open upload modal with prefilled category
  const handleQuickUploadCategory = (cat: DocumentCategory, defaultTitle: string) => {
    setUploadCategory(cat);
    setUploadTitle(defaultTitle);
    resetUploadForm();
    setUploadTitle(defaultTitle);
    setUploadCategory(cat);
    setIsUploadFormOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              {entityType === 'vehicle' && <Car className="w-6 h-6 text-amber-400" />}
              {entityType === 'driver' && <User className="w-6 h-6 text-emerald-400" />}
              {entityType === 'tender' && <Building2 className="w-6 h-6 text-indigo-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {entityType === 'vehicle' && 'Vehicle Documents & Compliance Vault (गाड़ी के दस्तावेज)'}
                  {entityType === 'driver' && 'Driver KYC & Compliance Dossier (चालक दस्तावेज व सत्यापन)'}
                  {entityType === 'tender' && 'Tender & Work Order Documents (टेंडर व अनुबंध दस्तावेज)'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider border border-emerald-500/30">
                  Govt Compliant
                </span>
              </div>
              <p
                className="text-xs text-slate-300 mt-0.5"
                dangerouslySetInnerHTML={{ __html: getEntityTitle() }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetUploadForm();
                setIsUploadFormOpen(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload Document (दस्तावेज अपलोड)
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Quick Compliance Status Ribbon for Vehicle or Driver */}
          {entityType === 'vehicle' && (() => {
            const v = entity as Vehicle;
            const fitDiff = v.rtoFitnessExpiry ? getDaysDiff(v.rtoFitnessExpiry) : null;
            const insDiff = v.insuranceExpiry ? getDaysDiff(v.insuranceExpiry) : null;
            const pucDiff = v.pucExpiry ? getDaysDiff(v.pucExpiry) : null;
            const taxDiff = v.roadTaxExpiry ? getDaysDiff(v.roadTaxExpiry) : null;

            return (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Mandatory Commercial Transport Documents Status (परिवहन विभाग अनिवार्यता)
                  </span>
                  <span className="font-mono text-slate-500">Reg: {v.vehicleNumber}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                  {/* RC */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">RC (पंजीकरण)</span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                          Active
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 block mt-1">
                        {v.rcNumber || v.vehicleNumber}
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickUploadCategory('rc', `Registration Certificate (RC) - ${v.vehicleNumber}`)}
                      className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold text-left flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Update / Re-upload
                    </button>
                  </div>

                  {/* Insurance */}
                  <div
                    className={`p-3 rounded-lg border flex flex-col justify-between ${
                      insDiff !== null && insDiff <= 30
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Insurance (बीमा)</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            insDiff !== null && insDiff <= 30
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {insDiff !== null && insDiff < 0
                            ? 'Expired'
                            : insDiff !== null && insDiff <= 30
                            ? `${insDiff}d left`
                            : 'Valid'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-1">
                        Due: <strong>{formatDate(v.insuranceExpiry)}</strong>
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {v.insuranceCompany || 'Commercial Policy'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickUploadCategory('insurance', `Insurance Policy - ${v.vehicleNumber}`)}
                      className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold text-left flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Update Policy
                    </button>
                  </div>

                  {/* PUC */}
                  <div
                    className={`p-3 rounded-lg border flex flex-col justify-between ${
                      pucDiff !== null && pucDiff <= 15
                        ? 'bg-rose-50/70 border-rose-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">PUC (प्रदूषण)</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pucDiff !== null && pucDiff <= 15
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {pucDiff !== null && pucDiff < 0
                            ? 'Expired'
                            : pucDiff !== null && pucDiff <= 15
                            ? `${pucDiff}d left`
                            : 'Valid'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-1">
                        Due: <strong>{formatDate(v.pucExpiry)}</strong>
                      </span>
                      <span className="text-[10px] text-slate-400 block">Bharat Stage VI Norms</span>
                    </div>
                    <button
                      onClick={() => handleQuickUploadCategory('puc', `PUC Certificate - ${v.vehicleNumber}`)}
                      className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold text-left flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Update PUC
                    </button>
                  </div>

                  {/* Road Tax & Fitness */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Tax &amp; Fitness</span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                          Valid
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-1">
                        Fitness: <strong>{formatDate(v.rtoFitnessExpiry)}</strong>
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Road Tax: {formatDate(v.roadTaxExpiry)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickUploadCategory('fitness', `Commercial Fitness Certificate - ${v.vehicleNumber}`)}
                      className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold text-left flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Update Fitness
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Compliance Status Ribbon for Driver */}
          {entityType === 'driver' && (() => {
            const d = entity as Driver;
            const licDiff = d.licenseExpiry ? getDaysDiff(d.licenseExpiry) : null;
            const polDiff = d.policeVerificationExpiry ? getDaysDiff(d.policeVerificationExpiry) : null;

            return (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Driver KYC &amp; Verification Status (चालक पहचान व चरित्र सत्यापन)
                  </span>
                  <span className="font-mono text-slate-500">ID: {d.id}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                  {/* Aadhaar */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Aadhaar (आधार)</span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                          UIDAI Verified
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-900 font-semibold block mt-1">
                        {d.aadharNumber || 'XXXX-XXXX-XXXX'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickUploadCategory('aadhaar', `Aadhaar Card Copy - ${d.name}`)}
                      className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold text-left flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Upload Copy
                    </button>
                  </div>

                  {/* Driving License */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Licence (DL)</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            licDiff !== null && licDiff <= 30
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {licDiff !== null && licDiff < 0
                            ? 'Expired'
                            : licDiff !== null && licDiff <= 30
                            ? `${licDiff}d left`
                            : 'Valid'}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-900 font-semibold block mt-1">
                        {d.licenseNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Valid till: {formatDate(d.licenseExpiry)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickUploadCategory('driving_license', `Driving License Card - ${d.name}`)}
                      className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold text-left flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Upload DL Card
                    </button>
                  </div>

                  {/* PAN Card */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">PAN (पैन कार्ड)</span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                          IT Dept
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-900 font-semibold block mt-1">
                        {d.panNumber || `BKPPD${d.id.slice(-4).padStart(4, '1')}A`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickUploadCategory('pan', `PAN Card Copy - ${d.name}`)}
                      className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold text-left flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Upload PAN
                    </button>
                  </div>

                  {/* Police Verification */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Police Verification</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            polDiff !== null && polDiff <= 30
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {polDiff !== null && polDiff < 0 ? 'Expired' : 'Verified'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-1">
                        Valid till: <strong>{formatDate(d.policeVerificationExpiry)}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => handleQuickUploadCategory('police_verification', `Police Verification Certificate - ${d.name}`)}
                      className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold text-left flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Upload Certificate
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Documents Grid / Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Uploaded Documents &amp; Certificates ({documents.length})</span>
              </h4>
              <span className="text-xs text-slate-500">
                Click any document to view, print, or download certified copy
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No documents uploaded yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click the &quot;Upload Document&quot; button above to attach scans of RC, insurance, driving license, or tender contracts.
                </p>
                <button
                  onClick={() => {
                    resetUploadForm();
                    setIsUploadFormOpen(true);
                  }}
                  className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload First Document
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((doc) => {
                  const isExpired = doc.expiryDate ? getDaysDiff(doc.expiryDate) < 0 : false;
                  const isExpiringSoon = doc.expiryDate
                    ? getDaysDiff(doc.expiryDate) >= 0 && getDaysDiff(doc.expiryDate) <= 30
                    : false;

                  return (
                    <div
                      key={doc.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 mt-0.5">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-slate-900 leading-tight">
                                {doc.title}
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                {getCategoryName(doc.category)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {isExpired && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                Expired
                              </span>
                            )}
                            {isExpiringSoon && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Expiring Soon
                              </span>
                            )}
                            {!isExpired && !isExpiringSoon && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                <BadgeCheck className="w-3 h-3" /> Valid
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Doc Details */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {doc.documentNumber && (
                            <div>
                              <span className="text-slate-400 text-[10px] block">Document / Ref #</span>
                              <span className="font-mono font-bold text-slate-800">{doc.documentNumber}</span>
                            </div>
                          )}
                          {doc.issuingAuthority && (
                            <div>
                              <span className="text-slate-400 text-[10px] block">Issuing Authority</span>
                              <span className="text-slate-800 font-medium truncate block">
                                {doc.issuingAuthority}
                              </span>
                            </div>
                          )}
                          {doc.expiryDate && (
                            <div>
                              <span className="text-slate-400 text-[10px] block">Valid Till</span>
                              <span
                                className={`font-semibold ${
                                  isExpired ? 'text-rose-700' : isExpiringSoon ? 'text-amber-700' : 'text-slate-800'
                                }`}
                              >
                                {formatDate(doc.expiryDate)}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-400 text-[10px] block">Uploaded On</span>
                            <span className="text-slate-600">{doc.uploadedAt}</span>
                          </div>
                        </div>

                        {doc.notes && (
                          <p className="mt-2 text-[11px] text-slate-500 italic bg-amber-50/50 p-1.5 rounded border border-amber-100/60">
                            Note: {doc.notes}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.fileName} ({doc.fileSize || '1.4 MB'})
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedDocForPreview(doc)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> View Scanned Copy
                          </button>

                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted &amp; Locally Stored &bull; Ready for Tender Compliance Audits</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            Close (बंद करें)
          </button>
        </div>
      </div>

      {/* Upload Document Modal */}
      {isUploadFormOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload New Document &bull; दस्तावेज अपलोड
              </h4>
              <button
                onClick={() => setIsUploadFormOpen(false)}
                className="p-1 hover:bg-white/20 rounded text-indigo-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Document Category (दस्तावेज का प्रकार) *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => {
                    const cat = e.target.value as DocumentCategory;
                    setUploadCategory(cat);
                    if (!uploadTitle) setUploadTitle(getCategoryName(cat));
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {entityType === 'vehicle' && (
                    <>
                      <option value="rc">RC - Registration Certificate</option>
                      <option value="insurance">Commercial Comprehensive Insurance</option>
                      <option value="puc">PUC - Pollution Under Control Certificate</option>
                      <option value="tax">Commercial Road Tax Receipt</option>
                      <option value="fitness">Commercial Fitness Certificate</option>
                      <option value="permit">Commercial Taxi Permit (State / All India)</option>
                      <option value="other">Other Vehicle Document</option>
                    </>
                  )}
                  {entityType === 'driver' && (
                    <>
                      <option value="aadhaar">Aadhaar Card (आधार कार्ड)</option>
                      <option value="driving_license">Driving Licence (Commercial LMV-TR / Transport)</option>
                      <option value="pan">PAN Card (स्थाई खाता संख्या)</option>
                      <option value="police_verification">Police Character Verification Certificate</option>
                      <option value="other">Bank Passbook / Medical / Other</option>
                    </>
                  )}
                  {entityType === 'tender' && (
                    <>
                      <option value="work_order">Work Order / LOA (कार्य आदेश)</option>
                      <option value="tender_agreement">Signed Tender Agreement / Contract Copy</option>
                      <option value="emd_bg">Bank Guarantee / FDR / EMD Security</option>
                      <option value="gem_contract">GeM Contract Sanction Order</option>
                      <option value="other">Rate Schedule / Other Tender Annexure</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Document Title (दस्तावेज का नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Comprehensive Insurance Policy 2026-27"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Document / Policy / Ref #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0823003126P10023"
                    value={uploadDocNumber}
                    onChange={(e) => setUploadDocNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Issuing Authority / Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. United India Insurance / RTO Lucknow"
                    value={uploadAuthority}
                    onChange={(e) => setUploadAuthority(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Issue Date (जारी होने की तिथि)
                  </label>
                  <input
                    type="date"
                    value={uploadIssueDate}
                    onChange={(e) => setUploadIssueDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Expiry Date (वैधता समाप्ति तिथि)
                  </label>
                  <input
                    type="date"
                    value={uploadExpiryDate}
                    onChange={(e) => setUploadExpiryDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Select File / Scan / Photo (फाइल या फोटो चुनें)
                </label>
                <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="doc-file-upload"
                  />
                  <label htmlFor="doc-file-upload" className="cursor-pointer block">
                    <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                    <span className="font-semibold text-indigo-700">
                      {uploadFileName || 'Click to select PDF or Image file'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      PDF, JPG, PNG up to 10MB (Stores in Local Storage)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Original verified, copy submitted to PWD division"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadFormOpen(false)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save &amp; Attach Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Realistic Scanned Copy / Document Viewer Modal */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Viewer Header */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">{selectedDocForPreview.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    Category: {getCategoryName(selectedDocForPreview.category)} &bull; Uploaded on {selectedDocForPreview.uploadedAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([`Official Sarkari Document Copy: ${selectedDocForPreview.title}\nRef: ${selectedDocForPreview.documentNumber || 'N/A'}\nAuthority: ${selectedDocForPreview.issuingAuthority || 'N/A'}\nValid: ${selectedDocForPreview.expiryDate || 'N/A'}`], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedDocForPreview.fileName || 'document'}.txt`;
                    a.click();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Realistic Document Canvas */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
              {selectedDocForPreview.fileUrl && selectedDocForPreview.fileType === 'image' ? (
                <div className="max-w-2xl w-full bg-white p-4 rounded-xl shadow-md border border-slate-200 text-center">
                  <img
                    src={selectedDocForPreview.fileUrl}
                    alt={selectedDocForPreview.title}
                    className="max-h-[60vh] mx-auto object-contain rounded-lg"
                  />
                </div>
              ) : (
                /* High-fidelity official Indian Government style certificate / card preview */
                <div className="max-w-2xl w-full bg-amber-50/40 p-8 rounded-xl border-4 border-double border-slate-300 shadow-md relative text-slate-800 select-none">
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                    <span className="text-7xl font-extrabold rotate-[-30deg] tracking-widest text-slate-900 uppercase">
                      GOVERNMENT VERIFIED
                    </span>
                  </div>

                  {/* Header Crest */}
                  <div className="text-center pb-4 border-b-2 border-slate-300">
                    <div className="inline-block text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-slate-200/70 px-3 py-0.5 rounded">
                      GOVERNMENT OF INDIA &bull; STATE TRANSPORT AUTHORITY
                    </div>
                    <h2 className="text-lg font-black tracking-wide text-slate-900 mt-2 uppercase">
                      {selectedDocForPreview.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Issuing Department / Office: <strong>{selectedDocForPreview.issuingAuthority || 'Regional Transport Office / Department'}</strong>
                    </p>
                  </div>

                  {/* Document Body Details */}
                  <div className="mt-6 grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div className="p-3 bg-white/80 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Registration / Document No.
                      </span>
                      <span className="font-mono text-base font-bold text-slate-900">
                        {selectedDocForPreview.documentNumber || 'UP32-2026-DOC-00918'}
                      </span>
                    </div>

                    <div className="p-3 bg-white/80 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Document Classification
                      </span>
                      <span className="font-semibold text-slate-800">
                        {getCategoryName(selectedDocForPreview.category)}
                      </span>
                    </div>

                    <div className="p-3 bg-white/80 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Date of Issue / Sanction
                      </span>
                      <span className="font-medium text-slate-800">
                        {selectedDocForPreview.issueDate ? formatDate(selectedDocForPreview.issueDate) : '01-04-2026'}
                      </span>
                    </div>

                    <div className="p-3 bg-white/80 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Valid Upto / Expiry Date
                      </span>
                      <span className="font-bold text-emerald-800 text-sm">
                        {selectedDocForPreview.expiryDate ? formatDate(selectedDocForPreview.expiryDate) : 'Permanent / Long-Term'}
                      </span>
                    </div>
                  </div>

                  {/* Associated Entity Details */}
                  <div className="mt-5 p-3.5 bg-white/90 rounded-lg border border-slate-200 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                      Target Entity Association
                    </span>
                    <div className="font-bold text-slate-900">
                      {getEntityTitle().replace('&bull;', '•')}
                    </div>
                    {selectedDocForPreview.notes && (
                      <p className="text-[11px] text-slate-600 italic pt-1">
                        &quot;{selectedDocForPreview.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Seal & QR Code Emulation */}
                  <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-slate-900 p-1 rounded border border-slate-400 flex items-center justify-center text-[8px] text-white text-center font-mono">
                        [DIGITAL QR VERIFIED]
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800">Digitally Verified Document</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          SHA256: 8f9b...a102 | Secure GeM/RTO Portal
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="w-24 h-10 border-b border-dashed border-slate-400 ml-auto mb-1 flex items-end justify-center text-[10px] text-indigo-800 font-serif italic">
                        Authorized Signatory
                      </div>
                      <span className="text-[10px] text-slate-500">Seal &amp; Signature</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

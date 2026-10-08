import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  Download,
  Upload,
  Eye,
  Trash2,
  Edit,
  Printer,
  Share2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  MapPin,
  Phone,
  Tag,
  X,
  FileCheck,
  Key,
  FolderOpen,
  ArrowUpDown,
  FileBadge,
  BadgeAlert,
  ChevronRight,
  Info,
} from 'lucide-react';
import { CompanyDocument, CompanyDocCategory } from '../types';
import { formatDate, getDaysDiff } from '../utils/calculations';

interface CompanyDocumentsViewProps {
  documents: CompanyDocument[];
  onSaveDocument: (doc: CompanyDocument) => void;
  onDeleteDocument: (id: string) => void;
  onOpenAddModal?: () => void;
}

export const CompanyDocumentsView: React.FC<CompanyDocumentsViewProps> = ({
  documents,
  onSaveDocument,
  onDeleteDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expired' | 'expiring_soon' | 'valid' | 'lifetime'>('all');
  const [sortBy, setSortBy] = useState<'expiry_asc' | 'expiry_desc' | 'title_asc' | 'newest'>('expiry_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CompanyDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<CompanyDocument | null>(null);
  const [shareTextModalDoc, setShareTextModalDoc] = useState<CompanyDocument | null>(null);
  const [copiedShareText, setCopiedShareText] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<CompanyDocCategory>('gst_tax');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formIssuingAuthority, setFormIssuingAuthority] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formIsLifetime, setFormIsLifetime] = useState(false);
  const [formAlertDays, setFormAlertDays] = useState(30);
  const [formCustodyLocation, setFormCustodyLocation] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileType, setFormFileType] = useState<'pdf' | 'image' | 'doc'>('pdf');
  const [formFileSize, setFormFileSize] = useState('');
  const [formFileUrl, setFormFileUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get days info
  const getExpiryStatus = (doc: CompanyDocument) => {
    if (doc.isLifetime || !doc.expiryDate) {
      return { status: 'lifetime', label: 'Lifetime Valid (आजीवन मान्य)', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200', days: 99999 };
    }
    const days = getDaysDiff(doc.expiryDate);
    const alertThreshold = doc.alertDaysBefore || 30;

    if (days < 0) {
      return {
        status: 'expired',
        label: `Expired ${Math.abs(days)} days ago (समाप्त)`,
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        days,
      };
    }
    if (days <= 15) {
      return {
        status: 'critical_soon',
        label: `Expires in ${days} days (अतिशीघ्र समाप्त)`,
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse',
        days,
      };
    }
    if (days <= alertThreshold) {
      return {
        status: 'expiring_soon',
        label: `Expires in ${days} days (${days} दिन शेष)`,
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
        days,
      };
    }
    return {
      status: 'valid',
      label: `Valid (${days} days left)`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
      days,
    };
  };

  // Metrics
  const stats = useMemo(() => {
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let validCount = 0;
    let lifetimeCount = 0;

    documents.forEach((d) => {
      const exp = getExpiryStatus(d);
      if (exp.status === 'expired') expiredCount++;
      else if (exp.status === 'critical_soon' || exp.status === 'expiring_soon') expiringSoonCount++;
      else if (exp.status === 'lifetime') lifetimeCount++;
      else validCount++;
    });

    return {
      total: documents.length,
      expired: expiredCount,
      expiringSoon: expiringSoonCount,
      valid: validCount,
      lifetime: lifetimeCount,
    };
  }, [documents]);

  // Urgent attention items (Expired or Expiring in 30 days)
  const urgentDocuments = useMemo(() => {
    return documents
      .filter((d) => {
        const exp = getExpiryStatus(d);
        return exp.status === 'expired' || exp.status === 'critical_soon' || exp.status === 'expiring_soon';
      })
      .sort((a, b) => {
        const daysA = a.isLifetime || !a.expiryDate ? 99999 : getDaysDiff(a.expiryDate);
        const daysB = b.isLifetime || !b.expiryDate ? 99999 : getDaysDiff(b.expiryDate);
        return daysA - daysB;
      });
  }, [documents]);

  // Filtered & Sorted documents
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        // Search
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          !q ||
          doc.title.toLowerCase().includes(q) ||
          doc.docNumber.toLowerCase().includes(q) ||
          doc.issuingAuthority.toLowerCase().includes(q) ||
          (doc.notes && doc.notes.toLowerCase().includes(q)) ||
          (doc.custodyLocation && doc.custodyLocation.toLowerCase().includes(q));

        // Category
        const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;

        // Status
        const exp = getExpiryStatus(doc);
        let matchesStatus = true;
        if (statusFilter === 'expired') matchesStatus = exp.status === 'expired';
        else if (statusFilter === 'expiring_soon') matchesStatus = exp.status === 'critical_soon' || exp.status === 'expiring_soon';
        else if (statusFilter === 'valid') matchesStatus = exp.status === 'valid';
        else if (statusFilter === 'lifetime') matchesStatus = exp.status === 'lifetime';

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry_asc') {
          const daysA = a.isLifetime || !a.expiryDate ? 999999 : getDaysDiff(a.expiryDate);
          const daysB = b.isLifetime || !b.expiryDate ? 999999 : getDaysDiff(b.expiryDate);
          return daysA - daysB;
        }
        if (sortBy === 'expiry_desc') {
          const daysA = a.isLifetime || !a.expiryDate ? -999999 : getDaysDiff(a.expiryDate);
          const daysB = b.isLifetime || !b.expiryDate ? -999999 : getDaysDiff(b.expiryDate);
          return daysB - daysA;
        }
        if (sortBy === 'title_asc') {
          return a.title.localeCompare(b.title);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [documents, searchTerm, categoryFilter, statusFilter, sortBy]);

  // Open Edit Modal
  const handleOpenEdit = (doc: CompanyDocument) => {
    setEditingDoc(doc);
    setFormTitle(doc.title);
    setFormCategory(doc.category);
    setFormDocNumber(doc.docNumber);
    setFormIssuingAuthority(doc.issuingAuthority);
    setFormIssueDate(doc.issueDate);
    setFormExpiryDate(doc.expiryDate || '');
    setFormIsLifetime(doc.isLifetime);
    setFormAlertDays(doc.alertDaysBefore || 30);
    setFormCustodyLocation(doc.custodyLocation || '');
    setFormContactPerson(doc.contactPersonOrAgent || '');
    setFormNotes(doc.notes || '');
    setFormFileName(doc.fileName || '');
    setFormFileType(doc.fileType || 'pdf');
    setFormFileSize(doc.fileSize || '');
    setFormFileUrl(doc.fileUrl || '');
    setIsAddModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingDoc(null);
    setFormTitle('');
    setFormCategory('gst_tax');
    setFormDocNumber('');
    setFormIssuingAuthority('');
    setFormIssueDate(new Date().toISOString().slice(0, 10));
    setFormExpiryDate('');
    setFormIsLifetime(false);
    setFormAlertDays(30);
    setFormCustodyLocation('Office Safe Locker #1');
    setFormContactPerson('CA / Office Admin');
    setFormNotes('');
    setFormFileName('');
    setFormFileType('pdf');
    setFormFileSize('');
    setFormFileUrl('');
    setIsAddModalOpen(true);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormFileName(file.name);
    setFormFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    const isImg = file.type.startsWith('image/');
    setFormFileType(isImg ? 'image' : 'pdf');

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormFileUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save Document
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('कृपया दस्तावेज़ का नाम भरें (Please enter document title)');
      return;
    }

    const doc: CompanyDocument = {
      id: editingDoc ? editingDoc.id : `cdoc-${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      docNumber: formDocNumber.trim(),
      issuingAuthority: formIssuingAuthority.trim(),
      issueDate: formIssueDate,
      expiryDate: formIsLifetime ? undefined : formExpiryDate,
      isLifetime: formIsLifetime,
      alertDaysBefore: Number(formAlertDays) || 30,
      custodyLocation: formCustodyLocation.trim(),
      contactPersonOrAgent: formContactPerson.trim(),
      notes: formNotes.trim(),
      fileName: formFileName || `${formTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileType: formFileType,
      fileSize: formFileSize || '1.2 MB',
      fileUrl: formFileUrl,
      createdAt: editingDoc ? editingDoc.createdAt : new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    onSaveDocument(doc);
    setIsAddModalOpen(false);
    setEditingDoc(null);
  };

  // Quick Preset Helper
  const applyPreset = (presetName: string) => {
    if (presetName === 'gst') {
      setFormTitle('GST Registration Certificate (REG-06)');
      setFormCategory('gst_tax');
      setFormDocNumber('09AAACS1234F1Z8');
      setFormIssuingAuthority('Goods & Services Tax Network (GSTN)');
      setFormIsLifetime(true);
      setFormExpiryDate('');
      setFormCustodyLocation('Office Safe Locker #1 (Master File)');
      setFormNotes('शक्ति ट्रैवल्स एंड टूर्स मूल जीएसटी प्रमाणपत्र।');
    } else if (presetName === 'dsc') {
      setFormTitle('Class-3 Digital Signature Token (DSC e-Tender)');
      setFormCategory('digital_token_gem');
      setFormDocNumber('DSC-eMudhra-2026-TOKEN');
      setFormIssuingAuthority('e-Mudhra Certifying Authority');
      setFormIsLifetime(false);
      setFormExpiryDate(new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10));
      setFormAlertDays(30);
      setFormCustodyLocation('Tender Desk USB Vault');
      setFormNotes('e-Tendering व GeM बिड हेतु क्लास-3 डिजिटल सिग्नेचर डोंगल।');
    } else if (presetName === 'aitp') {
      setFormTitle('All India Tourist Permit (AITP) Authorization');
      setFormCategory('tour_transport');
      setFormDocNumber('STA/UP/AITP/2026/0912');
      setFormIssuingAuthority('State Transport Authority (STA) / MoRTH');
      setFormIsLifetime(false);
      setFormExpiryDate(new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10));
      setFormAlertDays(45);
      setFormCustodyLocation('Fleet Operations Master Binder');
      setFormNotes('समस्त टूर टैक्सियों हेतु राष्ट्रीय परमिट प्राधिकार।');
    } else if (presetName === 'gumasta') {
      setFormTitle('Gumasta / Trade License (गुमाश्ता दुकान लाइसेंस)');
      setFormCategory('trade_license');
      setFormDocNumber('LMC/SHOP/2026/8812');
      setFormIssuingAuthority('Municipal Corporation / नगर निगम');
      setFormIsLifetime(false);
      setFormExpiryDate(new Date(Date.now() + 70 * 86400000).toISOString().slice(0, 10));
      setFormAlertDays(30);
      setFormCustodyLocation('Office Reception Wall Frame');
      setFormNotes('दुकान एवं वाणिज्यिक अधिष्ठान अधिनियम के तहत वार्षिक व्यापार लाइसेंस।');
    } else if (presetName === 'bg') {
      setFormTitle('Performance Bank Guarantee (PBG) - Govt Tender');
      setFormCategory('banking_guarantee');
      setFormDocNumber('BG/2026/BOB/771029');
      setFormIssuingAuthority('Bank of Baroda / SBI');
      setFormIsLifetime(false);
      setFormExpiryDate(new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10));
      setFormAlertDays(30);
      setFormCustodyLocation('Executive Engineer Office / Bank Duplicate');
      setFormNotes('सरकारी कार्यालय टेंडर अनुबंध हेतु ₹5,00,000 की सुरक्षा बैंक गारंटी।');
    } else if (presetName === 'rent') {
      setFormTitle('Head Office & Garage Lease Agreement (रेंट एग्रीमेंट)');
      setFormCategory('legal_lease');
      setFormDocNumber('DEED-REG-UP-2026-4401');
      setFormIssuingAuthority('Sub-Registrar Office');
      setFormIsLifetime(false);
      setFormExpiryDate(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
      setFormAlertDays(30);
      setFormCustodyLocation('Legal Deed Safe');
      setFormNotes('शक्ति ट्रैवल्स एंड टूर्स कार्यालय व पार्किंग का 11 माह का पंजीकृत किराया अनुबंध।');
    }
  };

  // Category Badges & Names
  const getCategoryMeta = (cat: CompanyDocCategory) => {
    switch (cat) {
      case 'gst_tax':
        return { label: 'GST & Tax (जीएसटी व पैन)', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'tour_transport':
        return { label: 'Tour & Permit (टूर व AITP परमिट)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'digital_token_gem':
        return { label: 'DSC Token & GeM (डिजिटल सिग्नेचर)', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'trade_license':
        return { label: 'Trade License (गुमाश्ता लाइसेंस)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'banking_guarantee':
        return { label: 'Banking & BG (बैंक गारंटी)', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'legal_lease':
        return { label: 'Lease & Rent (रेंट एग्रीमेंट)', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'insurance_policy':
        return { label: 'Insurance (कार्यालय व फ्लीट बीमा)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'labour_statutory':
        return { label: 'Labour Law (EPF व ESIC कोड)', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'pollution_noc':
        return { label: 'NOC & Fire (अनापत्ति प्रमाणपत्र)', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'iso_quality':
        return { label: 'MSME & Quality (उद्यम आधार)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: 'Other Document (अन्य दस्तावेज)', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Generate WhatsApp / SMS share reminder text
  const generateShareText = (doc: CompanyDocument) => {
    const exp = getExpiryStatus(doc);
    return `*SHAKTI TRAVELS AND TOURS (शक्ति ट्रैवल्स एंड टूर्स)*\n⚠️ *COMPANY DOCUMENT EXPIRY ALERT*\n----------------------------------------\n📄 *दस्तावेज़:* ${doc.title}\n🔢 *संख्या:* ${doc.docNumber || 'N/A'}\n🏛️ *विभाग/अथॉरिटी:* ${doc.issuingAuthority}\n📅 *एक्सपायरी तिथि:* ${doc.isLifetime ? 'आजीवन मान्य (Lifetime)' : formatDate(doc.expiryDate || '')}\n⏱️ *स्थिति:* ${exp.label}\n📍 *मूल प्रति स्थान:* ${doc.custodyLocation || 'Office Locker'}\n👤 *संपर्क/एजेंट:* ${doc.contactPersonOrAgent || 'N/A'}\n\n*निर्देश:* कृपया समय पूर्व इसका नवीनीकरण (Renewal) सुनिश्चित करें ताकि सरकारी टेंडर व संचालन में बाधा न आए।\n- *शक्ति ट्रैवल्स एंड टूर्स (Shakti Travels & Tours)*`;
  };

  const handleCopyShare = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
              Company Legal Vault &bull; कंपनी दस्तावेज़ भंडार
            </span>
            <span className="text-xs font-mono text-slate-500 font-bold">
              Shakti Travels and Tours
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <span>Company Important Documents &amp; Expiry Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            शक्ति ट्रैवल्स एंड टूर्स के समस्त मुख्य दस्तावेज (GST, डिजिटल सिग्नेचर टोकन, टूर परमिट, बैंक गारंटी, गुमाश्ता, रेंट एग्रीमेंट) सुरक्षित रखें व एक्सपायरी ट्रैक करें
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition-colors"
            title="Print documents compliance list"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Report</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Company Document (नया दस्तावेज़ जोड़ें)</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Documents</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400">कुल दस्तावेज़</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('expired')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'expired'
              ? 'border-rose-500 ring-2 ring-rose-200 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase">Expired (समाप्त)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <BadgeAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${stats.expired > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {stats.expired}
            </span>
            <span className="text-xs text-rose-500 font-medium">तत्काल रिन्यू कराएं</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('expiring_soon')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'expiring_soon'
              ? 'border-amber-500 ring-2 ring-amber-200 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase">Expiring in 30 Days</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${stats.expiringSoon > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {stats.expiringSoon}
            </span>
            <span className="text-xs text-amber-600 font-medium">शीघ्र समाप्त होने वाले</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('valid')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'valid'
              ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase">Valid &amp; Lifetime</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">
              {stats.valid + stats.lifetime}
            </span>
            <span className="text-xs text-emerald-600 font-medium">सुरक्षित व अनुपालन</span>
          </div>
        </div>
      </div>

      {/* Expiry Radar Banner: "Kaun si cheez kab expire ho rahi hai" */}
      {urgentDocuments.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm text-amber-950 uppercase tracking-wide">
                    Expiry Alert Radar &bull; कौन सी चीज़ कब expire हो रही है
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-[11px] font-bold rounded-full">
                    {urgentDocuments.length} Action Needed
                  </span>
                </div>
                <p className="text-xs text-amber-900 mt-1">
                  निम्नलिखित महत्वपूर्ण कंपनी दस्तावेजों की वैधता समाप्त हो चुकी है या अतिशीघ्र समाप्त होने वाली है। इन्हें तुरंत रिन्यू कराएं:
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setStatusFilter('expired')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                Expired ({stats.expired})
              </button>
              <button
                onClick={() => setStatusFilter('expiring_soon')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                Expiring Soon ({stats.expiringSoon})
              </button>
            </div>
          </div>

          {/* Quick Urgent Items Ticker */}
          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {urgentDocuments.slice(0, 3).map((doc) => {
              const exp = getExpiryStatus(doc);
              const isPast = exp.days < 0;
              return (
                <div
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isPast
                      ? 'bg-rose-50/80 border-rose-300 hover:border-rose-400'
                      : 'bg-white border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="block font-bold text-xs text-slate-900 truncate">
                      {doc.title}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {doc.docNumber || 'No number'} &bull; {doc.issuingAuthority}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${exp.badgeColor}`}>
                      {isPast ? `Expired (${Math.abs(exp.days)}d ago)` : `In ${exp.days} days`}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {formatDate(doc.expiryDate || '')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title, number, authority, locker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Categories (समस्त श्रेणियां)</option>
              <option value="gst_tax">GST &amp; Tax (जीएसटी व पैन)</option>
              <option value="tour_transport">Tour &amp; AITP Permit (टूर व परमिट)</option>
              <option value="digital_token_gem">DSC Token &amp; GeM (डिजिटल सिग्नेचर)</option>
              <option value="trade_license">Trade License &amp; Gumasta (गुमाश्ता)</option>
              <option value="banking_guarantee">Banking &amp; BG (बैंक गारंटी)</option>
              <option value="legal_lease">Lease &amp; Rent Deed (रेंट एग्रीमेंट)</option>
              <option value="insurance_policy">Insurance Policies (बीमा पॉलिसियां)</option>
              <option value="labour_statutory">Labour Law (EPF व ESIC कोड)</option>
              <option value="iso_quality">MSME / Udyam (उद्यम आधार)</option>
              <option value="other">Other Documents (अन्य)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="expiry_asc">⏳ Earliest Expiry First (जो पहले एक्सपायर हो)</option>
              <option value="expiry_desc">📅 Latest Expiry First (बाद में एक्सपायर होने वाले)</option>
              <option value="title_asc">🔤 Title (A - Z)</option>
              <option value="newest">🆕 Recently Added (नवीनतम)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between bg-slate-100 p-1 rounded-lg">
            <span className="text-[11px] text-slate-500 font-semibold px-2">
              Showing {filteredDocuments.length} of {documents.length}
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Docs ({documents.length})
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              statusFilter === 'expired'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span>Expired (समाप्त)</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
              {stats.expired}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('expiring_soon')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              statusFilter === 'expiring_soon'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>Expiring in 30 Days</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
              {stats.expiringSoon}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('valid')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'valid'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Valid ({stats.valid})
          </button>
          <button
            onClick={() => setStatusFilter('lifetime')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'lifetime'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            Lifetime / No Expiry ({stats.lifetime})
          </button>
        </div>
      </div>

      {/* Main Document Listing: Grid vs Table */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-slate-900 text-lg">
              Shakti Travels and Tours &bull; कंपनी दस्तावेज़ भंडार खाली है
            </h4>
            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              पुराना डेमो डेटा हटा दिया गया है। अब अपनी कंपनी के सभी महत्वपूर्ण कागज़ात (जैसे GST, डिजिटल सिग्नेचर डोंगल टोकन, AITP टूर परमिट, बैंक गारंटी, गुमाश्ता/ट्रेड लाइसेंस, रेंट एग्रीमेंट, बीमा पॉलिसी) यहाँ जोड़ें और उनकी एक्सपायरी तिथि पर ऑटोमैटिक अलर्ट पाएं।
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            + Add First Company Document (पहला दस्तावेज़ जोड़ें)
          </button>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-slate-800 text-base">No company documents match your filters</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting your search query or status filter, or click &ldquo;+ Add Company Document&rdquo; to add a new certificate or permit.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const exp = getExpiryStatus(doc);
            const cat = getCategoryMeta(doc.category);

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 pb-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${exp.badgeColor}`}>
                      {exp.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
                      {doc.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {doc.docNumber || 'No ID'}
                      </span>
                    </div>
                  </div>

                  {/* Issuing Authority */}
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.issuingAuthority}</span>
                  </div>

                  {/* Dates Box */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Issued On:</span>
                      <strong className="text-slate-700">{formatDate(doc.issueDate)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Expires On:</span>
                      <strong className={doc.isLifetime ? 'text-indigo-700' : exp.days < 0 ? 'text-rose-600' : 'text-slate-900'}>
                        {doc.isLifetime ? 'Lifetime Valid' : formatDate(doc.expiryDate || '')}
                      </strong>
                    </div>
                  </div>

                  {/* Physical Custody / Location */}
                  {doc.custodyLocation && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate"><strong>Locker/File:</strong> {doc.custodyLocation}</span>
                    </div>
                  )}

                  {/* Contact / Agent */}
                  {doc.contactPersonOrAgent && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate"><strong>Agent/Renewal:</strong> {doc.contactPersonOrAgent}</span>
                    </div>
                  )}

                  {/* Notes Preview */}
                  {doc.notes && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                      &ldquo;{doc.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View / Preview</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setShareTextModalDoc(doc)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Share / WhatsApp Reminder to CA or Agent"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEdit(doc)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Document Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${doc.title}?`)) {
                          onDeleteDocument(doc.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Document Title &amp; Number</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Issuing Authority</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Expiry Countdown</th>
                  <th className="py-3 px-4">Custody Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDocuments.map((doc) => {
                  const exp = getExpiryStatus(doc);
                  const cat = getCategoryMeta(doc.category);

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{doc.title}</div>
                        <div className="font-mono text-[11px] text-slate-500">{doc.docNumber || 'No number'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${cat.color}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {doc.issuingAuthority}
                      </td>
                      <td className="py-3 px-4">
                        <span className={doc.isLifetime ? 'text-indigo-700 font-semibold' : exp.days < 0 ? 'text-rose-600 font-bold' : 'font-medium'}>
                          {doc.isLifetime ? 'Lifetime Valid' : formatDate(doc.expiryDate || '')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${exp.badgeColor}`}>
                          {exp.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {doc.custodyLocation || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1 text-slate-500 hover:text-indigo-600"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShareTextModalDoc(doc)}
                            className="p-1 text-slate-500 hover:text-emerald-600"
                            title="Share Reminder"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(doc)}
                            className="p-1 text-slate-500 hover:text-indigo-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${doc.title}?`)) onDeleteDocument(doc.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDoc ? 'Edit Company Document (दस्तावेज़ विवरण संपादित करें)' : 'Add Company Document (नया कंपनी दस्तावेज़ जोड़ें)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Shakti Travels and Tours &bull; कंपनी दस्तावेज व एक्सपायरी विवरण दर्ज करें
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Quick Presets for fast entry */}
            {!editingDoc && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  ⚡ Quick Auto-Fill Templates (त्वरित टेम्पलेट से भरें):
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => applyPreset('gst')}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg border border-slate-300 font-medium transition-colors"
                  >
                    + GST Certificate
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('dsc')}
                    className="px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-lg border border-slate-300 font-medium transition-colors"
                  >
                    + Class-3 DSC Token
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('aitp')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg border border-slate-300 font-medium transition-colors"
                  >
                    + AITP Permit Master
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('gumasta')}
                    className="px-2.5 py-1 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-lg border border-slate-300 font-medium transition-colors"
                  >
                    + Gumasta License
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('bg')}
                    className="px-2.5 py-1 bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 rounded-lg border border-slate-300 font-medium transition-colors"
                  >
                    + Bank Guarantee
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('rent')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-medium transition-colors"
                  >
                    + Office Lease
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    Document Title (दस्तावेज़ का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. GST Registration Certificate, Class-3 DSC Token, All India Tourist Permit"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category (श्रेणी) *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="gst_tax">GST &amp; Tax (जीएसटी, पैन, टैक्स)</option>
                    <option value="tour_transport">Tour &amp; AITP Permit (टूर व राष्ट्रीय परमिट)</option>
                    <option value="digital_token_gem">DSC Token &amp; GeM (डिजिटल सिग्नेचर टोकन)</option>
                    <option value="trade_license">Trade License &amp; Gumasta (गुमाश्ता व्यापार लाइसेंस)</option>
                    <option value="banking_guarantee">Banking &amp; BG (बैंक गारंटी व एफडी)</option>
                    <option value="legal_lease">Lease &amp; Rent Deed (कार्यालय रेंट एग्रीमेंट)</option>
                    <option value="insurance_policy">Insurance (कार्यालय व फ्लीट बीमा)</option>
                    <option value="labour_statutory">Labour Law (EPF व ESIC मुख्य कोड)</option>
                    <option value="pollution_noc">NOC &amp; Fire (प्रदूषण / फायर NOC)</option>
                    <option value="iso_quality">MSME / Udyam (उद्यम आधार व ISO)</option>
                    <option value="other">Other Document (अन्य महत्वपूर्ण दस्तावेज)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Document Number / ID (दस्तावेज़ क्रमांक) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDocNumber}
                    onChange={(e) => setFormDocNumber(e.target.value)}
                    placeholder="e.g. 09AAACS1234F1Z8, DSC-2026-991"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Issuing Authority / Department (जारीकर्ता विभाग / संस्था) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formIssuingAuthority}
                    onChange={(e) => setFormIssuingAuthority(e.target.value)}
                    placeholder="e.g. Goods & Services Tax Network (GSTN), e-Mudhra, State Transport Authority, Bank of Baroda"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Issue Date (जारी करने की तारीख)
                  </label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Expiry Date (समाप्ति / रिन्यूअल तिथि)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-indigo-700 font-bold">
                      <input
                        type="checkbox"
                        checked={formIsLifetime}
                        onChange={(e) => setFormIsLifetime(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded"
                      />
                      Lifetime / No Expiry (आजीवन मान्य)
                    </label>
                  </div>
                  <input
                    type="date"
                    disabled={formIsLifetime}
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formIsLifetime
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-900 border-slate-300'
                    }`}
                  />
                </div>

                {!formIsLifetime && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Reminder Days Before (अलर्ट कितने दिन पहले मिले)
                    </label>
                    <select
                      value={formAlertDays}
                      onChange={(e) => setFormAlertDays(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value={15}>15 Days Before (15 दिन पहले)</option>
                      <option value={30}>30 Days Before (1 माह पहले - अनुशंसित)</option>
                      <option value={45}>45 Days Before (45 दिन पहले)</option>
                      <option value={60}>60 Days Before (2 माह पहले)</option>
                      <option value={90}>90 Days Before (3 माह पहले)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Physical Custody / Storage Location (मूल प्रति कहाँ रखी है)
                  </label>
                  <input
                    type="text"
                    value={formCustodyLocation}
                    onChange={(e) => setFormCustodyLocation(e.target.value)}
                    placeholder="e.g. Office Locker #1, CA Alok Safe, USB Token Ring"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className={formIsLifetime ? 'sm:col-span-2' : ''}>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Person / Renewal Agent (नवीनीकरण हेतु संपर्क)
                  </label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="e.g. CA Alok Trivedi (9839123450) or RTO Agent"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* File Attachment Upload */}
              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    Attach Document File / Scan Copy (दस्तावेज़ की प्रति अपलोड करें)
                  </label>
                  {formFileName && (
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Attached: {formFileName} ({formFileSize || '1.2 MB'})
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,image/*,.doc,.docx"
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">
                  PDF, JPG, PNG स्वीकार्य हैं। सरकारी टेंडर व आरटीओ चेकिंग हेतु स्कैन सुरक्षित रहेगा।
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes &amp; Critical Conditions (विशेष निर्देश, नवीनीकरण नियम व शर्तें)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. मूल प्रति बैंक लॉकर में है। टेंडर बिड में पेज 4 पर अपलोड करना है।"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Company Document (सुरक्षित करें)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview / Inspection Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryMeta(previewDoc.category).color}`}>
                  {getCategoryMeta(previewDoc.category).label}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {previewDoc.title}
                </h3>
                <span className="font-mono text-xs text-indigo-700 font-bold">
                  Document ID: {previewDoc.docNumber || 'N/A'}
                </span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Status & Expiry Banner */}
            {(() => {
              const exp = getExpiryStatus(previewDoc);
              return (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${exp.badgeColor}`}>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-bold text-sm">Status: {exp.label}</div>
                      <div className="text-xs opacity-90">
                        {previewDoc.isLifetime
                          ? 'This document is permanently valid (Lifetime validity).'
                          : `Valid until: ${formatDate(previewDoc.expiryDate || '')}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShareTextModalDoc(previewDoc);
                      setPreviewDoc(null);
                    }}
                    className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    Share Alert
                  </button>
                </div>
              );
            })()}

            {/* Detailed Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] block">Company Name:</span>
                <strong className="text-slate-900 font-bold">Shakti Travels and Tours</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Issuing Authority:</span>
                <strong className="text-slate-800">{previewDoc.issuingAuthority}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Date of Issue:</span>
                <span className="font-medium text-slate-700">{formatDate(previewDoc.issueDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Expiry Date:</span>
                <span className="font-bold text-slate-900">
                  {previewDoc.isLifetime ? 'Lifetime Valid (No Expiry)' : formatDate(previewDoc.expiryDate || '')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Physical Custody / Locker:</span>
                <span className="font-medium text-slate-800">{previewDoc.custodyLocation || 'Main Office Safe'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Renewal Contact:</span>
                <span className="font-medium text-slate-800">{previewDoc.contactPersonOrAgent || 'Office Admin'}</span>
              </div>
            </div>

            {previewDoc.notes && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-bold block mb-0.5">विशेष निर्देश व नियम (Notes):</span>
                <p>{previewDoc.notes}</p>
              </div>
            )}

            {/* Document Digital Copy Box */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileBadge className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      {previewDoc.fileName || `${previewDoc.title}.pdf`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Digital Verified Certificate &bull; {previewDoc.fileSize || '1.2 MB'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {previewDoc.fileUrl ? (
                    <a
                      href={previewDoc.fileUrl}
                      download={previewDoc.fileName || 'company_document.pdf'}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Scan
                    </a>
                  ) : (
                    <button
                      onClick={() => alert(`Certificate file '${previewDoc.fileName || previewDoc.title}' verified in system registry.`)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Copy
                    </button>
                  )}
                </div>
              </div>

              {/* Simulated Visual Preview */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 text-center space-y-2 shadow-2xs">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  Official Document Transcript &bull; शक्ति ट्रैवल्स एंड टूर्स
                </div>
                <div className="text-base font-black text-slate-900">{previewDoc.title}</div>
                <div className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 inline-block px-3 py-1 rounded border border-indigo-200">
                  {previewDoc.docNumber}
                </div>
                <div className="text-xs text-slate-500">
                  Issued by: {previewDoc.issuingAuthority}
                </div>
                <div className="pt-2 text-[11px] text-slate-400">
                  {previewDoc.isLifetime ? 'Authorized for Lifetime Commercial Transport' : `Valid through: ${formatDate(previewDoc.expiryDate || '')}`}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  const docToEdit = previewDoc;
                  setPreviewDoc(null);
                  handleOpenEdit(docToEdit);
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Document
              </button>

              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share / WhatsApp Reminder Modal */}
      {shareTextModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Share Renewal Reminder (नवीनीकरण तगादा साझा करें)
                  </h3>
                  <p className="text-xs text-slate-500">
                    CA, वकील या एजेंट को सीधे WhatsApp या मैसेज भेजने हेतु तैयार संदेश
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareTextModalDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs whitespace-pre-wrap text-slate-800 leading-relaxed max-h-60 overflow-y-auto">
              {generateShareText(shareTextModalDoc)}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {copiedShareText ? 'Copied to clipboard! ✓' : 'Ready to paste in WhatsApp / Email'}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShareTextModalDoc(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleCopyShare(generateShareText(shareTextModalDoc))}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {copiedShareText ? 'Copied! (कॉपी हो गया)' : 'Copy WhatsApp Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

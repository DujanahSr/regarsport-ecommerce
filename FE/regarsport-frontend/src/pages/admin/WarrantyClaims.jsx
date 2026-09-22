/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  ExternalLink,
  Package,
  Layers,
  Copy,
  Check,
  Eye,
  AlertTriangle,
  RefreshCw,
  X,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const statusConfig = {
  PENDING: {
    label: "Menunggu Verifikasi CS",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    badge: "Pending",
    icon: Clock,
  },
  APPROVED: {
    label: "Disetujui CS (Menunggu Gudang)",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    badge: "Disetujui",
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: "Sedang Diproses Gudang",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    badge: "Diproses",
    icon: RefreshCw,
  },
  RESOLVED: {
    label: "Selesai (Resi Dikirim)",
    color: "bg-teal-500/10 text-teal-300 border-teal-500/30",
    badge: "Selesai",
    icon: Truck,
  },
  REJECTED: {
    label: "Ditolak",
    color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    badge: "Ditolak",
    icon: XCircle,
  },
};

const categoryLabels = {
  SIZE_EXCHANGE: "Tukar Ukuran (Size Exchange)",
  PRINTING_DEFECT: "Cacat Sablon / Warna",
  SEWING_DEFECT: "Cacat Jahitan / Bahan",
  OTHER: "Kendala Lainnya",
};

const solutionLabels = {
  EXCHANGE_SIZE: "Tukar Ukuran Baru",
  REPLACEMENT: "Produksi Ulang 100% Baru",
  REPAIR: "Perbaikan Gratis",
};

const courierList = [
  "J&T Express",
  "JNE Reguler",
  "SiCepat Ekspres",
  "Anteraja",
  "Pos Indonesia",
  "ID Express",
];

export default function WarrantyClaims() {
  const { user } = useAuth();
  const isLogistics = user?.role === "logistics";

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Active selected claim for modal detail/action
  const [activeClaim, setActiveClaim] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE', 'REJECT', 'PROCESS', 'RESOLVE', or null
  const [adminNotes, setAdminNotes] = useState("");
  const [replacementCourier, setReplacementCourier] = useState(courierList[0]);
  const [replacementTrackingNumber, setReplacementTrackingNumber] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Lightbox preview for photos
  const [previewImage, setPreviewImage] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await api.get("/warranty-claims/admin", {
        params: {
          status: statusFilter ? statusFilter.toUpperCase() : undefined,
          page,
          size: 10,
        },
      });
      const data = res.data?.data;
      if (data) {
        setClaims(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      } else {
        setClaims([]);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal memuat daftar klaim garansi");
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [page, statusFilter]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} disalin`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenDetailModal = (claim) => {
    setActiveClaim(claim);
    setActionType(null);
    setAdminNotes(claim.adminNotes || "");
    setReplacementTrackingNumber(claim.replacementTrackingNumber || "");
  };

  const handleCloseModal = () => {
    setActiveClaim(null);
    setActionType(null);
    setAdminNotes("");
    setReplacementTrackingNumber("");
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!activeClaim) return;

    if (newStatus === "REJECTED" && !adminNotes.trim()) {
      toast.error("Wajib mengisi alasan penolakan klaim untuk pelanggan");
      return;
    }

    if (newStatus === "RESOLVED" && !replacementTrackingNumber.trim()) {
      toast.error("Wajib mengisi nomor resi pengiriman produk pengganti");
      return;
    }

    try {
      setSubmittingAction(true);
      const payload = {
        status: newStatus,
        adminNotes: adminNotes.trim(),
        replacementTrackingNumber: replacementTrackingNumber.trim()
          ? `${replacementCourier} - ${replacementTrackingNumber.trim()}`
          : undefined,
      };

      const res = await api.patch(`/warranty-claims/${activeClaim.id}/status`, payload);
      toast.success(res.data?.message || "Status klaim garansi berhasil diperbarui!");
      handleCloseModal();
      fetchClaims();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal memperbarui status klaim");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter claims by client search query
  const filteredClaims = useMemo(() => {
    if (!searchQuery.trim()) return claims;
    const q = searchQuery.toLowerCase();
    return claims.filter(
      (c) =>
        (c.claimNumber || "").toLowerCase().includes(q) ||
        (c.orderNumber || "").toLowerCase().includes(q) ||
        (c.productName || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }, [claims, searchQuery]);

  // Quick stats computed
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let processing = 0;
    let resolved = 0;

    claims.forEach((c) => {
      const s = (c.status || "").toUpperCase();
      if (s === "PENDING") pending++;
      else if (s === "APPROVED") approved++;
      else if (s === "PROCESSING") processing++;
      else if (s === "RESOLVED") resolved++;
    });

    return { pending, approved, processing, resolved };
  }, [claims]);

  return (
    <div className={isLogistics ? "space-y-8 animate-in fade-in duration-300 pb-12" : "min-h-screen bg-[#0D0D0D] pb-12"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl ${isLogistics ? "bg-[#162018] text-white shadow-sm" : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"}`}>
            <ShieldCheck size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-black tracking-widest ${
                isLogistics ? "bg-[#162018] text-[#FAF8F4]" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}>
                {isLogistics ? "RS // WARRANTY DISPATCH" : "RS // WARRANTY CENTER"}
              </span>
              <span className={`text-[11px] font-mono uppercase tracking-widest ${isLogistics ? "text-stone-500" : "text-slate-400"}`}>
                {isLogistics ? "INSPEKSI FISIK & PENGGANTIAN RESMI" : "VERIFIKASI KLAIM PELANGGAN"}
              </span>
            </div>
            <h1 className={`font-['Barlow_Condensed'] font-black text-3xl sm:text-4xl uppercase tracking-tight leading-none ${
              isLogistics ? "text-slate-900" : "text-white"
            }`}>
              {isLogistics ? "RETUR & PENGGANTIAN GARANSI" : "KLAIM GARANSI & RETUR"}
            </h1>
            <p className={`text-xs sm:text-sm mt-1.5 ${isLogistics ? "text-stone-500" : "text-slate-400"}`}>
              {isLogistics
                ? "Pemeriksaan paket retur masuk, pengepakan tukar ukuran, dan pengiriman resi pengganti"
                : "Verifikasi tiket kendala pelanggan, validasi bukti foto, dan persetujuan klaim garansi"}
            </p>
          </div>
        </div>

        <button
          onClick={fetchClaims}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer self-start md:self-auto ${
            isLogistics
              ? "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-xs"
              : "bg-[#14141E] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white"
          }`}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className={`p-5 rounded-3xl border flex items-center gap-3.5 shadow-sm ${
          isLogistics ? "bg-white border-stone-200/80" : "bg-[#14141E] border-white/5"
        }`}>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className={`text-2xl font-black font-['Barlow_Condensed'] ${isLogistics ? "text-slate-900" : "text-white"}`}>
              {stats.pending}
            </div>
            <div className={`text-[11px] font-semibold ${isLogistics ? "text-stone-500" : "text-slate-400"}`}>
              Menunggu Verifikasi CS
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-3xl border flex items-center gap-3.5 shadow-sm ${
          isLogistics ? "bg-white border-stone-200/80" : "bg-[#14141E] border-white/5"
        }`}>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className={`text-2xl font-black font-['Barlow_Condensed'] ${isLogistics ? "text-slate-900" : "text-white"}`}>
              {stats.approved}
            </div>
            <div className={`text-[11px] font-semibold ${isLogistics ? "text-stone-500" : "text-slate-400"}`}>
              Disetujui / Siap Kirim
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-3xl border flex items-center gap-3.5 shadow-sm ${
          isLogistics ? "bg-white border-stone-200/80" : "bg-[#14141E] border-white/5"
        }`}>
          <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className={`text-2xl font-black font-['Barlow_Condensed'] ${isLogistics ? "text-slate-900" : "text-white"}`}>
              {stats.processing}
            </div>
            <div className={`text-[11px] font-semibold ${isLogistics ? "text-stone-500" : "text-slate-400"}`}>
              Diproses di Gudang
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-3xl border flex items-center gap-3.5 shadow-sm ${
          isLogistics ? "bg-white border-stone-200/80" : "bg-[#14141E] border-white/5"
        }`}>
          <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <div className={`text-2xl font-black font-['Barlow_Condensed'] ${isLogistics ? "text-slate-900" : "text-white"}`}>
              {stats.resolved}
            </div>
            <div className={`text-[11px] font-semibold ${isLogistics ? "text-stone-500" : "text-slate-400"}`}>
              Pengganti Terkirim / Selesai
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              { label: "Semua Tiket", value: "" },
              { label: "Menunggu Review", value: "PENDING", badge: stats.pending > 0 ? stats.pending : null },
              { label: "Disetujui CS", value: "APPROVED", badge: stats.approved > 0 ? stats.approved : null },
              { label: "Proses Gudang", value: "PROCESSING" },
              { label: "Selesai (Resi Dikirim)", value: "RESOLVED" },
              { label: "Ditolak", value: "REJECTED" },
            ].map((tab) => {
              const isActive = (statusFilter || "").toUpperCase() === tab.value;
              if (isLogistics) {
                return (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setPage(1);
                      setStatusFilter(tab.value);
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#111613] text-white shadow-md"
                        : "bg-white text-stone-600 hover:text-black hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              }
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setPage(1);
                    setStatusFilter(tab.value);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#00BFA5] text-black shadow-lg shadow-[#00BFA5]/25"
                      : "bg-[#14141E] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                        isActive ? "bg-black/20 text-black" : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari Tiket, Order, Produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-full text-xs outline-none transition font-mono ${
                isLogistics
                  ? "bg-white border border-stone-200 text-slate-900 placeholder:text-stone-400 focus:border-[#162018]"
                  : "bg-[#14141E] border border-white/10 text-white placeholder-slate-500 focus:border-[#00BFA5]"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className={`rounded-3xl overflow-hidden shadow-sm ${
        isLogistics ? "bg-white border border-stone-200/80" : "bg-[#14141E] border border-white/10 shadow-xl"
      }`}>
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <RefreshCw size={32} className={`animate-spin mb-3 ${isLogistics ? "text-slate-800" : "text-[#00BFA5]"}`} />
            <p className={`text-sm ${isLogistics ? "text-stone-500" : "text-slate-400"}`}>Memuat data klaim garansi...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <ShieldCheck size={48} className="text-stone-400 mx-auto mb-3" />
            <h3 className={`text-base font-bold mb-1 ${isLogistics ? "text-slate-900" : "text-white"}`}>Tidak Ada Tiket Klaim</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {statusFilter
                ? `Tidak ditemukan tiket klaim dengan status "${statusFilter}".`
                : "Belum ada pengajuan klaim garansi atau kendala pesanan dari pelanggan."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-bold uppercase tracking-wider text-[11px] ${
                  isLogistics ? "bg-stone-50 border-stone-200 text-stone-600" : "border-white/10 bg-white/[0.02] text-slate-400"
                }`}>
                  <th className="py-4 px-5">Tiket Klaim &amp; Tanggal</th>
                  <th className="py-4 px-5">No. Pesanan &amp; Pemesan</th>
                  <th className="py-4 px-5">Produk &amp; Solusi</th>
                  <th className="py-4 px-5">Bukti Foto</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Resi Pengganti</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLogistics ? "divide-stone-100" : "divide-white/5"}`}>
                {filteredClaims.map((claim) => {
                  const statusInfo = statusConfig[claim.status] || statusConfig.PENDING;
                  const StatusIcon = statusInfo.icon;
                  const dateStr = claim.createdAt
                    ? new Date(claim.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-";

                  const evidenceUrls = (claim.evidenceImages || "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);

                  return (
                    <tr
                      key={claim.id || claim.claimNumber}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Ticket Number & Date */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#00BFA5] text-sm">
                            #{claim.claimNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(claim.claimNumber, "No. Tiket")}
                            className="text-slate-500 hover:text-white p-1 rounded transition cursor-pointer"
                            title="Salin Tiket"
                          >
                            {copiedText === "No. Tiket" ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{dateStr}</div>
                      </td>

                      {/* Order Number & User */}
                      <td className="py-4 px-5">
                        <div className="font-mono font-semibold text-slate-200">
                          {claim.orderNumber || `#${claim.orderId}`}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          User ID: #{claim.userId}
                        </div>
                      </td>

                      {/* Product & Solution */}
                      <td className="py-4 px-5 max-w-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={claim.productImage || "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=100"}
                            alt={claim.productName}
                            className="w-10 h-10 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-200 truncate" title={claim.productName}>
                              {claim.productName}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-amber-300 font-semibold mt-0.5">
                              <span>{solutionLabels[claim.solution] || claim.solution}</span>
                              {claim.requestedSize && (
                                <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded text-[10px] font-mono">
                                  Size {claim.requestedSize}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Evidence Photo */}
                      <td className="py-4 px-5">
                        {evidenceUrls.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {evidenceUrls.slice(0, 2).map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setPreviewImage(img)}
                                className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/10 hover:border-[#00BFA5] transition group/img cursor-pointer"
                              >
                                <img src={img} alt="Bukti" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                                  <Eye size={12} className="text-white" />
                                </div>
                              </button>
                            ))}
                            {evidenceUrls.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-bold bg-white/5 px-1.5 py-1 rounded">
                                +{evidenceUrls.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Tanpa foto</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.color}`}
                        >
                          <StatusIcon size={12} />
                          <span>{statusInfo.badge}</span>
                        </span>
                      </td>

                      {/* Replacement Tracking */}
                      <td className="py-4 px-5">
                        {claim.replacementTrackingNumber ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <span>{claim.replacementTrackingNumber}</span>
                              <button
                                onClick={() => handleCopy(claim.replacementTrackingNumber, "Resi Pengganti")}
                                className="text-slate-500 hover:text-white p-0.5 rounded cursor-pointer"
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400">Pengganti Terkirim</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(claim)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#00BFA5] text-slate-300 hover:text-black font-bold text-xs border border-white/10 hover:border-[#00BFA5] transition active:scale-95 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Tinjau</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <div>
              Menampilkan {filteredClaims.length} dari total {totalElements} tiket klaim
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white font-bold transition"
              >
                Sebelumnya
              </button>
              <span className="px-2 font-bold text-white">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white font-bold transition"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail & Action Modal */}
      {activeClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#14141E] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#14141E]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00BFA5]/10 border border-[#00BFA5]/20 text-[#00BFA5] flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Tiket #{activeClaim.claimNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        (statusConfig[activeClaim.status] || statusConfig.PENDING).color
                      }`}
                    >
                      {(statusConfig[activeClaim.status] || statusConfig.PENDING).badge}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Order: {activeClaim.orderNumber || `#${activeClaim.orderId}`} &bull; Pemesan ID: #{activeClaim.userId}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs flex-1">
              {/* Product Info Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={activeClaim.productImage || "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=100"}
                    alt={activeClaim.productName}
                    className="w-14 h-14 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">{activeClaim.productName}</h4>
                    <p className="text-slate-400 mt-0.5">
                      Kategori: <span className="text-slate-200">{categoryLabels[activeClaim.category] || activeClaim.category}</span>
                    </p>
                    <p className="text-emerald-400 font-semibold mt-0.5">
                      Solusi: {solutionLabels[activeClaim.solution] || activeClaim.solution}
                      {activeClaim.requestedSize && (
                        <span className="ml-1 text-white font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          (Ukuran Baru: {activeClaim.requestedSize})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Complaint Description */}
              <div className="space-y-1.5">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-[#00BFA5]" />
                  Keluhan / Alasan Pelanggan:
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-slate-200 text-xs leading-relaxed italic">
                  &ldquo;{activeClaim.description || "Tidak ada deskripsi tambahan."}&rdquo;
                </div>
              </div>

              {/* Evidence Images Gallery */}
              <div className="space-y-2">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  Foto Bukti Cacat / Ukuran (Cloudinary CDN):
                </div>
                {activeClaim.evidenceImages ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {activeClaim.evidenceImages.split(",").map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImage(img.trim())}
                        className="group/thumb relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-[#00BFA5] bg-black/40 cursor-pointer transition"
                      >
                        <img
                          src={img.trim()}
                          alt={`Bukti ${idx + 1}`}
                          className="w-full h-full object-cover transition group-hover/thumb:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition">
                          <Eye size={18} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Tidak ada foto bukti yang disertakan.</p>
                )}
              </div>

              {/* Existing Admin Notes or Tracking */}
              {(activeClaim.adminNotes || activeClaim.replacementTrackingNumber) && (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                    Catatan Internal & Tracking Saat Ini:
                  </div>
                  {activeClaim.adminNotes && (
                    <div className="text-slate-300">
                      <span className="text-slate-500 font-semibold">Catatan CS/Admin: </span>
                      {activeClaim.adminNotes}
                    </div>
                  )}
                  {activeClaim.replacementTrackingNumber && (
                    <div className="text-emerald-400 font-mono font-bold">
                      <span className="text-slate-500 font-semibold">Resi Pengganti: </span>
                      {activeClaim.replacementTrackingNumber}
                    </div>
                  )}
                </div>
              )}

              {/* Action Forms */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                    Tindakan & Verifikasi
                  </h5>
                  <span className="text-[10px] text-slate-500">
                    Role Anda: {isLogistics ? "Gudang / Logistik" : "Admin / CS"}
                  </span>
                </div>

                {/* Form Input Catatan CS / Alasan */}
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">
                    Catatan Verifikasi / Instruksi untuk Pelanggan:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Disetujui. Silakan kirimkan jersey lama ke Gudang RegarSport Wonogiri..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-[#00BFA5] text-xs text-white placeholder-slate-500 outline-none transition resize-none"
                  />
                </div>

                {/* If APPROVED or PROCESSING, show Replacement Tracking Input for Gudang */}
                {(activeClaim.status === "APPROVED" || activeClaim.status === "PROCESSING") && (
                  <div className="p-4 rounded-xl bg-[#00BFA5]/5 border border-[#00BFA5]/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#00BFA5]">
                      <Truck size={15} />
                      <span>Pengiriman Produk Pengganti / Hasil Retur (Gudang)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                          Pilih Ekspedisi:
                        </label>
                        <select
                          value={replacementCourier}
                          onChange={(e) => setReplacementCourier(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#14141E] border border-white/10 text-xs text-white outline-none focus:border-[#00BFA5]"
                        >
                          {courierList.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                          Nomor Resi Baru:
                        </label>
                        <input
                          type="text"
                          placeholder="Misal: JT88927192801"
                          value={replacementTrackingNumber}
                          onChange={(e) => setReplacementTrackingNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#14141E] border border-white/10 text-xs text-white outline-none focus:border-[#00BFA5] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  {activeClaim.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={() => handleUpdateStatus("REJECTED")}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle size={15} />
                        <span>Tolak Klaim</span>
                      </button>

                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={() => handleUpdateStatus("APPROVED")}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                        <span>Setujui Klaim</span>
                      </button>
                    </>
                  )}

                  {activeClaim.status === "APPROVED" && (
                    <>
                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={() => handleUpdateStatus("PROCESSING")}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw size={14} />
                        <span>Terima Retur & Proses di Gudang</span>
                      </button>

                      <button
                        type="button"
                        disabled={submittingAction}
                        onClick={() => handleUpdateStatus("RESOLVED")}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Truck size={15} />
                        <span>Kirim Resi Pengganti & Selesaikan</span>
                      </button>
                    </>
                  )}

                  {activeClaim.status === "PROCESSING" && (
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleUpdateStatus("RESOLVED")}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Truck size={15} />
                      <span>Kirim Resi Pengganti & Selesaikan</span>
                    </button>
                  )}

                  {(activeClaim.status === "RESOLVED" || activeClaim.status === "REJECTED") && (
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleUpdateStatus(activeClaim.status)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Perbarui Catatan Saja</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo Evidence */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl bg-black">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black transition"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Bukti Besar"
              className="w-full h-full object-contain max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

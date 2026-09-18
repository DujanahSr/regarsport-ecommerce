/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Calendar,
  X,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minSpend: 100000,
    maxDiscount: 50000,
    usageLimit: 100,
    validUntil: "",
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/vouchers");
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setVouchers(list);
    } catch (err) {
      console.error("Gagal memuat daftar kupon:", err);
      toast.error("Gagal memuat kupon promo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode '${code}' berhasil disalin!`);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const handleToggleActive = async (id) => {
    try {
      await api.patch(`/orders/vouchers/${id}/toggle`);
      toast.success("Status kupon berhasil diperbarui");
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengubah status");
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Yakin ingin menghapus kupon '${code}'?`)) return;
    try {
      await api.delete(`/orders/vouchers/${id}`);
      toast.success(`Kupon '${code}' berhasil dihapus`);
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus kupon");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error("Kode promo wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minSpend: formData.minSpend ? Number(formData.minSpend) : 0,
        maxDiscount:
          formData.discountType === "PERCENTAGE" && formData.maxDiscount
            ? Number(formData.maxDiscount)
            : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : 100,
        isActive: true,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
      };

      await api.post("/orders/vouchers", payload);
      toast.success(`Kupon promo '${payload.code}' berhasil dibuat!`);
      setShowAddModal(false);
      setFormData({
        code: "",
        name: "",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minSpend: 100000,
        maxDiscount: 50000,
        usageLimit: 100,
        validUntil: "",
      });
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membuat kupon promo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00BFA5]/20 blur-xl rounded-2xl" />
            <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-3 rounded-2xl">
              <Tag size={28} className="text-[#00BFA5]" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-[-1px]">
              KUPON & VOUCHER PROMO
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Kelola diskon promosi, potongan harga pesanan tim, dan kuota kupon checkout Midtrans
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00BFA5] text-black font-extrabold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-[#00BFA5]/25 hover:scale-105 transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Buat Kupon Baru</span>
          </button>
        </div>
      </div>

      {/* Vouchers Grid */}
      {loading ? (
        <ScreenLoader />
      ) : vouchers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#14141E] border border-white/5 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#00BFA5]/10 flex items-center justify-center text-[#00BFA5]">
            <Tag size={32} />
          </div>
          <h3 className="text-lg font-bold text-white">Belum Ada Kupon Promo</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Buat kupon pertama Anda seperti diskon 10% atau potongan Rp 20.000 untuk menarik pembeli apparel olahraga.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#00BFA5] text-black font-extrabold text-xs uppercase tracking-wider"
          >
            + Buat Kupon Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((voucher) => {
            const isPercentage = voucher.discountType === "PERCENTAGE";
            const usagePct = Math.min(
              100,
              Math.round(((voucher.usedCount || 0) / (voucher.usageLimit || 1)) * 100)
            );

            return (
              <div
                key={voucher.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-5 ${
                  voucher.isActive
                    ? "bg-[#14141E] border-white/10 hover:border-[#00BFA5]/50 shadow-xl"
                    : "bg-[#14141E]/50 border-white/5 opacity-60"
                }`}
              >
                {/* Top Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleCopyCode(voucher.code)}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs font-mono font-black text-[#00BFA5] hover:border-[#00BFA5] transition-colors"
                      title="Klik untuk menyalin kode"
                    >
                      <span>{voucher.code}</span>
                      {copiedCode === voucher.code ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} className="opacity-60 group-hover:opacity-100" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          voucher.isActive
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {voucher.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                      <button
                        onClick={() => handleDelete(voucher.id, voucher.code)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Hapus kupon"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{voucher.name}</h3>
                    <div className="text-2xl font-black text-[#00BFA5] mt-1">
                      {isPercentage
                        ? `Diskon ${voucher.discountValue}%`
                        : `Potongan Rp ${Number(voucher.discountValue).toLocaleString("id-ID")}`}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-white/5">
                    <div>
                      Min. Belanja: <strong className="text-slate-200">Rp {Number(voucher.minSpend || 0).toLocaleString("id-ID")}</strong>
                    </div>
                    {isPercentage && voucher.maxDiscount && (
                      <div>
                        Maks. Potongan: <strong className="text-slate-200">Rp {Number(voucher.maxDiscount).toLocaleString("id-ID")}</strong>
                      </div>
                    )}
                    {voucher.validUntil && (
                      <div>
                        Berlaku s/d:{" "}
                        <strong className="text-slate-200">
                          {new Date(voucher.validUntil).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Usage & Toggle */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Pemakaian Kuota</span>
                      <span>
                        {voucher.usedCount || 0} / {voucher.usageLimit || 100} ({usagePct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00BFA5] to-teal-400 rounded-full transition-all"
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleActive(voucher.id)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      voucher.isActive
                        ? "bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 border border-white/10"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                    }`}
                  >
                    {voucher.isActive ? "Nonaktifkan Kupon" : "Aktifkan Kupon"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE VOUCHER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#14141E] border border-white/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#00BFA5]/10 p-2 rounded-lg text-[#00BFA5]">
                  <Plus size={18} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Buat Kupon Promo Baru</h3>
                  <p className="text-[11px] text-slate-400">Atur kode voucher dan besaran diskon</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Kode Kupon *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: REGARJUARA"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 font-mono font-bold text-white text-xs uppercase focus:outline-none focus:border-[#00BFA5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Tipe Diskon *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00BFA5]"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED_AMOUNT">Nominal Tetap (Rp)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Nama Promo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Diskon Juara Turnamen Futsal"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00BFA5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Nilai Diskon {formData.discountType === "PERCENTAGE" ? "(%)" : "(Rp)"} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === "PERCENTAGE" ? "10" : "20000"}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00BFA5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Minimal Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minSpend}
                    onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
                    placeholder="100000"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00BFA5]"
                  />
                </div>
              </div>

              {formData.discountType === "PERCENTAGE" && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Maksimal Potongan Diskon (Rp, Opsional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="Contoh: 50000"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00BFA5]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Batas Kuota Pemakaian
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00BFA5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Berlaku Sampai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00BFA5]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00BFA5] text-black font-extrabold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-[#00BFA5]/25 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Simpan Kupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

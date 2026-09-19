import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Package,
  Ruler,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const CATEGORIES = [
  { id: "SIZE_EXCHANGE", label: "Tukar Ukuran (Ukuran Kurang Pas)", icon: Ruler },
  { id: "PRINTING_DEFECT", label: "Cacat Sablon / Salah Cetak Nama & No", icon: FileText },
  { id: "MATERIAL_DEFECT", label: "Cacat Jahitan / Kain Rusak", icon: AlertCircle },
  { id: "OTHER", label: "Kendala Lainnya", icon: Package },
];

const SOLUTIONS = [
  { id: "EXCHANGE_SIZE", label: "Tukar Ukuran Baru (Size Exchange)" },
  { id: "REPLACEMENT", label: "Ganti Baru / Produksi Ulang 100%" },
  { id: "REPAIR", label: "Perbaikan Cacat Jahitan" },
];

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL", "3XL"];

export default function WarrantyClaimModal({ isOpen, onClose, order, onSuccess }) {
  if (!isOpen || !order) return null;

  const orderItems = order.items || [];
  const [selectedProductId, setSelectedProductId] = useState(
    orderItems[0]?.productId || orderItems[0]?.id || null
  );
  const [category, setCategory] = useState("SIZE_EXCHANGE");
  const [solution, setSolution] = useState("EXCHANGE_SIZE");
  const [requestedSize, setRequestedSize] = useState("L");
  const [description, setDescription] = useState("");
  const [evidenceImage, setEvidenceImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState(null);

  const selectedItem =
    orderItems.find((it) => (it.productId || it.id) === selectedProductId) ||
    orderItems[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Mohon tuliskan penjelasan kendala produk Anda");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        orderId: order.id,
        orderNumber: order.orderNumber || `#${order.id}`,
        productId: selectedItem?.productId || selectedItem?.id || 1,
        productName: selectedItem?.productName || selectedItem?.name || "Produk Apparel",
        productImage: selectedItem?.productImage || selectedItem?.imageUrl || "",
        category,
        solution,
        requestedSize: category === "SIZE_EXCHANGE" ? requestedSize : null,
        description: description.trim(),
        evidenceImages: evidenceImage.trim() || null,
      };

      const res = await api.post("/warranty-claims", payload);
      const claimData = res.data?.data || res.data;
      setSubmittedClaim(claimData);
      toast.success("Klaim garansi berhasil diajukan!");
      if (onSuccess) onSuccess(claimData);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal mengajukan klaim garansi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendToWhatsApp = () => {
    if (!submittedClaim) return;
    const catLabel =
      CATEGORIES.find((c) => c.id === submittedClaim.category)?.label ||
      submittedClaim.category;
    const solLabel =
      SOLUTIONS.find((s) => s.id === submittedClaim.solution)?.label ||
      submittedClaim.solution;

    let text = `Halo Customer Care PT RegarSport Indonesia,\n\nSaya telah mengajukan *Klaim Garansi Resmi* melalui website:\n`;
    text += `• *No. Tiket Klaim*: ${submittedClaim.claimNumber}\n`;
    text += `• *No. Pesanan*: ${submittedClaim.orderNumber}\n`;
    text += `• *Produk*: ${submittedClaim.productName}\n`;
    text += `• *Kendala*: ${catLabel}\n`;
    if (submittedClaim.requestedSize) {
      text += `• *Ukuran Pengganti*: ${submittedClaim.requestedSize}\n`;
    }
    text += `• *Solusi Diharapkan*: ${solLabel}\n`;
    text += `• *Keterangan*: ${submittedClaim.description}\n\n`;
    text += `Mohon bantuannya untuk verifikasi dan pemrosesan klaim ini. Terima kasih!`;

    const url = `https://api.whatsapp.com/send?phone=6282133445566&text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-xs shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Pengajuan Klaim Garansi Resmi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Garansi 100% Bebas Cemas: Tukar Ukuran & Cacat Produksi RegarSport
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* If claim already submitted successfully */}
        {submittedClaim ? (
          <div className="mt-6 text-center py-4 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                TIKET BERHASIL DITERBITKAN
              </span>
              <h4 className="mt-2 text-2xl font-black text-slate-900">
                {submittedClaim.claimNumber}
              </h4>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Klaim garansi untuk pesanan{" "}
                <span className="font-bold text-slate-700">
                  {submittedClaim.orderNumber}
                </span>{" "}
                telah tersimpan di sistem kami.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-xs space-y-1.5 text-slate-600">
              <p>
                <strong className="text-slate-900">Produk:</strong>{" "}
                {submittedClaim.productName}
              </p>
              <p>
                <strong className="text-slate-900">Kategori:</strong>{" "}
                {submittedClaim.category}
              </p>
              {submittedClaim.requestedSize && (
                <p>
                  <strong className="text-slate-900">Ukuran Pengganti:</strong>{" "}
                  {submittedClaim.requestedSize}
                </p>
              )}
              <p>
                <strong className="text-slate-900">Status:</strong> Menunggu
                Verifikasi Tim Quality Assurance
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>Teruskan ke WhatsApp CS</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-5 text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          /* Form Klaim */
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* 1. Pilih Produk */}
            {orderItems.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. Pilih Produk yang Diklaim
                </label>
                <div className="space-y-2">
                  {orderItems.map((it) => (
                    <label
                      key={it.productId || it.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                        selectedProductId === (it.productId || it.id)
                          ? "border-emerald-500 bg-emerald-50/50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="productClaim"
                        checked={selectedProductId === (it.productId || it.id)}
                        onChange={() =>
                          setSelectedProductId(it.productId || it.id)
                        }
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <img
                        src={
                          it.productImage ||
                          it.imageUrl ||
                          "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=200&q=80"
                        }
                        alt={it.productName}
                        className="w-10 h-10 object-cover rounded-lg shrink-0"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">
                          {it.productName || it.name}
                        </p>
                        <p className="text-slate-400">Ukuran: {it.size || "L"}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Kategori Kendala */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                2. Jenis Kendala Produk
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const CatIcon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-semibold text-left transition cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/30"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <CatIcon
                        size={16}
                        className={
                          isSelected ? "text-emerald-600" : "text-slate-400"
                        }
                      />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Jika Tukar Ukuran, Pilih Ukuran Baru */}
            {category === "SIZE_EXCHANGE" && (
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4">
                <label className="block text-xs font-bold text-emerald-900 mb-2">
                  Pilih Ukuran Baru Pengganti:
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setRequestedSize(sz)}
                      className={`h-9 w-12 rounded-xl text-xs font-black transition cursor-pointer ${
                        requestedSize === sz
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "border border-emerald-200 bg-white text-slate-700 hover:border-emerald-400"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-700 mt-2">
                  💡 RegarSport akan mengirimkan ukuran baru setelah konfirmasi klaim.
                </p>
              </div>
            )}

            {/* 4. Solusi yang Diharapkan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                3. Solusi yang Diharapkan
              </label>
              <select
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {SOLUTIONS.map((sol) => (
                  <option key={sol.id} value={sol.id}>
                    {sol.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Foto Bukti Kendala */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                4. Lampirkan URL Foto Bukti (Opsional / Dianjurkan)
              </label>
              <div className="relative">
                <ImageIcon
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="url"
                  placeholder="https://... (link foto kendala atau upload)"
                  value={evidenceImage}
                  onChange={(e) => setEvidenceImage(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* 6. Deskripsi Kendala */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                5. Deskripsi Detail Kendala
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan secara singkat kendala pada produk, misalnya: ukuran dada terasa sempit, sablon nomor miring, dsb."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck size={16} />
                <span>{submitting ? "Mengajukan..." : "Kirim Pengajuan Klaim"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Wallet,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Box,
  AlertCircle,
  Copy,
  Check,
  Star,
  X,
  PackageCheck,
  Camera,
  ImagePlus,
  Loader2,
  Printer,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import MidtransModal from "../../components/common/MidtransModal";
import InvoiceModal from "../../components/customer/InvoiceModal";
import { useAuth } from "../../context/AuthContext";

const ORDER_STEPS = [
  { key: "PENDING", label: "Pesanan Dibuat", icon: Clock },
  { key: "PAID", label: "Pembayaran Lunas", icon: CreditCard },
  { key: "PROCESSING", label: "Sedang Diproses", icon: Box },
  { key: "SHIPPED", label: "Dalam Pengiriman", icon: Truck },
  { key: "COMPLETED", label: "Selesai", icon: CheckCircle2 },
];

const STATUS_RANK = {
  PENDING: 1,
  PAID: 2,
  PROCESSING: 3,
  SHIPPED: 4,
  COMPLETED: 5,
  CANCELLED: -1,
};

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Review Modal State
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());

  const handleCopyResi = (resi) => {
    if (!resi) return;
    navigator.clipboard.writeText(resi);
    setCopiedResi(true);
    toast.success("Nomor resi berhasil disalin!");
    setTimeout(() => setCopiedResi(false), 2000);
  };

  const handleCompleteOrder = async () => {
    if (!window.confirm("Pastikan Anda telah menerima paket dengan baik. Selesaikan pesanan ini?")) return;
    try {
      setCompleting(true);
      await api.patch(`/orders/${id}/complete`);
      toast.success("Pesanan telah selesai! Terima kasih atas pesanan Anda.");
      getOrder(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyelesaikan pesanan");
    } finally {
      setCompleting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (reviewImages.length + files.length > 3) {
      toast.error("Maksimal 3 foto ulasan untuk produk ini");
      return;
    }
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
        toast.error("Format foto harus JPG, PNG, atau WEBP");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran tiap foto maksimal 5MB");
        return;
      }
    }
    try {
      setUploadingImage(true);
      const newUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "regarstore/reviews");
        const res = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url = res.data?.image_url || res.data?.data?.imageUrl;
        if (url) newUrls.push(url);
      }
      setReviewImages((prev) => [...prev, ...newUrls].slice(0, 3));
      toast.success("Foto ulasan berhasil diunggah!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengunggah foto ulasan");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error("Komentar ulasan tidak boleh kosong");
      return;
    }
    const productId = reviewItem.productId || reviewItem.products?.id;
    if (!productId) {
      toast.error("ID Produk tidak valid");
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post(`/products/${productId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
        customerName: user?.fullName || user?.full_name || user?.name || "Pelanggan RegarSport",
        customerAvatar: user?.avatarUrl || user?.avatar_url || "",
        images: reviewImages,
      });
      toast.success(
        reviewedProductIds.has(productId)
          ? "Ulasan Anda berhasil diperbarui!"
          : "Ulasan Anda berhasil dikirim! Terima kasih."
      );
      setReviewedProductIds((prev) => new Set(prev).add(productId));
      setReviewItem(null);
      setReviewComment("");
      setReviewRating(5);
      setReviewImages([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim ulasan");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenReviewModal = async (item) => {
    setReviewItem(item);
    const productId = item.productId || item.products?.id;
    if (!productId) return;

    // Default values
    setReviewRating(5);
    setReviewComment("");
    setReviewImages([]);

    try {
      const res = await api.get(`/products/${productId}/my-review`);
      const existing = res.data?.data;
      if (existing) {
        setReviewRating(Number(existing.rating) || 5);
        setReviewComment(existing.comment || "");
        setReviewImages(Array.isArray(existing.images) ? existing.images : []);
        setReviewedProductIds((prev) => new Set(prev).add(productId));
      }
    } catch {
      // not yet reviewed
    }
  };

  const getOrder = async (skipLoading = false) => {
    try {
      if (!skipLoading) setLoading(true);
      setError("");
      const res = await api.get(`/orders/${id}`);
      const orderData = res.data?.data || res.data;
      setOrder(orderData);

      // Auto-detect existing reviews for completed orders
      if ((orderData?.status || "").toUpperCase() === "COMPLETED") {
        const items = orderData.items || orderData.order_items || [];
        items.forEach((it) => {
          const pId = it.productId || it.products?.id;
          if (pId) {
            api.get(`/products/${pId}/my-review`).then((r) => {
              if (r.data?.data) {
                setReviewedProductIds((prev) => new Set(prev).add(pId));
              }
            }).catch(() => {});
          }
        });
      }

      // Auto-sync with Midtrans if still pending
      if (
        (orderData?.status || "").toUpperCase() === "PENDING" &&
        orderData?.orderNumber
      ) {
        api
          .get(`/payments/sync/${orderData.orderNumber}`)
          .then((syncRes) => {
            const status = (
              syncRes.data?.data?.paymentStatus || ""
            ).toUpperCase();
            if (status === "SETTLEMENT" || status === "CAPTURE") {
              api
                .get(`/orders/${id}`)
                .then((r) => setOrder(r.data?.data || r.data));
            }
          })
          .catch(() => {});
      }
    } catch (requestError) {
      console.log(requestError);
      setError("Detail order gagal dimuat.");
      setOrder(null);
    } finally {
      if (!skipLoading) setLoading(false);
    }
  };

  useEffect(() => {
    getOrder();
  }, [id]);

  if (loading) {
    return <ScreenLoader label="Memuat detail pesanan..." />;
  }

  if (error) {
    return <EmptyState title="Detail order gagal dimuat" description={error} />;
  }

  if (!order) {
    return (
      <EmptyState
        title="Order tidak ditemukan"
        description="Pesanan yang Anda cari tidak tersedia atau Anda tidak memiliki akses."
      />
    );
  }

  const rawStatus = (order.status || "PENDING").toUpperCase();
  const currentRank = STATUS_RANK[rawStatus] || 1;
  const isCancelled = rawStatus === "CANCELLED";
  const isPending = rawStatus === "PENDING";
  const orderItems = order.items || order.order_items || [];
  const totalAmount = Number(order.totalAmount || order.total_amount || 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back Button */}
      <Link
        to="/dashboard/my-orders"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft size={16} />
        Kembali ke Pesanan Saya
      </Link>

      {/* Main Card */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Package size={20} className="text-emerald-600" />
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {order.orderNumber || `Order #${order.id}`}
              </h1>
            </div>
            {order.createdAt || order.created_at ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar size={13} />
                Dibuat pada:{" "}
                {new Date(order.createdAt || order.created_at).toLocaleString(
                  "id-ID"
                )}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {/* Tombol Cetak Invoice Resmi */}
            <button
              type="button"
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 ring-1 ring-slate-200 shadow-xs transition hover:bg-slate-50 hover:text-emerald-700 active:scale-95 cursor-pointer"
              title="Cetak Faktur Pembelian / Invoice Resmi"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Cetak</span> Invoice
            </button>

            {isCancelled ? (
              <span className="rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200">
                Dibatalkan
              </span>
            ) : isPending ? (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <CreditCard size={16} />
                Bayar Sekarang
              </button>
            ) : (
              <span className="rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                {order.status}
              </span>
            )}
          </div>
        </div>

        {/* Stepper / Timeline */}
        {isCancelled ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-center gap-3">
            <AlertCircle size={20} className="text-rose-600 shrink-0" />
            <p className="text-sm font-medium">
              Pesanan ini telah dibatalkan dan tidak dapat diproses lebih lanjut.
            </p>
          </div>
        ) : (
          <div className="py-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Status Progres Pesanan
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
              {ORDER_STEPS.map((step, idx) => {
                const stepRank = STATUS_RANK[step.key];
                const isCompleted = currentRank >= stepRank;
                const isCurrent = currentRank === stepRank;
                const IconComponent = step.icon;

                return (
                  <div
                    key={step.key}
                    className={`flex flex-col items-center text-center p-3 rounded-2xl border transition ${
                      isCurrent
                        ? "border-emerald-500 bg-emerald-50/50 shadow-xs"
                        : isCompleted
                        ? "border-slate-100 bg-slate-50/70"
                        : "border-dashed border-slate-200 opacity-45"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center mb-2 transition ${
                        isCompleted
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      <IconComponent size={18} />
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isCurrent
                          ? "text-emerald-700"
                          : isCompleted
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Langkah {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Kartu Informasi Pengiriman & Resi */}
        {(order.shippingCourier || order.trackingNumber || (order.status || "").toUpperCase() === "SHIPPED") && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <Truck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full">
                    {order.shippingCourier || "Ekspedisi"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Nomor Resi:</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
                    {order.trackingNumber || "Menunggu pembaruan nomor resi"}
                  </span>
                  {order.trackingNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopyResi(order.trackingNumber)}
                      className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
                      title="Salin Nomor Resi"
                    >
                      {copiedResi ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {(order.status || "").toUpperCase() === "SHIPPED" && (
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={completing}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 shadow-lg shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 shrink-0"
              >
                <PackageCheck size={18} />
                {completing ? "Menyelesaikan..." : "Konfirmasi Pesanan Diterima"}
              </button>
            )}
          </div>
        )}

        {/* Info Grid: Customer & Shipping */}
        <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-slate-100">
          {/* Shipping Address */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
              <MapPin size={16} className="text-emerald-600" />
              Alamat Pengiriman
            </h3>
            <div className="text-sm text-slate-600 leading-relaxed space-y-1">
              <p className="font-bold text-slate-900">
                {order.recipientName || order.customerName || "Penerima"}
                {(order.customerPhone || order.shippingPhone) && (
                  <span className="font-normal text-slate-500 font-mono text-xs ml-2">
                    ({order.customerPhone || order.shippingPhone})
                  </span>
                )}
              </p>
              <p>
                {order.shippingAddress ||
                  order.shipping_address ||
                  "Alamat tidak tercantum"}
              </p>
              {(order.shippingCity || order.shippingPostalCode) && (
                <p className="text-slate-500 text-xs">
                  {[order.shippingCity, order.shippingPostalCode].filter(Boolean).join(", ")}
                </p>
              )}
              {order.shippingNotes && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700">
                  <span className="font-bold">Catatan Kurir:</span> {order.shippingNotes}
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
              <Wallet size={16} className="text-emerald-600" />
              Rincian Pembayaran
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Metode Pembayaran</span>
                <span className="font-semibold text-slate-800">
                  Midtrans Payment Gateway
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status Transaksi</span>
                <span
                  className={`font-bold ${
                    isPending ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {isPending ? "Menunggu Pembayaran" : "Lunas (Settlement)"}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2 text-slate-900">
                <span className="font-bold">Total Pembayaran</span>
                <span className="font-black text-emerald-600 text-base">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Daftar Produk ({orderItems.length} item)
          </h2>

          <div className="space-y-3">
            {orderItems.map((item, index) => {
              const name = item.productName || item.products?.name;
              const img =
                item.productImage ||
                item.products?.image_url ||
                "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";
              const price = Number(item.price || item.products?.price || 0);

              return (
                <div
                  key={item.id || index}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs transition hover:shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={img}
                      alt={name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover bg-slate-50 border border-slate-100"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";
                      }}
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400">
                          {item.quantity} barang &times; Rp {price.toLocaleString("id-ID")}
                        </p>
                        {item.size && (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                            Ukuran: {item.size}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold text-slate-900">
                      Rp {(price * item.quantity).toLocaleString("id-ID")}
                    </span>
                    {(order.status || "").toUpperCase() === "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(item)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition active:scale-95 ${
                          reviewedProductIds.has(item.productId || item.products?.id)
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                            : "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200/80"
                        }`}
                      >
                        <Star
                          size={13}
                          className={
                            reviewedProductIds.has(item.productId || item.products?.id)
                              ? "fill-emerald-500 text-emerald-500"
                              : "fill-amber-500 text-amber-500"
                          }
                        />
                        {reviewedProductIds.has(item.productId || item.products?.id) ? "Ubah Ulasan" : "Beri Ulasan"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Callout Button */}
        {isPending && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-amber-900">
                Pesanan Anda Belum Dibayar
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Segera selesaikan pembayaran untuk memproses pengiriman produk Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 shrink-0"
            >
              <CreditCard size={18} />
              Bayar Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Modal Beri Ulasan */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Star size={20} className="fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {reviewedProductIds.has(reviewItem.productId || reviewItem.products?.id)
                      ? "Ubah Ulasan Produk"
                      : "Ulasan Produk"}
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-60">
                    {reviewItem.productName || reviewItem.products?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Beri Bintang</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 transition hover:scale-110 active:scale-95"
                    >
                      <Star
                        size={28}
                        className={star <= reviewRating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-slate-700 ml-2">
                    {reviewRating} dari 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Testimoni / Pengalaman Anda</label>
                <textarea
                  rows={4}
                  placeholder="Ceritakan kualitas bahan jersey, sablon, kenyamanan, atau pengiriman..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition resize-none"
                  required
                />
              </div>

              {/* Upload Foto Produk Ulasan */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Camera size={14} className="text-emerald-600" />
                    Foto Produk (Opsional, Maks. 3)
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {reviewImages.length}/3 Foto
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {reviewImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative h-20 w-20 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50 shrink-0"
                    >
                      <img
                        src={imgUrl}
                        alt={`Review foto ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition shadow-xs"
                        title="Hapus foto"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {reviewImages.length < 3 && (
                    <label
                      className={`h-20 w-20 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-700 cursor-pointer transition shrink-0 ${
                        uploadingImage ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <Loader2 size={20} className="animate-spin text-emerald-600" />
                      ) : (
                        <>
                          <ImagePlus size={20} />
                          <span className="text-[10px] font-bold mt-1">+ Foto</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Format JPG, PNG, WEBP (maks. 5MB). Foto asli jersey akan tampil di ulasan publik produk.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  {reviewedProductIds.has(reviewItem?.productId || reviewItem?.products?.id)
                    ? (submittingReview ? "Memperbarui..." : "Perbarui Ulasan")
                    : (submittingReview ? "Mengirim..." : "Kirim Ulasan")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Midtrans Reusable Modal */}
      <MidtransModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        order={order}
        onSuccess={() => {
          setTimeout(() => {
            getOrder();
          }, 600);
        }}
      />

      {/* Invoice Resmi Pembelian Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={order}
      />
    </div>
  );
}
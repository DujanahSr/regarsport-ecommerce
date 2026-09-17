/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Search,
  Star,
  Reply,
  Trash2,
  Send,
} from "lucide-react";
import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import toast from "react-hot-toast";

/* ----------------------------------------------------------------
   ReviewRow – memoized untuk performa
---------------------------------------------------------------- */
const ReviewRow = memo(function ReviewRow({ review, index, page, limit, onReplySent }) {
  const [avatarError, setAvatarError] = useState(false);
  const [productImageError, setProductImageError] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState(review.review_replies?.[0]?.reply || "");
  const [submitting, setSubmitting] = useState(false);

  const customerName = review.customerName || review.users?.full_name || "Pelanggan";
  const customerAvatar = review.customerAvatar || review.users?.avatar_url;
  const customerEmail = review.users?.email || "";
  const productName = review.productName || review.products?.name || "Jersey";
  const productImage = review.productImage || review.products?.image_url;
  const reviewDate = review.createdAt || review.created_at;
  const existingReply = review.review_replies?.[0];

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast.error("Balasan tidak boleh kosong");
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/admin/reviews/${review.id}/reply`, { reply: replyText.trim() });
      toast.success("Balasan berhasil disimpan");
      setShowReplyForm(false);
      onReplySent();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan balasan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!confirm("Hapus balasan ini?")) return;
    try {
      await api.delete(`/admin/reviews/${review.id}/reply`);
      toast.success("Balasan dihapus");
      onReplySent();
    } catch {
      toast.error("Gagal menghapus balasan");
    }
  };

  const handleDeleteReview = async () => {
    if (!confirm(`Hapus ulasan dari "${customerName}"? Tindakan ini permanen.`)) return;
    try {
      await api.delete(`/admin/reviews/${review.id}`);
      toast.success("Ulasan berhasil dihapus");
      onReplySent();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menghapus ulasan");
    }
  };

  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors duration-200 group">
      <td className="p-4 text-white/40 text-sm font-mono">
        {(page - 1) * limit + index + 1}
      </td>
      <td className="p-4 min-w-48">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1a1a2a] border border-white/10 flex items-center justify-center shrink-0">
            {customerAvatar && !avatarError ? (
              <img
                src={customerAvatar}
                alt={customerName}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="text-xs font-bold text-[#00BFA5]">
                {customerName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-white/90 text-sm font-semibold group-hover:text-white transition-colors">
              {customerName}
            </p>
            {customerEmail && <p className="text-white/30 text-xs">{customerEmail}</p>}
          </div>
        </div>
      </td>
      <td className="p-4 min-w-48">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0C0C16] border border-white/10 flex items-center justify-center shrink-0">
            {productImage && !productImageError ? (
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
                onError={() => setProductImageError(true)}
              />
            ) : (
              <MessageSquareText size={16} className="text-white/30" />
            )}
          </div>
          <p className="text-white/80 text-sm font-medium truncate max-w-45" title={productName}>
            {productName}
          </p>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-0.5 text-yellow-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < Number(review.rating) ? "fill-current" : "text-white/20"}
            />
          ))}
        </div>
      </td>
      <td className="p-4 text-white/70 text-sm max-w-xs">
        <p className="line-clamp-3 leading-relaxed">{review.comment}</p>
        {Array.isArray(review.images) && review.images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {review.images.map((imgUrl, i) => (
              <a
                key={i}
                href={imgUrl}
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 rounded-lg overflow-hidden border border-white/10 hover:border-[#00BFA5] transition shrink-0 block"
                title="Buka foto resolusi penuh"
              >
                <img src={imgUrl} alt={`Foto ulasan ${i + 1}`} className="h-full w-full object-cover hover:scale-110 transition duration-200" />
              </a>
            ))}
          </div>
        )}
        {existingReply && (
          <div className="mt-2 p-2.5 bg-[#00BFA5]/10 border border-[#00BFA5]/20 rounded-xl text-xs">
            <span className="font-semibold text-[#00BFA5]">
              Admin {existingReply.admin_name || "RegarSport"}:
            </span>
            <span className="text-white/80 ml-1">{existingReply.reply}</span>
          </div>
        )}
      </td>
      <td className="p-4 text-white/40 text-sm whitespace-nowrap">
        {reviewDate ? (
          new Date(reviewDate).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        ) : "-"}
      </td>
      <td className="p-4">
        {!showReplyForm ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowReplyForm(true)}
              className="p-2 rounded-xl hover:bg-white/5 text-[#00BFA5]/70 hover:text-[#00BFA5] transition-all duration-200"
              title="Balas Ulasan"
            >
              <Reply size={18} />
            </button>
            <button
              onClick={handleDeleteReview}
              className="p-2 rounded-xl hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all duration-200"
              title="Hapus Ulasan Ini"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 min-w-56 animate-in fade-in slide-in-from-top-2 duration-200">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis balasan resmi toko..."
              className="bg-[#0D0D0D] border border-white/10 rounded-xl p-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#00BFA5]/60 transition-all resize-none"
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSubmitReply}
                disabled={submitting}
                className="flex items-center gap-1.5 bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50 active:scale-95"
              >
                <Send size={12} /> Kirim
              </button>
              <button
                onClick={() => setShowReplyForm(false)}
                className="bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg text-xs border border-white/10 transition"
              >
                Batal
              </button>
              {existingReply && (
                <button
                  onClick={handleDeleteReply}
                  className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs border border-red-500/20 transition"
                >
                  <Trash2 size={12} /> Hapus Balasan
                </button>
              )}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
});

/* ----------------------------------------------------------------
   Reviews Page
---------------------------------------------------------------- */
export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const limit = 10;
  const searchTimerRef = useRef(null);

  /* Debounce search */
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [search]);

  /* Fetch reviews */
  const getReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/reviews", {
        params: {
          search: debouncedSearch || undefined,
          rating: ratingFilter || undefined,
          page,
          limit,
        },
      });
      setReviews(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
      setTotalPages(res.data.meta?.totalPages || 1);
      setAverageRating(Number(res.data.meta?.averageRating ?? res.data.summary?.averageRating ?? 0));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, ratingFilter, page]);

  useEffect(() => {
    getReviews();
  }, [getReviews]);

  const activeFilterLabel = ratingFilter ? `${ratingFilter} bintang` : "Semua rating";

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-10">
      {/* ======================== HEADER ======================== */}
      <div className="flex items-center gap-4 mb-10">
        <div className="relative">
          <div className="absolute inset-0 bg-[#00BFA5]/20 blur-xl rounded-2xl" />
          <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-3 rounded-2xl">
            <MessageSquareText size={28} className="text-[#00BFA5]" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-[-1px]">REVIEWS</h1>
          <p className="text-[#2a3a3a] text-sm">
            Total <span className="text-white font-semibold">{total}</span> review · Rata‑rata{" "}
            <span className="text-white font-semibold">{averageRating.toFixed(1)}</span>/5 ·{" "}
            {activeFilterLabel}
          </p>
        </div>
      </div>

      {/* ======================== FILTER BAR ======================== */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 bg-[#14141E] border border-white/5 rounded-2xl px-5 py-3 hover:border-[#00BFA5]/20 transition-all duration-300 group">
          <Search size={20} className="text-white/30 group-hover:text-[#00BFA5]/60 transition-colors duration-300" />
          <input
            type="text"
            placeholder="Cari isi komentar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all"
            >
              <ChevronRight size={16} className="rotate-45" />
            </button>
          )}
        </div>

        {/* Rating Filter */}
        <select
          value={ratingFilter}
          onChange={(e) => {
            setPage(1);
            setRatingFilter(e.target.value);
          }}
          className="bg-[#14141E] border border-white/5 rounded-2xl px-5 py-3 text-white text-sm outline-none hover:border-[#00BFA5]/20 focus:border-[#00BFA5]/40 transition-all duration-300 cursor-pointer appearance-none bg-no-repeat bg-position-[right_1rem_center] bg-size-[1rem]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2300BFA5' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          }}
        >
          <option value="">Semua Rating</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r} className="bg-[#0D0D0D]">{r} Bintang</option>
          ))}
        </select>
      </div>

      {/* ======================== TABLE ======================== */}
      {loading ? (
        <ScreenLoader label="Memuat review..." />
      ) : reviews.length === 0 ? (
        <EmptyState title="Belum ada review" description="Belum ada customer yang memberikan review produk." />
      ) : (
        <div className="bg-[#14141E] border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225">
              <thead>
                <tr className="border-b border-white/5 bg-white/2">
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">No</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Produk</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Rating</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Komentar</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Tanggal</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reviews.map((review, idx) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    index={idx}
                    page={page}
                    limit={limit}
                    onReplySent={getReviews}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================== PAGINATION ======================== */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center gap-2 px-5 py-3 bg-[#14141E] border border-white/5 hover:border-white/20 rounded-2xl text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:text-white active:scale-95"
          >
            <ChevronLeft size={18} />
            Sebelumnya
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-90 ${
                  p === page
                    ? "bg-[#00BFA5] text-black shadow-[0_0_20px_rgba(0,191,165,0.3)]"
                    : "bg-[#14141E] border border-white/5 text-white/50 hover:text-white hover:border-white/20"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="flex items-center gap-2 px-5 py-3 bg-[#14141E] border border-white/5 hover:border-white/20 rounded-2xl text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:text-white active:scale-95"
          >
            Berikutnya
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Subtle background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-[-1]"
        style={{
          backgroundImage: `linear-gradient(#00BFA5 1px, transparent 1px), linear-gradient(90deg, #00BFA5 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
}
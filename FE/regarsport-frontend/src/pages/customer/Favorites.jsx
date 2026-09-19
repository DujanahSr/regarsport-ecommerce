import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Package,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { CardSkeletonList, EmptyState } from "../../components/common/UiStates";

export default function Favorites() {
  const { wishlistItems, loading, removeWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const handleAddToCart = async (item) => {
    try {
      setAddingId(item.productId || item.id);
      await addToCart(
        {
          id: item.productId || item.id,
          name: item.productName || item.products?.name || "Produk",
          price: item.price || item.products?.price || 0,
          imageUrl: item.productImage || item.products?.image_url || "",
        },
        1,
        "L"
      );
    } finally {
      setAddingId(null);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Apakah Anda yakin ingin mengosongkan semua produk dari wishlist?")) {
      try {
        setClearing(true);
        await clearWishlist();
      } finally {
        setClearing(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Header & Breadcrumb */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            <Heart size={14} className="fill-emerald-600" />
            <span>Koleksi Favorit Anda</span>
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Wishlist Saya
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Simpan produk impian dan tambahkan ke keranjang belanja kapan saja saat Anda siap.
          </p>
        </div>

        {wishlistItems.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
              <CheckCircle2 size={13} className="text-emerald-600" />
              {wishlistItems.length} Produk Tersimpan
            </span>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>{clearing ? "Mengosongkan..." : "Kosongkan Wishlist"}</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <CardSkeletonList count={4} />
      ) : wishlistItems.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 shadow-sm text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-8 ring-rose-50/50">
            <Heart size={36} className="fill-rose-500/20 stroke-rose-500 stroke-2" />
          </div>

          <h2 className="mt-6 text-xl font-black text-slate-900 sm:text-2xl">
            Wishlist Anda Masih Kosong
          </h2>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-slate-500">
            Belum ada produk favorit yang disimpan. Temukan jersey sublimasi premium, apparel, dan perlengkapan olahraga terbaik kami sekarang!
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/35"
            >
              <ShoppingBag size={18} />
              <span>Jelajahi Katalog Produk</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistItems.map((item) => {
            const prodId = item.productId || item.product_id || item.products?.id || item.id;
            const name = item.productName || item.products?.name || "Produk";
            const price = Number(item.price || item.products?.price || 0);
            const imageUrl =
              item.productImage ||
              item.products?.image_url ||
              "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";
            const isAdding = addingId === prodId;

            return (
              <div
                key={item.id || prodId}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-900/5 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Product Image */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  <img
                    src={imageUrl}
                    alt={name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";
                    }}
                  />

                  {/* Remove Button in Top-Right */}
                  <button
                    type="button"
                    onClick={() => removeWishlist(prodId)}
                    aria-label="Hapus dari wishlist"
                    title="Hapus dari wishlist"
                    className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-400 backdrop-blur-md shadow-sm transition hover:bg-rose-50 hover:text-rose-600 hover:scale-110 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>

                  <span className="absolute bottom-3 left-3 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-white">
                    RegarSport Official
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <Link
                    to={`/dashboard/product/${prodId}`}
                    className="group-hover:text-emerald-600 transition-colors"
                  >
                    <h2 className="line-clamp-2 font-bold text-slate-900 text-base">
                      {name}
                    </h2>
                  </Link>

                  <p className="mt-2 text-lg font-black text-emerald-600">
                    Rp {price.toLocaleString("id-ID")}
                  </p>

                  <div className="mt-auto pt-4 space-y-2">
                    {/* Instant Add to Cart */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      disabled={isAdding}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-3 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                    >
                      <ShoppingCart size={16} />
                      <span>{isAdding ? "Menambahkan..." : "+ Tambah ke Keranjang"}</span>
                    </button>

                    {/* View Details Link */}
                    <Link
                      to={`/dashboard/product/${prodId}`}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                    >
                      <span>Lihat Detail Produk</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
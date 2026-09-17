import { Link } from "react-router-dom";
import { Heart, HeartOff } from "lucide-react";

import { useWishlist } from "../../context/WishlistContext";
import { CardSkeletonList, EmptyState } from "../../components/common/UiStates";

export default function Favorites() {
  const { wishlistItems, loading, removeWishlist } = useWishlist();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Wishlist Saya
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Produk favorit yang telah Anda simpan
        </p>
      </div>

      {loading ? (
        <CardSkeletonList count={4} />
      ) : wishlistItems.length === 0 ? (
        <EmptyState
          title="Wishlist masih kosong"
          description="Tambahkan produk favorit Anda terlebih dahulu."
          action={
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/30"
            >
              <Heart size={18} />
              Cari Produk
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden bg-slate-100">
                <img
                  src={item.products?.image_url || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80"}
                  alt={item.products?.name || "Produk"}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";
                  }}
                />
              </div>

              <div className="p-4">
                <h2 className="truncate font-bold text-slate-900">{item.products?.name || "Produk"}</h2>

                <p className="mt-2 font-bold text-emerald-600">
                  Rp {Number(item.products?.price || 0).toLocaleString("id-ID")}
                </p>

                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/dashboard/product/${item.products?.id || item.product_id}`}
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/30"
                  >
                    Detail
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeWishlist(item.id)}
                    aria-label="Hapus dari wishlist"
                    className="flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <HeartOff size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
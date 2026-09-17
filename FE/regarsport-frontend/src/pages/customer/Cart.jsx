import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  CheckSquare,
  Square,
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  ArrowRight,
  Package,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import {
  CardSkeletonList,
  EmptyState,
} from "../../components/common/UiStates";

export default function Cart() {
  const {
    cartItems,
    loading,
    removeFromCart,
    increaseQty,
    decreaseQty,
    selectedItems,
    toggleSelectItem,
    selectAllItems,
  } = useCart();

  const total = useMemo(
    () =>
      cartItems
        .filter((item) => selectedItems.includes(item.id))
        .reduce(
          (sum, item) => sum + Number(item.products.price) * item.quantity,
          0
        ),
    [cartItems, selectedItems]
  );

  const isAllSelected =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Keranjang Belanja
          </h1>
          {!loading && cartItems.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {cartItems.length} produk dalam keranjang
            </p>
          )}
        </div>

        {loading ? (
          <CardSkeletonList count={3} />
        ) : cartItems.length === 0 ? (
          <EmptyState
            title="Keranjang masih kosong"
            description="Tambahkan produk ke keranjang untuk melanjutkan checkout."
            action={
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                <ShoppingCart size={16} />
                Belanja Sekarang
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

            {/* Left Column */}
            <div className="space-y-4">

              {/* Select All */}
              <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-900/5 shadow-sm">
                <button
                  type="button"
                  onClick={selectAllItems}
                  className="flex items-center gap-3 transition hover:opacity-75"
                  aria-label={isAllSelected ? "Batal pilih semua" : "Pilih semua produk"}
                >
                  {isAllSelected ? (
                    <CheckSquare size={22} className="text-emerald-600" />
                  ) : (
                    <Square size={22} className="text-slate-400" />
                  )}
                  <span className="text-sm font-semibold text-slate-700">
                    Pilih Semua
                  </span>
                </button>
                <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  {cartItems.length} produk
                </span>
              </div>

              {/* Cart Items */}
              {cartItems.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                const subtotal = Number(item.products.price) * item.quantity;

                return (
                  <div
                    key={item.id}
                    className={`group relative flex gap-4 rounded-2xl bg-white px-5 py-4 ring-1 shadow-sm transition duration-200 hover:shadow-md ${
                      isSelected
                        ? "ring-emerald-500/40"
                        : "ring-slate-900/5"
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(item.id)}
                      className="mt-1 shrink-0 transition hover:opacity-75"
                      aria-label={isSelected ? "Batal pilih" : "Pilih produk"}
                    >
                      {isSelected ? (
                        <CheckSquare size={22} className="text-emerald-600" />
                      ) : (
                        <Square size={22} className="text-slate-400" />
                      )}
                    </button>

                    {/* Image */}
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <img
                        src={item.products.image_url || "https://placehold.co/200x200"}
                        alt={item.products.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between gap-3 min-w-0">
                      <div>
                        <h2 className="line-clamp-2 font-semibold text-slate-900">
                          {item.products.name}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold text-emerald-600">
                            Rp {Number(item.products.price).toLocaleString("id-ID")}
                          </p>
                          {item.size && (
                            <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700 border border-emerald-200/70">
                              Ukuran: {item.size}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <Package size={12} />
                          Stok: {item.products.stock}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Qty Control */}
                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                          <button
                            type="button"
                            onClick={() => decreaseQty(item.id, item.quantity)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-emerald-700 hover:shadow-sm disabled:opacity-40"
                            disabled={item.quantity <= 1}
                            aria-label="Kurangi jumlah"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-7 text-center text-sm font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => increaseQty(item.id, item.quantity)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-emerald-700 hover:shadow-sm disabled:opacity-40"
                            disabled={item.quantity >= item.products.stock}
                            aria-label="Tambah jumlah"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <p className="text-sm font-semibold text-slate-700">
                          Subtotal:{" "}
                          <span className="text-emerald-700">
                            Rp {subtotal.toLocaleString("id-ID")}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                      aria-label="Hapus produk"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right Column — Summary */}
            <div className="h-fit rounded-2xl bg-white ring-1 ring-slate-900/5 shadow-sm lg:sticky lg:top-6">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Ringkasan Belanja
                </h2>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Produk dipilih</span>
                  <span className="font-semibold text-slate-900">
                    {selectedItems.length} item
                  </span>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    Rp {total.toLocaleString("id-ID")}
                  </span>
                </div>

                {selectedItems.length > 0 ? (
                  <Link
                    to="/dashboard/checkout"
                    state={{ selectedItems }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-950 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 hover:gap-3"
                  >
                    Checkout ({selectedItems.length})
                    <ArrowRight size={15} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-2 w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed"
                  >
                    Pilih produk untuk checkout
                  </button>
                )}

                <p className="text-center text-xs text-slate-400">
                  Harga belum termasuk ongkos kirim
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
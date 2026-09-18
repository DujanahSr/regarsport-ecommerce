/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from "react";
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  Plus,
  RefreshCw,
  Layers,
  CheckCircle2,
  X,
  Loader2,
  ArrowUpRight,
  TrendingDown,
  ShieldCheck,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import { useAuth } from "../../context/AuthContext";

export default function Inventory() {
  const { user } = useAuth();
  const isLogistics = user?.role === "logistics";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'low' | 'out'

  // Restock Modal State
  const [restockProduct, setRestockProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [restockQty, setRestockQty] = useState(10);
  const [restocking, setRestocking] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products", {
        params: { page: 1, size: 100, sortBy: "id", sortOrder: "desc" },
      });
      const data = res.data?.data?.content || res.data?.content || [];
      setProducts(data);
    } catch (err) {
      console.error("Gagal memuat inventaris produk:", err);
      toast.error("Gagal memuat data inventaris");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products by search and stock condition
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchSearch =
        !searchQuery.trim() ||
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.category?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      const totalStock = Number(prod.stock || 0);
      if (filterMode === "low") return totalStock > 0 && totalStock <= 10;
      if (filterMode === "out") return totalStock === 0;
      return true;
    });
  }, [products, searchQuery, filterMode]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    let totalItems = products.length;
    let totalStockPcs = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const s = Number(p.stock || 0);
      totalStockPcs += s;
      if (s === 0) outOfStockCount++;
      else if (s <= 10) lowStockCount++;
    });

    return { totalItems, totalStockPcs, lowStockCount, outOfStockCount };
  }, [products]);

  const handleOpenRestock = (product, defaultSize = "") => {
    setRestockProduct(product);
    const sizeKeys = Object.keys(product.sizeStocks || {});
    setSelectedSize(defaultSize || (sizeKeys.length > 0 ? sizeKeys[0] : "L"));
    setRestockQty(10);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProduct) return;
    const qtyChange = Number(restockQty);
    if (!qtyChange || qtyChange <= 0) {
      toast.error("Jumlah stok masuk minimal 1 pcs");
      return;
    }

    try {
      setRestocking(true);
      await api.patch(`/products/${restockProduct.id}/stock`, {
        quantityChange: qtyChange,
        size: selectedSize.trim(),
      });

      toast.success(
        `Berhasil menambah +${qtyChange} pcs stok (${selectedSize}) untuk ${restockProduct.name}`
      );
      setRestockProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menambah stok");
    } finally {
      setRestocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00BFA5]/20 blur-xl rounded-2xl" />
            <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-3 rounded-2xl">
              <Layers size={28} className="text-[#00BFA5]" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-[-1px]">
              INVENTARIS & STOK GUDANG
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              {isLogistics
                ? "Pantau ketersediaan varian ukuran apparel dan lakukan penambahan stok masuk konveksi"
                : "Pengawasan menyeluruh ketersediaan stok fisik produk RegarSport"}
            </p>
          </div>
        </div>

        <button
          onClick={fetchProducts}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all w-fit cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-[#14141E] border border-white/5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Model Produk</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.totalItems} Model</div>
          <div className="text-[11px] text-slate-500 mt-1">Tercatat di sistem katalog</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#14141E] border border-white/5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fisik di Gudang</div>
          <div className="text-2xl sm:text-3xl font-black text-[#00BFA5] mt-1">{stats.totalStockPcs.toLocaleString("id-ID")} pcs</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Ready stock Wonogiri</div>
        </div>

        <div
          onClick={() => setFilterMode(filterMode === "low" ? "all" : "low")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            filterMode === "low"
              ? "bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/20"
              : "bg-[#14141E] border-white/5 hover:border-amber-500/30"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
            <span>Stok Menipis (≤10)</span>
            <AlertTriangle size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{stats.lowStockCount} Model</div>
          <div className="text-[11px] text-amber-300/80 mt-1">Perlu restock segera</div>
        </div>

        <div
          onClick={() => setFilterMode(filterMode === "out" ? "all" : "out")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            filterMode === "out"
              ? "bg-rose-500/20 border-rose-500/50 shadow-lg shadow-rose-500/20"
              : "bg-[#14141E] border-white/5 hover:border-rose-500/30"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-wider">
            <span>Stok Habis (0 pcs)</span>
            <TrendingDown size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">{stats.outOfStockCount} Model</div>
          <div className="text-[11px] text-rose-300/80 mt-1">Barang kosong di rak</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { label: "Semua Produk", value: "all", count: stats.totalItems },
            { label: "Stok Menipis", value: "low", count: stats.lowStockCount, badge: "Perlu Restock" },
            { label: "Stok Habis", value: "out", count: stats.outOfStockCount, badge: "Kosong" },
          ].map((tab) => {
            const isActive = filterMode === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilterMode(tab.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#00BFA5] text-black shadow-lg shadow-[#00BFA5]/25"
                    : "bg-[#14141E] text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? "bg-black/20 text-black font-black" : "bg-white/10 text-slate-300"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[280px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk atau kategori..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#14141E] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00BFA5]"
          />
        </div>
      </div>

      {/* Product Inventory Table / Cards */}
      {loading ? (
        <ScreenLoader />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="Tidak Ada Produk Ditemukan"
          description="Tidak ada data stok yang sesuai dengan filter atau kata kunci pencarian Anda."
        />
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const sizeStocks = product.sizeStocks || {};
            const totalStock = Number(product.stock || 0);
            const isOutOfStock = totalStock === 0;
            const isLowStock = totalStock > 0 && totalStock <= 10;

            return (
              <div
                key={product.id}
                className="p-5 rounded-2xl bg-[#14141E] border border-white/5 hover:border-white/15 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Product Info */}
                <div className="flex items-center gap-4 min-w-[280px]">
                  <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0">
                    <img
                      src={product.imageUrl || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=200&q=80"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {product.category?.name || "Apparel"}
                    </span>
                    <h3 className="text-base font-bold text-white line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black text-[#00BFA5]">
                        Rp {Number(product.price || 0).toLocaleString("id-ID")}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">SKU #{product.id}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Size Breakdown Pills */}
                <div className="flex-1">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                    <span>Rincian Stok Varian Ukuran:</span>
                    <span className="text-[10px] text-slate-500">Klik tombol restock untuk menambah</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(sizeStocks).length > 0 ? (
                      Object.entries(sizeStocks).map(([sizeName, qty]) => {
                        const q = Number(qty || 0);
                        const isSizeOut = q === 0;
                        const isSizeLow = q > 0 && q <= 3;
                        return (
                          <div
                            key={sizeName}
                            onClick={() => handleOpenRestock(product, sizeName)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all hover:scale-105 ${
                              isSizeOut
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                : isSizeLow
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                : "bg-white/5 border-white/10 text-slate-200"
                            }`}
                            title={`Klik untuk restock ukuran ${sizeName}`}
                          >
                            <span className="font-bold">{sizeName}:</span>
                            <span className="font-mono font-black">{q} pcs</span>
                            <Plus size={12} className="opacity-60 hover:opacity-100" />
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-500 italic">Varian All Size ({totalStock} pcs)</span>
                    )}
                  </div>
                </div>

                {/* Right: Total Stock Badge & Quick Action Button */}
                <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Stok Fisik</div>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          isOutOfStock ? "bg-rose-500 animate-pulse" : isLowStock ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                      />
                      <span
                        className={`text-lg font-black ${
                          isOutOfStock ? "text-rose-400" : isLowStock ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {totalStock} pcs
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRestock(product)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00BFA5] text-black font-extrabold text-xs tracking-wider uppercase hover:shadow-lg hover:shadow-[#00BFA5]/25 hover:scale-105 transition-all cursor-pointer"
                  >
                    <Plus size={16} strokeWidth={3} />
                    <span>Restock</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK RESTOCK MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-[#14141E] border border-white/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#00BFA5]/10 p-2 rounded-lg text-[#00BFA5]">
                  <Plus size={18} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tambah Stok Masuk Konveksi</h3>
                  <p className="text-[11px] text-slate-400">Penerimaan barang dari pabrik RegarSport</p>
                </div>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <img
                  src={restockProduct.imageUrl || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=120&q=80"}
                  alt={restockProduct.name}
                  className="w-12 h-12 rounded-lg object-cover bg-black/40"
                />
                <div>
                  <div className="text-xs font-bold text-white line-clamp-1">{restockProduct.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Sisa stok saat ini: <strong className="text-white">{restockProduct.stock} pcs</strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Pilih Varian Ukuran Masuk
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00BFA5]"
                >
                  {Object.keys(restockProduct.sizeStocks || {}).length > 0 ? (
                    Object.entries(restockProduct.sizeStocks).map(([size, qty]) => (
                      <option key={size} value={size}>
                        Ukuran {size} (Saat ini: {qty} pcs)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="S">Ukuran S</option>
                      <option value="M">Ukuran M</option>
                      <option value="L">Ukuran L</option>
                      <option value="XL">Ukuran XL</option>
                      <option value="XXL">Ukuran XXL</option>
                      <option value="All Size">All Size</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Jumlah Barang Masuk (+ pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/10 text-sm font-bold text-white focus:outline-none focus:border-[#00BFA5]"
                  placeholder="Contoh: 10, 25, 50"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={restocking}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00BFA5] text-black font-extrabold text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-[#00BFA5]/25 disabled:opacity-50 cursor-pointer"
                >
                  {restocking && <Loader2 size={14} className="animate-spin" />}
                  <span>Simpan Stok Masuk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

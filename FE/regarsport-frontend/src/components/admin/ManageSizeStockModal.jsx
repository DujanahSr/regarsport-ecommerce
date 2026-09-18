import { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Package, Check, AlertTriangle } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function ManageSizeStockModal({ product, onClose, onStockUpdated }) {
  const [sizeStocks, setSizeStocks] = useState({});
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeQty, setNewSizeQty] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      if (product.sizeStocks && Object.keys(product.sizeStocks).length > 0) {
        setSizeStocks({ ...product.sizeStocks });
      } else {
        // Fallback default sizes if none yet
        const defaultSizes = {
          S: 10,
          M: 20,
          L: 20,
          XL: 15,
          XXL: 10,
        };
        setSizeStocks(defaultSizes);
      }
    }
  }, [product]);

  if (!product) return null;

  const totalStock = Object.values(sizeStocks).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

  const handleStockChange = (size, value) => {
    const val = Math.max(0, parseInt(value, 10) || 0);
    setSizeStocks((prev) => ({
      ...prev,
      [size]: val,
    }));
  };

  const handleQuickAdjust = (size, delta) => {
    setSizeStocks((prev) => {
      const current = prev[size] || 0;
      const updated = Math.max(0, current + delta);
      return {
        ...prev,
        [size]: updated,
      };
    });
  };

  const handleAddSize = (e) => {
    e.preventDefault();
    const clean = newSizeName.trim().toUpperCase();
    if (!clean) {
      toast.error("Nama ukuran tidak boleh kosong");
      return;
    }
    if (sizeStocks[clean] !== undefined) {
      toast.error(`Ukuran ${clean} sudah ada dalam daftar`);
      return;
    }
    setSizeStocks((prev) => ({
      ...prev,
      [clean]: Math.max(0, Number(newSizeQty) || 0),
    }));
    setNewSizeName("");
    setNewSizeQty(10);
    toast.success(`Ukuran ${clean} ditambahkan`);
  };

  const handleDeleteSize = (size) => {
    if (Object.keys(sizeStocks).length <= 1) {
      toast.error("Minimal produk harus memiliki 1 ukuran");
      return;
    }
    setSizeStocks((prev) => {
      const next = { ...prev };
      delete next[size];
      return next;
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Update product with full sizeStocks payload
      await api.put(`/products/${product.id}`, {
        categoryId: product.categoryId || product.category_id || product.category?.id || 1,
        name: product.name,
        description: product.description || "",
        price: product.price,
        stock: totalStock,
        imageUrl: product.image_url || product.imageUrl || "",
        sizeStocks: sizeStocks,
      });

      toast.success(`Stok per ukuran untuk "${product.name}" berhasil diperbarui!`);
      if (onStockUpdated) {
        onStockUpdated({
          ...product,
          stock: totalStock,
          sizeStocks: sizeStocks,
        });
      }
      onClose();
    } catch (error) {
      console.error("Gagal memperbarui stok ukuran:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan kuota stok ukuran");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#12121A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00BFA5]/10 border border-[#00BFA5]/30 text-[#00BFA5]">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-snug truncate max-w-sm">
                Manajemen Stok Ukuran
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-sm">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Summary Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#00BFA5]/10 via-[#00BFA5]/5 to-transparent border border-[#00BFA5]/20">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Akumulasi Stok</p>
              <p className="text-2xl font-black text-white">{totalStock} <span className="text-xs text-[#00BFA5] font-semibold">pcs</span></p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-[#00BFA5]/20 text-[#00BFA5] font-bold border border-[#00BFA5]/30">
              {Object.keys(sizeStocks).length} Varian Ukuran
            </span>
          </div>

          {/* Size Stocks Table / List */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Daftar Ukuran & Penyesuaian Stok
            </label>
            <div className="space-y-2.5">
              {Object.entries(sizeStocks).map(([size, qty]) => {
                const numQty = Number(qty) || 0;
                let stockStatus = {
                  label: "Aman",
                  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
                };
                if (numQty === 0) {
                  stockStatus = {
                    label: "Habis",
                    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
                  };
                } else if (numQty < 5) {
                  stockStatus = {
                    label: "Menipis",
                    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
                  };
                }

                return (
                  <div
                    key={size}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-white/3 border border-white/5 hover:border-white/15 transition-all gap-3"
                  >
                    {/* Size Label & Status */}
                    <div className="flex items-center gap-3 min-w-32">
                      <div className="w-10 h-10 rounded-xl bg-[#00BFA5]/10 border border-[#00BFA5]/30 flex items-center justify-center font-black text-white text-sm">
                        {size}
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </div>
                    </div>

                    {/* Stock Quick Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(size, -5)}
                        className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition cursor-pointer"
                        title="Kurangi 5"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(size, -1)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold text-slate-300 transition flex items-center justify-center cursor-pointer"
                        title="Kurangi 1"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => handleStockChange(size, e.target.value)}
                        className="w-16 h-8 text-center bg-[#0C0C14] border border-white/10 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-[#00BFA5] transition [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(size, 1)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold text-slate-300 transition flex items-center justify-center cursor-pointer"
                        title="Tambah 1"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(size, 5)}
                        className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition cursor-pointer"
                        title="Tambah 5"
                      >
                        +5
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSize(size)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition ml-1 cursor-pointer"
                        title="Hapus ukuran ini"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Custom Size Form */}
          <form onSubmit={handleAddSize} className="p-4 rounded-2xl bg-white/2 border border-dashed border-white/10 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Ukuran baru (misal: 3XL, 46)..."
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                className="w-full bg-[#0C0C14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00BFA5]"
              />
            </div>
            <div className="w-full sm:w-28">
              <input
                type="number"
                min="0"
                placeholder="Stok"
                value={newSizeQty}
                onChange={(e) => setNewSizeQty(e.target.value)}
                className="w-full bg-[#0C0C14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white text-center focus:outline-none focus:border-[#00BFA5]"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-white/5 hover:bg-[#00BFA5]/20 hover:text-[#00BFA5] border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer shrink-0"
            >
              <Plus size={14} />
              Tambah Ukuran
            </button>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between bg-white/2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-semibold transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-[#00BFA5] hover:bg-[#00BFA5]/90 text-black px-6 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(0,191,165,0.25)] transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} />
                Simpan Perubahan Stok
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

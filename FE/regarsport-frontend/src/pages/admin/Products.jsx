/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Package, Upload, Sparkles } from "lucide-react";
import api from "../../services/api";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";
import toast from "react-hot-toast";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [image, setImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const searchTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    category_id: "",
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  const getProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products", {
        params: {
          search: debouncedSearch || undefined,
          categoryId: categoryFilter || undefined,
          page,
          size: 12,
        },
      });
      const pageData = res.data?.data || res.data;
      const list = Array.isArray(pageData?.content)
        ? pageData.content
        : Array.isArray(pageData)
        ? pageData
        : [];
      const normalized = list.map((p) => ({
        ...p,
        image_url: p.imageUrl || p.image_url || "",
        category: {
          id: p.categoryId || p.category_id,
          name: p.categoryName || p.category?.name || "Kategori",
        },
      }));
      setProducts(normalized);
      setTotalPages(pageData?.totalPages || 1);
    } catch (error) {
      console.error(error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategories = async () => {
    try {
      const res = await api.get("/categories");
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setCategories(list);
    } catch (error) {
      console.error(error);
      setCategories([]);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [search]);

  useEffect(() => {
    getProducts();
  }, [debouncedSearch, categoryFilter, page]);

  // Image preview
  useEffect(() => {
    if (!image) {
      setImagePreview(currentImageUrl);
      return;
    }
    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [image, currentImageUrl]);

  const resetForm = () => {
    setForm({ category_id: "", name: "", description: "", price: "", stock: "" });
    setImage(null);
    setCurrentImageUrl("");
    setImagePreview("");
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error("Nama dan harga wajib diisi");
      return;
    }
    setSubmitting(true);
    let toastId = null;
    try {
      let imageUrl = "";
      if (image) {
        toastId = toast.loading("Mengunggah foto ke Cloudinary...");
        const formData = new FormData();
        formData.append("image", image);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data?.image_url || uploadRes.data?.data?.imageUrl || "";
      }
      await api.post("/products", {
        categoryId: Number(form.category_id) || (categories[0]?.id || 1),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        imageUrl: imageUrl || "https://placehold.co/600x400?text=Jersey",
      });
      if (toastId) toast.dismiss(toastId);
      toast.success("Produk berhasil ditambahkan");
      resetForm();
      getProducts();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error(error.response?.data?.message || "Gagal menambahkan produk");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    const img = product.image_url || product.imageUrl || "";
    setCurrentImageUrl(img);
    setImagePreview(img);
    setForm({
      category_id: product.categoryId || product.category_id || product.category?.id || "",
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
    });
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Otomatis scroll mulus ke atas formulir agar admin langsung melihat form edit
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async () => {
    if (!form.name.trim() || !form.price) {
      toast.error("Nama dan harga wajib diisi");
      return;
    }
    setSubmitting(true);
    let toastId = null;
    try {
      let imageUrl = currentImageUrl;
      if (image) {
        toastId = toast.loading("Mengunggah gambar baru ke Cloudinary...");
        const formData = new FormData();
        formData.append("image", image);
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data?.image_url || uploadRes.data?.data?.imageUrl || imageUrl;
      }
      await api.put(`/products/${editingId}`, {
        categoryId: Number(form.category_id) || (categories[0]?.id || 1),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        imageUrl: imageUrl || "https://placehold.co/600x400?text=Jersey",
      });
      if (toastId) toast.dismiss(toastId);
      toast.success("Produk & gambar berhasil diperbarui");
      resetForm();
      getProducts();
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error(error.response?.data?.message || "Gagal mengupdate produk");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus produk ini?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Produk dihapus");
      getProducts();
    } catch (error) {
      toast.error("Gagal menghapus produk");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="relative">
          <div className="absolute inset-0 bg-[#00BFA5]/20 blur-xl rounded-2xl" />
          <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-3 rounded-2xl">
            <Package size={28} className="text-[#00BFA5]" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-[-1px]">PRODUCTS</h1>
          <p className="text-[#2a3a3a] text-sm">Kelola produk dengan pencarian dan pagination</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3 bg-[#14141E] border border-white/5 rounded-2xl px-5 py-3 flex-1 md:max-w-md hover:border-[#00BFA5]/20 transition-all duration-300 group">
          <Search size={20} className="text-white/30 group-hover:text-[#00BFA5]/60 transition-colors duration-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setPage(1);
            setCategoryFilter(e.target.value);
          }}
          className="bg-[#14141E] border border-white/5 rounded-2xl px-5 py-3 text-white text-sm outline-none hover:border-[#00BFA5]/20 focus:border-[#00BFA5]/40 transition-all duration-300 cursor-pointer appearance-none bg-no-repeat bg-position-[right_1rem_center] bg-size-[1rem]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2300BFA5' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          }}
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id} className="bg-[#0D0D0D]">
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Form Card */}
      <div className="bg-[#14141E] border border-white/5 rounded-3xl p-8 mb-10">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
          {editingId ? (
            <>
              <Sparkles size={20} className="text-[#00BFA5]" />
              Edit Produk
            </>
          ) : (
            <>
              <Plus size={20} className="text-[#00BFA5]" />
              Tambah Produk Baru
            </>
          )}
          <div className="h-px flex-1 bg-white/10" />
          {editingId && (
            <span className="text-xs font-mono text-[#00BFA5]/60">ID: #{editingId}</span>
          )}
        </h2>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Baris 1: Nama, Kategori, Harga, Stok */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Nama Produk */}
            <div className="md:col-span-5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Nama Produk
              </label>
              <input
                type="text"
                placeholder="Contoh: Sepatu Running Pro X"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00BFA5]/60 transition-all duration-300"
              />
            </div>

            {/* Kategori */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Kategori
              </label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#00BFA5]/60 transition-all duration-300 cursor-pointer"
              >
                <option value="">Pilih</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0D0D0D]">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Harga */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Harga (Rp)
              </label>
              <input
                type="number"
                placeholder="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00BFA5]/60 transition-all duration-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Stok */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Stok
              </label>
              <input
                type="number"
                placeholder="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00BFA5]/60 transition-all duration-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Baris 2: Deskripsi & Upload Gambar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Deskripsi */}
            <div className="md:col-span-7">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                Deskripsi
              </label>
              <textarea
                placeholder="Deskripsi produk..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00BFA5]/60 transition-all duration-300 resize-none"
              />
            </div>

            {/* Upload / Ganti Gambar */}
            <div className="md:col-span-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
                  {editingId ? "Ganti Gambar Produk" : "Gambar Produk"}
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setCurrentImageUrl("");
                      setImagePreview("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 font-medium transition cursor-pointer"
                  >
                    Hapus Gambar
                  </button>
                )}
              </div>

              {imagePreview ? (
                <div className="relative border border-white/10 rounded-2xl p-2.5 bg-[#0C0C16] flex items-center gap-4 h-31">
                  <div className="w-24 h-full rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/5 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80";
                      }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-1.5 pr-2">
                    <p className="text-xs text-slate-300 font-medium truncate max-w-48">
                      {image ? image.name : "Foto produk terpilih"}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-fit flex items-center gap-1.5 bg-white/5 hover:bg-[#00BFA5]/20 hover:text-[#00BFA5] border border-white/10 px-3 py-1.5 rounded-xl text-xs text-white/80 font-medium transition active:scale-95 cursor-pointer"
                    >
                      <Upload size={13} />
                      Pilih Foto Lain
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border border-dashed border-white/20 hover:border-[#00BFA5]/50 rounded-2xl h-31 cursor-pointer transition-all duration-300 group bg-white/1 hover:bg-white/3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-1.5 group-hover:bg-[#00BFA5]/10 transition-all duration-300 group-hover:scale-110">
                    <Upload size={20} className="text-slate-400 group-hover:text-[#00BFA5] transition-colors duration-300" />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                    Klik untuk upload gambar baru
                  </span>
                  <span className="text-[10px] text-slate-600">
                    Format JPG, PNG, WEBP (Maksimal 10MB)
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setImage(file);
                }}
                className="hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            {editingId ? (
              <>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="flex-1 bg-[#00BFA5] hover:bg-[#00BFA5]/90 disabled:opacity-70 text-black font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,191,165,0.2)] active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Pencil size={18} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-4 border border-white/10 hover:bg-white/5 rounded-2xl transition-all duration-300 text-white/60 hover:text-white"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={submitting || !form.name.trim() || !form.price}
                className="flex-1 bg-[#00BFA5] hover:bg-[#00BFA5]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,191,165,0.2)] active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menambahkan...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Tambah Produk
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product Grid */}
      {loading ? (
        <ScreenLoader label="Memuat produk..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="Produk belum ditemukan"
          description="Coba ubah kata kunci pencarian atau tambahkan produk baru."
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">
              Menampilkan <span className="text-white font-semibold">{products.length}</span> produk
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-[#14141E] border border-white/5 rounded-3xl overflow-hidden hover:border-[#00BFA5]/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,191,165,0.08)]"
              >
                {/* Image Container */}
                <div className="relative aspect-square bg-[#0C0C16] overflow-hidden">
                  <img
                    src={product.image_url || "https://placehold.co/400x400/1a1a2a/4a5a5a?text=No+Image"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-linear-to-t from-[#0D0D0D] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Quick actions overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#14141E]/90 backdrop-blur-sm hover:bg-blue-500/90 text-blue-400 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border border-white/10 hover:border-blue-400/50"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#14141E]/90 backdrop-blur-sm hover:bg-red-500/90 text-red-400 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border border-white/10 hover:border-red-400/50"
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>

                  {/* Category Badge */}
                  {product.category?.name && (
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#00BFA5]/10 text-[#00BFA5] border border-[#00BFA5]/20 backdrop-blur-sm">
                        {product.category.name}
                      </span>
                    </div>
                  )}

                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm border ${product.stock > 10
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : product.stock > 0
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                      {product.stock > 0 ? `${product.stock} stok` : "Habis"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-white font-bold text-base truncate group-hover:text-[#00BFA5] transition-colors duration-300">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-[#00BFA5] font-black text-xl tracking-tight">
                        Rp {Number(product.price).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">
                      #{product.id}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center gap-2 px-5 py-3 bg-[#14141E] border border-white/5 hover:border-white/20 rounded-2xl text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:text-white active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Sebelumnya
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-90 ${p === page
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Subtle background grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-[-1]"
        style={{
          backgroundImage: `linear-gradient(#00BFA5 1px, transparent 1px), linear-gradient(90deg, #00BFA5 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />
    </div>
  );
}
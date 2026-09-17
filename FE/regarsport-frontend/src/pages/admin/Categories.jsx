/* eslint-disable react-hooks/set-state-in-effect */
// FRONTEND/src/pages/admin/Categories.jsx

import { useEffect, useState } from "react";
import api from "../../services/api";
import { FolderTree, Plus, Edit, Trash2, X, Image as ImageIcon, Upload } from "lucide-react";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [image, setImage] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

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
    setForm({ name: "" });
    setImage(null);
    setCurrentImageUrl("");
    setImagePreview("");
    setEditingId(null);
  };

  const uploadCategoryImage = async () => {
    if (!image) return currentImageUrl;
    const formData = new FormData();
    formData.append("image", image);
    formData.append("bucket", "categories");
    try {
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return uploadRes.data?.image_url || "";
    } catch {
      return "";
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const imageUrl = await uploadCategoryImage();
      await api.post("/categories", {
        name: form.name.trim(),
        imageUrl: imageUrl || "https://placehold.co/400x400?text=Category",
      });
      resetForm();
      getCategories();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const imageUrl = await uploadCategoryImage();
      await api.put(`/categories/${editingId}`, {
        name: form.name.trim(),
        imageUrl: imageUrl || "https://placehold.co/400x400?text=Category",
      });
      resetForm();
      getCategories();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({ name: category.name || "" });
    setCurrentImageUrl(category.imageUrl || category.image_url || "");
    setImage(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus kategori ini?")) return;
    try {
      await api.delete(`/categories/${id}`);
      getCategories();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="relative">
          <div className="absolute inset-0 bg-[#00BFA5]/20 blur-xl rounded-2xl" />
          <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-3 rounded-2xl">
            <FolderTree size={28} className="text-[#00BFA5]" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-[-1px]">CATEGORIES</h1>
          <p className="text-[#2a3a3a] text-sm">Kelola kategori produk RegarSport</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-[#14141E] border border-white/5 rounded-3xl p-8 mb-10">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
          {editingId ? "Edit Category" : "Tambah Category Baru"}
          <div className="h-px flex-1 bg-white/10" />
        </h2>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Name Input */}
            <div className="md:col-span-7">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                NAMA KATEGORI
              </label>
              <input
                type="text"
                placeholder="Contoh: Sepatu Basket, Raket Badminton"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00BFA5]/60 transition-all"
              />
            </div>

            {/* Image Upload */}
            <div className="md:col-span-5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                GAMBAR KATEGORI
              </label>
              <label className="flex flex-col items-center justify-center border border-dashed border-white/20 hover:border-[#00BFA5]/50 rounded-2xl h-36 cursor-pointer transition-colors group">
                {imagePreview ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-32 rounded-xl object-cover border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setImage(null); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[#00BFA5]/10 transition-colors">
                      <Upload size={24} className="text-slate-400 group-hover:text-[#00BFA5]" />
                    </div>
                    <span className="text-sm text-slate-400">Klik untuk upload gambar</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {editingId ? (
              <>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 bg-[#00BFA5] hover:bg-[#00BFA5]/90 disabled:opacity-70 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? "Memperbarui..." : "Simpan Perubahan"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-4 border border-white/10 hover:bg-white/5 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={loading || !form.name.trim()}
                className="flex-1 bg-[#00BFA5] hover:bg-[#00BFA5]/90 disabled:opacity-70 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                {loading ? "Menambahkan..." : "Tambah Kategori"}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Categories Table */}
      <div className="bg-[#14141E] border border-white/5 rounded-3xl overflow-hidden">
        <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white">Daftar Kategori</h3>
          <span className="text-xs text-slate-400 font-mono">{categories.length} kategori</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
                <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Image</th>
                <th className="p-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Kategori</th>
                <th className="p-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-5 text-sm text-slate-400 font-mono">#{category.id}</td>
                    <td className="p-5">
                      {(category.imageUrl || category.image_url) ? (
                        <img
                          src={category.imageUrl || category.image_url}
                          alt={category.name}
                          className="w-14 h-14 object-cover rounded-2xl border border-white/10"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
                          <ImageIcon size={20} className="text-slate-500" />
                        </div>
                      )}
                    </td>
                    <td className="p-5 text-white font-medium">{category.name}</td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-3 hover:bg-white/5 rounded-xl text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-3 hover:bg-white/5 rounded-xl text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="mx-auto w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                      <FolderTree size={32} className="text-slate-500" />
                    </div>
                    <p className="text-slate-400">Belum ada kategori</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
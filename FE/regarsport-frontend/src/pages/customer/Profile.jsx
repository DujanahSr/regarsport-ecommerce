/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Calendar, Camera, Mail, RotateCcw, Save, User } from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";

export default function Profile() {
  const { user, setUser, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ full_name: "" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [avatarError, setAvatarError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || "" });
      setPreview(user.avatar_url || "");
      setLoading(false);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!image) {
      setPreview(user?.avatar_url || "");
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image, user?.avatar_url]);

  const onSelectImage = (file) => {
    if (!file) {
      setImage(null);
      setAvatarError(false);
      return;
    }

    const isImage = file.type.startsWith("image/");
    const maxSize = 2 * 1024 * 1024;

    if (!isImage) {
      toast.error("File harus berupa gambar");
      return;
    }

    if (file.size > maxSize) {
      toast.error("Ukuran gambar maksimal 2MB");
      return;
    }

    setAvatarError(false);
    setImage(file);
  };

  const uploadAvatar = async () => {
    if (!image) {
      return user?.avatar_url || "";
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("bucket", "profiles");

    const uploadRes = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return uploadRes.data?.image_url || uploadRes.data?.data?.imageUrl || user?.avatar_url || "";
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }

    try {
      setSaving(true);
      const avatar_url = await uploadAvatar();

      const res = await api.put("/auth/profile", {
        fullName: form.full_name.trim(),
        full_name: form.full_name.trim(),
        avatarUrl: avatar_url,
        avatar_url,
      });

      const updatedUser = res.data?.data || res.data?.user || res.data;
      setUser(updatedUser);
      setPreview(avatar_url || updatedUser?.avatarUrl || updatedUser?.avatar_url || "");
      toast.success("Profil berhasil diperbarui");
      setImage(null);
    } catch (error) {
      const message = error.response?.data?.message || "Gagal menyimpan profil";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ full_name: user?.full_name || "" });
    setImage(null);
    setPreview(user?.avatar_url || "");
    setAvatarError(false);
  };

  if (authLoading || loading) {
    return <ScreenLoader label="Memuat profil..." />;
  }

  if (!user) {
    return (
      <EmptyState
        title="Profil tidak tersedia"
        description="Silakan login ulang untuk melihat profil Anda."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
          <div className="group mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-200">
            {preview && !avatarError ? (
              <img
                src={preview}
                alt={user.full_name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="text-4xl font-black text-slate-400">
                {user.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>

          <div className="mt-4 text-center">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                user.role === "admin" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {user.role}
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{user.full_name}</h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-slate-500">
              <Mail size={14} />
              {user.email}
            </p>
          </div>

          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <p className="flex items-center gap-1.5 text-slate-500">
              <Calendar size={14} />
              Bergabung:
              <span className="font-medium text-slate-700">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "-"}
              </span>
            </p>
          </div>
        </section>

        <form
          onSubmit={handleSave}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 md:p-8"
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit Profil</h2>
          <p className="mt-1 text-sm text-slate-500">
            Perbarui nama dan foto profil Anda. Perubahan hanya bisa dilakukan oleh akun yang sedang
            login.
          </p>

          <div className="mt-6">
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <User size={14} className="text-emerald-600" />
              Nama Lengkap
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ full_name: e.target.value })}
              placeholder="Nama lengkap"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Mail size={14} className="text-emerald-600" />
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Camera size={14} className="text-emerald-600" />
              Upload Foto Profil
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onSelectImage(e.target.files?.[0] || null)}
              className="w-full cursor-pointer rounded-xl border border-slate-200 p-3 text-sm text-slate-600 transition file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700 hover:border-emerald-200"
            />
            <p className="mt-2 text-xs text-slate-500">Format gambar, maksimal 2MB.</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
            >
              <Save size={16} />
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
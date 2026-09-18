/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Calendar,
  Camera,
  Mail,
  RotateCcw,
  Save,
  User,
  Phone,
  MapPin,
  Building2,
  Lock,
  KeyRound,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  Truck,
  Package,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Check,
  Clock,
  Trash2,
  FileText,
  Cloud,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { EmptyState, ScreenLoader } from "../../components/common/UiStates";

export default function Profile() {
  const { user, setUser, loading: authLoading } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Active Tab: "info" | "security" | "activity"
  const [activeTab, setActiveTab] = useState("info");

  // Profile Form State
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    city: "",
    postalCode: "",
    bio: "",
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password Visibility States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar State
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [avatarError, setAvatarError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Loading & Saving States
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Dynamic Role Stats
  const [roleStats, setRoleStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    activeOrders: 0,
    completedOrders: 0,
    recentOrders: [],
    warehousePending: 0,
    warehouseShipped: 0,
    adminRevenue: 0,
    adminTotalOrders: 0,
    adminTotalUsers: 0,
  });

  // Initialize form from user context
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || user.full_name || "",
        phoneNumber: user.phoneNumber || user.phone_number || "",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || user.postal_code || "",
        bio: user.bio || "",
      });
      setPreviewUrl(user.avatarUrl || user.avatar_url || "");
    }
  }, [user]);

  // Handle local image file preview
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(user?.avatarUrl || user?.avatar_url || "");
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, user?.avatarUrl, user?.avatar_url]);

  // Fetch role-specific statistics
  useEffect(() => {
    if (!user) return;

    const fetchRoleData = async () => {
      setLoadingStats(true);
      try {
        if (user.role === "customer") {
          const res = await api.get("/orders/my-orders?page=1&size=20").catch(() => null);
          if (res?.data?.data) {
            const orders = res.data.data.content || res.data.data.items || [];
            const totalElements = res.data.data.totalElements || orders.length;

            const spent = orders
              .filter((o) => ["PAID", "SHIPPED", "COMPLETED"].includes(o.status))
              .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

            const active = orders.filter((o) =>
              ["PENDING", "PAID", "SHIPPED"].includes(o.status)
            ).length;

            const completed = orders.filter((o) => o.status === "COMPLETED").length;

            setRoleStats((prev) => ({
              ...prev,
              totalOrders: totalElements,
              totalSpent: spent,
              activeOrders: active,
              completedOrders: completed,
              recentOrders: orders.slice(0, 3),
            }));
          }
        } else if (user.role === "logistics") {
          const res = await api.get("/orders?page=1&size=50").catch(() => null);
          if (res?.data?.data) {
            const orders = res.data.data.content || res.data.data.items || [];
            const pendingPack = orders.filter((o) => o.status === "PAID").length;
            const inTransit = orders.filter((o) => o.status === "SHIPPED").length;
            const completed = orders.filter((o) => o.status === "COMPLETED").length;

            setRoleStats((prev) => ({
              ...prev,
              warehousePending: pendingPack,
              warehouseShipped: inTransit,
              completedOrders: completed,
              recentOrders: orders.slice(0, 4),
            }));
          }
        } else if (user.role === "admin") {
          const [dashRes, usersRes] = await Promise.all([
            api.get("/orders/admin/dashboard").catch(() => null),
            api.get("/admin/users/stats").catch(() => null),
          ]);

          const dashData = dashRes?.data?.data || {};
          const usersData = usersRes?.data?.data || {};

          setRoleStats((prev) => ({
            ...prev,
            adminRevenue: dashData.totalRevenue || 0,
            adminTotalOrders: dashData.totalOrders || 0,
            adminTotalUsers: usersData.totalUsers || 0,
            warehousePending: dashData.paidOrders || 0,
            warehouseShipped: dashData.shippedOrders || 0,
          }));
        }
      } catch (err) {
        console.warn("Could not load stats for profile:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchRoleData();
  }, [user]);

  // Image selection handler - Otomatis upload ke Cloudinary dan simpan ke database secara instan!
  const handleSelectImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setAvatarError(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setImageFile(file);

    try {
      setUploadingAvatar(true);
      toast.loading("Mengunggah foto ke Cloudinary...", { id: "avatar-action" });
      const cdnUrl = await uploadAvatarToCloudinary(file);

      const payload = {
        fullName: (form.fullName || user?.fullName || user?.full_name || "User").trim(),
        avatarUrl: cdnUrl,
        phoneNumber: form.phoneNumber || user?.phoneNumber || "",
        address: form.address || user?.address || "",
        city: form.city || user?.city || "",
        postalCode: form.postalCode || user?.postalCode || "",
        bio: form.bio || user?.bio || "",
      };

      const res = await api.put("/auth/profile", payload);
      const updatedUser = res.data?.data || res.data?.user || res.data;

      setUser(updatedUser);
      setPreviewUrl(cdnUrl);
      setImageFile(null);
      toast.success("Foto profil berhasil diunggah ke Cloudinary dan disimpan!", { id: "avatar-action" });
    } catch (err) {
      console.error("Auto upload avatar error:", err);
      const msg = err.response?.data?.message || err.message || "Gagal mengunggah foto profil";
      toast.error(msg, { id: "avatar-action" });
      setPreviewUrl(user?.avatarUrl || user?.avatar_url || "");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Upload avatar to Cloudinary
  const uploadAvatarToCloudinary = async (fileToUpload) => {
    if (!fileToUpload) return user?.avatarUrl || user?.avatar_url || "";

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("image", fileToUpload);
    formData.append("folder", "regarstore/avatars");

    setUploadingAvatar(true);
    try {
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const cdnUrl =
        uploadRes.data?.image_url ||
        uploadRes.data?.data?.imageUrl ||
        uploadRes.data?.url;

      if (!cdnUrl) {
        throw new Error("Gagal menerima URL dari Cloudinary CDN");
      }
      return cdnUrl;
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus foto profil ini?")) return;

    try {
      setSavingProfile(true);
      toast.loading("Menghapus foto profil...", { id: "avatar-action" });
      const res = await api.put("/auth/profile", {
        fullName: (form.fullName || user?.fullName || user?.full_name || "User").trim(),
        avatarUrl: "",
        phoneNumber: form.phoneNumber || user?.phoneNumber || "",
        address: form.address || user?.address || "",
        city: form.city || user?.city || "",
        postalCode: form.postalCode || user?.postalCode || "",
        bio: form.bio || user?.bio || "",
      });

      const updated = res.data?.data || res.data?.user || res.data;
      setUser({ ...updated, avatarUrl: "", avatar_url: "" });
      setImageFile(null);
      setPreviewUrl("");
      toast.success("Foto profil berhasil dihapus", { id: "avatar-action" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus foto profil", { id: "avatar-action" });
    } finally {
      setSavingProfile(false);
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      toast.error("Nama lengkap tidak boleh kosong");
      return;
    }

    if (form.phoneNumber.trim()) {
      const cleanPhone = form.phoneNumber.trim().replace(/[-\s]/g, "");
      if (!/^08\d{8,12}$/.test(cleanPhone)) {
        toast.error("Nomor HP/WA harus diawali 08 dan memiliki 10-13 digit angka");
        return;
      }
    }

    if (form.postalCode.trim() && !/^\d{5}$/.test(form.postalCode.trim())) {
      toast.error("Kode pos harus berupa 5 digit angka (contoh: 57612)");
      return;
    }

    try {
      setSavingProfile(true);

      let avatarUrl = user?.avatarUrl || user?.avatar_url || "";
      if (imageFile) {
        avatarUrl = await uploadAvatarToCloudinary(imageFile);
      }

      const payload = {
        fullName: form.fullName.trim(),
        avatarUrl: avatarUrl || "",
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        bio: form.bio.trim(),
      };

      const res = await api.put("/auth/profile", payload);
      const updatedUser = res.data?.data || res.data?.user || res.data;

      setUser(updatedUser);
      setImageFile(null);
      setPreviewUrl(avatarUrl);
      toast.success("Profil berhasil diperbarui!");
    } catch (error) {
      console.error("Save profile error:", error);
      const msg = error.response?.data?.message || error.message || "Gagal memperbarui profil";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Reset Profile Form
  const handleResetProfile = () => {
    if (user) {
      setForm({
        fullName: user.fullName || user.full_name || "",
        phoneNumber: user.phoneNumber || user.phone_number || "",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || user.postal_code || "",
        bio: user.bio || "",
      });
      setImageFile(null);
      setPreviewUrl(user.avatarUrl || user.avatar_url || "");
      setAvatarError(false);
      toast("Form profil di-reset ke data semula", { icon: "🔄" });
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error("Masukkan kata sandi saat ini");
      return;
    }

    if (!passwordForm.newPassword) {
      toast.error("Masukkan kata sandi baru");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok");
      return;
    }

    try {
      setChangingPassword(true);
      await api.put("/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success("Kata sandi berhasil diperbarui dengan aman!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Gagal mengganti kata sandi. Pastikan sandi saat ini benar.";
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  // Password strength helper
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: "Belum diisi", color: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, text: "Sangat Lemah", color: "bg-rose-500" };
    if (score === 2) return { score: 2, text: "Cukup", color: "bg-amber-500" };
    if (score === 3) return { score: 3, text: "Kuat", color: "bg-emerald-500" };
    return { score: 4, text: "Sangat Kuat", color: "bg-emerald-600" };
  };

  const strength = getPasswordStrength(passwordForm.newPassword);

  if (authLoading) {
    return <ScreenLoader label="Memuat profil akun..." />;
  }

  if (!user) {
    return (
      <EmptyState
        title="Profil tidak tersedia"
        description="Silakan login ulang untuk melihat profil Anda."
      />
    );
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const roleConfig = {
    customer: {
      title: "Akun Pelanggan Resmi",
      badgeClass: isAdminRoute
        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        : "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: ShoppingBag,
    },
    logistics: {
      title: "Divisi Operasional Gudang & Logistik",
      badgeClass: isAdminRoute
        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
        : "bg-purple-50 text-purple-700 border border-purple-200",
      icon: Truck,
    },
    admin: {
      title: "Super Administrator / Owner",
      badgeClass: isAdminRoute
        ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
        : "bg-indigo-50 text-indigo-700 border border-indigo-200",
      icon: Shield,
    },
  }[user.role] || {
    title: "Pengguna RegarSport",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    icon: User,
  };

  const RoleIcon = roleConfig.icon;

  const cardBg = isAdminRoute
    ? "bg-[#14141E] border border-white/10 text-white"
    : "bg-white shadow-sm ring-1 ring-slate-900/5 text-slate-900";

  const subText = isAdminRoute ? "text-white/60" : "text-slate-500";
  const headingText = isAdminRoute ? "text-white" : "text-slate-900";
  const inputBg = isAdminRoute
    ? "bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-[#00BFA5] focus:ring-[#00BFA5]/20"
    : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500/20";

  return (
    <div className={`mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 ${isAdminRoute ? "text-white" : "text-slate-900"}`}>
      {/* Top Banner / Hero Profile Card */}
      <div className={`rounded-3xl p-6 sm:p-8 transition-all ${cardBg} mb-8`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Avatar and Basic Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar with Camera Trigger & Cloudinary Indicator */}
            <div className="relative group">
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-3xl overflow-hidden ring-4 ring-emerald-500/20 shadow-xl bg-linear-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                {previewUrl && !avatarError ? (
                  <img
                    src={previewUrl}
                    alt={user.fullName || "Avatar"}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="text-4xl font-extrabold text-emerald-500 tracking-wider">
                    {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}

                {/* Loading overlay while uploading */}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-1.5 z-20">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Upload CDN...</span>
                  </div>
                )}
              </div>

              {/* Camera Trigger Button Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={savingProfile || uploadingAvatar}
                className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition transform hover:scale-110 active:scale-95 disabled:opacity-50"
                title="Unggah Foto Avatar Baru"
              >
                <Camera size={18} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleSelectImage}
                className="hidden"
              />
            </div>

            {/* Name, Role & Email */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${roleConfig.badgeClass}`}>
                  <RoleIcon size={14} />
                  {roleConfig.title}
                </span>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isAdminRoute ? "bg-white/10 text-emerald-300" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                  <CheckCircle2 size={12} />
                  Akun Aktif
                </span>
              </div>

              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${headingText}`}>
                {user.fullName || user.full_name}
              </h1>

              <div className={`flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm ${subText}`}>
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-emerald-500" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-500" />
                  Bergabung: <strong className={headingText}>{joinDate}</strong>
                </span>
              </div>

              {/* Bio snippet */}
              {user.bio ? (
                <p className={`text-xs italic line-clamp-2 max-w-md pt-1 ${subText}`}>
                  &ldquo;{user.bio}&rdquo;
                </p>
              ) : null}

              {/* Cloudinary CDN Indicator & Delete Action */}
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${isAdminRoute ? "text-emerald-400/80" : "text-emerald-700"}`}>
                  <Cloud size={13} />
                  Foto Terhubung ke Cloudinary CDN
                </span>

                {(user.avatarUrl || user.avatar_url || imageFile) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition"
                  >
                    <Trash2 size={12} />
                    Hapus Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Role-Specific Quick Action Pill */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 self-center lg:self-center">
            {user.role === "customer" && (
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
              >
                <ShoppingBag size={16} />
                <span>Mulai Belanja</span>
              </Link>
            )}

            {user.role === "logistics" && (
              <Link
                to="/admin/orders"
                className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 transition"
              >
                <Truck size={16} />
                <span>Antrean Pesanan Gudang</span>
              </Link>
            )}

            {user.role === "admin" && (
              <Link
                to="/admin"
                className="flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md hover:bg-teal-400 transition"
              >
                <Sparkles size={16} />
                <span>Buka Admin Dashboard</span>
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic Metric Counter Cards per Role */}
        <div className={`mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 border-t ${isAdminRoute ? "border-white/10" : "border-slate-100"} pt-6`}>
          {user.role === "customer" && (
            <>
              <div className={`rounded-2xl p-4 ${isAdminRoute ? "bg-white/5" : "bg-emerald-50/50 border border-emerald-100/60"}`}>
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold mb-1">
                  <ShoppingBag size={14} />
                  Total Transaksi
                </div>
                <div className={`text-xl sm:text-2xl font-black ${headingText}`}>
                  {loadingStats ? "..." : roleStats.totalOrders} <span className="text-xs font-normal text-slate-400">Pesanan</span>
                </div>
              </div>

              <div className={`rounded-2xl p-4 ${isAdminRoute ? "bg-white/5" : "bg-emerald-50/50 border border-emerald-100/60"}`}>
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold mb-1">
                  <Sparkles size={14} />
                  Total Akumulasi Belanja
                </div>
                <div className={`text-xl sm:text-2xl font-black ${headingText}`}>
                  {loadingStats ? "..." : `Rp ${roleStats.totalSpent.toLocaleString("id-ID")}`}
                </div>
              </div>

              <div className={`col-span-2 md:col-span-1 rounded-2xl p-4 ${isAdminRoute ? "bg-white/5" : "bg-emerald-50/50 border border-emerald-100/60"}`}>
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold mb-1">
                  <Package size={14} />
                  Pesanan Aktif Berjalan
                </div>
                <div className={`text-xl sm:text-2xl font-black ${headingText}`}>
                  {loadingStats ? "..." : roleStats.activeOrders} <span className="text-xs font-normal text-slate-400">Dalam Proses</span>
                </div>
              </div>
            </>
          )}

          {user.role === "logistics" && (
            <>
              <div className={`rounded-2xl p-4 ${isAdminRoute ? "bg-white/5" : "bg-purple-50/60 border border-purple-100"}`}>
                <div className="flex items-center gap-2 text-xs text-purple-600 font-semibold mb-1">
                  <Package size={14} />
                  Perlu Dikemas (Paid)
                </div>
                <div className={`text-xl sm:text-2xl font-black ${headingText}`}>
                  {loadingStats ? "..." : roleStats.warehousePending} <span className="text-xs font-normal text-slate-400">Siap Kemas</span>
                </div>
              </div>

              <div className={`rounded-2xl p-4 ${isAdminRoute ? "bg-white/5" : "bg-purple-50/60 border border-purple-100"}`}>
                <div className="flex items-center gap-2 text-xs text-purple-600 font-semibold mb-1">
                  <Truck size={14} />
                  Dalam Pengiriman (Resi)
                </div>
                <div className={`text-xl sm:text-2xl font-black ${headingText}`}>
                  {loadingStats ? "..." : roleStats.warehouseShipped} <span className="text-xs font-normal text-slate-400">Di Kurir</span>
                </div>
              </div>

              <div className={`col-span-2 md:col-span-1 rounded-2xl p-4 ${isAdminRoute ? "bg-white/5" : "bg-purple-50/60 border border-purple-100"}`}>
                <div className="flex items-center gap-2 text-xs text-purple-600 font-semibold mb-1">
                  <Building2 size={14} />
                  Fasilitas Gudang
                </div>
                <div className={`text-base sm:text-lg font-bold truncate ${headingText}`}>
                  Hub Wonogiri Central
                </div>
              </div>
            </>
          )}

          {user.role === "admin" && (
            <>
              <div className={`rounded-2xl p-4 ${isAdminRoute ? "bg-white/5" : "bg-slate-100/70 border border-slate-200"}`}>
                <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold mb-1">
                  <Sparkles size={14} />
                  Total Omzet Penjualan
                </div>
                <div className={`text-xl sm:text-2xl font-black ${headingText}`}>
                  {loadingStats ? "..." : `Rp ${Number(roleStats.adminRevenue || 0).toLocaleString("id-ID")}`}
                </div>
              </div>

              <div className={`rounded-2xl p-4 ${isAdminRoute ? "bg-white/5" : "bg-slate-100/70 border border-slate-200"}`}>
                <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold mb-1">
                  <ShoppingBag size={14} />
                  Total Pesanan Masuk
                </div>
                <div className={`text-xl sm:text-2xl font-black ${headingText}`}>
                  {loadingStats ? "..." : roleStats.adminTotalOrders} <span className="text-xs font-normal text-slate-400">Pesanan</span>
                </div>
              </div>

              <div className={`col-span-2 md:col-span-1 rounded-2xl p-4 ${isAdminRoute ? "bg-white/5" : "bg-slate-100/70 border border-slate-200"}`}>
                <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold mb-1">
                  <User size={14} />
                  Pengguna Terdaftar
                </div>
                <div className={`text-xl sm:text-2xl font-black ${headingText}`}>
                  {loadingStats ? "..." : roleStats.adminTotalUsers} <span className="text-xs font-normal text-slate-400">Akun</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex border-b border-slate-200 dark:border-white/10 mb-6 gap-2 sm:gap-4 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "info"
              ? isAdminRoute
                ? "border-[#00BFA5] text-[#00BFA5]"
                : "border-emerald-600 text-emerald-600"
              : `${subText} border-transparent hover:${headingText}`
          }`}
        >
          <User size={16} />
          <span>Informasi Akun & Kontak</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "security"
              ? isAdminRoute
                ? "border-[#00BFA5] text-[#00BFA5]"
                : "border-emerald-600 text-emerald-600"
              : `${subText} border-transparent hover:${headingText}`
          }`}
        >
          <KeyRound size={16} />
          <span>Keamanan & Sandi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "activity"
              ? isAdminRoute
                ? "border-[#00BFA5] text-[#00BFA5]"
                : "border-emerald-600 text-emerald-600"
              : `${subText} border-transparent hover:${headingText}`
          }`}
        >
          <Clock size={16} />
          <span>Ringkasan Aktivitas</span>
        </button>
      </div>

      {/* Tab 1: Informasi Profil & Kontak */}
      {activeTab === "info" && (
        <form onSubmit={handleSaveProfile} className={`rounded-3xl p-6 sm:p-8 ${cardBg}`}>
          <div className="border-b border-slate-100 dark:border-white/10 pb-4 mb-6">
            <h2 className={`text-xl font-bold tracking-tight ${headingText}`}>
              Kelola Data Profil & Kontak Pengiriman
            </h2>
            <p className={`text-sm mt-1 ${subText}`}>
              Data kontak dan alamat Anda akan otomatis tersinkronisasi saat melakukan checkout pesanan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-emerald-500" />
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nama lengkap Anda"
                className={`w-full rounded-2xl px-4 py-3 text-sm transition outline-none ${inputBg}`}
                required
              />
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-white/80 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-emerald-500" />
                  Alamat Email Akun
                </span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Terverifikasi
                </span>
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className={`w-full rounded-2xl px-4 py-3 text-sm opacity-70 cursor-not-allowed ${inputBg}`}
              />
              <p className={`text-[11px] mt-1 ${subText}`}>
                Email akun bersifat permanen dan digunakan untuk autentikasi keamanan.
              </p>
            </div>

            {/* No. WhatsApp / HP */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-500" />
                Nomor WhatsApp / HP Aktif
              </label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="Contoh: 081234567890"
                className={`w-full rounded-2xl px-4 py-3 text-sm font-mono transition outline-none ${inputBg}`}
              />
              <p className={`text-[11px] mt-1 ${subText}`}>
                Penting untuk koordinasi kurir saat pengiriman dan otomatis mengisi checkout.
              </p>
            </div>

            {/* Kota / Kabupaten */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                <Building2 size={14} className="text-emerald-500" />
                Kota / Kabupaten
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Contoh: Wonogiri, Solo, Jakarta Selatan"
                className={`w-full rounded-2xl px-4 py-3 text-sm transition outline-none ${inputBg}`}
              />
            </div>

            {/* Kode Pos */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-500" />
                Kode Pos Pengiriman
              </label>
              <input
                type="text"
                maxLength={5}
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value.replace(/\D/g, "") })}
                placeholder="5 digit angka (contoh: 57612)"
                className={`w-full rounded-2xl px-4 py-3 text-sm font-mono transition outline-none ${inputBg}`}
              />
            </div>

            {/* Bio / Motto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                <FileText size={14} className="text-emerald-500" />
                Bio / Status Pribadi
              </label>
              <input
                type="text"
                maxLength={150}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Contoh: Pencinta jersey olahraga & apparel RegarSport"
                className={`w-full rounded-2xl px-4 py-3 text-sm transition outline-none ${inputBg}`}
              />
            </div>

            {/* Alamat Lengkap Pengiriman (Full Width) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-500" />
                Alamat Lengkap Pengiriman (Jalan, No. Rumah, RT/RW, Kecamatan)
              </label>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Masukkan detail alamat jalan, patokan, nomor rumah, RT/RW, dan kelurahan/kecamatan..."
                className={`w-full rounded-2xl p-4 text-sm transition outline-none resize-y ${inputBg}`}
              />
              <p className={`text-[11px] mt-1 ${subText}`}>
                Alamat ini akan otomatis dijadikan alamat tujuan pengiriman default saat Anda checkout belanja.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-slate-100 dark:border-white/10">
            <button
              type="submit"
              disabled={savingProfile || uploadingAvatar}
              className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdminRoute
                  ? "bg-[#00BFA5] hover:bg-[#00A892] text-slate-950 shadow-[#00BFA5]/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              }`}
            >
              <Save size={16} />
              {savingProfile ? "Menyimpan ke Server..." : "Simpan Perubahan Profil"}
            </button>

            <button
              type="button"
              onClick={handleResetProfile}
              disabled={savingProfile}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold border transition ${
                isAdminRoute
                  ? "border-white/10 hover:bg-white/5 text-white/80"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Keamanan Akun & Sandi */}
      {activeTab === "security" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleChangePassword}
            className={`lg:col-span-2 rounded-3xl p-6 sm:p-8 ${cardBg}`}
          >
            <div className="border-b border-slate-100 dark:border-white/10 pb-4 mb-6">
              <h2 className={`text-xl font-bold tracking-tight ${headingText}`}>
                Ubah Kata Sandi Akun
              </h2>
              <p className={`text-sm mt-1 ${subText}`}>
                Pastikan akun Anda tetap terlindungi dengan memperbarui kata sandi secara berkala.
              </p>
            </div>

            <div className="space-y-4">
              {/* Kata Sandi Saat Ini */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                  <Lock size={14} className="text-emerald-500" />
                  Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    placeholder="Masukkan kata sandi lama Anda"
                    className={`w-full rounded-2xl px-4 py-3 pr-12 text-sm transition outline-none ${inputBg}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Kata Sandi Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-emerald-500" />
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="Minimal 6 karakter kombinasi"
                    className={`w-full rounded-2xl px-4 py-3 pr-12 text-sm transition outline-none ${inputBg}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {passwordForm.newPassword && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={subText}>Kekuatan Sandi:</span>
                      <span className="font-bold text-slate-800 dark:text-white">{strength.text}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Konfirmasi Kata Sandi Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-white/80 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="Ulangi kata sandi baru"
                    className={`w-full rounded-2xl px-4 py-3 pr-12 text-sm transition outline-none ${inputBg}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Match indicator */}
                {passwordForm.confirmPassword && (
                  <p
                    className={`text-[11px] mt-1.5 flex items-center gap-1 font-semibold ${
                      passwordForm.newPassword === passwordForm.confirmPassword
                        ? "text-emerald-600"
                        : "text-rose-500"
                    }`}
                  >
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <>
                        <Check size={13} />
                        Kata sandi baru cocok
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} />
                        Konfirmasi kata sandi belum sama
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
              <button
                type="submit"
                disabled={changingPassword}
                className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isAdminRoute
                    ? "bg-[#00BFA5] hover:bg-[#00A892] text-slate-950 shadow-[#00BFA5]/20"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                }`}
              >
                <Lock size={16} />
                {changingPassword ? "Menyimpan Sandi..." : "Perbarui Kata Sandi Sekarang"}
              </button>
            </div>
          </form>

          {/* Security Info Card */}
          <div className={`rounded-3xl p-6 space-y-4 ${cardBg} h-fit`}>
            <div className="flex items-center gap-2.5 text-emerald-600 font-bold text-sm">
              <Shield size={18} />
              Tips Keamanan Akun
            </div>
            <p className={`text-xs leading-relaxed ${subText}`}>
              Untuk melindungi transaksi dan informasi pribadi Anda, ikuti panduan berikut:
            </p>
            <ul className={`space-y-2.5 text-xs ${subText}`}>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>Gunakan minimal 6 karakter kombinasi huruf dan angka.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>Jangan gunakan tanggal lahir atau kata sandi yang sama dengan email lain.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>Kata sandi disimpan terenkripsi dengan algoritma BCrypt berstandar enterprise.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Ringkasan Aktivitas & Transaksi Cepat */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          {user.role === "customer" && (
            <div className={`rounded-3xl p-6 sm:p-8 ${cardBg}`}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4 mb-6">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${headingText}`}>
                    Pesanan Terbaru Anda
                  </h2>
                  <p className={`text-sm mt-1 ${subText}`}>
                    Pantau status belanja dan pengiriman jersey RegarSport Anda secara langsung.
                  </p>
                </div>
                <Link
                  to="/dashboard/my-orders"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 transition"
                >
                  <span>Lihat Semua Pesanan</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

              {roleStats.recentOrders.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <ShoppingBag size={40} className="mx-auto text-slate-300 dark:text-white/20" />
                  <p className={`text-sm font-medium ${subText}`}>
                    Anda belum memiliki riwayat pesanan.
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
                  >
                    <span>Mulai Belanja Produk Olahraga</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {roleStats.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition ${
                        isAdminRoute
                          ? "border-white/10 bg-white/5 hover:bg-white/10"
                          : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-emerald-600">
                            #{order.orderNumber || order.order_number || `ORD-${order.id}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.status === "SHIPPED"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "PAID"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className={`text-xs ${subText}`}>
                          {new Date(order.createdAt || order.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>

                      <div className="mt-3 sm:mt-0 flex items-center justify-between sm:gap-6">
                        <div className="text-right">
                          <div className={`text-sm font-black ${headingText}`}>
                            Rp {Number(order.totalAmount || 0).toLocaleString("id-ID")}
                          </div>
                          <div className={`text-[11px] ${subText}`}>
                            {order.items?.length || 1} Item
                          </div>
                        </div>

                        <Link
                          to={`/dashboard/orders/${order.id}`}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-white dark:bg-white/10 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 transition shadow-xs"
                        >
                          <span>Detail</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {user.role === "logistics" && (
            <div className={`rounded-3xl p-6 sm:p-8 ${cardBg} space-y-6`}>
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${headingText}`}>
                  Pusat Operasional Logistik Gudang
                </h2>
                <p className={`text-sm mt-1 ${subText}`}>
                  Fasilitas pemenuhan pesanan, cetak massal label thermal, dan scanner barcode resi kurir.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`rounded-2xl p-5 border ${isAdminRoute ? "border-white/10 bg-white/5" : "border-purple-100 bg-purple-50/40"}`}>
                  <div className="flex items-center gap-2 text-purple-600 font-bold text-sm mb-2">
                    <Package size={18} />
                    Antrean Kemas (Paid)
                  </div>
                  <p className={`text-xs mb-4 ${subText}`}>
                    Terdapat {roleStats.warehousePending} pesanan yang telah dibayar dan siap dikemas oleh staf gudang.
                  </p>
                  <Link
                    to="/admin/orders"
                    className="inline-flex items-center gap-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition shadow-sm"
                  >
                    <span>Buka Antrean Gudang</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className={`rounded-2xl p-5 border ${isAdminRoute ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-2">
                    <Truck size={18} />
                    Pengiriman Berjalan
                  </div>
                  <p className={`text-xs mb-4 ${subText}`}>
                    Terdapat {roleStats.warehouseShipped} pesanan yang saat ini dalam perjalanan bersama kurir logistik.
                  </p>
                  <Link
                    to="/admin/orders"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white bg-slate-200 dark:bg-white/10 hover:bg-slate-300 px-4 py-2 rounded-xl transition"
                  >
                    <span>Lacak Pengiriman</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {user.role === "admin" && (
            <div className={`rounded-3xl p-6 sm:p-8 ${cardBg} space-y-6`}>
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${headingText}`}>
                  Pintasan Cepat Manajemen Toko
                </h2>
                <p className={`text-sm mt-1 ${subText}`}>
                  Akses langsung ke modul inti pengelolaan e-commerce RegarSport.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Link
                  to="/admin"
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition hover:-translate-y-1 ${
                    isAdminRoute ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <Sparkles size={24} className="text-teal-400 mb-2" />
                  <span className="text-xs font-bold">Dashboard Omzet</span>
                </Link>

                <Link
                  to="/admin/products"
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition hover:-translate-y-1 ${
                    isAdminRoute ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <ShoppingBag size={24} className="text-emerald-500 mb-2" />
                  <span className="text-xs font-bold">Kelola Katalog</span>
                </Link>

                <Link
                  to="/admin/orders"
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition hover:-translate-y-1 ${
                    isAdminRoute ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <Package size={24} className="text-purple-500 mb-2" />
                  <span className="text-xs font-bold">Semua Pesanan</span>
                </Link>

                <Link
                  to="/admin/users"
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition hover:-translate-y-1 ${
                    isAdminRoute ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <User size={24} className="text-blue-500 mb-2" />
                  <span className="text-xs font-bold">Daftar Pengguna</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
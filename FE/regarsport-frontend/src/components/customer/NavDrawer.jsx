import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  X,
  ChevronRight,
  ShieldCheck,
  Phone,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function NavDrawer({ isOpen, onClose, onOpenSearch }) {
  const { user, logout } = useAuth();

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    { name: "JERSEY SEPAKBOLA & FUTSAL", tag: "POPULER", link: "/dashboard" },
    { name: "JERSEY BOLA VOLI (PRO LIGA)", tag: "HOT", link: "/dashboard" },
    { name: "JERSEY BADMINTON & TENIS", link: "/dashboard" },
    { name: "JERSEY BASKET & STREETBALL", link: "/dashboard" },
    { name: "CUSTOM TIM & ESPORTS", tag: "CUSTOM", link: "/dashboard" },
    { name: "SEMUA KOLEKSI READY STOCK", link: "/dashboard" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative z-10 w-full max-w-md bg-[#162018] text-white flex flex-col h-full shadow-2xl border-r border-white/10 animate-slide-in-left overflow-hidden">
        {/* Topographic Background Texture */}
        <div className="absolute inset-0 bg-topography opacity-15 pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-condensed text-xl font-bold tracking-wider uppercase text-slate-100">
              REGARSPORT APPAREL
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white px-2.5 py-1 rounded-full border border-white/10 hover:border-white/30 transition-all cursor-pointer"
          >
            <X size={16} />
            <span>TUTUP</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Search Shortcut Bar */}
          <button
            onClick={() => {
              onClose();
              if (onOpenSearch) onOpenSearch();
            }}
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer group"
          >
            <span>Cari jersey, ukuran, bahan...</span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300 group-hover:bg-white/20">
              ⌘K
            </span>
          </button>

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/80 mb-2">
              KATEGORI OLAHRAGA
            </p>
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                to={cat.link}
                onClick={onClose}
                className="group flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/5 transition-all text-slate-200 hover:text-white"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-condensed text-lg font-bold tracking-wide group-hover:translate-x-1 transition-transform">
                    {cat.name}
                  </span>
                  {cat.tag && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-600/30 text-red-400 border border-red-500/40">
                      {cat.tag}
                    </span>
                  )}
                </div>
                <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-white/20 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                  <ChevronRight size={14} />
                </div>
              </Link>
            ))}
          </div>

          {/* Info & Trust Section */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              LAYANAN & INFORMASI
            </p>
            <Link
              to="/dashboard/about"
              onClick={onClose}
              className="flex items-center gap-3 py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Sparkles size={16} className="text-emerald-400" />
              <span>Tentang Pabrik & Teknologi Wonogiri</span>
            </Link>
            <a
              href="#keunggulan"
              onClick={onClose}
              className="flex items-center gap-3 py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Garansi 100% Tukar Ukuran 7 Hari</span>
            </a>
            <a
              href="https://wa.me/6281234567890?text=Halo%20RegarSport,%20saya%20ingin%20konsultasi%20desain%20jersey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Phone size={16} className="text-emerald-400" />
              <span>Hubungi CS Tim Apparel (WhatsApp)</span>
            </a>
          </div>
        </div>

        {/* Footer Account Actions */}
        <div className="relative z-10 p-5 border-t border-white/10 bg-[#121A14]">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700/40 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-300">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white line-clamp-1">{user.fullName || user.email}</div>
                  <div className="text-[10px] text-emerald-400 capitalize">{user.role || "Pelanggan"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={user.role === "admin" ? "/admin" : user.role === "logistics" ? "/admin/warehouse" : "/dashboard"}
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0D130F] font-bold text-xs transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    onClose();
                  }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Keluar"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={onClose}
                className="py-2.5 text-center rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs tracking-wider uppercase transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="py-2.5 text-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0D130F] font-bold text-xs tracking-wider uppercase transition-colors shadow-lg shadow-emerald-500/20"
              >
                Daftar Akun
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

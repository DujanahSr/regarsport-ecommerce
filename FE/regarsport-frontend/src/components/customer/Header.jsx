import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Heart,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  User,
  X,
  Info,
  Truck,
  Shield,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const { cartItems } = useCart();

  const { wishlistItems } = useWishlist();

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalWishlist = wishlistItems.length;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const navLinks = [
    { to: "/dashboard/profile", label: "Profil", icon: User },
    { to: "/dashboard/favorites", label: "Wishlist", icon: Heart, badge: totalWishlist },
    { to: "/dashboard/cart", label: "Keranjang", icon: ShoppingCart, badge: totalItems },
    { to: "/dashboard/my-orders", label: "Pesanan Saya", icon: Package },
    { to: "/dashboard/about", label: "Tentang", icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#162018] text-white shadow-lg border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-xs font-mono tracking-wider uppercase text-slate-300 hover:text-white transition-colors border border-white/10"
            title="Kembali ke Beranda Utama"
          >
            <span>← Beranda</span>
          </Link>

          <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <div className="w-8 h-8 bg-[#B9382B] rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xs">R</span>
            </div>
            <div>
              <span className="font-condensed text-xl font-black uppercase tracking-wider text-white block leading-none">
                REGARSPORT
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/90 block">
                ATELIER CICENDO BANDUNG
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 lg:flex">
          {navLinks.map(({ to, label, icon: Icon, badge }) => (
            <Link
              key={to}
              to={to}
              className="relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-emerald-50/90 transition hover:bg-white/10"
            >
              <Icon size={17} />
              <span>{label}</span>
              {typeof badge === "number" && badge > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-emerald-950">
                  {badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 border-l border-white/10 pl-3 lg:flex">
          {user?.role === "logistics" && (
            <Link
              to="/admin/orders"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-900/30 transition animate-pulse"
            >
              <Truck size={15} />
              <span>Panel Gudang</span>
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs shadow-md transition"
            >
              <Shield size={15} />
              <span>Panel Admin</span>
            </Link>
          )}

          <Link
            to="/dashboard/profile"
            className="flex items-center gap-2 rounded-lg py-1 px-2 text-sm text-emerald-50/90 transition hover:bg-white/10"
            title="Buka Pengaturan Profil"
          >
            {user?.avatar_url || user?.avatarUrl ? (
              <img
                src={user.avatar_url || user.avatarUrl}
                alt={user?.full_name || "Avatar"}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-emerald-400/50"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/40 ${
                user?.avatar_url || user?.avatarUrl ? "hidden" : ""
              }`}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </span>
            <span className="max-w-35 truncate font-medium">{user?.full_name}</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/15 lg:hidden"
          aria-label="Buka menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen ? (
        <div className="border-t border-white/10 bg-emerald-950 px-4 py-4 sm:px-6 lg:hidden">
          <Link
            to="/dashboard/profile"
            onClick={() => setIsMenuOpen(false)}
            className="mb-3 flex items-center gap-3 border-b border-white/10 pb-3 text-sm text-emerald-50/90 hover:text-white"
          >
            {user?.avatar_url || user?.avatarUrl ? (
              <img
                src={user.avatar_url || user.avatarUrl}
                alt={user?.full_name || "Avatar"}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-400/50"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300 ring-1 ring-emerald-400/40 ${
                user?.avatar_url || user?.avatarUrl ? "hidden" : ""
              }`}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-white">{user?.full_name}</span>
              <span className="text-xs text-emerald-400">Kelola Profil & Keamanan &rarr;</span>
            </div>
          </Link>

          <div className="flex flex-col gap-1">
            {user?.role === "logistics" && (
              <Link
                to="/admin/orders"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-purple-600 px-3 py-2.5 text-sm font-bold text-white mb-1 shadow-md"
              >
                <Truck size={18} />
                <span>Buka Panel Gudang (Orders)</span>
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-bold text-emerald-950 mb-1 shadow-md"
              >
                <Shield size={18} />
                <span>Buka Panel Admin</span>
              </Link>
            )}

            {navLinks.map(({ to, label, icon: Icon, badge }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-white/10"
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={18} />
                  {label}
                </span>
                {typeof badge === "number" && badge > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-emerald-950">
                    {badge}
                  </span>
                ) : null}
              </Link>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-emerald-950"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
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
    <header className="sticky top-0 z-50 bg-emerald-950 text-white shadow-lg shadow-emerald-950/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <Dumbbell size={20} className="text-emerald-400" />
          </span>
          <span className="text-xl font-bold tracking-tight">
            Regar<span className="text-emerald-400">Sport</span>
          </span>
        </Link>

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
          <div className="flex items-center gap-2 text-sm text-emerald-50/80">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <User size={15} />
            </span>
            <span className="max-w-35 truncate">{user?.full_name}</span>
          </div>

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
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3 text-sm text-emerald-50/80">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <User size={16} />
            </span>
            <span>Halo, {user?.full_name}</span>
          </div>

          <div className="flex flex-col gap-1">
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
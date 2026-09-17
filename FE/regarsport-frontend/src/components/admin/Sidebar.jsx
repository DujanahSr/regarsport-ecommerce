import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  Users,
  Star,
  UserCircle,
  Zap,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/categories", icon: FolderTree, label: "Categories" },
    { to: "/admin/products", icon: Package, label: "Products" },
    { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/reviews", icon: Star, label: "Reviews" },
    { to: "/admin/profile", icon: UserCircle, label: "Profile" },
  ];

  const menuClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
      ? "bg-[#00BFA5]/10 text-[#00BFA5] shadow-[inset_0_0_0_1px_#00BFA5/20]"
      : "text-slate-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#14141E] border border-white/10 text-white"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-40 w-72 h-screen bg-[#0D0D0D] border-r border-white/5 flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Logo */}
        <div className="shrink-0 flex items-center gap-2 px-6 h-16 border-b border-white/5">
          <div className="bg-[#00BFA5] p-1.5 rounded-md">
            <Zap size={16} className="text-black" strokeWidth={3} />
          </div>
          <span className="text-white font-black tracking-[3px] text-sm uppercase">RegarSport</span>
          <span className="ml-auto text-[9px] font-bold text-[#00BFA5]/60 uppercase tracking-widest">Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={menuClass}
              onClick={() => setIsOpen(false)}
            >
              <item.icon size={18} strokeWidth={1.5} />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00BFA5]" />
            <span>System Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
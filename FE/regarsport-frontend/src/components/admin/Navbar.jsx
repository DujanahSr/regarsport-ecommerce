import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0D0D0D]/80 backdrop-blur-lg border-b border-white/5 px-6 py-3 flex justify-between items-center">
      <h2 className="text-sm font-semibold text-white/70 tracking-wide">
        <span className="text-[#00BFA5]">/</span> Admin Panel
      </h2>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-[#00BFA5]/20 to-[#00BFA5]/5 border border-[#00BFA5]/30 flex items-center justify-center shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.full_name || "Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-[#00BFA5]">
                {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-white/80 hidden sm:inline">
            {user?.full_name || "Admin"}
          </span>
          <ChevronDown size={14} className="text-white/40 group-hover:text-white/70 transition-colors" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-6 top-16 mt-1 w-48 bg-[#14141E] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
            <Link
              to="/admin/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <User size={15} />
              Profil Saya
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors w-full"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
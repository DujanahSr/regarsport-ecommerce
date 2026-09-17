import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Zap,
  Eye,
  EyeOff,
  Shield,
  BadgeCheck,
  Sparkles,
  ArrowRight,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const TICKER_ITEMS = [
  "GEAR UP", "PERFORM", "DOMINATE", "LEVEL UP", "STAY FAST",
  "GEAR UP", "PERFORM", "DOMINATE", "LEVEL UP", "STAY FAST",
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!form.full_name.trim()) return "Nama lengkap wajib diisi";
    if (!form.email.trim()) return "Email wajib diisi";
    if (!form.password.trim()) return "Password wajib diisi";
    if (form.password.length < 8) return "Password minimal 8 karakter";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", form);
      toast.success("Register berhasil, silakan login");
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.message || "Register gagal";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col lg:flex-row overflow-hidden relative">

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-6 pt-8 pb-4 z-20 relative">
        <div className="flex items-center gap-2">
          <div className="bg-[#00BFA5] p-1.5 rounded-md">
            <Zap size={15} className="text-black" strokeWidth={3} />
          </div>
          <span className="text-white font-black tracking-[3px] text-sm uppercase">RegarSport</span>
        </div>
        <Link
          to="/login"
          className="text-[11px] font-bold text-[#00BFA5] border border-[#00BFA5]/30 px-3 py-1.5 rounded-full hover:bg-[#00BFA5]/10 transition-colors"
        >
          Masuk →
        </Link>
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex w-[52%] xl:w-[55%] flex-col relative overflow-hidden bg-[#0C0C16]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=900&q=80"
            alt="Sport"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#0C0C16] via-[#0C0C16]/70 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-[#0C0C16] via-transparent to-transparent" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#00BFA5 1px, transparent 1px), linear-gradient(90deg, #00BFA5 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />

        {/* Ticker */}
        <div className="relative z-10 bg-[#00BFA5] py-2 overflow-hidden shrink-0">
          <div className="flex gap-0 animate-[ticker_18s_linear_infinite] whitespace-nowrap w-max">
            {TICKER_ITEMS.map((item, i) => (
              <span key={i} className="text-[#0D0D0D] font-black text-xs tracking-[3px] uppercase px-6">
                {item} <span className="text-black/30 mx-1">✦</span>
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-10 pt-8">
          <div className="flex items-center gap-2">
            <div className="bg-[#00BFA5] p-1.5 rounded-md">
              <Zap size={16} className="text-black" strokeWidth={3} />
            </div>
            <span className="text-white font-black tracking-[4px] text-base uppercase">RegarSport</span>
          </div>
        </div>

        <div className="relative z-10 px-10 mt-14 flex-1">
          <div className="inline-block bg-[#0097A7] text-white text-[10px] font-black tracking-[3px] px-3 py-1.5 rounded-sm mb-5 uppercase">
            Join The Movement
          </div>
          <h1 className="text-[56px] xl:text-[68px] font-black text-white uppercase leading-[0.9] tracking-[-2px] mb-5">
            GEAR UP.
            <br />
            <span className="text-transparent" style={{ WebkitTextStroke: "2px #00BFA5" }}>
              PERFORM.
            </span>
            <br />
            DOMINATE.
          </h1>
          <p className="text-[#2e4545] text-sm leading-relaxed max-w-xs mb-12">
            Koleksi perlengkapan olahraga terbaik — dari lapangan hingga podium.
          </p>

          <div className="flex gap-8">
            {[
              { icon: Package, num: "10K+", label: "Produk" },
              { icon: TrendingUp, num: "500+", label: "Brand" },
              { icon: Users, num: "1M+", label: "Pelanggan" },
            ].map(({ icon: Icon, num, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={15} className="text-[#00BFA5]" />
                <div>
                  <span className="text-[#00BFA5] font-black text-xl block leading-tight">{num}</span>
                  <span className="text-[#1a2a2a] text-[10px] uppercase tracking-widest">{label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 py-3 overflow-hidden">
            <div className="flex gap-0 animate-[ticker_25s_linear_infinite_reverse] whitespace-nowrap w-max">
              {["ADIDAS", "NIKE", "PUMA", "REEBOK", "UNDER ARMOUR", "NEW BALANCE", "ASICS"].map((brand, i) => (
                <span key={i} className="text-[#0d1e1e] font-black text-xs tracking-[3px] uppercase px-6">
                  {brand} <span className="text-[#0f1a1a] mx-1">◆</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-10 py-8 lg:py-0 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full bg-[#00BFA5]/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-95 relative">
          <div className="hidden lg:flex items-center gap-2 mb-10">
            <span className="text-xs uppercase tracking-[3px] text-white/30 leading-none">Mulai perjalanan sportimu</span>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#00BFA5]/20 blur-lg rounded-xl" />
                <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-2.5 rounded-xl">
                  <UserPlus size={22} className="text-[#00BFA5]" strokeWidth={2} />
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black tracking-[3px] text-[#00BFA5] uppercase mb-0.5">Buat Akun</p>
                <h2 className="text-[34px] font-black text-white tracking-tight leading-none">REGISTER</h2>
              </div>
            </div>
            <p className="text-[#2a3a3a] text-sm leading-relaxed">Daftar dan temukan gear terbaikmu hari ini.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#0097A7]/30 bg-[#0097A7]/8 px-4 py-3">
              <span className="text-[#0097A7] text-lg leading-none mt-0.5">!</span>
              <p className="text-[#0097A7]/90 text-sm leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-[#3a3a4a] mb-2">Nama Lengkap</label>
              <div className="group flex items-center bg-[#14141E] border border-[#1a1a2a] rounded-xl px-4 focus-within:border-[#00BFA5]/60 focus-within:bg-[#00BFA5]/4 focus-within:shadow-[0_0_0_3px_rgba(0,191,165,0.08)] transition-all duration-200">
                <User size={15} className="text-[#4a5a5a] group-focus-within:text-[#00BFA5]/60 mr-3 shrink-0 transition-colors" />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="flex-1 bg-transparent text-white text-sm py-3.5 outline-none placeholder-[#4a6a6a]"
                  value={form.full_name}
                  onChange={(e) => { setForm({ ...form, full_name: e.target.value }); if (error) setError(""); }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-[#3a3a4a] mb-2">Email</label>
              <div className="group flex items-center bg-[#14141E] border border-[#1a1a2a] rounded-xl px-4 focus-within:border-[#00BFA5]/60 focus-within:bg-[#00BFA5]/4 focus-within:shadow-[0_0_0_3px_rgba(0,191,165,0.08)] transition-all duration-200">
                <Mail size={15} className="text-[#4a5a5a] group-focus-within:text-[#00BFA5]/60 mr-3 shrink-0 transition-colors" />
                <input
                  type="email"
                  placeholder="john@email.com"
                  className="flex-1 bg-transparent text-white text-sm py-3.5 outline-none placeholder-[#4a6a6a]"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); if (error) setError(""); }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-[#3a3a4a] mb-2">Password</label>
              <div className="group flex items-center bg-[#14141E] border border-[#1a1a2a] rounded-xl px-4 focus-within:border-[#00BFA5]/60 focus-within:bg-[#00BFA5]/4 focus-within:shadow-[0_0_0_3px_rgba(0,191,165,0.08)] transition-all duration-200">
                <Lock size={15} className="text-[#4a5a5a] group-focus-within:text-[#00BFA5]/60 mr-3 shrink-0 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 karakter"
                  className="flex-1 bg-transparent text-white text-sm py-3.5 outline-none placeholder-[#4a6a6a]"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); if (error) setError(""); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#4a5a5a] hover:text-[#00BFA5]/60 transition-colors ml-2 shrink-0"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden flex items-center justify-center gap-2.5 bg-[#00BFA5] hover:bg-[#00BFA5]/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-sm tracking-[2px] uppercase rounded-xl py-4 mt-2 transition-all duration-200 shadow-[0_4px_32px_rgba(0,191,165,0.3)] hover:shadow-[0_6px_40px_rgba(0,191,165,0.45)] active:scale-[0.98] group"
            >
              <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <span className="flex-1 h-px bg-linear-to-r from-transparent to-[#1a1a2a]" />
            <span className="text-[10px] font-bold text-[#3a4a4a] tracking-widest uppercase">atau</span>
            <span className="flex-1 h-px bg-linear-to-l from-transparent to-[#1a1a2a]" />
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-[#1a1a2a] hover:border-[#00BFA5]/30 hover:bg-[#00BFA5]/5 text-[#4a5a5a] hover:text-white text-sm font-bold tracking-wide transition-all duration-200 group"
          >
            Sudah punya akun?
            <span className="text-[#00BFA5] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Masuk di sini <ArrowRight size={13} />
            </span>
          </Link>

          <div className="flex items-center justify-center gap-3 text-[#1e1e2a] text-[10px] font-semibold tracking-wide uppercase mt-6">
            <Shield size={12} className="text-[#00BFA5]/40" />
            <span>SSL Encrypted</span>
            <BadgeCheck size={12} className="text-[#00BFA5]/40" />
            <span>100% Secure</span>
            <Sparkles size={12} className="text-[#00BFA5]/40" />
            <span>Trusted by 1M+</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
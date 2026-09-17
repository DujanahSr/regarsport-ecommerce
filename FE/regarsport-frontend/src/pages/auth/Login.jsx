import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LogIn,
  Mail,
  Lock,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  Shield,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// Produk cards: basketball, badminton, running shoes
const PRODUCT_CARDS = [
  {
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmMUacwvLmpSVq9GG61nYjlF-LO2au53UMOA&s",
    label: "Basketball Pro",
    price: "Rp 1.499.000",
    tag: "BESTSELLER",
    rotate: "-rotate-3",
    top: "top-8",
    left: "left-6",
  },
  {
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZn5GNR9h3C2yUjg_vg03m1LZRigR3HsSpKw&s",
    label: "Badminton Elite",
    price: "Rp 899.000",
    tag: "NEW",
    rotate: "rotate-2",
    top: "top-[200px]",
    left: "left-[160px]",
  },
  {
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5zpxaSnsbo3gxSJy7tYhSnlSok4oon8n6Rg&s",
    label: "Running Shoes X1",
    price: "Rp 1.299.000",
    tag: "SALE",
    rotate: "-rotate-1",
    top: "top-[380px]",
    left: "left-10",
  },
];

const TICKER_ITEMS = [
  "GEAR UP", "PERFORM", "DOMINATE", "LEVEL UP", "STAY FAST",
  "GEAR UP", "PERFORM", "DOMINATE", "LEVEL UP", "STAY FAST",
];

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, []);

  const validateForm = () => {
    if (!form.email.trim()) return "Email wajib diisi";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Format email tidak valid";
    if (!form.password.trim()) return "Password wajib diisi";
    return "";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      const authData = res.data?.data || res.data;
      const token = authData.accessToken || authData.token;
      const loggedInUser = authData.user;

      if (token) {
        localStorage.setItem("token", token);
      }
      if (loggedInUser) {
        setUser(loggedInUser);
      }

      toast.success("Login berhasil!");
      const roleStr = (loggedInUser?.role || "").toLowerCase();
      navigate(roleStr.includes("admin") ? "/admin" : "/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Login gagal";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col lg:flex-row overflow-hidden relative">

      {/* ═══════════════════════════════════════
          MOBILE HEADER (visible only < lg)
      ═══════════════════════════════════════ */}
      <div className="lg:hidden flex items-center justify-between px-6 pt-8 pb-4 z-20 relative">
        <div className="flex items-center gap-2">
          <div className="bg-[#00BFA5] p-1.5 rounded-md">
            <Zap size={15} className="text-black" strokeWidth={3} />
          </div>
          <span className="text-white font-black tracking-[3px] text-sm uppercase">RegarSport</span>
        </div>
        <Link
          to="/register"
          className="text-[11px] font-bold text-[#00BFA5] border border-[#00BFA5]/30 px-3 py-1.5 rounded-full hover:bg-[#00BFA5]/10 transition-colors"
        >
          Daftar Gratis →
        </Link>
      </div>

      {/* ═══════════════════════════════════════
          LEFT PANEL — Editorial + Products
      ═══════════════════════════════════════ */}
      <div className="hidden lg:flex w-[52%] xl:w-[55%] flex-col relative overflow-hidden bg-[#0C0C16]">

        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=900&q=80"
            alt="Sport"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#0C0C16] via-[#0C0C16]/70 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-[#0C0C16] via-transparent to-transparent" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#00BFA5 1px, transparent 1px), linear-gradient(90deg, #00BFA5 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />

        {/* Ticker tape */}
        <div className="relative z-10 bg-[#00BFA5] py-2 overflow-hidden shrink-0">
          <div className="flex gap-0 animate-[ticker_18s_linear_infinite] whitespace-nowrap w-max">
            {TICKER_ITEMS.map((item, i) => (
              <span key={i} className="text-[#0D0D0D] font-black text-xs tracking-[3px] uppercase px-6">
                {item} <span className="text-black/30 mx-1">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div className="relative z-10 px-10 pt-8">
          <div className="flex items-center gap-2">
            <div className="bg-[#00BFA5] p-1.5 rounded-md">
              <Zap size={16} className="text-black" strokeWidth={3} />
            </div>
            <span className="text-white font-black tracking-[4px] text-base uppercase">RegarSport</span>
          </div>
        </div>

        {/* Headline + Cards */}
        <div className="relative z-10 px-10 mt-10 flex-1">
          <div className="inline-block bg-[#0097A7] text-white text-[10px] font-black tracking-[3px] px-3 py-1.5 rounded-sm mb-5 uppercase">
            Sport Store #1 Indonesia
          </div>
          <h1 className="text-[64px] xl:text-[76px] font-black text-white uppercase leading-[0.9] tracking-[-2px] mb-4">
            KEMBALI<br />
            KE{" "}
            <span className="text-transparent" style={{ WebkitTextStroke: "2px #00BFA5" }}>
              ARENA.
            </span>
          </h1>
          <p className="text-[#2e4545] text-sm leading-relaxed max-w-70 mb-10">
            Login dan lanjutkan perjalanan sportimu. Ribuan produk terbaik menunggumu.
          </p>

          {/* Product Cards dengan hover animasi */}
          <div className="relative h-105 xl:h-115">
            {PRODUCT_CARDS.map((card, i) => (
              <div
                key={i}
                className={`absolute ${card.top} ${card.left} ${card.rotate} group cursor-pointer`}
                style={{ zIndex: 10 - i }}
              >
                <div className="w-38.75 bg-[#0A1515]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-105 hover:border-[#00BFA5]/60 hover:shadow-[0_12px_48px_rgba(0,191,165,0.2)]">
                  {/* Tag */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className={`text-[9px] font-black tracking-[1.5px] px-2 py-1 rounded-sm ${
                      card.tag === "BESTSELLER" ? "bg-[#00BFA5] text-black" :
                      card.tag === "NEW" ? "bg-[#00E5FF] text-black" :
                      "bg-[#0097A7] text-white"
                    }`}>
                      {card.tag}
                    </span>
                  </div>
                  {/* Image */}
                  <div className="h-27.5 bg-[#161622] overflow-hidden">
                    <img
                      src={card.img}
                      alt={card.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-white text-[11px] font-bold leading-tight mb-1 line-clamp-1">{card.label}</p>
                    <p className="text-[#00BFA5] text-[11px] font-black">{card.price}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Stat badges */}
            <div className="absolute bottom-0 right-0 flex flex-col gap-2">
              {[
                ["1M+", "Pelanggan Aktif"],
                ["10K+", "Produk Sport"],
                ["500+", "Brand Ternama"],
              ].map(([num, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 bg-white/5 border border-white/8 backdrop-blur-sm rounded-xl px-4 py-2.5"
                >
                  <span className="text-[#00BFA5] font-black text-lg leading-none">{num}</span>
                  <span className="text-[#2a3a3a] text-[10px] uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom ticker */}
        <div className="relative z-10 border-t border-white/5 py-3 overflow-hidden shrink-0">
          <div className="flex gap-0 animate-[ticker_25s_linear_infinite_reverse] whitespace-nowrap w-max">
            {["ADIDAS", "NIKE", "PUMA", "REEBOK", "UNDER ARMOUR", "NEW BALANCE", "ASICS"].map((brand, i) => (
              <span key={i} className="text-[#0d1e1e] font-black text-xs tracking-[3px] uppercase px-6">
                {brand} <span className="text-[#0f1a1a] mx-1">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Form
      ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-10 py-8 lg:py-0 relative z-10">

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full bg-[#00BFA5]/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-95 relative">

          {/* Desktop indicator */}
          <div className="hidden lg:flex items-center gap-2 mb-12">
            <span className="text-xs uppercase tracking-[3px] text-white leading-none " >Sudah punya akun?</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#00BFA5]/20 blur-lg rounded-xl" />
                <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-2.5 rounded-xl">
                  <LogIn size={22} className="text-[#00BFA5]" strokeWidth={2} />
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black tracking-[3px] text-[#00BFA5] uppercase mb-0.5">
                  Welcome back
                </p>
                <h2 className="text-[34px] font-black text-white tracking-tight leading-none">LOGIN</h2>
              </div>
            </div>
            <p className="text-[#2a3a3a] text-sm leading-relaxed">
              Masuk dan temukan gear terbaikmu hari ini.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#0097A7]/30 bg-[#0097A7]/8 px-4 py-3">
              <span className="text-[#0097A7] text-lg leading-none mt-0.5">!</span>
              <p className="text-[#0097A7]/90 text-sm leading-snug">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-[#3a3a4a] mb-2">
                Email
              </label>
              <div className="group flex items-center bg-[#14141E] border border-[#1a1a2a] rounded-xl px-4 focus-within:border-[#00BFA5]/60 focus-within:bg-[#00BFA5]/4 focus-within:shadow-[0_0_0_3px_rgba(0,191,165,0.08)] transition-all duration-200">
                <Mail size={15} className="text-[#4a5a5a] group-focus-within:text-[#00BFA5]/60 mr-3 shrink-0 transition-colors duration-200" />
                <input
                  ref={emailRef}
                  type="email"
                  id="login-email"
                  placeholder="john@email.com"
                  autoComplete="email"
                  className="flex-1 bg-transparent text-white text-sm py-3.5 outline-none placeholder-[#4a6a6a]"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); if (error) setError(""); }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-[#3a3a4a]">
                  Password
                </label>
              </div>
              <div className="group flex items-center bg-[#14141E] border border-[#1a1a2a] rounded-xl px-4 focus-within:border-[#00BFA5]/60 focus-within:bg-[#00BFA5]/4 focus-within:shadow-[0_0_0_3px_rgba(0,191,165,0.08)] transition-all duration-200">
                <Lock size={15} className="text-[#4a5a5a] group-focus-within:text-[#00BFA5]/60 mr-3 shrink-0 transition-colors duration-200" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {/* Submit */}
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
                  Masuk Sekarang
                  <ArrowRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <span className="flex-1 h-px bg-linear-to-r from-transparent to-[#1a1a2a]" />
            <span className="text-[10px] font-bold text-[#3a4a4a] tracking-widest uppercase">atau</span>
            <span className="flex-1 h-px bg-linear-to-l from-transparent to-[#1a1a2a]" />
          </div>

          {/* Register CTA */}
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-[#1a1a2a] hover:border-[#00BFA5]/30 hover:bg-[#00BFA5]/5 text-[#4a5a5a] hover:text-white text-sm font-bold tracking-wide transition-all duration-200 group"
          >
            Belum punya akun?
            <span className="text-[#00BFA5] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Daftar gratis <ArrowRight size={13} />
            </span>
          </Link>

          {/* Trust line - tanpa emoji */}
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

      {/* Animations */}
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
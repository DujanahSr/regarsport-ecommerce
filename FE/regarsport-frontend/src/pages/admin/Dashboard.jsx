/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ScreenLoader } from '../../components/common/UiStates';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Download,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    orders: 0,
    users: 0,
    revenue: 0,
    pendingOrders: 0,
    paidOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes, dashRes, userStatsRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: { data: [] } })),
          api.get('/products?page=1&size=1').catch(() => ({ data: { data: { totalElements: 0 } } })),
          api.get('/orders/admin/dashboard').catch(() => ({ data: { data: null } })),
          api.get('/admin/users/stats').catch(() => ({ data: { data: null } })),
        ]);

        const catCount = Array.isArray(catRes.data?.data)
          ? catRes.data.data.length
          : Array.isArray(catRes.data)
          ? catRes.data.length
          : 0;
        const prodCount = prodRes.data?.data?.totalElements || 0;

        const dashData = dashRes.data?.data || {};
        const userStats = userStatsRes.data?.data || {};

        setStats({
          categories: catCount,
          products: prodCount,
          orders: dashData.totalOrders || 0,
          users: userStats.totalUsers || 0,
          revenue: dashData.totalRevenue || 0,
          pendingOrders: dashData.pendingOrders || 0,
          paidOrders: dashData.paidOrders || 0,
          processingOrders: dashData.processingOrders || 0,
          shippedOrders: dashData.shippedOrders || 0,
          completedOrders: dashData.completedOrders || 0,
        });

        if (Array.isArray(dashData.salesData) && dashData.salesData.length > 0) {
          setSalesData(dashData.salesData);
        } else {
          setSalesData([
            { month: 'Jan', sales: 0 },
            { month: 'Feb', sales: 0 },
            { month: 'Mar', sales: 0 },
            { month: 'Apr', sales: 0 },
            { month: 'Mei', sales: 0 },
            { month: 'Jun', sales: 0 },
          ]);
        }

        if (Array.isArray(dashData.topProducts) && dashData.topProducts.length > 0) {
          setTopProducts(dashData.topProducts);
        } else {
          setTopProducts([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const response = await api.get('/orders/admin/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-pesanan-regarstore-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Laporan pesanan (CSV) berhasil diunduh');
    } catch (err) {
      console.error('Gagal mengekspor CSV:', err);
      toast.error('Gagal mengunduh CSV laporan pesanan');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <ScreenLoader label="Memuat dashboard..." />;

  const statCards = [
    {
      label: 'Total Revenue',
      value: `Rp ${Number(stats.revenue).toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: 'text-[#00BFA5]',
      bg: 'from-[#00BFA5]/10 to-transparent',
      note: 'Total pendapatan riil'
    },
    {
      label: 'Total Orders',
      value: stats.orders.toLocaleString('id-ID'),
      icon: ShoppingCart,
      color: 'text-purple-400',
      bg: 'from-purple-500/10 to-transparent',
      note: `${stats.completedOrders} selesai`
    },
    {
      label: 'Total Products',
      value: stats.products.toLocaleString('id-ID'),
      icon: Package,
      color: 'text-blue-400',
      bg: 'from-blue-500/10 to-transparent',
      note: `${stats.categories} kategori aktif`
    },
    {
      label: 'Total Users',
      value: stats.users.toLocaleString('id-ID'),
      icon: Users,
      color: 'text-amber-400',
      bg: 'from-amber-500/10 to-transparent',
      note: 'Pengguna terdaftar'
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00BFA5]/20 blur-xl rounded-2xl" />
            <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-3 rounded-2xl">
              <LayoutDashboard size={28} className="text-[#00BFA5]" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-[-1px]">DASHBOARD</h1>
            <p className="text-[#2a3a3a] text-sm">
              Selamat datang kembali, <span className="text-white font-semibold">{user?.full_name}</span>
            </p>
          </div>
        </div>

        {/* CSV Export Action */}
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="flex items-center gap-2 bg-[#14141E] border border-white/10 hover:border-[#00BFA5]/40 text-white hover:text-[#00BFA5] px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,191,165,0.15)] active:scale-95 disabled:opacity-50"
        >
          <Download size={18} className={exporting ? "animate-bounce text-[#00BFA5]" : "text-[#00BFA5]"} />
          <span>{exporting ? "Mengunduh CSV..." : "Export Laporan CSV"}</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="group relative bg-[#14141E] border border-white/5 rounded-3xl p-6 overflow-hidden hover:border-[#00BFA5]/30 transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 bg-linear-to-br ${card.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#00BFA5]/30 transition-colors">
                <card.icon size={26} className={card.color} />
              </div>
              <span className="text-[10px] font-black tracking-[2px] uppercase text-white/40">{card.label}</span>
            </div>

            <p className="text-3xl xl:text-4xl font-black text-white tracking-tight mb-1 truncate">
              {card.value}
            </p>
            <p className="text-xs text-[#00BFA5]/70 font-medium">{card.note}</p>

            <div className="absolute bottom-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-[#00BFA5]/30 to-transparent" />
          </div>
        ))}
      </div>

      {/* Order Status Breakdown Bar */}
      <div className="bg-[#14141E] border border-white/5 rounded-3xl p-6 mb-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          Status Pipeline Pesanan
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-white">{stats.pendingOrders}</p>
              <p className="text-[11px] text-slate-400 font-medium">Menunggu Bayar</p>
            </div>
          </div>

          <div className="bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-white">{stats.paidOrders + stats.processingOrders}</p>
              <p className="text-[11px] text-slate-400 font-medium">Dibayar / Diproses</p>
            </div>
          </div>

          <div className="bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Truck size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-white">{stats.shippedOrders}</p>
              <p className="text-[11px] text-slate-400 font-medium">Sedang Dikirim</p>
            </div>
          </div>

          <div className="bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00BFA5]/10 text-[#00BFA5]">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-white">{stats.completedOrders}</p>
              <p className="text-[11px] text-slate-400 font-medium">Pesanan Selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-[#14141E] border border-white/5 rounded-3xl p-6 xl:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#00BFA5]/10 p-2 rounded-xl">
                <TrendingUp size={22} className="text-[#00BFA5]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Penjualan 6 Bulan Terakhir</h2>
                <p className="text-xs text-[#2a3a3a]">Total Revenue Riil (Rp)</p>
              </div>
            </div>
            <div className="text-xs px-3 py-1.5 bg-[#00BFA5]/10 text-[#00BFA5] rounded-full font-medium">
              LIVE
            </div>
          </div>

          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="month"
                stroke="#ffffff30"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#ffffff30"
                fontSize={11}
                tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(1)}M`}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: '#1a1a24',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0, 191, 165, 0.15)'
                }}
              />
              <Line
                type="natural"
                dataKey="sales"
                stroke="#00BFA5"
                strokeWidth={3}
                dot={{ fill: '#00BFA5', r: 4 }}
                activeDot={{ r: 6, fill: '#00BFA5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-[#14141E] border border-white/5 rounded-3xl p-6 xl:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#00BFA5]/10 p-2 rounded-xl">
              <Package size={22} className="text-[#00BFA5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Top 5 Produk Terlaris</h2>
              <p className="text-xs text-[#2a3a3a]">Berdasarkan jumlah pcs pesanan terbayar</p>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <div className="h-75 flex flex-col items-center justify-center text-slate-500 text-sm">
              <Package size={36} className="mb-2 opacity-30 text-white" />
              <p>Belum ada produk yang terjual</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 25, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis
                  type="number"
                  stroke="#ffffff30"
                  fontSize={11}
                  tickFormatter={(v) => `${v} pcs`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#ffffff30"
                  fontSize={11}
                  width={120}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value} pcs`, 'Terjual']}
                  contentStyle={{
                    backgroundColor: '#1a1a24',
                    border: 'none',
                    borderRadius: '12px'
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="#00BFA5"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Decorative subtle grid (mirip Login) */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-[-1]"
        style={{
          backgroundImage: `linear-gradient(#00BFA5 1px, transparent 1px), linear-gradient(90deg, #00BFA5 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />
    </div>
  );
}
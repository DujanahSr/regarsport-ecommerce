/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Zap,
  DollarSign,
  Percent,
  Calendar,
  ArrowUpRight,
  ExternalLink,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    cancelledOrders: 0,
    todayRevenue: 0,
    todayOrders: 0,
    aov: 0,
    completionRate: 0,
  });

  const [salesPeriod, setSalesPeriod] = useState('6m'); // '7d' | '30d' | '6m' | '12m'
  const [multiPeriodSales, setMultiPeriodSales] = useState({
    '7d': [],
    '30d': [],
    '6m': [],
    '12m': [],
  });
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
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
          cancelledOrders: dashData.cancelledOrders || 0,
          todayRevenue: dashData.todayRevenue || 0,
          todayOrders: dashData.todayOrders || 0,
          aov: dashData.aov || 0,
          completionRate: dashData.completionRate || 0,
        });

        // Multi-period sales data
        setMultiPeriodSales({
          '7d': dashData.sales7d || [],
          '30d': dashData.sales30d || [],
          '6m': dashData.salesData || [
            { month: 'Jan', period: 'Jan', sales: 0 },
            { month: 'Feb', period: 'Feb', sales: 0 },
            { month: 'Mar', period: 'Mar', sales: 0 },
            { month: 'Apr', period: 'Apr', sales: 0 },
            { month: 'Mei', period: 'Mei', sales: 0 },
            { month: 'Jun', period: 'Jun', sales: 0 },
          ],
          '12m': dashData.sales12m || [],
        });

        // Donut status distribution
        if (Array.isArray(dashData.statusDistribution) && dashData.statusDistribution.length > 0) {
          setStatusDistribution(dashData.statusDistribution);
        } else {
          setStatusDistribution([
            { name: 'Lunas / Diproses', value: (dashData.paidOrders || 0) + (dashData.processingOrders || 0), color: '#00BFA5' },
            { name: 'Sedang Dikirim', value: dashData.shippedOrders || 0, color: '#8B5CF6' },
            { name: 'Selesai', value: dashData.completedOrders || 0, color: '#10B981' },
            { name: 'Menunggu Bayar', value: dashData.pendingOrders || 0, color: '#F59E0B' },
            { name: 'Dibatalkan', value: dashData.cancelledOrders || 0, color: '#EF4444' },
          ]);
        }

        if (Array.isArray(dashData.topProducts) && dashData.topProducts.length > 0) {
          setTopProducts(dashData.topProducts);
        } else {
          setTopProducts([]);
        }

        if (Array.isArray(dashData.recentOrders) && dashData.recentOrders.length > 0) {
          setRecentOrders(dashData.recentOrders);
        } else {
          setRecentOrders([]);
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

  if (loading) return <ScreenLoader label="Memuat dashboard analitik..." />;

  // Active sales data based on period
  const activeSalesData = multiPeriodSales[salesPeriod] || [];

  const mainKpiCards = [
    {
      label: 'Total Revenue',
      value: `Rp ${Number(stats.revenue).toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: 'text-[#00BFA5]',
      bg: 'from-[#00BFA5]/10 to-transparent',
      note: 'Total omzet riil terverifikasi'
    },
    {
      label: 'Average Order Value (AOV)',
      value: `Rp ${Number(stats.aov).toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'from-emerald-500/10 to-transparent',
      note: 'Rata-rata nominal per order lunas'
    },
    {
      label: 'Total Orders',
      value: stats.orders.toLocaleString('id-ID'),
      icon: ShoppingCart,
      color: 'text-purple-400',
      bg: 'from-purple-500/10 to-transparent',
      note: `${stats.completedOrders} selesai (${stats.completionRate}% rasio)`
    },
    {
      label: 'Omzet Hari Ini',
      value: `Rp ${Number(stats.todayRevenue).toLocaleString('id-ID')}`,
      icon: Zap,
      color: 'text-cyan-400',
      bg: 'from-cyan-500/10 to-transparent',
      note: `${stats.todayOrders} pesanan masuk hari ini`
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
      note: 'Member & pelanggan terdaftar'
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00BFA5]/20 blur-xl rounded-2xl" />
            <div className="relative bg-[#00BFA5]/10 border border-[#00BFA5]/30 p-3 rounded-2xl">
              <LayoutDashboard size={28} className="text-[#00BFA5]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-[-1px]">EXECUTIVE DASHBOARD</h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#00BFA5]/20 text-[#00BFA5] border border-[#00BFA5]/30">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[#7A8A8A] text-sm">
              Analisis performa finansial, volume penjualan, dan inventaris toko real-time.
            </p>
          </div>
        </div>

        {/* CSV Export Action */}
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="flex items-center gap-2 bg-[#14141E] border border-white/10 hover:border-[#00BFA5]/40 text-white hover:text-[#00BFA5] px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,191,165,0.15)] active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Download size={18} className={exporting ? "animate-bounce text-[#00BFA5]" : "text-[#00BFA5]"} />
          <span>{exporting ? "Mengunduh CSV..." : "Export Laporan CSV"}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {mainKpiCards.map((card, i) => (
          <div
            key={i}
            className="group relative bg-[#14141E] border border-white/5 rounded-2xl p-5 overflow-hidden hover:border-[#00BFA5]/30 transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 bg-linear-to-br ${card.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:border-[#00BFA5]/30 transition-colors">
                <card.icon size={22} className={card.color} />
              </div>
              <span className="text-[10px] font-black tracking-[1.5px] uppercase text-white/40">{card.label.split('(')[0]}</span>
            </div>

            <p className="text-2xl font-black text-white tracking-tight mb-1 truncate">
              {card.value}
            </p>
            <p className="text-[11px] text-[#00BFA5]/70 font-medium truncate">{card.note}</p>

            <div className="absolute bottom-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-[#00BFA5]/30 to-transparent" />
          </div>
        ))}
      </div>

      {/* Order Status Breakdown Bar */}
      <div className="bg-[#14141E] border border-white/5 rounded-3xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Status Pipeline Pesanan Pelanggan
          </h2>
          <span className="text-xs text-[#00BFA5] font-semibold">
            {stats.orders} Total Transaksi
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

          <div className="bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingUp size={18} className="rotate-180" />
            </div>
            <div>
              <p className="text-lg font-black text-white">{stats.cancelledOrders}</p>
              <p className="text-[11px] text-slate-400 font-medium">Dibatalkan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts: Sales Trend & Donut Status Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Sales Trend Line Chart (Span 2) */}
        <div className="xl:col-span-2 bg-[#14141E] border border-white/5 rounded-3xl p-6 xl:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#00BFA5]/10 p-2.5 rounded-xl">
                <TrendingUp size={22} className="text-[#00BFA5]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Tren Pertumbuhan Omzet Penjualan</h2>
                <p className="text-xs text-[#7A8A8A]">Grafik pendapatan riil pesanan terbayar</p>
              </div>
            </div>

            {/* Period Filter Tabs */}
            <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-xl gap-1">
              {[
                { key: '7d', label: '7 Hari' },
                { key: '30d', label: '30 Hari' },
                { key: '6m', label: '6 Bulan' },
                { key: '12m', label: '1 Tahun' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSalesPeriod(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    salesPeriod === tab.key
                      ? 'bg-[#00BFA5] text-black shadow-[0_0_15px_rgba(0,191,165,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={activeSalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="period"
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
                formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Omzet']}
                contentStyle={{
                  backgroundColor: '#1a1a24',
                  border: '1px solid rgba(0, 191, 165, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0, 191, 165, 0.15)'
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#00BFA5"
                strokeWidth={3}
                dot={{ fill: '#00BFA5', r: 4 }}
                activeDot={{ r: 6, fill: '#00BFA5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart: Order Status Distribution (Span 1) */}
        <div className="bg-[#14141E] border border-white/5 rounded-3xl p-6 xl:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-500/10 p-2.5 rounded-xl">
                <PieChartIcon size={22} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Rasio Status Pesanan</h2>
                <p className="text-xs text-[#7A8A8A]">Komposisi pesanan & tingkat konversi</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#00BFA5'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} pesanan`, name]}
                  contentStyle={{
                    backgroundColor: '#1a1a24',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Legend Badges */}
          <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
            {statusDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-white">
                  {item.value} <span className="text-slate-500 font-normal">({stats.orders > 0 ? Math.round((item.value / stats.orders) * 100) : 0}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top 5 Products & Live Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top 5 Products Bar Chart */}
        <div className="bg-[#14141E] border border-white/5 rounded-3xl p-6 xl:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#00BFA5]/10 p-2.5 rounded-xl">
              <Package size={22} className="text-[#00BFA5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Top 5 Produk Terlaris</h2>
              <p className="text-xs text-[#7A8A8A]">Volume penjualan tertinggi (pcs terbayar)</p>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
              <Package size={36} className="mb-2 opacity-30 text-white" />
              <p>Belum ada produk yang terjual</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
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
                  width={140}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value} pcs`, 'Terjual']}
                  contentStyle={{
                    backgroundColor: '#1a1a24',
                    border: '1px solid rgba(0, 191, 165, 0.2)',
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

        {/* Live Recent Transactions Feed */}
        <div className="bg-[#14141E] border border-white/5 rounded-3xl p-6 xl:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2.5 rounded-xl">
                  <CreditCard size={22} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Transaksi Pesanan Terbaru</h2>
                  <p className="text-xs text-[#7A8A8A]">Aktivitas pesanan live yang masuk ke sistem</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/orders')}
                className="flex items-center gap-1.5 text-xs text-[#00BFA5] hover:underline font-semibold cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ExternalLink size={13} />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
                <ShoppingCart size={36} className="mb-2 opacity-30 text-white" />
                <p>Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const statusColors = {
                    PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    SHIPPED: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                    COMPLETED: 'bg-[#00BFA5]/10 text-[#00BFA5] border-[#00BFA5]/30',
                    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                  };
                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate('/admin/orders')}
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/3 border border-white/5 hover:border-[#00BFA5]/30 hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white text-xs group-hover:bg-[#00BFA5]/20 group-hover:text-[#00BFA5] transition-colors">
                          {order.customerName ? order.customerName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm group-hover:text-[#00BFA5] transition-colors">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                              {order.shippingCourier || 'JNE'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {order.customerName} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-white text-sm">
                          Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[order.status] || 'bg-white/5 text-white'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative subtle grid background */}
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
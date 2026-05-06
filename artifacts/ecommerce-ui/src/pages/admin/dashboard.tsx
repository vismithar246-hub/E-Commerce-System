import React from "react";
import { AdminLayout } from "@/components/admin-layout";
import { 
  useGetDashboardStats, 
  useGetSalesTrend,
  useGetSalesByCategory,
  useGetInventoryStatus
} from "@workspace/api-client-react";
import { Package, ShoppingCart, DollarSign, Users, AlertTriangle, ListOrdered } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: salesTrendRaw, isLoading: trendLoading } = useGetSalesTrend({ days: 30 });
  const { data: categorySalesRaw, isLoading: categoryLoading } = useGetSalesByCategory();
  const { data: inventoryStatusRaw, isLoading: inventoryLoading } = useGetInventoryStatus();

  const salesTrend = Array.isArray(salesTrendRaw) ? salesTrendRaw : [];
  const categorySales = Array.isArray(categorySalesRaw) ? categorySalesRaw : [];
  const inventoryStatus = Array.isArray(inventoryStatusRaw) ? inventoryStatusRaw : [];

  const COLORS = ['#8a2be2', '#4169e1', '#00ced1', '#32cd32', '#ff8c00', '#ff1493'];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-16">
        <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">High-level system overview and metrics.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            title="Total Revenue" 
            value={stats ? `$${stats.totalRevenue.toFixed(2)}` : null} 
            icon={DollarSign} 
            isLoading={statsLoading} 
            trend="+12%"
          />
          <StatCard 
            title="Total Orders" 
            value={stats?.totalOrders} 
            icon={ShoppingCart} 
            isLoading={statsLoading} 
          />
          <StatCard 
            title="Total Customers" 
            value={stats?.totalCustomers} 
            icon={Users} 
            isLoading={statsLoading} 
          />
          <StatCard 
            title="Total Assets" 
            value={stats?.totalProducts} 
            icon={Package} 
            isLoading={statsLoading} 
          />
          <StatCard 
            title="Pending Orders" 
            value={stats?.pendingOrders} 
            icon={ListOrdered} 
            isLoading={statsLoading} 
            alert={stats && stats.pendingOrders > 0}
          />
          <StatCard 
            title="Low Stock Alerts" 
            value={stats?.lowStockCount} 
            icon={AlertTriangle} 
            isLoading={statsLoading} 
            alert={stats && stats.lowStockCount > 0}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Sales Trend (30 Days)
            </h3>
            <div className="h-72 w-full">
              {trendLoading ? (
                <Skeleton className="w-full h-full bg-white/5 rounded-lg" />
              ) : salesTrend && salesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.5)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(10,10,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      labelFormatter={(val) => new Date(val).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="totalRevenue" stroke="#8a2be2" strokeWidth={3} dot={{ r: 4, fill: '#4169e1', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-white/5 rounded-lg">No data available</div>
              )}
            </div>
          </div>

          <div className="glass-panel border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Sales by Category
            </h3>
            <div className="h-72 w-full">
              {categoryLoading ? (
                <Skeleton className="w-full h-full bg-white/5 rounded-lg" />
              ) : categorySales && categorySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categorySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis 
                      dataKey="category" 
                      stroke="rgba(255,255,255,0.5)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(10,10,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="totalRevenue" name="Revenue" radius={[4, 4, 0, 0]}>
                      {categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-white/5 rounded-lg">No data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Inventory Status
            </h3>
            <div className="h-72 w-full">
              {inventoryLoading ? (
                <Skeleton className="w-full h-full bg-white/5 rounded-lg" />
              ) : inventoryStatus && inventoryStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="totalStock"
                      nameKey="category"
                    >
                      {inventoryStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'rgba(10,10,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-white/5 rounded-lg">No data available</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  isLoading, 
  trend, 
  alert 
}: { 
  title: string; 
  value: React.ReactNode; 
  icon: any; 
  isLoading: boolean;
  trend?: string;
  alert?: boolean;
}) {
  return (
    <div className={`p-6 rounded-xl border glass-panel transition-colors flex flex-col gap-4 ${alert ? 'border-destructive/50 bg-destructive/5' : 'border-white/10 bg-white/[0.02]'}`}>
      <div className="flex justify-between items-start">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${alert ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        {isLoading ? (
          <Skeleton className="h-8 w-24 bg-white/5" />
        ) : (
          <div className="flex items-baseline gap-3">
            <div className={`text-3xl font-bold font-mono ${alert ? 'text-destructive' : 'glow-text'}`}>
              {value !== undefined && value !== null ? value : '-'}
            </div>
            {trend && <div className="text-xs text-green-400 font-mono bg-green-400/10 px-2 py-0.5 rounded">{trend}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

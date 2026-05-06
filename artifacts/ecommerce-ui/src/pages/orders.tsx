import React, { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useListOrders } from "@workspace/api-client-react";
import { Search, ListOrdered, ChevronRight, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Orders() {
  const [search, setSearch] = useState("");
  
  const { data: ordersRaw, isLoading } = useListOrders();
  const orders = Array.isArray(ordersRaw) ? ordersRaw : [];

  const filteredOrders = orders.filter(order => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.orderId.toString().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string, label: string }> = {
      'pending': { className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', label: 'PENDING' },
      'processing': { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'PROCESSING' },
      'shipped': { className: 'bg-primary/20 text-primary border-primary/30', label: 'SHIPPED' },
      'delivered': { className: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'DELIVERED' },
      'cancelled': { className: 'bg-destructive/20 text-destructive border-destructive/30', label: 'CANCELLED' },
    };

    const config = statusMap[status.toLowerCase()] || { className: 'bg-white/10 text-white', label: status.toUpperCase() };

    return (
      <Badge variant="outline" className={`${config.className} font-mono text-[10px] uppercase tracking-wider px-2 py-0.5`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-16">
        <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <ListOrdered className="w-8 h-8 text-primary" />
            Transaction Log
          </h1>
          <p className="text-muted-foreground">Global record of all system transfers and fulfilled requests.</p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by ID, Entity, or Status..." 
            className="pl-9 bg-black/20 border-white/10 focus-visible:border-primary font-mono text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="glass-panel border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg bg-white/5" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 bg-white/5" />
                    <Skeleton className="h-4 w-48 bg-white/5" />
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <Skeleton className="h-8 w-24 bg-white/5" />
                  <Skeleton className="h-8 w-20 bg-white/5" />
                </div>
              </div>
            ))
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center border border-white/10 border-dashed rounded-xl">
              <ListOrdered className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No logs found</h3>
              <p className="text-muted-foreground max-w-md">
                No transactions match the current query parameters.
              </p>
            </div>
          ) : filteredOrders.map((order) => (
            <div key={order.orderId} className="glass-panel border border-white/10 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-6 justify-between group hover:border-primary/30 transition-colors">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-lg font-bold text-white glow-text">#{order.orderId.toString().padStart(6, '0')}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{order.customerName}</span> • {format(new Date(order.orderDate), "MMM d, yyyy HH:mm")}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0 mt-2 sm:mt-0">
                <div className="flex flex-col sm:items-end">
                  <div className="text-xs text-muted-foreground font-mono mb-1 uppercase tracking-wider">Total Value</div>
                  <div className="font-mono text-xl font-bold text-primary">${order.totalAmount.toFixed(2)}</div>
                </div>
                <div className="flex flex-col items-end pl-6 border-l border-white/10">
                  <div className="text-xs text-muted-foreground font-mono mb-1 uppercase tracking-wider">Items</div>
                  <div className="font-mono font-bold">{Array.isArray(order.items) ? order.items.length : 0}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

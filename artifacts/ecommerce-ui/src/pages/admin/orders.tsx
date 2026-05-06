import React, { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { 
  useListOrders, 
  useUpdateOrderStatus,
  getListOrdersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ChevronDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
type UpdateOrderStatusBodyStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: ordersRaw, isLoading } = useListOrders();
  const orders = Array.isArray(ordersRaw) ? ordersRaw : [];
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (orderId: number, status: UpdateOrderStatusBodyStatus) => {
    try {
      await updateStatus.mutateAsync({ orderId, data: { status } });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      toast.success("Status Updated", { description: `Order #${orderId} status changed to ${status}.` });
    } catch (err) {
      toast.error("Update Failed", { description: "Could not change order status." });
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'pending': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
      'processing': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      'shipped': 'text-primary bg-primary/10 border-primary/30',
      'delivered': 'text-green-400 bg-green-500/10 border-green-500/30',
      'cancelled': 'text-destructive bg-destructive/10 border-destructive/30',
    };
    return map[status.toLowerCase()] || 'text-white bg-white/10 border-white/30';
  };

  const statusOptions: UpdateOrderStatusBodyStatus[] = [
    "pending", "processing", "shipped", "delivered", "cancelled"
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Queue</h1>
            <p className="text-muted-foreground">Manage and process customer transfer requests.</p>
          </div>
          
          <Button variant="outline" className="border-white/20 bg-white/5" onClick={() => queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() })}>
            <RefreshCw className="w-4 h-4 mr-2" /> REFRESH
          </Button>
        </div>

        <div className="glass-panel border border-white/10 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-[100px] font-mono text-xs">ORDER ID</TableHead>
                <TableHead>TIMESTAMP</TableHead>
                <TableHead>ENTITY (CUSTOMER)</TableHead>
                <TableHead className="text-right">ITEMS</TableHead>
                <TableHead className="text-right">TOTAL VALUE</TableHead>
                <TableHead className="text-right w-[150px]">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-white/10">
                    <TableCell><Skeleton className="h-4 w-16 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40 bg-white/5" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 bg-white/5 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 bg-white/5 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 bg-white/5 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No orders exist in the system.
                  </TableCell>
                </TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.orderId} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell className="font-mono font-bold text-white glow-text">
                    #{order.orderId.toString().padStart(6, '0')}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {format(new Date(order.orderDate), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.customerName}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {order.items?.length || 0}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    ${order.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`w-full justify-between h-8 px-2 font-mono text-[10px] uppercase tracking-wider ${getStatusColor(order.status)}`}
                          disabled={updateStatus.isPending}
                        >
                          {order.status}
                          <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[150px] glass-panel border-white/10 bg-background">
                        {statusOptions.map((status) => (
                          <DropdownMenuItem 
                            key={status}
                            onClick={() => handleStatusChange(order.orderId, status)}
                            className="font-mono text-xs uppercase cursor-pointer hover:bg-white/10 focus:bg-white/10"
                            disabled={order.status === status}
                          >
                            {status}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}

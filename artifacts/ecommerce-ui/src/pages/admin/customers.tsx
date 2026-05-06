import React, { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { useListCustomers, useGetTopCustomers } from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, User, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  
  const { data: customers, isLoading: customersLoading } = useListCustomers({ search });
  const { data: topCustomers, isLoading: topLoading } = useGetTopCustomers({ limit: 5 });

  const topIds = topCustomers?.map(c => c.customerId) || [];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-16">
        <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold tracking-tight">Entity Directory</h1>
          <p className="text-muted-foreground">Manage customer records and identity data.</p>
        </div>

        {/* Top Customers Highlights */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            High Value Targets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topLoading ? (
              Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl bg-white/5 border border-white/10" />
              ))
            ) : topCustomers?.map((top) => (
              <div key={top.customerId} className="glass-panel border border-primary/30 bg-primary/5 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/20 rounded-full blur-xl pointer-events-none" />
                <div className="font-bold truncate">{top.name}</div>
                <div className="text-xs text-muted-foreground truncate">{top.email}</div>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-primary/10">
                  <div className="text-xs font-mono text-primary">{top.totalOrders} orders</div>
                  <div className="font-mono font-bold text-white glow-text">${top.totalSpent.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Query entities by name or email..." 
              className="pl-9 bg-black/20 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="glass-panel border border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-[100px] font-mono text-xs">ENTITY ID</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>COMM LINK (EMAIL)</TableHead>
                  <TableHead>SECURE CHANNEL (PHONE)</TableHead>
                  <TableHead>DROP VECTOR (ADDRESS)</TableHead>
                  <TableHead className="text-right w-[100px]">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customersLoading ? (
                  Array(8).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      <TableCell><Skeleton className="h-4 w-12 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48 bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 bg-white/5 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : customers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No entities match the current query.
                    </TableCell>
                  </TableRow>
                ) : customers?.map((customer) => (
                  <TableRow key={customer.customerId} className="border-white/10 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      E-{customer.customerId.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell className="font-bold flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                      {customer.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary">
                      {customer.email}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {customer.phone || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[200px]" title={customer.address}>
                      {customer.address || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {topIds.includes(customer.customerId) ? (
                        <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 font-mono text-[10px] uppercase">
                          VIP
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-white/20 text-muted-foreground bg-white/5 font-mono text-[10px] uppercase">
                          STANDARD
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

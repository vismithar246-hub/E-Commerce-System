import React, { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { 
  useListInventoryLogs, 
  useUpdateInventory,
  useListProducts,
  getListInventoryLogsQueryKey,
  getListProductsQueryKey
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { Database, AlertTriangle, ArrowRight, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminInventory() {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<number | "all">("all");
  
  const { data: logs, isLoading: logsLoading } = useListInventoryLogs({ 
    productId: selectedProductId === "all" ? undefined : selectedProductId 
  });
  
  const { data: products } = useListProducts();
  const updateInventory = useUpdateInventory();

  const [updateForm, setUpdateForm] = useState({
    productId: "",
    newStock: ""
  });

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateForm.productId || !updateForm.newStock) return;

    try {
      await updateInventory.mutateAsync({
        data: {
          productId: parseInt(updateForm.productId, 10),
          newStock: parseInt(updateForm.newStock, 10)
        }
      });
      
      queryClient.invalidateQueries({ queryKey: getListInventoryLogsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      
      toast.success("Inventory Updated", { description: "Stock levels modified successfully." });
      setUpdateForm({ productId: "", newStock: "" });
    } catch (error) {
      toast.error("Update Failed", { description: "Could not modify stock levels." });
    }
  };

  const lowStockProducts = products?.filter(p => p.isLowStock) || [];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-16">
        <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold tracking-tight">Stock Logistics</h1>
          <p className="text-muted-foreground">Manual overrides and historical tracking of inventory changes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alerts */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-orange-400">
              <AlertTriangle className="w-5 h-5" />
              Critical Alerts
            </h2>
            <div className="glass-panel border border-orange-500/30 bg-orange-500/5 rounded-xl overflow-hidden flex flex-col h-[400px]">
              {lowStockProducts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground p-6 text-center">
                  All systems nominal. No low stock detected.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {lowStockProducts.map(product => (
                    <div key={product.productId} className="bg-black/40 border border-orange-500/20 rounded-lg p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-sm truncate pr-2">{product.productName}</div>
                        <div className="font-mono text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded shrink-0">
                          {product.stockQuantity} LEFT
                        </div>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">ID: {product.productId}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Manual Update Form */}
            <h2 className="text-xl font-bold mt-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Manual Override
            </h2>
            <div className="glass-panel border border-white/10 rounded-xl p-5">
              <form onSubmit={handleUpdateStock} className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Asset</Label>
                  <Select 
                    value={updateForm.productId} 
                    onValueChange={(val) => setUpdateForm(prev => ({...prev, productId: val}))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 font-mono text-xs">
                      <SelectValue placeholder="Select Asset ID" />
                    </SelectTrigger>
                    <SelectContent className="glass-panel border-white/10">
                      {products?.map(p => (
                        <SelectItem key={p.productId} value={p.productId.toString()} className="font-mono text-xs">
                          {p.productId.toString().padStart(4, '0')} - {p.productName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Absolute New Quantity</Label>
                  <Input 
                    type="number" 
                    min="0"
                    required
                    value={updateForm.newStock}
                    onChange={(e) => setUpdateForm(prev => ({...prev, newStock: e.target.value}))}
                    className="bg-white/5 border-white/10 font-mono"
                    placeholder="Enter total final units"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full glow-text font-bold tracking-widest mt-2"
                  disabled={updateInventory.isPending || !updateForm.productId || !updateForm.newStock}
                >
                  EXECUTE OVERRIDE
                </Button>
              </form>
            </div>
          </div>

          {/* Activity Log */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Activity Log</h2>
              <div className="w-64">
                <Select 
                  value={selectedProductId.toString()} 
                  onValueChange={(val) => setSelectedProductId(val === "all" ? "all" : parseInt(val, 10))}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 font-mono text-xs h-8">
                    <SelectValue placeholder="Filter by Asset" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel border-white/10">
                    <SelectItem value="all" className="font-mono text-xs">All Assets</SelectItem>
                    {products?.map(p => (
                      <SelectItem key={p.productId} value={p.productId.toString()} className="font-mono text-xs">
                        {p.productId.toString().padStart(4, '0')} - {p.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="glass-panel border border-white/10 rounded-xl overflow-hidden flex-1 min-h-[500px] flex flex-col">
              <div className="overflow-x-auto flex-1">
                <Table>
                  <TableHeader className="bg-black/40 sticky top-0 z-10 backdrop-blur-md">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="w-[180px] font-mono text-xs">TIMESTAMP</TableHead>
                      <TableHead className="font-mono text-xs">ASSET ID</TableHead>
                      <TableHead>ASSET NAME</TableHead>
                      <TableHead className="text-center">DELTA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      Array(10).fill(0).map((_, i) => (
                        <TableRow key={i} className="border-white/10">
                          <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12 bg-white/5" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48 bg-white/5" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-32 bg-white/5 mx-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : logs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          No log entries found.
                        </TableCell>
                      </TableRow>
                    ) : logs?.map((log) => {
                      const diff = log.stockAfter - log.stockBefore;
                      const isIncrease = diff > 0;
                      const isDecrease = diff < 0;
                      
                      return (
                        <TableRow key={log.logId} className="border-white/10 hover:bg-white/5 transition-colors">
                          <TableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                            {format(new Date(log.updatedAt), "yyyy-MM-dd HH:mm:ss")}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-primary glow-text">
                            {log.productId.toString().padStart(6, '0')}
                          </TableCell>
                          <TableCell className="font-medium truncate max-w-[200px]" title={log.productName}>
                            {log.productName}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2 font-mono text-sm">
                              <span className="text-muted-foreground w-8 text-right">{log.stockBefore}</span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className={`w-8 font-bold ${isIncrease ? 'text-green-400' : isDecrease ? 'text-orange-400' : 'text-white'}`}>
                                {log.stockAfter}
                              </span>
                              <div className="flex items-center w-16 ml-2">
                                {isIncrease ? (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 px-1 py-0 rounded-sm text-[10px] flex items-center gap-0.5">
                                    <ArrowUpRight className="w-2.5 h-2.5" /> +{diff}
                                  </Badge>
                                ) : isDecrease ? (
                                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-1 py-0 rounded-sm text-[10px] flex items-center gap-0.5">
                                    <ArrowDownRight className="w-2.5 h-2.5" /> {diff}
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

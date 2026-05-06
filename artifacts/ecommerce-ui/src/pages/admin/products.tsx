import React, { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { 
  useListProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct,
  getListProductsQueryKey,
  useListCategories
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
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit, Trash2, AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: productsRaw, isLoading } = useListProducts({ search });
  const products = Array.isArray(productsRaw) ? productsRaw : [];
  
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      productName: formData.get("productName") as string,
      category: formData.get("category") as string,
      price: parseFloat(formData.get("price") as string),
      stockQuantity: parseInt(formData.get("stockQuantity") as string, 10),
      description: formData.get("description") as string,
    };

    try {
      await createProduct.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast.success("Asset Created", { description: `${data.productName} added to database.` });
      setIsAddOpen(false);
    } catch (err) {
      toast.error("Creation Failed", { description: "Could not create new asset." });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      productName: formData.get("productName") as string,
      category: formData.get("category") as string,
      price: parseFloat(formData.get("price") as string),
      stockQuantity: parseInt(formData.get("stockQuantity") as string, 10),
      description: formData.get("description") as string,
    };

    try {
      await updateProduct.mutateAsync({ productId: editingProduct.productId, data });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast.success("Asset Updated", { description: `${data.productName} modifications saved.` });
      setEditingProduct(null);
    } catch (err) {
      toast.error("Update Failed", { description: "Could not save modifications." });
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to permanently delete this asset?")) return;
    try {
      await deleteProduct.mutateAsync({ productId });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast.success("Asset Purged", { description: `Product ID ${productId} removed from database.` });
    } catch (err) {
      toast.error("Purge Failed", { description: "Could not remove asset." });
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Management</h1>
            <p className="text-muted-foreground">Add, modify, and monitor inventory items.</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="glow-text font-bold">
                <Plus className="w-4 h-4 mr-2" /> NEW ASSET
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 bg-background text-foreground sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Initialize New Asset</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Asset Designation (Name)</Label>
                  <Input name="productName" required className="bg-white/5 border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Classification (Category)</Label>
                    <Input name="category" required className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Value ($)</Label>
                    <Input name="price" type="number" step="0.01" min="0" required className="bg-white/5 border-white/10 font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Initial Stock Quantity</Label>
                  <Input name="stockQuantity" type="number" min="0" required className="bg-white/5 border-white/10 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Detailed Specifications (Description)</Label>
                  <Textarea name="description" required className="bg-white/5 border-white/10 min-h-[100px]" />
                </div>
                <DialogFooter className="pt-4 border-t border-white/10 mt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>CANCEL</Button>
                  <Button type="submit" disabled={createProduct.isPending}>INITIALIZE</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Query assets..." 
            className="pl-9 bg-black/20 border-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="glass-panel border border-white/10 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-[100px] font-mono text-xs">ID</TableHead>
                <TableHead>ASSET DESIGNATION</TableHead>
                <TableHead>CATEGORY</TableHead>
                <TableHead className="text-right">VALUE</TableHead>
                <TableHead className="text-right">STOCK</TableHead>
                <TableHead className="text-right w-[100px]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-white/10">
                    <TableCell><Skeleton className="h-4 w-12 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 bg-white/5 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12 bg-white/5 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 bg-white/5 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No assets found in database.
                  </TableCell>
                </TableRow>
              ) : products.map((product) => (
                <TableRow key={product.productId} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {product.productId.toString().padStart(6, '0')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.productName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/20 bg-black/40 text-[10px] uppercase font-mono tracking-wider">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary glow-text">
                    ${product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`font-mono font-bold ${
                        product.stockQuantity === 0 ? 'text-destructive' : 
                        product.isLowStock ? 'text-orange-400' : 'text-green-400'
                      }`}>
                        {product.stockQuantity}
                      </span>
                      {product.isLowStock && <AlertTriangle className="w-3 h-3 text-orange-400" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => setEditingProduct(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.productId)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Edit Modal */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="glass-panel border-white/10 bg-background text-foreground sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Modify Asset Parameters</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Asset Designation (Name)</Label>
                  <Input name="productName" defaultValue={editingProduct.productName} required className="bg-white/5 border-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Classification (Category)</Label>
                    <Input name="category" defaultValue={editingProduct.category} required className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Value ($)</Label>
                    <Input name="price" type="number" step="0.01" min="0" defaultValue={editingProduct.price} required className="bg-white/5 border-white/10 font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Stock Quantity</Label>
                  <Input name="stockQuantity" type="number" min="0" defaultValue={editingProduct.stockQuantity} required className="bg-white/5 border-white/10 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Detailed Specifications (Description)</Label>
                  <Textarea name="description" defaultValue={editingProduct.description} required className="bg-white/5 border-white/10 min-h-[100px]" />
                </div>
                <DialogFooter className="pt-4 border-t border-white/10 mt-4">
                  <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)}>CANCEL</Button>
                  <Button type="submit" disabled={updateProduct.isPending}>SAVE MODIFICATIONS</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

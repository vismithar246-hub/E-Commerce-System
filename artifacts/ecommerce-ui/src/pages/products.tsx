import React, { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Search, Package, AlertTriangle, Filter, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Products() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  // Simple debounce
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: products, isLoading: isLoadingProducts } = useListProducts({
    search: debouncedSearch || undefined,
    category: selectedCategory || undefined,
  });

  const { data: categories } = useListCategories();

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Product Database
          </h1>
          <p className="text-muted-foreground">Browse and search available inventory assets.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between glass-panel p-4 rounded-xl border border-white/10">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Query product name or description..." 
              className="pl-9 bg-black/20 border-white/10 focus-visible:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            <Filter className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
            <Badge 
              variant={selectedCategory === "" ? "default" : "outline"} 
              className={`cursor-pointer whitespace-nowrap ${selectedCategory === "" ? "glow-text" : "border-white/20 hover:border-primary/50"}`}
              onClick={() => setSelectedCategory("")}
            >
              All Types
            </Badge>
            {categories?.map(category => (
              <Badge 
                key={category}
                variant={selectedCategory === category ? "default" : "outline"} 
                className={`cursor-pointer whitespace-nowrap ${selectedCategory === category ? "glow-text" : "border-white/20 hover:border-primary/50"}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {(selectedCategory || debouncedSearch) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Active filters:</span>
            {debouncedSearch && (
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1">
                Search: "{debouncedSearch}"
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearch("")} />
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1">
                Category: {selectedCategory}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedCategory("")} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setSearch(""); setSelectedCategory(""); }}>
              Clear All
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoadingProducts ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 p-4 rounded-xl border border-white/10 glass-panel">
                <Skeleton className="h-48 w-full rounded-lg bg-white/5" />
                <Skeleton className="h-6 w-3/4 bg-white/5" />
                <Skeleton className="h-4 w-1/2 bg-white/5" />
                <div className="flex justify-between mt-2">
                  <Skeleton className="h-6 w-16 bg-white/5" />
                  <Skeleton className="h-6 w-20 bg-white/5" />
                </div>
              </div>
            ))
          ) : products?.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border border-white/10 border-dashed rounded-xl">
              <Package className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No matching assets</h3>
              <p className="text-muted-foreground max-w-md">
                Your query returned zero results. Adjust filters or search terms to find available products.
              </p>
            </div>
          ) : products?.map((product) => (
            <Link key={product.productId} href={`/products/${product.productId}`}>
              <div className="group p-4 rounded-xl border border-white/10 glass-panel hover:border-primary/50 transition-all hover-elevate cursor-pointer h-full flex flex-col relative overflow-hidden">
                {product.isLowStock && (
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-destructive/20 border border-destructive/50 text-destructive text-[10px] uppercase font-bold tracking-wider rounded-md backdrop-blur-md">
                    <AlertTriangle className="w-3 h-3" />
                    Low Stock
                  </div>
                )}
                
                <div className="aspect-square mb-4 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
                  <Package className="w-20 h-20 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                
                <div className="flex flex-col flex-1">
                  <div className="text-xs font-mono text-primary mb-1">{product.category}</div>
                  <h3 className="font-semibold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                    {product.productName}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {product.description}
                  </p>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/10">
                    <div className="font-mono text-xl font-bold">${product.price.toFixed(2)}</div>
                    <div className="flex flex-col items-end">
                      <div className={`text-xs font-mono font-medium ${product.stockQuantity === 0 ? 'text-destructive' : product.isLowStock ? 'text-orange-400' : 'text-green-400'}`}>
                        {product.stockQuantity} units
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">in stock</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}

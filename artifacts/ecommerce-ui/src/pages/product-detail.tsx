import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetProduct } from "@workspace/api-client-react";
import { useCart } from "@/hooks/use-cart";
import { getGetProductQueryKey } from "@workspace/api-client-react";
import { 
  Package, 
  ArrowLeft, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle2, 
  Minus, 
  Plus 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:productId");
  const productId = parseInt(params?.productId || "0");
  
  const [quantity, setQuantity] = useState(1);
  const addItem = useCart((state) => state.addItem);

  const { data: product, isLoading, isError } = useGetProduct(productId, {
    query: {
      enabled: !!productId && productId > 0,
      queryKey: getGetProductQueryKey(productId)
    }
  });

  if (isError) {
    return (
      <Layout>
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Asset Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested product data could not be retrieved from the mainframe.</p>
          <Link href="/products">
            <Button variant="outline" className="border-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Database
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    if (!product) return;
    
    addItem({
      productId: product.productId,
      productName: product.productName,
      price: product.price,
      stockQuantity: product.stockQuantity
    }, quantity);
    
    toast.success("Asset Acquired", {
      description: `${quantity}x ${product.productName} added to local storage buffer.`,
      icon: <ShoppingCart className="w-4 h-4" />
    });
    
    // Reset quantity after adding
    setQuantity(1);
  };

  const increment = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(q => q + 1);
    }
  };

  const decrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 pb-16">
        <Link href="/products">
          <Button variant="ghost" size="sm" className="w-fit text-muted-foreground hover:text-white mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Database
          </Button>
        </Link>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl bg-white/5" />
            <div className="flex flex-col gap-6 pt-4">
              <Skeleton className="h-8 w-32 bg-white/5" />
              <Skeleton className="h-12 w-3/4 bg-white/5" />
              <Skeleton className="h-8 w-24 bg-white/5" />
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-full bg-white/5" />
                <Skeleton className="h-4 w-full bg-white/5" />
                <Skeleton className="h-4 w-2/3 bg-white/5" />
              </div>
              <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                <Skeleton className="h-12 w-full bg-white/5" />
              </div>
            </div>
          </div>
        ) : product ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Visual */}
            <div className="aspect-square rounded-2xl border border-white/10 glass-panel flex items-center justify-center p-12 relative overflow-hidden bg-black/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <Package className="w-full h-full text-white/5" strokeWidth={0.5} />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <div className="px-3 py-1 bg-black/40 border border-white/10 rounded backdrop-blur-md text-xs font-mono text-muted-foreground">
                  ID: {product.productId.toString().padStart(6, '0')}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <Badge variant="outline" className="w-fit border-primary/30 text-primary bg-primary/10 mb-4 px-3 py-1 font-mono uppercase tracking-wider">
                {product.category}
              </Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {product.productName}
              </h1>
              
              <div className="text-3xl font-mono font-bold glow-text text-white mb-6">
                ${product.price.toFixed(2)}
              </div>

              <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed mb-8">
                <p>{product.description}</p>
              </div>

              <div className="glass-panel border border-white/10 rounded-xl p-6 flex flex-col gap-6 bg-white/[0.02]">
                {/* Stock Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {product.stockQuantity === 0 ? (
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center text-destructive border border-destructive/30">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    ) : product.isLowStock ? (
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/30">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium">Availability Status</div>
                      <div className={`text-xs font-mono ${
                        product.stockQuantity === 0 ? 'text-destructive' : 
                        product.isLowStock ? 'text-orange-400' : 'text-green-400'
                      }`}>
                        {product.stockQuantity === 0 ? 'OUT OF STOCK' : 
                         `${product.stockQuantity} UNITS REMAINING`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-white/10" />

                {/* Action Area */}
                {product.stockQuantity > 0 ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center border border-white/20 rounded-md bg-black/40 w-fit">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-none h-12 w-12 text-muted-foreground hover:text-white"
                        onClick={decrement}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <div className="w-12 text-center font-mono font-bold text-lg">
                        {quantity}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-none h-12 w-12 text-muted-foreground hover:text-white"
                        onClick={increment}
                        disabled={quantity >= product.stockQuantity}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button 
                      size="lg" 
                      className="flex-1 h-12 text-base glow-text font-bold tracking-wide"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      INITIALIZE TRANSFER
                    </Button>
                  </div>
                ) : (
                  <Button size="lg" variant="destructive" className="w-full h-12" disabled>
                    INSUFFICIENT RESOURCES
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

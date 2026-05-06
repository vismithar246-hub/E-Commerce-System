import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { useCreateOrder, useCreateCustomer, useListCustomers } from "@workspace/api-client-react";
import { ShoppingCart, ArrowRight, Trash2, Package, ShieldCheck, ArrowLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Cart() {
  const [location, setLocation] = useLocation();
  const cartItems = useCart((state) => state.items);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const clearCart = useCart((state) => state.clearCart);
  const cartTotal = useCart((state) => state.getCartTotal());

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const { data: existingCustomers } = useListCustomers({ search: customerInfo.email });
  const createCustomer = useCreateCustomer();
  const createOrder = useCreateOrder();
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    
    try {
      setIsProcessing(true);
      
      // 1. Check if customer exists by email, or create new
      let customerId = existingCustomers?.find(c => c.email === customerInfo.email)?.customerId;
      
      if (!customerId) {
        const newCustomer = await createCustomer.mutateAsync({
          data: customerInfo
        });
        customerId = newCustomer.customerId;
      }
      
      // 2. Create order
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));
      
      const order = await createOrder.mutateAsync({
        data: {
          customerId,
          items: orderItems
        }
      });
      
      // 3. Clear cart and redirect
      clearCart();
      toast.success("Transaction Complete", {
        description: `Order #${order.orderId} processed successfully.`
      });
      setLocation("/orders");
      
    } catch (error) {
      console.error(error);
      toast.error("Transaction Failed", {
        description: "An error occurred while processing your request."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 text-center border border-white/10 border-dashed rounded-2xl glass-panel">
          <ShoppingCart className="w-20 h-20 text-muted-foreground opacity-20 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Local Buffer Empty</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            No assets currently queued for transfer. Browse the database to acquire inventory.
          </p>
          <Link href="/products">
            <Button size="lg" className="glow-text tracking-wide font-bold">
              ACCESS DATABASE <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-16">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <ShoppingCart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Transfer Protocol</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="font-semibold text-lg">Queued Assets ({cartItems.length})</h2>
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                Purge All
              </Button>
            </div>
            
            <div className="flex flex-col gap-3">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex flex-col sm:flex-row items-center gap-4 p-4 glass-panel border border-white/10 rounded-xl relative overflow-hidden group">
                  <div className="absolute inset-y-0 left-0 w-1 bg-primary opacity-50" />
                  
                  <div className="w-16 h-16 rounded bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                    <Link href={`/products/${item.productId}`} className="font-bold text-lg truncate hover:text-primary transition-colors w-full sm:w-auto">
                      {item.productName}
                    </Link>
                    <div className="text-sm font-mono text-muted-foreground mt-1">
                      ID: {item.productId.toString().padStart(6, '0')}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end items-center gap-3 shrink-0">
                    <div className="font-mono text-xl font-bold text-white glow-text">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-white/20 rounded bg-black/40 h-8">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-white disabled:opacity-30 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="w-8 text-center font-mono text-sm border-x border-white/10 h-full flex items-center justify-center">
                          {item.quantity}
                        </div>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stockQuantity}
                          className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-white disabled:opacity-30 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItem(item.productId)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Link href="/products" className="mt-4">
              <Button variant="outline" className="w-full border-white/10 border-dashed hover:border-primary/50 text-muted-foreground hover:text-white bg-transparent h-14">
                <Plus className="w-4 h-4 mr-2" /> Add More Assets
              </Button>
            </Link>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 glass-panel border border-white/10 rounded-xl p-6 flex flex-col gap-6 bg-black/40">
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Identity Verification</h2>
              </div>
              
              <form onSubmit={handlePlaceOrder} className="flex flex-col gap-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-mono text-muted-foreground uppercase">Target Designation</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      required 
                      value={customerInfo.name} 
                      onChange={handleInputChange} 
                      className="bg-white/5 border-white/10 font-medium"
                      placeholder="Entity Name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-mono text-muted-foreground uppercase">Comm Link (Email)</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      value={customerInfo.email} 
                      onChange={handleInputChange} 
                      className="bg-white/5 border-white/10 font-mono"
                      placeholder="user@network.local"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-mono text-muted-foreground uppercase">Secure Channel (Phone)</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel" 
                      required 
                      value={customerInfo.phone} 
                      onChange={handleInputChange} 
                      className="bg-white/5 border-white/10 font-mono"
                      placeholder="+1 (000) 000-0000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs font-mono text-muted-foreground uppercase">Drop Coordinates (Address)</Label>
                    <Input 
                      id="address" 
                      name="address" 
                      required 
                      value={customerInfo.address} 
                      onChange={handleInputChange} 
                      className="bg-white/5 border-white/10"
                      placeholder="Physical Location Vector"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 mt-2 space-y-3">
                  <div className="flex justify-between text-sm text-muted-foreground font-mono">
                    <span>SUBTOTAL</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground font-mono">
                    <span>PROCESSING FEE</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/5">
                    <span>TOTAL</span>
                    <span className="font-mono text-primary glow-text">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 mt-4 font-bold tracking-widest text-sm" 
                  disabled={isProcessing}
                >
                  {isProcessing ? "PROCESSING..." : "AUTHORIZE TRANSFER"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

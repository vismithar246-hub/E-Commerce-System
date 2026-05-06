import React from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Home, ListOrdered, Shield } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const cartCount = useCart((state) => state.getCartCount());

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground dark">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 glass-panel">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight gradient-text">NEXUS</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              href="/products" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location === '/products' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Products
            </Link>
            <Link 
              href="/orders" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location === '/orders' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Orders
            </Link>
            <Link 
              href="/admin" 
              className={`text-sm font-medium flex items-center gap-1 transition-colors hover:text-primary ${location.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          </nav>

          <div className="flex items-center">
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon" className="hover:bg-white/5 rounded-full">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-white/10 glass-panel mt-auto">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="font-semibold text-foreground tracking-widest">NEXUS COMMAND</span>
          </div>
          <p>E-Commerce Inventory & Sales System</p>
        </div>
      </footer>
    </div>
  );
}

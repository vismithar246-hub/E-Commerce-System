import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Database,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inventory", label: "Inventory", icon: Database },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex bg-background text-foreground dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 glass-panel flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <span className="font-bold text-lg tracking-tight gradient-text">NEXUS ADMIN</span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact 
                ? location === item.href 
                : location.startsWith(item.href);
              
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary/20 text-primary glow-text border border-primary/30' 
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <Link href="/" className="block">
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" />
              Back to Store
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <div className="flex-1 p-8 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useGetTopProducts } from "@workspace/api-client-react";
import { ArrowRight, Zap, Shield, Database, ShoppingBag, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: topProducts, isLoading } = useGetTopProducts({ limit: 4 });

  return (
    <Layout>
      <div className="flex flex-col gap-16 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 glass-panel mt-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent blur-3xl pointer-events-none" />
          
          <div className="relative z-10 px-8 py-24 md:py-32 flex flex-col items-center text-center max-w-4xl mx-auto gap-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>NEXUS Core System v2.0 Online</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              High-Velocity <br className="hidden md:block" />
              <span className="gradient-text glow-text">Commerce Operations</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Advanced inventory routing and sales command center. Monitor stock levels, track performance metrics, and execute transactions at light speed.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto glow-text font-bold tracking-wide">
                  ENTER STOREFRONT
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 bg-white/5 hover:bg-white/10">
                  ACCESS COMMAND
                  <Database className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-white/10 glass-panel flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Secure Transactions</h3>
            <p className="text-muted-foreground leading-relaxed">
              Military-grade encryption for all customer data and payment processing.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-white/10 glass-panel flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Real-Time Sync</h3>
            <p className="text-muted-foreground leading-relaxed">
              Instantaneous inventory updates across all nodes when orders are processed.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-white/10 glass-panel flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Data Density</h3>
            <p className="text-muted-foreground leading-relaxed">
              High-density information architecture designed for rapid decision making.
            </p>
          </div>
        </section>

        {/* Featured Products */}
        <section className="space-y-8">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-primary" />
                Trending Assets
              </h2>
              <p className="text-muted-foreground mt-2">Highest performing stock in the current cycle</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col gap-3 p-4 rounded-xl border border-white/10 glass-panel">
                  <Skeleton className="h-40 w-full rounded-lg bg-white/5" />
                  <Skeleton className="h-6 w-3/4 bg-white/5" />
                  <Skeleton className="h-4 w-1/2 bg-white/5" />
                  <Skeleton className="h-10 w-full mt-2 bg-white/5" />
                </div>
              ))
            ) : topProducts?.map((product) => (
              <Link key={product.productId} href={`/products/${product.productId}`}>
                <div className="group p-4 rounded-xl border border-white/10 glass-panel hover:border-primary/50 transition-all hover-elevate cursor-pointer h-full flex flex-col">
                  <div className="aspect-square mb-4 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
                    <Package className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="text-xs font-mono text-primary mb-1">{product.category}</div>
                    <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {product.productName}
                    </h3>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="font-mono text-xl font-bold">${(product.totalRevenue / product.totalSold || 0).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground font-mono">{product.totalSold} sold</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

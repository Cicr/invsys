import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030303]">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 text-center space-y-8 px-4">
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/20">
            <span className="text-3xl font-black text-primary">IN</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white sm:text-7xl">
            ZENITH <span className="text-primary">ERP</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-lg mx-auto font-medium">
            The high-performance inventory orchestration platform for modern enterprises.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/30 group">
            <Link href="/login" className="flex items-center">
              Enter Portal
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold border-white/10 hover:bg-white/5">
            <Link href="https://github.com" target="_blank">
              Documentation
            </Link>
          </Button>
        </div>

        <div className="pt-12 grid grid-cols-2 md:grid-cols-3 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-white">1.2ms</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Latency</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-white">99.9%</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Uptime</span>
          </div>
          <div className="flex flex-col items-center gap-1 hidden md:flex">
            <span className="text-2xl font-bold text-white">256-bit</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Encryption</span>
          </div>
        </div>
      </div>
    </main>
  );
}

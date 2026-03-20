import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Gem,
  Repeat,
  Activity,
  User,
  Users,
  LogOut,
  Menu,
  X,
  Wifi,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePolkadotWallet } from "@/hooks/usePolkadotWallet";
import { ethers } from "ethers";
import { POLKADOT_CONFIG } from "@/config/blockchain";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Lotes", href: "/lots", icon: Gem },
  { name: "Mercado", href: "/market", icon: Repeat },
  { name: "Inversionista", href: "/investor", icon: Users },
  { name: "Actividad", href: "/activity", icon: Activity },
];

export default function Navbar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const { user, signOut } = useAuth();
  const wallet = usePolkadotWallet();

  // Poll latest block number every 12s
  useEffect(() => {
    let cancelled = false;

    const fetchBlock = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(POLKADOT_CONFIG.rpcUrl);
        const block = await provider.getBlockNumber();
        if (!cancelled) setBlockNumber(block);
      } catch {
        // silently ignore
      }
    };

    fetchBlock();
    const interval = setInterval(fetchBlock, 12_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06]"
      style={{ background: "rgba(10,14,20,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      <div className="container-professional">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ background: "linear-gradient(135deg, #04BF8A, #026873)", boxShadow: "0 0 16px rgba(4,191,138,0.4)" }}>
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm font-semibold tracking-[0.15em] uppercase text-white">
                Facet
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase font-medium"
                style={{ color: "#04BF8A" }}>
                RWA
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                  }`}
                  style={isActive ? {
                    background: "rgba(4,191,138,0.12)",
                    border: "1px solid rgba(4,191,138,0.25)",
                    color: "#04BF8A",
                  } : undefined}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Network + block badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Wifi className="w-3 h-3" style={{ color: "#04BF8A" }} />
              <span className="text-white/60 tracking-wide">Hub</span>
              {blockNumber !== null ? (
                <span className="font-mono text-white/80">#{blockNumber.toLocaleString()}</span>
              ) : (
                <span className="font-mono text-white/30">—</span>
              )}
              <span className="live-dot" />
            </div>

            {/* Wallet status */}
            {wallet.isConnected && wallet.address && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
                style={{ background: "rgba(4,191,138,0.08)", border: "1px solid rgba(4,191,138,0.2)", color: "#04BF8A" }}>
                {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
              </div>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"
                  className="w-9 h-9 rounded-full text-white/60 hover:text-white hover:bg-white/[0.08]">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, #024059, #026873)", color: "#04BF8A" }}>
                    {user?.email?.[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}
                  className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-9 h-9 text-white/60 hover:text-white hover:bg-white/[0.08]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.06] py-4 animate-fade-up">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "text-white"
                        : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                    }`}
                    style={isActive ? { background: "rgba(4,191,138,0.1)", color: "#04BF8A" } : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

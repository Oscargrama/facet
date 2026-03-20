import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { usePolkadotWallet } from "@/hooks/usePolkadotWallet";
import { FacetRwaService } from "@/services/FacetRwaService";
import { POLKADOT_CONFIG } from "@/config/blockchain";
import { supabase } from "@/integrations/supabase/client";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import {
  Gem,
  Coins,
  Wallet,
  Vault,
  ArrowUpRight,
  Info,
  Activity,
  ChevronRight,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface LotRow {
  lot_id: number;
  carats: number;
  physical_location: string;
  custody_provider: string;
  cert_hash: string;
  metadata_cid: string;
  lot_token_supply: number;
  tx_hash?: string | null;
  created_at?: string;
}

const CHART_COLORS = ["#04BF8A", "#026873", "#024059", "#025940", "#03A64A"];

export default function Dashboard() {
  const { user, isDemo } = useAuth();
  const wallet = usePolkadotWallet();
  const [lots, setLots] = useState<LotRow[]>([]);
  const [chainLots, setChainLots] = useState<LotRow[]>([]);
  const [isLoadingChain, setIsLoadingChain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenSupply, setTokenSupply] = useState<bigint>(BigInt(0));
  const [walletBalance, setWalletBalance] = useState<bigint>(BigInt(0));

  // Real-time events hook
  const { events } = useLiveEvents(5);

  const displayLots = lots.length > 0 ? lots : chainLots;
  const totalCarats = useMemo(() => displayLots.reduce((sum, lot) => sum + (lot.carats || 0), 0), [displayLots]);

  // Data for charts
  const tokenData = useMemo(() => {
    if (tokenSupply === BigInt(0)) return [{ name: "No Tokens", value: 1 }];
    return [
      { name: "Circulante", value: Number(tokenSupply) - Number(walletBalance) },
      { name: "Tu Balance", value: Number(walletBalance) }
    ];
  }, [tokenSupply, walletBalance]);

  const ipfsUrl = (cid: string) => {
    if (!cid) return "#";
    const cleaned = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
    return `https://ipfs.io/ipfs/${cleaned}`;
  };

  useEffect(() => {
    const loadLots = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("rwa_lots")
          .select("lot_id, carats, physical_location, custody_provider, cert_hash, metadata_cid, lot_token_supply, tx_hash, created_at")
          .eq("originator_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6);

        if (error) throw error;
        setLots((data as LotRow[]) || []);
      } catch (err) {
        console.error("Error loading lots:", err);
        setLots([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLots();
  }, [user]);

  useEffect(() => {
    const loadChainLots = async () => {
      if (!wallet.signer || lots.length > 0) return;
      setIsLoadingChain(true);
      try {
        const service = new FacetRwaService(wallet.signer);
        const total = await service.getTotalLots();
        if (total === 0) {
          setChainLots([]);
          return;
        }
        const start = Math.max(1, total - 5);
        const ids = Array.from({ length: total - start + 1 }, (_, i) => start + i).reverse();
        const results = await Promise.allSettled(
          ids.map(async (id) => {
            const info = await service.getLot(id);
            return {
              lot_id: id,
              carats: info.carats,
              physical_location: info.physicalLocation,
              custody_provider: info.custodyProvider,
              cert_hash: info.certHash,
              metadata_cid: info.metadataCid,
              lot_token_supply: Number(info.lotTokenSupply)
            } satisfies LotRow;
          })
        );
        const rows = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => (result as PromiseFulfilledResult<LotRow>).value);
        if (rows.length !== results.length) {
          console.warn("Some lots could not be decoded from chain.");
        }
        setChainLots(rows);
      } catch (err) {
        console.error("Error loading on-chain lots:", err);
        setChainLots([]);
      } finally {
        setIsLoadingChain(false);
      }
    };

    loadChainLots();
  }, [wallet.signer, lots.length]);

  useEffect(() => {
    const loadTokenData = async () => {
      if (!wallet.signer || !wallet.address) return;
      const service = new FacetRwaService(wallet.signer);
      const [supply, balance] = await Promise.all([
        service.getTokenSupply(),
        service.getTokenBalance(wallet.address)
      ]);
      setTokenSupply(supply);
      setWalletBalance(balance);
    };

    loadTokenData();
  }, [wallet.signer, wallet.address]);

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />

      <main className="container-professional py-8 space-y-8">
        {/* News/Alert Context */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up">
          <div className="lg:col-span-8 flex flex-col justify-center">
            <h1 className="text-display">Patrimonio Fraccionado</h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
              Custodia física de esmeraldas colombianas tokenizadas en Asset Hub.
              Seguridad on-chain con trazabilidad de activos reales.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/lots">
                <Button className="btn-primary">
                  <Gem className="w-4 h-4" />
                  Registrar nuevo activo
                </Button>
              </Link>
              <Link to="/activity">
                <Button variant="outline" className="btn-secondary">
                  <Activity className="w-4 h-4" />
                  Ver actividad global
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 glass-card p-6 flex items-center gap-4 border-l-4 border-l-accent">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Custodia Blindada</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Todos los activos están asegurados físicamente bajo protocolos de alta seguridad en Medellín/Bogotá.
              </p>
            </div>
          </div>
        </div>

        {/* Live Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Activos Registrados"
            value={displayLots.length.toString()}
            icon={Gem}
            description="Lotes físicos verificados"
            delay={1}
          />
          <StatsCard
            title="Quilates en Custodia"
            value={`${totalCarats} ct`}
            icon={Vault}
            description="Inventario total asegurado"
            changeType="positive"
            glowing={true}
            delay={2}
          />
          <StatsCard
            title="Supply FACET-LOT"
            value={FacetRwaService.formatTokenAmount(tokenSupply)}
            icon={Coins}
            description="Tokens en circulación"
            delay={3}
          />
          <StatsCard
            title="Tu Balance Wallet"
            value={FacetRwaService.formatTokenAmount(walletBalance)}
            icon={Wallet}
            description="Tokens disponibles para trading"
            glowing={walletBalance > BigInt(0)}
            delay={4}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column: Lot Management */}
          <div className="lg:col-span-2 space-y-8 animate-fade-up delay-150">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-heading">Activos Destacados</h3>
                <Link to="/lots" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
                  Gestionar todos <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {isLoading || isLoadingChain ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 w-full" />)}
                </div>
              ) : displayLots.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <Gem className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No hay activos registrados aún.</p>
                  <Link to="/lots" className="mt-4 block">
                    <Button variant="link" className="text-accent">Empieza ahora</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {displayLots.slice(0, 4).map((lot) => (
                    <div key={lot.lot_id} className="group relative overflow-hidden bg-white/[0.02] border border-white/[0.08] rounded-xl p-5 hover:border-accent/40 transition-all duration-300">
                      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 group-hover:opacity-100 transition-all">
                        <Gem className="w-10 h-10 text-accent/50" />
                      </div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="badge-blue text-[10px]">Lot #{lot.lot_id}</span>
                          <span className="badge-emerald text-[10px]">Verified</span>
                        </div>
                        <h4 className="text-lg font-display font-semibold text-white">{lot.carats} ct Emerald</h4>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Vault className="w-3 h-3" /> {lot.physical_location}
                        </p>

                        <div className="mt-4 pt-4 border-t border-white/[0.06]">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="label-uppercase !text-[9px]">Tokenization</p>
                              <p className="text-sm font-mono text-accent">{lot.lot_token_supply} FACET</p>
                            </div>
                            <Link to={`/lots?lotId=${lot.lot_id}`}>
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-xs hover:bg-accent/10 hover:text-accent">
                                Detalles <ChevronRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions / Integration */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-6 border-t-4 border-t-accent hover:-translate-y-1 transition-transform">
                <h4 className="text-subheading mb-2">Manual de Redención</h4>
                <p className="text-caption text-muted-foreground leading-relaxed">
                  ¿Quieres retirar tu esmeralda físicamente? Quema tus tokens $FACET-LOT y genera un NFT de extracción certificado.
                </p>
                <Link to="/lots" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:gap-3 transition-all">
                  Iniciar proceso <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="glass-card p-6 border-t-4 border-t-blue-500 hover:-translate-y-1 transition-transform">
                <h4 className="text-subheading mb-2">Mercado Secundario</h4>
                <p className="text-caption text-muted-foreground leading-relaxed">
                  Negocia tus esmeraldas fraccionadas con otros usuarios de forma inmediata y segura en el Hub de Polkadot.
                </p>
                <Link to="/market" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:gap-3 transition-all">
                  Explorar órdenes <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Analytics & Feed */}
          <div className="space-y-8 animate-fade-up delay-300">

            {/* Token Analytics */}
            <div className="glass-card p-6">
              <h3 className="text-heading text-xl mb-6">Distribución Tokens</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tokenData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {tokenData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                      itemStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[0] }} /> Circulante</span>
                  <span className="font-mono text-white">{FacetRwaService.formatTokenAmount(tokenSupply - walletBalance)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[1] }} /> Tu Balance</span>
                  <span className="font-mono text-white">{FacetRwaService.formatTokenAmount(walletBalance)}</span>
                </div>
              </div>
            </div>

            {/* Live Feed (vía useLiveEvents) */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-heading text-xl">Feed en Vivo</h3>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="live-dot" />
                  <span className="text-[10px] text-accent font-semibold uppercase tracking-wider">Live</span>
                </div>
              </div>

              <div className="space-y-4">
                {events.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Esperando actividad...</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex gap-3 text-sm animate-slide-in">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: event.event_name === 'LotCreated' ? '#3dd6e8' : '#04BF8A' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/90">{event.event_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Tx: {event.tx_hash.slice(0, 10)}…
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 opacity-60">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <a href={`${POLKADOT_CONFIG.explorerUrl}/tx/${event.tx_hash}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-white transition-colors">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

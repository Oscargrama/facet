import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { usePolkadotWallet } from "@/hooks/usePolkadotWallet";
import { FacetRwaService } from "@/services/FacetRwaService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Wallet,
  History,
  TrendingUp,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { POLKADOT_CONFIG } from "@/config/blockchain";

export default function Market() {
  const wallet = usePolkadotWallet();
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<bigint>(BigInt(0));
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenPriceUsd = 0.15; // Simulated price per token (0.01 ct = $0.15)

  const balanceUsd = useMemo(() => {
    return (Number(walletBalance) * tokenPriceUsd).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  }, [walletBalance]);

  const transferUsd = useMemo(() => {
    return (transferAmount * tokenPriceUsd).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  }, [transferAmount]);

  const refreshBalance = async () => {
    if (!wallet.signer || !wallet.address) return;
    const service = new FacetRwaService(wallet.signer);
    const balance = await service.getTokenBalance(wallet.address);
    setWalletBalance(balance);
  };

  const loadHistory = async () => {
    if (!wallet.address) return;
    const { data } = await supabase
      .from("rwa_lot_events")
      .select("*")
      .or(`payload->>from.eq.${wallet.address.toLowerCase()},payload->>to.eq.${wallet.address.toLowerCase()},payload->>to.eq.${wallet.address}`)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory(data || []);
  };

  useEffect(() => {
    if (wallet.isConnected) {
      refreshBalance();
      loadHistory();
    }
  }, [wallet.signer, wallet.address]);

  const handleTransfer = async () => {
    if (!wallet.signer || !wallet.address) {
      toast.error("Conecta tu wallet para operar");
      return;
    }

    // basic EVM validation
    if (!transferTo.startsWith("0x") || transferTo.length !== 42) {
      toast.error("Dirección EVM inválida");
      return;
    }

    if (transferAmount <= 0 || transferAmount > Number(walletBalance)) {
      toast.error("Cantidad de tokens inválida");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const service = new FacetRwaService(wallet.signer);
      await service.transferTokens(transferTo.trim(), BigInt(transferAmount));
      toast.success("Transferencia completada con éxito");
      setTransferAmount(0);
      setTransferTo("");
      refreshBalance();
      loadHistory();
    } catch (err: any) {
      setError(err.message || "Error al transferir tokens");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      <main className="container-professional py-8 space-y-8 animate-fade-up">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-display">Mercado Secundario</h1>
            <p className="text-muted-foreground mt-2">Transfiere tus fracciones de esmeralda de forma directa entre wallets.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-white/50 tracking-wider uppercase">Price:</span>
              <span className="text-sm font-mono text-white">${tokenPriceUsd} / FACET</span>
            </div>
          </div>
        </header>

        {error && (
          <Alert variant="destructive" className="animate-shake">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-12 gap-8">

          {/* Top Row / Stats */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card p-6 border-t-4 border-t-accent glow-emerald">
              <p className="label-uppercase">Balance Disponible</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-4xl font-display font-bold text-white tracking-tight">{Number(walletBalance)}</p>
                  <p className="text-xs text-accent font-semibold uppercase tracking-widest mt-1">FACET-LOT Tokens</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <p className="text-xs text-muted-foreground">Valor Estimado Mercado</p>
                <p className="text-xl font-mono text-white/90 mt-1">{balanceUsd}</p>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="text-subheading flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Seguridad
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Todas las transferencias son inmutables y se ejecutan directamente en el Asset Hub de Polkadot. Asegúrate de verificar la dirección destino.
              </p>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass-card p-8 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-heading text-2xl">Nueva Transferencia</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="label-uppercase">Dirección del Destinatario (EVM)</Label>
                  <Input
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="input-professional bg-white/[0.02]"
                    placeholder="0x..."
                  />
                  <p className="text-[10px] text-muted-foreground">Formato compatible con Asset Hub (EVM compatible)</p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <Label className="label-uppercase">Cantidad a Enviar</Label>
                    <div className="text-right">
                      <span className="text-2xl font-mono font-bold text-white">{transferAmount}</span>
                      <span className="text-xs text-muted-foreground ml-2">FACET</span>
                    </div>
                  </div>

                  <Slider
                    defaultValue={[0]}
                    max={Number(walletBalance)}
                    step={1}
                    value={[transferAmount]}
                    onValueChange={(vals) => setTransferAmount(vals[0])}
                    className="py-4"
                  />

                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    <span>0</span>
                    <span>{Number(walletBalance)} Max</span>
                  </div>
                </div>

                <div className="bg-white/[0.04] p-4 rounded-xl border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Valor en transferencia</p>
                    <p className="text-lg font-mono text-accent">{transferUsd}</p>
                  </div>
                  <Button
                    onClick={handleTransfer}
                    disabled={isLoading || transferAmount <= 0}
                    className="btn-primary"
                  >
                    {isLoading ? "Procesando..." : "Confirmar Envío"} <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Local History */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-subheading flex items-center gap-2">
                  <History className="w-4 h-4 text-accent" /> Historial Reciente
                </h3>
              </div>

              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border rounded-lg">
                    <History className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-xs text-muted-foreground">No tienes transferencias registradas.</p>
                  </div>
                ) : (
                  history.map((tx) => {
                    const isOut = tx.payload?.from?.toLowerCase() === wallet.address?.toLowerCase();
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOut ? 'bg-orange-400/10 text-orange-400' : 'bg-accent/10 text-accent'}`}>
                            {isOut ? <ArrowUpRight className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-90" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{isOut ? "Enviado" : "Recibido"}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {isOut ? `Para: ${tx.payload?.to?.slice(0, 14)}…` : `De: ${tx.payload?.from?.slice(0, 14)}…`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-mono font-bold ${isOut ? 'text-white' : 'text-accent'}`}>
                            {isOut ? '-' : '+'}{tx.payload?.amount ?? '—'}
                          </p>
                          <a
                            href={`${POLKADOT_CONFIG.explorerUrl}/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-muted-foreground hover:text-accent flex items-center justify-end gap-1 mt-1"
                          >
                            Explorer <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

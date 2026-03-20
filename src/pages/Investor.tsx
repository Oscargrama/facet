import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { usePolkadotWallet } from "@/hooks/usePolkadotWallet";
import { toast } from "sonner";
import {
  Gem,
  Coins,
  Wallet,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ClipboardCopy
} from "lucide-react";
import { POLKADOT_CONFIG } from "@/config/blockchain";

type LotRow = {
  lot_id: number;
  carats: number;
  physical_location: string;
  custody_provider: string;
  metadata_cid: string;
  lot_token_supply: number;
  created_at?: string;
};

type StoneRow = {
  token_id: number;
  lot_id: number;
  stone_name: string;
  carats: number;
  metadata_cid: string;
  photo_cid?: string | null;
  cert_cid?: string | null;
  video_cid?: string | null;
  certified?: boolean | null;
  created_at?: string | null;
};

export default function Investor() {
  const wallet = usePolkadotWallet();
  const [lots, setLots] = useState<LotRow[]>([]);
  const [stones, setStones] = useState<StoneRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ipfsUrl = (cid: string) => {
    if (!cid) return "#";
    const cleaned = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
    return `https://cloudflare-ipfs.com/ipfs/${cleaned}`;
  };

  const totalCarats = useMemo(() => lots.reduce((sum, lot) => sum + (lot.carats || 0), 0), [lots]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [{ data: lotsData }, { data: stonesData }] = await Promise.all([
        supabase.from("rwa_lots").select("*").order("created_at", { ascending: false }).limit(12),
        supabase.from("rwa_stones").select("*").order("created_at", { ascending: false }).limit(12)
      ]);
      setLots((lotsData as LotRow[]) || []);
      setStones((stonesData as StoneRow[]) || []);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const copyAddress = async () => {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      toast.success("Dirección copiada");
    } catch {
      toast.error("No se pudo copiar la dirección");
    }
  };

  const requestTokens = (lotId: number) => {
    toast.message("Compra simulada", {
      description: `Para demo, solicita al originador transferirte FACET-LOT del Lote #${lotId}.`
    });
  };

  const requestNft = (stone: StoneRow) => {
    toast.message("Solicitud de NFT", {
      description: `Pide al originador transferir el NFT #${stone.token_id} (${stone.stone_name}).`
    });
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />

      <main className="container-professional py-8 space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-display">Portal Inversionista</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Compra tokens FACET-LOT o adquiere piedras listas con certificación.
            </p>
          </div>
          {wallet.isConnected ? (
            <div className="glass-card px-4 py-3 flex items-center gap-3">
              <Wallet className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono text-white/80">
                {wallet.address?.slice(0, 8)}…{wallet.address?.slice(-4)}
              </span>
              <Button variant="ghost" size="sm" onClick={copyAddress} className="text-accent text-xs">
                <ClipboardCopy className="w-3 h-3 mr-1" /> Copiar
              </Button>
            </div>
          ) : (
            <Button onClick={wallet.connectWallet} className="btn-primary">
              Conectar Wallet
            </Button>
          )}
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-l-4 border-l-accent">
            <div className="flex items-center gap-3">
              <Gem className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Lotes disponibles</p>
                <p className="text-lg font-semibold text-white">{lots.length}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6 border-l-4 border-l-emerald-400">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-emerald-300" />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Quilates en custodia</p>
                <p className="text-lg font-semibold text-white">{totalCarats} ct</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6 border-l-4 border-l-blue-400">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-300" />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Red actual</p>
                <p className="text-sm font-semibold text-white">{POLKADOT_CONFIG.chainName}</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <Alert className="bg-white/[0.03] border-white/[0.1]">
            <AlertDescription>Cargando inventario para inversionistas…</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-heading">Lotes Tokenizados</h3>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            {lots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay lotes disponibles aún.</p>
            ) : (
              <div className="space-y-4">
                {lots.map((lot) => (
                  <div key={lot.lot_id} className="border border-white/[0.08] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="badge-blue">Lote #{lot.lot_id}</span>
                      <span className="text-xs text-muted-foreground">{lot.carats} ct</span>
                    </div>
                    <p className="text-sm text-white mt-2">{lot.custody_provider}</p>
                    <p className="text-xs text-muted-foreground">{lot.physical_location}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Button size="sm" className="btn-primary" onClick={() => requestTokens(lot.lot_id)}>
                        Solicitar tokens
                      </Button>
                      <a
                        href={ipfsUrl(lot.metadata_cid)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        Ver evidencia
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-heading">Piedras Listas (NFT)</h3>
              <Gem className="w-4 h-4 text-emerald-300" />
            </div>
            {stones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay piedras listas disponibles aún.</p>
            ) : (
              <div className="space-y-4">
                {stones.map((stone) => (
                  <div key={stone.token_id} className="border border-white/[0.08] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="badge-purple">NFT #{stone.token_id}</span>
                      <span className={`text-[10px] ${stone.certified ? "text-emerald-300" : "text-muted-foreground"}`}>
                        {stone.certified ? "Certificado" : "Propiedad"}
                      </span>
                    </div>
                    <p className="text-sm text-white mt-2">{stone.stone_name}</p>
                    <p className="text-xs text-muted-foreground">Lote #{stone.lot_id} · {stone.carats} ct</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Button size="sm" variant="outline" onClick={() => requestNft(stone)}>
                        Solicitar NFT
                      </Button>
                      <a
                        href={ipfsUrl(stone.metadata_cid)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        Metadata
                      </a>
                      {stone.photo_cid && (
                        <a
                          href={ipfsUrl(stone.photo_cid)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          Foto
                        </a>
                      )}
                      {stone.cert_cid && (
                        <a
                          href={ipfsUrl(stone.cert_cid)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          Certificado
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="glass-card p-6">
          <h3 className="text-heading mb-4">Cómo invertir (demo)</h3>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
            <li>Conecta tu wallet en Asset Hub Testnet.</li>
            <li>Copia tu dirección y compártela con el originador.</li>
            <li>El originador transfiere tokens FACET-LOT o el NFT de la piedra.</li>
            <li>Verifica el movimiento en el explorer.</li>
          </ol>
          <div className="mt-4 text-xs text-muted-foreground">
            Para demo, las compras son transferencias directas wallet-a-wallet.
          </div>
        </section>
      </main>
    </div>
  );
}

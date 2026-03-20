import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useLiveEvents, RwaEvent } from "@/hooks/useLiveEvents";
import { toast } from "sonner";
import { RefreshCcw, ExternalLink, Search, Clock, Box } from "lucide-react";
import { POLKADOT_CONFIG } from "@/config/blockchain";

export default function Activity() {
  const [lotFilter, setLotFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const { events, latestEvent } = useLiveEvents(50, activeFilter || undefined);
  const [isLoading, setIsLoading] = useState(false);

  const handleApplyFilter = () => {
    if (!lotFilter) {
      setActiveFilter(null);
      return;
    }
    const parsed = Number(lotFilter);
    if (Number.isNaN(parsed)) {
      toast.error("Lot ID inválido");
      return;
    }
    setActiveFilter(parsed);
  };

  const getEventBadge = (name: string) => {
    switch (name) {
      case 'LotCreated': return 'badge-blue';
      case 'LotTokensMinted': return 'badge-emerald';
      case 'LotTokensBurned': return 'badge-orange';
      case 'ExtractNFTMinted': return 'badge-purple';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-professional py-8 space-y-8 animate-fade-up">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-display">Actividad On-Chain</h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <span className="live-dot" /> Feed en tiempo real desde Asset Hub Testnet.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs font-mono text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /> Última actualización: {new Date().toLocaleTimeString()}
          </div>
        </header>

        <div className="grid lg:grid-cols-4 gap-8">

          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-subheading flex items-center gap-2">
                <Search className="w-4 h-4 text-accent" /> Filtrar Eventos
              </h3>
              <div className="space-y-2">
                <Label className="label-uppercase">Lot ID</Label>
                <Input
                  value={lotFilter}
                  onChange={(e) => setLotFilter(e.target.value)}
                  className="input-professional"
                  placeholder="Ej: 1"
                  onKeyDown={e => e.key === 'Enter' && handleApplyFilter()}
                />
              </div>
              <Button onClick={handleApplyFilter} className="btn-primary w-full">
                Aplicar Filtro
              </Button>
              {activeFilter && (
                <Button variant="ghost" onClick={() => { setLotFilter(""); setActiveFilter(null); }} className="text-xs w-full text-muted-foreground">
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-subheading mb-4">Leyenda de Eventos</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="badge-blue w-24 justify-center">Created</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Registro de lote</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-emerald w-24 justify-center">Minted</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Emisión de tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-orange w-24 justify-center">Burned</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Redención física</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-purple w-24 justify-center">NFT</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Cert. Extracción</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/[0.08]">
                      <th className="py-4 px-6 label-uppercase">Tipo de Evento</th>
                      <th className="py-4 px-6 label-uppercase text-center">Lot ID</th>
                      <th className="py-4 px-6 label-uppercase">Tx Hash</th>
                      <th className="py-4 px-6 label-uppercase text-right">Bloque</th>
                      <th className="py-4 px-6 label-uppercase text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                          No se encontraron eventos recientes.
                        </td>
                      </tr>
                    ) : (
                      events.map((event) => (
                        <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group animate-fade-in">
                          <td className="py-4 px-6">
                            <span className={getEventBadge(event.event_name)}>{event.event_name}</span>
                          </td>
                          <td className="py-4 px-6 text-center font-mono text-sm text-accent">
                            {event.lot_id ? `#${event.lot_id}` : '—'}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                              {event.tx_hash.slice(0, 14)}…
                              <a
                                href={`${POLKADOT_CONFIG.explorerUrl}/tx/${event.tx_hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="opacity-0 group-hover:opacity-100 text-accent transition-all hover:scale-110"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-mono text-xs text-muted-foreground">
                            {event.block_number.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-right text-[10px] text-muted-foreground whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{new Date(event.created_at).toLocaleDateString()}</span>
                              <span className="opacity-60">{new Date(event.created_at).toLocaleTimeString()}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[10px] text-center text-muted-foreground mt-6 uppercase tracking-widest opacity-40">
              Sincronizado vía Supabase Realtime x Subscan API
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

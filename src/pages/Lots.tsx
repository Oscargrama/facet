import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { usePolkadotWallet } from "@/hooks/usePolkadotWallet";
import { FacetRwaService, LotInfo } from "@/services/FacetRwaService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { toast } from "sonner";
import {
  RefreshCcw,
  Wallet,
  ExternalLink,
  Gem,
  Coins,
  ArrowUpRight,
  Flame,
  FileCheck,
  ChevronRight,
  Info,
  History,
  LayoutGrid,
  Vault
} from "lucide-react";
import { FACET_EXTRACT_NFT_ADDRESS, POLKADOT_CONFIG, RWA_REGISTRY_ADDRESS } from "@/config/blockchain";

const defaultLotForm = {
  physicalLocation: "",
  custodyProvider: "",
  carats: "20",
  certHash: "",
  metadataCid: "",
  redemptionRef: ""
};

const defaultStoneForm = {
  sourceLotId: "",
  stoneName: "Emerald Stone",
  carats: "0.37",
  cutType: "",
  cutter: "",
  photoCid: "",
  certCid: "",
  videoCid: "",
  certHash: "",
  certIssuer: "",
  certDate: "",
  metadataCid: "",
  notes: "",
  certified: false
};

type StoneRecord = {
  tokenId: number;
  lotId: number;
  stoneName: string;
  carats: string;
  cutType: string;
  photoCid?: string;
  certCid?: string;
  videoCid?: string;
  certified: boolean;
  certIssuer?: string;
  certDate?: string;
  certHash?: string;
  metadataCid: string;
  createdAt: string;
};

const lotTemplates = [
  {
    id: "rough-001",
    label: "Rough Lot (Bruto)",
    carats: "20",
    physicalLocation: "Caja fuerte Facet, Medellín",
    custodyProvider: "Facet Infraestructura Joyera",
    certHash: "ROUGH-LOT-001",
    metadataCid: "bafy...rough-lot-001"
  }
];

const stoneTemplates = [
  {
    id: "stone-001",
    label: "Emerald Stone #001",
    carats: "1.8",
    physicalLocation: "Caja fuerte Facet, Medellín",
    custodyProvider: "Facet Infraestructura Joyera",
    certHash: "0x79abc8c508d163632ec357fcb9f2d4381d9b4c639f82d1813026c0581ac6fd41",
    metadataCid: "bafkreiaiwjqjrj656u7x6kzhxsozlerovzqpnshh2txntydkcbucb6ldt4"
  },
  {
    id: "stone-002",
    label: "Emerald Stone #002",
    carats: "2.1",
    physicalLocation: "Caja fuerte Facet, Medellín",
    custodyProvider: "Facet Infraestructura Joyera",
    certHash: "STONE-002-CERT",
    metadataCid: "bafy...stone-002"
  }
];

export default function Lots() {
  const { user } = useAuth();
  const wallet = usePolkadotWallet();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("manage");
  const [assetMode, setAssetMode] = useState<"lot" | "stone">("lot");
  const [lotId, setLotId] = useState<number | null>(null);
  const [lotIdInput, setLotIdInput] = useState("");
  const [lotInfo, setLotInfo] = useState<LotInfo | null>(null);
  const [userLots, setUserLots] = useState<any[]>([]);
  const [lotForm, setLotForm] = useState(defaultLotForm);
  const [stoneForm, setStoneForm] = useState(defaultStoneForm);
  const [mintedStones, setMintedStones] = useState<StoneRecord[]>([]);
  const [mintAmount, setMintAmount] = useState("0");
  const [transferAmount, setTransferAmount] = useState("0");
  const [transferTo, setTransferTo] = useState("");
  const [burnAmount, setBurnAmount] = useState("0");
  const [walletTokenBalance, setWalletTokenBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{
    type: "photo" | "cert" | "video" | "metadata";
    cid: string;
    title: string;
  } | null>(null);
  const [metadataPreview, setMetadataPreview] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const { latestEvent } = useLiveEvents(1, lotId || undefined);

  // Auto-refresh when a live event occurs for this lot
  useEffect(() => {
    if (latestEvent && lotId && latestEvent.lot_id === lotId) {
      refreshLotInfo(lotId);
    }
  }, [latestEvent, lotId]);

  const lotTokenSupplyCalc = useMemo(() => {
    const carats = Math.max(0, parseInt(lotForm.carats || "0", 10));
    return carats * 100;
  }, [lotForm.carats]);

  const tokenizationProgress = useMemo(() => {
    if (!lotInfo || Number(lotInfo.lotTokenSupply) === 0) return 0;
    return (Number(lotInfo.tokensMinted) / Number(lotInfo.lotTokenSupply)) * 100;
  }, [lotInfo]);

  const redemptionProgress = useMemo(() => {
    if (!lotInfo || Number(lotInfo.lotTokenSupply) === 0) return 0;
    return (Number(lotInfo.tokensRedeemed) / Number(lotInfo.lotTokenSupply)) * 100;
  }, [lotInfo]);

  const normalizeCertHash = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith("0x") && trimmed.length === 66) return trimmed;
    return ethers.keccak256(ethers.toUtf8Bytes(trimmed || "FACET-CERT"));
  };

  const parseLotIdInput = (value: string) => {
    const numeric = value.replace(/[^0-9]/g, "");
    return numeric ? Number(numeric) : 0;
  };

  const ipfsUrl = (cid: string) => {
    if (!cid) return "#";
    const cleaned = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
    return `https://cloudflare-ipfs.com/ipfs/${cleaned}`;
  };

  const ipfsAltUrl = (cid: string) => {
    if (!cid) return "#";
    const cleaned = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
    return `https://ipfs.io/ipfs/${cleaned}`;
  };

  const openMediaPreview = async (type: "photo" | "cert" | "video" | "metadata", cid: string, title: string) => {
    setMediaPreview({ type, cid, title });
    setMetadataPreview(null);
    setMetadataError(null);

    if (type === "metadata") {
      try {
        const response = await fetch(ipfsUrl(cid));
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          setMetadataPreview(JSON.stringify(parsed, null, 2));
        } catch {
          setMetadataPreview(text);
        }
      } catch (err: any) {
        setMetadataError(err.message || "No se pudo cargar la metadata.");
      }
    }
  };

  const refreshLotInfo = async (id?: number) => {
    if (!wallet.signer || !id) return;
    setIsLoading(true);
    try {
      const service = new FacetRwaService(wallet.signer);
      const info = await service.getLot(id);
      setLotInfo(info);
      if (wallet.address) {
        const balance = await service.getTokenBalance(wallet.address);
        setWalletTokenBalance(FacetRwaService.formatTokenAmount(balance));
      }
    } catch (err: any) {
      console.error("Error loading lot info:", err);
      setError(err.message || "Error al cargar datos del lote");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (lotId) refreshLotInfo(lotId);
  }, [lotId, wallet.signer]);

  useEffect(() => {
    const loadUserAndProfile = async () => {
      if (!user) return;

      // Ensure profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        console.log("Creating missing profile for user:", user.id);
        await supabase.from("profiles").insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || "User",
          email: user.email || ""
        });
      }

      const { data } = await supabase
        .from("rwa_lots")
        .select("*")
        .eq("originator_user_id", user.id)
        .order("created_at", { ascending: false });
      setUserLots(data || []);

      const { data: stonesData } = await supabase
        .from("rwa_stones")
        .select("*")
        .eq("originator_user_id", user.id)
        .order("created_at", { ascending: false });

      if (stonesData) {
        const mapped = stonesData.map((stone) => ({
          tokenId: stone.token_id,
          lotId: stone.lot_id,
          stoneName: stone.stone_name,
          carats: String(stone.carats),
          cutType: stone.cut_type || "",
          photoCid: stone.photo_cid || undefined,
          certCid: stone.cert_cid || undefined,
          videoCid: stone.video_cid || undefined,
          certified: Boolean(stone.certified),
          certIssuer: stone.cert_issuer || undefined,
          certDate: stone.cert_date || undefined,
          certHash: stone.cert_hash || undefined,
          metadataCid: stone.metadata_cid,
          createdAt: stone.created_at || new Date().toISOString()
        })) as StoneRecord[];
        setMintedStones(mapped);
      }
    };
    loadUserAndProfile();
  }, [user]);

  useEffect(() => {
    const param = searchParams.get("lotId");
    if (param) {
      const parsed = parseInt(param, 10);
      if (!Number.isNaN(parsed)) {
        setLotId(parsed);
        setLotIdInput(param);
        setActiveTab("manage");
      }
    }
  }, [searchParams]);

  const applyLotTemplate = (template: typeof lotTemplates[number]) => {
    setAssetMode("lot");
    setLotForm({
      ...defaultLotForm,
      physicalLocation: template.physicalLocation,
      custodyProvider: template.custodyProvider,
      carats: template.carats,
      certHash: template.certHash,
      metadataCid: template.metadataCid,
    });
    setLotId(null);
    setLotInfo(null);
    setActiveTab("register");
  };

  const applyStoneTemplate = (template: typeof stoneTemplates[number]) => {
    setAssetMode("stone");
    setStoneForm({
      ...defaultStoneForm,
      sourceLotId: lotId ? String(lotId) : "",
      stoneName: template.label,
      carats: template.carats,
      certHash: template.certHash,
      metadataCid: template.metadataCid,
      certified: true
    });
    setActiveTab("register");
  };

  const certificateEligible = stoneForm.certified
    ? Boolean(stoneForm.certHash && stoneForm.certIssuer && stoneForm.certDate)
    : true;

  const stoneMetadataPreview = useMemo(() => {
    const lotOriginId = stoneForm.sourceLotId
      ? parseLotIdInput(stoneForm.sourceLotId)
      : (lotId || 0);
    const lotOrigin = lotOriginId ? `Lote #${lotOriginId}` : "";
    const evidence: Record<string, unknown> = {};
    if (stoneForm.photoCid) evidence.photos = [stoneForm.photoCid];
    if (stoneForm.certCid) evidence.certificate = stoneForm.certCid;
    if (stoneForm.videoCid) evidence.video = stoneForm.videoCid;

    return {
      name: stoneForm.stoneName || "Emerald Stone",
      type: stoneForm.certified ? "certificate" : "ownership",
      description: stoneForm.certified
        ? "Certificado de piedra lista para transferencia."
        : "NFT de propiedad de piedra lista.",
      lotOrigin,
      attributes: [
        { trait_type: "Carats", value: stoneForm.carats },
        { trait_type: "Cut", value: stoneForm.cutType || "N/A" },
        { trait_type: "Cutter", value: stoneForm.cutter || "N/A" }
      ],
      certificate: stoneForm.certified
        ? {
            issuer: stoneForm.certIssuer,
            date: stoneForm.certDate,
            certHash: stoneForm.certHash
          }
        : null,
      evidence
    };
  }, [stoneForm, lotId]);

  const handleCreateLot = async () => {
    if (!wallet.signer || !user) {
      toast.error("Conecta tu wallet y autentícate");
      return;
    }
    if (wallet.chainId !== POLKADOT_CONFIG.chainId) {
      try {
        await wallet.switchToPolkadotNetwork();
      } catch (err) {
        toast.error("Por favor cambia a la red Polkadot en MetaMask");
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      const carats = parseInt(lotForm.carats, 10);
      const certHash = normalizeCertHash(lotForm.certHash || lotForm.metadataCid);
      const service = new FacetRwaService(wallet.signer);
      const result = await service.createLot({
        physicalLocation: lotForm.physicalLocation.trim(),
        custodyProvider: lotForm.custodyProvider.trim(),
        certHash,
        metadataCid: lotForm.metadataCid.trim(),
        carats,
        lotTokenSupply: BigInt(carats * 100)
      });

      const { error: dbError } = await supabase.from("rwa_lots").insert({
        originator_user_id: user.id,
        lot_id: result.lotId,
        carats,
        physical_location: lotForm.physicalLocation.trim(),
        custody_provider: lotForm.custodyProvider.trim(),
        cert_hash: certHash,
        metadata_cid: lotForm.metadataCid.trim(),
        lot_token_supply: carats * 100,
        tx_hash: result.txHash,
        registry_address: RWA_REGISTRY_ADDRESS
      });

      if (dbError) {
        console.error("Supabase insert error:", dbError);
        throw new Error(`Blockchain OK, pero falló el registro en DB: ${dbError.message}`);
      }

      setLotId(result.lotId);
      setActiveTab("manage");
      toast.success(`Lote #${result.lotId} registrado exitosamente`);
    } catch (err: any) {
      toast.error(err.message || "Error al registrar lote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintTokens = async () => {
    if (!wallet.signer || !lotId) return;
    if (wallet.chainId !== POLKADOT_CONFIG.chainId) {
      try {
        await wallet.switchToPolkadotNetwork();
      } catch (err) {
        toast.error("Cambia a la red Polkadot para continuar");
        return;
      }
    }

    setIsLoading(true);
    try {
      const service = new FacetRwaService(wallet.signer);
      await service.mintLotTokens(lotId, wallet.address!, FacetRwaService.parseTokenAmount(mintAmount));
      toast.success("Tokens emitidos exitosamente");
      refreshLotInfo(lotId);
    } catch (err: any) {
      toast.error(err.message || "Error al emitir tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBurnRedemption = async () => {
    if (!wallet.signer || !lotId) return;
    if (wallet.chainId !== POLKADOT_CONFIG.chainId) {
      try {
        await wallet.switchToPolkadotNetwork();
      } catch (err) {
        toast.error("Cambia a la red Polkadot para continuar");
        return;
      }
    }

    setIsLoading(true);
    try {
      const service = new FacetRwaService(wallet.signer);
      await service.burnRedemption(lotId, wallet.address!, FacetRwaService.parseTokenAmount(burnAmount), lotForm.redemptionRef);
      toast.success("Redención procesada");
      refreshLotInfo(lotId);
    } catch (err: any) {
      toast.error(err.message || "Error en redención");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintStoneNft = async () => {
    if (!wallet.signer || !wallet.address) {
      toast.error("Conecta tu wallet para continuar");
      return;
    }
    if (wallet.chainId !== POLKADOT_CONFIG.chainId) {
      try {
        await wallet.switchToPolkadotNetwork();
      } catch (err) {
        toast.error("Cambia a la red Polkadot para continuar");
        return;
      }
    }

    const sourceLot = stoneForm.sourceLotId
      ? parseLotIdInput(stoneForm.sourceLotId)
      : (lotId || 0);
    if (!sourceLot) {
      toast.error("Selecciona el Lote origen para la piedra");
      return;
    }

    if (!stoneForm.metadataCid.trim()) {
      toast.error("El CID de metadata es obligatorio");
      return;
    }

    if (stoneForm.certified && !certificateEligible) {
      toast.error("Completa los datos del certificado para emitir un NFT certificado");
      return;
    }

    setIsLoading(true);
    try {
      const tokenUri = stoneForm.metadataCid.startsWith("ipfs://")
        ? stoneForm.metadataCid.trim()
        : `ipfs://${stoneForm.metadataCid.trim()}`;
      const service = new FacetRwaService(wallet.signer);
      const result = await service.mintExtractNft(sourceLot, wallet.address, tokenUri);

      if (user) {
        const { error: stoneError } = await supabase.from("rwa_stones").insert({
          originator_user_id: user.id,
          lot_id: sourceLot,
          token_id: result.tokenId,
          stone_name: stoneForm.stoneName,
          carats: Number(stoneForm.carats),
          cut_type: stoneForm.cutType || null,
          cutter: stoneForm.cutter || null,
          metadata_cid: stoneForm.metadataCid.trim(),
          photo_cid: stoneForm.photoCid || null,
          video_cid: stoneForm.videoCid || null,
          cert_cid: stoneForm.certCid || null,
          certified: stoneForm.certified,
          cert_hash: stoneForm.certHash || null,
          cert_issuer: stoneForm.certIssuer || null,
          cert_date: stoneForm.certDate || null,
          tx_hash: result.txHash,
          chain_id: POLKADOT_CONFIG.chainId,
          nft_address: FACET_EXTRACT_NFT_ADDRESS
        });

        if (stoneError) {
          console.error("Error saving stone:", stoneError);
          toast.error("NFT emitido, pero no se pudo guardar en backend.");
        }
      }

      setMintedStones((prev) => [
        {
          tokenId: result.tokenId,
          lotId: sourceLot,
          stoneName: stoneForm.stoneName,
          carats: stoneForm.carats,
          cutType: stoneForm.cutType,
          photoCid: stoneForm.photoCid || undefined,
          certCid: stoneForm.certCid || undefined,
          videoCid: stoneForm.videoCid || undefined,
          certified: stoneForm.certified,
          certIssuer: stoneForm.certIssuer,
          certDate: stoneForm.certDate,
          certHash: stoneForm.certHash,
          metadataCid: stoneForm.metadataCid,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);

      toast.success(`NFT ${stoneForm.certified ? "certificado" : "de propiedad"} emitido (#${result.tokenId})`);
      setActiveTab("manage");
    } catch (err: any) {
      toast.error(err.message || "Error al emitir NFT");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="container-professional py-8 space-y-8 animate-fade-up">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-display">Gestión de Activos RWA</h1>
            <p className="text-muted-foreground mt-2">Fracciona, redime y monitorea tus esmeraldas en Asset Hub.</p>
          </div>
          {wallet.isConnected ? (
            <div className="flex items-center gap-3">              <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg text-accent text-sm font-mono">
                <Wallet className="w-4 h-4" /> {wallet.address?.slice(0, 8)}…
              </div>
            </div>
          ) : (
            <Button onClick={wallet.connectWallet} className="btn-primary">Conectar Wallet</Button>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/[0.04] p-1 border border-white/[0.08] rounded-xl inline-flex w-full sm:w-auto h-auto">
            <TabsTrigger value="manage" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <LayoutGrid className="w-4 h-4" /> Mis Activos
            </TabsTrigger>
            <TabsTrigger value="register" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Gem className="w-4 h-4" /> Registrar Lote
            </TabsTrigger>
            <TabsTrigger value="ops" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" disabled={!lotId}>
              <Coins className="w-4 h-4" /> Operaciones
            </TabsTrigger>
          </TabsList>

          {/* Manage Tab */}
          <TabsContent value="manage" className="animate-fade-up">
            <div className="grid lg:grid-cols-3 gap-8">

              <div className="lg:col-span-2 space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-subheading uppercase tracking-wider text-muted-foreground">Lotes (Bruto)</h3>
                    <Button variant="link" onClick={() => { setAssetMode("lot"); setActiveTab("register"); }} className="text-accent text-xs">
                      Registrar lote
                    </Button>
                  </div>
                  {userLots.length === 0 ? (
                    <div className="glass-card p-10 text-center">
                      <Gem className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                      <p className="text-muted-foreground">No hay lotes brutos registrados.</p>
                      <div className="flex flex-col items-center gap-2 mt-4">
                        <Button variant="link" onClick={() => { setAssetMode("lot"); setActiveTab("register"); }} className="text-accent">Crear lote bruto</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {userLots.map((lot) => (
                        <div
                          key={lot.lot_id}
                          onClick={() => setLotId(lot.lot_id)}
                          className={`glass-card p-5 cursor-pointer border-l-4 transition-all hover:scale-[1.02] ${lotId === lot.lot_id ? 'border-l-accent border-accent/30' : 'border-l-transparent'}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className="badge-blue">Lote #{lot.lot_id}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{new Date(lot.created_at).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-xl font-display font-semibold text-white">{lot.carats} ct Bruto</h4>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Vault className="w-3 h-3" /> {lot.physical_location}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs font-semibold text-accent">{lot.lot_token_supply} FACET</p>
                            <ChevronRight className={`w-4 h-4 transition-transform ${lotId === lot.lot_id ? 'rotate-90 text-accent' : 'text-muted-foreground'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-subheading uppercase tracking-wider text-muted-foreground">Piedras Listas (NFT)</h3>
                    <Button variant="link" onClick={() => { setAssetMode("stone"); setActiveTab("register"); }} className="text-accent text-xs">
                      Registrar piedra
                    </Button>
                  </div>
                  {mintedStones.length === 0 ? (
                    <div className="glass-card p-10 text-center">
                      <Gem className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                      <p className="text-muted-foreground">No hay piedras listas aún.</p>
                      <p className="text-[10px] text-muted-foreground mt-2">Las piedras listas se generan desde un lote y pueden certificarse.</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {mintedStones.map((stone) => (
                        <div key={`${stone.tokenId}-${stone.lotId}`} className="glass-card p-5 border border-white/[0.08]">
                          <div className="flex items-start gap-4">
                            <div className="h-16 w-16 rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden flex items-center justify-center">
                              {stone.photoCid ? (
                                <img
                                  src={ipfsUrl(stone.photoCid)}
                                  alt={stone.stoneName}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (target.dataset.fallback !== "1") {
                                      target.dataset.fallback = "1";
                                      target.src = ipfsAltUrl(stone.photoCid);
                                    }
                                  }}
                                />
                              ) : (
                                <Gem className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <span className="badge-purple">NFT #{stone.tokenId}</span>
                                <span className={`text-[10px] font-semibold ${stone.certified ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                  {stone.certified ? 'Certificado' : 'Propiedad'}
                                </span>
                              </div>
                              <h4 className="text-lg font-display font-semibold text-white">{stone.stoneName}</h4>
                              <p className="text-xs text-muted-foreground mt-1">Lote origen #{stone.lotId} · {stone.carats} ct</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                            {stone.photoCid && (
                              <button onClick={() => openMediaPreview("photo", stone.photoCid!, `${stone.stoneName} · Foto`)} className="text-accent hover:underline">Foto</button>
                            )}
                            {stone.certCid && (
                              <button onClick={() => openMediaPreview("cert", stone.certCid!, `${stone.stoneName} · Certificado`)} className="text-accent hover:underline">Certificado</button>
                            )}
                            {stone.videoCid && (
                              <button onClick={() => openMediaPreview("video", stone.videoCid!, `${stone.stoneName} · Video`)} className="text-accent hover:underline">Video</button>
                            )}
                            <button onClick={() => openMediaPreview("metadata", stone.metadataCid, `${stone.stoneName} · Metadata`)} className="text-accent hover:underline">
                              Metadata
                            </button>
                            <span className="text-[10px] text-muted-foreground ml-auto">{new Date(stone.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="space-y-6">
                {lotInfo ? (
                  <div className="glass-card p-6 border-t-4 border-t-accent sticky top-24">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-subheading uppercase">Dashboard Detallado</h3>
                      <button onClick={() => refreshLotInfo(lotId!)} disabled={isLoading} className="text-muted-foreground hover:text-accent disabled:opacity-50">
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-muted-foreground">Tokenización</span>
                          <span className="text-white font-semibold">{tokenizationProgress.toFixed(1)}%</span>
                        </div>
                        <Progress value={tokenizationProgress} className="h-1.5 bg-white/5 [&>div]:bg-accent" />
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Emitidos: {FacetRwaService.formatTokenAmount(lotInfo.tokensMinted)} / {FacetRwaService.formatTokenAmount(lotInfo.lotTokenSupply)}
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-muted-foreground">Redención física</span>
                          <span className="text-orange-400 font-semibold">{redemptionProgress.toFixed(1)}%</span>
                        </div>
                        <Progress value={redemptionProgress} className="h-1.5 bg-white/5 [&>div]:bg-orange-400/50" />
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Quemados: {FacetRwaService.formatTokenAmount(lotInfo.tokensRedeemed)} tokens
                        </p>
                      </div>

                      <div className="divider" />

                      <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                        <div>
                          <p className="label-uppercase !text-[9px]">Custodio</p>
                          <p className="truncate text-white/80">{lotInfo.custodyProvider}</p>
                        </div>
                        <div>
                          <p className="label-uppercase !text-[9px]">Ubicación</p>
                          <p className="truncate text-white/80">{lotInfo.physicalLocation}</p>
                        </div>
                      </div>

                      <Button onClick={() => setActiveTab("ops")} className="btn-primary w-full mt-4">
                        Ejecutar Operación <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-8 border border-dashed border-border text-center opacity-60">
                    <Info className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-xs">Selecciona un lote para ver métricas avanzadas y operaciones disponibles.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="grid lg:grid-cols-12 gap-8 animate-fade-up">
            <div className="lg:col-span-8 space-y-6">
              <div className="glass-card p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-heading">Registro de Activo</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Separa lote bruto (tokenizable) vs piedra lista (NFT).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl p-1">
                    <button
                      onClick={() => setAssetMode("lot")}
                      className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg ${assetMode === "lot" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                    >
                      Lote Bruto
                    </button>
                    <button
                      onClick={() => setAssetMode("stone")}
                      className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg ${assetMode === "stone" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                    >
                      Piedra Lista
                    </button>
                  </div>
                </div>

                {assetMode === "lot" ? (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Ubicación física</Label>
                        <Input className="input-professional" value={lotForm.physicalLocation} onChange={e => setLotForm({ ...lotForm, physicalLocation: e.target.value })} placeholder="Ej: Medellín, Caja #104" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Entidad Custodia</Label>
                        <Input className="input-professional" value={lotForm.custodyProvider} onChange={e => setLotForm({ ...lotForm, custodyProvider: e.target.value })} placeholder="Facet Infraestructura" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Quilates (ct)</Label>
                        <Input type="number" className="input-professional" value={lotForm.carats} onChange={e => setLotForm({ ...lotForm, carats: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Tokens a Generar (calculado)</Label>
                        <div className="input-professional bg-white/[0.03] text-accent font-bold h-[42px] flex items-center">{lotTokenSupplyCalc} FACET</div>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Evidencia IPFS (CID)</Label>
                        <Input className="input-professional" value={lotForm.metadataCid} onChange={e => setLotForm({ ...lotForm, metadataCid: e.target.value })} placeholder="bafy..." />
                      </div>
                    </div>
                    <Button onClick={handleCreateLot} disabled={isLoading || !wallet.isConnected} className="btn-primary w-full py-6">
                      {isLoading ? 'Firmando Transacción...' : 'Registrar Lote en Blockchain'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Lote origen</Label>
                        <Input className="input-professional" value={stoneForm.sourceLotId} onChange={e => setStoneForm({ ...stoneForm, sourceLotId: e.target.value })} placeholder="Ej: 3" />
                        <p className="text-[10px] text-muted-foreground">Acepta formatos tipo “6” o “Lote #6”.</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Nombre de la piedra</Label>
                        <Input className="input-professional" value={stoneForm.stoneName} onChange={e => setStoneForm({ ...stoneForm, stoneName: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Quilates (ct)</Label>
                        <Input className="input-professional" value={stoneForm.carats} onChange={e => setStoneForm({ ...stoneForm, carats: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Tipo de talla</Label>
                        <Input className="input-professional" value={stoneForm.cutType} onChange={e => setStoneForm({ ...stoneForm, cutType: e.target.value })} placeholder="Octágono, brillante..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Tallador</Label>
                        <Input className="input-professional" value={stoneForm.cutter} onChange={e => setStoneForm({ ...stoneForm, cutter: e.target.value })} placeholder="Nombre / taller" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Foto (CID)</Label>
                        <Input className="input-professional" value={stoneForm.photoCid} onChange={e => setStoneForm({ ...stoneForm, photoCid: e.target.value })} placeholder="bafy..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Video (CID)</Label>
                        <Input className="input-professional" value={stoneForm.videoCid} onChange={e => setStoneForm({ ...stoneForm, videoCid: e.target.value })} placeholder="bafy..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Certificado (CID)</Label>
                        <Input className="input-professional" value={stoneForm.certCid} onChange={e => setStoneForm({ ...stoneForm, certCid: e.target.value })} placeholder="bafy..." />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                        <div>
                          <p className="text-xs font-semibold">¿Emitir como certificado?</p>
                          <p className="text-[10px] text-muted-foreground">Solo si tienes datos del certificado.</p>
                        </div>
                        <button
                          onClick={() => setStoneForm({ ...stoneForm, certified: !stoneForm.certified })}
                          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg ${stoneForm.certified ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/40" : "bg-white/[0.03] text-muted-foreground border border-white/[0.08]"}`}
                        >
                          {stoneForm.certified ? "Certificado" : "Propiedad"}
                        </button>
                      </div>
                      {stoneForm.certified && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Issuer certificado</Label>
                            <Input className="input-professional" value={stoneForm.certIssuer} onChange={e => setStoneForm({ ...stoneForm, certIssuer: e.target.value })} placeholder="Entidad certificadora" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Fecha certificado</Label>
                            <Input className="input-professional" value={stoneForm.certDate} onChange={e => setStoneForm({ ...stoneForm, certDate: e.target.value })} placeholder="2026-03-19" />
                          </div>
                          <div className="sm:col-span-2 space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-muted-foreground">CertHash (bytes32)</Label>
                            <Input className="input-professional" value={stoneForm.certHash} onChange={e => setStoneForm({ ...stoneForm, certHash: e.target.value })} placeholder="0x..." />
                          </div>
                        </>
                      )}
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Metadata CID (JSON)</Label>
                        <Input className="input-professional" value={stoneForm.metadataCid} onChange={e => setStoneForm({ ...stoneForm, metadataCid: e.target.value })} placeholder="bafy... (JSON en IPFS)" />
                      </div>
                    </div>
                    {!certificateEligible && stoneForm.certified && (
                      <Alert variant="destructive">
                        <AlertDescription>Completa issuer, fecha y certHash para emitir un NFT certificado.</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="glass-card p-4 border border-white/[0.06] space-y-4">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Evidencias IPFS</p>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Foto</p>
                            {stoneForm.photoCid ? (
                              <img
                                src={ipfsUrl(stoneForm.photoCid)}
                                alt="Foto piedra"
                                className="mt-2 rounded-lg w-full h-40 object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.dataset.fallback !== "1") {
                                    target.dataset.fallback = "1";
                                    target.src = ipfsAltUrl(stoneForm.photoCid);
                                  }
                                }}
                              />
                            ) : (
                              <p className="text-xs text-muted-foreground mt-2">Sin foto aún.</p>
                            )}
                          </div>
                          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Certificado</p>
                            {stoneForm.certCid ? (
                              <img
                                src={ipfsUrl(stoneForm.certCid)}
                                alt="Certificado"
                                className="mt-2 rounded-lg w-full h-40 object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.dataset.fallback !== "1") {
                                    target.dataset.fallback = "1";
                                    target.src = ipfsAltUrl(stoneForm.certCid);
                                  }
                                }}
                              />
                            ) : (
                              <p className="text-xs text-muted-foreground mt-2">Sin certificado cargado.</p>
                            )}
                          </div>
                          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Video</p>
                            {stoneForm.videoCid ? (
                              <video
                                className="mt-2 rounded-lg w-full h-40 object-cover"
                                controls
                                src={ipfsUrl(stoneForm.videoCid)}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (target.dataset.fallback !== "1") {
                                    target.dataset.fallback = "1";
                                    target.src = ipfsAltUrl(stoneForm.videoCid);
                                  }
                                }}
                              />
                            ) : (
                              <p className="text-xs text-muted-foreground mt-2">Sin video cargado.</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="glass-card p-4 border border-white/[0.06]">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Preview JSON</p>
                        <Textarea className="input-professional min-h-[160px] mt-3" value={JSON.stringify(stoneMetadataPreview, null, 2)} readOnly />
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Sube este JSON a IPFS y pega el CID en el campo Metadata. Si es certificado, el NFT quedará marcado como tal.
                        </p>
                        <Button onClick={handleMintStoneNft} disabled={isLoading || !wallet.isConnected || !certificateEligible} className="btn-primary w-full py-6">
                          {isLoading ? "Firmando Transacción..." : stoneForm.certified ? "Emitir NFT Certificado" : "Emitir NFT de Propiedad"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-6">
              <div className="glass-card p-6">
                <h4 className="text-subheading mb-4 flex items-center gap-2"><History className="w-4 h-4 text-accent" /> Plantillas Rápidas</h4>
                <div className="space-y-3">
                  {(assetMode === "lot" ? lotTemplates : stoneTemplates).map(t => (
                    <button key={t.id} onClick={() => (assetMode === "lot" ? applyLotTemplate(t as typeof lotTemplates[number]) : applyStoneTemplate(t as typeof stoneTemplates[number]))} className="w-full text-left p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] transition-all group">
                      <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{t.carats} ct · {t.physicalLocation}</p>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="ops" className="animate-fade-up">
            <div className="grid md:grid-cols-2 gap-8">

              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center"><Coins className="w-5 h-5 text-accent" /></div>
                  <h3 className="text-heading text-xl">Tokenizar (Mint)</h3>
                </div>
                <p className="text-sm text-muted-foreground">Emite tokens $FACET-LOT correspondientes a los quilates físicos de este lote.</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cantidad de tokens</Label>
                    <Input className="input-professional" value={mintAmount} onChange={e => setMintAmount(e.target.value)} placeholder="0.00" />
                    <p className="text-[10px] text-muted-foreground">Max disponible: {lotInfo ? Number(lotInfo.lotTokenSupply) - Number(lotInfo.tokensMinted) : 0} tokens</p>
                  </div>
                  <Button onClick={handleMintTokens} disabled={isLoading} className="btn-primary w-full">Emitir Tokens</Button>
                </div>
              </div>

              <div className="glass-card p-6 space-y-6 border-t-4 border-t-orange-400">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-400/20 flex items-center justify-center"><Flame className="w-5 h-5 text-orange-400" /></div>
                  <h3 className="text-heading text-xl">Redimir (Burn)</h3>
                </div>
                <p className="text-sm text-muted-foreground">Quema tokens para solicitar la extracción física de la esmeralda.</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tokens a quemar</Label>
                    <Input className="input-professional text-orange-400" value={burnAmount} onChange={e => setBurnAmount(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground">Tu balance: {walletTokenBalance} FACET</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Referencia de Redención</Label>
                    <Input className="input-professional" value={lotForm.redemptionRef} onChange={e => setLotForm({ ...lotForm, redemptionRef: e.target.value })} placeholder="RED-2026-X" />
                  </div>
                  <Button onClick={handleBurnRedemption} disabled={isLoading} variant="outline" className="w-full border-orange-400/40 text-orange-400 hover:bg-orange-400/10">Ejecutar Redención</Button>
                </div>
              </div>

              <div className="glass-card p-6 space-y-6 border-t-4 border-t-purple-400 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-400/20 flex items-center justify-center"><FileCheck className="w-5 h-5 text-purple-400" /></div>
                  <h3 className="text-heading text-xl">Certificados y Propiedad (NFT)</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Las piedras listas (NFT) se emiten desde la sección <strong>Registrar &gt; Piedra Lista</strong>.
                  Solo las piedras con datos de certificado completos pueden emitirse como NFT certificado.
                </p>
                <Button onClick={() => { setAssetMode("stone"); setActiveTab("register"); }} className="btn-primary w-full">
                  Registrar Piedra Lista
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {mediaPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#0b0f14] border border-white/[0.08] rounded-2xl max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Vista previa</p>
                <h3 className="text-heading text-lg">{mediaPreview.title}</h3>
              </div>
              <Button variant="ghost" onClick={() => setMediaPreview(null)} className="text-muted-foreground">
                Cerrar
              </Button>
            </div>

            {mediaPreview.type === "metadata" ? (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4">
                {metadataError ? (
                  <p className="text-sm text-destructive">{metadataError}</p>
                ) : (
                  <pre className="text-xs text-white/80 whitespace-pre-wrap max-h-[400px] overflow-auto">
                    {metadataPreview || "Cargando metadata..."}
                  </pre>
                )}
              </div>
            ) : mediaPreview.type === "video" ? (
              <video
                className="w-full max-h-[420px] rounded-xl border border-white/[0.08] bg-black"
                controls
                src={ipfsUrl(mediaPreview.cid)}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.dataset.fallback !== "1") {
                    target.dataset.fallback = "1";
                    target.src = ipfsAltUrl(mediaPreview.cid);
                  }
                }}
              />
            ) : (
              <img
                src={ipfsUrl(mediaPreview.cid)}
                alt={mediaPreview.title}
                className="w-full max-h-[420px] object-contain rounded-xl border border-white/[0.08] bg-black"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.dataset.fallback !== "1") {
                    target.dataset.fallback = "1";
                    target.src = ipfsAltUrl(mediaPreview.cid);
                  }
                }}
              />
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <a href={ipfsUrl(mediaPreview.cid)} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Abrir en gateway (Cloudflare)
              </a>
              <a href={ipfsAltUrl(mediaPreview.cid)} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Abrir en gateway (ipfs.io)
              </a>
              <span className="text-[10px] opacity-60">
                Si no carga, puede ser formato HEIC. Sube JPG/PNG para preview nativo.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

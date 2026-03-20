import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REGISTRY_ABI = [
  "event LotCreated(uint256 indexed lotId, uint256 carats, string physicalLocation, string custodyProvider, bytes32 certHash, string metadataCid, uint256 lotTokenSupply)",
  "event LotTokensMinted(uint256 indexed lotId, address indexed to, uint256 amount)",
  "event LotTokensBurned(uint256 indexed lotId, address indexed from, uint256 amount, string redemptionRef)",
  "event ExtractNFTMinted(uint256 indexed lotId, address indexed to, uint256 tokenId, string tokenUri)"
];
const TOKEN_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const parseNumber = (value: string | null) => {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: Record<string, unknown> = {};
    if (req.method !== "GET") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const url = new URL(req.url);
    const fromBlockParam = parseNumber(url.searchParams.get("fromBlock"));
    const toBlockParam = parseNumber(url.searchParams.get("toBlock"));
    const health = url.searchParams.get("health") === "1";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const rpcUrl = Deno.env.get("RPC_URL") || "https://services.polkadothub-rpc.com/testnet";
    const registryAddress = Deno.env.get("RWA_REGISTRY_ADDRESS");
    const tokenAddress = Deno.env.get("FACET_TOKEN_ADDRESS");
    const chainId = Number(Deno.env.get("CHAIN_ID") || 420420422);
    const lookbackBlocks = Number(Deno.env.get("DEFAULT_LOOKBACK_BLOCKS") || 5000);
    const reorgBuffer = Number(Deno.env.get("REORG_BUFFER") || 20);

    if (!registryAddress) {
      throw new Error("RWA_REGISTRY_ADDRESS no configurado");
    }

    if (!supabaseServiceKey) {
      throw new Error("SERVICE_ROLE_KEY no configurado");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const iface = new ethers.Interface(REGISTRY_ABI);
    const tokenIface = new ethers.Interface(TOKEN_ABI);

    const latestBlock = await provider.getBlockNumber();
    const { data: state } = await supabase
      .from("rwa_indexer_state")
      .select("last_block")
      .eq("registry_address", registryAddress)
      .eq("chain_id", chainId)
      .maybeSingle();

    if (health) {
      return new Response(
        JSON.stringify({
          success: true,
          chainId,
          registryAddress,
          tokenAddress: tokenAddress || null,
          latestBlock,
          lastIndexedBlock: state?.last_block ?? null
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const fromBlockInput = typeof body.fromBlock === "number" ? body.fromBlock : fromBlockParam;
    const toBlockInput = typeof body.toBlock === "number" ? body.toBlock : toBlockParam;

    const fallbackFrom = Math.max(latestBlock - lookbackBlocks, 0);
    const stateFrom = state?.last_block !== null && state?.last_block !== undefined
      ? Math.max(Number(state.last_block) - reorgBuffer, 0)
      : fallbackFrom;

    const fromBlockFinal = typeof fromBlockInput === "number" ? fromBlockInput : stateFrom;
    const toBlockFinal = typeof toBlockInput === "number" ? toBlockInput : latestBlock;

    if (fromBlockFinal > toBlockFinal) {
      return new Response(
        JSON.stringify({
          success: true,
          fromBlock: fromBlockFinal,
          toBlock: toBlockFinal,
          count: 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const registryTopics = [[
      iface.getEvent("LotCreated").topicHash,
      iface.getEvent("LotTokensMinted").topicHash,
      iface.getEvent("LotTokensBurned").topicHash,
      iface.getEvent("ExtractNFTMinted").topicHash
    ]];

    const registryLogs = await provider.getLogs({
      address: registryAddress,
      fromBlock: fromBlockFinal,
      toBlock: toBlockFinal,
      topics: registryTopics
    });

    const tokenLogs = tokenAddress
      ? await provider.getLogs({
          address: tokenAddress,
          fromBlock: fromBlockFinal,
          toBlock: toBlockFinal,
          topics: [[tokenIface.getEvent("Transfer").topicHash]]
        })
      : [];

    const registryEvents = registryLogs.map((log) => {
      const parsed = iface.parseLog(log);
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(parsed.args)) {
        if (!Number.isNaN(Number(key))) continue;
        if (typeof value === "bigint") {
          payload[key] = value.toString();
        } else {
          payload[key] = value;
        }
      }
      return {
        lot_id: parsed.args.lotId !== undefined ? Number(parsed.args.lotId) : null,
        event_name: parsed.name,
        tx_hash: log.transactionHash,
        block_number: log.blockNumber,
        log_index: log.index,
        payload
      };
    });

    const transferEvents = tokenLogs.map((log) => {
      const parsed = tokenIface.parseLog(log);
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(parsed.args)) {
        if (!Number.isNaN(Number(key))) continue;
        payload[key] = typeof value === "bigint" ? value.toString() : value;
      }
      payload.tokenAddress = tokenAddress;
      return {
        lot_id: null,
        event_name: "TokenTransfer",
        tx_hash: log.transactionHash,
        block_number: log.blockNumber,
        log_index: log.index,
        payload
      };
    });

    const events = [...registryEvents, ...transferEvents];

    if (events.length > 0) {
      const { error } = await supabase
        .from("rwa_lot_events")
        .upsert(events, { onConflict: "tx_hash,log_index" });

      if (error) {
        throw error;
      }
    }

    await supabase
      .from("rwa_indexer_state")
      .upsert(
        {
          registry_address: registryAddress,
          chain_id: chainId,
          last_block: toBlockFinal,
          updated_at: new Date().toISOString()
        },
        { onConflict: "registry_address,chain_id" }
      );

    return new Response(
      JSON.stringify({
        success: true,
        fromBlock: fromBlockFinal,
        toBlock: toBlockFinal,
        count: events.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error al indexar eventos",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

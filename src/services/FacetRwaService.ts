import { ethers } from "ethers";
import {
  FACET_EXTRACT_NFT_ABI,
  FACET_EXTRACT_NFT_ADDRESS,
  FACET_TOKEN_ABI,
  FACET_TOKEN_ADDRESS,
  FACET_TOKEN_DECIMALS,
  POLKADOT_CONFIG,
  RWA_REGISTRY_ABI,
  RWA_REGISTRY_ADDRESS
} from "@/config/blockchain";

export interface LotInfo {
  carats: number;
  physicalLocation: string;
  custodyProvider: string;
  certHash: string;
  metadataCid: string;
  lotTokenSupply: bigint;
  redeemedCarats: number;
  tokensMinted: bigint;
  tokensRedeemed: bigint;
}

export interface TxResult {
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
}

export interface CreateLotResult extends TxResult {
  lotId: number;
}

export interface MintExtractResult extends TxResult {
  tokenId: number;
}

export class FacetRwaService {
  private registry: ethers.Contract;
  private token: ethers.Contract;
  private nft: ethers.Contract;

  constructor(signer: ethers.Signer) {
    this.registry = new ethers.Contract(RWA_REGISTRY_ADDRESS, RWA_REGISTRY_ABI, signer);
    this.token = new ethers.Contract(FACET_TOKEN_ADDRESS, FACET_TOKEN_ABI, signer);
    this.nft = new ethers.Contract(FACET_EXTRACT_NFT_ADDRESS, FACET_EXTRACT_NFT_ABI, signer);
  }

  static parseTokenAmount(value: string): bigint {
    return ethers.parseUnits(value, FACET_TOKEN_DECIMALS);
  }

  static formatTokenAmount(value: bigint): string {
    return ethers.formatUnits(value, FACET_TOKEN_DECIMALS);
  }

  static async syncIndexer(fromBlock: number, toBlock?: number): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return;

    const url = new URL(`${supabaseUrl}/functions/v1/index-lot-events`);
    url.searchParams.set("fromBlock", String(fromBlock));
    url.searchParams.set("toBlock", String(toBlock ?? fromBlock));

    try {
      await fetch(url.toString(), { method: "GET" });
    } catch (err) {
      console.warn("Indexer sync failed:", err);
    }
  }

  async createLot(params: {
    physicalLocation: string;
    custodyProvider: string;
    certHash: string;
    metadataCid: string;
    carats: number;
    lotTokenSupply: bigint;
  }): Promise<CreateLotResult> {
    const tx = await this.registry.createLot(
      params.physicalLocation,
      params.custodyProvider,
      params.certHash,
      params.metadataCid,
      params.carats,
      params.lotTokenSupply
    );
    const receipt = await tx.wait();

    let lotId = 0;
    for (const log of receipt.logs) {
      try {
        const parsed = this.registry.interface.parseLog(log);
        if (parsed?.name === "LotCreated") {
          lotId = Number(parsed.args.lotId);
          break;
        }
      } catch {
        // ignore non-registry logs
      }
    }

    return {
      lotId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${POLKADOT_CONFIG.explorerUrl}/tx/${receipt.hash}`
    };
  }

  async mintLotTokens(lotId: number, to: string, amount: bigint): Promise<TxResult> {
    const tx = await this.registry.mintLotTokens(lotId, to, amount);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${POLKADOT_CONFIG.explorerUrl}/tx/${receipt.hash}`
    };
  }

  async burnRedemption(lotId: number, from: string, amount: bigint, redemptionRef: string): Promise<TxResult> {
    const tx = await this.registry.burnRedemption(lotId, from, amount, redemptionRef);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${POLKADOT_CONFIG.explorerUrl}/tx/${receipt.hash}`
    };
  }

  async mintExtractNft(lotId: number, to: string, tokenUri: string): Promise<MintExtractResult> {
    const tx = await this.registry.mintNFTextract(lotId, to, tokenUri);
    const receipt = await tx.wait();

    let tokenId = 0;
    for (const log of receipt.logs) {
      try {
        const parsed = this.registry.interface.parseLog(log);
        if (parsed?.name === "ExtractNFTMinted") {
          tokenId = Number(parsed.args.tokenId);
          break;
        }
      } catch {
        // ignore
      }
    }

    return {
      tokenId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${POLKADOT_CONFIG.explorerUrl}/tx/${receipt.hash}`
    };
  }

  async transferTokens(to: string, amount: bigint): Promise<TxResult> {
    const tx = await this.token.transfer(to, amount);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: `${POLKADOT_CONFIG.explorerUrl}/tx/${receipt.hash}`
    };
  }

  async getLot(lotId: number): Promise<LotInfo> {
    const lot = await this.registry.lots(lotId);
    return {
      carats: Number(lot.carats),
      physicalLocation: lot.physicalLocation,
      custodyProvider: lot.custodyProvider,
      certHash: lot.certHash,
      metadataCid: lot.metadataCid,
      lotTokenSupply: BigInt(lot.lotTokenSupply),
      redeemedCarats: Number(lot.redeemedCarats),
      tokensMinted: BigInt(lot.tokensMinted),
      tokensRedeemed: BigInt(lot.tokensRedeemed)
    };
  }

  async getTotalLots(): Promise<number> {
    const total = await this.registry.totalLots();
    return Number(total);
  }

  async getTokenBalance(address: string): Promise<bigint> {
    const balance = await this.token.balanceOf(address);
    return BigInt(balance);
  }

  async getTokenSupply(): Promise<bigint> {
    const supply = await this.token.totalSupply();
    return BigInt(supply);
  }
}

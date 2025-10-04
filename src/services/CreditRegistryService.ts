import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, POLKADOT_CONFIG } from "@/config/blockchain";

export interface CreditRecord {
  borrower: string;
  cid: string;
  pdfHash: string;
  timestamp: number;
}

export interface TransactionResult {
  txHash: string;
  blockNumber: number;
  creditId: number;
  explorerUrl: string;
}

export class CreditRegistryService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(signer: ethers.Signer) {
    this.signer = signer;
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }

  /**
   * Register a new credit on the blockchain
   */
  async registerCredit(cid: string, pdfHash: string): Promise<TransactionResult> {
    try {
      // Get total credits before transaction
      const totalCreditsBefore = await this.contract.totalCredits();
      
      // Send transaction
      const tx = await this.contract.registerCredit(cid, pdfHash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Get the new credit ID
      const creditId = Number(totalCreditsBefore) + 1;
      
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        creditId,
        explorerUrl: `${POLKADOT_CONFIG.explorerUrl}/tx/${receipt.hash}`
      };
    } catch (error: any) {
      console.error("Error registering credit:", error);
      throw new Error(error.message || "Error al registrar crédito en blockchain");
    }
  }

  /**
   * Get credit record by ID
   */
  async getCredit(creditId: number): Promise<CreditRecord> {
    try {
      const record = await this.contract.getCredit(creditId);
      
      return {
        borrower: record.borrower,
        cid: record.cid,
        pdfHash: record.pdfHash,
        timestamp: Number(record.timestamp)
      };
    } catch (error: any) {
      console.error("Error getting credit:", error);
      throw new Error(error.message || "Error al obtener crédito");
    }
  }

  /**
   * Get total number of credits
   */
  async getTotalCredits(): Promise<number> {
    try {
      const total = await this.contract.totalCredits();
      return Number(total);
    } catch (error: any) {
      console.error("Error getting total credits:", error);
      throw new Error(error.message || "Error al obtener total de créditos");
    }
  }

  /**
   * Listen for CreditRegistered events
   */
  onCreditRegistered(callback: (creditId: number, borrower: string, cid: string, pdfHash: string) => void) {
    this.contract.on("CreditRegistered", (creditId, borrower, cid, pdfHash) => {
      callback(Number(creditId), borrower, cid, pdfHash);
    });
  }

  /**
   * Generate PDF hash using keccak256
   */
  static generatePDFHash(pdfData: string | Uint8Array): string {
    return ethers.keccak256(
      typeof pdfData === 'string' ? ethers.toUtf8Bytes(pdfData) : pdfData
    );
  }
}

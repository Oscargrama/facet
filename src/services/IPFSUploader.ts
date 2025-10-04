export interface IPFSUploadResult {
  cid: string;
  url: string;
}

export class IPFSUploader {
  private static PINATA_API_KEY = "YOUR_PINATA_API_KEY"; // TODO: Add to env
  private static PINATA_SECRET = "YOUR_PINATA_SECRET"; // TODO: Add to env
  
  /**
   * Upload a file to IPFS using Pinata
   */
  static async uploadFile(file: File): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Using public IPFS gateway for testing
      // In production, use Pinata or Infura with API keys
      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          pinata_api_key: this.PINATA_API_KEY,
          pinata_secret_api_key: this.PINATA_SECRET
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Error al subir archivo a IPFS");
      }

      const data = await response.json();
      const cid = data.IpfsHash;

      return {
        cid,
        url: `https://gateway.pinata.cloud/ipfs/${cid}`
      };
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  static async uploadJSON(data: any): Promise<IPFSUploadResult> {
    try {
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const file = new File([blob], "contract.json");
      return await this.uploadFile(file);
    } catch (error) {
      console.error("Error uploading JSON to IPFS:", error);
      throw error;
    }
  }

  /**
   * Simulate IPFS upload for testing (returns mock CID)
   */
  static async mockUpload(file: File): Promise<IPFSUploadResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock CID
    const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      cid: mockCid,
      url: `https://ipfs.io/ipfs/${mockCid}`
    };
  }

  /**
   * Get IPFS URL from CID
   */
  static getIPFSUrl(cid: string): string {
    return `https://ipfs.io/ipfs/${cid}`;
  }
}

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { POLKADOT_CONFIG } from "@/config/blockchain";

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
}

export function usePolkadotWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    provider: null,
    signer: null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        
        setWalletState({
          address,
          isConnected: true,
          chainId: Number(network.chainId),
          provider,
          signer
        });
      }
    } catch (err) {
      console.error("Error checking connection:", err);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      checkConnection();
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Por favor instala MetaMask o Talisman");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setWalletState({
        address,
        isConnected: true,
        chainId: Number(network.chainId),
        provider,
        signer
      });

      // Switch to Polkadot testnet if not on it
      if (Number(network.chainId) !== POLKADOT_CONFIG.chainId) {
        await switchToPolkadotNetwork();
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar wallet");
      console.error("Error connecting wallet:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToPolkadotNetwork = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${POLKADOT_CONFIG.chainId.toString(16)}` }]
      });
    } catch (switchError: any) {
      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${POLKADOT_CONFIG.chainId.toString(16)}`,
              chainName: POLKADOT_CONFIG.chainName,
              nativeCurrency: POLKADOT_CONFIG.nativeCurrency,
              rpcUrls: [POLKADOT_CONFIG.rpcUrl],
              blockExplorerUrls: [POLKADOT_CONFIG.explorerUrl]
            }]
          });
        } catch (addError) {
          setError("Error al agregar la red Polkadot");
          throw addError;
        }
      } else {
        setError("Error al cambiar de red");
        throw switchError;
      }
    }
  };

  const disconnect = () => {
    setWalletState({
      address: null,
      isConnected: false,
      chainId: null,
      provider: null,
      signer: null
    });
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!walletState.signer) {
      throw new Error("Wallet no conectada");
    }

    try {
      const signature = await walletState.signer.signMessage(message);
      return signature;
    } catch (err: any) {
      throw new Error(err.message || "Error al firmar mensaje");
    }
  };

  return {
    ...walletState,
    isConnecting,
    error,
    connectWallet,
    disconnect,
    signMessage,
    switchToPolkadotNetwork
  };
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

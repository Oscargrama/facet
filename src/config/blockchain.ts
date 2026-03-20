export const POLKADOT_CONFIG = {
  chainId: 420420417,
  chainName: "Polkadot Hub Testnet",
  rpcUrl: "https://eth-asset-hub-paseo.dotters.network",
  explorerUrl: "https://polkadot-hub-testnet.subscan.io",
  nativeCurrency: {
    name: "PAS",
    symbol: "PAS",
    decimals: 18
  }
};

export const FACET_TOKEN_DECIMALS = 0;

// RWA Contract addresses - update after deployment
export const RWA_REGISTRY_ADDRESS =
  import.meta.env.VITE_RWA_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000";
export const FACET_TOKEN_ADDRESS =
  import.meta.env.VITE_FACET_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
export const FACET_EXTRACT_NFT_ADDRESS =
  import.meta.env.VITE_FACET_EXTRACT_NFT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const RWA_REGISTRY_ABI = [
  "function createLot(string physicalLocation, string custodyProvider, bytes32 certHash, string metadataCid, uint256 carats, uint256 lotTokenSupply) external returns (uint256)",
  "function mintLotTokens(uint256 lotId, address to, uint256 amount) external",
  "function burnRedemption(uint256 lotId, address from, uint256 amount, string redemptionRef) external",
  "function mintNFTextract(uint256 lotId, address to, string tokenUri) external returns (uint256)",
  "function lots(uint256 lotId) external view returns (tuple(uint256 carats, string physicalLocation, string custodyProvider, bytes32 certHash, string metadataCid, uint256 lotTokenSupply, uint256 redeemedCarats, uint256 tokensMinted, uint256 tokensRedeemed))",
  "function totalLots() external view returns (uint256)",
  "function facetToken() external view returns (address)",
  "function extractNft() external view returns (address)",
  "event LotCreated(uint256 indexed lotId, uint256 carats, string physicalLocation, string custodyProvider, bytes32 certHash, string metadataCid, uint256 lotTokenSupply)",
  "event LotTokensMinted(uint256 indexed lotId, address indexed to, uint256 amount)",
  "event LotTokensBurned(uint256 indexed lotId, address indexed from, uint256 amount, string redemptionRef)",
  "event ExtractNFTMinted(uint256 indexed lotId, address indexed to, uint256 tokenId, string tokenUri)"
];

export const FACET_TOKEN_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

export const FACET_EXTRACT_NFT_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

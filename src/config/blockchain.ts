export const POLKADOT_CONFIG = {
  chainId: 420420422,
  chainName: "Polkadot Asset Hub Testnet (Paseo)",
  rpcUrl: "https://testnet-passet-hub-eth-rpc.polkadot.io",
  explorerUrl: "https://blockscout-passet-hub.parity-testnet.parity.io",
  nativeCurrency: {
    name: "PAS",
    symbol: "PAS",
    decimals: 18
  }
};

// Contract address - update after deployment
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // TODO: Update after deployment

export const CONTRACT_ABI = [
  "function registerCredit(string memory cid, string memory pdfHash) external",
  "function getCredit(uint256 id) external view returns (tuple(address borrower, string cid, string pdfHash, uint256 timestamp))",
  "function totalCredits() external view returns (uint256)",
  "event CreditRegistered(uint256 indexed id, address borrower, string cid, string pdfHash)"
];

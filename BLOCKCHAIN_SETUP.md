# Facet RWA - Polkadot Integration Setup Guide

## Overview
Facet RWA integrates with Polkadot Asset Hub Testnet (Paseo) to provide RWA custody, fractional tokenization, and on-chain lifecycle management.

## Network Configuration

- **Network**: Polkadot Asset Hub Testnet (Paseo)
- **Chain ID**: 420420422
- **RPC URL**: https://services.polkadothub-rpc.com/testnet
- **Block Explorer**: https://polkadot-hub-testnet.subscan.io
- **Currency**: PAS (testnet token)

## Prerequisites

1. **Wallet Installation**
   - Install [MetaMask](https://metamask.io/) or [Talisman](https://talisman.xyz/)
   - The application will automatically prompt you to add the Polkadot network

2. **Testnet Tokens**
   - Get PAS testnet tokens from faucet (if available)
   - Needed for transaction gas fees

3. **IPFS Setup** (Optional for production)
   - Sign up for [Pinata](https://pinata.cloud/) or [Infura IPFS](https://infura.io/product/ipfs)
   - Add API keys to `src/services/IPFSUploader.ts`
   - Currently using mock IPFS for development

## Smart Contract Deployment (RWA)

### Step 1: Install deps
```bash
npm install
```

### Step 2: Set env vars
```bash
export RPC_URL=https://services.polkadothub-rpc.com/testnet
export PRIVATE_KEY=0x...
```

### Step 3: Deploy
```bash
npm run deploy:rwa
```

### Step 4: Update addresses
After deployment, update in `src/config/blockchain.ts`:
```typescript
export const RWA_REGISTRY_ADDRESS = "0x...";
export const FACET_TOKEN_ADDRESS = "0x...";
export const FACET_EXTRACT_NFT_ADDRESS = "0x...";
```

## Application Features

### 1. Wallet Connection
- Click "Conectar Wallet" in the ContractReview page
- Approve connection in your wallet
- Network will automatically switch to Polkadot testnet if needed

### 2. RWA Custody Flow
1. **Create Lot**: register custody data, cert hash, IPFS evidence
2. **Mint**: fractional ERC‑20 tokens (FACET‑LOT)
3. **Transfer**: secondary market via ERC‑20 transfers
4. **Burn**: redemption with updated carats
5. **Mint NFT**: extraction receipt (FACET‑EXTRACT)

### 3. Verification
- View transaction on block explorer
- Verify IPFS content using CID
- Check contract record on blockchain using contract ID

## Architecture

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
└────────┬────────┘
         │
         ├─────────► usePolkadotWallet()
         │           (Wallet connection)
         │
         ├─────────► IPFSUploader
         │           (Decentralized storage)
         │
         └─────────► FacetRwaService
                     (RWA registry + tokens)
                     
                            │
                            ▼
                     ┌─────────────┐
                     │  Polkadot   │
                     │  Testnet    │
                     └─────────────┘
```

## Development vs Production

### Development Mode
- Uses mock IPFS upload (no real IPFS)
- Simulated CIDs for testing
- Contract address needs to be set after deployment

### Production Setup
1. Deploy contract to mainnet
2. Configure real IPFS provider (Pinata/Infura)
3. Add API keys to environment variables
4. Update network configuration to mainnet
5. Implement proper error handling and retry logic

## Environment Variables

Create `.env` file (not tracked in git):
```env
VITE_CONTRACT_ADDRESS=0xYourContractAddress
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET=your_pinata_secret
VITE_NETWORK_RPC=https://services.polkadothub-rpc.com/testnet
```

## Testing

### Contract Tests
```bash
npm run test:contracts
npm run coverage:contracts
```

### Manual Testing
1. Navigate to `/contract-review`
2. Connect wallet
3. Registrar lote en "Custodia Física Real"
4. Emitir tokens fraccionados
5. Transferir y redimir (burn)
6. Emitir NFT extract
7. Verificar transacciones en el explorer

### Contract Verification
```javascript
// Get lot by ID
const registry = new FacetRwaService(signer);
const lot = await registry.getLot(1);
console.log(lot);
```

## Troubleshooting

### Wallet not connecting
- Ensure MetaMask/Talisman is installed
- Check if wallet is locked
- Try refreshing the page

### Network errors
- Verify RPC URL is accessible
- Check if you have testnet tokens
- Ensure correct network is selected in wallet

### Transaction failures
- Check gas balance (PAS tokens)
- Verify contract addresses are correct
- Check console for detailed error messages

### IPFS upload fails
- In development, mock upload should always work
- In production, verify API keys are correct
- Check Pinata/Infura service status

## Security Considerations

⚠️ **Important Security Notes:**
1. Never commit private keys or API keys to git
2. Use environment variables for sensitive data
3. Implement rate limiting for IPFS uploads
4. Validate all inputs before blockchain transactions
5. Implement proper access control for contract functions
6. Audit smart contracts before mainnet deployment

## Resources

- [Polkadot Documentation](https://wiki.polkadot.network/)
- [Kitdot Guide](https://github.com/polkadot-api/kitdot)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Block Explorer](https://polkadot-hub-testnet.subscan.io)

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify network configuration
3. Test with small amounts first
4. Review transaction on block explorer

## 🎭 Demo Mode

### Credentials
- **Originador**: `originador@facet.demo`
- **Password**: `Facet2026!`
- **OTP Code**: `123456` (always)

### Demo Mode Behavior
The system detects demo users (`originador@facet.demo`) and applies special behavior:

✅ **No Real Emails Sent**
- Contract emails are not sent to real inboxes
- Database records are created normally for tracking
- Signing URLs are generated but emails are skipped

✅ **No Real SMS Sent**
- OTP is always hardcoded to `123456`
- No Twilio charges are incurred
- OTP is displayed directly in the UI

✅ **Pre-loaded Demo Data**
- Example RWA lots and events
- 1 signed contract with payment history
- 3 payments (2 paid, 1 pending)
- Complete user profile

✅ **Full Functionality**
- All features work normally
- Blockchain transactions can be real or simulated
- Users can test the complete flow without side effects

### Setting Up Demo User
1. Go to Lovable Cloud → Auth Settings
2. Create user manually:
   - Email: `originador@facet.demo`
   - Password: `Facet2026!`
   - Full Name: "Usuario Demo"
3. Copy the generated `user_id`
4. Run SQL scripts (see project documentation) to insert demo data
5. Enable auto-confirm signups in Auth Settings

### Testing Demo Mode
1. Click "Entrar como Demo" on login page
2. Navigate through dashboard to see pre-loaded data
3. Test contract signing flow with automatic OTP (`123456`)
4. Verify no emails/SMS are sent to real recipients

## Next Steps

1. ✅ Deploy RWA contracts
2. ✅ Update contract addresses in config
3. ✅ Get testnet tokens
4. ✅ Test RWA custody flow
5. ✅ Configure demo mode
6. 🔄 Configure production IPFS
7. 🔄 Add comprehensive error handling
8. 🔄 Implement unit tests
9. 🔄 Security audit before mainnet

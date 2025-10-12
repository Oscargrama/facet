# Zentro - Polkadot Integration Setup Guide

## Overview
Zentro integrates with Polkadot Asset Hub Testnet (Paseo) to provide blockchain-based credit contract management with immutable record-keeping and IPFS storage.

## Network Configuration

- **Network**: Polkadot Asset Hub Testnet (Paseo)
- **Chain ID**: 420420422
- **RPC URL**: https://testnet-passet-hub-eth-rpc.polkadot.io
- **Block Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io
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

## Smart Contract Deployment

### Step 1: Install kitdot (if not already installed)
```bash
npm install -g kitdot
```

### Step 2: Initialize kitdot project
```bash
kitdot init
```

### Step 3: Deploy CreditRegistry Contract
```bash
npx kitdot deploy src/contracts/CreditRegistry.sol --network passetHub
```

### Step 4: Update Contract Address
After deployment, update the contract address in `src/config/blockchain.ts`:
```typescript
export const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
```

## Application Features

### 1. Wallet Connection
- Click "Conectar Wallet" in the ContractReview page
- Approve connection in your wallet
- Network will automatically switch to Polkadot testnet if needed

### 2. Contract Signing Flow
1. **Sign Contract**: Wallet opens to sign the contract hash
2. **Upload to IPFS**: Contract is uploaded to IPFS for decentralized storage
3. **Blockchain Anchoring**: Contract hash and IPFS CID are registered on-chain
4. **Verification**: Transaction details are displayed with block explorer link

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
         └─────────► CreditRegistryService
                     (Smart contract interaction)
                     
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
VITE_NETWORK_RPC=https://testnet-passet-hub-eth-rpc.polkadot.io
```

## Testing

### Manual Testing
1. Navigate to `/contract-review`
2. Connect wallet
3. Click "Firmar y Anclar en Blockchain"
4. Verify each step completes:
   - ✅ Contract signed
   - ✅ IPFS upload complete
   - ✅ Blockchain registration complete
5. Check transaction on block explorer

### Contract Verification
```javascript
// Get credit record by ID
const registry = new CreditRegistryService(signer);
const credit = await registry.getCredit(1);
console.log(credit);
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
- Verify contract address is correct
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
- [Block Explorer](https://blockscout-passet-hub.parity-testnet.parity.io)

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify network configuration
3. Test with small amounts first
4. Review transaction on block explorer

## 🎭 Demo Mode

### Credentials
- **Email**: `demo@zentrocredit.com`
- **Password**: `Demo2024!Zentro`
- **OTP Code**: `123456` (always)

### Demo Mode Behavior
The system detects demo users (`demo@zentrocredit.com`) and applies special behavior:

✅ **No Real Emails Sent**
- Contract emails are not sent to real inboxes
- Database records are created normally for tracking
- Signing URLs are generated but emails are skipped

✅ **No Real SMS Sent**
- OTP is always hardcoded to `123456`
- No Twilio charges are incurred
- OTP is displayed directly in the UI

✅ **Pre-loaded Demo Data**
- 2 credit applications (1 approved, 1 pending)
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
   - Email: `demo@zentrocredit.com`
   - Password: `Demo2024!Zentro`
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

1. ✅ Deploy CreditRegistry contract
2. ✅ Update contract address in config
3. ✅ Get testnet tokens
4. ✅ Test full contract flow
5. ✅ Configure demo mode
6. 🔄 Configure production IPFS
7. 🔄 Add comprehensive error handling
8. 🔄 Implement unit tests
9. 🔄 Security audit before mainnet

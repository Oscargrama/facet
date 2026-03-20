# 💎 Facet RWA — Real Custody + Tokenization

Facet RWA tokenizes Colombian emeralds with **verifiable physical custody**, issuing fractionalized tokens and certified NFTs on the Polkadot Asset Hub.
---

## 🎥 Quick Access

- **Video Pitch:** (add link)
- **Live Demo App:** (add link)
- **GitHub Repository:** (add link)
- **Project Hub (Notion):** (add link)

### Demo Users (Hackathon)

- **Demo (acceso rápido):** demo@facetrwa.com / Facet2026!  
- **Inversionista:** investor@facet.demo / Facet2026!  

> All transactions are over **testnet**.

---

## 📊 Key Features

- **Dashboard** with simulated activity and metrics  
- **Credit application flow** with full data validation  
- **Automated risk scoring** and decisioning  
- **Digital contract signature** with OTP  
- **On‑chain registration** (Polkadot / Ethereum)  
- **RWA custody registry** (physical lot + IPFS evidence)  
- **Fractional ERC‑20 tokenization** (1 token = 0.01 ct)  
- **Redemption burn + extract NFT**  
- **Wallet connection** through Polkadot.js or Ethers.js  
- **Demo Mode** with preloaded data & fixed OTP  

---

## 🧱 Architecture Overview

```
Frontend (Vite + React)
     ↓
Supabase (Auth • DB • Edge Functions)
     ↓
Polkadot Asset Hub (EVM Testnet)
  ├─ RwaLotRegistry (custody + lifecycle)
  ├─ FACET-LOT (ERC20)
  └─ FACET-EXTRACT (ERC721)
```

### Technology Stack

- **Vite + React + TypeScript**
- **Supabase** (Auth, Database, Edge Functions)
- **Ethers.js** (EVM)
- **Hardhat** (contracts + tests)
- **TailwindCSS**
- **Resend** (email) / **Twilio** (SMS — production only)

---

## ⚙️ Installation (Local Development)

```bash
# Clone the repository
git clone https://github.com/Oscargrama/facet-rwa.git
cd facet-rwa

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run the app
npm run dev
```

### Required Environment Variables

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
DEMO_EMAIL=demo@facetrwa.com
DEMO_PASSWORD=Facet2026!
TEST_MODE=true
```

---

## 🔄 User Flow (Hackathon)

### Originador (Custodio)
1. Registrar lote físico (custodia + IPFS).
2. Emitir tokens FACET‑LOT (1 token = 0.01 ct).
3. Transferir tokens a inversionistas.
4. Redimir (burn) y emitir NFT extract.

### Inversionista
1. Entra a **/investor**.
2. Copia tu wallet y solicitas transferencia.
3. Recibes tokens o NFT certificado.

---

## 🧾 Demo Mode Summary

| Feature | Demo | Production |
|--------|------|------------|
| Email/SMS | Simulated | Real (Resend/Twilio) |
| OTP | Fixed `123456` | Random |
| Preloaded data | Yes | No |
| Blockchain | Testnet | Testnet/Mainnet |
| Digital signature | Simulated UI | Actual on‑chain |

### Edge Functions Used

- `ensure-demo-user` — manages the demo user  
- `send-otp` — fixed OTP sender  
- `verify-otp` — fixed OTP validator  
- `register-signature-blockchain` — submits signature to testnet  

📘 More details: `docs/MODO_DEMO.md`

---

## 📚 Project Resources

| Type | Link |
|------|------|
| Project Hub (Notion) | (Add link) |
| Video Pitch | (Add link) |
| GitHub Repository | (Add link) |
| Interactive Demo | (Add link) |
| Hackathon Registration | (Add link) |
| Pitch Deck | (Add link) |

---

## 🛡️ Security Considerations

- Demo data is **read‑only**  
- No real email/SMS delivery in demo  
- Blockchain interactions occur on **testnet only**  
- Demo sessions expire automatically  

---

## 💎 RWA Custody MVP (Hackathon)

**Hook:** *Inventario físico real bajo custodia verificable.*  
20ct esmeraldas colombianas en caja fuerte Medellín → tokenizadas en Polkadot Hub.  

Flujo:
1. Registrar lote físico on‑chain (ubicación, custodio, hash de certificado, IPFS con evidencia).
2. Mint fraccionado FACET‑LOT (1 token = 0.01 ct).
3. Tradeo secundario (transferencias ERC20).
4. Burn para redención + emisión NFT extract.

### RWA Contracts
- `RwaLotRegistry` — custodia, lotes, lifecycle.
- `FACET-LOT` — ERC‑20 fraccionado.
- `FACET-EXTRACT` — ERC‑721 de extracción.

### Edge Functions (RWA)
- `index-lot-events` — indexa eventos on‑chain en Supabase.

**Cron (pull):** configura un schedule (ej: cada 2 minutos) para `index-lot-events`.

### Env Vars (RWA)
```
VITE_RWA_REGISTRY_ADDRESS=
VITE_FACET_TOKEN_ADDRESS=
VITE_FACET_EXTRACT_NFT_ADDRESS=
VITE_NETWORK_RPC=https://services.polkadothub-rpc.com/testnet
```

**Edge Function env (index-lot-events):**
```
SUPABASE_URL=
SERVICE_ROLE_KEY=
RPC_URL=https://services.polkadothub-rpc.com/testnet
RWA_REGISTRY_ADDRESS=
CHAIN_ID=420420422
DEFAULT_LOOKBACK_BLOCKS=5000
REORG_BUFFER=20
```

---

## 🧩 Roadmap

- ✅ Demo Mode (v1.0)  
- 🔜 Integration with real scoring oracles  
- 🔜 Investor marketplace expansion  
- 🔜 Multi‑network stablecoin support (Polkadot + Ethereum)  
- 🔜 Optimized mobile UX  

---

## 🏆 Hackathon Context

Facet RWA is being developed for a hackathon demo.  
Our mission is to prove verifiable physical custody and compliant tokenization of real‑world assets.

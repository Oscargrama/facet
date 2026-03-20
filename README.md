# Facet RWA

> Physical custody and on-chain tokenization of Colombian emeralds.
> Built on Polkadot Asset Hub (EVM) — Hackathon 2026.

---

## Quick Access

| | |
|---|---|
| **Live Demo** | [add link] |
| **Video Pitch** | [add link] |
| **Documentation** | https://facet-pitch-deck.vercel.app |
| **GitHub** | https://github.com/Oscargrama/facet-rwa |

> Click **"Demo"** on the login screen — no account or credentials needed.
> All blockchain interactions run on Polkadot Asset Hub Testnet.

---

## The Problem

Colombia produces 70% of the world's emeralds. Yet the market is
illiquid, opaque, and untraceable across the asset lifecycle.
Value is created at every stage — from raw lot to cut gemstone —
but no system captures it.

Facet RWA fixes that.

---

## What We Built

On-chain infrastructure for real-world physical inventory
with verifiable custody. Each lot that enters a vault in Medellín
gets a full digital lifecycle on Polkadot Asset Hub.

### Asset Lifecycle

```
Physical lot enters vault (Medellín)
        ↓
Registered on-chain → RwaLotRegistry
(location · custodian · weight · certificate hash)
        ↓
Fractionalized → FACET-LOT ERC20
(1 token = 0.01 ct · transferable · tradeable)
        ↓
Physical extraction → tokens BURN
        ↓
Unique NFT minted → FACET-EXTRACT ERC721
(photo + metadata + certificate of authenticity)
```

---

## Architecture

```
Frontend (Vite + React + TypeScript)
          ↓
Supabase (Auth · Database · Edge Functions)
          ↓
Polkadot Asset Hub — EVM Testnet (Chain ID: 420420422)
  ├─ RwaLotRegistry   → custody + full lifecycle
  ├─ FACET-LOT        → ERC20 fractionalized tokens
  └─ FACET-EXTRACT    → ERC721 extraction NFT
```

### Stack

- **Vite + React + TypeScript + TailwindCSS**
- **Supabase** — Auth, Database, Edge Functions
- **Ethers.js** + **Hardhat**
- **Polkadot Asset Hub** EVM Testnet
- **Resend** (email) / **Twilio** (SMS — production only)

---

## Smart Contracts

| Contract | Type | Role |
|---|---|---|
| `RwaLotRegistry` | Custom | Custody registry + lifecycle |
| `FACET-LOT` | ERC20 | Fractionalized tokens (1 token = 0.01 ct) |
| `FACET-EXTRACT` | ERC721 | Extraction certificate NFT |

---

## Run Locally

```bash
git clone https://github.com/Oscargrama/facet-rwa.git
cd facet-rwa
npm install
cp .env.example .env.local
npm run dev
```

### Environment Variables

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Contracts
VITE_RWA_REGISTRY_ADDRESS=
VITE_FACET_TOKEN_ADDRESS=
VITE_FACET_EXTRACT_NFT_ADDRESS=
VITE_NETWORK_RPC=https://services.polkadothub-rpc.com/testnet

# Mode
TEST_MODE=true
```

**Edge Function — `index-lot-events`:**

```env
SUPABASE_URL=
SERVICE_ROLE_KEY=
RPC_URL=https://services.polkadothub-rpc.com/testnet
RWA_REGISTRY_ADDRESS=
CHAIN_ID=420420422
DEFAULT_LOOKBACK_BLOCKS=5000
REORG_BUFFER=20
```

---

## Demo Mode

Click **"Demo"** on the login screen — no registration required.

| Feature | Demo | Production |
|---|---|---|
| Email / SMS | Simulated | Real (Resend / Twilio) |
| OTP | Fixed | Random |
| Preloaded data | Yes | No |
| Blockchain | Testnet | Testnet → Mainnet |

Demo data is read-only. No real credentials required.

---

## Roadmap

- ✅ v1.0 — Demo mode · testnet contracts · full lifecycle
- 🔜 v1.1 — Oracle integration for real-time valuation
- 🔜 v1.2 — Investor marketplace with order book
- 🔜 v2.0 — Multi-commodity + mainnet

---

## Documentation

Full project documentation, pitch deck, and architecture details:
[**https://facet-pitch-deck.vercel.app**](https://facet-pitch-deck.vercel.app)

---

## Hackathon

Built for Polkadot Solidity Hackathon 2026.
Mission: prove that verifiable physical custody and compliant
tokenization of real-world assets is possible today, on Polkadot.

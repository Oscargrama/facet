# 💳 Zentro Credit — On‑chain Credit Platform

Zentro Credit is a fintech solution designed to **evaluate, issue, and record credit on blockchain**, combining automated risk scoring with full on‑chain transparency.  
A fully functional **Demo Mode** allows exploration without real data, accounts, or risk.

---

## 🎥 Quick Access

- **Video Pitch:** https://loom.com/share/1f30036c6e92467b822877b0e14c0144
- **Live Demo App:** https://zentro-creditflow.lovable.app/
- **GitHub Repository:** https://github.com/Oscargrama/zentro-creditflow.git
- **Project Hub (Notion):** https://www.notion.so/2897cb4a6fac80c29ffeda8c7d5f76d8?pvs=25

### Demo Mode Credentials

- **Email:** demo@zentrocredit.com  
- **Password:** Demo2024!Zentro  
- **OTP:** 123456  

> ⚠️ Emails and SMS are simulated in Demo Mode.  
> Blockchain transactions execute on **testnet**.

---

## 📊 Key Features

- **Dashboard** with simulated activity and metrics  
- **Credit application flow** with full data validation  
- **Automated risk scoring** and decisioning  
- **Digital contract signature** with OTP  
- **On‑chain registration** (Polkadot / Ethereum)  
- **Wallet connection** through Polkadot.js or Ethers.js  
- **Demo Mode** with preloaded data & fixed OTP  

---

## 🧱 Architecture Overview

```
Frontend (Next.js)
     ↓
Supabase (Auth • DB • Edge Functions)
     ↓
Polkadot Blockchain (Testnet)
```

### Technology Stack

- **Next.js + TypeScript**
- **Supabase** (Auth, Database, Edge Functions)
- **Polkadot.js / Ethers.js**
- **TailwindCSS**
- **Resend** (email) / **Twilio** (SMS — production only)

---

## ⚙️ Installation (Local Development)

```bash
# Clone the repository
git clone https://github.com/Oscargrama/zentro-creditflow.git
cd zentro-creditflow

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
DEMO_EMAIL=demo@zentrocredit.com
DEMO_PASSWORD=Demo2024!Zentro
TEST_MODE=true
```

---

## 🔄 User Flow (Demo Mode)

1. Login or click **“Demo Login”**  
2. Navigate to the **Dashboard**  
3. Review or create credit applications  
4. Automatic **risk assessment**  
5. Contract review  
6. **Digital signature** using OTP `123456`  
7. Signature is **recorded on testnet**  

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
| Project Hub (Notion) | Zentro Notion Hub |
| Video Pitch | Watch on Loom |
| GitHub Repository | Zentro Creditflow |
| Interactive Demo | https://zentro-creditflow.lovable.app/ |
| LatinHack Registration | https://app.latinhack.io/ |
| Pitch Deck | (Add link) |

---

## 🛡️ Security Considerations

- Demo data is **read‑only**  
- No real email/SMS delivery in demo  
- Blockchain interactions occur on **testnet only**  
- Demo sessions expire automatically  

---

## 🧩 Roadmap

- ✅ Demo Mode (v1.0)  
- 🔜 Integration with real scoring oracles  
- 🔜 Institutional lender portal  
- 🔜 Multi‑network stablecoin support (Polkadot + Ethereum)  
- 🔜 Optimized mobile UX  

---

## 🏆 Hackathon Context

Zentro Credit is being developed for **LatinHack**, the largest blockchain hackathon in Latin America.  
Our mission is to democratize access to credit with transparent, automated, and on‑chain financial infrastructure.

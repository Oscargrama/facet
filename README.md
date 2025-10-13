# 💳 Zentro Credit — Plataforma de Créditos On-chain

> Solución fintech que permite evaluar, otorgar y registrar créditos en blockchain.  
> Incluye un **Modo Demo** totalmente funcional para explorar sin necesidad de datos reales.

---

## 🎥 Demo Rápida

- **Video Pitch:** [Ver en Loom](http://loom.com/share/1f30036c6e92467b822877b0e14c0144)  
- **App Online (Demo):** [https://zentro-creditflow.lovable.app/](https://zentro-creditflow.lovable.app/)  
- **Repositorio GitHub:** [https://github.com/Oscargrama/zentro-creditflow.git](https://github.com/Oscargrama/zentro-creditflow.git)

### Credenciales de Modo Demo
📧 Email: demo@zentrocredit.com
🔐 Password: Demo2024!Zentro
🔢 OTP: 123456

> ⚠️ En modo demo, los correos y SMS se simulan, pero las transacciones blockchain se ejecutan en **testnet**.

---

## 📊 Funcionalidades Clave

- 🏠 **Dashboard** con estadísticas y aplicaciones simuladas  
- 🧾 **Solicitud de crédito** con validación completa  
- 🤖 **Evaluación de riesgo** y scoring automatizado  
- ✍️ **Firma digital con OTP** y registro blockchain  
- 🔗 **Conexión de wallet** (Polkadot / Ethereum)  
- 🧠 **Modo Demo:** datos precargados y OTP fijo `123456`

---

## 🧱 Arquitectura General
Frontend (Next.js)
↓
Supabase (Auth, DB, Edge Functions)
↓
Blockchain Testnet (Polkadot)

### Stack Principal

- Next.js + TypeScript  
- Supabase (Auth, Functions, Database)  
- Polkadot.js / Ethers.js  
- TailwindCSS  
- Resend (emails reales) / Twilio (SMS reales, solo en modo producción)

---

## ⚙️ Instalación y Ejecución Local
```bash
# Clonar el repositorio
git clone https://github.com/Oscargrama/zentro-creditflow.git
cd zentro-creditflow

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Ejecutar en modo desarrollo
npm run dev
Variables requeridas (.env.local):
iniSUPABASE_URL=
SUPABASE_ANON_KEY=
DEMO_EMAIL=demo@zentrocredit.com
DEMO_PASSWORD=Demo2024!Zentro
TEST_MODE=true

🔄 Flujo de Usuario

Login o clic en "Demo Login"
Acceso directo al Dashboard
Ver y crear solicitudes de crédito
Evaluación de riesgo → Revisión de contrato
Firma digital con OTP 123456
Registro automático de la firma en testnet


🧾 Modo Demo — Descripción Rápida
El Modo Demo permite probar la plataforma sin registro ni datos reales.
ComportamientoDemoRealEmail/SMS❌ Simulado✅ Enviado (Resend/Twilio)OTP123456 fijoAleatorioDatos precargados✅ Incluidos❌ VacíoBlockchain✅ Testnet✅ Testnet/MainnetFirma digitalSimuladaReal
Edge Functions involucradas

ensure-demo-user → crea/actualiza usuario demo
send-otp → OTP fijo 123456
verify-otp → acepta OTP fijo
register-signature-blockchain → registra firma real en testnet

📘 Guía completa: docs/MODO_DEMO.md

📚 Recursos del Proyecto
TipoLink🧾 Hub (Notion)Zentro Notion Hub🎥 Video PitchVer en Loom💻 Repositorio GitHubZentro Creditflow🔗 Página /test (demo interactiva)https://zentro-creditflow.lovable.app/📅 Registro en LatinHack Apphttps://app.latinhack.io/🖥️ Pitch Deck (PPT)(agregar enlace a tu presentación)

🛡️ Seguridad y Restricciones

Los datos demo no son modificables.
No se envían correos ni SMS reales.
Las transacciones blockchain se realizan solo en testnet.
Sesiones demo expiran automáticamente tras inactividad.


🧩 Roadmap / Próximos Pasos

✅ Modo Demo (v1.0)
🔜 Integración con oráculos de scoring real
🔜 Portal para lenders institucionales
🔜 Multired de stablecoins (Polkadot + Ethereum)
🔜 Versión móvil optimizada


🏆 Hackathon
Este proyecto está siendo desarrollado como parte de LatinHack, la hackathon de blockchain más grande de Latinoamérica.
Zentro Credit representa nuestra visión de democratizar el acceso al crédito mediante tecnología blockchain, combinando evaluación de riesgo automatizada con transparencia on-chain.

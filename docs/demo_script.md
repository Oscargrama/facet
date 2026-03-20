# Demo Script — Facet RWA Custody

## Narrative Hook
"Unico RWA del hackathon con INVENTARIO FISICO REAL bajo custodia verificable.
20ct esmeraldas colombianas en caja fuerte Medellin → tokenizadas en Polkadot Hub."

## Guion (5–7 min)
1. Mostrar evidencia fisica (foto/video timestamped) del lote 20ct en caja fuerte.
2. UI: Registrar lote con ubicacion exacta, custodio, hash del certificado y CID IPFS.
3. Confirmar transaccion en explorer (createLot).
4. Mint de tokens fraccionados (1 token = 0.01 ct). Mostrar supply y balance.
5. Tradeo secundario: transfer ERC20 a otra wallet (simulado en testnet).
6. Redencion: burn tokens → carats redimidos actualizados.
7. Emitir NFT extract con token URI (IPFS).
8. Verificacion final: supply quemado = carats redimidos. Mostrar eventos.

## Checklist tecnico
- Wallet conectada (MetaMask/Talisman)
- Direcciones actualizadas en `src/config/blockchain.ts`
- PAS testnet para gas
- CID IPFS real de evidencia

## Frases clave
- "Estas piedras existen, aqui estan las fotos con timestamp."
- "Hash del certificado en cadena; evidencia en IPFS."
- "Quema de tokens = redencion fisica."

# Sevai-Scout

A government scheme discovery and application assistant for low-literacy rural users in Tamil Nadu. Hackathon MVP.

## Quick start

```bash
# Install dependencies (root, client, server)
npm run install:all

# Copy env and add your Anthropic key
cp .env.example server/.env
# Edit server/.env with your ANTHROPIC_API_KEY

# Start both client and server concurrently
npm run dev
```

Client runs at http://localhost:5173. Server at http://localhost:5000.

## Tech
- React 18 + Vite + TailwindCSS + Framer Motion
- Node.js + Express backend
- Claude API (`claude-sonnet-4-20250514`) via backend proxy
- localStorage for vault, audit log, applications
- Web Speech API (speechSynthesis / MediaRecorder)

## Privacy
The Citizen Identity Vault is stored encrypted on-device in localStorage. It is never transmitted to any server.

## Demo flow
1. Fresh load → WhatsApp-style Tamil onboarding
2. Complete ~90s → WOW MOMENT reveal
3. Feed of matched schemes → tap Kelungal (Listen) → audio plays
4. Apply Now → auto-filled form → mock camera → success animation
5. Cross-scheme chaining suggests Fasal Bima
6. Applications tab → status timeline → fix rejected
7. Profile → Sahayak mode with mock codes: `100100`, `200200`, `300300`
8. Language toggle switches everything live

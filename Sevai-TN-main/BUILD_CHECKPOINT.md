# Sevai-Scout — Build Checkpoint

Paused mid-build. Resume from the "NEXT" section below.

## Status snapshot

| # | Phase | State |
|---|---|---|
| 1 | Scaffold project structure | Done |
| 2 | 25 mock schemes + districts + strings | Done |
| 3 | Utilities (eligibility, vault, speech, formatters, sahayak, applications) | Done |
| 4 | Hooks (useVault, useEligibility, useLanguage) | Done |
| 5 | Components | **In progress — 3 of 10 done** |
| 6 | Pages (Feed, Applications, Profile) + App.jsx + bottom nav | Not started |
| 7 | Express backend (Claude client, /extract-intent, /summarize-scheme) | Not started |
| 8 | Tailwind styling polish | Partially in index.css / tailwind config |
| 9 | End-to-end demo test | Not started |

## Files written so far

### Root
- `package.json` — root with `npm run dev` (concurrently client + server)
- `.env.example`, `.gitignore`, `README.md`

### Client scaffold
- `client/package.json` — React 18, Vite, Tailwind, Framer Motion, react-router-dom
- `client/vite.config.js` — proxies `/api` → `http://localhost:5000`
- `client/tailwind.config.js` — brand colors (green `#1B5E20`, saffron `#FF8F00`, bg `#FAFAF5`), font sizes, wave keyframes
- `client/postcss.config.js`
- `client/index.html` — Noto Sans Tamil + Inter fonts, TN theme color
- `client/public/favicon.svg`
- `client/src/main.jsx` — Router root
- `client/src/index.css` — Tailwind layers, `.btn-primary`, `.btn-secondary`, `.btn-saffron`, `.chip`, `.card`, `.amber-banner`, `.wave-bar`, `.check-draw` animation

### Data
- `client/src/data/districts.js` — 30 TN districts with EN + TA labels
- `client/src/data/schemes.js` — **25 schemes**, with `daysFromNow()` helper and `spread()` district applicants helper. Schemes: pm-kisan, pm-fasal-bima, kcc-kisan-credit, pmgdisha, tn-amma-unavagam, tn-girl-child, mudra-yojana, pmay-gramin, pm-matru-vandana, ayushman-bharat, cmchis-tn, tn-moovalur-marriage, dr-muthulakshmi-maternity, tn-free-laptop, tn-scholarship-sc, pm-kisan-mandhan, tn-ration-card, pm-ujjwala, pmay-urban, pm-vishwakarma, stand-up-india, janani-suraksha, national-means-cum-merit, tn-free-housing, mgnrega. Also exports `SCHEME_BY_ID`.
- `client/src/data/strings.js` — `t(key, lang)` + `tf(key, lang, vars)`. All UI strings including nav, onboarding prompts, wow copy, apply flow, status, errors.

### Utils
- `client/src/utils/vaultEncryption.js` — PIN-derived XOR + base64. `saveVault`, `loadVault`, `vaultExists`, `clearVault`, `EMPTY_VAULT`. Default PIN `'1234'`.
- `client/src/utils/eligibilityEngine.js` — `evaluateOne`, `evaluateAll`, `relatedEligible`, `totalBenefitValue`, `daysUntil`. Hard filter on caste/gender/occupation, 2-year age fuzzy, 20% income fuzzy, composite score `deadline*0.4 + district*0.3 + benefit*0.3`.
- `client/src/utils/speechUtils.js` — `speak`, `stopSpeaking`, `pickVoice`, `hasTamilVoice`, `playSuccessChime` (Web Audio API two-tone), `createRecorder` (MediaRecorder → webm blob).
- `client/src/utils/formatters.js` — `formatRupees`, `formatTime`, `formatTimeTa`, `deadlineColor`, `categoryEmoji`, `occupationKey`, `incomeBandToMax`, `ageBandToNumber`.
- `client/src/utils/sahayakMock.js` — PIN `'9999'`, 3 beneficiaries `100100` Muthulakshmi (homemaker, Madurai), `200200` Rajan (farmer, Thanjavur), `300300` Kavitha (student, Coimbatore). Audit log in `sevai_audit_log` localStorage key.
- `client/src/utils/applications.js` — `loadApplications`, `saveApplications`, `addApplication`, `updateApplicationStatus`, `saveReminder`, `hasReminder`. Keys: `sevai_applications`, `sevai_reminders`.

### Hooks
- `client/src/hooks/useVault.js` — `{ vault, setVault, resetVault, ready, hasVault }`
- `client/src/hooks/useEligibility.js` — returns `{ eligible, close_matches, totalCount, totalValue }`
- `client/src/hooks/useLanguage.js` — `LanguageProvider` + `useLanguage()` (written using `React.createElement` so the file can stay `.js`)

### Components (3 of 10 done)
- [x] `ChatOnboarding.jsx` — WhatsApp-style chat UI, 7 steps, mic button → POST `/api/extract-intent`, language toggle, voice answer confirmation
- [x] `WowReveal.jsx` — Count-up N and ₹ value, TTS, auto-advance after 3.2s
- [x] `DeadlineVisualizer.jsx` — Progress bar (green→amber→red), district applicant count, bell reminder

## NEXT — pick up here

### Components remaining (7)
1. `SchemeCard.jsx` — category emoji, plain name + official small gray, DeadlineVisualizer, benefit badge, Kelungal button (SamjhaoButton), Apply Now, verified-by trust badge
2. `SamjhaoButton.jsx` — Calls `/api/summarize-scheme`, plays TTS with animated waveform bars, shows 3-bullet transcript
3. `FuzzyMatchCard.jsx` — dashed border, "Eligible in X months" or "Check with Panchayat" badge, tooltip
4. `CrossSchemeChain.jsx` — "You also qualify for" chips pulled from `relatedEligible`
5. `SuccessAnimation.jsx` — Full-screen green, SVG check draw, `playSuccessChime`, time elapsed, TTS confirmation
6. `StatusTimeline.jsx` — Vertical line with 3 nodes, plain-language status copy, mock SMS preview card, Fix & Resubmit button
7. `SahayakMode.jsx` — Two-PIN flow, code entry, beneficiary card, initiate application, audit log append

### Pages (3) + shell
- `pages/Feed.jsx` — home after onboarding, renders eligible list via `useEligibility`, Close Matches section at bottom, no search bar, "Searching for schemes..." loading state
- `pages/Applications.jsx` — timeline list, one seeded as rejected
- `pages/Profile.jsx` — vault display (edit per field, re-evaluates feed), "Stored only on this device" banner, Sahayak login section, helper activity log
- `App.jsx` — Router, bottom nav (Feed/Applications/Profile), language provider mount, onboarding gate that reads `vault.onboarding_complete`
- Bottom nav component inline or `components/BottomNav.jsx`

### Backend (`server/`)
- `server/package.json` — express, cors, dotenv, multer, @anthropic-ai/sdk, nodemon
- `server/index.js` — Express app, CORS, JSON body, multer for audio, mount routes
- `server/middleware/claudeClient.js` — Anthropic client wrapper using `claude-sonnet-4-20250514` model
- `server/routes/intentExtraction.js` — POST `/api/extract-intent`. Accepts `multipart/form-data { audio, language, field, question }`. Sends audio as base64 document to Claude or just passes along transcription prompt. Returns `{ field, value, confidence, clarification_needed }`.
  - NOTE: Claude Messages API does not natively take audio. Implementation plan: send a text message describing the question + field + a base64 audio reference, and rely on Claude to reason about what the user likely said. OR fall back to just text extraction if no audio support. For the demo, we'll accept either raw text (from a typed input) OR a small in-memory mock that returns a plausible extracted value so the demo flow works without cloud STT. Use `field` to return a sensible demo value when audio transcription isn't available.
- `server/routes/schemeSummarizer.js` — POST `/api/summarize-scheme`. Body `{ scheme, language }`. System prompt exactly as spec. Server-side in-memory `Map` cache keyed by `scheme_id + language`. Returns `{ bullets: string[], audio_text: string }`.
- `server/.env` (user provides `ANTHROPIC_API_KEY`)

### Demo flow to verify
1. Fresh load → chat onboarding (Tamil)
2. ~90s complete → WowReveal
3. Feed → Kelungal → audio plays
4. Apply Now → auto-fill → mock camera → success animation
5. Cross-scheme chain suggests Fasal Bima
6. Applications tab → timeline → rejected → fix & resubmit
7. Profile → Sahayak → code `100100` → apply for beneficiary
8. Mid-session TA → EN toggle reflows UI

## Key decisions locked in

- Voice extraction backend path returns field-specific mock values when Claude lacks audio transcription — demo doesn't hard-depend on cloud STT.
- Vault "encryption" is PIN-derived XOR (explicitly marked as demo-only in comments).
- All `/api` calls go through Vite proxy → Express at `:5000`.
- Tailwind classes use brand colors: `bg-brand-green`, `text-brand-saffron`, `bg-brand-bg` (off-white `#FAFAF5`).
- Bottom nav only (no hamburger). 48×48 min touch targets enforced via global `button` rule in `index.css`.
- No red error text anywhere. Errors use amber banner + audio.
- `LanguageProvider` wraps the app so any component calls `useLanguage()` and reacts live.

## How to resume

Re-read `BUILD_CHECKPOINT.md`, then continue with component `SchemeCard.jsx`. The order I planned:
SchemeCard → SamjhaoButton → FuzzyMatchCard → CrossSchemeChain → SuccessAnimation → StatusTimeline → SahayakMode → pages → App.jsx → backend → smoke test.

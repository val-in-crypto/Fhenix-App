# Fhenix App — functional prototype brief for Claude Fable 5.2

Two paste-ready messages. Paste **Message 1** with the `FABLE-ASSETS/` folder attached (or unzip `fable-prototype-pack.zip` into the project root). Paste **Message 2** only if you want a polish pass.

---

## MESSAGE 1 — build core + all flows (one pass)

You are building a **clickable, fully mocked prototype** of *Fhenix App* (a confidential-balance wallet UI) for a team demo. Build it **in one pass** following the file plan below.

**Credit rules (strict):**
- Prototype only. **No real wallet, chain, RPC or CoFHE SDK.** Mock everything with timeouts from `mock-data.json → delaysMs` (scaled by demo speed).
- Stack: **Vite + React 18 + TypeScript + Tailwind + Framer Motion**. Allowed extra deps: `@fontsource/geist-sans`, `@fontsource/geist-mono`. Nothing else (no router, no state lib, no UI kit, no icon pack, no tests, no backend, no Storybook).
- Don't research, don't ask questions, don't propose alternatives. If something is unspecified, pick the simplest option consistent with this brief.
- Use `FABLE-ASSETS/…` as-is; **don't redraw illustrations, logo or icons** (import SVGs `?raw`, inline).
- Reply with the files only, plus ≤5 lines of run notes. No explanations, no re-printing unchanged files in later turns.

### Assets (`FABLE-ASSETS/` → copy to `src/assets/`)
- `tokens.json`: exact colours, type, spacing, sizes, **motion timings**. Map into `tailwind.config.ts` + `src/lib/motion.ts`.
- `mock-data.json`: account, networks, assets, prices, activity, apps, permits, send, `delaysMs`, **all copy**.
- `logo-fhenix-app.svg`, `fhenix-asterisk.svg`, `icons/*.svg` (20px line icons; use `currentColor`).
- `illustrations/shield-demo-{desktop|mobile}-step{1,2,3}.svg`: Welcome demo, full cards incl. tabs, caption, gauge (600×500 / 358×316).
- `illustrations/private-now-{drop,seal,burst}.svg`: success hero 560×458; group ids `Ambient sparkles` (amb-1..6), `Plate / Base|Shielded|Encrypted`, `Encrypted glyph`, `Pulse ring`, `Pulse ring 2`, `Puck / Seal`, `Coin drop`, `Confetti` (p-01..16).
- `reference/*.jpg|png`: visual reference of all screens; look once if needed.

### Global design rules (values in tokens.json; don't invent others)
- **Radius 0 everywhere** (`* { border-radius:0 }`, `.round` only for status dots, identicon, coins). Geist UI / Geist Mono for addresses, row amounts, eyebrows, badges; one heading weight (500).
- Colours: bg `#F1F4F5`, white surfaces + 1px `#DDE4E8`; **cyan `#0AD9DC`** primary/active; **turquoise `#E2F8F9` = confidential side, always**; public boxes `#F6F8F9`; links/private labels `#007A7E`; secondary text never lighter than `#5B6F7D`.
- **Encrypted values**: hidden `[*******]`, revealed private `[1,000.00]`, public never bracketed. Hidden ⇒ no private digits and no `%` anywhere; total `$ [*******]`.
- Spacing 8pt: mobile sides 20, blocks 24, card padding 20, label→value 8; desktop content padding 32–40. Type: body 15–16, secondary 13–14, mono ≥12 (+2%), tabs 12, floor 11.
- Buttons: primary 52 mobile / 56 in sheets / 48 desktop; secondary + action 44; padding-x ≥20; icon gap 8; chips 6×10; disabled `#C4F1F2` + `#34495A` text.
- **Shell** (<1024px = mobile, designed 390×844):
  - Desktop 1440: sidebar 256 (logo; MENU Dashboard · Shield · Send · Apps [5] · Permits · Trading [Soon, disabled]; active = white + 3px cyan left bar; bottom: CoFHE card "COFHE NETWORK · ● LIVE", Docs ↗, Dark mode toggle visual only). Top bar: wallet chip (identicon, mono address, menu Copy/Disconnect) + network chip; right side **Zama-style action row** Shield · Unshield · Send (44 outline + icon).
  - Mobile: status bar mock "9:41" (47), top bar logo + wallet chip (56), tab bar 89 **Dashboard · Shield · Send · Apps · Permits** (20×2 cyan indicator, label 12, home indicator). Dashboard has a 3-button action row under the hero.
- **Network chip (EVM multi-chain)**: shows the wallet's network (Ethereum/Arbitrum/Base); click → menu that fakes a wallet network switch. "Unsupported EVM" ⇒ inline note `copy.unsupported` in Tokens card. No wrong-network screen, never "switch to Arbitrum".
- A11y: focus ring 2px `#007A7E` offset 2; dialogs trap focus; Esc closes.

### Fixed file plan (create exactly these)
```
package.json  vite.config.ts  tailwind.config.ts  postcss.config.js  index.html
src/main.tsx  src/index.css  src/App.tsx            // hash router: #/welcome #/dashboard #/shield #/unshield #/send #/apps #/permits #/success
src/lib/motion.ts        // easings, durations from tokens, useReducedMotion wrapper, speed multiplier
src/lib/format.ts        // fmtPublic, fmtPrivate(v|undefined) → "[*******]" | "[1,000.00]", fmtUsd
src/state/store.tsx      // React context + useReducer; persisted to localStorage 'fhx-proto'; mock async actions
src/ui/Button.tsx Chip.tsx Icon.tsx Masked.tsx RatioBar.tsx Stepper.tsx AmountBox.tsx SwapButton.tsx
src/ui/Sheet.tsx         // mobile bottom sheet (grabber) ⇄ desktop centered dialog, same API
src/ui/Toasts.tsx  src/ui/TokenRow.tsx  src/ui/ActivityList.tsx
src/shell/AppShell.tsx   // Sidebar, TopBar, TabBar, WalletChip, NetworkChip, ActionRow
src/illus/ShieldDemo.tsx src/illus/PrivateNow.tsx
src/screens/Welcome.tsx Dashboard.tsx TokenDetail.tsx ShieldFlow.tsx PrivateNowScreen.tsx Send.tsx Apps.tsx Permits.tsx
src/sheets/ConnectSheet.tsx PermitSheet.tsx SendReview.tsx
src/tour/Tour.tsx        // 4 coachmarks + spotlight
src/demo/DemoPanel.tsx   // presenter controls
```
Reuse components: one `AmountBox` covers shield, unshield and send; one `Sheet` covers connect, permit, token detail and send review; one `Stepper` covers shield (2 steps), unshield (3) and send (3).

### State (store.tsx)
`{connected, address, networkIdx, permit:'none'|'active'|'expired', hidden, balances, activity[], shieldStep, unshieldStep, sendStep, firstShieldDone, tour{status,step}, toasts[], speed, failNext}`. Async mock actions with `delaysMs`: `connect`, `disconnect`, `signPermit(days)`, `renew`, `revoke`, `shield` (approve→confirm), `unshieldRequest` → auto decrypt (4s) → `claim`, `send` (encrypt→confirm→sent), `setNetwork`, `toggleHidden`, `reveal`. `failNext` makes the next one reject (toast "Transaction failed · Try again"). Balances really move (public↔private, sums exact); activity rows prepend as `pending` then `confirmed`.

### Screens (58 Figma frames → these routes/states)

| Flow | Desktop / Mobile states | Route / trigger |
|---|---|---|
| Onboarding | Welcome with demo; Connect (dialog / sheet); Create permit (dialog / sheet) | `#/welcome`, opens sheets |
| Dashboard | Default; Encrypted (permit expired/none); Empty (fund your account); Token detail (modal / sheet); Activity expanded | `#/dashboard` |
| Shield | Form → Step 1 Approve → Step 2 Confirm in wallet → Everything is private now | `#/shield`, `#/success` |
| Unshield | Form → Decrypting → Claim ready → Claimed | `#/unshield` (same screen, toggle) |
| Send | Form → Review & confirm (sheet/dialog) → Sent | `#/send` |
| Apps & Permits | Apps; Permits active / expired / none (create) | `#/apps`, `#/permits` |
| Tutorial | 4 coachmarks, skippable | "Start by learning" |
| States | Transaction failed toast; toast set | via DemoPanel |

**Per-screen specs** (copy strings in `mock-data.json → copy`)
- **Welcome**: desktop 2 columns: hero headline (500, 56/60) + subcopy + **Start by learning** / **I've used Fhenix before**; right ShieldDemo 600×500. Mobile: headline 34/40 max-width 250, demo scaled to width, CTAs stacked, fits 844. Top bar **Connect**.
- **Connect** (sheet/dialog): grabber 40×4 `#C9D3D9`, ✕, sides 24, bottom 32, gap 20; title 24 + subtitle 15; wallet rows 64 (pad 16, gap 12; MetaMask "DETECTED" chip, WalletConnect); safety footer. Desktop dialog 480, padding 32, gap 24. Row click → "Connecting…" spinner in row → close → toast → Dashboard (→ Permit sheet if permit = none).
- **Create permit** (dialog 520): key icon, title, body, "What stays private" panel (pad 16, gap 12, 3 lock rows), **Valid for** row 52 `#F6F8F9` (7/30/90), **Sign permit** + **Not now** 16 below. Sign → "Waiting for signature…" → toast "Privacy on" → balances reveal.
- **Dashboard**: hero card (eyebrow NET WORTH + permit chip, total 64/38, eye toggle); mobile actions; RatioBar (8px, navy shielded / light public, 2px gap; legend "ENCRYPTED $1,428.35 43.0% · PUBLIC $1,890.40"); desktop "Private vs public over time" SVG area chart with 1W/1M/3M/1Y chips; Tokens card (Hide/Reveal all; unified rows `PUBLIC 1,250.00` / `PRIVATE [1,000.00]`, row → Token detail); Activity card (3 rows, "View all" expands in place with All/Shield/Unshield/Send filters). **Encrypted**: banner + **Renew**/**Create permit**, all private `[*******]`, neutral bar, no %. **Empty**: `$0.00`, empty track, "Fund your account" callout.
- **Token detail** (sheet with grabber / modal 520): coin, "USDC", "USD Coin · {network}", ✕; PUBLIC box + turquoise PRIVATE box ("Decrypted with your permit"); **Shield** / **Unshield**; note. Padding 20, gap 12.
- **ShieldFlow** (shield + unshield, one screen): segmented toggle (active navy) → 20 → Box 1 (label, Balance + MAX, amount 38, token chip, "≈ $500.00", "🔒 ONLY YOU CAN READ" on the confidential side) → **12 gap** → Box 2 "You receive". Box padding 20 (24 at the swap edge). **SwapButton** 40×40 white + 1px line inside a 4px ring of the surface colour, absolutely centred on the gap; click toggles mode. Turquoise = confidential box. Stepper 24 below (shield: "1 Approve USDC — 2 Shield" shown once started; unshield: 01 Unshield · 02 Decrypt · 03 Claim; bars 3px, 8 to 13px labels). Mobile bottom bar: CTA → 12 → helper → 16 → tabs. CTAs: shield "Shield 500 USDC" → "Approve USDC" → "Confirm in wallet…" (disabled) → `#/success` first time, else toast; unshield "Unshield 500.00 fUSDC" → decrypting (disabled "Claim 500.00 USDC", helper "Claim unlocks after decryption · ~30 sec") → enabled Claim → Claimed card (summary + **Go to dashboard** / **View activity**). No permit + MAX/CTA ⇒ Permit sheet first.
- **Everything is private now** (`#/success`): light page, no card, centred column 560/350: PrivateNow (mobile ×0.6) → eyebrow "SHIELD COMPLETE" (desktop) → headline 40/48 (28/34) → subcopy → amount panel (white + line: "Private balance", `[*******] fUSDC` mono 22 `#007A7E`, **Reveal** 44 with eye → reveals `[500.00]` in place) → hint → **Go to dashboard** + **Shield more** (204×48 row desktop; stacked 52 mobile) → desktop "Transaction 0x9f2c…a83e ↗".
- **Send**: "To" box (Paste, "Recipient address · visible on-chain") + turquoise AmountBox "You send" fUSDC; CTA "Send 100.00 fUSDC", helper "Amount stays encrypted · ≈ $0.08 fee". Review sheet/dialog: rows To / Amount `[100.00] fUSDC` / Network fee / Visible on-chain + stepper Encrypt · Confirm · Sent + "Waiting for wallet…" + Cancel. Sent: check tile, "Sent privately", summary, **Go to dashboard** / **Send another**.
- **Apps**: intro, 5 apps (navy abbr tile, name, desc, LIVE/SOON chip, chevron), navy "Build on CoFHE" card + **Read the docs**, footer note.
- **Permits**: intro, `permitsList` rows with Revoke/Renew (44), "New permits last" select, note, **Create permit**. States active / expired (warning row + Renew) / none (empty + Create permit).
- **Toasts**: desktop bottom-right 360; mobile full-width −40, 12 above tabs. White + 1px line + 3px left bar (cyan success, `#C2281D` fail), icon, title, optional action (View / Try again); auto-hide 3.2s; max 3.

### Tutorial (Tour.tsx)
"Start by learning" → connect → Dashboard → tour (replay from Permits). Spotlight: navy 45% scrim with SVG-mask cut-out (anchor rect + 8) on `[data-tour=…]`; card white, 320 desktop / full −32 mobile, docked below/above; eyebrow "STEP x OF 4", title, body (`copy.tutorial`), buttons, "Skip tour", 4 square dots. Steps: 1 balance hero → **Next**; 2 permit banner → **Create permit** (real sheet) or **Show me** (`[*******]`→`[•••]`); 3 Shield form prefilled 10.00 → **Shield 10 USDC** (mock flow) or **Show me** (stepper animates); 4 centred card with small PrivateNow (×0.42) → **Go to dashboard** / Replay tour. Esc = skip (confirm). Leaving mid-tour pauses + "Resume tour · Step x of 4" chip.

### Animations (exact; from `tokens.json → motion`; all × demo speed; off under reduced motion)
- **ShieldDemo**: stack the 3 step SVGs; active opacity 1 / y 0, others 0 / y 8; change 600ms `cubic-bezier(.45,0,.55,1)`; holds 5.6 / 6.8 / 6.4s, loop (≈18.8s); gauge (`#fill` or overlay bar) scaleX 0→1 linear over the hold; desktop tab click zones 01/02/03 jump + restart; hover pauses. Reduced motion: step 2 static.
- **PrivateNow** (inline `private-now-burst.svg`, Framer Motion on groups by id). Offsets vs burst:

  | Group | drop | seal | burst |
  |---|---|---|---|
  | `Plate / Encrypted`, `Puck / Seal`, `Encrypted glyph`, rings | y −40 | 0 | 0 |
  | `Plate / Shielded` | y −18 | 0 | 0 |
  | `Coin drop` | y −122, op 1 | 0, op 0 | 0, op 0 |
  | `Encrypted glyph` | op .25 | 1 | 1 |
  | `Pulse ring` (origin 280,209) | scale .58 op 0 | .73 op .9 | 1 op 0 |
  | `Confetti` p-01..16: translate `(origin−p)·(1−t)`, origin (280,185) | t .05 op 0 | t .45 op .7 | t 1 op 1 |

  On mount: drop → 400ms → seal (700ms ease-in-out) → 150ms → burst (600ms ease-out). Then idle only: `amb-*` opacity .4↔1 2.4s staggered .3s; `Pulse ring 2` scale 1.2→1.6, op .6→0 every 3s. No drop loop. Reduced motion: static burst.
- **Sheet**: mobile y 100%→0 320ms ease-out, scrim 0→.45 200ms, close 220ms, drag grabber >80px closes; desktop dialog op 0 / scale .98 / y 8 → in 200ms.
- **SwapButton**: press scale .94 120ms; mode switch arrow rotates 180° 240ms ease-in-out, box fills crossfade 200ms.
- **Stepper**: active bar fills left→right 600ms ease-in-out, label colour 200ms; done = navy bar + check tile.
- **Masked reveal**: each `*` scrambles digits 300ms, settles with 150ms crossfade; hide reverses 200ms; decrypting = bracket pulse op .5↔1 1.2s.
- **RatioBar**: segments grow from 0 700ms ease-out (mount + balance change); legend numbers count up 450ms.
- **Toasts**: in from y 16 (mobile) / x 24 (desktop) 220ms, out 180ms, `layout` reflow.
- **Coachmark**: cut-out rect animates 300ms ease-in-out between anchors; card fade + y 8 200ms.
- **Buttons**: primary hover `#4CE8E9` 120ms, press scale .98. **Routes**: fade + y 6 180ms.

### Demo mode (DemoPanel.tsx)
Floating "Demo" button (bottom-left; above tabs on mobile) or key `D`: **Reset all** (clear localStorage → Welcome) · **Jump to** (select of every table state, e.g. "Dashboard · encrypted", "Unshield · claim ready", "Permits · none", "Tutorial 3/4"; sets store + route) · **Speed** 0.5×/1×/2× · **Permit** none/active/expired · **Network** · **Fail next tx** · **Show toast set** · **Device frame 390×844** (for presenting mobile on a laptop) · **Reduce motion**.

### Acceptance (check before replying)
- [ ] `npm i && npm run dev` runs with no errors; no console errors.
- [ ] Every row of the screens table can be reached by clicking and via Jump to; all three flows work end to end with balances updating.
- [ ] Radius 0 everywhere; Geist fonts load; no text under 11px.
- [ ] Hidden state shows no private digits and no %.
- [ ] 390 and 1440 layouts match the reference; the sheet has a grabber on mobile and is a dialog on desktop.
- [ ] Demo loop, PrivateNow sequence, sheet, swap, stepper, reveal, ratio bar, toasts and coachmark animations all play; reduced motion disables them.

---

## MESSAGE 2 — polish pass (optional, send only after Message 1 works)

Polish pass on the existing prototype. **Only output files you change.** Same rules: no new deps, no explanations beyond ≤5 lines.
1. Compare every screen at 390×844 and 1440×1024 with `FABLE-ASSETS/reference/*.jpg`. Fix spacing to the tokens (20 mobile sides, 24 blocks, 20 card padding, 12 swap gap, 24 boxes→stepper) and type minimums.
2. ShieldDemo: replace the crossfade with id-matched motion where ids exist in all three SVGs (`coin-1..3`, `asterisk`, `sheet-1..3`, `fill`). Interpolate the transforms parsed from the three files over 600ms ease-in-out, keep the 200ms caption crossfade, and fall back to the crossfade for unmatched nodes.
3. Add skeleton loading (cyan shimmer on the hero number, 2 row skeletons, 700ms) on first Dashboard load after connect. Never show `$0.00` while loading.
4. Keyboard and a11y pass: focus trap and return in sheets, `aria-live` for toasts and tour steps, a `role="tablist"` for the demo tabs.
5. Small delights:
   - Copy address → toast "Address copied" and the icon becomes a check for 1.5s.
   - Network switch → chip dot pulse plus the toast "Switched to {network}".
   - Activity row `pending` shows a 3-dot mono loader `[···]`.
6. Run the acceptance list again and fix any failures.

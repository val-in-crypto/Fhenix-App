# Round 5 implementation report

The package supersedes the older plan for R47+. The supplied Genesis V2 sidebar design includes the CoFHE status card, so that card is present.

## Already done before this update

- Light/dark themes, square controls, shared segmented switch, swap form, field wrapper focus/error states, and success modal existed; these were reused and adjusted.
- Send already had Address → Amount → Review → Sent, Confidential/Public selection, full address validation, and mock transactions.
- WBTC/USDT zero-balance portfolio entries already existed. They now also appear in the selectable token picker.

## Validation

- TypeScript (`npx tsc --noEmit`) and production build pass. No dependency changes.
- Screenshots for each task: `NN-desktop-light.jpg`, `NN-desktop-dark.jpg` (1440×1024); `NN-mobile-light.jpg`, `NN-mobile-dark.jpg` (390×844). Additional picker, drawer, claim and Send captures are included.
- Browser checks: wallet menu and Escape; searchable picker and zero balance validation; mobile Menu and theme toggle; invalid recipient and ENS resolution; complete mock Send (confidential USDC decreased from 1000 to 900); leave guard, Later, reload, and claim completion (public USDC increased from 1250 to 1750 once).
- Illustration DOM checks: shield/sent reach idle; reduced-motion override stays static with no CSS animation; 320px desktop / 216px mobile SVG widths. Off-screen/tab pause and replay cleanup are implemented; browser visibility switching and repeated replay were not independently exercised.
- Build retains the existing ~500KB bundle warning. No real wallet was connected.

## Conflicts and limits

- R5 explicitly replaces the older type scale and enables TOKEN_ROW_RATIO_BAR. APPS_DESKTOP_CAROUSEL remains off; Apps v3 is the default.
- Three Figma logo sources (AlphaEngine, Confidential Trading, Privara) are PNG alpha masks. Exporting their nodes as SVG still embeds raster images. They are preserved faithfully; the pure-vector requirement needs vector source assets.
- Task 7 requires Claim ready art after claiming; task 8 also supplies Unshield complete art. Claim success uses Claim ready as task 7 explicitly specifies; Unshield complete remains available in the shared illustration component.
- R57 has no completed padding spec; existing card paddings were retained except explicit new components/table values. The 15-issue earlier QA document was not supplied in this package and is not marked closed.
- Wallet/network/transaction behavior remains a prototype mock. App destinations and permit documentation retain their existing placeholders.

## Pull request creation

All eight ordered branches are pushed. The GitHub connector returned HTTP 403 (resource not accessible by integration), and the available browser is signed out of GitHub. PRs were not created. The comparison links below preserve the intended stacked PR bases.

## Ordered branches and changed files

### 01 foundations
[Review comparison](https://github.com/val-in-crypto/Fhenix-App/compare/codex/genesis-round4...codex/r5-01-foundations?expand=1)

- `qa/r5/01-desktop-dark.jpg`
- `qa/r5/01-desktop-light.jpg`
- `qa/r5/01-mobile-dark.jpg`
- `qa/r5/01-mobile-light.jpg`
- `src/assets/mock-data.json`
- `src/components/RecipientField.tsx`
- `src/demo/DemoPanel.tsx`
- `src/illus/ShieldDemo.tsx`
- `src/index.css`
- `src/main.tsx`
- `src/screens/Apps.tsx`
- `src/screens/Dashboard.tsx`
- `src/screens/Permits.tsx`
- `src/screens/Send.tsx`
- `src/screens/ShieldFlow.tsx`
- `src/screens/TokenDetail.tsx`
- `src/screens/Welcome.tsx`
- `src/sheets/ConnectSheet.tsx`
- `src/sheets/PermitSheet.tsx`
- `src/shell/AppShell.tsx`
- `src/theme.css`
- `src/tour/Tour.tsx`
- `src/ui/ActivityList.tsx`
- `src/ui/AmountBox.tsx`
- `src/ui/Button.tsx`
- `src/ui/Chip.tsx`
- `src/ui/RatioBar.tsx`
- `src/ui/SegmentedSwitch.tsx`
- `src/ui/Steps.tsx`
- `src/ui/SuccessModal.tsx`
- `src/ui/ThemeSwitch.tsx`
- `src/ui/Toasts.tsx`
- `src/ui/TokenRow.tsx`
- `tailwind.config.ts`

### 02 sidebar
[Review comparison](https://github.com/val-in-crypto/Fhenix-App/compare/codex/r5-01-foundations...codex/r5-02-sidebar?expand=1)

- `qa/r5/02-desktop-dark.jpg`
- `qa/r5/02-desktop-light.jpg`
- `qa/r5/02-mobile-dark.jpg`
- `qa/r5/02-mobile-light.jpg`
- `src/assets/r5-logo.svg`
- `src/index.css`
- `src/shell/AppShell.tsx`
- `src/shell/Sidebar.tsx`
- `src/theme.css`
- `src/ui/BrandLogo.tsx`
- `src/ui/ThemeSwitch.tsx`

### 03 wallet
[Review comparison](https://github.com/val-in-crypto/Fhenix-App/compare/codex/r5-02-sidebar...codex/r5-03-wallet?expand=1)

- `qa/r5/03-desktop-dark.jpg`
- `qa/r5/03-desktop-light.jpg`
- `qa/r5/03-mobile-dark.jpg`
- `qa/r5/03-mobile-light.jpg`
- `src/assets/icons/chain-ethereum.svg`
- `src/shell/AppShell.tsx`
- `src/ui/ChainIcon.tsx`
- `src/ui/VerticalSeparator.tsx`

### 04 token-table
[Review comparison](https://github.com/val-in-crypto/Fhenix-App/compare/codex/r5-03-wallet...codex/r5-04-token-table?expand=1)

- `qa/r5/04-desktop-dark.jpg`
- `qa/r5/04-desktop-light.jpg`
- `qa/r5/04-mobile-dark.jpg`
- `qa/r5/04-mobile-light.jpg`
- `src/config/flags.ts`
- `src/screens/Dashboard.tsx`
- `src/shell/AppShell.tsx`
- `src/theme.css`
- `src/ui/TokenRow.tsx`

### 05 app-logos
[Review comparison](https://github.com/val-in-crypto/Fhenix-App/compare/codex/r5-04-token-table...codex/r5-05-app-logos?expand=1)

- `qa/r5/05-desktop-dark.jpg`
- `qa/r5/05-desktop-light.jpg`
- `qa/r5/05-mobile-dark.jpg`
- `qa/r5/05-mobile-light.jpg`
- `src/assets/apps/alpha-engine.png`
- `src/assets/apps/cofhe.svg`
- `src/assets/apps/confidential-trading.png`
- `src/assets/apps/fluton.svg`
- `src/assets/apps/obolos.svg`
- `src/assets/apps/privara.png`
- `src/screens/Apps.tsx`
- `src/theme.css`
- `src/ui/AppLogo.tsx`

### 06 shared-updates
[Review comparison](https://github.com/val-in-crypto/Fhenix-App/compare/codex/r5-05-app-logos...codex/r5-06-shared-updates?expand=1)

- `qa/r5/06-desktop-dark.jpg`
- `qa/r5/06-desktop-light.jpg`
- `qa/r5/06-mobile-dark.jpg`
- `qa/r5/06-mobile-light.jpg`
- `qa/r5/06-mobile-menu-dark.jpg`
- `qa/r5/06-picker-desktop-dark.jpg`
- `src/config/tokens.ts`
- `src/index.css`
- `src/screens/Apps.tsx`
- `src/screens/Dashboard.tsx`
- `src/screens/Send.tsx`
- `src/screens/ShieldFlow.tsx`
- `src/sheets/ConnectSheet.tsx`
- `src/sheets/PermitSheet.tsx`
- `src/shell/AppShell.tsx`
- `src/state/store.tsx`
- `src/theme.css`
- `src/ui/AmountBox.tsx`
- `src/ui/Button.tsx`
- `src/ui/PendingDots.tsx`
- `src/ui/Sheet.tsx`
- `src/ui/SuccessModal.tsx`
- `src/ui/TokenPicker.tsx`

### 07 claims
[Review comparison](https://github.com/val-in-crypto/Fhenix-App/compare/codex/r5-06-shared-updates...codex/r5-07-claims?expand=1)

- `qa/r5/07-claim-success-mobile-light.jpg`
- `qa/r5/07-claimable-desktop-light.jpg`
- `qa/r5/07-desktop-dark.jpg`
- `qa/r5/07-desktop-light.jpg`
- `qa/r5/07-mobile-dark.jpg`
- `qa/r5/07-mobile-light.jpg`
- `src/App.tsx`
- `src/assets/illustrations/claim-ready.svg`
- `src/illus/ClaimReady.tsx`
- `src/screens/Dashboard.tsx`
- `src/screens/ShieldFlow.tsx`
- `src/screens/TokenDetail.tsx`
- `src/state/store.tsx`
- `src/theme.css`
- `src/ui/ClaimReminder.tsx`
- `src/ui/PendingClaims.tsx`
- `src/ui/RatioBar.tsx`
- `src/ui/Sheet.tsx`
- `src/ui/TokenPicker.tsx`
- `src/ui/TokenRow.tsx`

### 08 illustrations
[Review comparison](https://github.com/val-in-crypto/Fhenix-App/compare/codex/r5-07-claims...codex/r5-08-illustrations?expand=1)

- `src/assets/illustrations/sent.svg`
- `src/assets/illustrations/unshield-complete.svg`
- `src/demo/DemoPanel.tsx`
- `src/illus/ClaimReady.tsx`
- `src/illus/PrivateNow.tsx`
- `src/illus/ShieldDemo.tsx`
- `src/illus/SuccessIllustration.tsx`
- `src/screens/ShieldFlow.tsx`
- `src/state/store.tsx`
- `src/illus/AnimatedIllustration.tsx`
- `src/illus/illustrations.css`
- `src/assets/illustrations/private-now.svg`
- `qa/r5/REPORT.md`

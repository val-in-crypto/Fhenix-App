# UI refinements — November 25

- Send: continuous eased flight along the dashed curve, slower travel, fade at each end, invisible loop reset; synchronized arrival effects.
- Claim reminder: plays its entrance when opened, then coins, plate and wallet card float smoothly. Reduced motion keeps the final static pose.
- dApps: Figma 1120:292 (light) / 1120:848 (dark); 360×213 cards at 1440px, 16px grid gap, inline logo/name/category, exact descriptions and original action glyphs. The supplied light frame has no filter/header; the dark frame retains its heading and All/Live/Soon filter. Logo slot dimensions were verified in the browser.
- Disconnected wallet: header contains only Connect on desktop and mobile.
- Welcome: “Your balance.” and “Your eyes only.” occupy separate lines at both sizes.

Validation: TypeScript and production build pass; desktop 1440×1024 and mobile 390×844 screenshots included. Browser checked filtering, animated layer names, reduced-motion static state, actual mock disconnect and welcome title line positions. No real wallet connected. Existing mock app-destination behavior and raster-backed Figma logo sources are unchanged.

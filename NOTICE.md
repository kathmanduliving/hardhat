# Third-party assets

## public/models/helmet.glb

"Battle Damaged Sci-fi Helmet - PBR" by theblueturtle_, distributed in the
Khronos glTF-Sample-Assets repository as `DamagedHelmet`.
Licence: Creative Commons Attribution-NonCommercial 4.0 International
(CC BY-NC 4.0) — https://creativecommons.org/licenses/by-nc/4.0/

**Development placeholder only.** The licence forbids commercial use, so this
model must be replaced with a licensed motorcycle-helmet GLB before the store
goes live. Drop the replacement at `public/models/helmet.glb`; no code changes
are needed.

## Product imagery

The catalogue ships with no photography. `components/HelmetArt.tsx` draws a
vector helmet tinted with each product's colour, and it renders whenever a
product's `images` array is empty. Real photography replaces it by filling
`images` in the data layer — the components already prefer a photo when one
exists. Remote hosts must be added to `images.remotePatterns` in
`next.config.ts` at that point.

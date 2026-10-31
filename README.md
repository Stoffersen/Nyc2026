# NYC 2026 — Skyline Rush 3D

Original third-person **3D rooftop platformer** set in a stylized modern New York, built with Three.js and WebGL.

## Play online
**https://stoffersen.github.io/Nyc2026/**

GitHub Pages must be enabled at [Settings → Pages](https://github.com/Stoffersen/Nyc2026/settings/pages) with **GitHub Actions** selected as the source. Check [deployment logs](https://github.com/Stoffersen/Nyc2026/actions). The website requires an internet connection to load Three.js from jsDelivr.

## Game controls
- A / D or left / right arrows: move along the skyline
- Space / W / up arrow: jump, press again for double-jump
- R: restart
- P: pause / resume
- Touchscreen: on-screen controls

## Visual features
True 3D buildings and rooftops, cinematic perspective camera, realistic material response using physically based rendering, shadow maps, atmospheric fog, glowing accents, animated drones, crystals, procedural Manhattan skyline and responsive mobile layout.

## Gameplay
Traverse 16 rooftop sections, collect crystals, defeat drones by jumping on them, use checkpoints, and reach the portal. Three lives per run.

## Development / verification
Static entry point: `index.html`. Three.js is loaded as an ESM dependency from CDN.

Run `node scripts/smoke-test.mjs` for HTML/game JavaScript structural checks. The GitHub Actions workflow runs that test before deploying. These are smoke checks, not a substitute for real-browser playtesting.

This is an evolving prototype, not a finished commercial AAA release. All characters, game structures, and visual elements are original.

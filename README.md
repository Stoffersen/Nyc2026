# NYC Memories — Family Merge

An original, physics-based family vacation merge game inspired by the casual drop-and-merge genre.

## Play
https://stoffersen.github.io/Nyc2026/

## How to play
- Move your mouse, finger, or use the left/right arrow keys to aim.
- Click, tap, press Space or Enter to drop a memory token.
- Merge two matching memories into the next New York memory.
- Keep the stack beneath the warning line.
- Press R or tap "Nyt spil" to restart. Press P or the Pause button to pause and resume.

## Photos & privacy
The game uses a **small, compressed collage** derived from the family vacation photos supplied by the project owner. It includes family members and recognizable New York vacation scenes. **This repository is public**. Do not deploy publicly if everyone depicted has not consented to publication. The bundled small image is only a lightweight gameplay sprite, not a substitute for original private photo archives. To remove family images, delete `assets/nyc-family-sprite.jpg` and the game falls back to emoji tokens.

## Music and sound

The game includes an **original, procedurally synthesized 82 BPM lo-fi jazz soundtrack**. Soft extended chords, bass, high percussion and a short melody are generated in the browser with Web Audio; no commercial music files or external streaming services are used. Music begins only after the player starts a game and fades out during pauses, while the album is open, when the tab is hidden, and on game over. Use **♫ Musik** to toggle the soundtrack, the **Vol** slider to adjust music volume, and **♪ FX** to control gameplay sound effects independently. Music and volume preferences are stored locally. If music is silent, press Start and turn up the Vol slider and the device's media volume.

## Features
8 merge levels, real-time circular collisions, merge chains, particles, orientation-aware board resizing, next-piece preview, best score in local storage, persistent unlocked photo collection, album view, short synthesized audio, haptic merge feedback where supported, pause/resume, mobile and keyboard support.

## Technical notes
No CDN dependencies or third-party music assets. Open `index.html` in a modern browser. Run `node scripts/smoke-test.mjs` before publishing. The smoke test also simulates input and animation frames without a graphical browser.

## Development status
Playable prototype, still requires physical device playtesting and art polish. No continuous unattended development process is running.

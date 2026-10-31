# NYC Family Quest — Fire levels

A playful, original four-level family trip adventure in New York. The main entry point is `index.html`, with the previous **NYC Memories — Family Merge** kept playable at [merge.html](https://stoffersen.github.io/Nyc2026/merge.html).

## Play

**Main game:** https://stoffersen.github.io/Nyc2026/

Designed for a modern browser on desktop, phone, or tablet. Uses a single HTML Canvas with no external JavaScript framework.

## The four levels

1. **Race to the plane** — airport platform runner. Move using left/right arrows (or A/D); jump using Up/Space or the on-screen HOP button. Avoid suitcases, collect bonus stars, and reach Gate 26 before the departure timer expires.
2. **Ditte in the M&M’S store** — candy catcher. Move using left/right controls or drag across the store; catch 24 falling colorful candy pieces from ceiling tubes without catching the grey suitcases.
3. **Empire State elevator** — six small number-combination logic puzzles. Tap three circuit switches to sum exactly to the desired amount; press KØR ELEVATOR (or Enter) to rise one floor at a time.
4. **NYC Food Quest** — New York route-based merge-and-cook game. Travel from the Statue of Liberty via Ground Zero and Chinatown to Madison Square Garden. Tap LAV MAD to generate food, tap two equal food pieces to merge them, then select the required dish and tap LEVER MAD at each stop. Complete four orders to finish the story.

## Accessibility and controls

- Touch, mouse, and keyboard support.
- Short sound cues with a mute toggle.
- Independent minigame restart from each failure panel.
- Level-by-level progression and total score.
- Responsive Canvas display and on-screen controls.

## Family photo art and privacy

The game uses the previously supplied small family-vacation sprite at `assets/nyc-family-sprite.jpg` for stylized faces. The repository is **public**, meaning this collage can be seen by anyone on the internet. Ensure consent from those depicted before sharing the game publicly. The game falls back to drawn faces if the sprite is unavailable.

## Development and verification

Run `node scripts/smoke-test.mjs`. The test checks all four levels, the introductory screen, the full elevator-puzzle set, food delivery progression, the victory state and image asset. Automated simulation does **not** replace browser QA on actual devices.

The previous merge game is still available as a bonus at `merge.html`; its earlier functionality remains separate from the new four-level story.

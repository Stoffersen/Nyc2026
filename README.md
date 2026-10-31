# NYC Family Quest 3D

A four-chapter New York family adventure built with **Three.js**, a real WebGL renderer, physically based materials, dynamic lighting, soft shadows, depth fog, a perspective camera and custom-built 3D environments.

## Play

**3D experience:** https://stoffersen.github.io/Nyc2026/

**Legacy 2D version:** https://stoffersen.github.io/Nyc2026/legacy-2d.html

**Original merge game:** https://stoffersen.github.io/Nyc2026/merge.html

## The four 3D levels

1. **Airport Dash.** Run through a modern airport with glossy floors, terminal windows, check-in desks, overhead gate signs, suitcase obstacles and a plane at Gate 26. Reach boarding before the clock expires. Move with arrow keys / A–D or touch buttons, jump with Space / HOP.
2. **Ditte's M&M’S Store.** Play inside a colorful 3D candy shop. Catch 25 candies dropping from tall overhead tubes, avoid suitcases and use a short **super-basket** catch ability (FANG / Space).
3. **Empire State Elevator.** Family travels through a modeled Art Deco-inspired elevator shaft. Solve six energy-selection logic challenges to advance the lift to the top. Tap the puzzle switches or use 1/2/3 and Enter.
4. **NYC Food Quest.** A 3D New York streetscape changes as the family travels through the Statue of Liberty, Ground Zero, Chinatown and Madison Square Garden. A merge-and-cook interface lets you combine food tiles and deliver four escalating orders.

## Visual architecture

- Three.js ES module from jsDelivr CDN (an internet connection is required)
- Physically based Standard Materials, ACES filmic tone mapping, sRGB output
- Hemisphere plus directional lighting, cast and received soft PCF shadows
- Perspective chase camera and level-specific art direction
- Procedural model geometry, animated falling objects, signage, reflective/glossy materials
- Uses the supplied family vacation photo sprite for character faces as available

**Quality note:** This is a stylized real-time 3D browser implementation, not a photorealistic AAA game with scanned assets. Further quality improvements require authored environment art and character models, animation, deeper visual QA and optimization across phones.

## Tests and backup

`node scripts/smoke-test.mjs` performs structural/syntax checks, verifies the four chapters, verifies six elevator challenges have solutions, and checks both preserved game backups. Full GPU and gameplay testing must happen on a real browser/device.

The 2D game and original merge game are deliberately kept in separate files.

## Public family photos

The repository is public, and the small collage of user-supplied vacation photos can be accessed by anyone who visits the repository/site. Ensure the individuals depicted consent to sharing. If the sprite is removed, 3D characters fall back to simple stylized heads.

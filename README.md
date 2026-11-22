# Emberwick — The Wick-Keeper

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/scenario718/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/scenario718/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

Entry for the [make.fun bounty best-stealth-game-20261121-1759](https://make.fun/bounty/best-stealth-game-20261121-1759): a top-down stealth game — relight every lantern in a night garden and slip out the gate unseen, past patrolling wardens with vision cones.

## Play

Open `game/index.html` in a browser — no build step, no network, everything is hand-written HTML/CSS/JS with WebAudio-synthesised sound.

- **Move:** WASD / arrow keys · **Sneak:** Shift · **Light lantern:** E · **Toss a pebble:** click (3 per level)
- Wardens patrol, investigate noises and shadows, and chase on sight. Hedges and shadow zones hide you; suspicion builds while you are in a vision cone and decays when you break line of sight.
- Three hand-built levels (Garden Gate, Courtyard, Grand Hall), 3 lives, score, timer and detection count.

## Layout

- `main.ts` — the hand-in program (Node 22, standard library only): copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.
- `game/` — the game itself (canvas renderer, guard AI with vision cones and line-of-sight, seeded fireflies, deterministic).
- `screenshots/` — four real renders of the game's own screens (title, mid-game, alarm chase, win).

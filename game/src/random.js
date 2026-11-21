// Emberwick — a tiny seeded random generator (mulberry32) so cosmetic
// details like fireflies are the same on every run.

export function makeRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickInRange(random, min, max) {
  return min + random() * (max - min);
}

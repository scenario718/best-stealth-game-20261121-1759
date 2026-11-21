// Emberwick — the wick-keeper. Walks with WASD or arrows, sneaks while
// Shift is held (slower, quieter), tosses pebbles with the mouse to pull a
// guard away, and relights lanterns with E. Running is loud: guards hear it.

import { PLAYER, STEP } from './config.js';
import { resolveCircleWalls, pointInRect } from './level.js';

export class Player {
  constructor(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.radius = PLAYER.radius;
    this.facing = -Math.PI / 2;
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.pebbles = PLAYER.pebbles;
    this.stepClock = 0;
    this.stepInterval = 0.42;
  }

  update(move, input, level, events) {
    this.sneaking = input.isSneaking();
    const speed = this.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    this.moving = move.x !== 0 || move.y !== 0;
    this.running = this.moving && !this.sneaking;
    if (this.moving) {
      this.facing = Math.atan2(move.y, move.x);
      const next = resolveCircleWalls(
        { x: this.x + move.x * speed * STEP, y: this.y + move.y * speed * STEP },
        this.radius,
        level.walls,
      );
      this.x = next.x;
      this.y = next.y;
      this.stepClock += STEP;
      if (this.stepClock >= this.stepInterval) {
        this.stepClock = 0;
        events.push({ type: 'footstep', x: this.x, y: this.y, running: this.running });
        if (this.running) {
          events.push({
            type: 'noise',
            x: this.x,
            y: this.y,
            radius: PLAYER.noiseRadiusWalk,
          });
        }
      }
    } else {
      this.stepClock = 0;
    }
  }

  // A pebble flies to the clicked point (within range) and clatters there.
  throwPebble(target, events) {
    if (this.pebbles <= 0) return false;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance > PLAYER.pebbleRange) return false;
    this.pebbles -= 1;
    events.push({ type: 'pebble', x: target.x, y: target.y });
    events.push({ type: 'noise', x: target.x, y: target.y, radius: PLAYER.pebbleNoise });
    return true;
  }

  nearestLantern(level) {
    let best = null;
    let bestDistance = Infinity;
    for (const lantern of level.lanterns) {
      if (lantern.lit) continue;
      const distance = Math.hypot(lantern.x - this.x, lantern.y - this.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = lantern;
      }
    }
    return bestDistance <= PLAYER.lightRadius ? best : null;
  }

  atExit(level) {
    return pointInRect(this.x, this.y, level.exit);
  }
}

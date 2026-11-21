// Emberwick — level geometry: walls, hedges, shadows, lanterns and the exit,
// plus the collision and line-of-sight tests the guards and player share.

import { ARENA, LEVELS } from './config.js';

export function loadLevel(index) {
  const def = LEVELS[index % LEVELS.length];
  return {
    index,
    name: def.name,
    hint: def.hint,
    playerSpawn: { ...def.playerSpawn },
    exit: { ...def.exit, open: false },
    lanterns: def.lanterns.map((spot) => ({ x: spot.x, y: spot.y, lit: false })),
    walls: def.walls.map((rect) => ({ ...rect })),
    hedges: def.hedges.map((rect) => ({ ...rect })),
    shadows: def.shadows.map((rect) => ({ ...rect })),
    guardSpawns: def.guards.map((guard) => ({
      waypoints: guard.waypoints.map((point) => ({ ...point })),
      pause: guard.pause,
    })),
  };
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Push a circle out of every wall it overlaps; also clamp it inside the arena.
export function resolveCircleWalls(circle, radius, walls) {
  let { x, y } = circle;
  for (const wall of walls) {
    const nearestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
    const nearestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= radius * radius) continue;
    if (distSq === 0) {
      // Centre inside the wall: push out along the smallest penetration.
      const left = x - wall.x;
      const right = wall.x + wall.w - x;
      const top = y - wall.y;
      const bottom = wall.y + wall.h - y;
      const min = Math.min(left, right, top, bottom);
      if (min === left) x = wall.x - radius;
      else if (min === right) x = wall.x + wall.w + radius;
      else if (min === top) y = wall.y - radius;
      else y = wall.y + wall.h + radius;
    } else {
      const dist = Math.sqrt(distSq);
      x = nearestX + (dx / dist) * radius;
      y = nearestY + (dy / dist) * radius;
    }
  }
  x = Math.max(radius, Math.min(ARENA.width - radius, x));
  y = Math.max(radius, Math.min(ARENA.height - radius, y));
  return { x, y };
}

function segmentIntersectsRect(x1, y1, x2, y2, rect) {
  // Liang–Barsky clipping: true when the segment touches the rectangle.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const edges = [
    [-dx, x1 - rect.x],
    [dx, rect.x + rect.w - x1],
    [-dy, y1 - rect.y],
    [dy, rect.y + rect.h - y1],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return true;
}

// True when nothing (wall or hedge) stands between the two points.
export function hasLineOfSight(x1, y1, x2, y2, level) {
  for (const wall of level.walls) {
    if (segmentIntersectsRect(x1, y1, x2, y2, wall)) return false;
  }
  for (const hedge of level.hedges) {
    if (segmentIntersectsRect(x1, y1, x2, y2, hedge)) return false;
  }
  return true;
}

export function insideHedge(x, y, level) {
  return level.hedges.some((hedge) => pointInRect(x, y, hedge));
}

export function insideShadow(x, y, level) {
  return level.shadows.some((shadow) => pointInRect(x, y, shadow));
}

export function lanternsLit(level) {
  return level.lanterns.filter((lantern) => lantern.lit).length;
}

export function allLanternsLit(level) {
  return level.lanterns.every((lantern) => lantern.lit);
}

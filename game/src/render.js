// Emberwick — everything the eye sees: the night garden, walls and hedges,
// lantern glow, the guards' vision cones, the keeper, and every screen.
// Draw order matters: cones are painted before walls and hedges, so cover
// really does hide the cone behind it.

import { ARENA, COLOURS, GUARD } from './config.js';
import { SCREEN } from './world.js';
import { GUARD_STATE } from './guard.js';
import { lanternsLit } from './level.js';
import { makeRandom } from './random.js';

const FIREFLIES = (() => {
  const random = makeRandom(20261121);
  const flies = [];
  for (let i = 0; i < 26; i += 1) {
    flies.push({
      x: random() * ARENA.width,
      y: random() * ARENA.height,
      phase: random() * Math.PI * 2,
      speed: 0.3 + random() * 0.7,
    });
  }
  return flies;
})();

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, time) {
  const tile = 40;
  for (let ty = 0; ty < ARENA.height / tile; ty += 1) {
    for (let tx = 0; tx < ARENA.width / tile; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLOURS.floorA : COLOURS.floorB;
      ctx.fillRect(tx * tile, ty * tile, tile, tile);
    }
  }
  ctx.strokeStyle = COLOURS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= ARENA.width; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ARENA.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ARENA.height; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ARENA.width, y);
    ctx.stroke();
  }
  // Fireflies drift over the garden.
  for (const fly of FIREFLIES) {
    const x = fly.x + Math.sin(time * fly.speed + fly.phase) * 14;
    const y = fly.y + Math.cos(time * fly.speed * 0.8 + fly.phase) * 10;
    const glow = 0.35 + 0.3 * Math.sin(time * 2 + fly.phase * 3);
    ctx.fillStyle = `rgba(255, 220, 130, ${Math.max(0.08, glow)})`;
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShadowZones(ctx, level) {
  for (const shadow of level.shadows) {
    ctx.fillStyle = 'rgba(8, 12, 20, 0.55)';
    roundRect(ctx, shadow.x, shadow.y, shadow.w, shadow.h, 14);
    ctx.fill();
    ctx.fillStyle = 'rgba(159, 176, 192, 0.5)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('shadow — hard to spot you here', shadow.x + shadow.w / 2, shadow.y + shadow.h - 8);
  }
}

function drawVisionCone(ctx, guard) {
  const range = GUARD.visionRange;
  const half = GUARD.visionHalfAngle;
  let fill = COLOURS.coneCalm;
  if (guard.state === GUARD_STATE.CHASE) fill = COLOURS.coneAlarm;
  else if (guard.suspicion >= 55 || guard.state === GUARD_STATE.SUSPICIOUS) fill = COLOURS.coneSuspicious;
  const gradient = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, range);
  gradient.addColorStop(0, fill);
  gradient.addColorStop(1, 'rgba(255, 190, 80, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.facing - half, guard.facing + half);
  ctx.closePath();
  ctx.fill();
  // Cone edge lines, so the boundary reads at a glance.
  ctx.strokeStyle = fill.replace(/[\d.]+\)$/, '0.55)');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing - half) * range, guard.y + Math.sin(guard.facing - half) * range);
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing + half) * range, guard.y + Math.sin(guard.facing + half) * range);
  ctx.stroke();
}

function drawLantern(ctx, lantern, time) {
  const { x, y } = lantern;
  if (lantern.lit) {
    const pulse = 0.55 + 0.1 * Math.sin(time * 3 + x);
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 90);
    glow.addColorStop(0, `rgba(255, 179, 71, ${pulse})`);
    glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 90, 0, Math.PI * 2);
    ctx.fill();
  }
  // Post and glass.
  ctx.fillStyle = '#2c2f3a';
  ctx.fillRect(x - 3, y - 2, 6, 16);
  ctx.fillStyle = lantern.lit ? COLOURS.lanternGlass : COLOURS.lanternUnlit;
  ctx.beginPath();
  ctx.arc(x, y - 8, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#20242e';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!lantern.lit) {
    ctx.fillStyle = 'rgba(232, 238, 244, 0.75)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E', x, y - 22);
  }
}

function drawExit(ctx, level, time) {
  const { exit } = level;
  const cx = exit.x + exit.w / 2;
  const cy = exit.y + exit.h / 2;
  if (exit.open) {
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 80);
    glow.addColorStop(0, 'rgba(88, 214, 141, 0.55)');
    glow.addColorStop(1, 'rgba(88, 214, 141, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = exit.open ? COLOURS.exitOpen : COLOURS.exitClosed;
  roundRect(ctx, exit.x, exit.y, exit.w, exit.h, 6);
  ctx.fill();
  ctx.fillStyle = '#0e2418';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(exit.open ? 'GATE OPEN' : 'GATE', cx, cy + 4);
}

function drawWalls(ctx, level) {
  for (const wall of level.walls) {
    ctx.fillStyle = COLOURS.wall;
    roundRect(ctx, wall.x, wall.y, wall.w, wall.h, 4);
    ctx.fill();
    ctx.fillStyle = COLOURS.wallTop;
    ctx.fillRect(wall.x + 2, wall.y + 2, wall.w - 4, 5);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawHedges(ctx, level) {
  for (const hedge of level.hedges) {
    ctx.fillStyle = COLOURS.hedge;
    roundRect(ctx, hedge.x, hedge.y, hedge.w, hedge.h, 12);
    ctx.fill();
    ctx.fillStyle = COLOURS.hedgeLight;
    for (let i = 0; i < Math.floor(hedge.w / 18); i += 1) {
      ctx.beginPath();
      ctx.arc(hedge.x + 12 + i * 18, hedge.y + hedge.h / 2 - 6, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLOURS.hedgeDark;
    for (let i = 0; i < Math.floor(hedge.w / 22); i += 1) {
      ctx.beginPath();
      ctx.arc(hedge.x + 20 + i * 22, hedge.y + hedge.h / 2 + 8, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGuard(ctx, guard, time) {
  const bob = Math.sin(time * 6 + guard.stepPhase) * 1.5;
  // Lantern light the guard carries.
  const glow = ctx.createRadialGradient(guard.x, guard.y, 4, guard.x, guard.y, 46);
  glow.addColorStop(0, 'rgba(255, 190, 90, 0.28)');
  glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 46, 0, Math.PI * 2);
  ctx.fill();
  // Body: cloak, helmet, facing nose.
  ctx.fillStyle = COLOURS.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.guardDark;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob, GUARD.radius - 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe1a1';
  ctx.beginPath();
  ctx.arc(
    guard.x + Math.cos(guard.facing) * 9,
    guard.y + bob + Math.sin(guard.facing) * 9,
    3.5, 0, Math.PI * 2,
  );
  ctx.fill();
  // Suspicion: "?" while watching, "!" on the chase, plus a thin meter.
  if (guard.suspicion >= 25) {
    const mark = guard.state === GUARD_STATE.CHASE ? '!' : '?';
    ctx.fillStyle = guard.state === GUARD_STATE.CHASE ? '#ff5040' : '#ffc46b';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mark, guard.x, guard.y + bob - 22);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(guard.x - 14, guard.y + bob - 20, 28, 4);
    ctx.fillStyle = guard.state === GUARD_STATE.CHASE ? '#ff5040' : '#ffc46b';
    ctx.fillRect(guard.x - 14, guard.y + bob - 20, 28 * (guard.suspicion / 100), 4);
  }
}

function drawPlayer(ctx, player, level, time) {
  const inHedge = level.hedges.some(
    (hedge) => player.x >= hedge.x && player.x <= hedge.x + hedge.w && player.y >= hedge.y && player.y <= hedge.y + hedge.h,
  );
  ctx.save();
  if (inHedge) ctx.globalAlpha = 0.65;
  // Soft teal glow so the keeper reads against the dark floor.
  const glow = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, 34);
  glow.addColorStop(0, 'rgba(55, 200, 160, 0.30)');
  glow.addColorStop(1, 'rgba(55, 200, 160, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 34, 0, Math.PI * 2);
  ctx.fill();
  // Cloak: a triangle pointing where the keeper faces, over a round body.
  ctx.fillStyle = COLOURS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.playerDark;
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(player.facing) * 15, player.y + Math.sin(player.facing) * 15);
  ctx.lineTo(
    player.x + Math.cos(player.facing + 2.4) * 11,
    player.y + Math.sin(player.facing + 2.4) * 11,
  );
  ctx.lineTo(
    player.x + Math.cos(player.facing - 2.4) * 11,
    player.y + Math.sin(player.facing - 2.4) * 11,
  );
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0d2b23';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.sneaking) {
    ctx.fillStyle = 'rgba(232, 238, 244, 0.8)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', player.x, player.y - 20);
  }
}

function drawNoiseAndPebbles(ctx, world) {
  for (const ring of world.noiseRings) {
    const alpha = Math.max(0, ring.life / ring.maxLife) * 0.6;
    ctx.strokeStyle = `rgba(255, 220, 130, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * (1 - ring.life / ring.maxLife) + 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const mark of world.pebbleMarks) {
    ctx.fillStyle = '#c9d4de';
    ctx.beginPath();
    ctx.arc(mark.x, mark.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, world) {
  const level = world.level;
  const lit = lanternsLit(level);
  ctx.fillStyle = 'rgba(10, 16, 24, 0.72)';
  ctx.fillRect(0, 0, ARENA.width, 34);
  ctx.fillStyle = COLOURS.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(level.name, 12, 22);
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🏮 ${lit}/${level.lanterns.length} lanterns`, 330, 22);
  ctx.fillText(`♥ ${'♥'.repeat(Math.max(0, world.lives))}${'·'.repeat(Math.max(0, 3 - world.lives))}`, 500, 22);
  ctx.fillText(`◉ ${world.player.pebbles} pebbles`, 620, 22);
  const minutes = Math.floor(world.timePlayed / 60);
  const seconds = Math.floor(world.timePlayed % 60);
  ctx.fillText(`⏱ ${minutes}:${String(seconds).padStart(2, '0')}   ★ ${world.score}`, 800, 22);
  // Alarm meter (top-left, below the HUD bar — clear of the gate, top-right).
  const alarm = world.alarmLevel();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(12, 40, 178, 10);
  ctx.fillStyle = alarm >= 100 ? '#ff5040' : alarm >= 55 ? '#ff9c3c' : '#ffc46b';
  ctx.fillRect(12, 40, 178 * (alarm / 100), 10);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(alarm >= 100 ? 'ALARM — RUN!' : alarm >= 55 ? 'SPOTTED — break line of sight!' : 'detection', 12, 68);
  // Objective + toast.
  ctx.fillStyle = 'rgba(10, 16, 24, 0.6)';
  ctx.fillRect(0, ARENA.height - 30, ARENA.width, 30);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(world.statusLine(), ARENA.width / 2, ARENA.height - 11);
  if (world.messageClock > 0 && world.message) {
    ctx.fillStyle = 'rgba(10, 16, 24, 0.78)';
    const w = ctx.measureText(world.message).width + 28;
    roundRect(ctx, (ARENA.width - w) / 2, 44, w, 26, 8);
    ctx.fill();
    ctx.fillStyle = COLOURS.text;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(world.message, ARENA.width / 2, 62);
  }
}

function drawButton(ctx, rect, label, primary) {
  ctx.fillStyle = primary ? '#2a9d7f' : '#2c3a4a';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.strokeStyle = primary ? '#7fe0c0' : '#5a6b7d';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#f2f7fa';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 5);
}

// The clickable buttons for each screen, in arena pixels. main.js uses the
// same rects for click handling.
export function screenButtons(screen, world) {
  const centre = ARENA.width / 2;
  if (screen === SCREEN.TITLE) {
    return [{ id: 'start', label: 'Begin the night', x: centre - 110, y: 470, w: 220, h: 44, primary: true }];
  }
  if (screen === SCREEN.CAUGHT) {
    const buttons = [{ id: 'retry', label: 'Try this level again', x: centre - 120, y: 400, w: 240, h: 44, primary: true }];
    if (!world.gameOver) buttons.push({ id: 'title', label: 'Back to title', x: centre - 120, y: 456, w: 240, h: 40, primary: false });
    return buttons;
  }
  if (screen === SCREEN.LEVEL_CLEAR) {
    return [{ id: 'next', label: 'Next level →', x: centre - 110, y: 420, w: 220, h: 44, primary: true }];
  }
  if (screen === SCREEN.WON) {
    return [{ id: 'again', label: 'Play again', x: centre - 110, y: 440, w: 220, h: 44, primary: true }];
  }
  return [];
}

function drawOverlay(ctx, world) {
  const screen = world.screen;
  ctx.fillStyle = 'rgba(8, 12, 20, 0.72)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.textAlign = 'center';
  if (screen === SCREEN.TITLE) {
    ctx.fillStyle = COLOURS.glowWarm;
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('EMBERWICK', ARENA.width / 2, 150);
    ctx.fillStyle = COLOURS.text;
    ctx.font = '20px Georgia, serif';
    ctx.fillText('The Wick-Keeper', ARENA.width / 2, 186);
    ctx.fillStyle = COLOURS.textDim;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('A quiet game of lanterns, wardens and shadows.', ARENA.width / 2, 230);
    ctx.fillText('Relight every lantern, then slip out the gate unseen.', ARENA.width / 2, 254);
    ctx.fillStyle = COLOURS.text;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('WASD / arrows — move      Shift — sneak (slow, silent)', ARENA.width / 2, 310);
    ctx.fillText('Mouse click — toss a pebble to distract a warden', ARENA.width / 2, 334);
    ctx.fillText('E — relight a lantern      R — restart level      M — mute', ARENA.width / 2, 358);
    ctx.fillStyle = COLOURS.textDim;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Hide in hedges. Shadows slow a warden’s suspicion. Running is loud.', ARENA.width / 2, 400);
    ctx.fillText('Three gardens stand between you and dawn.', ARENA.width / 2, 424);
  } else if (screen === SCREEN.CAUGHT) {
    ctx.fillStyle = '#ff6b5e';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText(world.gameOver ? 'Caught — the night wins' : 'Caught!', ARENA.width / 2, 200);
    ctx.fillStyle = COLOURS.text;
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText(
      world.gameOver
        ? 'Three times caught. The wardens keep the garden tonight.'
        : `A warden laid hands on you. ${world.lives} ${world.lives === 1 ? 'life' : 'lives'} left — the level resets.`,
      ARENA.width / 2, 250,
    );
    ctx.fillStyle = COLOURS.textDim;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Tip: toss a pebble to pull a warden away, or wait out the patrol in a hedge.', ARENA.width / 2, 290);
    ctx.fillText(`Score so far: ${world.score}   •   Detections: ${world.detections}`, ARENA.width / 2, 330);
  } else if (screen === SCREEN.LEVEL_CLEAR) {
    ctx.fillStyle = COLOURS.exitOpen;
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText('The gate swings open', ARENA.width / 2, 210);
    ctx.fillStyle = COLOURS.text;
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText(`${world.level.name} — cleared unseen.`, ARENA.width / 2, 258);
    ctx.fillText(`Score: ${world.score}   •   Time: ${Math.floor(world.timePlayed / 60)}:${String(Math.floor(world.timePlayed % 60)).padStart(2, '0')}`, ARENA.width / 2, 292);
    ctx.fillStyle = COLOURS.textDim;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('The next garden is darker, and its wardens walk closer together.', ARENA.width / 2, 330);
  } else if (screen === SCREEN.WON) {
    ctx.fillStyle = COLOURS.glowWarm;
    ctx.font = 'bold 52px Georgia, serif';
    ctx.fillText('Dawn breaks over Emberwick', ARENA.width / 2, 200);
    ctx.fillStyle = COLOURS.text;
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Every lantern burns. You were never seen — or never caught twice.', ARENA.width / 2, 250);
    ctx.fillText(`Final score: ${world.score}   •   Detections: ${world.detections}   •   Time: ${Math.floor(world.timePlayed / 60)}:${String(Math.floor(world.timePlayed % 60)).padStart(2, '0')}`, ARENA.width / 2, 292);
    ctx.fillStyle = COLOURS.textDim;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('The wick-keeper slips home as the wardens change shift.', ARENA.width / 2, 330);
  }
  for (const button of screenButtons(screen, world)) {
    drawButton(ctx, button, button.label, button.primary);
  }
}

export function drawGame(ctx, world) {
  const time = world.timePlayed + world.screenClock;
  drawFloor(ctx, time);
  drawShadowZones(ctx, world.level);
  drawExit(ctx, world.level, time);
  for (const lantern of world.level.lanterns) drawLantern(ctx, lantern, time);
  for (const guard of world.guards) drawVisionCone(ctx, guard);
  drawHedges(ctx, world.level);
  drawWalls(ctx, world.level);
  drawNoiseAndPebbles(ctx, world);
  for (const guard of world.guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, world.player, world.level, time);
  if (world.screen === SCREEN.PLAY) drawHud(ctx, world);
  if (world.screen !== SCREEN.PLAY) drawOverlay(ctx, world);
}

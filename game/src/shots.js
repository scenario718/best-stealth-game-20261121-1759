// Emberwick — the screenshot scenes behind ?shot=start|play|tense|win.
// Each scene sets the real world to a real, played state (positions, lit
// lanterns, suspicion, screen) and then steps the simulation forward a few
// frames with a scripted input, so the frame is what a short game really
// looks like. Same seed, same frame, every time.

import { SCREEN } from './world.js';
import { GUARD_STATE } from './guard.js';

const SAMPLE = 1 / 60;

function scriptedInput(moves) {
  let index = 0;
  return {
    keys: new Set(),
    pressed: new Set(),
    click: null,
    moveVector() {
      const move = moves[Math.min(index, moves.length - 1)] || { x: 0, y: 0 };
      return move;
    },
    isSneaking() {
      return false;
    },
    consumeClick() {
      return null;
    },
    consumePressed() {
      return false;
    },
    endFrame() {},
    tick() {
      index += 1;
    },
  };
}

function runScript(world, seconds, moves, events) {
  const input = scriptedInput(moves);
  const steps = Math.round(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    world.step(input, events);
    input.tick();
  }
}

// Level 1, fresh, the keeper at the garden door, wardens on patrol.
function stageStart(world) {
  world.resetRun();
  world.screen = SCREEN.TITLE;
  runScript(world, 3, [], []);
  world.screen = SCREEN.TITLE;
  return SCREEN.TITLE;
}

// Mid-game: two lanterns lit, the keeper crouched in a hedge while a
// warden's cone sweeps just past, suspicion half-raised.
function stagePlay(world) {
  world.resetRun();
  world.startLevel();
  world.level.lanterns[0].lit = true;
  world.level.lanterns[2].lit = true;
  world.score = 200;
  world.player.x = 340;
  world.player.y = 445;
  world.player.sneaking = true;
  const guard = world.guards[1];
  guard.x = 470;
  guard.y = 430;
  guard.facing = Math.PI;
  guard.suspicion = 88;
  guard.state = GUARD_STATE.SUSPICIOUS;
  const moves = [];
  for (let i = 0; i < 60; i += 1) moves.push({ x: 0, y: 0 });
  runScript(world, 1, moves, []);
  return SCREEN.PLAY;
}

// The near miss: a warden has raised the alarm and is closing in while the
// keeper, every lantern lit, runs for the open gate.
function stageTense(world) {
  world.resetRun();
  world.startLevel();
  for (const lantern of world.level.lanterns) lantern.lit = true;
  world.level.exit.open = true;
  world.score = 300;
  world.player.x = 760;
  world.player.y = 170;
  const guard = world.guards[0];
  guard.x = 640;
  guard.y = 190;
  guard.facing = 0;
  guard.suspicion = 100;
  guard.state = GUARD_STATE.CHASE;
  guard.alarmLeft = 5;
  guard.lastSeen = { x: 760, y: 170 };
  const moves = [];
  for (let i = 0; i < 72; i += 1) moves.push({ x: 1, y: -0.7 });
  runScript(world, 1.2, moves, []);
  return SCREEN.PLAY;
}

// The payoff: all three gardens cleared, dawn breaking.
function stageWin(world) {
  world.resetRun();
  world.startLevel();
  for (const lantern of world.level.lanterns) lantern.lit = true;
  world.level.exit.open = true;
  world.score = 1450;
  world.detections = 1;
  world.timePlayed = 214;
  world.screen = SCREEN.WON;
  return SCREEN.WON;
}

export function stageShot(name, world) {
  const events = [];
  if (name === 'play') return stagePlay(world);
  if (name === 'tense') return stageTense(world);
  if (name === 'win') return stageWin(world);
  return stageStart(world);
}

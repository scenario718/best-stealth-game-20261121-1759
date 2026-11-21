// Emberwick — boot and the game loop. Fixed 60 Hz steps, sounds from the
// world's events, canvas buttons for the menu screens, and the ?shot=
// scenes the screenshots are taken from (no loop, one staged frame).

import { ARENA, STEP } from './config.js';
import { World, SCREEN } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { drawGame, screenButtons } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const world = new World();
const input = createInput(canvas);
const audio = createAudio();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

function playEvents(events) {
  for (const event of events) {
    if (event.type === 'footstep') {
      const distance = 0;
      audio.footstep(distance);
    } else if (event.type === 'lantern') {
      audio.lanternLit();
    } else if (event.type === 'pebble') {
      audio.pebble();
      world.pebbleMarks.push({ x: event.x, y: event.y, life: 1.2 });
      world.noiseRings.push({ x: event.x, y: event.y, radius: 130, life: 0.9, maxLife: 0.9 });
    } else if (event.type === 'noise') {
      for (const guard of world.guards) guard.hearNoise({ x: event.x, y: event.y }, event.radius);
      if (event.radius >= 90) {
        world.noiseRings.push({ x: event.x, y: event.y, radius: event.radius, life: 0.7, maxLife: 0.7 });
      }
    } else if (event.type === 'spotted') {
      audio.spotted();
    } else if (event.type === 'alarm') {
      audio.alarm();
    } else if (event.type === 'caught') {
      audio.caught();
    } else if (event.type === 'level-clear') {
      audio.levelClear();
    }
  }
}

function guardFootsteps() {
  // A guard's steps reach the keeper's ears: the nearer, the louder.
  for (const guard of world.guards) {
    const distance = Math.hypot(guard.x - world.player.x, guard.y - world.player.y);
    if (distance > 320) continue;
    guard.stepPhase += STEP * 3.2;
    if (guard.stepPhase > Math.PI * 2) {
      guard.stepPhase -= Math.PI * 2;
      audio.guardStep(distance);
    }
  }
}

function handleButtonClick(click) {
  const buttons = screenButtons(world.screen, world);
  for (const button of buttons) {
    if (
      click.x >= button.x && click.x <= button.x + button.w &&
      click.y >= button.y && click.y <= button.y + button.h
    ) {
      audio.unlock();
      if (button.id === 'start') world.startRun();
      else if (button.id === 'retry') world.retryLevel();
      else if (button.id === 'title') world.resetRun();
      else if (button.id === 'next') world.nextLevel();
      else if (button.id === 'again') world.startRun();
      return true;
    }
  }
  return false;
}

let accumulator = 0;
let lastTime = performance.now();

function frame(now) {
  const elapsed = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    accumulator -= STEP;
    if (world.screen === SCREEN.PLAY) {
      if (input.consumePressed('r') || input.consumePressed('R')) world.retryLevel();
      if (input.consumePressed('m') || input.consumePressed('M')) audio.toggleMute();
      // A click on a menu button never reaches the world; in play, a click
      // is a pebble toss, handled inside world.step.
      const events = [];
      world.step(input, events);
      playEvents(events);
      guardFootsteps();
    } else {
      const click = input.consumeClick();
      if (click) handleButtonClick(click);
      if (input.consumePressed('Enter') || input.consumePressed(' ')) {
        if (world.screen === SCREEN.TITLE) world.startRun();
        else if (world.screen === SCREEN.CAUGHT) world.retryLevel();
        else if (world.screen === SCREEN.LEVEL_CLEAR) world.nextLevel();
        else if (world.screen === SCREEN.WON) world.startRun();
      }
      world.screenClock += STEP;
    }
    input.endFrame();
  }
  drawGame(ctx, world);
  requestAnimationFrame(frame);
}

if (shotName) {
  // Screenshot mode: stage the scene, draw exactly one frame, stop.
  document.getElementById('help').style.display = 'none';
  stageShot(shotName, world);
  drawGame(ctx, world);
  document.title = `Emberwick — shot ${shotName}`;
} else {
  canvas.width = ARENA.width;
  canvas.height = ARENA.height;
  requestAnimationFrame(frame);
}

// Emberwick — the world: one level's live state, the step function that
// advances it, and the screens (title, playing, caught, level clear, won).
// The world never touches the DOM; main.js reads it and render.js draws it.

import { ARENA, GUARD, LEVELS, STEP } from './config.js';
import { loadLevel, lanternsLit, allLanternsLit } from './level.js';
import { Guard, GUARD_STATE } from './guard.js';
import { Player } from './player.js';

export const SCREEN = {
  TITLE: 'title',
  PLAY: 'play',
  CAUGHT: 'caught',
  LEVEL_CLEAR: 'level-clear',
  WON: 'won',
};

export class World {
  constructor() {
    this.resetRun();
  }

  resetRun() {
    this.levelIndex = 0;
    this.lives = 3;
    this.score = 0;
    this.detections = 0;
    this.timePlayed = 0;
    this.screen = SCREEN.TITLE;
    this.screenClock = 0;
    this.message = '';
    this.messageClock = 0;
    this.loadLevel(0);
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = loadLevel(index);
    this.player = new Player(this.level.playerSpawn);
    this.guards = this.level.guardSpawns.map((spawn) => new Guard(spawn));
    this.pebbleMarks = [];
    this.noiseRings = [];
    this.screenClock = 0;
  }

  startLevel() {
    this.screen = SCREEN.PLAY;
    this.screenClock = 0;
  }

  startRun() {
    this.resetRun();
    this.startLevel();
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.screen = SCREEN.WON;
      this.screenClock = 0;
      return;
    }
    this.loadLevel(this.levelIndex + 1);
    this.screen = SCREEN.PLAY;
    this.screenClock = 0;
  }

  retryLevel() {
    this.loadLevel(this.levelIndex);
    this.screen = SCREEN.PLAY;
    this.screenClock = 0;
  }

  showMessage(text, seconds = 2.5) {
    this.message = text;
    this.messageClock = seconds;
  }

  // One fixed step. `input` is the live input object; `events` collects
  // sounds and happenings for main.js to play. Returns nothing.
  step(input, events) {
    this.screenClock += STEP;
    if (this.messageClock > 0) this.messageClock -= STEP;
    if (this.screen !== SCREEN.PLAY) return;

    this.timePlayed += STEP;
    const move = input.moveVector();
    this.player.update(move, input, this.level, events);

    // Pebble toss: the click is consumed here so a menu click never throws.
    const click = input.consumeClick();
    if (click && click.button === 0) {
      const point = { x: click.x, y: click.y };
      if (!this.player.throwPebble(point, events)) {
        if (this.player.pebbles <= 0) this.showMessage('No pebbles left — sneak instead.');
      }
    }

    // Relight a lantern with E.
    if (input.consumePressed('e') || input.consumePressed('E')) {
      const lantern = this.player.nearestLantern(this.level);
      if (lantern) {
        lantern.lit = true;
        this.score += 100;
        events.push({ type: 'lantern', x: lantern.x, y: lantern.y });
        this.showMessage(`Lantern lit — ${lanternsLit(this.level)} of ${this.level.lanterns.length}.`);
        if (allLanternsLit(this.level)) {
          this.level.exit.open = true;
          this.showMessage('Every lantern burns. The gate is open — go!', 3.5);
        }
      }
    }

    for (const guard of this.guards) {
      guard.update(this.player, this.level, events);
    }

    // Noise rings fade; pebble marks linger briefly.
    this.noiseRings = this.noiseRings.filter((ring) => (ring.life -= STEP) > 0);
    this.pebbleMarks = this.pebbleMarks.filter((mark) => (mark.life -= STEP) > 0);

    // Caught: a chasing guard that reaches the keeper.
    for (const guard of this.guards) {
      if (guard.state !== GUARD_STATE.CHASE) continue;
      const distance = Math.hypot(guard.x - this.player.x, guard.y - this.player.y);
      if (distance <= GUARD.catchDistance) {
        this.lives -= 1;
        this.detections += 1;
        events.push({ type: 'caught' });
        if (this.lives <= 0) {
          this.gameOver = true;
        } else {
          this.gameOver = false;
        }
        this.screen = SCREEN.CAUGHT;
        this.screenClock = 0;
        return;
      }
    }

    // Reached the open gate with every lantern lit: level done.
    if (this.level.exit.open && this.player.atExit(this.level)) {
      const timeBonus = Math.max(0, Math.round(300 - this.timePlayed));
      this.score += 250 + timeBonus;
      events.push({ type: 'level-clear' });
      if (this.levelIndex + 1 >= LEVELS.length) {
        this.screen = SCREEN.WON;
      } else {
        this.screen = SCREEN.LEVEL_CLEAR;
      }
      this.screenClock = 0;
    }
  }

  // Highest guard suspicion right now, for the HUD alarm meter.
  alarmLevel() {
    return Math.max(0, ...this.guards.map((guard) => guard.suspicion));
  }

  guardsAlerted() {
    return this.guards.filter((guard) => guard.state === GUARD_STATE.CHASE).length;
  }

  statusLine() {
    if (this.screen !== SCREEN.PLAY) return '';
    if (!allLanternsLit(this.level)) {
      return `Relight the lanterns — ${lanternsLit(this.level)}/${this.level.lanterns.length} lit`;
    }
    return 'The gate is open — reach the green gate unseen!';
  }
}

export { ARENA };

// Emberwick — shared constants and the three hand-built levels.
// The arena is 960 x 640, top-down. All positions are in arena pixels.

export const ARENA = { width: 960, height: 640 };
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 132,
  sneakSpeed: 66,
  noiseRadiusWalk: 95,
  noiseRadiusSneak: 18,
  pebbles: 3,
  pebbleRange: 270,
  pebbleNoise: 130,
  lightRadius: 36,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 56,
  chaseSpeed: 108,
  investigateSpeed: 78,
  visionRange: 175,
  visionHalfAngle: (38 * Math.PI) / 180,
  catchDistance: 24,
  hiddenSpotDistance: 46,
  suspicionGainClose: 58,
  suspicionGainFar: 30,
  suspicionDecay: 26,
  suspicionRunMultiplier: 1.6,
  suspicionShadowMultiplier: 0.5,
  alarmSeconds: 6,
};

export const COLOURS = {
  floorA: '#182230',
  floorB: '#1b2836',
  floorLine: '#223144',
  wall: '#39434f',
  wallTop: '#4d5a68',
  hedge: '#1d4d2c',
  hedgeLight: '#2a6b3d',
  hedgeDark: '#143620',
  shadow: '#101a26',
  lanternUnlit: '#3d3a4a',
  lanternGlass: '#ffd98a',
  glowWarm: '#ffb347',
  exitClosed: '#3f6b4f',
  exitOpen: '#58d68d',
  player: '#37c8a0',
  playerDark: '#1e7a62',
  guard: '#d98a2b',
  guardDark: '#8a5414',
  coneCalm: 'rgba(255, 190, 80, 0.20)',
  coneSuspicious: 'rgba(255, 150, 60, 0.34)',
  coneAlarm: 'rgba(255, 70, 50, 0.38)',
  text: '#e8eef4',
  textDim: '#9fb0c0',
};

// One level: walls block movement and sight; hedges block sight and hide the
// wick-keeper inside them, but the keeper can slip through them slowly.
// lanterns: spots to relight. exit: the gate, locked until every lantern burns.
export const LEVELS = [
  {
    name: 'I — The Garden Gate',
    hint: 'Relight the 3 lanterns, then slip out the gate unseen.',
    playerSpawn: { x: 80, y: 560 },
    exit: { x: 872, y: 28, w: 64, h: 26 },
    lanterns: [
      { x: 180, y: 92 },
      { x: 768, y: 138 },
      { x: 480, y: 522 },
    ],
    walls: [
      { x: 210, y: 110, w: 24, h: 210 },
      { x: 520, y: 300, w: 250, h: 24 },
      { x: 640, y: 70, w: 24, h: 170 },
    ],
    hedges: [
      { x: 300, y: 420, w: 150, h: 52 },
      { x: 560, y: 150, w: 120, h: 50 },
      { x: 110, y: 250, w: 96, h: 46 },
    ],
    shadows: [
      { x: 330, y: 90, w: 150, h: 90 },
      { x: 640, y: 470, w: 180, h: 90 },
    ],
    guards: [
      { waypoints: [{ x: 320, y: 190 }, { x: 620, y: 190 }], pause: 1.2 },
      { waypoints: [{ x: 700, y: 430 }, { x: 380, y: 430 }], pause: 0.8 },
    ],
  },
  {
    name: 'II — The Courtyard',
    hint: 'Three wardens now. The hedges are your friends — stay low, stay quiet.',
    playerSpawn: { x: 80, y: 80 },
    exit: { x: 872, y: 586, w: 64, h: 26 },
    lanterns: [
      { x: 150, y: 320 },
      { x: 480, y: 110 },
      { x: 800, y: 320 },
      { x: 480, y: 540 },
    ],
    walls: [
      { x: 300, y: 60, w: 24, h: 180 },
      { x: 636, y: 400, w: 24, h: 180 },
      { x: 420, y: 308, w: 120, h: 24 },
    ],
    hedges: [
      { x: 120, y: 470, w: 150, h: 52 },
      { x: 690, y: 120, w: 150, h: 52 },
      { x: 380, y: 430, w: 130, h: 48 },
      { x: 180, y: 180, w: 110, h: 46 },
    ],
    shadows: [
      { x: 80, y: 300, w: 140, h: 120 },
      { x: 700, y: 430, w: 170, h: 110 },
    ],
    guards: [
      { waypoints: [{ x: 200, y: 250 }, { x: 480, y: 250 }, { x: 760, y: 250 }], pause: 1.0 },
      { waypoints: [{ x: 760, y: 480 }, { x: 480, y: 480 }], pause: 0.6 },
      { waypoints: [{ x: 480, y: 130 }, { x: 480, y: 560 }], pause: 1.4 },
    ],
  },
  {
    name: 'III — The Grand Hall',
    hint: 'Five lanterns, four wardens, one way out. Patience wins.',
    playerSpawn: { x: 480, y: 590 },
    exit: { x: 448, y: 28, w: 64, h: 26 },
    lanterns: [
      { x: 110, y: 110 },
      { x: 850, y: 110 },
      { x: 110, y: 530 },
      { x: 850, y: 530 },
      { x: 480, y: 320 },
    ],
    walls: [
      { x: 220, y: 180, w: 24, h: 220 },
      { x: 716, y: 240, w: 24, h: 220 },
      { x: 380, y: 120, w: 200, h: 24 },
      { x: 380, y: 496, w: 200, h: 24 },
    ],
    hedges: [
      { x: 300, y: 250, w: 130, h: 50 },
      { x: 530, y: 340, w: 130, h: 50 },
      { x: 90, y: 300, w: 90, h: 48 },
      { x: 780, y: 300, w: 90, h: 48 },
    ],
    shadows: [
      { x: 300, y: 420, w: 150, h: 100 },
      { x: 520, y: 120, w: 150, h: 100 },
      { x: 80, y: 150, w: 120, h: 100 },
    ],
    guards: [
      { waypoints: [{ x: 160, y: 200 }, { x: 480, y: 200 }, { x: 800, y: 200 }], pause: 0.8 },
      { waypoints: [{ x: 800, y: 440 }, { x: 480, y: 440 }, { x: 160, y: 440 }], pause: 0.8 },
      { waypoints: [{ x: 480, y: 90 }, { x: 480, y: 300 }], pause: 1.2 },
      { waypoints: [{ x: 480, y: 550 }, { x: 480, y: 380 }], pause: 1.2 },
    ],
  },
];

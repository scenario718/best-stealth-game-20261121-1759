// Emberwick — all sound is synthesised with WebAudio, so the game ships
// no audio files and makes no network request. Footsteps tell you where a
// guard is: a soft tick, louder the nearer the guard walks.

export function createAudio() {
  let context = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return context;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.destination);
    return context;
  }

  function tone(frequency, duration, type, volume, when = 0, slideTo = null) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  function noiseTick(volume, lowpass) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const length = Math.floor(ctx.sampleRate * 0.07);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    footstep(distance) {
      // Louder when the walker is near; the player's own steps are the softest.
      const volume = Math.max(0.02, 0.22 - distance / 900);
      noiseTick(volume, 700);
    },
    guardStep(distance) {
      const volume = Math.max(0.015, 0.3 - distance / 700);
      noiseTick(volume, 420);
    },
    lanternLit() {
      tone(660, 0.16, 'sine', 0.22);
      tone(990, 0.3, 'sine', 0.18, 0.09);
    },
    pebble() {
      noiseTick(0.3, 2400);
      tone(190, 0.08, 'triangle', 0.12, 0.05);
    },
    spotted() {
      tone(220, 0.28, 'sawtooth', 0.16, 0, 440);
    },
    alarm() {
      tone(311, 0.16, 'square', 0.14);
      tone(233, 0.16, 'square', 0.14, 0.16);
      tone(311, 0.2, 'square', 0.14, 0.32);
    },
    caught() {
      tone(160, 0.5, 'sawtooth', 0.22, 0, 55);
      noiseTick(0.3, 300);
    },
    levelClear() {
      [523, 659, 784, 1047].forEach((frequency, i) => tone(frequency, 0.32, 'sine', 0.2, i * 0.11));
    },
    win() {
      [523, 659, 784, 1047, 1319].forEach((frequency, i) => tone(frequency, 0.4, 'sine', 0.2, i * 0.13));
    },
  };
}

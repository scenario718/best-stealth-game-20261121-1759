// Emberwick — keyboard and mouse input. The game reads this one object;
// nothing else touches the DOM events.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    sneak: false,
    // A click the game has not consumed yet: {x, y} in arena pixels, or null.
    click: null,
    // True on the frame a key was first pressed down.
    pressed: new Set(),
    mouse: { x: 0, y: 0 },
  };

  function arenaPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!keys.has(event.key)) input.pressed.add(event.key);
    keys.add(event.key);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key);
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });
  canvas.addEventListener('mousemove', (event) => {
    input.mouse = arenaPoint(event);
  });
  canvas.addEventListener('mousedown', (event) => {
    input.mouse = arenaPoint(event);
    input.click = { ...input.mouse, button: event.button };
  });

  input.moveVector = function moveVector() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('A') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('d') || keys.has('D') || keys.has('ArrowRight')) x += 1;
    if (keys.has('w') || keys.has('W') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('s') || keys.has('S') || keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  };

  input.isSneaking = function isSneaking() {
    return keys.has('Shift');
  };

  input.consumeClick = function consumeClick() {
    const click = input.click;
    input.click = null;
    return click;
  };

  input.consumePressed = function consumePressed(key) {
    if (input.pressed.has(key)) {
      input.pressed.delete(key);
      return true;
    }
    return false;
  };

  input.endFrame = function endFrame() {
    input.pressed.clear();
  };

  return input;
}

/**
 * orientation.js
 * Unified handler for orientationchange + resize events.
 * Fires the game._resize() callback with a 300ms debounce after
 * orientationchange, and immediately on plain resize.
 */

export function setupOrientationHandler(canvas, game) {
  let _orientationTimer = null;

  // Try to lock to landscape
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {
      // Not supported or not in fullscreen — silently ignore
    });
  }

  const onResize = () => {
    game._resize();
  };

  const onOrientationChange = () => {
    clearTimeout(_orientationTimer);
    _orientationTimer = setTimeout(() => {
      game._resize();
    }, 300);
  };

  window.addEventListener('resize', onResize);

  if ('onorientationchange' in window) {
    window.addEventListener('orientationchange', onOrientationChange);
  }
}

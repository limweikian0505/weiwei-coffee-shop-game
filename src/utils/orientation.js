/**
 * orientation.js
 * Unified handler for orientationchange + resize events.
 * Fires the game._resize() callback with a 300ms debounce after
 * orientationchange, and immediately on plain resize.
 */

export function setupOrientationHandler(canvas, game) {
  let _orientationTimer = null;

  const onResize = () => {
    game._resize();
  };

  const onOrientationChange = () => {
    // iOS fires orientationchange before the layout settles; wait 300 ms
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

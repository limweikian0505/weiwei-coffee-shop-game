/**
 * orientation.js
 * Handles screen orientation changes and shows a "please rotate" hint on phones.
 * The game is designed for PORTRAIT mode on phones but works in either orientation.
 */

/** Delay (ms) to wait after orientationchange before resizing — lets the browser finish rotating. */
const ORIENTATION_CHANGE_DELAY_MS = 300;

export function setupOrientationHandler(canvas, game) {
  // On phones, the game works best in portrait mode.
  // We just make sure to re-layout on orientation change.
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      game._resize();
    }, ORIENTATION_CHANGE_DELAY_MS);
  });

  // Also handle resize events (covers desktop window resize too)
  window.addEventListener('resize', () => {
    game._resize();
  });
}

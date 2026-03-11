/**
 * responsive.js
 * Utility helpers for responsive sizing based on canvas/screen dimensions.
 */

/**
 * Returns true if the device looks like a narrow-screen touch device (phone).
 * Uses both screen width AND touch support so that tablets / touchscreen laptops
 * with wider screens are not incorrectly treated as phones.
 */
export function isMobile() {
  return window.innerWidth < 768 && ('ontouchstart' in window);
}

/** Scale a base value by the ratio of current canvas width to a reference width (1280px). */
export function scale(baseValue, canvasW, referenceW = 1280) {
  return baseValue * (canvasW / referenceW);
}

/** Clamp a value between min and max. */
export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Get a font size that scales with canvas width, clamped between minPx and maxPx.
 * @param {number} fraction - fraction of canvas width (e.g. 0.03 = 3%)
 * @param {number} canvasW
 * @param {number} minPx
 * @param {number} maxPx
 */
export function scaledFontSize(fraction, canvasW, minPx, maxPx) {
  return clamp(Math.round(canvasW * fraction), minPx, maxPx);
}

/**
 * Get a touch-friendly hit radius (at least 44px, the iOS HIG minimum).
 * @param {number} visualRadius - the visual radius of the element
 * @param {number} canvasW
 */
export function touchHitRadius(visualRadius, canvasW) {
  return Math.max(44, visualRadius, canvasW * 0.05);
}

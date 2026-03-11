/**
 * responsive.js
 * Utility functions for responsive canvas sizing.
 */

export function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function scaledFontSize(base, canvasW, minSize = 10) {
  return Math.max(minSize, canvasW * base);
}

export function touchHitRadius(canvasW) {
  return Math.max(44, canvasW * 0.06);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function scale(value, canvasW, referenceW = 375) {
  return value * (canvasW / referenceW);
}

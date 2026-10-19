/**
 * Lazy loads and triggers celebratory canvas-confetti.
 * Isolated in a standalone module to prevent AST HIR compilation bailout in React compiler.
 */
export async function triggerConfetti() {
  try {
    const { default: confetti } = await import('canvas-confetti');
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
    });
  } catch {
    // Silently ignore if canvas-confetti fails or cannot be loaded
  }
}

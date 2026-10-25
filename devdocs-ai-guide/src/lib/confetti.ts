/**
 * Lazy loads and triggers celebratory canvas-confetti.
 * Isolated in a standalone module to prevent AST HIR compilation bailout in React compiler.
 * Complies with WCAG AAA accessibility by honoring prefers-reduced-motion.
 */
export async function triggerConfetti(): Promise<void> {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

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

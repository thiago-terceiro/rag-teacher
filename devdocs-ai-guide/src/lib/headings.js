/**
 * Single source of truth for heading slugs, shared by:
 *  - `rehypeHeadingIds` (assigns ids to rendered <h2>/<h3>)
 *  - `extractHeadings`  (builds the On-This-Page TOC from raw markdown)
 * Both must produce identical ids, so both derive from the same "plain text"
 * form of a heading (inline math keeps its TeX source, e.g. `\mathcal{R}`).
 */

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** De-duplicates slugs within one document, github-slugger style (`foo`, `foo-1`, ...). */
function createSlugger() {
  const seen = new Map();
  return (text) => {
    const base = slugify(text);
    if (!base) return '';
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

function hastText(node) {
  if (node.type === 'text') return node.value;
  return (node.children || []).map(hastText).join('');
}

/**
 * Rehype plugin: gives every h2/h3 a stable id. Must run BEFORE rehype-katex so
 * inline math is still a `code.math-inline` node holding the TeX source.
 */
export function rehypeHeadingIds() {
  return (tree) => {
    const slug = createSlugger();
    const visit = (node) => {
      if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
        const id = slug(hastText(node));
        if (id) node.properties = { ...node.properties, id };
        return;
      }
      if (node.children) node.children.forEach(visit);
    };
    visit(tree);
  };
}

/** Prettifies TeX for display only (`\mathcal{R}` -> `R`, `O(1)` stays). */
function prettifyTex(tex) {
  return tex
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .trim();
}

/**
 * Extracts h2/h3 headings from markdown (ignoring fenced code blocks).
 * Returns `{ level, id, text }` where `id` matches `rehypeHeadingIds` output.
 */
export function extractHeadings(markdown) {
  if (!markdown) return [];

  const stripped = markdown.replace(/```[\s\S]*?```/g, '');
  const slug = createSlugger();
  const headings = [];

  for (const match of stripped.matchAll(/^(#{2,3})\s+(.+?)\s*#*$/gm)) {
    const raw = match[2];
    const unformatted = raw
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Id source mirrors the hast text (math keeps TeX); display text is prettified.
    const idSource = unformatted.replace(/\$([^$]+)\$/g, '$1');
    const text = unformatted.replace(/\$([^$]+)\$/g, (_, tex) => prettifyTex(tex)).trim();

    const id = slug(idSource);
    if (id) headings.push({ level: match[1].length, id, text });
  }

  return headings;
}

/**
 * Smooth-scrolls the main scroll container to a heading with precise offset.
 * Crucially, scrolls ONLY #main-scroll-container directly instead of using
 * element.scrollIntoView(), preventing ancestor window/header scroll displacement
 * (which caused the sticky top navigation bar to disappear on mobile).
 */
export function scrollToHeading(id, { smooth = true } = {}) {
  const el = document.getElementById(id);
  if (!el) return false;

  const container = document.getElementById('main-scroll-container');
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (container) {
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // Position the target heading precisely 16px below the top of the visible container
    const targetScrollTop = container.scrollTop + (elRect.top - containerRect.top) - 16;

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: smooth && !reduceMotion ? 'smooth' : 'instant',
    });
  } else {
    el.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'instant', block: 'start' });
  }

  // Guard: ensure window viewport itself is never scrolled out of position
  if (window.scrollY !== 0) {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  window.history.replaceState(window.history.state, '', `#${id}`);
  return true;
}

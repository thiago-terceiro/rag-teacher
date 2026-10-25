import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CodeBlock from './CodeBlock';
import { rehypeHeadingIds, scrollToHeading } from '../lib/headings';

// Lazy load MermaidBlock to eliminate >2.2MB of Cytoscape/parser overhead from the critical path
const LazyMermaidBlock = React.lazy(() => import('./MermaidBlock'));

const remarkPlugins = [remarkGfm, remarkMath];
// rehypeHeadingIds must run before rehypeKatex so math headings slug from their TeX source.
const rehypePlugins = [rehypeHeadingIds, rehypeKatex];

export interface HeadingAnchorProps {
  id: string;
}

/** Hover-revealed `#` permalink that smooth-scrolls inside the main scroll container. */
const HeadingAnchor: React.FC<HeadingAnchorProps> = ({ id }) => (
  <a
    href={`#${id}`}
    aria-label={`Direct link to section: ${id.replace(/-/g, ' ')}`}
    className="ml-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground/70 hover:text-primary font-normal no-underline select-none"
    onClick={(e) => {
      e.preventDefault();
      scrollToHeading(id);
    }}
  >
    #
  </a>
);

// Module scope: static lifetime, zero per-render allocation.
const markdownComponents: Partial<Components> = {
  code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) {
    const match = /language-([\w-]+)/.exec(className || '');
    const lang = match ? match[1].toLowerCase() : '';
    const codeString = String(children || '').replace(/\n$/, '');

    // Check for mermaid diagram blocks
    if (lang === 'mermaid') {
      return (
        <React.Suspense
          fallback={
            <div className="my-6 p-8 border border-border/70 rounded-xl bg-card/60 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
              Loading architectural diagram...
            </div>
          }
        >
          <LazyMermaidBlock chart={codeString} />
        </React.Suspense>
      );
    }

    // Check if it's a multi-line code block or has language class
    const isBlock = match || codeString.includes('\n');

    if (isBlock) {
      return (
        <CodeBlock
          language={lang || 'text'}
          value={codeString}
        />
      );
    }

    return (
      <code
        className="px-1.5 py-0.5 mx-0.5 rounded text-[0.875em] font-mono bg-secondary/80 text-foreground border border-border/60 break-all [overflow-wrap:anywhere]"
        {...props}
      >
        {children}
      </code>
    );
  },
  table({ children, ...props }: React.ComponentPropsWithoutRef<'table'>) {
    return (
      <div className="my-6 w-full max-w-full overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm text-left border-collapse" {...props}>
          {children}
        </table>
      </div>
    );
  },
  thead({ children, ...props }: React.ComponentPropsWithoutRef<'thead'>) {
    return <thead className="bg-secondary/60 text-foreground font-semibold border-b border-border" {...props}>{children}</thead>;
  },
  tbody({ children, ...props }: React.ComponentPropsWithoutRef<'tbody'>) {
    return <tbody className="divide-y divide-border/60" {...props}>{children}</tbody>;
  },
  tr({ children, ...props }: React.ComponentPropsWithoutRef<'tr'>) {
    return <tr className="hover:bg-secondary/30 transition-colors" {...props}>{children}</tr>;
  },
  th({ children, ...props }: React.ComponentPropsWithoutRef<'th'>) {
    return <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground" {...props}>{children}</th>;
  },
  td({ children, ...props }: React.ComponentPropsWithoutRef<'td'>) {
    return <td className="px-4 py-3 text-sm leading-relaxed" {...props}>{children}</td>;
  },
  blockquote({ children, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) {
    return (
      <blockquote className="my-5 pl-4 py-1.5 border-l-4 border-primary bg-primary/5 rounded-r-lg italic text-muted-foreground break-words [overflow-wrap:break-word]" {...props}>
        {children}
      </blockquote>
    );
  },
  ul({ children, ...props }: React.ComponentPropsWithoutRef<'ul'>) {
    return <ul className="my-4 ml-6 list-disc space-y-1.5 leading-relaxed" {...props}>{children}</ul>;
  },
  ol({ children, ...props }: React.ComponentPropsWithoutRef<'ol'>) {
    return <ol className="my-4 ml-6 list-decimal space-y-1.5 leading-relaxed" {...props}>{children}</ol>;
  },
  li({ children, ...props }: React.ComponentPropsWithoutRef<'li'>) {
    return <li className="pl-1 leading-relaxed text-foreground/90 break-words [overflow-wrap:break-word]" {...props}>{children}</li>;
  },
  h2({ id, children, ...props }: React.ComponentPropsWithoutRef<'h2'>) {
    return (
      <h2 id={id} className="group text-2xl font-bold mt-10 mb-4 pb-2 border-b border-border/70 text-foreground tracking-[0.01em] break-words [overflow-wrap:break-word] scroll-mt-6" {...props}>
        {children}
        {id && <HeadingAnchor id={id} />}
      </h2>
    );
  },
  h3({ id, children, ...props }: React.ComponentPropsWithoutRef<'h3'>) {
    return (
      <h3 id={id} className="group text-xl font-semibold mt-7 mb-3 text-primary tracking-[0.01em] break-words [overflow-wrap:break-word] scroll-mt-6" {...props}>
        {children}
        {id && <HeadingAnchor id={id} />}
      </h3>
    );
  },
  h4({ children, ...props }: React.ComponentPropsWithoutRef<'h4'>) {
    return <h4 className="text-lg font-medium mt-5 mb-2 text-foreground/90 tracking-[0.01em] break-words [overflow-wrap:break-word]" {...props}>{children}</h4>;
  },
  p({ children, ...props }: React.ComponentPropsWithoutRef<'p'>) {
    return <p className="my-3.5 leading-relaxed text-foreground/90 text-[15px] tracking-[0.015em] break-words [overflow-wrap:break-word]" {...props}>{children}</p>;
  },
  strong({ children, ...props }: React.ComponentPropsWithoutRef<'strong'>) {
    return <strong className="font-semibold text-foreground tracking-[0.01em]" {...props}>{children}</strong>;
  },
  a({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'>) {
    const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors break-all [overflow-wrap:anywhere]"
        {...props}
      >
        {children}
        {isExternal && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  },
  img({ src, alt, ...props }: React.ComponentPropsWithoutRef<'img'>) {
    return (
      <img
        src={src}
        alt={alt || 'Document illustration'}
        className="max-w-full h-auto rounded-lg my-4 border border-border"
        loading="lazy"
        {...props}
      />
    );
  },
};

export interface MarkdownRendererProps {
  markdown: string;
}

const MarkdownRenderer = React.memo(({ markdown }: MarkdownRendererProps) => {
  return (
    <div className="markdown-content w-full max-w-full min-w-0">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={markdownComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}, (prev, next) => prev.markdown === next.markdown);

export default MarkdownRenderer;

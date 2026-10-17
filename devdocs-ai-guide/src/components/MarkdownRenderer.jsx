import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CodeBlock from './CodeBlock';
import MermaidBlock from './MermaidBlock';
import { rehypeHeadingIds, scrollToHeading } from '../lib/headings';

const remarkPlugins = [remarkGfm, remarkMath];
// rehypeHeadingIds must run before rehypeKatex so math headings slug from their TeX source.
const rehypePlugins = [rehypeHeadingIds, rehypeKatex];

/** Hover-revealed `#` permalink that smooth-scrolls inside the main scroll container. */
const HeadingAnchor = ({ id }) => (
  <a
    href={`#${id}`}
    aria-label="Link to this section"
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
const markdownComponents = {
  code({ node, className, children, ...props }) {
    const match = /language-([\w-]+)/.exec(className || '');
    const lang = match ? match[1].toLowerCase() : '';
    const codeString = String(children).replace(/\n$/, '');

    // Check for mermaid diagram blocks
    if (lang === 'mermaid') {
      return <MermaidBlock chart={codeString} />;
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
  table({ children }) {
    return (
      <div className="my-6 w-full max-w-full overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm text-left border-collapse">
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-secondary/60 text-foreground font-semibold border-b border-border">{children}</thead>;
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-border/60">{children}</tbody>;
  },
  tr({ children }) {
    return <tr className="hover:bg-secondary/30 transition-colors">{children}</tr>;
  },
  th({ children }) {
    return <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">{children}</th>;
  },
  td({ children }) {
    return <td className="px-4 py-3 text-sm leading-relaxed">{children}</td>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-5 pl-4 py-1.5 border-l-4 border-primary bg-primary/5 rounded-r-lg italic text-muted-foreground break-words [overflow-wrap:break-word]">
        {children}
      </blockquote>
    );
  },
  ul({ children }) {
    return <ul className="my-4 ml-6 list-disc space-y-1.5 leading-relaxed">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-4 ml-6 list-decimal space-y-1.5 leading-relaxed">{children}</ol>;
  },
  li({ children }) {
    return <li className="pl-1 leading-relaxed text-foreground/90 break-words [overflow-wrap:break-word]">{children}</li>;
  },
  h2({ id, children }) {
    return (
      <h2 id={id} className="group text-2xl font-bold mt-10 mb-4 pb-2 border-b border-border/70 text-foreground tracking-[0.01em] break-words [overflow-wrap:break-word] scroll-mt-6">
        {children}
        {id && <HeadingAnchor id={id} />}
      </h2>
    );
  },
  h3({ id, children }) {
    return (
      <h3 id={id} className="group text-xl font-semibold mt-7 mb-3 text-primary tracking-[0.01em] break-words [overflow-wrap:break-word] scroll-mt-6">
        {children}
        {id && <HeadingAnchor id={id} />}
      </h3>
    );
  },
  h4({ children }) {
    return <h4 className="text-lg font-medium mt-5 mb-2 text-foreground/90 tracking-[0.01em] break-words [overflow-wrap:break-word]">{children}</h4>;
  },
  p({ children }) {
    return <p className="my-3.5 leading-relaxed text-foreground/90 text-[15px] tracking-[0.015em] break-words [overflow-wrap:break-word]">{children}</p>;
  },
  strong({ children }) {
    return <strong className="font-semibold text-foreground tracking-[0.01em]">{children}</strong>;
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors break-all [overflow-wrap:anywhere]"
      >
        {children}
      </a>
    );
  },
};

const MarkdownRenderer = React.memo(({ markdown }) => {
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

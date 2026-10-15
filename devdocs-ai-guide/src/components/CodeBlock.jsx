import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';

// Register specific languages to prevent bundling 180+ unused Prism grammars
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);
SyntaxHighlighter.registerLanguage('css', css);

const CodeBlock = ({ language = 'text', value = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const cleanLang = (language || 'code').toLowerCase().trim();
  const displayLang = cleanLang.toUpperCase();

  return (
    <div className={`relative my-5 rounded-lg overflow-hidden border bg-[#1e1e1e] group transition-all duration-300 ${
      copied ? 'border-emerald-500/70 shadow-[0_0_22px_rgba(16,185,129,0.22)]' : 'border-border/80 shadow-md hover:border-primary/30'
    }`}>
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#181818] border-b border-border/50 text-xs text-muted-foreground select-none">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-primary/60 group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-200" />
          <span className="font-mono font-medium tracking-wider text-xs text-primary/90">{displayLang}</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="group/btn flex items-center space-x-1.5 px-2.5 py-1 rounded-md hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer text-xs active:scale-90"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-50 spin-in-90 duration-200" />
              <span className="text-emerald-400 font-semibold animate-in fade-in zoom-in-75 duration-150">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform duration-150" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto text-sm">
        <SyntaxHighlighter
          language={cleanLang || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
          wrapLines={true}
          PreTag="div"
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;

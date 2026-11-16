import { Check, Copy } from 'lucide-react';
import React, { useId, useState } from 'react';
import { useSandboxActions } from '../context/SandboxContext';
import { useTheme } from '../hooks/useReadingSettings';
import { cn } from '../lib/utils';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';

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

// WCAG AAA (>= 7.0:1) Light Theme Prism Style against #f8fafc
const aaaLightPrismStyle: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: '#0f172a',
    background: 'transparent',
    textShadow: 'none',
  },
  'pre[class*="language-"]': {
    color: '#0f172a',
    background: 'transparent',
    textShadow: 'none',
  },
  comment: { color: '#334155', fontStyle: 'italic' },
  prolog: { color: '#334155' },
  doctype: { color: '#334155' },
  cdata: { color: '#334155' },
  punctuation: { color: '#1e293b' },
  property: { color: '#7c2d12' },
  tag: { color: '#7c2d12' },
  boolean: { color: '#7c2d12' },
  number: { color: '#7c2d12' },
  constant: { color: '#7c2d12' },
  symbol: { color: '#7c2d12' },
  deleted: { color: '#881337' },
  selector: { color: '#065f46' },
  'attr-name': { color: '#065f46' },
  string: { color: '#065f46' },
  char: { color: '#065f46' },
  builtin: { color: '#065f46' },
  inserted: { color: '#065f46' },
  operator: { color: '#0f172a' },
  entity: { color: '#0f172a' },
  url: { color: '#1e3a8a', textDecoration: 'underline' },
  atrule: { color: '#1e3a8a' },
  'attr-value': { color: '#065f46' },
  keyword: { color: '#1e3a8a', fontWeight: 600 },
  function: { color: '#581c87', fontWeight: 600 },
  'class-name': { color: '#581c87', fontWeight: 600 },
  regex: { color: '#881337' },
  important: { color: '#881337', fontWeight: 700 },
  variable: { color: '#881337' },
};

// WCAG AAA (>= 7.0:1) Dark Theme Prism Style against #0d1322 and #000000
const aaaDarkPrismStyle: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: '#f8fafc',
    background: 'transparent',
    textShadow: 'none',
  },
  'pre[class*="language-"]': {
    color: '#f8fafc',
    background: 'transparent',
    textShadow: 'none',
  },
  comment: { color: '#a8b8cd', fontStyle: 'italic' },
  prolog: { color: '#a8b8cd' },
  doctype: { color: '#a8b8cd' },
  cdata: { color: '#a8b8cd' },
  punctuation: { color: '#e2e8f0' },
  property: { color: '#fdba74' },
  tag: { color: '#fdba74' },
  boolean: { color: '#fdba74' },
  number: { color: '#fdba74' },
  constant: { color: '#fdba74' },
  symbol: { color: '#fdba74' },
  deleted: { color: '#fda4af' },
  selector: { color: '#6ee7b7' },
  'attr-name': { color: '#6ee7b7' },
  string: { color: '#6ee7b7' },
  char: { color: '#6ee7b7' },
  builtin: { color: '#6ee7b7' },
  inserted: { color: '#6ee7b7' },
  operator: { color: '#f8fafc' },
  entity: { color: '#f8fafc' },
  url: { color: '#93c5fd', textDecoration: 'underline' },
  atrule: { color: '#93c5fd' },
  'attr-value': { color: '#6ee7b7' },
  keyword: { color: '#93c5fd', fontWeight: 600 },
  function: { color: '#d8b4fe', fontWeight: 600 },
  'class-name': { color: '#d8b4fe', fontWeight: 600 },
  regex: { color: '#fda4af' },
  important: { color: '#fda4af', fontWeight: 700 },
  variable: { color: '#fda4af' },
};

const SYNTAX_HIGHLIGHTER_STYLE: React.CSSProperties = {
  margin: 0,
  padding: '1rem',
  background: 'transparent',
  fontSize: '0.875rem',
  lineHeight: '1.6',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
};

export interface CodeBlockProps {
  language?: string;
  value?: string;
}

const CodeBlock = React.memo(({ language: languageProp, value: valueProp }: CodeBlockProps) => {
  const language = languageProp || 'text';
  const value = valueProp || '';
  const { openPythonSandbox } = useSandboxActions();
  const { theme, isLight } = useTheme();
  const [copied, setCopied] = useState<boolean>(false);
  const regionUid = useId().replace(/:/g, '');

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
  const isPython = cleanLang === 'python' || cleanLang === 'py';
  const isOled = theme === 'oled-midnight';

  const firstLine = (value.slice(0, 256).split('\n').find((l) => l.trim().length > 0) || '').trim().slice(0, 36);
  const regionAriaLabel = `${cleanLang || 'Code'} snippet (${regionUid})${firstLine ? `: ${firstLine}` : ''}`;

  const handleOpenInSandbox = () => {
    openPythonSandbox(value);
  };

  return (
    <div
      className={cn(
        'print-code-block relative my-5 rounded-xl overflow-hidden border group transition-colors duration-150 w-full max-w-full min-w-0',
        isLight
          ? 'bg-[#f8fafc] text-slate-900'
          : isOled
          ? 'bg-black text-slate-100'
          : 'bg-[#0d1322] text-slate-100',
        copied
          ? 'border-emerald-600 dark:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
          : 'border-border shadow-md hover:border-primary/40'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-3 sm:px-4 py-1.5 border-b text-xs select-none min-h-[44px]',
          isLight
            ? 'bg-slate-200/80 border-border text-slate-800'
            : isOled
            ? 'bg-[#0d0d0d] border-white/15 text-slate-200'
            : 'bg-[#151e33] border-white/15 text-slate-200'
        )}
      >
        <div className="flex items-center space-x-2">
          <span
            aria-hidden="true"
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-200',
              isLight ? 'bg-blue-800' : 'bg-blue-400'
            )}
          />
          <span
            className={cn(
              'font-mono font-bold tracking-wider text-xs',
              isLight ? 'text-blue-900' : 'text-blue-300'
            )}
          >
            {displayLang}
          </span>
        </div>
        <div className="no-print flex items-center space-x-1.5">
          {isPython && (
            <button
              type="button"
              onClick={handleOpenInSandbox}
              title="Open this Python snippet in the isolated Pyodide Web Worker Sandbox"
              aria-label="Sandbox — Open Python snippet in isolated Pyodide Web Worker"
              className={cn(
                'flex items-center space-x-1 px-3 min-h-[44px] min-w-[44px] rounded-lg border transition-colors duration-150 cursor-pointer text-xs font-semibold active:scale-95',
                isLight
                  ? 'bg-emerald-900/10 hover:bg-emerald-900/15 text-emerald-900 border-emerald-800/40'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
              )}
            >
              <span aria-hidden="true">▶</span>
              <span>Sandbox</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied! Code copied to clipboard' : 'Copy code to clipboard'}
            className={cn(
              'group/btn flex items-center space-x-1.5 px-3 min-h-[44px] min-w-[44px] rounded-lg border transition-colors duration-150 cursor-pointer text-xs font-semibold active:scale-95',
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-900 border-slate-400'
                : 'bg-white/5 hover:bg-white/15 text-slate-100 border-white/20'
            )}
          >
            {copied ? (
              <>
                <Check
                  className={cn('w-3.5 h-3.5', isLight ? 'text-emerald-900' : 'text-emerald-300')}
                  aria-hidden="true"
                />
                <span
                  className={cn('font-semibold', isLight ? 'text-emerald-900' : 'text-emerald-300')}
                  role="status"
                  aria-live="polite"
                >
                  Copied!
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform duration-150" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="text-sm">
        <SyntaxHighlighter
          tabIndex={0}
          role="region"
          aria-label={regionAriaLabel}
          language={cleanLang || 'text'}
          style={isLight ? aaaLightPrismStyle : aaaDarkPrismStyle}
          customStyle={SYNTAX_HIGHLIGHTER_STYLE}
          PreTag="div"
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}, (prev, next) => prev.value === next.value && prev.language === next.language);

export default CodeBlock;

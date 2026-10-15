import React, { useState, useEffect, useRef, useId } from 'react';
import mermaid from 'mermaid';
import { Code2, Eye, Copy, Check, AlertCircle } from 'lucide-react';
import CodeBlock from './CodeBlock';

// Global in-memory cache for rendered diagram SVGs
const mermaidSvgCache = new Map();

// Initialize mermaid once globally with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  themeVariables: {
    darkMode: true,
    background: '#111827',
    primaryColor: '#3b82f6',
    primaryTextColor: '#f3f4f6',
    primaryBorderColor: '#60a5fa',
    lineColor: '#60a5fa',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    edgeLabelBackground: '#1e293b',
    nodeBorder: '#3b82f6',
    clusterBkg: '#0f172a',
    clusterBorder: '#334155',
    titleColor: '#f8fafc',
  },
});

const MermaidBlock = React.memo(({ chart }) => {
  const cleanChart = (chart || '').trim();
  
  // Instant synchronous initialization if already in cache
  const [svgContent, setSvgContent] = useState(() => mermaidSvgCache.get(cleanChart) || '');
  const [hasError, setHasError] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);
  
  // Create a unique clean ID for mermaid rendering
  const reactId = useId().replace(/[:]/g, '_');
  const diagramId = `mermaid_svg_${reactId}`;

  useEffect(() => {
    if (!cleanChart) return;

    // If already in cache, skip rendering entirely
    if (mermaidSvgCache.has(cleanChart)) {
      setSvgContent(mermaidSvgCache.get(cleanChart));
      return;
    }

    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setHasError(false);
        const { svg } = await mermaid.render(diagramId, cleanChart);
        mermaidSvgCache.set(cleanChart, svg);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.warn('Mermaid rendering error:', err);
        if (isMounted) {
          setHasError(true);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
      const tempElement = document.getElementById(diagramId);
      if (tempElement) {
        tempElement.remove();
      }
    };
  }, [cleanChart, diagramId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanChart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  if (hasError) {
    return (
      <div className="my-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold mb-2">
          <AlertCircle className="w-4 h-4" />
          <span>Diagram syntax error — showing raw source</span>
        </div>
        <CodeBlock language="mermaid" value={cleanChart} />
      </div>
    );
  }

  return (
    <div className="my-6 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md overflow-hidden shadow-lg hover:border-primary/40 transition-all duration-300 group">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border/60 text-xs text-muted-foreground select-none">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span className="font-mono font-semibold tracking-wider text-xs text-primary">
            ARCHITECTURE DIAGRAM
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowSource(prev => !prev)}
            aria-label={showSource ? 'View rendered diagram' : 'View diagram source code'}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            {showSource ? (
              <>
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>Visual</span>
              </>
            ) : (
              <>
                <Code2 className="w-3.5 h-3.5" />
                <span>Source</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            aria-label="Copy mermaid source code"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body: Rendered SVG or Code */}
      {showSource ? (
        <div className="p-0">
          <CodeBlock language="mermaid" value={cleanChart} />
        </div>
      ) : (
        <div
          ref={containerRef}
          className="p-6 overflow-x-auto flex items-center justify-center min-h-[160px] bg-[#0c1017]/80 [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:transition-all"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
}, (prev, next) => (prev.chart || '').trim() === (next.chart || '').trim());

export default MermaidBlock;

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import mermaid from 'mermaid';
import {
  Code2,
  Eye,
  Copy,
  Check,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
} from 'lucide-react';
import CodeBlock from './CodeBlock';
import { useReadingSettings } from '../hooks/useReadingSettings';
import { cn } from '../lib/utils';

// Global in-memory cache for rendered diagram SVGs keyed by `${themeMode}:${cleanChart}`
const mermaidSvgCache = new Map();

function configureMermaidTheme(isLight) {
  mermaid.initialize({
    startOnLoad: false,
    theme: isLight ? 'default' : 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      nodeSpacing: 45,
      rankSpacing: 45,
    },
    themeVariables: isLight
      ? {
          darkMode: false,
          background: '#f8fafc',
          primaryColor: '#e0e7ff',
          primaryTextColor: '#0f172a',
          primaryBorderColor: '#2563eb',
          lineColor: '#2563eb',
          secondaryColor: '#f1f5f9',
          tertiaryColor: '#ffffff',
          edgeLabelBackground: '#f1f5f9',
          nodeBorder: '#2563eb',
          clusterBkg: '#f8fafc',
          clusterBorder: '#94a3b8',
          titleColor: '#0f172a',
        }
      : {
          darkMode: true,
          background: '#0d1322',
          primaryColor: '#1e293b',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#3b82f6',
          lineColor: '#60a5fa',
          secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a',
          edgeLabelBackground: '#0d1322',
          nodeBorder: '#3b82f6',
          clusterBkg: '#0d1322',
          clusterBorder: '#3b82f6',
          titleColor: '#60a5fa',
        },
  });
}

// Initialize mermaid with dark theme by default
configureMermaidTheme(false);

const MermaidBlock = React.memo(({ chart }) => {
  const { settings } = useReadingSettings();
  const isLightTheme = settings.theme === 'daylight-paper';
  const isOledMidnight = settings.theme === 'oled-midnight';
  const themeMode = isLightTheme ? 'light' : 'dark';
  const cleanChart = (chart || '').trim();
  const cacheKey = `${themeMode}:${cleanChart}`;

  // Instant synchronous initialization if already in cache
  const [svgContent, setSvgContent] = useState(() => mermaidSvgCache.get(cacheKey) || '');
  const [hasError, setHasError] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState('fit'); // 'fit' | 'actual'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const triggerBtnRef = useRef(null);
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Create a unique clean ID for mermaid rendering
  const reactId = useId().replace(/[:]/g, '_');
  const diagramId = `mermaid_svg_${reactId}_${themeMode}`;

  // Isolate SVG IDs for fullscreen modal to eliminate marker-end duplicate ID collision
  const modalSvgContent = React.useMemo(() => {
    if (!svgContent) return '';
    return svgContent
      .replace(/\bid="([^"]+)"/g, 'id="modal_$1"')
      .replace(/url\(#([^)]+)\)/g, 'url(#modal_$1)')
      .replace(/href="#([^"]+)"/g, 'href="#modal_$1"');
  }, [svgContent]);

  useEffect(() => {
    if (!cleanChart) return;

    // If already in cache, skip rendering entirely
    if (mermaidSvgCache.has(cacheKey)) {
      setSvgContent(mermaidSvgCache.get(cacheKey));
      return;
    }

    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setHasError(false);
        configureMermaidTheme(isLightTheme);
        const { svg } = await mermaid.render(diagramId, cleanChart);
        mermaidSvgCache.set(cacheKey, svg);
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
  }, [cleanChart, cacheKey, diagramId, isLightTheme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanChart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleZoomIn = () => setZoom(z => Math.min(2.5, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const handleZoomReset = () => {
    setZoom(1);
    setFitMode('fit');
  };

  // Fullscreen Accessibility: Focus Trap, Escape to Close & Focus Return
  useEffect(() => {
    if (!isFullscreen) return;

    // Auto-focus Close button inside modal
    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsFullscreen(false);
        triggerBtnRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll(
          'button:not([disabled]), [tabindex="0"]'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      triggerBtnRef.current?.focus();
    };
  }, [isFullscreen]);

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

  const renderedContent = (
    <div
      ref={containerRef}
      role="img"
      aria-label="Architecture diagram rendered from Mermaid specification"
      className={cn(
        'p-6 overflow-auto flex items-center justify-center min-h-[180px] transition-all',
        fitMode === 'fit'
          ? '[&_svg]:max-w-full [&_svg]:h-auto'
          : '[&_svg]:max-w-none [&_svg]:w-auto [&_svg]:h-auto',
        isOledMidnight
          ? 'bg-black'
          : isLightTheme
            ? 'bg-[#f8fafc]'
            : 'bg-[#0c1017]/80'
      )}
    >
      <div className="sr-only">
        Interactive architecture diagram rendered from Mermaid code. Use the zoom controls or switch to the Source tab to read the specification.
      </div>
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
          minWidth: fitMode === 'actual' ? 'fit-content' : undefined,
        }}
        className="flex items-center justify-center w-full"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );

  return (
    <>
      <div className="print-diagram-block my-6 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md overflow-hidden shadow-lg hover:border-primary/40 transition-all duration-300 group w-full max-w-full min-w-0">
        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 bg-secondary/50 border-b border-border/60 text-xs text-muted-foreground gap-2 select-none">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <span className="font-mono font-semibold tracking-wider text-xs text-primary">
              ARCHITECTURE DIAGRAM
            </span>
          </div>

          <div className="no-print flex items-center space-x-1 sm:space-x-1.5 flex-wrap">
            {/* Zoom Controls */}
            {!showSource && (
              <div className="flex items-center bg-background/60 rounded-md border border-border/60 p-0.5 mr-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  aria-label="Zoom out diagram"
                  title="Zoom out"
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  aria-label={`Reset zoom (currently ${Math.round(zoom * 100)}%)`}
                  title="Reset zoom"
                  className="px-1.5 py-0.5 text-[10px] font-mono font-medium hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  aria-label="Zoom in diagram"
                  title="Zoom in"
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Fit vs Actual Size Toggle */}
            {!showSource && (
              <button
                type="button"
                onClick={() => setFitMode(m => m === 'fit' ? 'actual' : 'fit')}
                aria-label={fitMode === 'fit' ? 'View diagram at 100% natural resolution' : 'Fit diagram to container width'}
                title={fitMode === 'fit' ? 'Actual size' : 'Fit to width'}
                className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                {fitMode === 'fit' ? (
                  <>
                    <Expand className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>100%</span>
                  </>
                ) : (
                  <>
                    <Shrink className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span>Fit</span>
                  </>
                )}
              </button>
            )}

            {/* Fullscreen Expand */}
            {!showSource && (
              <button
                ref={triggerBtnRef}
                type="button"
                onClick={() => setIsFullscreen(true)}
                aria-label="Open diagram in full screen modal"
                title="Fullscreen view"
                className="p-1.5 rounded-md text-xs font-medium hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}

            {/* Source Toggle */}
            <button
              type="button"
              onClick={() => setShowSource(prev => !prev)}
              aria-label={showSource ? 'View rendered diagram' : 'View diagram source code'}
              className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              {showSource ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  <span>Visual</span>
                </>
              ) : (
                <>
                  <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Source</span>
                </>
              )}
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? 'Mermaid source code copied to clipboard' : 'Copy mermaid source code'}
              className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-400 font-semibold" role="status" aria-live="polite">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        {showSource ? (
          <div className="p-0">
            <CodeBlock language="mermaid" value={cleanChart} />
          </div>
        ) : (
          renderedContent
        )}
      </div>

      {/* Fullscreen High-Resolution Modal */}
      {isFullscreen && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen Architecture Diagram"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/80 text-foreground">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="font-bold text-sm tracking-wide">Architecture Diagram — Full View</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-card rounded-lg border border-border p-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  aria-label="Zoom out"
                  className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  aria-label="Reset zoom to 100%"
                  className="px-2 py-0.5 text-xs font-mono font-semibold hover:bg-secondary text-primary"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  aria-label="Zoom in"
                  className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => {
                  setIsFullscreen(false);
                  triggerBtnRef.current?.focus();
                }}
                aria-label="Exit fullscreen view"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold cursor-pointer border border-border/70"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Close (Esc)</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center">
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="max-w-none flex items-center justify-center [&_svg]:max-w-none [&_svg]:w-auto [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: modalSvgContent }}
            />
          </div>
        </div>
      )}
    </>
  );
}, (prev, next) => (prev.chart || '').trim() === (next.chart || '').trim());

export default MermaidBlock;

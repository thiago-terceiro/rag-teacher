export const phase4Steps = [
  {
    step_key: "react-frontend-setup",
    title: "React Frontend: Project Setup",
    phase_key: "dashboard-polish",
    sort_order: 24,
    readTime: "9 min",
    content: `## Objective
Set up the modern, accessible **React 19 + Vite + Tailwind CSS** frontend architecture, establish consistent theme tokens, configure the router, and implement robust component modularity.

## Frontend Technology Stack
- **React 19**: Concurrent rendering, React Server Components compatibility, optimized hook transitions.
- **Vite 8**: Sub-second Hot Module Replacement (HMR) and optimized Rolldown production bundling.
- **Tailwind CSS**: Utility-first CSS with CSS variables for dark/light themes.
- **Lucide Icons**: Tree-shakable SVG icon system.
- **Radix UI**: Unstyled, accessible primitives (Collapsible, Dialog, Tooltip, ScrollArea).

## Directory Organization
\`\`\`
src/
├── components/
│   ├── ui/               # Reusable primitives (Button, Card, Badge)
│   ├── chat/             # Chat window, message bubbles, citation pills
│   ├── dashboard/        # Metrics charts, ablation viewer, query logs
│   ├── Sidebar.jsx       # Responsive navigation with search
│   ├── StepView.jsx      # Module content reader & note taker
│   └── MarkdownRenderer.jsx # Code blocks & markdown parser
├── hooks/
│   ├── useSteps.jsx      # Local-first progress state & note store
│   └── useDebounce.js    # Debounce auto-save handler
└── data/                 # Masterclass curriculum content
\`\`\`

## Verification Checkpoint
- [ ] Confirm Vite development server starts with zero console warnings.
- [ ] Verify that dark theme variables render cleanly across all viewport sizes.
`
  },
  {
    step_key: "react-frontend-chat-ui",
    title: "React Frontend: Search & Chat UI",
    phase_key: "dashboard-polish",
    sort_order: 25,
    readTime: "12 min",
    content: `## Objective
Build a developer-centric **Search and Chat Interface** featuring token streaming with autoscroll, interactive syntax-highlighted code snippets with one-click copying, and expandable citation cards showing the exact documentation excerpts.

## User Interface Blueprint
\`\`\`
┌────────────────────────────────────────────────────────────────────────┐
│  DevDocs AI — Interactive Search & Assistant                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  User: How do I remove duplicate items from an array in modern JS?     │
│                                                                        │
│  DevDocs AI:                                                           │
│  To remove duplicate elements from an array in modern JavaScript, the  │
│  fastest and idiomatic method is using a \`Set\` combined with spread:   │
│                                                                        │
│  ┌─ javascript ────────────────────────────────────────── [ Copy ] ─┐  │
│  │  const numbers = [1, 2, 2, 3, 4, 4, 5];                          │  │
│  │  const uniqueNumbers = [...new Set(numbers)];                    │  │
│  │  console.log(uniqueNumbers); // [1, 2, 3, 4, 5]                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Sources Cited:                                                        │
│  [🔖 Set.prototype.has()] [🔖 Array.from()] [🔖 Spread syntax (...)]   │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [ Ask any documentation or API question...                  ] [ Send ]│
└────────────────────────────────────────────────────────────────────────┘
\`\`\`

## Key UI Components
1. **Streaming Markdown Parser**: Handles partially streamed Markdown tokens without crashing the DOM tree.
2. **Citation Accordion**: Clicking any citation card reveals the exact text chunk and similarity score retrieved from Qdrant.
3. **Copy-to-Clipboard**: Copy buttons on all code fences with animated checkmark feedback.

## Verification Checkpoint
- [ ] Test typing and submitting queries; verify streaming tokens render without UI jitter.
- [ ] Click citation pills to verify deep-link navigation to MDN Web Docs.
`
  },
  {
    step_key: "evaluation-dashboard",
    title: "Evaluation Dashboard",
    phase_key: "dashboard-polish",
    sort_order: 26,
    readTime: "11 min",
    content: `## Objective
Construct an interactive **Evaluation and Observability Dashboard** that visualizes Ragas metrics, retrieval ablation benchmarks, query latency percentiles (p50, p95, p99), and live query telemetry.

## Dashboard Metrics Overview
\`\`\`mermaid
flowchart TD
    subgraph Dashboard["Observability & Evaluation Dashboard"]
        KPI1["Retrieval Hit Rate@5: 94.2% (+22.8%)"]
        KPI2["Mean Reciprocal Rank (MRR): 0.867"]
        KPI3["Ragas Faithfulness: 95.8%"]
        KPI4["Median Latency (p50): 340ms"]
    end
\`\`\`

## Interactive Components to Include
1. **Chunking Ablation Bar Chart**: Visual comparison of Fixed vs Semantic vs Hierarchical chunking.
2. **Latency Distribution Histogram**: Dense search time vs Cross-Encoder re-rank time vs LLM token generation.
3. **Query Inspection Table**: Live view of past queries, user ratings (thumbs up/down), and retrieved chunks.

## Verification Checkpoint
- [ ] Render the dashboard view and verify responsive chart scaling.
- [ ] Validate metric calculations against the empirical test results from Phase 2.
`
  },
  {
    step_key: "user-study",
    title: "User Study Design & Execution",
    phase_key: "dashboard-polish",
    sort_order: 27,
    readTime: "10 min",
    content: `## Objective
Design and execute a structured **Human User Study** with real developers to validate your RAG assistant's qualitative helpfulness, task completion speed, and comparative superiority over standard documentation browsing.

## Experimental Protocol
1. **Participant Group**: 12 software developers (mix of junior, mid, and senior engineers).
2. **Tasks Assigned**:
   - Task 1 (Debugging): Identify why an \`async/await\` loop in \`Array.forEach\` is non-blocking and refactor to \`for...of\` or \`Promise.all\`.
   - Task 2 (API Lookup): Find browser compatibility for CSS \`:has()\` selector across Safari and Firefox.
   - Task 3 (Algorithmic): Implement grouped objects using modern \`Object.groupBy\`.
3. **Evaluation Conditions**:
   - Condition A (Control): Standard Google Search / MDN website browsing.
   - Condition B (DevDocs AI): Interactive Agentic RAG Assistant.

## Quantitative & Qualitative Findings
- **Task Completion Time**: Reduced by **54%** (Average time dropped from 4m 12s to 1m 55s).
- **Likert Score (1-5)**: Overall helpfulness rated **4.7 / 5.0**.
- **Developer Feedback**: *"Having direct citations with exact code snippets eliminated the typical tab overload when searching MDN."*

## Verification Checkpoint
- [ ] Synthesize user feedback findings into the project summary.
- [ ] Document qualitative user feedback quotes and metrics in your portfolio report.
`
  },
  {
    step_key: "readme-architecture",
    title: "README & Architecture Diagram",
    phase_key: "dashboard-polish",
    sort_order: 28,
    readTime: "11 min",
    content: `## Objective
Synthesize your entire production RAG system into a compelling, professional GitHub repository with a **C4 System Architecture Diagram**, reproducible Docker Compose scripts, benchmark reports, and portfolio-ready documentation.

## Complete Production Architecture (C4 Model)

\`\`\`mermaid
flowchart TD
    Client["Web Client (React 19 + Tailwind SPA)"]
    API["API Gateway (FastAPI + SSE Streaming)"]
    Agent["LangGraph Autonomous Agent"]
    
    subgraph DataPipeline["Data Ingestion Pipeline"]
        Scraper["Async Scraper (httpx + BeautifulSoup)"]
        Chunker["Hierarchical & Semantic Chunkers"]
        Embedder["Sentence-Transformers (BAAI/bge-m3)"]
    end

    subgraph StorageLayer["Production Storage Layer"]
        Qdrant[("Qdrant Vector DB (HNSW Index)")]
        Postgres[("PostgreSQL (Telemetry & SQL DB)")]
    end

    subgraph EvaluationLayer["Evaluation Harness"]
        Ragas["RAGAS Assessment (Faithfulness, Precision)"]
        DSPy["DSPy Teleprompter Optimizer"]
    end

    Client <-->|SSE Stream & REST| API
    API <--> Agent
    Agent <-->|Dense Search| Qdrant
    Agent <-->|Structured SQL & Logs| Postgres
    DataPipeline --> Qdrant
    EvaluationLayer --> Agent
\`\`\`

## Portfolio Presentation Guide
When presenting DevDocs AI in technical interviews or to engineering leadership, highlight:
1. **The Retrieval Ablation Story**: Don't just say "I built RAG"—explain how Hierarchical chunking boosted Hit Rate from 71% to 94%.
2. **Latency vs Accuracy Tradeoffs**: Explain the two-stage Bi-Encoder -> Cross-Encoder architecture and why cross-encoders are reserved for top-25 reranking.
3. **Agentic Self-Correction**: Explain how LangGraph catches irrelevant retrievals and asks clarifying questions instead of hallucinating.
4. **DSPy Prompt Optimization**: Contrast fragile manual prompt strings with systematically compiled DSPy modules.

## Verification Checkpoint
- [ ] Review the complete 28-step curriculum.
- [ ] Test end-to-end functionality of your web platform!
`
  }
];

export interface ServerStep {
  step_key: string;
  title: string;
  sort_order: number;
  content: string;
}

export interface ServerPhase {
  phase_key: string;
  title: string;
  description: string;
  sort_order: number;
  steps: ServerStep[];
}

export type ServerGuideContent = Record<string, ServerPhase>;

export const guideContent: ServerGuideContent = {
  "phase-1": {
    "phase_key": "foundation",
    "title": "Phase 1: Foundation & Data Pipeline",
    "description": "Build the core of your RAG system. Scrape data, experiment with chunking, and set up your vector store for basic retrieval.",
    "sort_order": 1,
    "steps": [
      { "step_key": "project-setup", "title": "Project Setup & Python Environment", "sort_order": 1, "content": "..." },
      { "step_key": "corpus-understanding", "title": "Understanding the Corpus: MDN Web Docs", "sort_order": 2, "content": "..." },
      { "step_key": "scraper-building", "title": "Building the Web Scraper", "sort_order": 3, "content": "..." },
      { "step_key": "chunking-fixed-size", "title": "Chunking Strategy 1: Fixed-Size", "sort_order": 4, "content": "..." },
      { "step_key": "chunking-semantic", "title": "Chunking Strategy 2: Semantic", "sort_order": 5, "content": "..." },
      { "step_key": "chunking-hierarchical", "title": "Chunking Strategy 3: Hierarchical", "sort_order": 6, "content": "..." },
      { "step_key": "embedding-sentence-transformers", "title": "Embedding with Sentence-Transformers", "sort_order": 7, "content": "..." },
      { "step_key": "qdrant-setup", "title": "Setting Up Qdrant Vector Store", "sort_order": 8, "content": "..." },
      { "step_key": "dense-retrieval", "title": "Basic Dense Retrieval", "sort_order": 9, "content": "..." }
    ]
  },
  "phase-2": {
    "phase_key": "retrieval-quality",
    "title": "Phase 2: Retrieval Quality & Evaluation",
    "description": "Improve retrieval accuracy with re-ranking, establish a robust evaluation framework, and use data to drive decisions.",
    "sort_order": 2,
    "steps": [
      { "step_key": "cross-encoder-reranking", "title": "Cross-Encoder Re-Ranking", "sort_order": 10, "content": "..." },
      { "step_key": "postgres-logging", "title": "PostgreSQL Logging Layer", "sort_order": 11, "content": "..." },
      { "step_key": "sql-changelog-db", "title": "SQL Changelog/Known Issues DB", "sort_order": 12, "content": "..." },
      { "step_key": "golden-eval-set", "title": "Creating a Golden Eval Set", "sort_order": 13, "content": "..." },
      { "step_key": "ragas-evaluation", "title": "Evaluation Harness with RAGAS", "sort_order": 14, "content": "..." },
      { "step_key": "ir-metrics", "title": "IR Metrics: NDCG, MRR, Recall@K", "sort_order": 15, "content": "..." },
      { "step_key": "chunking-ablation-study", "title": "Chunking Strategy Ablation Study", "sort_order": 16, "content": "..." }
    ]
  },
  "phase-3": {
    "phase_key": "agent-optimization",
    "title": "Phase 3: Agent & Prompt Optimization",
    "description": "Transform your RAG pipeline into an autonomous agent and use advanced techniques to optimize its reasoning and language.",
    "sort_order": 3,
    "steps": [
      { "step_key": "fastapi-backend", "title": "FastAPI Backend Setup", "sort_order": 17, "content": "..." },
      { "step_key": "langgraph-agent-architecture", "title": "LangGraph Agent: Architecture", "sort_order": 18, "content": "..." },
      { "step_key": "agent-tool-doc-search", "title": "Agent Tool: Doc Search", "sort_order": 19, "content": "..." },
      { "step_key": "agent-tool-sql-query", "title": "Agent Tool: SQL Query", "sort_order": 20, "content": "..." },
      { "step_key": "agent-tool-clarifying-questions", "title": "Agent Tool: Clarifying Questions", "sort_order": 21, "content": "..." },
      { "step_key": "dspy-setup", "title": "DSPy Setup & Prompt Optimization", "sort_order": 22, "content": "..." },
      { "step_key": "dspy-metrics", "title": "DSPy: Before/After Metrics", "sort_order": 23, "content": "..." }
    ]
  },
  "phase-4": {
    "phase_key": "dashboard-polish",
    "title": "Phase 4: Dashboard, Frontend & Polish",
    "description": "Build a user-facing interface, create a compelling evaluation dashboard, and document your work for maximum impact.",
    "sort_order": 4,
    "steps": [
      { "step_key": "react-frontend-setup", "title": "React Frontend: Project Setup", "sort_order": 24, "content": "..." },
      { "step_key": "react-frontend-chat-ui", "title": "React Frontend: Search & Chat UI", "sort_order": 25, "content": "..." },
      { "step_key": "evaluation-dashboard", "title": "Evaluation Dashboard", "sort_order": 26, "content": "..." },
      { "step_key": "user-study", "title": "User Study Design & Execution", "sort_order": 27, "content": "..." },
      { "step_key": "readme-architecture", "title": "README & Architecture Diagram", "sort_order": 28, "content": "..." }
    ]
  }
};

// Add full content for the first step
guideContent['phase-1'].steps[0].content = `
## Goal
Set up a clean, modern Python project structure and environment for the **DevDocs AI** project itself (not this guide app).

## Concepts
- **Virtual Environments**: Isolating project dependencies to avoid conflicts. We'll use \`uv\`, a new, extremely fast Python package installer and resolver, written in Rust, which can be a drop-in replacement for \`pip\` and \`venv\`.
- **Project Structure**: Organizing files logically for scalability.
- **pyproject.toml**: The modern standard for Python project configuration, managing dependencies, and tool settings.

## Step-by-step instructions
1.  **Create a new workspace for your DevDocs AI project.** This should be a separate folder from this guide app.
    \`\`\`bash
    mkdir devdocs-ai-project
    cd devdocs-ai-project
    \`\`\`
2.  **Install \`uv\`**. If you don't have it, it's a single command:
    \`\`\`bash
    # macOS / Linux
    curl -LsSf https://astral.sh/uv/install.sh | sh

    # Windows
    powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    \`\`\`
3.  **Create a virtual environment.**
    \`\`\`bash
    uv venv
    \`\`\`
    This creates a \`.venv\` folder. Your VSCode should automatically detect and ask if you want to use it. Say yes.
4.  **Activate the environment.**
    \`\`\`bash
    # macOS / Linux
    source .venv/bin/activate

    # Windows
    .venv\\Scripts\\activate
    \`\`\`
5.  **Create your \`pyproject.toml\` file.**
    \`\`\`toml
    [project]
    name = "devdocs_ai"
    version = "0.1.0"
    description = "An intelligent technical documentation assistant."
    requires-python = ">=3.10"
    dependencies = []

    [tool.uv.sources]
    devdocs_ai = { path = "src/devdocs_ai" }
    \`\`\`
6.  **Create the basic directory structure.**
    \`\`\`bash
    mkdir -p src/devdocs_ai data notebooks
    touch src/devdocs_ai/__init__.py
    touch notebooks/01-scraping.ipynb
    \`\`\`

## Expected output
Your project folder should look like this:
\`\`\`
devdocs-ai-project/
├── .venv/
├── src/
│   └── devdocs_ai/
│       └── __init__.py
├── data/
├── notebooks/
│   └── 01-scraping.ipynb
└── pyproject.toml
\`\`\`
When you run \`uv pip list\`, you should see a minimal set of packages.

## Checkpoint
- Can you activate and deactivate your virtual environment?
- Does your VSCode Python interpreter point to the one in \`.venv\`?
`;

export const phase1Steps = [
  {
    step_key: "project-setup",
    title: "Project Setup & Python Environment",
    phase_key: "foundation",
    sort_order: 1,
    readTime: "8 min",
    content: `## Objective
Set up a blazingly fast, modern Python 3.11+ workspace for the **DevDocs AI** production RAG system using \`uv\` (the ultra-fast Rust-based package installer and resolver), configure a standard \`pyproject.toml\`, and initialize an isolated, reproducible development environment.

## Why Modern Environment Isolation Matters in RAG
Building high-performance RAG pipelines introduces heavy native dependencies:
- **PyTorch & ONNX Runtime**: Matrix operations, tensor computation on GPU/CPU.
- **Tokenizers & Rust extensions**: Sub-millisecond BPE / WordPiece tokenization (\`tiktoken\`, \`tokenizers\`).
- **Vector search clients**: gRPC and REST protocol bindings (\`qdrant-client\`).
- **Scientific computing**: NumPy, SciPy, scikit-learn.

Traditional \`pip\` and \`requirements.txt\` frequently suffer from dependency resolution conflicts, lack deterministic lockfiles, and take minutes to build wheels. Using \`uv\` provides 10-100x faster dependency resolution and strict lockfile reproducibility.

\`\`\`
devdocs-ai-project/
├── .python-version          # Pinned Python version (3.11.x)
├── pyproject.toml           # Core project dependencies & metadata
├── uv.lock                  # Deterministic dependency lockfile
├── .env.example             # Template for API keys & endpoints
├── src/
│   └── devdocs_ai/
│       ├── __init__.py
│       ├── config.py        # Centralized Pydantic Settings
│       ├── ingestion/       # Scraper, cleaner, chunkers
│       ├── embeddings/      # Bi-encoder & reranker wrappers
│       ├── vectorstore/     # Qdrant client & collection management
│       ├── retrieval/       # Dense, hybrid, and reranked search
│       └── evaluation/      # Ragas harness & IR metrics
├── data/
│   ├── raw/                 # Scraped raw HTML/Markdown files
│   ├── processed/           # Chunks with metadata schemas
│   └── goldens/             # Ground-truth evaluation triplets
└── tests/
\`\`\`

## Step-by-Step Implementation

### 1. Install \`uv\`
\`\`\`bash
# Linux / macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
\`\`\`

### 2. Initialize the Project Structure
\`\`\`bash
mkdir devdocs-ai-project
cd devdocs-ai-project
uv init --lib --name devdocs_ai
\`\`\`

### 3. Configure \`pyproject.toml\`
Open \`pyproject.toml\` and add the production dependencies:

\`\`\`toml
[project]
name = "devdocs_ai"
version = "0.1.0"
description = "Production-grade RAG and Agentic documentation assistant for web developers."
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    "pydantic>=2.7.0",
    "pydantic-settings>=2.2.0",
    "httpx>=0.27.0",
    "beautifulsoup4>=4.12.3",
    "markdownify>=0.12.1",
    "tiktoken>=0.7.0",
    "sentence-transformers>=3.0.0",
    "qdrant-client>=1.9.0",
    "torch>=2.2.0",
    "loguru>=0.7.2",
    "rich>=13.7.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.2.0",
    "pytest-asyncio>=0.23.0",
    "ruff>=0.4.0",
    "mypy>=1.10.0",
]
eval = [
    "ragas>=0.1.9",
    "datasets>=2.19.0",
]

[tool.ruff]
line-length = 100
target-version = "py311"
\`\`\`

### 4. Create and Sync the Virtual Environment
\`\`\`bash
# Create venv and install all core dependencies
uv venv --python 3.11
uv pip sync pyproject.toml
\`\`\`

### 5. Create Centralized Configuration (\`src/devdocs_ai/config.py\`)
\`\`\`python
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "DevDocs AI"
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"

    # Vector DB
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "mdn_web_docs"

    # Embedding Model
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-m3"
    EMBEDDING_DIMENSION: int = 1024
    MAX_SEQ_LENGTH: int = 8192

    # Reranker Model
    RERANKER_MODEL_NAME: str = "BAAI/bge-reranker-large"

settings = Settings()
\`\`\`

## Verification Checkpoint
- [ ] Run \`uv run python -c "import torch, sentence_transformers, qdrant_client; print('Environment initialized successfully!')"\`.
- [ ] Verify directory structure with \`src/devdocs_ai/config.py\` and \`data/\` folders.
- [ ] Pinned Python interpreter recognized in your IDE.
`
  },
  {
    step_key: "corpus-understanding",
    title: "Understanding the Corpus: MDN Web Docs",
    phase_key: "foundation",
    sort_order: 2,
    readTime: "9 min",
    content: `## Objective
Analyze the target corpus—Mozilla Developer Network (MDN) Web Docs—to understand its hierarchical structure, semantic density, code syntax blocks, browser compatibility tables, and noise patterns before building the ingestion pipeline.

## Corpus Taxonomy & Document Anatomy
Technical documentation differs fundamentally from narrative prose or blog posts:
1. **Hierarchical Headings (\`h1\` to \`h4\`)**: Strict parent-child taxonomy. A snippet under \`Array.prototype.slice() > Parameters > start\` loses its meaning if severed from the parent title.
2. **Code Samples (\`<pre><code>\`)**: Executable syntax examples, return values, and interactive playgrounds.
3. **Specifications & Browser Compatibility Tables**: Structured tabular matrices showing which browser engine supports which property version.
4. **Boilerplate Noise**: Breadcrumb navigation, header menus, search bars, footer copyright notices, related articles sidebars.

\`\`\`mermaid
graph TD
    Page["MDN Article: Array.prototype.reduce()"]
    Page --> Breadcrumbs["Breadcrumbs & Nav (NOISE: Discard)"]
    Page --> Main["<main id='content'> (SIGNAL)"]
    Page --> Related["Related Topics Sidebar (NOISE: Discard)"]
    Main --> Title["H1: Array.prototype.reduce()"]
    Main --> Baseline["Baseline Support Status (Metadata)"]
    Main --> Summary["Short Description / Summary"]
    Main --> Syntax["H2: Syntax & Signatures"]
    Main --> Params["H2: Parameters & Return Value"]
    Main --> Examples["H2: Code Examples (Single-line & Multi-line)"]
    Main --> Compat["H2: Browser Compatibility Matrix"]
\`\`\`

## Key Analysis Metrics for MDN Docs
| Property | Typical Value | Implication for RAG |
| :--- | :--- | :--- |
| **Page Length** | 500 – 4,500 words | Single document exceeds typical 512-token embedding window |
| **Code Density** | 20% – 45% of content | Tokenizers tokenize code at higher token-per-character ratios |
| **Heading Depth** | Depth 2 to 4 | Ideal boundaries for semantic and hierarchical chunking |
| **Cross-references** | High (50+ links/page) | Anchor tags provide vital canonical URLs for citation tracking |

## Data Extraction Schema
Define a strict Pydantic model for every ingested document:

\`\`\`python
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from datetime import datetime

class DocumentMetadata(BaseModel):
    source_url: str
    title: str
    category: str  # e.g., "JavaScript/Reference/Global_Objects"
    section_hierarchy: List[str]  # e.g., ["JavaScript", "Standard built-in objects", "Array", "reduce()"]
    last_modified: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)

class RawDocument(BaseModel):
    id: str  # Hash of canonical source_url
    metadata: DocumentMetadata
    raw_markdown: str
    clean_text: str
    code_snippets: List[str]
\`\`\`

## Verification Checkpoint
- [ ] Understand why boilerplate stripping (nav/footer/sidebar) is crucial to avoid polluting vector search embeddings.
- [ ] Verify that your metadata schema preserves the full breadcrumb path (\`section_hierarchy\`) for retrieval context injection.
`
  },
  {
    step_key: "scraper-building",
    title: "Building the Web Scraper",
    phase_key: "foundation",
    sort_order: 3,
    readTime: "12 min",
    content: `## Objective
Construct an asynchronous, polite web scraper using \`httpx\`, \`BeautifulSoup4\`, and \`markdownify\` that extracts clean MDN Web Docs articles, removes all DOM boilerplate, converts HTML to clean Markdown, and deduplicates pages using content hashing.

## Architecture of a Production Documentation Scraper
A production scraper must satisfy three non-negotiable criteria:
1. **Politeness & Rate Limiting**: Token-bucket rate limiter with automatic exponential backoff on HTTP 429/503.
2. **Deterministic Boilerplate Removal**: Extracting only the semantic article element (\`article.main-page-content\`), stripping interactive buttons and script tags.
3. **Markdown Transformation**: Converting semantic HTML into clean, LLM-friendly Markdown while preserving code language fences (\`\`\`javascript).

\`\`\`mermaid
sequenceDiagram
    participant Scraper as Async Scraper (httpx)
    participant RateLimiter as Token Bucket Rate Limiter
    participant DOM as BeautifulSoup / DOM Cleaner
    participant MD as Markdown Converter
    participant Storage as Local JSONL Store

    Scraper->>RateLimiter: Request token (Max 5 req/sec)
    RateLimiter-->>Scraper: Token acquired
    Scraper->>MDN: GET /en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
    MDN-->>Scraper: 200 OK (HTML)
    Scraper->>DOM: Parse DOM & remove nav, footer, ads, breadcrumbs
    DOM->>MD: Convert clean article element to Markdown
    MD-->>Storage: Save raw document & metadata hash to disk
\`\`\`

## Complete Implementation (\`src/devdocs_ai/ingestion/scraper.py\`)

\`\`\`python
import asyncio
import hashlib
import json
from pathlib import Path
from typing import List, Optional
import httpx
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from loguru import logger
from devdocs_ai.config import settings

class MDNScraper:
    BASE_URL = "https://developer.mozilla.org"
    START_PATHS = [
        "/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
        "/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",
        "/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object",
        "/en-US/docs/Web/JavaScript/Reference/Functions",
        "/en-US/docs/Web/JavaScript/Reference/Statements/async_function",
    ]

    def __init__(self, concurrency: int = 3, delay: float = 0.5):
        self.semaphore = asyncio.Semaphore(concurrency)
        self.delay = delay
        self.output_dir = settings.DATA_DIR / "raw"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.visited = set()

    def clean_html(self, html_content: str) -> tuple[str, str, List[str]]:
        soup = BeautifulSoup(html_content, "html.parser")

        # 1. Extract Title
        title_el = soup.find("h1")
        title = title_el.get_text(strip=True) if title_el else "Unknown Title"

        # 2. Extract Main Article Body
        article = soup.find("article", class_="main-page-content")
        if not article:
            article = soup.find("main") or soup.find("body")

        # 3. Strip unwanted elements
        for unwanted in article.find_all(["nav", "footer", "button", "script", "style", "aside", "svg"]):
            unwanted.decompose()

        # 4. Extract code snippets before conversion
        code_snippets = [
            code.get_text() for code in article.find_all("pre")
        ]

        # 5. Convert clean DOM to Markdown
        clean_markdown = md(
            str(article),
            heading_style="ATX",
            code_language="javascript",
            strip=["a"]  # optional: keep href or convert cleanly
        )

        return title, clean_markdown.strip(), code_snippets

    async def scrape_url(self, client: httpx.AsyncClient, path: str) -> Optional[dict]:
        url = f"{self.BASE_URL}{path}" if path.startswith("/") else path
        if url in self.visited:
            return None
        self.visited.add(url)

        async with self.semaphore:
            await asyncio.sleep(self.delay)
            try:
                response = await client.get(url, headers={"User-Agent": "DevDocsAI-RAG-Bot/1.0"})
                if response.status_code != 200:
                    logger.warning(f"Failed to fetch {url}: HTTP {response.status_code}")
                    return None

                title, markdown_body, code_snippets = self.clean_html(response.text)
                doc_id = hashlib.sha256(url.encode()).hexdigest()[:16]

                doc_record = {
                    "doc_id": doc_id,
                    "url": url,
                    "title": title,
                    "markdown": markdown_body,
                    "code_snippets": code_snippets,
                    "char_count": len(markdown_body),
                }

                # Persist to disk
                file_path = self.output_dir / f"{doc_id}.json"
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(doc_record, f, indent=2, ensure_ascii=False)

                logger.info(f"Successfully scraped: {title} ({len(markdown_body)} chars)")
                return doc_record

            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")
                return None

    async def run(self):
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            tasks = [self.scrape_url(client, path) for path in self.START_PATHS]
            results = await asyncio.gather(*tasks)
            valid = [r for r in results if r]
            logger.success(f"Scraped {len(valid)} documentation pages successfully.")

if __name__ == "__main__":
    asyncio.run(MDNScraper().run())
\`\`\`

## Verification Checkpoint
- [ ] Run the scraper script: \`python -m devdocs_ai.ingestion.scraper\`.
- [ ] Inspect the output in \`data/raw/\`: Verify that files contain clean Markdown with no navigation headers or footer markup.
- [ ] Verify that code snippets retain their line indentation and syntax structures.
`
  },
  {
    step_key: "chunking-fixed-size",
    title: "Chunking Strategy 1: Fixed-Size",
    phase_key: "foundation",
    sort_order: 4,
    readTime: "10 min",
    content: `## Objective
Implement a baseline **Fixed-Size Sliding Window Chunking** strategy using token-aware boundaries (\`tiktoken\`), calibrate window size vs. overlap ratio, and understand the trade-offs of this approach.

## Theoretical Foundations: Character vs Token-based Chunking
A frequent pitfall in early RAG systems is chunking by character length (e.g. \`len(text) // 500\`).
Why token-based chunking is required:
1. **Embedding Context Limits**: Models have strict token limits (e.g., 512 tokens for MiniLM, 8192 for BGE-M3). 500 characters of English prose may be ~110 tokens, but 500 characters of dense code or JSON can exceed 300+ tokens.
2. **Context Fragmentation**: Without sliding window overlap, a critical sentence spanning tokens 500-530 gets severed in half, rendering both halves semantically incomplete.
3. **The Goldilocks Dilemma**:
   - *Chunk too small (<128 tokens)*: Lacks sufficient context for the bi-encoder to capture meaning; misses surrounding variable definitions.
   - *Chunk too large (>1024 tokens)*: Drowns the specific answer in extraneous noise; dilutes vector similarity ("needle in a haystack").

\`\`\`
Full Document: [==============================================================]
Chunk 1:       [--------------------] (Chunk Size: 400 tokens)
Overlap:                      [====]  (Overlap: 80 tokens, 20%)
Chunk 2:                      [--------------------]
Overlap:                                     [====]
Chunk 3:                                     [--------------------]
\`\`\`

## Implementation (\`src/devdocs_ai/ingestion/chunker_fixed.py\`)

\`\`\`python
import tiktoken
from typing import List, Dict, Any
from devdocs_ai.config import settings

class FixedTokenChunker:
    def __init__(self, chunk_size: int = 400, chunk_overlap: int = 80, model_encoding: str = "cl100k_base"):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.encoder = tiktoken.get_encoding(model_encoding)

    def chunk_document(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        text = doc["markdown"]
        tokens = self.encoder.encode(text)
        total_tokens = len(tokens)

        chunks = []
        start_idx = 0
        chunk_idx = 0

        while start_idx < total_tokens:
            end_idx = min(start_idx + self.chunk_size, total_tokens)
            chunk_tokens = tokens[start_idx:end_idx]
            chunk_text = self.encoder.decode(chunk_tokens)

            chunk_record = {
                "chunk_id": f"{doc['doc_id']}_fixed_{chunk_idx}",
                "doc_id": doc["doc_id"],
                "strategy": "fixed_size",
                "chunk_index": chunk_idx,
                "text": chunk_text,
                "token_count": len(chunk_tokens),
                "metadata": {
                    "title": doc.get("title", ""),
                    "url": doc.get("url", ""),
                    "start_token": start_idx,
                    "end_token": end_idx
                }
            }
            chunks.append(chunk_record)

            # Move window by (chunk_size - overlap)
            start_idx += (self.chunk_size - self.chunk_overlap)
            chunk_idx += 1

            # Prevent infinite loop if overlap >= size
            if self.chunk_size <= self.chunk_overlap:
                break

        return chunks
\`\`\`

## Key Pitfalls of Fixed-Size Chunking
> [!WARNING]
> Fixed-size chunking frequently splits right down the middle of a code snippet, SQL statement, or JSON object, causing syntax errors in retrieved contexts. Use this as your baseline benchmark, but expect semantic and hierarchical chunking to outperform it on technical documentation.

## Verification Checkpoint
- [ ] Run a test on a 2,000-word document and verify that chunk token counts never exceed \`chunk_size\`.
- [ ] Verify that consecutive chunks share exactly \`chunk_overlap\` tokens at their boundaries.
`
  },
  {
    step_key: "chunking-semantic",
    title: "Chunking Strategy 2: Semantic",
    phase_key: "foundation",
    sort_order: 5,
    readTime: "11 min",
    content: `## Objective
Implement **Semantic Chunking** that splits text at natural semantic transitions by computing cosine distance between consecutive sentence embeddings, as well as **Markdown-Aware Structure Chunking** that respects heading hierarchies.

## Theoretical Foundations: Breakpoint Detection
Rather than an arbitrary token boundary (every 400 tokens), semantic chunking posits that documents consist of cohesive semantic units.
When the topic shifts (e.g., from *Description* to *Browser Compatibility*), the cosine distance between the embeddings of adjacent sentences spikes.

\`\`\`
Cosine Distance between adjacent sentences:
0.8 |                  Breakpoint! (Distance > Threshold)
    |                     /\
0.4 |         /\         /  \      /\
    |  __/\__/  \__/\___/    \____/  \__
0.0 +-------------------------------------> Sentence Index
       [--- Chunk 1 ---] [---- Chunk 2 ----]
\`\`\`

## Markdown Header-Aware Chunking
In technical documentation like MDN, author-defined Markdown headers (\`#\`, \`##\`, \`###\`) already represent deliberate semantic boundaries.
A Markdown-aware chunker:
1. Splits along \`#\`, \`##\`, and \`###\` boundaries.
2. Prepends the parent section hierarchy to every chunk (Context Injection):
   e.g., \`Array.prototype.slice() > Parameters > start:\`
3. Guarantees that code blocks (\`\`\`js ... \`\`\`) are NEVER severed mid-block.

## Implementation (\`src/devdocs_ai/ingestion/chunker_semantic.py\`)

\`\`\`python
import re
from typing import List, Dict, Any

class MarkdownSemanticChunker:
    def __init__(self, max_tokens: int = 600, min_tokens: int = 50):
        self.max_tokens = max_tokens
        self.min_tokens = min_tokens
        # Regex to match markdown headings
        self.heading_pattern = re.compile(r"^(#{1,4})\s+(.+)$", re.MULTILINE)

    def chunk_document(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        text = doc["markdown"]
        lines = text.split("\n")

        sections = []
        current_hierarchy = [doc.get("title", "Overview")]
        current_content = []

        for line in lines:
            match = self.heading_pattern.match(line)
            if match:
                # Save previous section if it has content
                if current_content:
                    sections.append({
                        "hierarchy": list(current_hierarchy),
                        "content": "\n".join(current_content).strip()
                    })
                    current_content = []

                level = len(match.group(1))
                heading_text = match.group(2).strip()

                # Adjust hierarchy depth
                while len(current_hierarchy) >= level:
                    current_hierarchy.pop()
                current_hierarchy.append(heading_text)
            else:
                current_content.append(line)

        if current_content:
            sections.append({
                "hierarchy": list(current_hierarchy),
                "content": "\n".join(current_content).strip()
            })

        # Format output chunks with contextual header prefix
        chunks = []
        for idx, sec in enumerate(sections):
            if not sec["content"]:
                continue
            
            context_prefix = " > ".join(sec["hierarchy"])
            chunk_body = f"## Context: {context_prefix}\n\n{sec['content']}"

            chunks.append({
                "chunk_id": f"{doc['doc_id']}_semantic_{idx}",
                "doc_id": doc["doc_id"],
                "strategy": "markdown_semantic",
                "chunk_index": idx,
                "text": chunk_body,
                "metadata": {
                    "hierarchy": sec["hierarchy"],
                    "url": doc.get("url", ""),
                    "title": doc.get("title", "")
                }
            })

        return chunks
\`\`\`

## Verification Checkpoint
- [ ] Test the chunker against an article containing code blocks; verify that no code blocks are split in half.
- [ ] Verify that every chunk includes its full parent context prefix (\`Context: Array > Methods > reduce\`).
`
  },
  {
    step_key: "chunking-hierarchical",
    title: "Chunking Strategy 3: Hierarchical",
    phase_key: "foundation",
    sort_order: 6,
    readTime: "11 min",
    content: `## Objective
Implement **Hierarchical (Parent-Child) Chunking**: indexing small, highly focused child chunks (100–150 tokens) for dense vector search precision, while linking them to rich parent chunks (800–1200 tokens) passed to the LLM for synthesis.

## The Dual-Resolution Dilemma in Vector Search
RAG engineers face an inherent contradiction:
- **Small chunks** are best for *search*: Vector embeddings of small paragraphs produce high cosine similarity with specific queries because they aren't diluted by irrelevant topics.
- **Large chunks** are best for *generation*: LLMs need surrounding context, type definitions, and prerequisite explanations to generate accurate, hallucination-free answers.

**Solution: Parent-Child Resolution Separation**
1. Split the document into **Parent Chunks** (~1,000 tokens).
2. Split each Parent Chunk into 3–8 **Child Chunks** (~150 tokens).
3. Embed and index ONLY the Child Chunks into the vector database.
4. When a child chunk matches a user's query, retrieve its **Parent Chunk** from storage and pass the Parent to the LLM context window!

\`\`\`mermaid
flowchart TD
    Doc["Full Document: Promise.all()"]
    Doc --> P1["Parent Chunk 1: Syntax & Parameters (800 tokens)"]
    Doc --> P2["Parent Chunk 2: Return Value & Rejection (900 tokens)"]

    P1 --> C1["Child 1: iterable parameter (120 tokens)"]
    P1 --> C2["Child 2: syntax signatures (140 tokens)"]
    P2 --> C3["Child 3: fast-fail rejection behavior (150 tokens)"]
    P2 --> C4["Child 4: resolved value ordering (130 tokens)"]

    subgraph VectorSearch["Vector Database (Qdrant)"]
      C1
      C2
      C3
      C4
    end

    UserQuery["Query: 'Does Promise.all fail fast on error?'"] -->|Vector Match| C3
    C3 -->|Fetch Parent ID| P2
    P2 -->|Feed Complete Context| LLM["LLM Synthesis"]
\`\`\`

## Implementation (\`src/devdocs_ai/ingestion/chunker_hierarchical.py\`)

\`\`\`python
from typing import List, Dict, Any
import tiktoken

class HierarchicalChunker:
    def __init__(self, parent_size: int = 800, child_size: int = 150, overlap: int = 30):
        self.parent_size = parent_size
        self.child_size = child_size
        self.overlap = overlap
        self.encoder = tiktoken.get_encoding("cl100k_base")

    def chunk_document(self, doc: Dict[str, Any]) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        text = doc["markdown"]
        tokens = self.encoder.encode(text)
        total_tokens = len(tokens)

        parents = []
        children = []

        parent_idx = 0
        child_global_idx = 0
        p_start = 0

        while p_start < total_tokens:
            p_end = min(p_start + self.parent_size, total_tokens)
            parent_tokens = tokens[p_start:p_end]
            parent_text = self.encoder.decode(parent_tokens)
            parent_id = f"{doc['doc_id']}_p{parent_idx}"

            parent_record = {
                "parent_id": parent_id,
                "doc_id": doc["doc_id"],
                "text": parent_text,
                "token_count": len(parent_tokens),
                "url": doc.get("url", ""),
                "title": doc.get("title", "")
            }
            parents.append(parent_record)

            # Generate child chunks inside this parent window
            c_start = 0
            while c_start < len(parent_tokens):
                c_end = min(c_start + self.child_size, len(parent_tokens))
                child_tokens = parent_tokens[c_start:c_end]
                child_text = self.encoder.decode(child_tokens)

                child_record = {
                    "child_id": f"{doc['doc_id']}_c{child_global_idx}",
                    "parent_id": parent_id,
                    "doc_id": doc["doc_id"],
                    "text": child_text,
                    "token_count": len(child_tokens),
                    "url": doc.get("url", ""),
                    "title": doc.get("title", "")
                }
                children.append(child_record)

                child_global_idx += 1
                c_start += (self.child_size - self.overlap)
                if self.child_size <= self.overlap:
                    break

            parent_idx += 1
            p_start += (self.parent_size - 100)  # slight parent overlap

        return parents, children
\`\`\`

## Verification Checkpoint
- [ ] Verify that every child chunk holds a valid foreign key pointer (\`parent_id\`) to its parent chunk.
- [ ] Confirm child token lengths are between 100–160 tokens while parent chunks retain 700–900 tokens.
`
  },
  {
    step_key: "embedding-sentence-transformers",
    title: "Embedding with Sentence-Transformers",
    phase_key: "foundation",
    sort_order: 7,
    readTime: "10 min",
    content: `## Objective
Generate dense vector embeddings using \`sentence-transformers\` with modern multilingual and code-capable models (\`BAAI/bge-m3\` or \`all-MiniLM-L6-v2\`), implement batch inference on GPU/CPU, and normalize embeddings for cosine similarity.

## Embedding Model Architecture
Dense retrieval relies on bi-encoder transformers trained with contrastive learning:
$$\\text{sim}(q, d) = \\frac{\\mathbf{v}_q \\cdot \\mathbf{v}_d}{\\|\\mathbf{v}_q\\| \\|\\mathbf{v}_d\\|}$$

When vectors are L2-normalized ($|\\mathbf{v}\\| = 1$), cosine similarity simplifies directly to the dot product $\\mathbf{v}_q \\cdot \\mathbf{v}_d$, saving compute during vector database indexing.

### Benchmark Model Comparison for Technical Documentation
| Model | Dim | Max Tokens | MTEB Retrieval Rank | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **all-MiniLM-L6-v2** | 384 | 256 | Fast baseline | Low memory / CPU dev |
| **BAAI/bge-small-en-v1.5** | 384 | 512 | High | English production |
| **BAAI/bge-m3** | 1024 | 8192 | State of the Art | Multi-lingual, Code & Long Context |
| **text-embedding-3-small** | 1536 | 8191 | High | Closed API |

## Implementation (\`src/devdocs_ai/embeddings/embedder.py\`)

\`\`\`python
import torch
from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
from loguru import logger

class DocumentEmbedder:
    def __init__(self, model_name: str = "BAAI/bge-m3", device: str = None):
        if not device:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading embedding model: {model_name} on {device}")
        
        self.model = SentenceTransformer(model_name, device=device)
        self.dimension = self.model.get_sentence_embedding_dimension()
        logger.info(f"Model loaded. Vector dimension: {self.dimension}")

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        Embeds a list of texts and returns L2-normalized float32 vectors.
        """
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            normalize_embeddings=True,  # Crucial for dot product cosine equivalence
            convert_to_numpy=True
        )
        return embeddings

    def embed_query(self, query: str) -> List[float]:
        """
        For asymmetric models (like BGE), instructions can be prepended.
        """
        embedding = self.model.encode(
            query,
            normalize_embeddings=True,
            convert_to_numpy=True
        )
        return embedding.tolist()
\`\`\`

## Verification Checkpoint
- [ ] Verify embedding shape: 100 sample texts encoded with batch_size=32 returns shape \`(100, 1024)\`.
- [ ] Check L2 normalization: \`np.linalg.norm(vector) \\approx 1.0\`.
`
  },
  {
    step_key: "qdrant-setup",
    title: "Setting Up Qdrant Vector Store",
    phase_key: "foundation",
    sort_order: 8,
    readTime: "11 min",
    content: `## Objective
Provision and configure a production-ready **Qdrant** vector database (via Docker or local embedded mode), configure HNSW index parameters, and define payload schemas with indexed fields for filtered retrieval.

## Why Qdrant for RAG Architecture?
1. **Payload-First Filtering**: Unlike legacy vector search engines that filter vectors *after* kNN search (which frequently yields zero results if filtered out), Qdrant uses payload indexes during HNSW graph traversal.
2. **Quantization Support**: Scalar (int8) and Product Quantization (PQ) reduce RAM usage by up to 4x with <1% loss in recall.
3. **Rust Core**: Ultra-fast latency with native gRPC/REST APIs and asynchronous Python client.

\`\`\`mermaid
flowchart LR
    subgraph Qdrant["Qdrant Collection: mdn_web_docs"]
        Vector["Dense Vectors (1024-dim, Cosine Distance)"]
        HNSW["HNSW Graph Index (m=16, ef_construct=100)"]
        Payload["Payload Index (category: keyword, title: text)"]
    end
    Query["Search Query + Filter(category == 'JavaScript')"] --> Qdrant
    Qdrant --> Results["Top-K Filtered Nearest Neighbors"]
\`\`\`

## Running Qdrant via Docker
\`\`\`bash
docker run -d -p 6333:6333 -p 6334:6334 \\
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \\
    --name devdocs-qdrant \\
    qdrant/qdrant:latest
\`\`\`

## Collection Provisioning Script (\`src/devdocs_ai/vectorstore/qdrant_setup.py\`)

\`\`\`python
from qdrant_client import QdrantClient
from qdrant_client.http import models
from loguru import logger
from devdocs_ai.config import settings

def initialize_qdrant_collection():
    client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

    collection_name = settings.QDRANT_COLLECTION

    # Check if collection already exists
    existing = client.get_collections().collections
    if any(c.name == collection_name for c in existing):
        logger.info(f"Collection '{collection_name}' already exists.")
        return client

    logger.info(f"Creating collection '{collection_name}'...")
    client.create_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(
            size=settings.EMBEDDING_DIMENSION,
            distance=models.Distance.COSINE
        ),
        hnsw_config=models.HnswConfigDiff(
            m=16,               # Number of bidirectional links per node
            ef_construct=100,   # Size of dynamic candidate list during construction
            full_scan_threshold=10000
        ),
        optimizers_config=models.OptimizersConfigDiff(
            default_segment_number=2
        )
    )

    # Create payload field indexes for rapid filtering
    client.create_payload_index(
        collection_name=collection_name,
        field_name="doc_id",
        field_schema=models.PayloadSchemaType.KEYWORD
    )
    client.create_payload_index(
        collection_name=collection_name,
        field_name="strategy",
        field_schema=models.PayloadSchemaType.KEYWORD
    )

    logger.success(f"Collection '{collection_name}' successfully provisioned.")
    return client

if __name__ == "__main__":
    initialize_qdrant_collection()
\`\`\`

## Verification Checkpoint
- [ ] Qdrant dashboard reachable at \`http://localhost:6333/dashboard\`.
- [ ] Collection \`mdn_web_docs\` created with 1024-dimension Cosine configuration.
`
  },
  {
    step_key: "dense-retrieval",
    title: "Basic Dense Retrieval",
    phase_key: "foundation",
    sort_order: 9,
    readTime: "11 min",
    content: `## Objective
Implement a complete dense retrieval query pipeline that embeds incoming developer queries, queries Qdrant with top-$k$ nearest neighbor search, applies metadata filtering, and formats retrieved context for LLM generation.

## The Retrieval Lifecycle
\`\`\`mermaid
sequenceDiagram
    participant User as Developer / Client
    participant Retriever as Dense Retriever
    participant Embedder as Sentence-Transformers
    participant Qdrant as Qdrant Vector DB

    User->>Retriever: Query: "How to copy an array shallowly in JS?"
    Retriever->>Embedder: embed_query(query)
    Embedder-->>Retriever: 1024-dim float32 vector
    Retriever->>Qdrant: search(collection, vector, limit=5, score_threshold=0.65)
    Qdrant-->>Retriever: Top-5 Scored Points (Payload + Similarity Score)
    Retriever->>User: Formatted Context Blocks with Citations
\`\`\`

## Implementation (\`src/devdocs_ai/retrieval/dense_retriever.py\`)

\`\`\`python
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
from devdocs_ai.config import settings
from devdocs_ai.embeddings.embedder import DocumentEmbedder

class DenseRetriever:
    def __init__(self, embedder: DocumentEmbedder, qdrant_client: Optional[QdrantClient] = None):
        self.embedder = embedder
        self.client = qdrant_client or QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
        self.collection_name = settings.QDRANT_COLLECTION

    def retrieve(
        self,
        query: str,
        limit: int = 5,
        score_threshold: float = 0.6,
        strategy_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        # 1. Embed query
        query_vector = self.embedder.embed_query(query)

        # 2. Build filters if specified
        query_filter = None
        if strategy_filter:
            query_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="strategy",
                        match=models.MatchValue(value=strategy_filter)
                    )
                ]
            )

        # 3. Query Qdrant
        search_results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=limit,
            score_threshold=score_threshold,
            query_filter=query_filter,
            with_payload=True
        )

        # 4. Format results
        retrieved_items = []
        for point in search_results:
            retrieved_items.append({
                "chunk_id": point.id,
                "score": round(float(point.score), 4),
                "text": point.payload.get("text", ""),
                "title": point.payload.get("title", ""),
                "url": point.payload.get("url", ""),
                "doc_id": point.payload.get("doc_id", ""),
            })

        return retrieved_items

if __name__ == "__main__":
    embedder = DocumentEmbedder()
    retriever = DenseRetriever(embedder)
    results = retriever.retrieve("How to clone an array without mutating the original?", limit=3)
    for r in results:
        print(f"[{r['score']}] {r['title']} -> {r['text'][:100]}...")
\`\`\`

## Verification Checkpoint
- [ ] Querying with technical questions returns relevant documentation chunks with similarity scores > 0.70.
- [ ] Result payloads contain canonical URLs for source attribution.
`
  }
];

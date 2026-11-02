// Lightweight interview question teasers for StepView to eliminate 110kB of markdown answers from initial bundle
export interface InterviewTeaser {
  step_key: string;
  company?: string;
  track?: string;
  question: string;
}

export const interviewTeasers: readonly InterviewTeaser[] = [
  {
    "step_key": "project-setup",
    "company": "System Architecture",
    "question": "You are deploying an embedding inference service across a fleet of 500 heterogeneous nodes—ranging from local ARM64 developer workstations to AWS `g5.2xlarge` instances (NVIDIA A10G) and CPU-only edge nodes. How do you architect the package resolution, container image build, and runtime initialization layers to guarantee zero dependency drift, prevent silent CPU fallback, and achieve sub-second cold starts?"
  },
  {
    "step_key": "corpus-understanding",
    "company": "System Architecture",
    "question": "You are architecting the documentation ingestion pipeline for an enterprise code assistant indexing 500,000 internal SDK reference pages and external technical docs. These documents undergo weekly updates. How do you design the document representation and ingestion schema to: (1) guarantee complete retrieval provenance, (2) detect breaking semantic changes, and (3) prevent stale or orphaned chunks from contaminating the vector store?"
  },
  {
    "step_key": "scraper-building",
    "company": "System Architecture",
    "question": "Design a distributed web scraping cluster that ingests 10 million technical documentation pages daily from diverse developer sites (MDN, GitHub, ReadTheDocs) while adhering strictly to per-domain rate limits (max 5 QPS per domain), avoiding tarpits, and keeping infrastructure cost under $50/day."
  },
  {
    "step_key": "chunking-fixed-size",
    "company": "System Architecture",
    "question": "A production RAG assistant for web developers uses 512-token fixed chunking with 50-token overlap. Customer satisfaction telemetry indicates that 35% of user queries asking about method parameters (e.g. 'What does the third argument of addEventListener do?') yield completely wrong answers or hallucinated defaults. Diagnose the root cause in the chunking layer and propose an architectural remediation."
  },
  {
    "step_key": "chunking-semantic",
    "company": "System Architecture",
    "question": "You are designing the ingestion architecture for 1,000,000 technical documentation pages. The ML leadership mandates semantic chunking to maximize retrieval precision. A naive implementation takes 36 hours and requires $8,000 in cloud GPU spend. How do you re-architect the pipeline to achieve a 10x throughput improvement, reduce cost by 80%, while preserving semantic boundary quality?"
  },
  {
    "step_key": "chunking-hierarchical",
    "company": "System Architecture",
    "question": "In a high-scale developer assistant serving 10,000 QPS, Top-10 vector retrieval over child chunks returns 7 children from Parent Section A, 2 children from Parent Section B, and 1 child from Parent Section C. How do you architect the Context Hydration, Parent Re-ranking, and Prompt Assembly layers to optimize token budgets and prevent the 'Lost in the Middle' attention degradation effect?"
  },
  {
    "step_key": "embedding-sentence-transformers",
    "company": "System Architecture",
    "question": "You need to embed 100 million technical documentation chunks (average 300 tokens each) using a 1024-dimensional model (`bge-large-en-v1.5`). Detail the mathematical sizing: calculate total token volume, storage capacity in FP32 vs FP16, required GPU VRAM, inference throughput, and cluster provisioning to complete the indexing run in under 8 hours."
  },
  {
    "step_key": "qdrant-setup",
    "company": "System Architecture",
    "question": "Your vector database holds 20 million vectors (1024 dims). The CFO alerts you that the memory bill exceeds $15,000/month (requiring 120GB+ RAM across large AWS instances). How do you scale down RAM costs by 70%+ while keeping p99 retrieval latency under 15ms and Recall@10 above 95%?"
  },
  {
    "step_key": "dense-retrieval",
    "company": "System Architecture",
    "question": "In an AI coding assistant, a user asks: 'How do I combine two arrays in JavaScript without mutating the original arrays?'. The dense retriever returns `Array.prototype.splice()` with a very high cosine similarity of 0.82 because splice() deals with array modification. The correct answer (`concat()` or the spread operator `[...a, ...b]`) is ranked 9th. Explain the mathematical root cause of this semantic negation failure mode in bi-encoders, and architect a production mitigation."
  },
  {
    "step_key": "cross-encoder-reranking",
    "company": "System Architecture",
    "question": "You are the Lead ML Systems Architect for a real-time developer search engine indexing 15 million code and API documentation chunks. Your service receives 2,500 queries per second (QPS) at peak, with a strict end-to-end P99 latency SLA of 120ms (including network round-trip, retrieval, reranking, and initial streaming LLM token). If running a Cross-Encoder over all 15 million chunks is impossible, walk us through the end-to-end architecture, mathematical sizing of the candidate pool $K$, latency budget breakdown, hardware provisioning, and how you prevent truncation catastrophe on long documentation pages."
  },
  {
    "step_key": "postgres-logging",
    "company": "System Architecture",
    "question": "Design the telemetry and observability architecture for an enterprise RAG platform processing 10,000 queries per second with a zero-latency SLA penalty on user requests. How do you prevent telemetry database connection pool exhaustion from crashing the main API, how do you handle PII sanitization before persistence, and how do you structure your analytical queries to detect retrieval drift across thousands of enterprise tenants?"
  },
  {
    "step_key": "sql-changelog-db",
    "company": "System Architecture",
    "question": "You are architecting an enterprise documentation assistant for 500,000 developers who query both high-level design concepts ('How does React Suspense coordinate async boundary rendering?') and rigid tabular compatibility questions ('What version of Node.js stabilized fetch, and what experimental flags are required for older versions?'). Walk us through your hybrid routing architecture, your schema design for automated ingestion from open-source compatibility repos (MDN BCD), and how you harden Text-to-SQL against prompt injection attacks."
  },
  {
    "step_key": "golden-eval-set",
    "company": "System Architecture",
    "question": "You are responsible for the quality benchmark of a multi-tenant documentation and coding RAG assistant indexing 50 million pages. Over time, technical documentation undergoes continuous churn (new API releases, method deprecations, breaking changes). How do you construct, maintain, and version a Golden Evaluation Benchmark so it does not degrade over time, prevent prompt engineers from gaming or overfitting to the test set, and detect when upstream documentation edits invalidate your ground-truth annotations?"
  },
  {
    "step_key": "ragas-evaluation",
    "company": "System Architecture",
    "question": "You are the Lead ML Architect for an enterprise AI code assistant. Your VP of Engineering wants to implement automated evaluation on every single pull request across 40 engineers. However, running full RAGAS evaluation with a frontier LLM judge costs \\$0.15 per query, which amounts to \\$60,000 per month and introduces an 8-minute bottleneck on CI/CD pipelines. How do you design a tiered evaluation architecture that guarantees high evaluation fidelity, reduces costs by 95%, and prevents judge bias?"
  },
  {
    "step_key": "ir-metrics",
    "company": "System Architecture",
    "question": "Your production RAG assistant reports a stellar Hit Rate@10 of 94%, yet customer satisfaction surveys show a disappointing 61% rating, and automated hallucination monitors trigger constantly. Walk us through your forensic diagnosis using classical Information Retrieval metrics. How do you isolate 'Lost in the Middle' position decay, what mathematical formulas prove your diagnosis, and how do you configure your Cross-Encoder cascade to fix it?"
  },
  {
    "step_key": "chunking-ablation-study",
    "company": "System Architecture",
    "question": "You are the Lead AI Infrastructure Engineer presenting the architecture of a new enterprise documentation assistant to the VP of Engineering and Head of Infrastructure. The infrastructure lead argues that Hierarchical Parent-Child chunking + Cross-Encoder re-ranking is over-engineered: it stores 2.8x more chunks in vector memory and adds 35ms of GPU latency compared to standard 400-token fixed-size chunking. Walk us through how you defend this architecture using empirical ablation data, Total Cost of Ownership (TCO) financial modeling, and customer trust preservation."
  },
  {
    "step_key": "fastapi-backend",
    "company": "System Architecture",
    "question": "We are designing the real-time chat streaming backend for our developer assistant serving 50,000 active concurrent connections. Users frequently close browser tabs, jump between questions, or have unstable mobile connections. How would you design the streaming service to handle connection persistence, reverse proxy buffer flushing, cancellation propagation back to GPU inference workers, and horizontal load balancing?"
  },
  {
    "step_key": "langgraph-agent-architecture",
    "company": "System Architecture",
    "question": "How do you design a cyclical multi-tool agent system deployed across a cluster of stateless API pods? How do you guarantee state persistence across user turns, eliminate runaway looping costs, prevent state corruption when two user requests arrive simultaneously on the same thread, and observe non-deterministic graph trajectories in production?"
  },
  {
    "step_key": "agent-tool-doc-search",
    "company": "System Architecture",
    "question": "Multi-query expansion and HyDE can easily quadruple LLM token consumption and add 500ms to retrieval latency. How would you design an adaptive, latency-bounded retrieval tier that provides the recall benefits of HyDE without violating a strict p95 latency budget of 400ms?"
  },
  {
    "step_key": "agent-tool-sql-query",
    "company": "System Architecture",
    "question": "You are designing an enterprise Text-to-SQL agent over a petabyte-scale data warehouse containing 1,500 tables. Prompts cannot fit all table DDLs, queries may execute expensive unindexed table scans, and prompt injection can attempt to bypass basic regex filters. How do you architect schema retrieval, runtime AST validation, execution timeouts, and dialect self-correction?"
  },
  {
    "step_key": "agent-tool-clarifying-questions",
    "company": "System Architecture",
    "question": "How do you design a conversational system that knows WHEN and HOW to ask clarifying questions without annoying the user with excessive interruptions? How do you handle asynchronous human-in-the-loop state resumption when the user may take minutes or hours to respond?"
  },
  {
    "step_key": "dspy-setup",
    "company": "System Architecture",
    "question": "How do you implement Continuous Prompt Optimization in an enterprise CI/CD pipeline? When should you trigger automated DSPy recompilation, how do you prevent prompt overfitting, and how do you monitor for distribution shift between offline evaluation and live production traffic?"
  },
  {
    "step_key": "dspy-metrics",
    "company": "System Architecture",
    "question": "How do you design a continuous evaluation and automated prompt retraining pipeline that detects semantic drift in production RAG systems where LLM judges can be noisy, biased, or inconsistent? How do you balance accuracy gains against token cost and latency inflation?"
  },
  {
    "step_key": "react-frontend-setup",
    "company": "System Architecture",
    "question": "What happens if the user locks their mobile phone or switches browser tabs while the LLM is halfway through generating a 600-token streaming answer? How do you architect reconnection, token deduplication, and reverse-proxy buffering?"
  },
  {
    "step_key": "react-frontend-chat-ui",
    "company": "System Architecture",
    "question": "What prevents a malicious user or corrupted documentation chunk from performing Cross-Site Scripting (XSS) or prompt injection via your Markdown renderer?"
  },
  {
    "step_key": "evaluation-dashboard",
    "company": "System Architecture",
    "question": "If your RAG system scales to 10,000 queries per second, how do you collect trace spans and metrics without crushing your telemetry database or adding latency to inference?"
  },
  {
    "step_key": "user-study",
    "company": "System Architecture",
    "question": "How do you design an empirical user study and mathematically connect technical metrics (MRR, latency, NDCG) to concrete business ROI and developer velocity for executive leadership?"
  },
  {
    "step_key": "readme-architecture",
    "company": "System Architecture",
    "question": "Walk us through the complete end-to-end capacity planning, multi-tier caching (Redis L1 / Qdrant L2), and latency SLA budget sizing for an enterprise RAG cluster serving 10,000 QPS."
  }
] as const;

export const interviewTeasersMap: ReadonlyMap<string, InterviewTeaser> = new Map(
  interviewTeasers.map(t => [t.step_key, t])
);

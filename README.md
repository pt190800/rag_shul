# rag_shul

RAG pipeline over the **Shulchan Arukh (Orach Chaim)** — Hebrew halachic corpus. Four-stage offline pipeline (data → chunks → embeddings → eval) and a production-ready chat UI (FastAPI backend + React frontend) for halachic Q&A with source retrieval.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Offline Pipeline                     │
│                                                          │
│  data/scripts/ → chunker/ → embedder/ → evaluation/     │
│                                 │                        │
│                          chroma_db/ (vectors)            │
└─────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      backend/main.py        │
                    │  FastAPI  ·  port 8000      │
                    │                             │
                    │  POST /api/chat             │
                    │   1. encode_query (E5)      │
                    │   2. ChromaDB → top K       │
                    │   3. JSON lookup (text+hagah│
                    │      + breadcrumb)          │
                    │   4. build system prompt    │
                    │   5. OpenAI → reply         │
                    └─────────────┬───────────────┘
                                  │ JSON
                    ┌─────────────▼───────────────┐
                    │      frontend/  (React)      │
                    │  Vite dev  ·  port 5173      │
                    │  useChat → ChatMessage       │
                    │  Sidebar  → SourceChunks     │
                    └─────────────────────────────┘
```

---

## Modules

| Module | What it does |
|---|---|
| `backend/` | FastAPI server — `/api/chat` runs the full RAG pipeline (embed → retrieve → enrich → LLM). |
| `frontend/` | React + Vite chat UI — RTL Hebrew, source accordion, settings sidebar. |
| `experiments/` | Pipeline orchestrator; reads `config/config.yaml` and runs all four stages with skip-if-exists gating. |
| `chunker/` | Reads the RAG JSON and produces chunk tables — one per text variant. |
| `embedder/` | Encodes chunks with `intfloat/multilingual-e5-large` and stores 1024-d vectors in ChromaDB. |
| `retrievers/` | Semantic retrieval over ChromaDB — single-variant, multi-variant, and batched paths. |
| `evaluation/` | Runs a retriever over a benchmark CSV and reports Recall@K + MRR. |
| `data/` | Source TXT, processed JSON, eval CSV, modern-summary / questions caches. |
| `config/` | `config/config.yaml` — single source of truth for all pipeline stages. |
| `chat-ui/` | Legacy vanilla JS UI (kept for reference). |

---

## Quickstart

### Chat UI (backend + frontend)

```bash
# 1. Python environment
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Set OpenAI key (edit chat-ui/.env or create .env in project root)
echo "OPENAI_API_KEY=sk-..." > .env

# 3. Start FastAPI backend
.venv/bin/uvicorn backend.main:app --reload --port 8000

# 4. In a second terminal — start React frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

> API docs available at `http://localhost:8000/docs`

### Full offline pipeline (rebuild ChromaDB)

```bash
# Runs: data → chunks → embed → eval
# First run ~2 h on CPU; subsequent runs skip completed stages
python experiments/exp_main.py
```

> Every new terminal session requires `source .venv/bin/activate`.

---

## Config

All settings live in `config/config.yaml`. Top-level keys and which module each one drives:

| Key | Consumer |
|---|---|
| `rebuild` | `experiments/exp_main.py` — wipes the data file, the chunks file, and the ChromaDB directory |
| `log_level` | `experiments/exp_main.py` — Python `logging` level |
| `paths` | every module — single registry of file locations |
| `chunker` | `chunker.chunker.run` — `mode`, `chunk_fields`, `siman_fields`, `text_variants` |
| `embeddings` | `embedder.embed.run` — `model`, `batch_size`, `prefix_passage`, `prefix_query` |
| `retrieval` | `retrievers/` — default `top_k`, default `type_text` |
| `query` | legacy — kept for backward compat with older retriever paths |
| `evaluation` | `evaluation.run` — `type`, `k_values`, `retrieve_k`, `max_questions`, … |

Per-key detail lives in each module's `## Config keys` section.

---

## Repository layout

```
rag_shul/
├── backend/        # FastAPI server — RAG pipeline endpoint
├── frontend/       # React + Vite chat UI
├── chat-ui/        # Legacy vanilla JS UI
├── chunker/        # RAG JSON → multi-variant chunks
├── config/         # config.yaml — single source of truth
├── data/           # source text + processed JSON + eval CSV
│   ├── eval/       # sa_eval.csv + cached query embeddings + results/
│   ├── processed/  # canonical RAG JSON (+ breadcrumb variant)
│   ├── scripts/    # preprocessors (build, enrich, add_breadcrumb)
│   └── source_original/   # raw Torat Emet TXT
├── embedder/       # ChromaDB builder + encode_query() API
├── evaluation/     # Recall@K / MRR evaluator + runner
├── experiments/    # exp_main.py — full-pipeline orchestrator
├── notebooks/      # Colab notebooks (rebuild + eval on GPU)
└── retrievers/     # BaseRetriever + ChromaRetriever (+ legacy)
```

---

## Development workflow

- **Branches**: feature branches off `main` (current dev branch: `Izar_Dahan__new_ref_evaluation`).
- **`chunker/` is protected**: never edit any file inside `chunker/` without explicit confirmation — see `chunker/CLAUDE.md`.
- **Notebooks**: `notebooks/` holds the Colab cells used to rebuild ChromaDB on a GPU runtime; the persistent ChromaDB lives on Google Drive.
- **Manager / Worker sessions**: multi-session refactor work is tracked under `private/Manager-*/` (each with its own `README.md` + `progress.md`).

---

## Requirements

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Key deps: `openai`, `chromadb`, `sentence-transformers`, `torch`, `pyyaml`, `pandas`, `numpy`.

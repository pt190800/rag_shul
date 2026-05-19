"""
backend/main.py — FastAPI server for rag_shul
==============================================
Run:
    cd /path/to/rag_shul
    OPENAI_API_KEY=sk-... uvicorn backend.main:app --reload --port 3000
"""

import json
import os
import sys
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env")           # project root (preferred)
load_dotenv(PROJECT_ROOT / "chat-ui" / ".env")  # legacy location

from openai import OpenAI  # noqa: E402
from retrievers import get_retriever  # noqa: E402

# ── Constants ─────────────────────────────────────────────────────────────────

JSON_DATA_PATH = PROJECT_ROOT / "data" / "processed" / "shulchan_aruch_rag_with_breadcrumb.json"

SYSTEM_PROMPT = """
אתה עוזר לימוד הלכה בעברית.
ענה בצורה ברורה ומדויקת תוך ציון המקור (סימן וסעיף בשולחן ערוך).
אם השאלה דורשת פסיקה למעשה, הוסף: "יש להתייעץ עם רב."
אל תמציא מקור אם אינך בטוח בו.
""".strip()

MAX_MESSAGES = 12
MAX_CONTENT_CHARS = 4_000
DEFAULT_TOP_K = 3

# ── JSON source lookup: {(siman, seif): seif_dict} ───────────────────────────

def _build_seif_lookup(path: Path) -> dict[tuple[int, int], dict]:
    """Load shulchan_aruch JSON and index every seif by (siman, seif) for O(1) lookup."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    lookup: dict[tuple[int, int], dict] = {}
    for siman_obj in raw.get("simanim", []):
        siman_num = int(siman_obj["siman"])
        breadcrumb = {
            "hilchot_group": siman_obj.get("hilchot_group", ""),
            "siman_sign":    siman_obj.get("siman_sign", ""),
        }
        for seif_obj in siman_obj.get("seifim", []):
            key = (siman_num, int(seif_obj["seif"]))
            lookup[key] = {**breadcrumb, **seif_obj}
    return lookup


_seif_lookup: dict[tuple[int, int], dict] = _build_seif_lookup(JSON_DATA_PATH)

# ── Retriever cache ───────────────────────────────────────────────────────────

_retrievers: dict = {}


def _get_retriever(type_text: str):
    if type_text not in _retrievers:
        _retrievers[type_text] = get_retriever("chroma", type_text=type_text)
    return _retrievers[type_text]


# ── Context builder ───────────────────────────────────────────────────────────

def _build_context_block(rank: int, siman: int, seif: int, chunk_text: str) -> str:
    """
    Build one context block for the LLM.
    Pulls full seif data (text, hagah, breadcrumb) from the JSON lookup.
    Falls back to the chunk text from ChromaDB if the seif isn't found.
    """
    src = _seif_lookup.get((siman, seif))
    if src is None:
        return f"[{rank}] סימן {siman}, סעיף {seif}:\n{chunk_text}"

    parts = []

    # breadcrumb
    group = src.get("hilchot_group", "")
    sign  = src.get("siman_sign", "")
    if group or sign:
        parts.append(f"הלכות: {group} | {sign}".strip(" |"))

    parts.append(f"סימן {siman}, סעיף {seif}:")

    text = (src.get("text") or "").strip()
    if text:
        parts.append(text)

    hagah = (src.get("hagah") or "").strip()
    if hagah:
        parts.append(f"הגה: {hagah}")

    return f"[{rank}]\n" + "\n".join(parts)


# ── Pydantic models ───────────────────────────────────────────────────────────

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    use_rag: bool = True
    top_k: int = Field(default=DEFAULT_TOP_K, ge=1, le=20)
    type_text: str = "text+hagah"


class SeifSource(BaseModel):
    siman: int
    seif: int
    hilchot_group: str = ""
    siman_sign: str = ""
    text: str = ""
    hagah: str = ""


class ChunkOut(BaseModel):
    rank: int
    siman: int
    seif: int
    score: float
    type_text: str
    chunk_text: str   # what ChromaDB returned
    source: SeifSource | None = None  # full seif from JSON


class ChatResponse(BaseModel):
    reply: str
    chunks: list[ChunkOut] = []


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="RAG Shul API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "seif_lookup_size": len(_seif_lookup)}


@app.get("/api/variants")
def get_variants():
    try:
        import chromadb
        chroma_dir = PROJECT_ROOT / "embedder" / "chroma_db"
        client = chromadb.PersistentClient(path=str(chroma_dir))
        col = client.get_collection("shulchan_arukh_seifs")

        found: set[str] = set()
        offset, batch = 0, 5_000
        while True:
            chunk = col.get(include=["metadatas"], limit=batch, offset=offset)
            if not chunk["metadatas"]:
                break
            found.update(m["type_text"] for m in chunk["metadatas"] if "type_text" in m)
            offset += batch

        return {"variants": sorted(found)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="חסר OPENAI_API_KEY בסביבת השרת.")

    messages = [
        {"role": m.role, "content": m.content.strip()[:MAX_CONTENT_CHARS]}
        for m in req.messages[-MAX_MESSAGES:]
        if m.content.strip()
    ]
    if not messages:
        raise HTTPException(status_code=400, detail="לא התקבלה שאלה.")

    last_question = messages[-1]["content"]
    chunks_out: list[ChunkOut] = []

    if req.use_rag:
        # 1. Retrieve from ChromaDB (embedding done internally by the retriever)
        results = _get_retriever(req.type_text).retrieve(last_question, top_k=req.top_k)

        # 2. Build context blocks from JSON source + LLM system prompt
        context_blocks = [
            _build_context_block(r["rank"], r["siman"], r["seif"], r["text"])
            for r in results
        ]
        system = SYSTEM_PROMPT + "\n\nקטעים רלוונטיים מהשולחן ערוך:\n\n" + "\n\n---\n\n".join(context_blocks)

        # 3. Build response chunks (ChromaDB chunk + full JSON source)
        for r in results:
            src = _seif_lookup.get((r["siman"], r["seif"]))
            chunks_out.append(ChunkOut(
                rank=r["rank"],
                siman=r["siman"],
                seif=r["seif"],
                score=r["score"],
                type_text=r["type_text"],
                chunk_text=r["text"],
                source=SeifSource(
                    siman=r["siman"],
                    seif=r["seif"],
                    hilchot_group=(src.get("hilchot_group") or "") if src else "",
                    siman_sign=(src.get("siman_sign") or "") if src else "",
                    text=(src.get("text") or "") if src else "",
                    hagah=(src.get("hagah") or "") if src else "",
                ) if src else None,
            ))
    else:
        system = SYSTEM_PROMPT

    client = OpenAI(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[{"role": "system", "content": system}, *messages],
            temperature=0.35,
            max_tokens=1_200,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"שגיאה מול OpenAI: {exc}")

    reply = (response.choices[0].message.content or "").strip()
    return ChatResponse(reply=reply, chunks=chunks_out)

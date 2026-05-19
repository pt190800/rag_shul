import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import chromadb

CHROMA_DIR      = Path(__file__).resolve().parents[2] / "embedder" / "chroma_db"
COLLECTION_NAME = "shulchan_arukh_seifs"

_cache: list[str] | None = None


def _load_variants() -> list[str]:
    global _cache
    if _cache is not None:
        return _cache
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    col    = client.get_collection(COLLECTION_NAME)
    found: set[str] = set()
    offset, batch   = 0, 5000
    while True:
        chunk = col.get(include=["metadatas"], limit=batch, offset=offset)
        if not chunk["metadatas"]:
            break
        found.update(m["type_text"] for m in chunk["metadatas"] if "type_text" in m)
        offset += batch
    _cache = sorted(found)
    return _cache


class handler:
    def do_GET(self):
        try:
            variants = _load_variants()
        except Exception as exc:
            body = json.dumps({"error": str(exc)}, ensure_ascii=False).encode("utf-8")
            self.send_response(500)
        else:
            body = json.dumps({"variants": variants}, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[0]))
from chat import SYSTEM_PROMPT, SYSTEM_PROMPT_RAG


class handler:
    def do_GET(self):
        body = json.dumps(
            {"no_rag": SYSTEM_PROMPT, "rag": SYSTEM_PROMPT_RAG},
            ensure_ascii=False,
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

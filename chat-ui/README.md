# Chat UI

A Hebrew RTL interface for comparing RAG-augmented answers against plain GPT answers, powered by OpenAI GPT and ChromaDB.

---

## Setup

**1. Clone the repo**
```bash
git clone https://github.com/egozi/rag_shul.git
cd rag_shul
```

**2. Add your OpenAI API key**
```bash
cp chat-ui/.env.example chat-ui/.env
```
Open `chat-ui/.env` and replace the placeholder with your key:
```
OPENAI_API_KEY=sk-...
```

**3. Install Python dependencies**
```bash
pip install -r requirements.txt
```

**4. Build the ChromaDB (first time only)**
```bash
python3 embedder/embed.py --chunks data/chunks_siman.json
```

---

## Run locally

```bash
cd chat-ui
python3 server.py
```
Open [http://localhost:3000](http://localhost:3000)

---

## Files

| File | Purpose |
|------|---------|
| `server.py` | Local dev server — serves static files and routes API calls |
| `index.html` | Three-tab comparison UI |
| `api/chat.py` | POST `/api/chat` — calls ChromaRetriever then OpenAI |
| `api/eval.py` | GET `/api/eval` — serves the eval CSV as JSON |
| `.env.example` | API key template — never commit a real key |

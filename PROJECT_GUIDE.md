# מדריך מלא לפרויקט rag_shul

> מסמך זה מסביר את כל חלקי הפרויקט — כל תהליך, קלט, פלט, ומה קורה בתוכו — ומסיים בניתוח ביקורתי של הקוד ועצות לשיפור.

---

## תוכן עניינים

1. [רקע ומטרת הפרויקט](#1-רקע-ומטרת-הפרויקט)
2. [מבנה הפרויקט](#2-מבנה-הפרויקט)
3. [נקודת ההתחלה — הטקסט הגולמי](#3-נקודת-ההתחלה--הטקסט-הגולמי)
4. [תהליך מס' 2 — עיבוד הטקסט הגולמי](#4-תהליך-מס-2--עיבוד-הטקסט-הגולמי)
5. [תהליך מס' 3 — הוספת כותרות (Breadcrumb)](#5-תהליך-מס-3--הוספת-כותרות-breadcrumb)
6. [תהליך מס' 4 — חלוקה לצ'אנקים (Chunker)](#6-תהליך-מס-4--חלוקה-לצ'אנקים-chunker)
7. [תהליך מס' 5 — הטמעת וקטורים (Embedder)](#7-תהליך-מס-5--הטמעת-וקטורים-embedder)
8. [תהליך מס' 6 — שליפה (Retriever)](#8-תהליך-מס-6--שליפה-retriever)
9. [תהליך מס' 7 — הערכה (Evaluation)](#9-תהליך-מס-7--הערכה-evaluation)
10. [תהליך מס' 8 — ממשק המשתמש (Chat UI)](#10-תהליך-מס-8--ממשק-המשתמש-chat-ui)
11. [זרימת הנתונים מקצה לקצה](#11-זרימת-הנתונים-מקצה-לקצה)
12. [תוצאות הניסויים](#12-תוצאות-הניסויים)
13. [ביקורת הקוד — מה לא טוב ועצות לשיפור](#13-ביקורת-הקוד--מה-לא-טוב-ועצות-לשיפור)
14. [Quick Start — הרצה מאפס](#14-quick-start--הרצה-מאפס)
15. [הוספת Retriever חדש](#15-הוספת-retriever-חדש)
16. [ציר הזמן של הניסויים](#16-ציר-הזמן-של-הניסויים--מה-עבד-ומה-לא)
17. [מודל E5 — למה דווקא הוא?](#17-מודל-e5--למה-דווקא-הוא)
18. [Troubleshooting — שגיאות נפוצות](#18-troubleshooting--שגיאות-נפוצות-ופתרונות)

---

## 1. רקע ומטרת הפרויקט

**rag_shul** הוא מערכת RAG (Retrieval-Augmented Generation) שנבנתה על גבי **שולחן ערוך, אורח חיים** — אחד מספרי ההלכה הבסיסיים ביהדות.

### מה המערכת עושה?

המשתמש שואל שאלת הלכה בעברית. המערכת:
1. מחפשת בשולחן ערוך את הקטעים הרלוונטיים ביותר לשאלה
2. מעבירה אותם ל-GPT יחד עם השאלה
3. GPT מייצר תשובה מבוססת-מקורות

בנוסף, ניתן להשוות תשובות עם ובלי RAG — כדי למדוד כמה הRAG מועיל.

### הגרסיון של הטקסט

הטקסט מבוסס על מהדורת **תורת אמת 363**, כולל:
- 697 סימנים
- ~4,169 סעיפים
- ~30,000 מילים
- טקסט המחבר + הגה"ה של הרמ"א

---

## 2. מבנה הפרויקט

```
rag_shul/
├── build_source_from_sefaria.py   ← כלי עזר: הורדה מ-Sefaria (לא חלק מהצינור הראשי)
├── data/
│   ├── source_original/           ← קבצי טקסט גולמיים
│   ├── processed/                 ← JSON מובנה לאחר עיבוד
│   ├── scripts/                   ← סקריפטים לעיבוד נתונים
│   ├── chunks.json                ← צ'אנקים פשוטים
│   ├── chunks_siman.json          ← צ'אנקים מרובי-גרסאות (הפלט המרכזי)
│   └── eval/sa_eval.csv           ← 596 שאלות לבנצ'מרק
├── chunker/                       ← שלב 2: חלוקה לצ'אנקים
├── embedder/                      ← שלב 3: הטמעת וקטורים + ChromaDB
├── retrievers/                    ← שלב 4: שליפת תוצאות
├── evaluation/                    ← שלב 5: מדידת ביצועים
├── chat-ui/                       ← שלב 6: ממשק משתמש
├── config/config.yaml             ← הגדרות הפרויקט
└── experiments/exp_main.py        ← הרצת ניסויים
```

---

## 3. נקודת ההתחלה — הטקסט הגולמי

### הקובץ הבסיסי

הטקסט הגולמי של הפרויקט הוא **קובץ מקומי** שכבר קיים בתוך הריפו:

```
data/source_original/data_fixed.txt         ← מהדורת תורת אמת 363 (הקלט הראשי)
data/source_original/Shulchan_Aruch_Text_Headlines.txt  ← כותרות הסימנים
```

אין צורך להוריד שום דבר — הטקסט כבר בפרויקט.

### build_source_from_sefaria.py — כלי עזר נפרד

`build_source_from_sefaria.py` הוא **לא חלק מהצינור הראשי**. הוא כלי נפרד שמוריד טקסט מ-API של Sefaria ומייצר קובץ עם timestamp:

```
data/Shulchan_Arukh_OC_sefaria_{timestamp}.txt
```

זהו **גרסת Sefaria** של הטקסט — שונה מ-`data_fixed.txt` שהוא מהדורת תורת אמת 363. הכלי קיים אם רוצים להשוות גרסאות או לבנות pipeline על גרסת Sefaria, אבל **הפרויקט הנוכחי משתמש ב-`data_fixed.txt` המקומי** בלבד.

---

## 4. תהליך מס' 2 — עיבוד הטקסט הגולמי

**קובץ**: `data/scripts/build_shulchan_aruch_rag.py`

### מה הוא עושה?

הופך את הטקסט הגולמי (TXT לא מובנה) ל-JSON מובנה ומנוקה, עם היררכיה ברורה של סימן → סעיף.

### קלט

```
data/source_original/data_fixed.txt
```
טקסט גולמי של השולחן ערוך, עם ניקוד, קיצורים, ותגיות HTML.

### פלט

```json
{
  "title": "שולחן ערוך, אורח חיים",
  "source": "Torat Emet 363",
  "simanim": [
    {
      "siman": 1,
      "seifim": [
        {
          "seif": 1,
          "text": "ישתדל אדם לעמוד בבוקר לעבודת בוראו...",
          "hagah": "ויש אומרים...",
          "text_raw": "יִשְׁתַּדֵּל אָדָם לַעֲמֹד בַּבֹּקֶר..."
        }
      ]
    }
  ]
}
```

**קובץ**: `data/processed/shulchan_aruch_rag.json`

### מה קורה בפנים? (7 שלבים)

| שלב | שם | מה עושה |
|-----|-----|---------|
| 1 | Basic fixes | מאחד תגיות HTML מפוצלות, משלים סוגריים פתוחים |
| 2 | Small cleanup | מסיר ציטוטים מיותרים, הפניות למחבר |
| 3 | Number expansion | ממיר גימטריות (ק"ג → 103) לפי הקשר |
| 4 | Ktiv male | מסיר ניקוד, מרחיב קיצורים ("ב'" → "בית") |
| 5 | Unification | מאחד שמות קדושים, מוחק ביטויים חוזרים |
| 6 | Final cleanup | מנרמל רווחים ופיסוק |
| 7 | Structure | מפצל לסימנים ← סעיפים, מזהה הגה"ה של הרמ"א |

---

## 5. תהליך מס' 3 — הוספת כותרות (Breadcrumb)

**קובץ**: `data/scripts/add_breadcrumb_to_json.py`

### מה הוא עושה?

מוסיף לכל סימן את **שם הנושא** שלו (למשל "הלכות ציצית") ואת **כותרת הסימן** (למשל "דין הציצית"). מידע זה לא היה בטקסט הגולמי — הוא נלקח מקובץ תוכן עניינים נפרד.

### קלט

```
data/processed/shulchan_aruch_rag.json       ← JSON בסיסי
data/source_original/Shulchan_Aruch_Text_Headlines.txt  ← כותרות
```

### פלט

```json
{
  "siman": 1,
  "hilchot_group": "הלכות הנהגת אדם בבוקר",
  "siman_sign": "דין השכמת הבוקר",
  "seifim": [...]
}
```

**קובץ**: `data/processed/shulchan_aruch_rag_with_breadcrumb.json`

### למה זה חשוב?

כשהמודל מחפש "מה דין ציצית", הוספת "הלכות ציצית" לטקסט הסעיף עוזרת לו למצוא אותו — גם אם המילה "ציצית" לא מופיעה בגוף הסעיף עצמו.

---

## 6. תהליך מס' 4 — חלוקה לצ'אנקים (Chunker)

**קבצים**: `chunker/chunker.py`, `chunker/main.py`

### מה הוא עושה?

הופך את ה-JSON המובנה לרשימת **צ'אנקים** (יחידות טקסט קטנות) שניתן להטמיע ולחפש בהן. נוצרות **3 גרסאות שונות** של אותם צ'אנקים, כל אחת עם מידע שונה.

### קלט

```
data/processed/shulchan_aruch_rag_with_breadcrumb.json
config/config.yaml
```

### פלט

```json
[
  {
    "metadata": {"type_text": "text+hagah"},
    "data": [
      {
        "id": 0,
        "siman": 1,
        "seif": 1,
        "siman_seif": "סימן 1, סעיף 1",
        "text": "ישתדל אדם לעמוד בבוקר... ויש אומרים..."
      },
      ...
    ]
  },
  {
    "metadata": {"type_text": "text_only"},
    "data": [...]
  },
  {
    "metadata": {"type_text": "text+hilchot_group"},
    "data": [...]
  }
]
```

**קובץ**: `data/chunks.json` (נתיב ברירת מחדל מ-config) — בפועל קיים גם `data/chunks_siman.json` כגרסה מרובת-וריאנטים

סה"כ: **~12,500 צ'אנקים** (3 גרסאות × 4,169 סעיפים)

### שלושת הגרסאות

| גרסה | מה כוללת | למה? |
|------|---------|------|
| `text+hagah` | טקסט המחבר + הגה"ה של הרמ"א | הכי מלאה |
| `text_only` | טקסט המחבר בלבד | ללא ה"רעש" של ההגה"ה |
| `text+hilchot_group` | טקסט + שם הנושא | מסייעת לחיפוש לפי נושא |

### מצבי חלוקה אפשריים

| מצב | מה זה | גודל |
|-----|--------|------|
| `seif` | צ'אנק אחד לכל סעיף (ברירת מחדל) | 4,169 צ'אנקים |
| `siman` | צ'אנק אחד לכל סימן (כל הסעיפים ביחד) | 697 צ'אנקים |
| `sliding_window` | חלונות של מספר מילים קבוע | משתנה |

### הפונקציות הראשיות

```python
load_schema(path)
# קלט: נתיב ל-JSON
# פלט: מילון Python עם כל הנתונים

build_tables(schema, variants)
# קלט: schema + רשימת גרסאות מה-config
# פלט: רשימת גרסאות, כל גרסה עם רשימת צ'אנקים

build_dataframe(schema, chunk_fields, siman_fields, mode)
# קלט: schema + הגדרות שדות + מצב חלוקה
# פלט: DataFrame עם כל הצ'אנקים שטוחים
```

---

## 7. תהליך מס' 5 — הטמעת וקטורים (Embedder)

**קבצים**: `embedder/embed.py`, `embedder/__init__.py`

### מה הוא עושה?

ממיר כל צ'אנק טקסט ל**וקטור מספרי** (Embedding) בגודל 1024 מספרים, ושומר הכל ב-ChromaDB — מסד נתונים וקטורי שמאפשר חיפוש מהיר.

### קלט

```
data/chunks.json    ← הצ'אנקים מהשלב הקודם (נתיב מה-config)
```

### פלט

```
embedder/chroma_db/       ← ChromaDB עם כל הוקטורים
```

כל רשומה ב-ChromaDB:
```python
{
  "id": "text+hagah__siman_1_seif_1",
  "document": "ישתדל אדם לעמוד בבוקר...",
  "embedding": [0.0503, -0.0201, ..., 0.0000],  # 1024 מספרים
  "metadata": {
    "siman": 1,
    "seif": 1,
    "type_text": "text+hagah"
  }
}
```

### מה קורה בפנים?

```
צ'אנקים מה-JSON
    ↓
הוספת prefix: "passage: " + טקסט
    ↓ (למשל: "passage: סימן 1, סעיף 1: ישתדל אדם...")
מודל multilingual-e5-large (1024 מימדים)
    ↓ קידוד בקבוצות של 32
וקטור float32 מנורמל (L2-normalized)
    ↓
שמירה ב-ChromaDB
```

### המודל: multilingual-e5-large

- מודל שפה רב-לשוני של Microsoft/Hugging Face
- מאומן על pairs של שאלות-תשובות
- מייצר וקטורים של 1024 מימדים
- **חובה**: להוסיף `"passage: "` לפני טקסט, `"query: "` לפני שאלה — ללא זה הביצועים יורדים משמעותית

### הפונקציות הראשיות

```python
load_tables(path)
# קלט: נתיב ל-chunks.json (קובץ הצ'אנקים)
# פלט: רשימת (type_text, רשימת צ'אנקים)

build_encoding_texts(chunks, prefix)
# קלט: צ'אנקים + prefix
# פלט: רשימת מחרוזות מוכנות לקידוד

embed(texts, model, batch_size)
# קלט: מחרוזות
# פלט: מטריצה NumPy בגודל (N, 1024)

encode_query(query, model, prefix)
# קלט: שאלה בעברית
# פלט: וקטור (1024,)

store_in_chroma(tables, chroma_dir, collection_name)
# קלט: גרסאות הצ'אנקים עם הוקטורים
# פלט: שמירה ב-ChromaDB (ללא ערך מוחזר)

get_existing_type_texts(chroma_dir, collection_name)
# קלט: נתיב ל-ChromaDB
# פלט: set של גרסאות שכבר הוטמעו — כדי לא לחזור עליהן
```

---

## 8. תהליך מס' 6 — שליפה (Retriever)

**קבצים**: `retrievers/base.py`, `retrievers/chroma_retriever.py`, `retrievers/__init__.py`

### מה הוא עושה?

מקבל שאלה, ממיר אותה לוקטור, ומחפש ב-ChromaDB את הצ'אנקים הקרובים ביותר מבחינה סמנטית.

### קלט

```python
query = "מה דין ציצית?"
top_k = 5
```

### פלט

```python
[
  {
    "rank": 1,
    "chunk_id": "text+hagah__siman_8_seif_1",
    "score": 0.8661,
    "text": "מצות עשה ללבוש ציצית...",
    "siman": 8,
    "seif": 1,
    "type_text": "text+hagah"
  },
  ...
]
```

### מה קורה בפנים?

```
שאלה: "מה דין ציצית?"
    ↓
encode_query("query: מה דין ציצית?")  ← מוסיפים prefix חשוב
    ↓ וקטור (1024,)
ChromaDB: חיפוש cosine similarity מול 12,500 וקטורים
    ↓ similarity = dot product (כי הוקטורים מנורמלים)
דירוג לפי ציון + החזרת top_k
```

### שלושה Retrievers

| Retriever | קובץ | סטטוס | הערות |
|-----------|------|--------|-------|
| `ChromaRetriever` | `chroma_retriever.py` | **מומלץ** | משתמש ב-ChromaDB, תומך בגרסאות |
| `NpyRetriever` | `npy_retriever.py` | Legacy | CSV + קובץ NPY עם מטריצה |
| `SemanticE5SeifV6CombinedRetriever` | `semantic_e5_seif_v6_combined.py` | Legacy | נתיבים קשיחים |

### שימוש ב-ChromaRetriever

```python
from retrievers import get_retriever

# גרסה אחת
r = get_retriever("chroma", type_text="text+hagah")
results = r.retrieve("מה דין ציצית?", top_k=5)

# כל הגרסאות בנפרד
r = get_retriever("chroma", type_text=None)
results_by_variant = r.retrieve_by_variant("מה דין ציצית?", top_k=5)
# {"text+hagah": [...], "text_only": [...], "text+hilchot_group": [...]}
```

---

## 9. תהליך מס' 7 — הערכה (Evaluation)

**קבצים**: `evaluation/retrieval_evaluator.py`, `evaluation/base.py`

### מה הוא עושה?

בודק כמה טוב ה-Retriever — כמה פעמים הוא מוצא את הסימן הנכון ב-K התוצאות הראשונות.

### קלט

```
data/eval/sa_eval.csv    ← 596 שאלות עם תשובות נכונות
```

כל שורה (עמודות בעברית):
```csv
#, שאלה, תשובה, סימן, סעיף
1, "מה דין ציצית?", "מצות עשה ללבוש ציצית...", 8, 1
```

### פלט

```python
{
  "evaluator": "retrieval",
  "granularity": "unique-siman",
  "metrics": {
    "recall_at": {"1": 59, "3": 79, "5": 94, "10": 147, "18": ..., "30": ..., "50": ...},
    "recall_rate": {"1": 0.59, "3": 0.79, "5": 0.94, "10": 1.0, ...},
    "mrr": 0.686
  },
  "n_questions": 596,
  "elapsed_sec": 45.3,
  "target_passed": true
}
```

### מה קורה בפנים?

```
לכל אחת מ-596 השאלות:
    1. שולפים top_k תוצאות
    2. מוצאים את הדירוג של הסימן הנכון
    3. Recall@K: האם הסימן נמצא בתוצאות K הראשונות?
    4. MRR: 1/דירוג (אם נמצא), 0 (אם לא)

בסוף: ממוצע על כל 596 השאלות
```

### המדדים

**Recall@K** — כמה שאלות (באחוזים) הסימן הנכון שלהן נמצא בתוצאות K הראשונות
- Recall@1 = 59% — בכמעט 6 מתוך 10 שאלות, התוצאה הראשונה נכונה
- Recall@3 = 79% — ב-8 מתוך 10 שאלות, אחת מ-3 התוצאות הראשונות נכונה
- Recall@5 = 94% — ב-9.4 מתוך 10 שאלות, אחת מ-5 הראשונות נכונה

**MRR (Mean Reciprocal Rank)** — ממוצע של 1/דירוג. MRR=0.686 אומר שהדירוג הממוצע של התשובה הנכונה הוא 1/0.686 ≈ 1.46 — כלומר, בממוצע התשובה הנכונה מופיעה כמעט ראשונה.

**Granularity — unique-siman**:
המערכת סופרת לפי **סימן** (פרק), לא סעיף — כי שאלה יכולה להיות רלוונטית למספר סעיפים באותו סימן.

---

## 10. תהליך מס' 8 — ממשק המשתמש (Chat UI)

**קבצים**: `chat-ui/server.py`, `chat-ui/index.html`, `chat-ui/api/`

### מה הוא עושה?

ממשק ווב בעברית (RTL) שמאפשר:
1. לשאול שאלות ולקבל תשובות עם/בלי RAG
2. לעיין ב-596 שאלות הבנצ'מרק
3. לראות סטטיסטיקות השוואה ולהצביע על תשובה טובה יותר

### הרצה

```bash
cd chat-ui
python server.py
# פותח על http://localhost:3000
```

### ארכיטקטורת ה-API

```
GET  /             → index.html (ממשק)
POST /api/chat     → api/chat.py
GET  /api/eval     → api/eval.py
GET  /api/prompts  → api/prompts.py
```

### POST /api/chat

**קלט** (JSON):
```json
{
  "messages": [{"role": "user", "content": "מה דין ציצית?"}],
  "use_rag": true,
  "top_k": 3
}
```

**מה קורה בפנים**:
```
קלט מהמשתמש
    ↓
ChromaRetriever.retrieve(שאלה, top_k=3)
    ↓ 3 קטעים רלוונטיים
בניית prompt: [system prompt] + [קטעים] + [שאלה]
    ↓
OpenAI GPT-4o-mini
    ↓
```

**פלט** (JSON):
```json
{
  "reply": "ציצית היא מצות עשה...",
  "chunks": [
    {"siman": 8, "seif": 1, "score": 0.87, "text": "..."},
    {"siman": 9, "seif": 1, "score": 0.81, "text": "..."},
    {"siman": 10, "seif": 1, "score": 0.76, "text": "..."}
  ]
}
```

### GET /api/eval

מחזיר את כל 596 שאלות הבנצ'מרק כ-JSON.

### GET /api/prompts

מחזיר את ה-system prompts (עם RAG ובלי RAG), כדי שהממשק יציג אותם.

### שלושת הלשוניות בממשק

| לשונית | מה יש בה |
|--------|---------|
| שאלות מאגר | עיון ב-596 שאלות, סינון לפי סימן |
| השוואה | שאלה אחת → 2 תשובות (עם RAG / בלי) → הצבעה |
| סטטיסטיקות | תוצאות ההצבעות + גרפים של מדדי שליפה |

---

## 11. זרימת הנתונים מקצה לקצה

```
[Sefaria API]
    ↓ build_source_from_sefaria.py
data/source_original/data_fixed.txt
    ↓ data/scripts/build_shulchan_aruch_rag.py
data/processed/shulchan_aruch_rag.json
    ↓ data/scripts/add_breadcrumb_to_json.py
data/processed/shulchan_aruch_rag_with_breadcrumb.json
    ↓ chunker/main.py + config.yaml
data/chunks.json            (12,500 צ'אנקים, 3 גרסאות)
    ↓ embedder/embed.py
embedder/chroma_db/         (12,500 וקטורים 1024-מימדיים)
    ↓
─────────────── זמן ריצה ───────────────
    ↓
שאלה מהמשתמש: "מה דין ציצית?"
    ↓ encode_query()
וקטור שאלה (1024,)
    ↓ ChromaRetriever.retrieve()
top-K קטעים רלוונטיים
    ↓ chat-ui/api/chat.py
GPT-4o-mini עם הקשר
    ↓
תשובה מנומקת למשתמש
```

---

## 12. תוצאות הניסויים

הטבלה הבאה מציגה את הניסוי הטוב ביותר שהושג (ניסוי #028):

| מדד | ערך |
|-----|-----|
| Recall@1 | 63.76% |
| **Recall@3** | **80.03%** |
| Recall@5 | 88.76% |
| Recall@10 | 88.59% |
| MRR | 0.727 |
| מספר שאלות | 596 |
| מודל | multilingual-e5-large |
| גרסת טקסט | Combined (text + סיכום מודרני + שאלות GPT) |

> **פרשנות**: ב-8 מתוך 10 שאלות, אחת מ-3 התוצאות הראשונות היא מהסימן הנכון — ביצוע טוב מאוד למשימה בעברית על טקסטים עתיקים.

---

## 13. ביקורת הקוד — מה לא טוב ועצות לשיפור

פרק זה מציג ניתוח ביקורתי של הקוד כפי שהוא היום, מה לא עובד טוב, ועצות לשיפור.

---

### 13.1 ארכיטקטורה ועקביות

#### בעיה: שלושה Retrievers, שניים מהם מתים

יש שלושה מימושי Retriever בקוד:
- `ChromaRetriever` — פעיל ומומלץ
- `NpyRetriever` — Legacy, משתמש בנתיבים קשיחים
- `SemanticE5SeifV6CombinedRetriever` — Legacy, נתיבים קשיחים, לא עוד מתוחזק

הקוד הישן לא נמחק, מה שיוצר בלבול — מי שיבוא לפרויקט לא יודע מה לבחור.

**עצה**: מחק את `npy_retriever.py` ו-`semantic_e5_seif_v6_combined.py`, או העבר אותם ל-`retrievers/legacy/` עם הערה ברורה.

---

#### בעיה: `experiments/exp_main.py` ו-`main.py` זהים לחלוטין

שני הקבצים מכילים אותו קוד בדיוק (load config → build_tables → embed). לא ברור מי "האמיתי" — שניהם ריצה זהה, מה שיוצר בלבול ויכול לגרום לשינויים שנעשים רק באחד מהם.

**עצה**: מחק את אחד מהם. הישאר עם `main.py` בשורש כ-CLI ברור, ומחק את `experiments/exp_main.py`.

---

#### בעיה: `main.py` בשורש הפרויקט — מיותר

```python
# main.py בשורש — "Legacy RAG query loop template"
```

הקובץ הזה לא משמש לכלום בפועל — ה-UI ו-evaluator הם נקודות הכניסה האמיתיות.

**עצה**: מחק אותו, או הפוך אותו ל-CLI שימושי.

---

### 13.2 ניהול תצורה (Configuration)

#### בעיה: נתיבים קשיחים בכמה מקומות

ב-`chroma_retriever.py`:
```python
chroma_dir="embedder/chroma_db"  # נתיב יחסי קשיח
```

ב-`chat.py`:
```python
# הנתיב ל-ChromaDB מוגדר ישירות בקוד
```

אם מישהו מריץ את הקוד מתיקייה שונה, הכל נשבר.

**עצה**: כל הנתיבים צריכים לבוא מ-`config.yaml`, ולהיות יחסיים לשורש הפרויקט. השתמש ב-`pathlib.Path(__file__).parent.parent / "embedder/chroma_db"` כ-fallback.

---

#### בעיה: שני קבצי config

```
config/config.yaml
config/config_template.yaml
```

לא ברור מה ההבדל ביניהם, ומי משתמש באיזה.

**עצה**: מחק את ה-template, או הוסף הסבר ברור בראש כל אחד.

---

### 13.3 ה-Chat UI

#### בעיה: שרת ה-HTTP בנוי ידנית ב-`server.py`

```python
class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # ניתוב ידני, parsing ידני
```

זה שביר ומסורבל — אין handling של שגיאות מסוג CORS, אין middleware, אין ניהול session.

**עצה**: עבור ל-FastAPI (כבר יש `requirements.txt`!) — הכל הופך לפשוט יותר, ומקבלים בחינם docs אוטומטי.

```python
# במקום 80 שורות של handler ידני:
from fastapi import FastAPI
app = FastAPI()

@app.post("/api/chat")
async def chat(body: ChatRequest):
    ...
```

---

#### בעיה: OPENAI_API_KEY נטען בצורה שונה בכל מקום

ב-`server.py`:
```python
load_dotenv(".env")
```

ב-`chat.py`:
```python
# אולי מניח שה-key כבר ב-environment
```

**עצה**: יצור קובץ `chat-ui/config.py` אחד שמנהל את כל הסביבה — key, model name, top_k — ויוביל מ-`server.py`.

---

#### בעיה: אין error handling ב-`api/chat.py`

אם ה-ChromaRetriever נכשל (ChromaDB לא קיים, model לא הורד), ה-API קורס ללא הודעת שגיאה ברורה למשתמש.

**עצה**: הוסף try/except ברמת ה-handler, ותחזיר JSON עם `{"error": "הסבר"}` במקום stack trace גולמי.

---

### 13.4 מנגנון ה-Embedding

#### בעיה: אין validation שה-prefix נכון

המודל E5 דורש `"passage: "` לפני טקסט ו-`"query: "` לפני שאלה. אם מישהו קורא ל-`encode_query()` ידנית בלי להבין זאת, הביצועים יורדים בצורה דרמטית — ואין שום אזהרה.

**עצה**: הוסף assertion או לפחות warning אם ה-prefix לא מופיע.

---

#### בעיה: הטמעה מחדש של כל הגרסאות גם אם השתנתה רק גרסה אחת

`get_existing_type_texts()` בודק אם גרסה כבר קיימת ב-ChromaDB, אבל אין גרסאות / hash לכל צ'אנק. אם שינית את הטקסט, לא תדע שצריך להטמיע מחדש.

**עצה**: שמור hash של ה-chunks_siman.json ב-ChromaDB metadata. אם ה-hash השתנה — הטמע מחדש אוטומטית.

---

### 13.5 הערכה (Evaluation)

#### בעיה: `llm_evaluator.py` הוא stub שזורק שגיאה

```python
class LLMEvaluator(BaseEvaluator):
    def evaluate(self, ...):
        raise NotImplementedError("Not yet implemented")
```

הקובץ רשום ב-registry כאילו הוא קיים. מי שינסה להשתמש בו יקבל שגיאה בלתי-ברורה.

**עצה**: הסר אותו מה-registry עד שיהיה מימוש, או הוסף comment ברור: "WIP — לא להשתמש".

---

#### בעיה: שאלות הבנצ'מרק (sa_eval.csv) — לא ברור מאיפה הן

האם נוצרו ידנית? על ידי GPT? על ידי בני אדם? זה קריטי להבין את איכות ה-benchmark.

**עצה**: תעד את מקור השאלות ב-README של `data/eval/`.

---

### 13.6 תיעוד וניקיון

#### בעיה: `CLAUDE.md` בתוך `chunker/`

```
chunker/CLAUDE.md  ← קובץ guardian שדורש אישור לפני עריכה
```

זה קובץ הגדרות ל-Claude Code, לא תיעוד פרויקט. הוא לא שייך לתוך `chunker/`, ועלול לבלבל תורמים.

**עצה**: העבר אותו ל-`.claude/` בשורש הפרויקט.

---

#### בעיה: שני cache files גדולים ב-`data/` שלא ברור מה מצבם

```
data/seif_questions_gpt_cache.json    ← "Legacy"
data/seif_modern_summary_cache.json   ← "Legacy"
```

האם עוד משתמשים בהם? האם הם חלק מהגרסה הטובה ביותר (ניסוי #028)?

**עצה**: אם לא בשימוש — מחק. אם כן — תעד מאיפה הגיעו ואיך נוצרו.

---

### 13.7 ביצועים

#### ✅ Retriever כ-singleton — כבר מיושם נכון

`chat.py` כבר מגדיר את ה-Retriever כ-singleton ברמת המודול:

```python
_retriever = get_retriever("chroma", type_text="text+hagah")  # פעם אחת בלבד
```

זה אומר שהמודל נטען פעם אחת בעת אתחול השרת, ולא בכל בקשה — דפוס נכון לחלוטין.

---

#### בעיה: batch_size קשיח ב-embed.py

```python
batch_size: 32  # בconfig.yaml
```

מכונות עם GPU שונות צריכות batch_size שונה. על CPU — 32 אולי גדול מדי. על GPU חזקה — 32 קטן מדי.

**עצה**: חשב batch_size אוטומטית לפי זיכרון זמין, או לפחות תעד את הסיבה ל-32.

---

### סיכום — מה לתקן לפי עדיפות

| עדיפות | בעיה | קושי |
|--------|------|------|
| 🔴 גבוה | הסר Legacy Retrievers | קל |
| 🔴 גבוה | fix error handling ב-chat.py | קל |

| 🟡 בינוני | עבור מ-server.py ל-FastAPI | בינוני |
| 🟡 בינוני | כל הנתיבים מ-config בלבד | בינוני |
| 🟡 בינוני | תעד את מקור השאלות בבנצ'מרק | קל |
| 🟢 נמוך | hash-based cache invalidation | קשה |
| 🟢 נמוך | LLMEvaluator מימוש אמיתי | קשה |

---

## 14. Quick Start — הרצה מאפס

> מדריך שלב-אחר-שלב להרצת המערכת כולה על מכונה חדשה.

### דרישות מקדימות

```bash
pip install -r requirements.txt
# כולל: sentence-transformers, chromadb, openai, pandas, pyyaml, tqdm
```

דרוש: `OPENAI_API_KEY` בקובץ `chat-ui/.env`

### שלב 0 — הטקסט כבר קיים

`data/source_original/data_fixed.txt` כבר בפרויקט — אין הורדה נדרשת. ממשיכים ישר לשלב 1.

### שלב 1 — עיבוד הטקסט

```bash
python data/scripts/build_shulchan_aruch_rag.py
# → data/processed/shulchan_aruch_rag.json

python data/scripts/add_breadcrumb_to_json.py
# → data/processed/shulchan_aruch_rag_with_breadcrumb.json
```

### שלב 2 — יצירת צ'אנקים

```bash
python chunker/main.py
# קורא מ: data/processed/shulchan_aruch_rag_with_breadcrumb.json
# → data/chunks.json (3 גרסאות × 4,169 סעיפים)
```

### שלב 3 — הטמעת וקטורים (ChromaDB)

```bash
python embedder/embed.py --chunks data/chunks.json
# הורדת המודל בפעם הראשונה: ~2GB, ~15 דקות
# קידוד: ~30 דקות על CPU, ~5 דקות על GPU
# → embedder/chroma_db/ (ChromaDB collection)
```

> אם הגרסה כבר קיימת ב-ChromaDB, השלב מדולג אוטומטית.

### שלב 4 — הרצת הממשק

```bash
cd chat-ui
cp .env.example .env      # ואז הכנס OPENAI_API_KEY
python server.py
# → http://localhost:3000
```

### שלב 5 — הרצת הערכה (אופציונלי)

```python
from retrievers import get_retriever
from evaluation import get_evaluator
import pandas as pd

retriever = get_retriever("chroma", type_text="text+hagah")
evaluator = get_evaluator("retrieval")
df = pd.read_csv("data/eval/sa_eval.csv")
result = evaluator.evaluate(retriever, df)
print(evaluator.format_report(result))
```

---

## 15. הוספת Retriever חדש

המערכת בנויה כך שניתן להוסיף retriever חדש בשלושה צעדים בלבד.

### שלב 1 — צור את הקלאס

```python
# retrievers/my_retriever.py
from .base import BaseRetriever
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

class MyRetriever(BaseRetriever):
    @property
    def name(self) -> str:
        return "my_retriever"

    def __init__(self, **_ignored):
        self._model = self._embeddings = self._chunks = None

    def _load(self):
        if self._model:
            return
        self._model = SentenceTransformer("intfloat/multilingual-e5-large")
        base = Path(__file__).resolve().parent.parent
        self._embeddings = np.load(str(base / "MY_EMBEDDINGS.npy"))
        import json
        with open(base / "MY_CHUNKS.json", encoding="utf-8") as f:
            self._chunks = json.load(f)

    def retrieve(self, query: str, top_k: int = 10) -> list[dict]:
        self._load()
        qvec = self._model.encode("query: " + query, normalize_embeddings=True)
        scores = self._embeddings @ qvec
        top_idx = np.argsort(scores)[-top_k:][::-1]
        return [
            {
                "rank": r + 1,
                "chunk_id": self._chunks[i].get("chunk_id", i),
                "score": round(float(scores[i]), 4),
                "text": self._chunks[i]["text"],
                "siman_parent": self._chunks[i].get("siman", 0),
                "siman": self._chunks[i].get("siman", 0),
                "seif": self._chunks[i].get("seif", 0),
            }
            for r, i in enumerate(top_idx)
        ]
```

### שלב 2 — רשום ב-Registry

```python
# retrievers/__init__.py — הוסף:
from .my_retriever import MyRetriever
REGISTRY["my_retriever"] = MyRetriever
```

### שלב 3 — הרץ הערכה

```python
from retrievers import get_retriever
from evaluation import get_evaluator
import pandas as pd

r = get_retriever("my_retriever")
evaluator = get_evaluator("retrieval")
df = pd.read_csv("data/eval/sa_eval.csv")
result = evaluator.evaluate(r, df)
print(evaluator.format_report(result))
```

---

## 16. ציר הזמן של הניסויים — מה עבד ומה לא

### הסיפור של 28 הניסויים

כל ניסוי ניסה שינוי אחד ממוקד — כדי להבין בדיוק מה עוזר.

```
exp_001–003: E5-small → E5-large              R@3: 34% → 38%
exp_004–009: ניקוי טוב יותר + chunking שונה  R@3: 38% → 56%
exp_010–011: הוספת context_prefix + סיכום GPT R@3: 60%
exp_012–013: פיצול לסעיפים (4,169 סעיפים)    R@3: 60.4%
─────── גילוי: exp_001–021 נמדדו עם באג! ──────
exp_022: תיקון extract_siman (גרש)            R@3: 60.4% → 74.66% (+14%!!)
exp_023: HyDE (GPT מייצר השערה)              R@3: 69.1%  ✗ (פחות טוב)
exp_024: Doc2Query (שאלות מבוססות-כללים)     R@3: 75.84%
exp_025: שאלות GPT מומחה                     R@3: 78.02% ★
exp_026: סיכום מודרני בעברית (GPT)            R@3: 78.02%, R@10: 90.10% ★
exp_027: BGE אנגלית + תרגום                   R@3: 62.25% ✗✗ (כשלון)
exp_028: Combined (סיכום + שאלות)            R@3: 80.03% ★★★
```

### הבאג הגדול — exp_022

בניסויים 1–21 של הפרויקט הישן (לפני הארכיטקטורה הנוכחית), פונקציית `extract_siman` שברה על מספרי גימטריה עם גרש:

```python
# BROKEN: תרמ"ג → 640 (במקום 643)
re.findall(r"[א-ת]+", "תרמ\"ג")  # עצרת בגרש

# FIXED:
re.findall(r'[א-ת"\'׳״]+', "תרמ\"ג")  # כולל גרש ב-pattern
```

**השפעה**: כשתוקן הבאג, כל המדדים קפצו ב-~13% בבת אחת — לא כי המערכת השתפרה, אלא כי ההערכה עצמה הייתה שגויה.

> **שים לב**: הקוד הנוכחי (`evaluation/retrieval_evaluator.py`) קורא `int(row.siman)` ישירות מעמודת ה-CSV — אין parsing גימטריה בכלל. הבאג כבר אינו רלוונטי לקוד שלפנינו.

### הלקח מ-exp_027 — אנגלית כישלון

ניסיון להשתמש במודל BGE אנגלי + תרגום הטקסט לאנגלית הוביל ל-R@3 של 62.25% בלבד — פחות מבסיס הבסיס. הסיבה: תרגום של טקסט הלכתי עתיק מאבד ניואנסים קריטיים שאין להם מקבילה מדויקת באנגלית.

### exp_028 — ה-Combined שהצליח

הניסוי הטוב ביותר משלב **שלוש שכבות מידע** בכל סעיף:

```
encoding_text =
    context_prefix  +  text  +  modern_summary  +  gpt_questions

דוגמה לסעיף 4.1:
┌─────────────────────────────────────────────────────────────────┐
│ Shulchan Arukh, Orach Chayim, Siman 4, Seif 1:                  │  ← עוגן טקסטואלי
│ ישתדל אדם לעמוד בבוקר כארי לעבודת בוראו...                      │  ← טקסט מקורי
│ יש לקום בבוקר בזריזות לעבודת ה'...                               │  ← סיכום מודרני (GPT)
│ מתי יש לקום? מדוע נדרשת זריזות? מה מעלת השכמת הבוקר?            │  ← שאלות GPT
└─────────────────────────────────────────────────────────────────┘
ממוצע: 162 מילים לסעיף (לעומת 44 מילים בבסיס)
```

**למה זה עוזר**: כשמישהו שואל בשפה מודרנית, הסיכום המודרני "מגשר" בין הוויקבולרי המודרני לטקסט הקדום. השאלות GPT מוסיפות semantic precision — המודל מוצא סעיפים שעונים על שאלות דומות.

### טבלת כל הניסויים

| ניסוי | שיטה | R@1 | R@3 | R@10 | MRR |
|-------|------|-----|-----|------|-----|
| 001 | E5-small | 22.9% | 34.1% | 48.7% | 0.286 |
| 013 ⚠️ | E5-seif (עם באג) | 48.0% | 60.4% | 73.0% | 0.557 |
| **022** | E5-seif (תוקן) | 59.23% | 74.66% | 88.93% | 0.686 |
| 023 | HyDE | 51.2% | 69.1% | 82.6% | 0.616 |
| 024 | Doc2Query | 61.24% | 75.84% | 87.58% | 0.698 |
| 025 | שאלות GPT | 63.42% | 78.02% | 88.59% | 0.719 |
| 026 | סיכום מודרני | 63.26% | 78.02% | **90.10%** | 0.721 |
| 027 | BGE אנגלית | 45.64% | 62.25% | 74.50% | 0.554 |
| **028 ★** | **Combined** | **63.76%** | **80.03%** | 88.76% | **0.727** |

> ⚠️ exp_001–021: ערכים נמוכים ב-~13% בגלל באג ב-`extract_siman`.

### מה עצר אותנו ב-80%? (Glass Ceiling)

גם הגרסה הטובה ביותר נתקעת ב-80% Recall@3. הסיבות:

1. **סימנים דלי-תוכן**: סימן 620 = 15 מילים בסך הכל. הוקטור שלו "חלש" — אין מספיק טקסט לייצג אותו.
2. **סימן 4 (נטילת ידיים)**: 15+ סעיפים עם תוכן דומה מאוד — המודל מבלבל ביניהם.
3. **57 שאלות** שכנראה דורשות fine-tuning ספציפי לתחום.

**הצעד הבא המומלץ**: Fine-tune של מודל E5 על זוגות שאלה–סעיף ספציפיים לשולחן ערוך.

---

## 17. מודל E5 — למה דווקא הוא?

### השוואת מודלים שנוסו

| מודל | R@3 | הסיבה לכישלון |
|------|-----|----------------|
| E5-small | 34% | קטן מדי (118M פרמטרים) |
| mBERT | 12% | אינו sentence encoder — ארכיטקטורה לא מתאימה לדמיון |
| heBERT | 35% | ספציפי לעברית אבל גם אינו sentence encoder |
| DictaBERT | 35% | אותה בעיה |
| BGE-large-en | 62% | אנגלית בלבד + תרגום מאבד ניואנס הלכתי |
| **E5-large** | **80%** | Multilingual sentence encoder, 1024 מימדים, cross-lingual alignment |

### מה מיוחד ב-E5?

**E5** (Embeddings from bidirEctional Encoder representations) פותח על ידי Microsoft Research.

**האימון**: E5 אומן על מיליארדי זוגות טקסט בשיטת **Contrastive Learning** — כל זוג מורכב מטקסט (passage) ושאלה שהוא עונה עליה. המודל לומד לקרב וקטורים של passage ושאלה רלוונטיים, ולהרחיק וקטורים של passage ושאלה לא-רלוונטיים.

**למה זה עובד בעברית עתיקה?**

E5-large תומך ב-100+ שפות. למרות שאינו מאומן ספציפית על עברית קלאסית, האימון הרב-לשוני יוצר **cross-lingual alignment** — מרחב וקטורי משותף שבו "ציצית" בעברית מודרנית קרובה ל"ציצית" בעברית הקלאסית.

**הסבר ה-prefix הנדרש:**

```python
# ✅ נכון:
model.encode("passage: " + seif_text)   # לטקסטים
model.encode("query: "   + question)    # לשאלות

# ❌ שגוי — ביצועים יורדים משמעותית:
model.encode(seif_text)
model.encode(question)
```

הסיבה: E5 אומן עם ה-prefix הזה — הוא מסמן למודל אם הטקסט הוא "מסמך לחיפוש" או "שאלה שחיפשים". ללא ה-prefix, המודל מניח שהכל הוא passage, וה-alignment נשבר.

**נורמליזציה:**

```python
model.encode(..., normalize_embeddings=True)
# → וקטור L2-normalized (אורך 1)
# → cosine similarity = dot product (מהיר יותר)
# → ניתן לחשב עם embeddings @ query_vec (מטריצה × וקטור)
```

### מה לנסות בהמשך?

| אפשרות | פוטנציאל | קושי |
|--------|---------|------|
| Fine-tune E5 על שאלות–סעיפים של שולחן ערוך | גבוה | גבוה (צריך 10K+ זוגות) |
| ColBERT (late interaction) | בינוני | בינוני |
| Reranker (cross-encoder) אחרי E5 | בינוני | קל יחסית |
| BM25 Hybrid (מילות מפתח + סמנטי) | בינוני | קל |

---

## 18. Troubleshooting — שגיאות נפוצות ופתרונות

### שגיאה: ChromaDB לא נמצא

```
FileNotFoundError: ChromaDB not found at embedder/chroma_db
```

**פתרון**: יש להריץ קודם את שלב ההטמעה:
```bash
python -m embedder.embed --chunks data/chunks.json
```

---

### שגיאה: המודל לא הורד

```
OSError: Can't load model 'intfloat/multilingual-e5-large'
```

**פתרון**: נדרש חיבור אינטרנט בהורדה הראשונה (~2GB). הרץ:
```bash
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('intfloat/multilingual-e5-large')"
```
המודל נשמר ב-cache מקומי (`~/.cache/huggingface/`) ולא מורד שוב.

---

### שגיאה: חסר OPENAI_API_KEY

```
openai.AuthenticationError: No API key provided
```

**פתרון**: צור קובץ `chat-ui/.env`:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini   # אופציונלי
```

---

### בעיה: הוספת גרסה חדשה לא נקלטת ב-ChromaDB

אם הוספת `type_text` חדש ל-config אבל הוא לא מופיע בתוצאות:

```bash
# ודא שהגרסה אכן קיימת ב-ChromaDB:
python -c "
from embedder.embed import get_existing_type_texts
from pathlib import Path
print(get_existing_type_texts(Path('embedder/chroma_db'), 'shulchan_arukh_seifs'))
"
```

אם הגרסה לא מופיעה — הרץ שוב את שלב ההטמעה.

---

### בעיה: הטמעה חוזרת של גרסאות שכבר קיימות

```
Skipping type_text='text+hagah' — already in ChromaDB
```

זה **לא שגיאה** — זו התנהגות מכוונת. אם שינית את הטקסט ורוצה הטמעה מחדש, מחק את תיקיית ChromaDB:
```bash
rm -rf embedder/chroma_db/
python -m embedder.embed --chunks data/chunks.json
```

---

## 19. שכבת ה-UI — ניתוח טכני מלא

### מבנה הקבצים

```
chat-ui/
├── server.py          ← שרת Python המריץ הכול
├── index.html         ← ממשק גרפי (HTML/CSS/JS, קובץ יחיד)
├── .env               ← משתני סביבה (OPENAI_API_KEY וכו')
├── .env.example       ← תבנית
└── api/
    ├── chat.py        ← handler לבקשות POST /api/chat
    └── eval.py        ← handler לבקשות GET /api/eval
```

---

### ארכיטקטורת השרת

`server.py` יוצר מחלקה `LocalHandler` שיורשת בו-זמנית מ-`ChatHandler` ו-`SimpleHTTPRequestHandler`:

```
GET  /              → index.html (קובץ סטטי)
POST /api/chat      → api/chat.py → handler.do_POST()
GET  /api/eval      → api/eval.py → handler.do_GET()
```

בנוסף, `server.py` טוען אוטומטית את `.env` בעלייה, כך שאין צורך להגדיר משתני סביבה ב-shell בנפרד.

---

### ה-Retriever: בדיוק איזה קובץ ואיזה גרסה?

זו השאלה הכי חשובה טכנית. בשורה 26 של `chat-ui/api/chat.py`:

```python
_retriever = get_retriever("chroma", type_text="text+hagah")
```

זה **singleton ברמת המודול** — נוצר פעם אחת כשהשרת עולה, ולא נטען מחדש בכל בקשה.

#### מה זה בדיוק?

| פרמטר | ערך | משמעות |
|-------|-----|---------|
| retriever | `"chroma"` | `ChromaRetriever` מ-`retrievers/chroma_retriever.py` |
| `type_text` | `"text+hagah"` | גרסת הטקסט: עיקר + הגה (הערות הרמ"א) |
| `chroma_dir` | `embedder/chroma_db/` | תיקיית ChromaDB על הדיסק |
| `collection_name` | `"shulchan_arukh_seifs"` | שם ה-collection בתוך ChromaDB |
| `model` | `"intfloat/multilingual-e5-large"` | מודל ההטמעה |
| `prefix_query` | `"query: "` | קידומת E5 לשאילתות |

#### מסלול הקובץ המלא

```
embedder/chroma_db/          ← תיקיית ChromaDB (נוצרת ע"י embedder/embed.py)
└── chroma.sqlite3           ← בסיס הנתונים
    └── collection: shulchan_arukh_seifs
        └── type_text = "text+hagah"   ← הגרסה שנשלפת
```

#### למה `text+hagah` ולא גרסה אחרת?

גרסת `text+hagah` מכילה את עיקר הטקסט של השולחן ערוך **יחד עם הגה של הרמ"א** (פסיקת אשכנז). זו הגרסה העשירה ביותר — היא מכסה גם שיטת ספרד וגם שיטת אשכנז בתוך קטע אחד. הגרסאות האחרות:
- `text_only` — עיקר בלי הגה
- `text+hilchot_group` — עיקר + שם הנושא של הסימן

#### טעינה עצלה (Lazy Load)

הבנייה (`__init__`) לא טוענת את המודל. הטעינה האמיתית קורית בקריאה הראשונה ל-`retrieve()`:

```python
def _load(self):
    if self._model is not None:
        return          # כבר טעון — לא עושה כלום
    self._model = _get_model(self._model_name)   # ~1.5GB ב-RAM
    client = chromadb.PersistentClient(...)
    self._collection = client.get_collection(...)
```

**תוצאה**: הבקשה הראשונה אחרי הפעלת השרת לוקחת כמה שניות. כל הבקשות הבאות — מיידיות.

---

### זרימת בקשה מלאה — POST /api/chat

```
לקוח HTTP
    │
    ▼
do_POST() ב-ChatHandler
    │
    ├─ _read_json()          ← קריאת גוף הבקשה (Content-Length)
    ├─ _clean_messages()     ← סינון וולידציה:
    │       MAX_MESSAGES = 12       (לא שולחים יותר מ-12 הודעות אחורה)
    │       MAX_CONTENT_CHARS = 4000  (חיתוך לכל הודעה)
    │       רק roles: "user" / "assistant"
    │
    ├─ [use_rag=True]
    │       _retriever.retrieve(last_question, top_k=top_k)
    │           │
    │           ├─ encode_query("query: " + שאלה) → וקטור 1024-dim
    │           └─ ChromaDB cosine similarity → K קטעים מ-text+hagah
    │
    ├─ בניית system prompt:
    │       SYSTEM_PROMPT + "קטעים רלוונטיים:\n" + קטעים
    │
    ├─ OpenAI API:
    │       model    = OPENAI_MODEL env var  (ברירת מחדל: "gpt-4o-mini")
    │       temp     = 0.35
    │       max_tok  = 1200
    │       messages = [system] + messages_מנוקים
    │
    └─ תשובה:
            {"reply": "...", "chunks": [{siman, seif, score, text}, ...]}
```

#### פרמטרי ה-K

| מי קובע | ערך |
|---------|-----|
| ברירת מחדל בקוד | `RETRIEVER_TOP_K = 3` |
| שדה `top_k` בבקשה | 1–20 (מוגבל ב-`max(1, min(int(...), 20))`) |
| בחירה בממשק | dropdown: 1, 3, 5, 10 |

---

### נתוני הבנצ'מרק — GET /api/eval

```python
EVAL_CSV = Path(__file__).resolve().parents[2] / "data" / "eval" / "sa_eval.csv"
```

**מסלול מוחלט**: `data/eval/sa_eval.csv` (ביחס לשורש הפרויקט)

הקובץ מכיל ~596 שורות עם עמודות: `#, שאלה, תשובה, סימן, סעיף`

ה-handler טוען את הקובץ פעם אחת (`_cache`) ומחזיר JSON:
```json
[
  {"id": "1", "question": "...", "answer": "...", "siman": "8", "seif": "1"},
  ...
]
```

---

### הממשק הגרפי — שלוש הלשוניות

#### לשונית "שאלות מאגר" (Eval Tab)

- טוענת את כל 596 השאלות מ-`/api/eval` בעלייה
- חיפוש חי עם debounce של 200ms
- עמוד 50 שאלות בעמוד (PAGE_SIZE)
- כפתור "השווה" עובר ישירות ללשונית ההשוואה עם השאלה, התשובה המקורית, והסימן הצפוי

#### לשונית "השוואה" (Compare Tab)

- שולחת **שתי בקשות במקביל** (`Promise.allSettled`):
  - `use_rag: false` → GPT בלי הקשר
  - `use_rag: true` → GPT עם K קטעים מהשולחן ערוך
- מציגה את שתי התשובות זה לצד זה
- **כפתור "צ'אנקים"** — modal עם הקטעים שנשלפו, כולל סימן/סעיף וציון cosine
- **מטריקות Recall@K ו-MRR** — מחושבות client-side:
  ```
  expected_siman  = הסימן הצפוי (אם הגיע מלשונית הבנצ'מרק)
  rank            = מיקום הסימן הצפוי ברשימת הקטעים
  recall@K        = found ? 1 : 0
  MRR             = found ? 1/rank : 0
  ```
- הצבעה: שלוש אפשרויות — RAG עדיף / ללא RAG עדיף / שווה

#### לשונית "סטטיסטיקות" (Stats Tab)

- כל הנתונים שמורים ב-`localStorage`:
  - `ragCompareStats` — ספירות הצבעות + Recall/MRR מצטבר
  - `ragSeenRecall` — מניעת ספירה כפולה לאותה שאלה
  - `ragSeenVote` — מניעת הצבעה כפולה
- גרפי עמודה: RAG עדיף / ללא RAG עדיף / שווה
- טבלת מטריקות retrieval: Recall@K + MRR ממוצע

---

### הגדרות סביבה

| משתנה | חובה | ברירת מחדל | תיאור |
|-------|------|------------|-------|
| `OPENAI_API_KEY` | כן | — | מפתח API של OpenAI |
| `OPENAI_MODEL` | לא | `gpt-4o-mini` | שם המודל |

הוגדרים ב-`chat-ui/.env` (נטענים אוטומטית ע"י `server.py`).

---

### איך כדאי להשתמש ולשפר

#### המלצות שימוש נוכחי

1. **להתחיל עם K=3** — ניסוי אמפירי מראה שמעל 5 קטעים שומן ה-prompt ופוגע בדיוק
2. **לשלב עם לשונית הבנצ'מרק** — בחירת שאלה משם מפעילה מדידת Recall אוטומטית
3. **לראות את הצ'אנקים תמיד** — הם מגלים אם השליפה הצליחה לפני שמנתחים את התשובה

#### שיפורים מומלצים

| בעיה | מה קורה היום | פתרון מוצע |
|------|-------------|-------------|
| **אין streaming** | המשתמש מחכה עד קבלת כל התשובה | `stream=True` ב-OpenAI + SSE/chunked response |
| **RAG רק על הודעה אחרונה** | שאלת המשך לא מנצלת הקשר השיחה | שדה שאלה מורחב = concat היסטוריה + שאלה אחרונה |
| **top_k קשיח ב-UI** | dropdown עם 4 אפשרויות בלבד | slider 1-20 |
| **אין בחירת type_text ב-UI** | תמיד `text+hagah` | dropdown לבחירת גרסת הטקסט |
| **SYSTEM_PROMPT קשיח בקוד** | לא ניתן לשנות ללא עריכת קוד | ממשק עריכת prompt בממשק עצמו |
| **MRR מחושב ברמת סימן בלבד** | לא מביא בחשבון את הסעיף | הרחבת הזיהוי גם לסעיף |
| **localStorage בלבד** | נתונים אובדים בניקוי browser | שמירה ב-backend ב-SQLite קטן |

---

*מסמך זה נוצר ב-2026-05-11 על בסיס קריאה מלאה של כל קבצי הפרויקט.*

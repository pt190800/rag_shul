"""
chunker.py — Seif-level chunker for Shulchan Arukh RAG pipeline
================================================================
Reads Schema 2 JSON (produced by Member 1) and builds a flat DataFrame
where each row is one seif — the unit sent to the embedder.

Input JSON structure:
    {
      "title": "שולחן ערוך, אורח חיים",
      "siman_1": {
        "total_seifim": 9,
        "seifim": {
          "seif 1": "יתגבר כארי...",
          "seif 2": "לא יאמר אדם..."
        }
      },
      ...
    }

Output DataFrame columns:
    siman      (int)  — chapter number
    seif       (int)  — sub-chapter number
    siman_seif (str)  — "סימן N, סעיף M"  (matches מקור column in eval CSV)
    text       (str)  — clean seif content sent to the embedder
"""

import json
from pathlib import Path

import pandas as pd


def load_schema(json_path: str | Path) -> dict:
    """Load Schema 2 JSON from disk."""
    with open(json_path, encoding="utf-8") as f:
        return json.load(f)


def build_dataframe(schema: dict) -> pd.DataFrame:
    """
    Convert Schema 2 dict into a flat DataFrame (one row per seif).

    Args:
        schema: parsed Schema 2 JSON dict

    Returns:
        DataFrame with columns: siman, seif, siman_seif, text
        Sorted by siman then seif, with a clean integer index.
    """
    rows = []
    for key, siman_data in schema.items():
        if key == "title":
            continue
        siman_num = int(key.split("_")[1])
        for seif_key, text in siman_data["seifim"].items():
            seif_num = int(seif_key.split()[-1])  
            rows.append({
                "siman":      siman_num,
                "seif":       seif_num,
                "siman_seif": f"סימן {siman_num}, סעיף {seif_num}",
                "text":       text,
            })

    df = pd.DataFrame(rows)
    return df.sort_values(["siman", "seif"]).reset_index(drop=True)


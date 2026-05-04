import os
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv 
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import json
import uuid
import re
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import docx

# -----------------------------
# CONFIG
# -----------------------------

MODEL_NAME = None  # OpenAI removed

OUTPUT_DIR = Path("surah_json")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Minimal surah registry – extend as needed
SURAH_REGISTRY = {
    "al-Baqarah": {
        "id": 2,
        "name_ar": "البقرة",
        "name_en": "Al-Baqarah",
        "name_so": "Al-Baqarah",
        "revelation_place": "Madinah",
        "ayah_count": 286
    },
    "Aala Cimraan": {
        "id": 3,
        "name_ar": "آل عمران",
        "name_en": "Aal Imran",
        "name_so": "Aala Cimraan",
        "revelation_place": "Madinah",
        "ayah_count": 200
    }
}

TAFSEER_SOURCE = {
    "id": "tabary_so",
    "name_ar": "تفسير الطبري (صومالي)",
    "name_en": "Tafseer Tabari (Somali)",
    "language": "so"
}

app = FastAPI(
    title="Quran Tafseer (KSU-style) API",
    description="Upload a surah .docx tafseer file and get one KSU-style JSON per surah. Also serves data from MongoDB.",
    version="1.0.0"
)

# Frontend URL configuration from environment variables
# Combine specific frontend URL with wildcard for local development testing
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [frontend_url, "http://localhost:3000", "https://quran-docs-to-api.vercel.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from database import connect_to_mongo, close_mongo_connection, get_db

@app.on_event("startup")
async def startup_db_client():
    connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    close_mongo_connection()

@app.get("/api/surahs/{identifier}")
async def get_surah_db(identifier: str):
    db = get_db()
    
    surah_doc = None
    
    if identifier.isdigit():
        surah_doc = await db["surahs"].find_one({"surah.id": int(identifier)})
        
    if not surah_doc:
        # Try full string match or regex matching for names
        surah_doc = await db["surahs"].find_one({
            "$or": [
                {"surah.id": identifier},
                {"surah.name_en": {"$regex": f"^{identifier}$", "$options": "i"}},
                {"surah.name_ar": {"$regex": f"^{identifier}$", "$options": "i"}},
                {"surah.name_so": {"$regex": f".*{identifier}.*", "$options": "i"}},
                {"surah.name_en": {"$regex": f".*{identifier}.*", "$options": "i"}}
            ]
        })

    if not surah_doc:
        raise HTTPException(status_code=404, detail="Surah not found in database")
    
    # Remove the MongoDB internal _id before returning
    surah_doc.pop("_id", None)
    return JSONResponse(content=surah_doc)

@app.get("/api/surahs")
async def list_surahs():
    db = get_db()
    # Return minimal metadata for all surahs to build the UI dropdown
    cursor = db["surahs"].find({}, {"surah": 1})
    surahs = []
    async for doc in cursor:
        surahs.append(doc.get("surah"))
    return JSONResponse(content={"surahs": surahs})


# -----------------------------
# HELPERS
# -----------------------------


def extract_text_from_docx(path: Path) -> str:
    doc = docx.Document(str(path))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


def split_into_chunks(text: str, max_chars: int = 6000) -> List[str]:
    lines = text.split("\n")
    chunks, current, length = [], [], 0
    for line in lines:
        if length + len(line) + 1 > max_chars and current:
            chunks.append("\n".join(current))
            current, length = [line], len(line) + 1
        else:
            current.append(line)
            length += len(line) + 1
    if current:
        chunks.append("\n".join(current))
    return chunks


def contains_arabic(s: str) -> bool:
    return bool(re.search(r'[\u0600-\u06FF]', s))


def parse_ayahs_from_chunk(chunk: str) -> List[Dict[str, Any]]:
    """
    Heuristic parser to extract ayahs and tafseer from a text chunk.
    Looks for markers like (1), (01), (200) and splits content by them.
    Attempts to detect the Arabic ayah line (by presence of Arabic letters).
    The remaining text in the ayah block is treated as Somali tafseer.
    """
    pattern = re.compile(r'\(?0*(\d{1,3})\)')  # captures ayah number
    matches = list(pattern.finditer(chunk))
    if not matches:
        return []

    ayahs = []
    for i, m in enumerate(matches):
        num = int(m.group(1))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(chunk)
        block = chunk[start:end].strip()
        if not block:
            continue

        # Split block into lines and try to find arabic line
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        arabic = ""
        somali_lines: List[str] = []

        if lines:
            # prefer first line containing Arabic
            for idx, ln in enumerate(lines):
                if contains_arabic(ln):
                    arabic = ln
                    somali_lines = lines[idx + 1 :]
                    break
            else:
                # no explicit Arabic line found: assume first line is Arabic-like
                arabic = lines[0]
                somali_lines = lines[1:]

        somali = " ".join(somali_lines).strip()
        ayahs.append({"number": num, "arabic": arabic, "somali": somali})

    return ayahs


def merge_ayahs(ayahs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    unique = {}
    for a in ayahs:
        if a["number"] not in unique:
            unique[a["number"]] = a
    return sorted(unique.values(), key=lambda x: x["number"])


# -----------------------------
# API ENDPOINTS
# -----------------------------


@app.post("/upload-surah")
async def upload_surah(file: UploadFile = File(...)):
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="File must be a .docx Word document")

    temp_path = Path(f"temp_{uuid.uuid4()}.docx")
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    try:
        text = extract_text_from_docx(temp_path)
        chunks = split_into_chunks(text)

        all_ayahs: List[Dict[str, Any]] = []
        for chunk in chunks:
            all_ayahs.extend(parse_ayahs_from_chunk(chunk))

        merged = merge_ayahs(all_ayahs)

        surah_key = file.filename.replace(".docx", "")
        surah_meta = SURAH_REGISTRY.get(surah_key, {
            "id": None,
            "name_ar": surah_key,
            "name_en": surah_key,
            "name_so": surah_key,
            "revelation_place": None,
            "ayah_count": len(merged)
        })

        result = {
            "surah": surah_meta,
            "tafseer_source": TAFSEER_SOURCE,
            "ayahs": [
                {
                    "number": a["number"],
                    "text_ar": a["arabic"],
                    "tafseer_so": a["somali"]
                }
                for a in merged
            ]
        }

        out_path = OUTPUT_DIR / f"{surah_key}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        return JSONResponse(result)

    finally:
        if temp_path.exists():
            temp_path.unlink()


@app.get("/surah/{surah_key}")
def get_surah(surah_key: str):
    json_path = OUTPUT_DIR / f"{surah_key}.json"
    if not json_path.exists():
        raise HTTPException(status_code=404, detail="Surah JSON not found")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return JSONResponse(data)

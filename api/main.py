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

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio

import docx
from pydantic import BaseModel
from google import genai
from google.genai import types

import logging

# Set up logging for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# CONFIG
# -----------------------------

MODEL_NAME = None  # OpenAI removed

OUTPUT_DIR = Path("surah_json")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

from surah_meta import find_surah_meta
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

@app.delete("/api/surahs/{identifier}")
async def delete_surah(identifier: str):
    db = get_db()
    
    # Handle the specific request to delete 'null' IDs from the earlier bug
    if identifier.lower() == "null":
        result = await db["surahs"].delete_many({"surah.id": None})
        return JSONResponse({"message": f"Deleted {result.deleted_count} surah(s) with null ID."})
        
    query = {}
    if identifier.isdigit():
        query = {"surah.id": int(identifier)}
    else:
        # Check by name_ar, name_en, or literal id string
        query = {"$or": [
            {"surah.name_ar": {"$regex": f"^{identifier}$", "$options": "i"}},
            {"surah.name_en": {"$regex": f"^{identifier}$", "$options": "i"}},
            {"surah.id": identifier}
        ]}
        
    result = await db["surahs"].delete_one(query)
    
    if result.deleted_count > 0:
        return JSONResponse({"message": f"Successfully deleted surah: {identifier}"})
    else:
        raise HTTPException(status_code=404, detail="Surah not found")

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


def split_into_chunks(text: str, max_chars: int = 35000) -> List[str]:
    # Split by double newline first to maintain paragraph/verse structures, fallback to single newline
    paragraphs = text.split("\n\n")
    if not paragraphs or len(paragraphs) == 1:
        paragraphs = text.split("\n")

        
    chunks, current, length = [], [], 0
    for p in paragraphs:
        if length + len(p) + 2 > max_chars and current:
            chunks.append("\n\n".join(current))
            current, length = [p], len(p) + 2
        else:
            current.append(p)
            length += len(p) + 2
    if current:
        chunks.append("\n\n".join(current))
    return chunks


def contains_arabic(s: str) -> bool:
    return bool(re.search(r'[\u0600-\u06FF]', s))


class AyahExtraction(BaseModel):
    number: int
    arabic: str
    somali: str

class ChunkExtractionResult(BaseModel):
    ayahs: List[AyahExtraction]

import time

async def parse_ayahs_with_llm_async(chunk: str, semaphore: asyncio.Semaphore) -> List[Dict[str, Any]]:
    """
    Intelligent parser using Gemini Structured Outputs to extract ayahs and tafseer (Async Version).
    """
    if not chunk.strip():
        return []

    # Use the gemini client
    client = genai.Client()

    sys_prompt = """
    You are an expert Quranic text extraction tool processing a Tafseer Word Document.
    I will provide a chunk of text. Extract every single ayah.
    
    RULES:
    1. NEVER rewrite, summarize, or alter any text. Extract exact source wording.
    2. Extract verse numbers (usually found in parentheses like (1), (02)) as integers.
    3. 'arabic' field: Must only contain the original Arabic Uthmani script text.
    4. 'somali' field: Must only contain the Somali text acting as translation/tafseer. If there is NO Somali translation for an ayah in the text, return an empty string "".
    """

    max_retries = 5
    base_delay = 5
    
    async with semaphore:
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model='gemini-2.5-flash-lite',
                    contents=chunk,
                    config=types.GenerateContentConfig(
                        system_instruction=sys_prompt,
                        response_mime_type="application/json",
                        response_schema=ChunkExtractionResult,
                        temperature=0.0
                    ),
                )
                
                extracted_data = json.loads(response.text)
                
                return [
                    {
                        "number": a["number"], 
                        "arabic": a["arabic"], 
                        "somali": a["somali"]
                    } 
                    for a in extracted_data.get("ayahs", [])
                ]
            except Exception as e:
                logger.error(f"Gemini Extraction failed for chunk (attempt {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    sleep_time = base_delay * (2 ** attempt)
                    logger.info(f"Retrying in {sleep_time} seconds...")
                    await asyncio.sleep(sleep_time)
                else:
                    logger.error(f"Max retries reached. Failing chunk.")
                    return []


def merge_ayahs(ayahs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    unique = {}
    for a in ayahs:
        if a["number"] not in unique:
            unique[a["number"]] = a
    return sorted(unique.values(), key=lambda x: x["number"])


# -----------------------------
# API ENDPOINTS
# -----------------------------


JOBS: Dict[str, Dict[str, Any]] = {}

async def process_docx_background(job_id: str, temp_path: Path, filename: str):
    """
    Background worker that extracts async, safely concurrent, and stores into MongoDB.
    """
    try:
        JOBS[job_id]["status"] = "extracting_text"
        text = extract_text_from_docx(temp_path)
        chunks = split_into_chunks(text)
        
        JOBS[job_id]["status"] = "processing_llm"
        JOBS[job_id]["total_chunks"] = len(chunks)
        JOBS[job_id]["processed_chunks"] = 0
        
        all_ayahs: List[Dict[str, Any]] = []
        
        # Process chunks sequentially to respect the 15 Requests Per Minute (RPM) free-tier limit exactly
        # 15 RPM = 1 request every 4 seconds.
        semaphore = asyncio.Semaphore(1)
        
        async def process_and_update(chunk):
            try:
                res = await parse_ayahs_with_llm_async(chunk, semaphore)
                JOBS[job_id]["processed_chunks"] += 1
                return res
            except Exception as e:
                logger.error(f"Error processing chunk: {e}")
                return []

        logger.info(f"Job {job_id}: Processing {len(chunks)} chunks sequentially to respect API rate limits...")
        
        for chunk in chunks:
            res = await process_and_update(chunk)
            all_ayahs.extend(res)
            # Sleep 13.5 seconds to limit rate to strictly 4 requests per minute 
            # (gemini-2.5-flash free-tier allows exactly 5 RPM and 20 requests max per day)
            await asyncio.sleep(13.5)
        

        logger.info(f"Job {job_id}: Merging {len(all_ayahs)} ayahs...")
        merged = merge_ayahs(all_ayahs)

        surah_key = filename.replace(".docx", "")
        surah_meta = find_surah_meta(surah_key)
        surah_meta["ayah_count"] = len(merged)
        surah_meta["revelation_place"] = None

        result_doc = {
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
        
        JOBS[job_id]["status"] = "saving_db"
        logger.info(f"Job {job_id}: Saving directly to MongoDB...")
        
        db = get_db()
        # Delete any existing entries for this Surah based on name_ar to avoid duplicates
        await db["surahs"].delete_one({"surah.name_ar": surah_meta["name_ar"]})
        await db["surahs"].insert_one(dict(result_doc))
        
        # Optionally fallback to write local JSON 
        out_path = OUTPUT_DIR / f"{surah_key}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result_doc, f, ensure_ascii=False, indent=2)

        JOBS[job_id]["status"] = "completed"
        JOBS[job_id]["surah_key"] = surah_key
        logger.info(f"Job {job_id}: Completely finished.")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        JOBS[job_id]["status"] = "failed"
        JOBS[job_id]["error"] = str(e)
    finally:
        if temp_path.exists():
            temp_path.unlink()


@app.post("/upload-surah")
async def upload_surah(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Accepts Surah file upload and immediately triggers background job.
    """
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="File must be a .docx Word document")

    job_id = str(uuid.uuid4())
    temp_path = Path(f"temp_{job_id}.docx")
    
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # Register Job Context early
    JOBS[job_id] = {
        "status": "pending",
        "filename": file.filename,
        "total_chunks": 0,
        "processed_chunks": 0,
        "error": None
    }
    
    # Hand off to background runtime
    background_tasks.add_task(process_docx_background, job_id, temp_path, file.filename)

    return JSONResponse({
        "message": "Upload successful. Processing started.",
        "job_id": job_id,
        "status_url": f"/api/status/{job_id}"
    })


@app.get("/api/status/{job_id}")
async def get_job_status(job_id: str):
    """
    Get the real-time background processing status of a job.
    """
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    return JSONResponse(JOBS[job_id])


@app.get("/surah/{surah_key}")
def get_surah(surah_key: str):
    json_path = OUTPUT_DIR / f"{surah_key}.json"
    if not json_path.exists():
        raise HTTPException(status_code=404, detail="Surah JSON not found")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return JSONResponse(data)

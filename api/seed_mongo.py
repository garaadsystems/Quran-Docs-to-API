import os
import json
import asyncio
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("MONGODB_DB_NAME", "quran_db")

async def seed_database():
    if not MONGODB_URL:
        print("Error: MONGODB_URL not found in environment or .env file")
        return

    print(f"Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    surahs_collection = db["surahs"]
    
    json_dir = Path("surah_json")
    if not json_dir.exists():
        print("No surah_json directory found!")
        return

    # Clear existing data to prevent duplicates on rerun
    await surahs_collection.delete_many({})
    print("Cleared existing surahs from the database.")

    for file_path in json_dir.glob("*.json"):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                # Ensure we have a _id or structured data
                surah_metadata = data.get("surah", {})
                surah_id = surah_metadata.get("id") or file_path.stem
                
                # We'll save the whole surah JSON document in MongoDB
                document = {
                    "_id": f"surah_{surah_id}",
                    **data
                }
                
                await surahs_collection.insert_one(document)
                print(f"Inserted: {file_path.name}")
            except Exception as e:
                print(f"Error inserting {file_path.name}: {e}")
                
    client.close()
    print("Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_database())

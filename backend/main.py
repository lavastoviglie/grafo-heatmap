import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from nlp_processor import process_text

app = FastAPI()

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

class TextInput(BaseModel):
    text: str
    window_size: int = 5
    chunk_size: int = 80
    chunk_step: int = 40
    top_k_concepts: int = 20
    min_freq: int = 2

@app.post("/api/analyze")
def analyze(data: TextInput):
    result = process_text(
        text=data.text,
        window_size=data.window_size,
        chunk_size=data.chunk_size,
        chunk_step=data.chunk_step,
        top_k_concepts=data.top_k_concepts,
        min_freq=data.min_freq,
    )
    return result

@app.post("/api/upload")
async def upload(file: UploadFile = File(...), window_size: int = Form(5), top_k_concepts: int = Form(20), min_freq: int = Form(2)):
    content = await file.read()
    text = content.decode("utf-8")
    result = process_text(text=text, window_size=window_size, top_k_concepts=top_k_concepts, min_freq=min_freq)
    return result

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

from typing import Any
from io import BytesIO
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from complaint_engine.workflows import extract_complaint, update_complaint_fields
from complaint_engine.review import review_complaint
from database import DuplicateComplaintError, create_complaint, get_complaint, init_db, list_complaints, update_analysis

app = FastAPI(title="Complaint Intelligence API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def startup() -> None:
    init_db()

class ExtractionRequest(BaseModel):
    text: str
    source_name: str = "Pasted complaint"

class ComplaintRecord(BaseModel):
    fields: dict[str, Any]

class AssistantRequest(BaseModel):
    message: str
    fields: dict[str, Any]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "complaint-intelligence"}

@app.post("/api/complaints/extract")
def extract(request: ExtractionRequest) -> dict[str, Any]:
    return extract_complaint(request.text, request.source_name)

@app.post("/api/complaints/extract-file")
async def extract_file(file: UploadFile = File(...)) -> dict[str, Any]:
    filename = file.filename or "uploaded complaint"
    extension = Path(filename).suffix.lower()
    content = await file.read()
    try:
        if extension in {".txt", ".eml"}:
            text = content.decode("utf-8-sig")
        elif extension == ".pdf":
            from pypdf import PdfReader
            text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(content)).pages)
        elif extension == ".docx":
            from docx import Document
            text = "\n".join(paragraph.text for paragraph in Document(BytesIO(content)).paragraphs)
        elif extension == ".doc":
            raise ValueError("Legacy .doc files are not supported; save the document as .docx or PDF.")
        else:
            raise ValueError("Supported files are TXT, DOCX, and PDF.")
        if not text.strip():
            raise ValueError("The uploaded file contains no readable text.")
        return extract_complaint(text, filename)
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Could not read {filename}: {error}") from error

@app.post("/api/complaints")
def save_complaint(request: ComplaintRecord) -> dict[str, str]:
    try:
        record = create_complaint(request.fields)
    except DuplicateComplaintError as error:
        raise HTTPException(status_code=409, detail={"message": "Duplicate complaint", "duplicate_of": error.duplicate_of}) from error
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Could not save complaint: {error}") from error
    return {"complaint_id": record["complaint_id"], "status": "saved"}


@app.get("/api/complaints")
def get_complaints() -> list[dict[str, Any]]:
    try:
        return list_complaints()
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Could not read complaints: {error}") from error


@app.get("/api/complaints/{complaint_id}")
def get_complaint_by_id(complaint_id: str) -> dict[str, Any]:
    try:
        record = get_complaint(complaint_id)
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Could not read complaint: {error}") from error
    if record is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return record


@app.post("/api/complaints/{complaint_id}/review")
def review_saved_complaint(complaint_id: str) -> dict[str, Any]:
    try:
        record = get_complaint(complaint_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Complaint not found")
        records = list_complaints()
        analysis = review_complaint(record["fields"], records)
        saved = update_analysis(complaint_id, analysis)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Could not review complaint: {error}") from error
    return saved

@app.post("/api/complaints/update")
def update_complaint(request: AssistantRequest) -> dict[str, Any]:
    return update_complaint_fields(request.message, request.fields)

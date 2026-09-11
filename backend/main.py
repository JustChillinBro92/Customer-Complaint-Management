from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from complaint_engine.workflows import extract_complaint, update_complaint_fields
from database import create_complaint, get_complaint, init_db, list_complaints

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

@app.post("/api/complaints")
def save_complaint(request: ComplaintRecord) -> dict[str, str]:
    try:
        record = create_complaint(request.fields)
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

@app.post("/api/complaints/assistant")
def assistant(request: AssistantRequest) -> dict[str, Any]:
    return update_complaint_fields(request.message, request.fields)

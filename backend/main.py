from datetime import datetime
from typing import Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from complaint_engine.workflows import extract_complaint, update_complaint_fields

app = FastAPI(title="Complaint Intelligence API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

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
    complaint_id = f"CMP-{datetime.now().strftime('%y%m%d-%H%M%S')}"
    return {"complaint_id": complaint_id, "status": "saved"}

@app.post("/api/complaints/assistant")
def assistant(request: AssistantRequest) -> dict[str, Any]:
    return update_complaint_fields(request.message, request.fields)

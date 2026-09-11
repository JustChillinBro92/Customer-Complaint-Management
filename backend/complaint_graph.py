import json
import logging
import os
import re
from pathlib import Path
from typing import Any, TypedDict
from dotenv import load_dotenv
from langgraph.graph import END, StateGraph

# The project's .env lives beside the frontend, one level above this backend folder.
# Do not override a key supplied directly by the shell or process manager.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
logger = logging.getLogger(__name__)

def parse_json_response(content: Any) -> dict[str, Any]:
    """Parse model JSON even when it is wrapped in a markdown code fence."""
    if not isinstance(content, str):
        raise ValueError("Groq returned a non-text response")
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.IGNORECASE | re.DOTALL).strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start < 0 or end <= start:
            raise
        parsed = json.loads(cleaned[start:end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("Groq returned JSON with an unexpected shape")
    return parsed

class ComplaintState(TypedDict, total=False):
    text: str
    source_name: str
    fields: dict[str, Any]
    assistant_message: str

class AssistantState(TypedDict, total=False):
    message: str
    fields: dict[str, Any]
    field_updates: dict[str, Any]
    assistant_message: str

FIELD_NAMES = {
    "source", "customerName", "customerEmail", "productName", "productType", "strength",
    "batchNumber", "manufacturingDate", "expiryDate", "quantity", "complaintType",
    "complaintDate", "description", "initialSeverity", "priority"
}
FIELD_ALIASES = {
    "customer": "customerName", "customer_name": "customerName", "email": "customerEmail",
    "product": "productName", "batch": "batchNumber", "lot": "batchNumber",
    "severity": "initialSeverity"
}
FIELD_OPTIONS = {
    "productType": {"API", "FDF"},
    "source": {"Email", "Phone", "Web portal", "Field alert"},
    "complaintType": {"Appearance", "Packaging", "Identity", "Purity / assay", "Adverse event", "Other"},
    "initialSeverity": {"Low", "Moderate", "High", "Critical"},
    "priority": {"Low", "Medium", "High", "Critical"},
}

DEMO_FIELDS = {
    "source": "Email", "customerName": "Helix Formulations Pvt. Ltd.", "customerEmail": "quality@helixformulations.com",
    "productName": "Metformin Hydrochloride API, USP", "productType": "API", "strength": "500 mg",
    "batchNumber": "MTF-240816", "manufacturingDate": "2024-08-16", "expiryDate": "2026-08-15",
    "quantity": "12 drums", "complaintType": "Appearance", "complaintDate": "2024-09-04",
    "description": "Customer reports grey particles and visible discoloration in the API during dispensing. Retain sample review is requested.",
    "initialSeverity": "High", "priority": "High"
}

def normalize_input(state: ComplaintState) -> ComplaintState:
    return {"text": " ".join(state["text"].split())}

def fallback_fields(text: str) -> dict[str, Any]:
    fields = dict(DEMO_FIELDS)
    patterns = {"customerName": r"Customer:\s*([^\n]+)", "customerEmail": r"Email:\s*([^\n]+)", "productName": r"Product:\s*([^\n]+)", "batchNumber": r"Batch:\s*([^\n]+)", "quantity": r"Quantity affected:\s*([^\n]+)"}
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            fields[key] = match.group(1).strip()
    if text:
        fields["description"] = text[-420:]
    return fields

def extract_fields(state: ComplaintState) -> ComplaintState:
    # Groq is optional for local demo use. The deterministic parser keeps the workflow usable without secrets.
    if os.getenv("GROQ_API_KEY"):
        try:
            from langchain_groq import ChatGroq
            model = ChatGroq(model=GROQ_MODEL, temperature=0)
            response = model.invoke(f"Extract complaint JSON fields from this text. Return only JSON. Text: {state['text']}")
            parsed = parse_json_response(response.content)
            return {"fields": {**DEMO_FIELDS, **parsed}}
        except Exception:
            logger.exception("Groq extraction failed; using deterministic fallback")
            pass
    return {"fields": fallback_fields(state["text"])}

def normalize_updates(updates: Any, current_fields: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(updates, dict):
        return {}
    valid_updates = {}
    for raw_key, value in updates.items():
        key = FIELD_ALIASES.get(raw_key, raw_key)
        if key not in FIELD_NAMES or value is None or value == "":
            continue
        if key in FIELD_OPTIONS and value not in FIELD_OPTIONS[key]:
            continue
        valid_updates[key] = value
    return valid_updates

def fallback_updates(message: str, current_fields: dict[str, Any]) -> dict[str, Any]:
    updates = {}
    priority = re.search(r"\bpriority\s+(?:to\s+)?(low|medium|high|critical)\b", message, re.IGNORECASE)
    severity = re.search(r"\bseverity\s+(?:to\s+)?(low|moderate|high|critical)\b", message, re.IGNORECASE)
    customer = re.search(r"(?:customer name|customer)\s+(?:to|as)\s+([^,.]+)", message, re.IGNORECASE)
    if priority:
        updates["priority"] = priority.group(1).title()
    if severity:
        updates["initialSeverity"] = severity.group(1).title()
    if customer:
        updates["customerName"] = customer.group(1).strip()
    return normalize_updates(updates, current_fields)

def assistant_update_fields(state: AssistantState) -> AssistantState:
    message = state["message"]
    if os.getenv("GROQ_API_KEY"):
        try:
            from langchain_groq import ChatGroq
            model = ChatGroq(model=GROQ_MODEL, temperature=0)
            prompt = (
                "You update a pharmaceutical complaint form. Return JSON only with keys "
                "field_updates and assistant_message. field_updates may contain only these exact "
                f"fields: {sorted(FIELD_NAMES)}. Update only fields explicitly requested by the user. "
                f"Current fields: {json.dumps(state['fields'])}. User request: {message}"
            )
            parsed = parse_json_response(model.invoke(prompt).content)
            updates = normalize_updates(parsed.get("field_updates"), state["fields"])
            return {"field_updates": updates, "assistant_message": parsed.get("assistant_message") or "I reviewed the request."}
        except Exception:
            logger.exception("Groq assistant update failed; using deterministic fallback")
            pass
    updates = fallback_updates(message, state["fields"])
    if not updates:
        return {"field_updates": {}, "assistant_message": "I can update complaint fields when you specify the field and new value, such as 'change priority to Critical'."}
    labels = ", ".join(updates)
    return {"field_updates": updates, "assistant_message": f"I updated {labels}. Please verify the change before saving."}


def assess_risk(state: ComplaintState) -> ComplaintState:
    fields = state["fields"]
    concern = f"{fields.get('description', '')} {state.get('text', '')}".lower()
    high_risk = any(term in concern for term in ["particle", "contamination", "adverse", "out of specification", "discoloration"])
    fields["initialSeverity"] = "High" if high_risk else fields.get("initialSeverity", "Moderate")
    fields["priority"] = "High" if high_risk else fields.get("priority", "Medium")
    return {"fields": fields, "assistant_message": "I found a potential product quality complaint involving visible contamination. I assigned High priority for review because the issue may affect batch quality. Please verify the batch and retain sample details." if high_risk else "I extracted the complaint details and suggested Medium priority. Please verify the proposed values before saving."}


def format_response(state: ComplaintState) -> ComplaintState:
    return state


def build_graph():
    graph = StateGraph(ComplaintState)
    graph.add_node("normalize", normalize_input)
    graph.add_node("extract", extract_fields)
    graph.add_node("assess", assess_risk)
    graph.add_node("format", format_response)
    graph.set_entry_point("normalize")
    graph.add_edge("normalize", "extract")
    graph.add_edge("extract", "assess")
    graph.add_edge("assess", "format")
    graph.add_edge("format", END)
    return graph.compile()

COMPLAINT_GRAPH = build_graph()

def build_assistant_graph():
    graph = StateGraph(AssistantState)
    graph.add_node("update_fields", assistant_update_fields)
    graph.set_entry_point("update_fields")
    graph.add_edge("update_fields", END)
    return graph.compile()

ASSISTANT_GRAPH = build_assistant_graph()


def extract_complaint(text: str, source_name: str) -> dict[str, Any]:
    result = COMPLAINT_GRAPH.invoke({"text": text, "source_name": source_name})
    return {"fields": result["fields"], "assistant_message": result["assistant_message"], "source_name": source_name}

def update_complaint_fields(message: str, fields: dict[str, Any]) -> dict[str, Any]:
    result = ASSISTANT_GRAPH.invoke({"message": message, "fields": fields})
    return {"field_updates": result["field_updates"], "assistant_message": result["assistant_message"]}

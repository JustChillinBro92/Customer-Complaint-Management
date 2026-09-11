import json
import os
from typing import Any

from .config import GROQ_MODEL
from .parsing import parse_json_response
from .schemas import ComplaintState, FIELD_OPTIONS


def normalize_input(state: ComplaintState) -> ComplaintState:
    return {"text": " ".join(state["text"].split())}


def extract_fields(state: ComplaintState) -> ComplaintState:
    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("GROQ_API_KEY is not configured")

    from langchain_groq import ChatGroq

    model = ChatGroq(model=GROQ_MODEL, temperature=0)
    response = model.invoke(
        "Extract the pharmaceutical complaint into JSON using the exact form field names. "
        "Return only a JSON object and do not invent values that are not supported by the complaint. "
        f"Complaint text: {state['text']}"
    )
    return {"fields": parse_json_response(response.content)}


def assess_risk(state: ComplaintState) -> ComplaintState:
    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("GROQ_API_KEY is not configured")

    from langchain_groq import ChatGroq

    fields = state["fields"]
    model = ChatGroq(model=GROQ_MODEL, temperature=0)
    prompt = (
        "Assess the risk of this pharmaceutical customer complaint. Return JSON only with "
        "the exact keys initialSeverity, priority, and assistant_message. Choose initialSeverity "
        "from Low, Moderate, High, Critical and priority from Low, Medium, High, Critical. "
        "Base the assessment on the complete complaint context and extracted fields. Explain "
        "the principal factors in assistant_message. Make the assessment using your clinical and "
        "quality judgment, not a fixed keyword rule. "
        f"Complaint text: {state.get('text', '')} "
        f"Extracted fields: {json.dumps(fields)}"
    )
    parsed = parse_json_response(model.invoke(prompt).content)
    severity = parsed.get("initialSeverity")
    priority = parsed.get("priority")
    if severity not in FIELD_OPTIONS["initialSeverity"] or priority not in FIELD_OPTIONS["priority"]:
        raise ValueError("AI returned invalid risk assessment values")
    fields["initialSeverity"] = severity
    fields["priority"] = priority
    return {
        "fields": fields,
        "assistant_message": parsed.get("assistant_message") or "AI risk assessment completed. Please verify the recommendation.",
    }


def format_response(state: ComplaintState) -> ComplaintState:
    return state

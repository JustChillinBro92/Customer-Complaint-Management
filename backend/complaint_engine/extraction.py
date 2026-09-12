import json
import os
from datetime import date
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
    current_date = date.today().isoformat()
    response = model.invoke(
        "Extract the pharmaceutical complaint into JSON using exactly the form field names below. "
        "Return every key listed exactly once. Use null when a value is not present; never omit a key. "
        "Do not use alternate names, abbreviations, or synonyms such as manufactureDate, "
        "affectedCartons, damagedCartons, or contactEmail. Return only a JSON object and do not "
        "invent values that are not supported by the complaint. Exact keys: source, customerName, "
        "customerEmail, productName, productType, strength, batchNumber, manufacturingDate, "
        "expiryDate, quantity, complaintType, complaintDate, description, initialSeverity, priority. "
        "quantity must contain the affected quantity as one value, and description must contain "
        "the complete complaint narrative and requested action. "
        "customerName must contain the full legal or company name of the customer, reporter, "
        "or organization submitting the complaint when it appears in the text. "
        "All date fields (manufacturingDate, expiryDate, complaintDate) MUST use ISO format "
        "YYYY-MM-DD, including dates written in words. If complaintDate is not mentioned, use "
        f"today's date ({current_date}); return null for manufacturingDate or expiryDate only "
        "when absent. "
        "For categorical fields, the value MUST EXACTLY match one of these options: "
        f"productType={sorted(FIELD_OPTIONS['productType'])}; "
        f"source={sorted(FIELD_OPTIONS['source'])}; "
        f"complaintType={sorted(FIELD_OPTIONS['complaintType'])}; "
        f"initialSeverity={sorted(FIELD_OPTIONS['initialSeverity'])}; "
        f"priority={sorted(FIELD_OPTIONS['priority'])}. "
        f"Complaint text: {state['text']}"
    )
    
    print("[AI DEBUG] extraction response:", response.content, flush=True)
    fields = parse_json_response(response.content)
    
    for field_name, options in FIELD_OPTIONS.items():
        if field_name in fields and fields[field_name] is not None and fields[field_name] not in options:
            raise ValueError(f"AI returned invalid {field_name}: {fields[field_name]}")
    return {"fields": fields}


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
    
    risk_response = model.invoke(prompt)
    print("[AI DEBUG] risk assessment response:", risk_response.content, flush=True)
    
    parsed = parse_json_response(risk_response.content)
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

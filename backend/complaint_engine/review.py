import json
import os
from typing import Any

from .config import GROQ_MODEL
from .parsing import parse_json_response


def review_complaint(fields: dict[str, Any], existing_records: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("GROQ_API_KEY is not configured")

    from langchain_groq import ChatGroq

    model = ChatGroq(model=GROQ_MODEL, temperature=0)
    prompt = (
        "Review this pharmaceutical complaint and return JSON only with exactly these keys: "
        "completeness, summary, risk_classification, root_cause_recommendation, "
        "capa_recommendation. completeness must contain score (0-100), missing_fields (array), "
        "and explanation. risk_classification must contain severity, priority, and rationale. "
        "The remaining recommendations must be concise, actionable strings or arrays. Use only the "
        "complaint context and comparison records supplied. This is an AI quality review; do not use "
        "keyword rules or deterministic heuristics. "
        f"Complaint fields: {json.dumps(fields)}"
    )
    result = parse_json_response(model.invoke(prompt).content)
    required = {"completeness", "summary", "risk_classification", "root_cause_recommendation", "capa_recommendation"}
    if not required.issubset(result):
        raise ValueError("AI review response is missing required sections")
    return result

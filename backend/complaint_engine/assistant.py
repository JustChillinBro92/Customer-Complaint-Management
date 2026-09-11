import json
import os
from typing import Any

from .config import GROQ_MODEL
from .parsing import parse_json_response
from .schemas import AssistantState, FIELD_ALIASES, FIELD_NAMES, FIELD_OPTIONS


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


def assistant_update_fields(state: AssistantState) -> AssistantState:
    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("GROQ_API_KEY is not configured")

    from langchain_groq import ChatGroq

    model = ChatGroq(model=GROQ_MODEL, temperature=0)
    prompt = (
        "Update the pharmaceutical complaint form using AI. Return JSON only with keys "
        "field_updates and assistant_message. field_updates may contain only these exact "
        f"fields: {sorted(FIELD_NAMES)}. Update only fields supported by the user's request. "
        f"Current fields: {json.dumps(state['fields'])}. User request: {state['message']}"
    )
    response = model.invoke(prompt)
    print("[AI DEBUG] assistant response:", response.content, flush=True)
    parsed = parse_json_response(response.content)
    updates = normalize_updates(parsed.get("field_updates"), state["fields"])
    return {
        "field_updates": updates,
        "assistant_message": parsed.get("assistant_message") or "AI update completed. Please verify the change.",
    }

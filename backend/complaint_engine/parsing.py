import json
import re
from typing import Any


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

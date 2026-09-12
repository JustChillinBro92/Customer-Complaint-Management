from typing import Any

from langgraph.graph import END, StateGraph

from .assistant import assistant_update_fields
from .extraction import assess_risk, extract_fields, format_response, normalize_input
from .schemas import AssistantState, ComplaintState


def build_complaint_graph():
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


def build_update_complaint_graph():
    graph = StateGraph(AssistantState)
    graph.add_node("update_fields", assistant_update_fields)
    graph.set_entry_point("update_fields")
    graph.add_edge("update_fields", END)
    return graph.compile()


COMPLAINT_GRAPH = build_complaint_graph()
UPDATE_COMPLAINT_GRAPH = build_update_complaint_graph()


def extract_complaint(text: str, source_name: str) -> dict[str, Any]:
    result = COMPLAINT_GRAPH.invoke({"text": text, "source_name": source_name})
    return {"fields": result["fields"], "assistant_message": result["assistant_message"], "source_name": source_name}


def update_complaint_fields(message: str, fields: dict[str, Any]) -> dict[str, Any]:
    result = UPDATE_COMPLAINT_GRAPH.invoke({"message": message, "fields": fields})
    return {"field_updates": result["field_updates"], "assistant_message": result["assistant_message"]}

from typing import Any, TypedDict


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

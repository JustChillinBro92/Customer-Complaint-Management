export const complaintSections = [
  { title: "Origin & customer details", fields: [["source", "Complaint source", "select", ["Email", "Phone", "Web portal", "Field alert"]], ["customerName", "Customer name", "text"], ["customerEmail", "Customer email", "email"]] },
  { title: "Product & batch identification", fields: [["productName", "Product name", "text"], ["productType", "Product family", "select", ["API", "FDF"]], ["strength", "Strength / grade", "text"], ["batchNumber", "Batch / lot number", "text"], ["manufacturingDate", "Manufacturing date", "date"], ["expiryDate", "Expiry date", "date"], ["quantity", "Quantity affected", "text"]] },
  { title: "Complaint details", fields: [["complaintType", "Complaint type", "select", ["Appearance", "Packaging", "Identity", "Purity / assay", "Adverse event", "Other"]], ["complaintDate", "Complaint date", "date"], ["description", "Detailed complaint description", "textarea"]] },
  { title: "AI copilot risk assessment", fields: [["initialSeverity", "Severity (Suggested)", "select", ["Low", "Moderate", "High", "Critical"]], ["priority", "Priority", "select", ["Low", "Medium", "High", "Critical"]]] }
];

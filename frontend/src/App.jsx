import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FlaskConical,
  Info,
  Menu,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import {
  addMessage,
  applyExtraction,
  resetComplaint,
  setExtraction,
  setSaveStatus,
  updateField,
} from "./store";
import { complaintApi } from "./services/complaintApi";
import { useComplaintAssistant } from "./hooks/useComplaintAssistant";
import "./layout-overrides.css";
import "./chat-fix.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const sections = [
  {
    title: "Origin & customer details",
    fields: [
      [
        "source",
        "Complaint source",
        "select",
        ["Email", "Phone", "Web portal", "Field alert"],
      ],
      ["customerName", "Customer name", "text"],
      ["customerEmail", "Customer email", "email"],
    ],
  },
  {
    title: "Product & batch identification",
    fields: [
      ["productName", "Product name", "text"],
      ["productType", "Product family", "select", ["API", "FDF"]],
      ["strength", "Strength / grade", "text"],
      ["batchNumber", "Batch / lot number", "text"],
      ["manufacturingDate", "Manufacturing date", "date"],
      ["expiryDate", "Expiry date", "date"],
      ["quantity", "Quantity affected", "text"],
    ],
  },
  {
    title: "Complaint details",
    fields: [
      [
        "complaintType",
        "Complaint type",
        "select",
        [
          "Appearance",
          "Packaging",
          "Identity",
          "Purity / assay",
          "Adverse event",
          "Other",
        ],
      ],
      ["complaintDate", "Complaint date", "date"],
      ["description", "Detailed complaint description", "textarea"],
    ],
  },
  {
    title: "AI copilot risk assessment",
    fields: [
      [
        "initialSeverity",
        "Severity (Suggested)",
        "select",
        ["Low", "Moderate", "High", "Critical"],
      ],
      [
        "priority",
        "Suggested next action",
        "select",
        [
          "Review complaint details",
          "Route to QA investigation",
          "Escalate to quality leadership",
          "Hold batch and investigate",
        ],
      ],
    ],
  },
];

function Field({ config, value, onChange }) {
  const [name, label, type, options] = config;
  const common = {
    value: value || "",
    onChange: (event) => onChange(name, event.target.value),
    disabled: true,
    placeholder:
      type === "textarea"
        ? "Describe the reported issue, observed evidence, and requested action..."
        : `Enter ${label.toLowerCase()}`,
  };
  return (
    <label className={`field ${type === "textarea" ? "field-wide" : ""}`}>
      <span>{label}</span>
      {type === "select" ? (
        <span className="select-wrap">
          <select {...common}>
            {options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <ChevronDown size={15} />
        </span>
      ) : type === "textarea" ? (
        <textarea {...common} rows="4" />
      ) : (
        <span className="input-wrap">
          <input {...common} type={type} />
          {type === "date" && <CalendarDays size={15} />}
        </span>
      )}
    </label>
  );
}

function App() {
  const dispatch = useDispatch();
  const { fields, extraction, assistant, saveStatus, savedId } = useSelector(
    (state) => state.complaint,
  );
  const fileRef = useRef(null);
  const [mobileNav, setMobileNav] = useState(false);
  const { ask, isAsking } = useComplaintAssistant(fields);

  const changeField = (name, value) => dispatch(updateField({ name, value }));
  const runExtraction = async (text, sourceName = "Pasted complaint") => {
    dispatch(
      setExtraction({
        status: "processing",
        progress: 18,
        sourceName,
        message: "Reading complaint content...",
      }),
    );
    try {
      const data = await complaintApi.extract(text, sourceName);
      dispatch(
        applyExtraction({
          fields: data.fields,
          extraction: {
            status: "complete",
            progress: 100,
            sourceName,
            message:
              "Extraction complete. Review the highlighted fields before saving.",
          },
          message: data.assistant_message,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI extraction failed.";
      dispatch(
        setExtraction({
          status: "error",
          progress: 0,
          sourceName,
          message: `AI extraction failed: ${message}`,
        }),
      );
      dispatch(addMessage({ role: "assistant", text: "AI extraction failed. Check the backend logs and try again." }));
    }
  };
  const handleFile = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const isTextFile =
        file.type === "text/plain" ||
        file.name.toLowerCase().endsWith(".txt") ||
        file.name.toLowerCase().endsWith(".eml");
      if (!isTextFile) {
        throw new Error("AI intake currently accepts TXT and EML files.");
      }
      const text = await file.text();
      await runExtraction(text, file.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI file extraction failed.";
      dispatch(
        setExtraction({
          status: "error",
          progress: 0,
          sourceName: file.name,
          message,
        }),
      );
      dispatch(addMessage({ role: "assistant", text: message }));
    } finally {
      // Allow the same file to be selected again after a retry.
      input.value = "";
    }
  };
  const handleSave = async () => {
    dispatch(setSaveStatus({ status: "saving" }));
    try {
      const data = await complaintApi.save(fields);
      dispatch(setSaveStatus({ status: "saved", id: data.complaint_id }));
    } catch {
      dispatch(setSaveStatus({ status: "error" }));
    }
  };
  const askAssistant = () => {
    const input = document.querySelector("#assistant-input");
    const text = input.value.trim();
    if (!text) return;
    ask(text);
    input.value = "";
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <FlaskConical size={20} />
          </div>
          <div>
            <strong>QMS / Complaint Intelligence</strong>
            <span>Pharmaceutical quality operations</span>
          </div>
        </div>
        <nav className={mobileNav ? "nav-links open" : "nav-links"}>
          <a className="active">
            Complaints <span>12</span>
          </a>
          <a>Investigations</a>
          <a>CAPA</a>
          <a>Reports</a>
        </nav>
        <div className="top-actions">
          <button
            className="icon-button"
            aria-label="Open menu"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu size={19} />
          </button>
          <div className="user-chip">
            <span>AR</span>
            <div>
              <b>Alex R.</b>
              <small>QA operations</small>
            </div>
          </div>
        </div>
      </header>
      <main className="page">
        <div className="breadcrumb">
          <span>Complaints</span>
          <ArrowUpRight size={13} />
          <b>New complaint</b>
        </div>

        <section className="page-heading">
          <div>
            <h1>Log customer complaint</h1>
            <p className="subheading">
              Capture, assess, and route a product quality concern with
              AI-assisted intake.
            </p>
          </div>
          <div className="heading-status">
            <span className="status-dot"></span> Draft{" "}
            <small>Autosaved just now</small>
          </div>
        </section>

        <section className="workflow-strip">
          <div className="workflow-step active">
            <span>01</span>
            <div>
              <b>Complaint intake</b>
              <small>Capture source details</small>
            </div>
          </div>
          <div className="workflow-line"></div>
          <div className="workflow-step">
            <span>02</span>
            <div>
              <b>QA assessment</b>
              <small>Review and classify</small>
            </div>
          </div>
          <div className="workflow-line"></div>
          <div className="workflow-step">
            <span>03</span>
            <div>
              <b>Investigation</b>
              <small>Assign follow-up</small>
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="card-intro">
            <div>
              <span className="step-label">STEP 01</span>
              <h2>Complaint record</h2>
              <p>
                Enter the reported event details. Required fields are marked
                with an asterisk.
              </p>
            </div>
            <span className="draft-tag">DRAFT / UNSUBMITTED</span>
          </div>
          {sections.map((section, index) => (
            <div className="form-section" key={section.title}>
              <div className="section-heading">
                <span>0{index + 1}</span>
                <h3>{section.title}</h3>
              </div>
              <div className="field-grid">
                {section.fields.map((config) => (
                  <Field
                    key={config[0]}
                    config={config}
                    value={fields[config[0]]}
                    onChange={changeField}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="form-actions">
            <button
              className="button quiet"
              onClick={() => dispatch(resetComplaint())}
            >
              <RotateCcw size={15} /> Reset form
            </button>
            <button
              className="button primary"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving" ? (
                "Saving..."
              ) : saveStatus === "saved" ? (
                <>
                  <CheckCircle2 size={15} /> Saved {savedId}
                </>
              ) : saveStatus === "error" ? (
                <>
                  <Info size={15} /> Save failed — retry
                </>
              ) : (
                <>
                  <ClipboardCheck size={15} /> Save complaint
                </>
              )}
            </button>
          </div>
        </section>

        <section className="ai-section">
          <div className="copilot-heading">
            <div className="copilot-mark">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="eyebrow">COMPLAINT COPILOT</p>
              <h2>Ask about this complaint</h2>
              <p>
                Use the assistant to review extracted details and risk signals.
              </p>
            </div>
            <span className="online">
              <i></i>
              {isAsking ? "Working" : "Ready"}
            </span>
          </div>
          {extraction.status !== "idle" && (
            <div className="extraction-status">
              <div className="progress-heading">
                <span>
                  <span className="pulse"></span>
                  {extraction.message || "Analyzing document..."}
                </span>
                <b>{extraction.progress}%</b>
              </div>
              <div className="progress-track">
                <span style={{ width: `${extraction.progress}%` }}></span>
              </div>
              <small>
                {extraction.status === "complete"
                  ? "Fields have been added above for review."
                  : "Analyzing document content and extracting key details..."}
              </small>
            </div>
          )}
          <div className="messages">
            {assistant.map((message, index) => (
              <div
                className={`message ${message.role}`}
                key={`${message.role}-${index}`}
              >
                <span>
                  {message.role === "assistant" ? (
                    <Sparkles size={13} />
                  ) : (
                    "You"
                  )}
                </span>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <div className="assistant-input">
            <label
              className="attach-button"
              htmlFor="complaint-file-input"
              aria-label="Attach complaint file"
              title="Attach complaint file"
            >
              <Paperclip size={16} />
            </label>
            <input
              id="assistant-input"
              placeholder="Type a message or attach a complaint..."
              onKeyDown={(event) => event.key === "Enter" && askAssistant()}
            />
            <input
              id="complaint-file-input"
              ref={fileRef}
              className="file-input"
              type="file"
              hidden
              accept=".txt,.eml"
              onChange={handleFile}
            />
            <button
              className="send-button"
              aria-label="Send message"
              onClick={askAssistant}
              disabled={isAsking}
            >
              <Send size={15} />
            </button>
          </div>
          <small className="disclaimer">
            <Info size={12} /> AI suggestions are advisory. Verify all
            information before submission.
          </small>
        </section>
      </main>
      <footer>
        <span>QMS Complaint Intelligence</span>
        <span>
          All records are audit-trailed · <a>Data handling policy</a>
        </span>
      </footer>
    </div>
  );
}

export default App;

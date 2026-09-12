import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { TopBar, Footer } from "./components/layout/TopBar";
import { PageHeader } from "./components/layout/PageHeader";
import { WorkflowStrip } from "./components/layout/WorkflowStrip";
import { ComplaintForm } from "./components/complaint/ComplaintForm";
import { ComplaintCopilot } from "./components/copilot/ComplaintCopilot";
import { ComplaintRecords } from "./components/records/ComplaintRecords";

function App() {
  const dispatch = useDispatch();
  const { fields, extraction, assistant, saveStatus, savedId } = useSelector(
    (state) => state.complaint,
  );
  const fileRef = useRef(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [view, setView] = useState("complaints");
  const [isMessagePending, setIsMessagePending] = useState(false);
  const { updateComplaint, isUpdating } = useComplaintAssistant(fields);

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
      const message =
        error instanceof Error ? error.message : "AI extraction failed.";
      dispatch(
        setExtraction({
          status: "error",
          progress: 0,
          sourceName,
          message: `AI extraction failed: ${message}`,
        }),
      );
      dispatch(
        addMessage({
          role: "assistant",
          text: "AI extraction failed. Check the backend logs and try again.",
        }),
      );
    }
  };

  const handleFile = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setIsMessagePending(true);
    try {
      const supported = /\.(txt|eml|docx|pdf)$/i.test(file.name);
      if (!supported) throw new Error("AI intake supports TXT, DOCX, and PDF files.");
      const data = await complaintApi.extractFile(file);
      dispatch(addMessage({ role: "user", text: `Attached ${file.name}` }));
      dispatch(applyExtraction({
        fields: data.fields,
        extraction: { status: "complete", progress: 100, sourceName: file.name, message: data.assistant_message },
        message: data.assistant_message,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI file extraction failed.";
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
      setIsMessagePending(false);
      input.value = "";
    }
  };

  const handleSave = async () => {
    dispatch(setSaveStatus({ status: "saving" }));
    try {
      const data = await complaintApi.save(fields);
      dispatch(setSaveStatus({ status: "saved", id: data.complaint_id }));
      return true;
    } catch (error) {
      dispatch(setSaveStatus({ status: error?.status === 409 ? "duplicate" : "error", id: error?.detail?.duplicate_of }));
      return false;
    }
  };

  const handleChatInput = async () => {
    const input = document.querySelector("#assistant-input");
    const text = input.value.trim();
    if (!text) return;
    const isUpdateRequest = /^(please\s+|can\s+you\s+|could\s+you\s+|i\s+want\s+you\s+to\s+)?(update|change|set|modify|replace|correct|edit)\b/i.test(text);
    setIsMessagePending(true);
    try {
      if (isUpdateRequest) {
        await updateComplaint(text);
      } else {
        dispatch(addMessage({ role: "user", text }));
        await runExtraction(text, "Chat complaint");
      }
    } finally {
      setIsMessagePending(false);
    }
    input.value = "";
  };

  return (
    <div className="app-shell">
      <TopBar
        mobileNav={mobileNav}
        onToggleMenu={() => setMobileNav(!mobileNav)}
        onNavigate={setView}
        activeView={view}
      />
      {view === "records" ? (
        <ComplaintRecords onBack={() => setView("complaints")} />
      ) : (
        <main className="page">
          <PageHeader />
          <WorkflowStrip />
          <ComplaintForm
            fields={fields}
            saveStatus={saveStatus}
            savedId={savedId}
            onChange={changeField}
            onReset={() => dispatch(resetComplaint())}
            onSave={handleSave}
          />
          <ComplaintCopilot
            assistant={assistant}
            isUpdating={isUpdating}
            isMessagePending={isMessagePending}
            isExtracting={extraction.status === "processing"}
            fileRef={fileRef}
            onFile={handleFile}
            onChatInput={handleChatInput}
          />
        </main>
      )}
      <Footer />
    </div>
  );
}

export default App;

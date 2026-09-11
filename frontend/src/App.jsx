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
    try {
      const isTextFile =
        file.type === "text/plain" ||
        file.name.toLowerCase().endsWith(".txt") ||
        file.name.toLowerCase().endsWith(".eml");
      if (!isTextFile)
        throw new Error("AI intake currently accepts TXT and EML files.");
      await runExtraction(await file.text(), file.name);
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
      <TopBar
        mobileNav={mobileNav}
        onToggleMenu={() => setMobileNav(!mobileNav)}
      />
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
          extraction={extraction}
          assistant={assistant}
          isAsking={isAsking}
          fileRef={fileRef}
          onFile={handleFile}
          onAsk={askAssistant}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;

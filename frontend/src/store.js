import { configureStore, createSlice } from "@reduxjs/toolkit";

const initialComplaint = {
  source: "",
  customerName: "",
  customerEmail: "",
  productName: "",
  productType: "API",
  strength: "",
  batchNumber: "",
  manufacturingDate: "",
  expiryDate: "",
  quantity: "",
  complaintType: "",
  complaintDate: "",
  description: "",
  initialSeverity: "Moderate",
  priority: "Medium",
};

const complaintSlice = createSlice({
  name: "complaint",
  initialState: {
    fields: initialComplaint,
    extraction: { status: "idle", progress: 0, sourceName: "", message: "" },
    assistant: [
      {
        role: "assistant",
        text: "Upload a complaint document or paste complaint text above. I will extract the details and populate the form for your review.",
      },
    ],
    saveStatus: "idle",
    savedId: "",
  },
  reducers: {
    updateField: (state, action) => {
      state.fields[action.payload.name] = action.payload.value;
    },
    setExtraction: (state, action) => {
      state.extraction = { ...state.extraction, ...action.payload };
    },
    applyExtraction: (state, action) => {
      state.fields = { ...state.fields, ...action.payload.fields };
      state.extraction = { ...state.extraction, ...action.payload.extraction };
      state.assistant.push({ role: "assistant", text: action.payload.message });
    },
    applyAssistantUpdate: (state, action) => {
      state.fields = { ...state.fields, ...action.payload.fields };
      state.assistant.push({ role: "assistant", text: action.payload.message });
    },
    addMessage: (state, action) => {
      state.assistant.push(action.payload);
    },
    setSaveStatus: (state, action) => {
      state.saveStatus = action.payload.status;
      state.savedId = action.payload.id || "";
    },
    resetComplaint: () => ({
      fields: initialComplaint,
      extraction: { status: "idle", progress: 0, sourceName: "", message: "" },
      assistant: [
        {
          role: "assistant",
          text: "Upload a complaint document or paste complaint text above. I will extract the details and populate the form for your review.",
        },
      ],
      saveStatus: "idle",
      savedId: "",
    }),
  },
});

export const {
  updateField,
  setExtraction,
  applyExtraction,
  applyAssistantUpdate,
  addMessage,
  setSaveStatus,
  resetComplaint,
} = complaintSlice.actions;
export const store = configureStore({
  reducer: { complaint: complaintSlice.reducer },
});
export { initialComplaint };

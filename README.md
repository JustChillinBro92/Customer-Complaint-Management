# Complaint Intelligence

A continuous-page AI-assisted customer complaint intake workflow for pharmaceutical API and FDF quality operations.

## Stack

- React + Vite + Redux Toolkit
- FastAPI + LangGraph
- Groq `gemma2-9b-it` when configured
- PostgreSQL-ready persistence boundary (demo save endpoint is in-memory)
- Google Fonts: DM Sans and Space Grotesk for a clear quality-operations UI

## Run the frontend

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

## Run the backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Optional `.env` values (place `.env` in the project root, next to `backend`):

```text
GROQ_API_KEY=your_token
GROQ_MODEL=openai/gpt-oss-120b
```

Without a Groq key, the app uses a deterministic parser and demo complaint data so the demo works offline. Text files are read directly; other supported extensions use the demo extraction path.

## Demo workflow

1. Open the complaint page.
2. Use **Paste complaint text / email** and click **Extract details**, or upload a file.
3. Review and edit the proposed complaint fields.
4. Confirm severity and priority.
5. Save the complaint and optionally ask the intake assistant a question.

In a production QMS, the next workflow stages would route the record into QA assessment, investigation, CAPA, audit trail, and e-signature controls.

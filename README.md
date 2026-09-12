# Complaint Intelligence

AI-assisted pharmaceutical customer-complaint intake and quality review application.

## Features

- AI extraction and AI-only risk assessment for severity and priority.
- Chat-based complaint extraction and explicit complaint updates.
- Paperclip intake for TXT, EML, DOCX, and PDF files.
- Editable AI-populated complaint form.
- PostgreSQL/Supabase persistence using `psycopg` and JSONB.
- Database duplicate check during save; matching complaints are not inserted and the UI reports **Duplicate entry**.
- Complaint records page with collapsible AI reviews for completeness, summary, risk, root cause, and CAPA.
- Animated AI response indicator and automatic chat-panel scrolling.

## Project structure

```text
backend/
  main.py                         FastAPI routes
  database.py                     PostgreSQL/Supabase persistence
  complaint_engine/               AI workflows and schemas
frontend/
  src/components/                 Feature-specific React components and CSS
  src/services/complaintApi.js    Backend API client
  src/store.js                    Redux complaint state
```

## Requirements

- Python 3.11+
- Node.js and npm
- Groq API key
- PostgreSQL database; Supabase PostgreSQL is supported

## Configuration

Create `.env` in the project root, next to `backend`:

```text
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
```

For Supabase, use its connection string. URL-encode reserved password characters such as `@` (`@` becomes `%40`). Never commit `.env`; use `.env.example` as the template.

## Run the backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend creates or migrates the `complaints` table on startup. Complaint fields and AI review results are stored as JSONB.

## Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Complaint workflow

1. Paste complaint text or attach a TXT, EML, DOCX, or PDF file with the paperclip.
2. The backend extracts fields with the configured Groq model.
3. AI assesses severity and priority; the form remains editable.
4. Save the complaint to PostgreSQL/Supabase.
5. The database checks customer, product, batch, and complaint type before insertion.
6. Open saved records and run the AI quality review. Reviews are collapsed by default.

If `complaintDate` is absent, extraction uses the current server date. Manufacturing and expiry dates remain empty when absent.

## API routes

- `GET /health`
- `POST /api/complaints/extract` — extract from text
- `POST /api/complaints/extract-file` — extract from TXT, EML, DOCX, or PDF
- `POST /api/complaints/update` — explicit AI update request
- `POST /api/complaints` — save with database duplicate protection
- `GET /api/complaints` — list saved records
- `GET /api/complaints/{complaint_id}` — fetch one record
- `POST /api/complaints/{complaint_id}/review` — generate and store AI review



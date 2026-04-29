# PDF Extractor

Upload a PDF and get extracted text plus an AI-generated summary powered by Google Gemini.

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite + TypeScript      |
| Backend  | Python + FastAPI                  |
| AI       | Google Gemini 2.5 Flash           |

---

## Local Development

### Ports

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173       |
| Backend  | http://localhost:8000       |

The Vite dev server proxies all `/api/*` requests to the backend automatically, so the frontend always calls `/api/extract` with no CORS issues locally.

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit backend/.env with your Gemini API key (already set up if cloned)
```

`backend/.env`:
```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=http://localhost:5173
```

Start the backend:
```bash
venv\Scripts\uvicorn main:app --reload --port 8000
```

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Production Deployment

### Backend → Render

1. Push the project to a GitHub repository.
2. Go to [render.com](https://render.com) → **New → Web Service** → connect your repo.
3. Set **Root Directory** to `backend`.
4. Render auto-detects `render.yaml`. Confirm these settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in the Render dashboard:

   | Key              | Value                              |
   |------------------|------------------------------------|
   | `GEMINI_API_KEY` | your Google Gemini API key         |
   | `GEMINI_MODEL`   | `gemini-2.5-flash`                 |
   | `ALLOWED_ORIGINS`| `https://your-app.vercel.app`      |

6. Deploy. Render gives you a URL like `https://pdf-extractor-api.onrender.com`.

> **Note:** Free-tier Render services spin down after inactivity. The first request after sleep takes ~30 seconds.

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
2. Set **Root Directory** to `frontend`.
3. Vercel detects Vite automatically. Add this environment variable:

   | Key            | Value                                        |
   |----------------|----------------------------------------------|
   | `VITE_API_URL` | `https://pdf-extractor-api.onrender.com`     |

   *(Replace with your actual Render URL from the step above.)*

4. Deploy. Vercel gives you a URL like `https://pdf-extractor.vercel.app`.

5. Go back to Render and update `ALLOWED_ORIGINS` to your Vercel URL, then redeploy the backend.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable          | Description                           | Example                              |
|-------------------|---------------------------------------|--------------------------------------|
| `GEMINI_API_KEY`  | Google AI Studio API key              | `AIzaSy...`                          |
| `GEMINI_MODEL`    | Gemini model to use                   | `gemini-2.5-flash`                   |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins  | `http://localhost:5173,https://x.vercel.app` |

### Frontend (`frontend/.env.production`)

| Variable       | Description                    | Example                                     |
|----------------|--------------------------------|---------------------------------------------|
| `VITE_API_URL` | Backend base URL (no trailing slash) | `https://pdf-extractor-api.onrender.com` |

> In local development `VITE_API_URL` is not set — the Vite proxy handles routing to `localhost:8000`.

---

## Project Structure

```
PDFExtractor/
├── backend/
│   ├── main.py              # FastAPI app — PDF extraction + Gemini summary
│   ├── requirements.txt
│   ├── render.yaml          # Render deployment config
│   └── .env                 # Local secrets (not committed)
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── FileUpload.tsx
│   │       └── ResultPanel.tsx
│   ├── vercel.json          # Vercel SPA routing config
│   ├── .env.production      # Production env vars template
│   └── vite.config.ts       # Proxies /api → backend in dev
└── README.md
```

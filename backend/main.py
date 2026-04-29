from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import google.generativeai as genai
import os
from dotenv import load_dotenv
import io

load_dotenv()

app = FastAPI()

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
MAX_CHARS_FOR_SUMMARY = 8000

SYSTEM_PROMPT = (
    "You are a professional document analyst. "
    "Provide a clear, structured summary of the document provided. "
    "Include key points, main topics, and important details."
)


@app.post("/api/extract")
async def extract_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()

    text_parts = []
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse PDF: {str(e)}")

    extracted_text = "\n\n".join(text_parts).strip()
    if not extracted_text:
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted. The PDF may be scanned or image-based.",
        )

    try:
        model = genai.GenerativeModel(
            model_name=MODEL,
            system_instruction=SYSTEM_PROMPT,
        )
        response = model.generate_content(
            f"Please summarize the following document:\n\n{extracted_text[:MAX_CHARS_FOR_SUMMARY]}",
            generation_config=genai.GenerationConfig(max_output_tokens=1024),
            request_options={"timeout": 30},
        )
        summary = response.text
    except Exception as e:
        msg = str(e)
        if "credits are depleted" in msg or "RESOURCE_EXHAUSTED" in msg or "429" in msg:
            raise HTTPException(status_code=402, detail="Gemini API credits are depleted. Please top up at https://ai.studio/projects.")
        raise HTTPException(status_code=502, detail=f"AI summary failed: {msg}")

    return {
        "filename": file.filename,
        "extracted_text": extracted_text,
        "summary": summary,
        "page_count": len(text_parts),
        "char_count": len(extracted_text),
    }

import { useState } from "react";
import FileUpload from "./components/FileUpload";
import ResultPanel from "./components/ResultPanel";
import "./App.css";

interface ExtractResult {
  filename: string;
  extracted_text: string;
  summary: string;
  page_count: number;
  char_count: number;
}

type Status = "idle" | "loading" | "done" | "error";

export default function App() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpload = async (file: File) => {
    setStatus("loading");
    setResult(null);
    setErrorMsg("");

    const form = new FormData();
    form.append("file", file);

    try {
      const base = import.meta.env.VITE_API_URL ?? "";
      const res = await fetch(`${base}/api/extract`, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? `Server error ${res.status}`);
      }
      const data: ExtractResult = await res.json();
      setResult(data);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const content = [
      `PDF EXTRACTION REPORT`,
      `=====================`,
      `File: ${result.filename}`,
      `Pages: ${result.page_count}`,
      `Characters: ${result.char_count}`,
      ``,
      `AI SUMMARY`,
      `----------`,
      result.summary,
      ``,
      `EXTRACTED TEXT`,
      `--------------`,
      result.extracted_text,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename.replace(/\.pdf$/i, "_report.txt");
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        </div>
        <h1 className="app-title">PDF Extractor</h1>
        <p className="app-subtitle">Extract text and generate AI summaries from PDF documents</p>
      </header>

      <main className="app-main">
        {status !== "done" && (
          <section className="upload-section">
            <FileUpload onUpload={handleUpload} disabled={status === "loading"} />
          </section>
        )}

        {status === "loading" && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Extracting text and generating summary...</p>
          </div>
        )}

        {status === "error" && (
          <div className="error-state">
            <p className="error-msg">
              <strong>Error:</strong> {errorMsg}
            </p>
            <button className="btn btn-secondary" onClick={handleReset}>Try Again</button>
          </div>
        )}

        {status === "done" && result && (
          <section className="results-section">
            <div className="results-meta">
              <span className="meta-tag">
                <strong>{result.filename}</strong>
              </span>
              <span className="meta-tag">{result.page_count} page{result.page_count !== 1 ? "s" : ""}</span>
              <span className="meta-tag">{result.char_count.toLocaleString()} characters</span>
              <div className="results-actions">
                <button className="btn btn-secondary" onClick={handleReset}>Upload Another</button>
                <button className="btn btn-primary" onClick={handleDownload}>
                  Download Report (.txt)
                </button>
              </div>
            </div>

            <div className="panels">
              <ResultPanel
                title="AI Summary"
                content={result.summary}
                icon="✦"
              />
              <ResultPanel
                title="Extracted Text"
                content={result.extracted_text}
                icon="≡"
              />
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Gemini AI &mdash; runs locally</p>
      </footer>
    </div>
  );
}

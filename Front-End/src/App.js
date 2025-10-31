import React, { useState } from "react";
import JobForm from "./JobForm";
import "./App.css";

function LinkedInButton({ url }) {
  if (!url) return <>—</>;
  return (
    <a
      className="btn-linkedin"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir perfil no LinkedIn"
      title="Abrir perfil no LinkedIn"
    >
      <span className="icon" aria-hidden="true">
        {/* SVG oficial do in */}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.039-1.852-3.039-1.853 0-2.136 1.447-2.136 2.943v5.665H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.369-1.852 3.602 0 4.266 2.371 4.266 5.455v6.288zM5.337 7.433a2.062 2.062 0 11.001-4.124 2.062 2.062 0 01-.001 4.124zM6.999 20.452H3.672V9h3.327v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </span>
      Perfil
    </a>
  );
}

const API_BASE =
  process.env.REACT_APP_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8080";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleAnalyze({ job, csvBase64, phantomRunId, csvUrl }) {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = { job };
      if (csvBase64) payload.csvBase64 = csvBase64;
      else if (csvUrl) payload.csvUrl = csvUrl;
      else if (phantomRunId) payload.phantomRunId = phantomRunId;

      const res = await fetch(`${API_BASE}/analyze/rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 202) {
        const body = await res.json();
        setError(
          body?.message ||
            "A coleta ainda está em andamento no Phantom. Tente novamente em instantes."
        );
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Falha ${res.status}`);
      } else {
        const body = await res.json();
        setResult(body);

        // scrolla pro topo com suavidade
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      setError(e.message || "Erro ao analisar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Análise de Aderência — Perfis LinkedIn</h1>
        <p className="subtitle">
          Descreva a vaga, envie (opcionalmente) um CSV de perfis, e veja o Top 5.
        </p>
      </header>

      <main className="container">
        <JobForm onAnalyze={handleAnalyze} disabled={loading} />

        {loading && <div className="loading">Processando…</div>}

        {error && (
          <div className="alert error">
            <strong>Erro: </strong>
            {error}
          </div>
        )}

        {result && (
          <section className="card">
            <div className="card-title">
              Resultado ({result.total} perfis) — Top 5
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Score</th>
                    <th>Nome</th>
                    <th>LinkedIn</th>
                    <th>Motivos</th>
                  </tr>
                </thead>
                <tbody>
                  {result.top5?.map((c, i) => (
                    <tr key={i}>
                      <td className="score">{c.score}</td>
                      <td>{c.fullName || "—"}</td>
                      <td>
                        <LinkedInButton url={c.linkedin} />
                      </td>
                      <td>
                        {Array.isArray(c.motivos)
                          ? c.motivos.join(" | ")
                          : c.motivos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* botão de nova análise */}
            <div className="actions">
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => {
                  setResult(null);
                  setError("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Nova Análise
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

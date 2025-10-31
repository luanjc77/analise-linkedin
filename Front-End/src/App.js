import React, { useState } from "react";
import JobForm from "./JobForm";
import "./App.css";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}...`);
  }
}

export default function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 1) Adicionar links na planilha
  async function handleAppendLinks(linksText) {
    setError("");
    const links = linksText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!links.length) {
      setError("Informe pelo menos 1 link de perfil.");
      return;
    }

    setLoading(true);
    try {
      // se quiser manter sempre 10, troque o endpoint:
      // const res = await fetch(`${API_BASE}/sheets/append-trim`, { ... body: JSON.stringify({ links, windowSize: 10 }) })
      const res = await fetch(`${API_BASE}/sheets/append-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const body = await parseJsonSafe(res);
      if (!res.ok) throw new Error(body?.error || `Falha ${res.status}`);
    } catch (e) {
      setError(e.message || "Erro ao atualizar planilha.");
    } finally {
      setLoading(false);
    }
  }

  // 2) Rodar o Scraper (Phantom)
  async function handleRunScraper() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scraper/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await parseJsonSafe(res);
      if (!res.ok) throw new Error(body?.error || `Falha ${res.status}`);

      const runId =
        body?.run?.runId ||
        body?.run?.debug?.launchResponse?.containerId ||
        "desconhecido";
      alert(
        `Scraper iniciado!\nrunId: ${runId}\n\nQuando finalizar, clique em "Analisar".`
      );
    } catch (e) {
      setError(e.message || "Erro ao rodar scraper.");
    } finally {
      setLoading(false);
    }
  }

  // 3) Analisar (rankear)
  async function handleAnalyze({ job, csvUrl, phantomRunId }) {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/analyze/rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job,
          csvUrl: csvUrl || undefined,
          phantomRunId: phantomRunId || undefined,
        }),
      });

      if (res.status === 202) {
        const body = await parseJsonSafe(res);
        setError(
          body?.message ||
            "A coleta ainda está em andamento. Tente novamente em alguns segundos."
        );
      } else if (!res.ok) {
        const body = await parseJsonSafe(res);
        throw new Error(body?.error || `Falha ${res.status}`);
      } else {
        const body = await parseJsonSafe(res);
        setResult(body);
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
          Descreva a vaga, adicione os links à planilha, rode o scraper e
          clique em Analisar.
        </p>
      </header>

      <div className="container">
        <JobForm
          onAnalyze={handleAnalyze}
          onAppendLinks={handleAppendLinks}
          onRunScraper={handleRunScraper}
          disabled={loading}
        />

        {loading && <div className="loading">Processando…</div>}
        {error && (
          <div className="alert">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {result && (
          <div className="card" id="resultado">
            <h3 className="card-title">
              Resultado ({result.total} perfis) — Top 5
            </h3>
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
                  {result.top5.map((r, idx) => (
                    <tr key={idx}>
                      <td className="score">{r.score}</td>
                      <td>{r.fullName || "-"}</td>
                      <td>
                        {r.linkedin ? (
                          <a
                            className="btn-linkedin"
                            href={r.linkedin}
                            target="_blank"
                            rel="noreferrer"
                          >
                            perfil
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{(r.motivos || []).join(" | ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setResult(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Nova Análise
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

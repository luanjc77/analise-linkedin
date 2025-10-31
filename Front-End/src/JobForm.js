import React, { useState } from "react";

const defaultJob = {
  escolaridade: "",
  conhecimentosObrigatorios: "python, sql, etl",
  conhecimentosDesejados: "aws, airflow, spark",
  tempoExperienciaMinAnos: 0,
  cargo: "",
  observacoes: "",
};

export default function JobForm({
  onAnalyze,
  onAppendLinks,
  onRunScraper,
  disabled,
}) {
  const [job, setJob] = useState(defaultJob);
  const [linksText, setLinksText] = useState(
    "https://www.linkedin.com/in/fulano/\nhttps://www.linkedin.com/in/beltrano/"
  );
  const [csvUrl, setCsvUrl] = useState("");
  const [phantomRunId, setPhantomRunId] = useState("");

  const handleNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const toJobSpec = () => ({
    escolaridade: job.escolaridade.trim() || undefined,
    conhecimentosObrigatorios: job.conhecimentosObrigatorios
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    conhecimentosDesejados: job.conhecimentosDesejados
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    tempoExperienciaMinAnos: handleNumber(job.tempoExperienciaMinAnos),
    cargo: job.cargo.trim() || undefined,
    observacoes: job.observacoes.trim() || undefined,
  });

  const handleAnalyzeClick = (e) => {
    e.preventDefault();
    if (!onAnalyze) return;
    const spec = toJobSpec();
    onAnalyze({ job: spec, csvUrl: csvUrl.trim() || undefined, phantomRunId: phantomRunId.trim() || undefined });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAppendLinksClick = async () => {
    if (!onAppendLinks) return;
    await onAppendLinks(linksText);
  };

  const handleRunScraperClick = async () => {
    if (!onRunScraper) return;
    await onRunScraper();
  };

  return (
    <form className="card">
      <h3 className="card-title">Configurar Vaga & Coleta</h3>

      <div className="grid">
        <div>
          <label>Escolaridade (ex.: superior)</label>
          <input
            className="input"
            value={job.escolaridade}
            onChange={(e) => setJob({ ...job, escolaridade: e.target.value })}
            placeholder="superior, bacharel, etc."
          />
        </div>

        <div>
          <label>Conhecimentos obrigatórios (vírgula)</label>
          <input
            className="input"
            value={job.conhecimentosObrigatorios}
            onChange={(e) =>
              setJob({ ...job, conhecimentosObrigatorios: e.target.value })
            }
            placeholder="python, sql, etl"
          />
        </div>

        <div>
          <label>Conhecimentos desejados (vírgula)</label>
          <input
            className="input"
            value={job.conhecimentosDesejados}
            onChange={(e) =>
              setJob({ ...job, conhecimentosDesejados: e.target.value })
            }
            placeholder="aws, airflow, spark"
          />
        </div>

        <div>
          <label>Tempo de experiência mínima (anos)</label>
          <input
            type="number"
            className="input"
            value={job.tempoExperienciaMinAnos}
            onChange={(e) =>
              setJob({ ...job, tempoExperienciaMinAnos: e.target.value })
            }
            placeholder="0"
          />
        </div>

        <div>
          <label>Cargo (opcional)</label>
          <input
            className="input"
            value={job.cargo}
            onChange={(e) => setJob({ ...job, cargo: e.target.value })}
            placeholder="engenheiro de dados"
          />
        </div>

        <div>
          <label>Observações (opcional)</label>
          <textarea
            className="textarea"
            value={job.observacoes}
            onChange={(e) => setJob({ ...job, observacoes: e.target.value })}
            placeholder="termos bônus separados por vírgula"
          />
        </div>
      </div>

      <hr className="divider" />

      <div className="grid">
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Links de perfis (um por linha)</label>
          <textarea
            className="textarea"
            rows={6}
            value={linksText}
            onChange={(e) => setLinksText(e.target.value)}
            placeholder={`https://www.linkedin.com/in/fulano/\nhttps://www.linkedin.com/in/beltrano/`}
          />
        </div>

        <div className="actions" style={{ gridColumn: "1 / -1" }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={disabled}
            onClick={handleAppendLinksClick}
            title="Adiciona os links à planilha"
          >
            Adicionar links à planilha
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled}
            onClick={handleRunScraperClick}
            title="Dispara o Phantom para atualizar a base (CSV)"
          >
            Rodar Scraper
          </button>
        </div>
      </div>

      <hr className="divider" />

      <div className="grid">
        <div>
          <label>CSV URL (opcional)</label>
          <input
            className="input"
            value={csvUrl}
            onChange={(e) => setCsvUrl(e.target.value)}
            placeholder="https://.../result.csv"
          />
        </div>

        <div>
          <label>Phantom runId (opcional)</label>
          <input
            className="input"
            value={phantomRunId}
            onChange={(e) => setPhantomRunId(e.target.value)}
            placeholder="se estiver aguardando o Phantom finalizar"
          />
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-start" }}>
          <button
            className="btn btn-success"
            disabled={disabled}
            onClick={handleAnalyzeClick}
          >
            Analisar
          </button>
        </div>
      </div>
    </form>
  );
}

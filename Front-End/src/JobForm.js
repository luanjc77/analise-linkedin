import React, { useMemo, useState } from "react";

// helper: lê arquivo e devolve base64 (sem prefixo data:)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.onload = () => {
      const s = String(reader.result || "");
      const base64 = s.split(",").pop(); // remove "data:text/csv;base64,"
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

const ESCOLARIDADES = [
  "fundamental",
  "medio",
  "tecnologo",
  "superior",
  "pos",
  "mestrado",
  "doutorado",
  "indiferente",
];

export default function JobForm({ onAnalyze, disabled }) {
  const [escolaridade, setEscolaridade] = useState("superior");
  const [obrigatorios, setObrigatorios] = useState("python, sql, etl");
  const [desejados, setDesejados] = useState("aws, airflow, spark");
  const [tempo, setTempo] = useState(2);
  const [cargo, setCargo] = useState("engenheiro de dados");
  const [obs, setObs] = useState("");

  // entradas opcionais para outras rotas
  const [csvFile, setCsvFile] = useState(null);
  const [csvUrl, setCsvUrl] = useState("");
  const [phantomRunId, setPhantomRunId] = useState("");

  const obrigatoriosArr = useMemo(
    () =>
      obrigatorios
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [obrigatorios]
  );
  const desejadosArr = useMemo(
    () =>
      desejados
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [desejados]
  );

  async function submit(e) {
    e.preventDefault();

    const job = {
      escolaridade,
      conhecimentosObrigatorios: obrigatoriosArr,
      conhecimentosDesejados: desejadosArr,
      tempoExperienciaMinAnos: Number(tempo) || 0,
      cargo: cargo.trim() || undefined,
      observacoes: obs.trim() || undefined,
    };

    let csvBase64;
    if (csvFile) {
      csvBase64 = await fileToBase64(csvFile);
    }

    onAnalyze({
      job,
      csvBase64: csvBase64 || undefined,
      csvUrl: csvUrl.trim() || undefined,
      phantomRunId: phantomRunId.trim() || undefined,
    });
  }

  return (
    <section className="card">
      <div className="card-title">Descrição da vaga</div>
      <form onSubmit={submit} className="grid">
        <div className="field">
          <label>Escolaridade</label>
          <select
            value={escolaridade}
            onChange={(e) => setEscolaridade(e.target.value)}
            disabled={disabled}
          >
            {ESCOLARIDADES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Conhecimentos obrigatórios (vírgula)</label>
          <input
            type="text"
            value={obrigatorios}
            onChange={(e) => setObrigatorios(e.target.value)}
            placeholder="ex.: python, sql, etl"
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label>Conhecimentos desejados (vírgula)</label>
          <input
            type="text"
            value={desejados}
            onChange={(e) => setDesejados(e.target.value)}
            placeholder="ex.: aws, airflow, spark"
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label>Tempo de experiência mínima (anos)</label>
          <input
            type="number"
            min="0"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label>Cargo (opcional)</label>
          <input
            type="text"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="ex.: engenheiro de dados"
            disabled={disabled}
          />
        </div>

        <div className="field" style={{ gridColumn: "1/-1" }}>
          <label>Observações (opcional)</label>
          <textarea
            rows={2}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            disabled={disabled}
          />
        </div>

        <hr className="divider" />

        <div className="field">
          <label>CSV de candidatos (opcional)</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            disabled={disabled}
          />
          <small>
            Se não enviar, o backend usa o <code>LOCAL_RESULTS_CSV</code>.
          </small>
        </div>

        <div className="field">
          <label>CSV URL (opcional)</label>
          <input
            type="text"
            value={csvUrl}
            onChange={(e) => setCsvUrl(e.target.value)}
            placeholder="https://.../result.csv"
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label>Phantom runId (opcional)</label>
          <input
            type="text"
            value={phantomRunId}
            onChange={(e) => setPhantomRunId(e.target.value)}
            placeholder="se estiver aguardando o Phantom finalizar"
            disabled={disabled}
          />
        </div>

        <div className="actions" style={{ gridColumn: "1/-1" }}>
          <button className="btn btn-primary btn-lg" type="submit" disabled={disabled}>
            {disabled ? "Analisando…" : "Analisar"}
          </button>
        </div>
      </form>
    </section>
  );
}

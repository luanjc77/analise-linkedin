import { ProfileRow } from "./parsing.js";

export type JobSpec = {
  escolaridade?: string;
  conhecimentosObrigatorios?: string[];
  conhecimentosDesejados?: string[];
  tempoExperienciaMinAnos?: number;
  cargo?: string;
  observacoes?: string;
};

export type RankedProfile = ProfileRow & {
  score: number;
  motivos: string[];
};

export type RankResult = {
  total: number;
  top5: RankedProfile[];
  all: RankedProfile[];
};

/**
 * Normaliza texto para facilitar comparações (minúsculas, sem acentos)
 */
function normalize(text: string): string {
  return text
    ? text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    : "";
}

/**
 * Verifica se um texto contém uma das palavras-chave
 */
function containsAny(text: string, words: string[]): boolean {
  const norm = normalize(text);
  return words.some((w) => norm.includes(normalize(w)));
}

/**
 * Calcula pontuação para um perfil em relação à vaga
 */
function computeScore(p: ProfileRow, job: JobSpec): RankedProfile {
  const motivos: string[] = [];
  let score = 0;

  // Escolaridade
  if (job.escolaridade && p.degreeText) {
    const vaga = normalize(job.escolaridade);
    const grau = normalize(p.degreeText);
    if (grau.includes(vaga)) {
      score += 10;
      motivos.push(`Possui escolaridade compatível (${p.degreeText})`);
    } else if (
      vaga.includes("superior") &&
      (grau.includes("bacharel") || grau.includes("licenciatura"))
    ) {
      score += 10;
      motivos.push(`Possui curso superior (${p.degreeText})`);
    } else {
      motivos.push(`Escolaridade diferente (${p.degreeText})`);
    }
  }

  // Conhecimentos obrigatórios
  if (job.conhecimentosObrigatorios?.length) {
    let count = 0;
    for (const skill of job.conhecimentosObrigatorios) {
      if (containsAny(p.bag, [skill])) {
        count++;
        motivos.push(`Tem conhecimento obrigatório: ${skill}`);
      }
    }
    const perc = (count / job.conhecimentosObrigatorios.length) * 40;
    score += perc;
  }

  // Conhecimentos desejados
  if (job.conhecimentosDesejados?.length) {
    let count = 0;
    for (const skill of job.conhecimentosDesejados) {
      if (containsAny(p.bag, [skill])) {
        count++;
        motivos.push(`Tem conhecimento desejado: ${skill}`);
      }
    }
    const perc = (count / job.conhecimentosDesejados.length) * 20;
    score += perc;
  }

  // Tempo de experiência
  if (job.tempoExperienciaMinAnos) {
    const minMonths = job.tempoExperienciaMinAnos * 12;
    if (p.months >= minMonths) {
      score += 15;
      motivos.push(
        `Experiência mínima atingida (${(p.months / 12).toFixed(1)} anos)`
      );
    } else {
      motivos.push(
        `Experiência menor que o mínimo (${(p.months / 12).toFixed(1)} anos)`
      );
    }
  }

  // Cargo ou função
  if (job.cargo && containsAny(p.bag, [job.cargo])) {
    score += 10;
    motivos.push(`Cita cargo ou função relacionada (${job.cargo})`);
  }

  // Observações (palavras bônus opcionais)
  if (job.observacoes) {
    const palavras = job.observacoes.split(/[,;]+/).map((s) => s.trim());
    for (const w of palavras) {
      if (containsAny(p.bag, [w])) {
        score += 2;
        motivos.push(`Menciona termo adicional (${w})`);
      }
    }
  }

  // Limita score total a 100
  score = Math.min(score, 100);

  return { ...p, score: Math.round(score), motivos };
}

/**
 * Rankeia todos os perfis e retorna top 5
 */
export function rankProfiles(rows: ProfileRow[], job: JobSpec): RankResult {
  const ranked = rows.map((r) => computeScore(r, job));
  ranked.sort((a, b) => b.score - a.score);
  const top5 = ranked.slice(0, 5);
  return { total: ranked.length, top5, all: ranked };
}

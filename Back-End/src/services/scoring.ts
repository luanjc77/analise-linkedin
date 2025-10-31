import { CandidateAnalyzed, PhantomRow, textBag, totalExperienceMonths } from './parsing.js';
import type { JobSpec } from '../models/JobSpec.js';

const DEGREE_ORDER = ['fundamental', 'medio', 'tecnologo', 'superior', 'pos', 'mestrado', 'doutorado'] as const;

function normalizeDegree(
  input?: string,
): (typeof DEGREE_ORDER)[number] | undefined {
  if (!input) return undefined;
  const s = input.toLowerCase();
  if (/(doutor|phd)/.test(s)) return 'doutorado';
  if (/(mestrad)/.test(s)) return 'mestrado';
  if (/(p[óo]s|especializa)/.test(s)) return 'pos';
  if (/(bacharel|gradua|licenci)/.test(s)) return 'superior';
  if (/(tecno|t[eé]cnico)/.test(s)) return 'tecnologo';
  if (/(ensino m[eé]dio|m[eé]dio)/.test(s)) return 'medio';
  if (/(fundamental)/.test(s)) return 'fundamental';
  return undefined;
}

function degreeScore(required: JobSpec['escolaridade'], profileDegreeText?: string): { score: number; reason?: string } {
  if (required === 'indiferente') return { score: 1 };
  const p = normalizeDegree(profileDegreeText) || 'indiferente';
  const idxReq = DEGREE_ORDER.indexOf(required);
  const idxProf = p === 'indiferente' ? -1 : DEGREE_ORDER.indexOf(p);
  if (idxProf < 0) return { score: 0, reason: 'Escolaridade não identificada no perfil' };
  if (idxProf < idxReq) return { score: 0.3, reason: 'Escolaridade abaixo do exigido' };
  if (idxProf === idxReq) return { score: 0.9, reason: 'Escolaridade atende ao exigido' };
  return { score: 1, reason: 'Escolaridade acima do exigido' };
}

function keywordHit(text: string, kw: string): boolean {
  const k = kw.toLowerCase().trim();
  return new RegExp(`(^|\\b)${k.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(\\b|$)`).test(text);
}

export function analyzeCandidate(row: PhantomRow, job: JobSpec): CandidateAnalyzed {
  const bag = textBag(row);
  const reasons: string[] = [];

  // 1) Escolaridade
  const deg = String(row.schoolDegree || row.school || '');
  const d = degreeScore(job.escolaridade, deg);
  if (d.reason) reasons.push(d.reason);

  // 2) Skills obrigatórias (peso forte)
  const required = job.conhecimentosObrigatorios || [];
  const desired = job.conhecimentosDesejados || [];

  let reqHits = 0;
  for (const kw of required) {
    const ok = keywordHit(bag, kw);
    if (ok) reqHits += 1; else reasons.push(`Faltou obrigatório: ${kw}`);
  }
  const reqScore = required.length ? reqHits / required.length : 1;

  // 3) Skills desejadas (peso médio)
  let desHits = 0;
  for (const kw of desired) if (keywordHit(bag, kw)) desHits += 1;
  const desScore = desired.length ? desHits / desired.length : 0.5; // default neutro

  // 4) Tempo de experiência total
  const months = totalExperienceMonths(row);
  const minYears = job.tempoExperienciaMinAnos ?? 0;
  const minMonths = minYears * 12;
  let expScore = 1;
  if (minMonths > 0) {
    expScore = Math.min(1, months / minMonths);
    if (months < minMonths) reasons.push(`Experiência abaixo do mínimo: ${Math.floor(months/12)}a${months%12}m < ${minYears}a`);
    else reasons.push(`Experiência mínima atendida: ${Math.floor(months/12)}a${months%12}m`);
  }

  // 5) Bônus pelo título/cargo conter o cargo da vaga
  let cargoBonus = 0;
  if (job.cargo) {
    const cargoHit = keywordHit(bag, job.cargo);
    cargoBonus = cargoHit ? 0.05 : 0;
    if (cargoHit) reasons.push('Cargo alinhado ao título/experiências');
  }

  // Pesos (ajustáveis)
  const pesos = {
    escolaridade: 0.15,
    obrigatorias: 0.45,
    desejadas: 0.20,
    experiencia: 0.20,
    bonusCargo: 1, // multiplicador para o bônus (aditivo no final)
  } as const;

  const base =
    d.score * pesos.escolaridade +
    reqScore * pesos.obrigatorias +
    desScore * pesos.desejadas +
    expScore * pesos.experiencia;

  const score = Math.round(Math.min(1, base + cargoBonus * pesos.bonusCargo) * 100);

  return {
    fullName: String(row.fullName || (row as any).firstName || 'Sem nome'),
    linkedin: String(row.linkedinProfileUrl || (row as any).linkedinProfile || ''),
    score,
    motivos: reasons,
    raw: row,
  };
}

export function rankCandidates(rows: PhantomRow[], job: JobSpec, topN = 5): CandidateAnalyzed[] {
  return rows
    .map((r) => analyzeCandidate(r, job))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

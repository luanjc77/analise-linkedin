import { parse } from 'csv-parse';

export type PhantomRow = {
  linkedinProfileUrl?: string;
  email?: string;
  headline?: string;
  description?: string;
  location?: string;
  fullName?: string;
  jobTitle?: string;
  jobDuration?: string; // ex: "1 ano 7 meses"
  jobTitle2?: string;
  jobDuration2?: string;
  school?: string;
  schoolDegree?: string; // ex: "Bacharelado", "Tecnólogo", etc
  // ... (há ~75 colunas – manteremos apenas as principais)
  [k: string]: unknown;
};

export async function parseCsvBuffer(buf: Buffer): Promise<PhantomRow[]> {
  return new Promise((resolve, reject) => {
    const rows: PhantomRow[] = [];
    const parser = parse({ columns: true, trim: true });
    parser.on('readable', () => {
      let record;
      // eslint-disable-next-line no-cond-assign
      while ((record = parser.read())) {
        rows.push(record as PhantomRow);
      }
    });
    parser.on('error', reject);
    parser.on('end', () => resolve(rows));
    parser.write(buf);
    parser.end();
  });
}

export function textBag(row: PhantomRow): string {
  const parts = [
    row.headline,
    row.description,
    row.jobTitle,
    row.jobTitle2,
    row.school,
    row.schoolDegree,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  return parts.join(' \n ');
}

export function durationToMonths(ptBr: string | undefined): number {
  if (!ptBr) return 0;
  // exemplos: "10 anos 3 meses", "1 ano", "7 meses"
  let months = 0;
  const mYears = ptBr.match(/(\d+)\s*ano/);
  const mMonths = ptBr.match(/(\d+)\s*mes/);
  if (mYears) months += Number(mYears[1]) * 12;
  if (mMonths) months += Number(mMonths[1]);
  return months;
}

export function totalExperienceMonths(row: PhantomRow): number {
  return (
    durationToMonths(String(row.jobDuration || '')) +
    durationToMonths(String(row.jobDuration2 || ''))
  );
}

export type CandidateAnalyzed = {
  fullName: string;
  linkedin: string;
  score: number; // 0..100
  motivos: string[];
  raw: PhantomRow;
};

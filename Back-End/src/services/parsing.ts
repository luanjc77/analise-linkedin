import fs from 'fs';
import { parse } from 'csv-parse/sync';

const NAME_KEYS = ['fullName','name','firstName','Profile Name','Name'];
const URL_KEYS  = ['linkedinProfileUrl','profileUrl','LinkedIn Profile URL','LinkedIn Url','LinkedIn'];
const DEGREE_KEYS = ['schoolDegree','degree','Education Degree','education','Education'];
const TEXT_KEYS = [
  'headline','summary','about','description','bio',
  'jobTitle','jobTitle2','currentJob','Current Job','position',
  'company','Current Company',
  'jobDescription','jobDescription2','experience','Experience',
  'education','Education','skills','Skills','certifications','Certifications'
];
const DURATION_KEYS = [
  'jobDuration','jobDuration2','experienceDuration','duration','Duration','timeInRole','Time in role'
];

function pick(row: any, keys: string[]) {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== '') return String(row[k]);
    // tenta com variações de case
    const hit = Object.keys(row).find((kk) => kk.toLowerCase() === k.toLowerCase());
    if (hit && row[hit] != null && String(row[hit]).trim() !== '') return String(row[hit]);
  }
  return '';
}

function normalizeText(s: any) {
  return s == null ? '' : String(s).toLowerCase();
}

function durationToMonths(s: string) {
  if (!s) return 0;
  const txt = s.toLowerCase();

  let months = 0;
  const yPt = txt.match(/(\d+)\s*(?:ano|anos)/);
  const mPt = txt.match(/(\d+)\s*(?:mes|mês|meses)/);
  const yEn = txt.match(/(\d+)\s*(?:year|years)/);
  const mEn = txt.match(/(\d+)\s*(?:month|months)/);

  const years = yPt ? Number(yPt[1]) : yEn ? Number(yEn[1]) : 0;
  const mths  = mPt ? Number(mPt[1]) : mEn ? Number(mEn[1]) : 0;
  months = years * 12 + mths;
  return months;
}

export type ProfileRow = {
  fullName: string;
  linkedin: string;
  degreeText?: string;
  bag: string;
  months: number;
};

export function parseCsvFile(path: string): ProfileRow[] {
  const buf = fs.readFileSync(path);
  return parseCsvBuffer(buf);
}

export function parseCsvBuffer(buf: Buffer): ProfileRow[] {
  const text = buf.toString('utf-8');
  const rows: any[] = parse(text, { columns: true, skip_empty_lines: true });

  return rows.map((row) => {
    const fullName = pick(row, NAME_KEYS);
    const linkedin = pick(row, URL_KEYS);

    // junta tudo que for campo textual conhecido
    const bagParts: string[] = [];
    for (const key of TEXT_KEYS) {
      const v = pick(row, [key]);
      if (v) bagParts.push(v);
    }
    // fallback: adiciona todas colunas string (garante robustez p/ schemas novos)
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === 'string' && !bagParts.includes(v)) bagParts.push(v);
    }
    const bag = normalizeText(bagParts.join(' \n '));

    const degreeText = pick(row, DEGREE_KEYS);

    // meses de experiência: soma das colunas que parecem duração
    let months = 0;
    for (const key of DURATION_KEYS) {
      months += durationToMonths(pick(row, [key]));
    }

    return { fullName, linkedin, degreeText, bag, months };
  });
}

import { google } from "googleapis";

/**
 * Cria client autenticado do Google Sheets usando Service Account
 */
function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      "Credenciais do Google ausentes (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)"
    );
  }

  // Corrige as quebras de linha da chave privada
  key = key.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

/**
 * 📤 Adiciona links de perfis (um por linha, primeira coluna do range)
 */
export async function appendProfileLinks(
  links: string[],
  sheetId?: string,
  range?: string
) {
  const sheets = getSheetsClient();
  const spreadsheetId = sheetId || process.env.GOOGLE_SHEETS_ID!;
  const targetRange = range || process.env.GOOGLE_SHEETS_RANGE || "A:A";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_ID não definido no .env");
  }

  const values = links.map((url) => [url]);

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: targetRange,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  return {
    updates: res.data.updates,
  };
}

/**
 * 🧹 Limpa uma faixa (ex.: para resetar a planilha antes de nova execução)
 */
export async function clearRange(sheetId?: string, range?: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = sheetId || process.env.GOOGLE_SHEETS_ID!;
  const targetRange = range || process.env.GOOGLE_SHEETS_RANGE || "A:A";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_ID não definido no .env");
  }

  const res = await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: targetRange,
    requestBody: {},
  });

  return {
    cleared: res.data.clearedRange,
  };
}

async function getCurrentLinks(sheetId?: string, range?: string): Promise<string[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = sheetId || process.env.GOOGLE_SHEETS_ID!;
  const targetRange = range || process.env.GOOGLE_SHEETS_RANGE || "A:A";

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: targetRange,
  });
  const rows = (res.data.values || []).map(r => (r?.[0] || '').trim()).filter(Boolean);
  return rows;
}

async function setLinks(allLinks: string[], sheetId?: string, range?: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = sheetId || process.env.GOOGLE_SHEETS_ID!;
  const targetRange = range || process.env.GOOGLE_SHEETS_RANGE || "A:A";

  // limpa
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: targetRange,
    requestBody: {},
  });

  if (allLinks.length === 0) return;

  // grava
  const values = allLinks.map(u => [u]);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: targetRange,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

/**
 * Acrescenta novos links e “aperta” a planilha para manter no máximo N (FIFO).
 * Ex.: windowSize=10 => ao adicionar 2 novos, descartamos os 2 mais antigos.
 */
export async function appendAndTrimLinks(
  newLinks: string[],
  windowSize = 10,
  sheetId?: string,
  range?: string
) {
  if (!Array.isArray(newLinks) || newLinks.length === 0) {
    return { ok: true, updated: 0, kept: 0 };
  }

  const current = await getCurrentLinks(sheetId, range);
  const merged = [...current, ...newLinks]
    .map(s => s.trim())
    .filter(Boolean);

  // Opcional: remover duplicados mantendo ordem (mantemos os mais recentes no final)
  const dedup: string[] = [];
  for (const u of merged) {
    if (!dedup.includes(u)) dedup.push(u);
  }

  const finalList = dedup.slice(-windowSize); // mantém só os últimos N
  await setLinks(finalList, sheetId, range);

  return { ok: true, updated: newLinks.length, kept: finalList.length };
}
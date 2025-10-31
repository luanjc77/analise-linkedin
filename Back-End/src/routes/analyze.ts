import { Router } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

import { launchPhantom, getRunStatus } from '../services/phantom.js';
import { parseCsvBuffer, parseCsvFile, ProfileRow } from '../services/parsing.js';
import { rankProfiles, JobSpec } from '../services/scoring.js';

const router = Router();

function pickLocalCsvPath(): string {
  const p = process.env.LOCAL_RESULTS_CSV || './data/result.csv';
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

/**
 * POST /analyze/phantom/launch
 * Body: { sheetUrl?: string, profileUrls?: string[], numberOfProfilesPerLaunch?: number }
 * - Usa o Phantom (modo definido em PHANTOMBUSTER_MODE) e devolve { runId, status }
 */
router.post('/phantom/launch', async (req, res) => {
  try {
    const { sheetUrl, profileUrls, numberOfProfilesPerLaunch } = req.body || {};

    // Validação simples: só uma fonte por vez
    if (sheetUrl && profileUrls && Array.isArray(profileUrls) && profileUrls.length) {
      return res.status(400).json({
        error: 'Envie apenas uma fonte: "sheetUrl" OU "profileUrls".',
      });
    }

    const result = await launchPhantom({ sheetUrl, profileUrls, numberOfProfilesPerLaunch });
    return res.json(result);
  } catch (err: any) {
    const msg = err?.response?.data || err?.message || 'Erro ao lançar o Phantom';
    return res.status(500).json({ error: typeof msg === 'string' ? msg : JSON.stringify(msg) });
  }
});

/**
 * GET /analyze/phantom/status/:runId
 * - Consulta o container e retorna status + csvUrl (quando pronto)
 */
router.get('/phantom/status/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const st = await getRunStatus(runId);
    return res.json(st);
  } catch (err: any) {
    const msg = err?.response?.data || err?.message || 'Erro ao consultar status do Phantom';
    return res.status(500).json({ error: typeof msg === 'string' ? msg : JSON.stringify(msg) });
  }
});

/**
 * POST /analyze/rank
 * Body:
 *  {
 *    job: JobSpec,
 *    csvBase64?: string,
 *    csvUrl?: string,
 *    phantomRunId?: string
 *  }
 *
 * Estratégia:
 *  1) Se vier phantomRunId → consulta status:
 *      - running => 202 (ainda processando)
 *      - finished => usa csvUrl do phantom
 *  2) Caso contrário:
 *      - se csvBase64 => usa esse buffer
 *      - senão se csvUrl => baixa CSV por HTTP
 *      - senão => usa LOCAL_RESULTS_CSV
 */
router.post('/rank', async (req, res) => {
  try {
    const { job, csvBase64, csvUrl, phantomRunId } = req.body || {};
    if (!job) return res.status(400).json({ error: 'Campo "job" é obrigatório.' });

    let buffer: Buffer | null = null;
    let finalCsvUrl: string | undefined;

    if (phantomRunId) {
      // Verifica status do phantom
      const st = await getRunStatus(phantomRunId);
      if (st.status !== 'finished') {
        return res.status(202).json({
          status: st.status,
          message: 'Phantom ainda está processando, tente novamente em instantes.',
          debug: st.debug,
        });
      }
      finalCsvUrl = st.csvUrl;
    }

    // Prioridade de origem do CSV: base64 > csvUrl > phantomCsvUrl > LOCAL_RESULTS_CSV
    if (csvBase64) {
      buffer = Buffer.from(csvBase64, 'base64');
    } else if (csvUrl || finalCsvUrl) {
      const url = csvUrl || finalCsvUrl!;
      const { data } = await axios.get(url, { responseType: 'arraybuffer' });
      buffer = Buffer.from(data);
    } else {
      const localPath = pickLocalCsvPath();
      if (!fs.existsSync(localPath)) {
        return res.status(400).json({
          error: `CSV local não encontrado em ${localPath}. Envie "csvBase64" ou "csvUrl" no body, ou configure LOCAL_RESULTS_CSV.`,
        });
      }
      const rows = parseCsvFile(localPath);
      const ranked = rankProfiles(rows as ProfileRow[], job as JobSpec);
      return res.json(ranked);
    }

    // Parse e ranking
    const rows = parseCsvBuffer(buffer!);
    const ranked = rankProfiles(rows as ProfileRow[], job as JobSpec);
    return res.json(ranked);
  } catch (err: any) {
    const msg = err?.response?.data || err?.message || 'Erro ao processar ranking';
    return res.status(500).json({ error: typeof msg === 'string' ? msg : JSON.stringify(msg) });
  }
});

export default router;

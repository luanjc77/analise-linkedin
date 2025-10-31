import { Router } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { parseCsvBuffer, PhantomRow } from '../services/parsing.js';
import { rankCandidates } from '../services/scoring.js';
import { launchPhantom, getRunStatus } from '../services/phantom.js';
import type { JobSpec } from '../models/JobSpec.js';

const router = Router();

const JobSpecSchema = z.object({
  escolaridade: z.enum([
    'fundamental',
    'medio',
    'tecnologo',
    'superior',
    'pos',
    'mestrado',
    'doutorado',
    'indiferente',
  ]),
  conhecimentosObrigatorios: z.array(z.string()).default([]),
  conhecimentosDesejados: z.array(z.string()).optional().default([]),
  tempoExperienciaMinAnos: z.number().optional(),
  observacoes: z.string().optional(),
  cargo: z.string().optional(),
});

router.post('/phantom/launch', async (req, res) => {
  try {
    const { sheetUrl, profileUrls } = req.body as {
      sheetUrl?: string;
      profileUrls?: string[];
    };
    const out = await launchPhantom({ sheetUrl, profileUrls });
    res.json(out);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/phantom/status/:runId', async (req, res) => {
  try {
    const out = await getRunStatus(req.params.runId);
    res.json(out);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/rank', async (req, res) => {
  try {
    const body = req.body as {
      job: JobSpec;
      // Fonte dos dados dos perfis – escolha UMA das opções abaixo
      phantomRunId?: string; // se já tiver rodado o phantom
      csvUrl?: string;       // URL do CSV gerado pelo phantom
      csvBase64?: string;    // CSV inline em base64 (upload)
    };

    const job = JobSpecSchema.parse(body.job);

    let csvBuffer: Buffer | undefined;

    if (body.csvBase64) {
      csvBuffer = Buffer.from(body.csvBase64, 'base64');
    } else if (body.csvUrl) {
      const { data } = await axios.get<ArrayBuffer>(body.csvUrl, { responseType: 'arraybuffer' });
      csvBuffer = Buffer.from(data as any);
    } else if (body.phantomRunId) {
      const status = await getRunStatus(body.phantomRunId);
      if (status.status !== 'finished' || !status.csvUrl) {
        return res.status(202).json({ status, message: 'Aguardando término da coleta do PhantomBuster' });
      }
      const { data } = await axios.get<ArrayBuffer>(status.csvUrl, { responseType: 'arraybuffer' });
      csvBuffer = Buffer.from(data as any);
    } else if (process.env.LOCAL_RESULTS_CSV) {
      // fallback local para testes
      const fs = await import('node:fs/promises');
      csvBuffer = await fs.readFile(process.env.LOCAL_RESULTS_CSV);
    } else {
      return res.status(400).json({ error: 'Forneça csvBase64, csvUrl, phantomRunId ou configure LOCAL_RESULTS_CSV' });
    }

    const rows: PhantomRow[] = await parseCsvBuffer(csvBuffer);
    const top = rankCandidates(rows, job, 5);

    res.json({ total: rows.length, top5: top });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

export default router;

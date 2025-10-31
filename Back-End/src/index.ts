import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import analyzeRouter from './routes/analyze.js';
import sheetsRouter from './routes/sheets.js';
import scraperRouter from './routes/scraper.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// monta as rotas (após json/cors)
app.use('/sheets', sheetsRouter);
app.use('/analyze', analyzeRouter);
app.use('/scraper', scraperRouter);

// handler de 404 no final — ajuda a depurar
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    method: req.method,
    path: req.path,
  });
});

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log('Mounted routes: /health, /sheets/*, /analyze/*, /scraper/*');
});

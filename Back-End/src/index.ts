import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import analyzeRouter from './routes/analyze.js';
import sheetsRouter from './routes/sheets.js';

const app = express();

// Log de toda request (muito útil para ver se a rota bate)
app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.url}`);
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// >>> As duas montagens que precisam existir:
app.use('/sheets', sheetsRouter);
app.use('/analyze', analyzeRouter);

// Handler 404 JSON (para nunca voltar HTML)
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = Number(process.env.PORT || 8080);

// utilitário pra listar rotas montadas
function listRoutes() {
  const routes: string[] = [];
  app._router.stack.forEach((m: any) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).join(',').toUpperCase();
      routes.push(`${methods} ${m.route.path}`);
    } else if (m.name === 'router' && m.handle?.stack) {
      m.handle.stack.forEach((h: any) => {
        const p = h.route?.path;
        if (p) {
          const methods = Object.keys(h.route.methods).join(',').toUpperCase();
          // base path (m.regexp) é feio de extrair, então logamos só o subpath:
          routes.push(`${methods} (mounted) ${p}`);
        }
      });
    }
  });
  console.log('[routes]', routes);
}

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  listRoutes();
});

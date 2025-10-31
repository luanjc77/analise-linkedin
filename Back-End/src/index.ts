import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // ✅ import correto
import analyzeRouter from './routes/analyze.js';

const app = express();

// habilita CORS para o front (React)
app.use(
  cors({
    origin: true, // ou: ["http://localhost:5173", "http://localhost:3000"]
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/analyze', analyzeRouter);

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));

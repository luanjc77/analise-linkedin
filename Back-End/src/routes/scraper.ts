import express from "express";
import { launchPhantom } from "../services/phantom.js";

const router = express.Router();

/**
 * POST /scraper/run
 * Dispara o Phantom Scraper (usa a planilha configurada no .env)
 */
router.post("/run", async (_req, res) => {
  try {
    const run = await launchPhantom({}); // sem argumentos => usa spreadsheet do phantom
    res.json({ ok: true, run });
  } catch (err: any) {
    console.error("[scraper/run] error:", err);
    res.status(500).json({ error: err.message || "Erro ao rodar scraper." });
  }
});

export default router;

import express from "express";
import { appendProfileLinks, clearRange, appendAndTrimLinks } from "../services/sheets.js";

const router = express.Router();

router.get("/ping", (_req, res) => res.json({ ok: true }));

router.post("/append-links", async (req, res) => {
  try {
    const { links } = req.body;
    if (!Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ error: "Envie um array de links." });
    }
    const result = await appendProfileLinks(links);
    res.json({ ok: true, result });
  } catch (err: any) {
    console.error("[sheets] append-links error:", err);
    res.status(500).json({ error: err.message || "Erro interno ao adicionar links." });
  }
});

router.post("/clear", async (_req, res) => {
  try {
    const result = await clearRange();
    res.json({ ok: true, result });
  } catch (err: any) {
    console.error("[sheets] clear error:", err);
    res.status(500).json({ error: err.message || "Erro interno ao limpar planilha." });
  }
});

router.post("/append-trim", async (req, res) => {
  try {
    const { links, windowSize } = req.body || {};
    if (!Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ error: "Envie um array de links." });
    }
    const result = await appendAndTrimLinks(links, Number(windowSize) || 10);
    res.json({ ok: true, result });
  } catch (err: any) {
    console.error("[sheets] append-trim error:", err);
    res.status(500).json({ error: err.message || "Erro interno ao append-trim." });
  }
});

export default router;

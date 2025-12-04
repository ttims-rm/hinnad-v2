import "dotenv/config";
import express from "express";
import { searchProduct } from "./embeddings/search.js";
import { getLivePrices } from "./live-prices/index.js";

const app = express();
app.use(express.json());

// Health-check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Main search endpoint
app.post("/price/search", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: "query missing" });
    }

    const product = await searchProduct(query);
    if (!product) {
      return res.json({ product: null, offers: [] });
    }

    const offers = await getLivePrices(product);
    res.json({ product, offers });

  } catch (err) {
    console.error("ERROR /price/search", err);
    res.status(500).json({ error: "internal error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Server running on", PORT));

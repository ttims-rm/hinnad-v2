import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { fetchLoverteOffer } from "./agents/loverteAgent.js";
import { searchLoverteProducts } from "./agents/loverteSearchAgent.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// === SINGLE PRODUCT PRICE SEARCH ===
app.post("/price/search", async (req, res) => {
  const { query } = req.body;

  const loverteOffer = await fetchLoverteOffer(query);

  res.json({
    product: {
      product_id: "query-" + Date.now(),
      brand: null,
      name: query,
      variant: null,
      category: null,
      offers: []
    },
    offers: [loverteOffer]
  });
});

// === MULTI PRODUCT SEARCH (FULL SHOP SEARCH) ===
app.post("/price/search-multi", async (req, res) => {
  const { query } = req.body;

  const loverte = await searchLoverteProducts(query);

  res.json({
    query,
    results: loverte.items
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});

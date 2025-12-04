import express from "express";
import cors from "cors";
import { fetchLoverteOffer } from "./agents/loverteAgent.js";

const app = express();
app.use(cors());
app.use(express.json());

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// SINGLE PRODUCT SEARCH (updated)
app.post("/price/search", async (req, res) => {
  const q = req.body.query || "";
  const offer = await fetchLoverteOffer(q);

  res.json({
    product: {
      product_id: "query-" + Date.now(),
      name: q,
      brand: null,
      variant: null,
      category: null
    },
    offers: [offer]
  });
});

// MULTI PRODUCT SEARCH (works already)
import { fetchLoverteSearchResults } from "./agents/loverteSearchAgent.js";
app.post("/price/search-multi", async (req, res) => {
  const q = req.body.query || "";
  const items = await fetchLoverteSearchResults(q);

  res.json({
    query: q,
    results: items
  });
});

// SERVER
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});

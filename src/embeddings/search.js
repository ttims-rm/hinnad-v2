import { loadCatalog } from "../catalog/catalog-loader.js";

// Kui kataloog on tühi, kasuta lihtsalt kasutaja päringut "toote" nimena
export async function searchProduct(query) {
  const catalog = loadCatalog();

  if (catalog.length > 0) {
    // Väga lihtne stub: esimene vaste kataloogist
    return catalog[0];
  }

  // Fallback: kasutaja päringust sünnib "virtuaalne" toode
  return {
    product_id: "query-" + Date.now(),
    brand: null,
    name: query,
    variant: null,
    category: null,
    offers: []
  };
}

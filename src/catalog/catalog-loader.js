import fs from "fs";
import path from "path";

const catalogPath = path.resolve("src/catalog/master-products.json");

export function loadCatalog() {
  const raw = fs.readFileSync(catalogPath, "utf8");
  return JSON.parse(raw);
}

import fs from "fs";
import path from "path";
import { loadCatalog } from "../catalog/catalog-loader.js";

async function build() {
  const catalog = loadCatalog();

  // TODO: Päris embeddingud tulevad hiljem
  const embeddings = [];

  const out = path.resolve("src/embeddings/embeddings.json");
  fs.writeFileSync(out, JSON.stringify(embeddings, null, 2));
  console.log("Embeddings built:", embeddings.length);
}

build();

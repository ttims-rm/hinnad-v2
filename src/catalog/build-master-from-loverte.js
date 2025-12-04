import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";
import path from "path";

const urlsPath = path.resolve("src/catalog/loverte-urls.json");
const outPath = path.resolve("src/catalog/master-products.json");
const cacheDir = path.resolve("cache/html");

// Ensure cache dir exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Load URLs
const urls = JSON.parse(fs.readFileSync(urlsPath, "utf8"));
const max = urls.length;

// Load existing master catalog (resume mode)
let master = [];
if (fs.existsSync(outPath)) {
  try {
    master = JSON.parse(fs.readFileSync(outPath, "utf8"));
  } catch {
    master = [];
  }
}

// Get offset from how many products we already processed
const startIndex = master.length;
console.log("Resuming from index:", startIndex, "/", max);

// Generate cache filename
function cacheFile(url) {
  const hash = Buffer.from(url).toString("base64").slice(0, 20);
  return path.join(cacheDir, hash + ".html");
}

// Fetch or load cached HTML
async function getHtml(url) {
  const file = cacheFile(url);

  if (fs.existsSync(file)) {
    return fs.readFileSync(file, "utf8");
  }

  const { data } = await axios.get(url, { timeout: 8000 });
  fs.writeFileSync(file, data);
  return data;
}

// Extract product info
function parseProduct(html, url) {
  const $ = cheerio.load(html);

  // NAME
  let name =
    $("h1.product-name").text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    null;

  if (!name) return null;

  // BRAND
  let brand =
    $(".product-brand").first().text().trim() ||
    null;

  return {
    product_id: "loverte-" + Buffer.from(url).toString("base64").slice(0, 12),
    brand,
    name,
    variant: null,
    ean: null,
    offers: [{ shop: "loverte", url }]
  };
}


// Build catalog with resume + caching
async function build() {
  console.log("Processing", max, "products...");

  for (let i = startIndex; i < max; i++) {
    const url = urls[i];

    try {
      const html = await getHtml(url);
      const product = parseProduct(html, url);

      if (product) {
        master.push(product);
      }
    } catch (err) {
      // skip
    }

    if (i % 50 === 0) {
      console.log("Processed:", i, "/", max);
      fs.writeFileSync(outPath, JSON.stringify(master, null, 2));
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(master, null, 2));
  console.log("Master catalog saved:", master.length);
}

build();

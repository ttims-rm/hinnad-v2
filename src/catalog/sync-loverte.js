import axios from "axios";
import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

// Loverte õiged tootesitemapid
const SITEMAPS = [
  "https://www.loverte.com/sitemap_et_001.xml",
  "https://www.loverte.com/sitemap_et_002.xml",
  "https://www.loverte.com/sitemap_et_003.xml",
  "https://www.loverte.com/sitemap_et_004.xml",
  "https://www.loverte.com/sitemap_et_005.xml"
];

async function syncLoverte() {
  const urls = [];

  for (const sitemap of SITEMAPS) {
    console.log("Downloading:", sitemap);

    const { data } = await axios.get(sitemap, { timeout: 8000 });
    const $ = cheerio.load(data, { xmlMode: true });

    $("url > loc").each((i, el) => {
      urls.push($(el).text());
    });
  }

  console.log("Found", urls.length, "Loverte product URLs");

  const outPath = path.resolve("src/catalog/loverte-urls.json");
  fs.writeFileSync(outPath, JSON.stringify(urls, null, 2));

  console.log("Saved to", outPath);
}

syncLoverte();

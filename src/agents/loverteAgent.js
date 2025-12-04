import axios from "axios";

const GQL = "https://www.loverte.com/graphql";

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function extractSizeTokens(text) {
  const out = [];
  const re = /(\d+)\s*(ml|g|kg|l)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push((m[1] + m[2]).toLowerCase());
  }
  return out;
}

async function graphqlSearchProducts(query) {
  const payload = {
    query: `
      query SearchProducts($search: String!) {
        products(search: $search) {
          items {
            name
            url_key
            version_name
            small_image { url }
            price_range {
              minimum_price {
                final_price { value }
              }
            }
          }
        }
      }
    `,
    variables: { search: query }
  };

  const res = await axios.post(GQL, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 8000
  });

  return res.data?.data?.products?.items || [];
}

function pickBestMatch(items, query) {
  const qNorm = normalize(query);
  const sizeTokens = extractSizeTokens(query);

  function score(item) {
    let s = 0;
    const name = normalize(item.name);
    const vname = normalize(item.version_name || "");

    if (name.includes(qNorm)) s += 50;

    const qWords = qNorm.split(" ").filter(w => w.length > 2);
    for (const w of qWords) {
      if (name.includes(w)) s += 3;
      if (vname.includes(w)) s += 2;
    }

    const itemSizes = [
      ...extractSizeTokens(item.name || ""),
      ...extractSizeTokens(item.version_name || "")
    ];
    for (const st of sizeTokens) {
      if (itemSizes.includes(st)) s += 30;
    }

    const price = item.price_range?.minimum_price?.final_price?.value;
    if (price != null) s += 5;

    return s;
  }

  return items.reduce((best, item) => {
    const sc = score(item);
    if (!best || sc > best.score) return { item, score: sc };
    return best;
  }, null)?.item || null;
}

export async function fetchLoverteOffer(query) {
  try {
    const items = await graphqlSearchProducts(query);
    if (!items.length) {
      return { shop: "loverte", price: null, url: null, reason: "no_results" };
    }

    const best = pickBestMatch(items, query);
    if (!best) {
      return { shop: "loverte", price: null, url: null, reason: "no_best_match" };
    }

    const price = best.price_range?.minimum_price?.final_price?.value ?? null;
    const url = best.url_key ? `https://www.loverte.com/et/${best.url_key}` : null;

    return {
      shop: "loverte",
      price,
      url,
      reason: url ? "ok" : "url_not_found"
    };

  } catch (err) {
    console.error("Loverte offer error:", err);
    return { shop: "loverte", price: null, url: null, reason: "agent_error" };
  }
}

import axios from "axios";

const GQL = "https://www.loverte.com/graphql";

// --- abifunktsioonid ---

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function extractSizeTokens(text) {
  const out = [];
  const re = /(\d+)\s*(ml|g|kg|l)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push((m[1] + m[2]).toLowerCase()); // nt 20g, 50ml
  }
  return out;
}

// --- GraphQL search ---

async function graphqlSearchProducts(query) {
  const payload = {
    query: `
      query SearchProducts($search: String!) {
        products(search: $search) {
          items {
            name
            url_key
            version_name
            small_image {
              url
            }
            price_range {
              minimum_price {
                final_price {
                  value
                }
              }
            }
          }
        }
      }
    `,
    variables: { search: query }
  };

  const res = await axios.post(GQL, payload, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0"
    },
    timeout: 8000
  });

  const items = res.data?.data?.products?.items || [];
  return items;
}

// --- skoori tooted & vali parim vaste ---

function pickBestMatch(items, query) {
  if (!items.length) return null;

  const qNorm = normalize(query);
  const sizeTokens = extractSizeTokens(query); // nt ["20g"]

  function scoreItem(item) {
    const name = normalize(item.name);
    const vname = normalize(item.version_name || "");
    let score = 0;

    // tugev match nimele
    if (qNorm && name.includes(qNorm)) score += 50;

    // osalised sõnad
    const qWords = qNorm.split(" ").filter(Boolean);
    for (const w of qWords) {
      if (w.length < 3) continue;
      if (name.includes(w)) score += 3;
      if (vname.includes(w)) score += 2;
    }

    // mahu/variandi match (20g, 50ml jms)
    if (sizeTokens.length) {
      const nameSizes = extractSizeTokens(item.name || "").concat(
        extractSizeTokens(item.version_name || "")
      );
      for (const st of sizeTokens) {
        if (nameSizes.includes(st)) {
          score += 30; // väga tugev vihje õigele variandile
        }
      }
    }

    // eelisesta tooteid, millel on hind olemas
    const price =
      item.price_range?.minimum_price?.final_price?.value ?? null;
    if (price != null) score += 5;

    return score;
  }

  let best = null;
  let bestScore = -Infinity;

  for (const item of items) {
    const s = scoreItem(item);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }

  return best;
}

// --- PUBLIC: üks parim Loverte pakkumine ---

export async function fetchLoverteOffer(query) {
  try {
    const items = await graphqlSearchProducts(query);

    if (!items.length) {
      return {
        shop: "loverte",
        price: null,
        url: null,
        reason: "no_results"
      };
    }

    const best = pickBestMatch(items, query);
    if (!best) {
      return {
        shop: "loverte",
        price: null,
        url: null,
        reason: "no_best_match"
      };
    }

    const price =
      best.price_range?.minimum_price?.final_price?.value ?? null;

    const url = `https://www.loverte.com/et/${best.url_key}`;

    return {
      shop: "loverte",
      price,
      url,
      reason: price != null ? "ok" : "price_not_found"
    };
  } catch (err) {
    console.error("Loverte agent error:", err);
    return {
      shop: "loverte",
      price: null,
      url: null,
      reason: "agent_error"
    };
  }
}

import axios from "axios";

const SERP_API_KEY = process.env.SERPAPI_KEY;

// 1) Leiame Loverte URL SerpAPI kaudu
async function findLoverteProductUrl(query) {
  if (!SERP_API_KEY) return null;

  const params = {
    api_key: SERP_API_KEY,
    engine: "google",
    q: `site:loverte.com ${query}`,
    hl: "et",
    gl: "ee"
  };

  const { data } = await axios.get("https://serpapi.com/search", { params });
  const results = data.organic_results || [];

  const hit = results.find(
    (r) => r.link && r.link.includes("loverte.com/et/")
  );

  return hit ? hit.link : null;
}

// 2) Võta URL-ist välja url_key (slug)
function extractUrlKey(url) {
  const m = url.match(/\/et\/([^\/]+)$/);
  return m ? m[1] : null;
}

// 3) Loverte päris GraphQL query hinnainfo saamiseks
async function fetchPriceFromGraphQL(urlKey) {
  const graphqlUrl = "https://www.loverte.com/graphql";

  const queryBody = {
    query: `
      query getProductDetailForProductPage($urlKey: String!) {
        products(filter: { url_key: { eq: $urlKey } }) {
          items {
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
    variables: { urlKey }
  };

  const response = await axios.post(graphqlUrl, queryBody, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  });

  const items =
    response.data?.data?.products?.items || [];

  if (!items.length) return null;

  return items[0]?.price_range?.minimum_price?.final_price?.value ?? null;
}

// 4) Avalik funktsioon
export async function fetchLoverteOffer(query) {
  try {
    const url = await findLoverteProductUrl(query);
    if (!url) {
      return {
        shop: "loverte",
        price: null,
        url: null,
        reason: "url_not_found"
      };
    }

    const urlKey = extractUrlKey(url);
    if (!urlKey) {
      return {
        shop: "loverte",
        price: null,
        url,
        reason: "url_key_not_found"
      };
    }

    const price = await fetchPriceFromGraphQL(urlKey);

    return {
      shop: "loverte",
      price,
      url,
      reason: price ? "ok" : "price_not_found"
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

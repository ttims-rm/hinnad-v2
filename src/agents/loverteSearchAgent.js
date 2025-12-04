import axios from "axios";

// Loverte GraphQL URL
const GQL = "https://www.loverte.com/graphql";

// 1) GraphQL search päring — tagastab KÕIK tooted
async function queryLoverteSearch(q) {
  const payload = {
    query: `
      query SearchProducts($search: String!) {
        products(search: $search) {
          items {
            name
            url_key
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
    variables: { search: q }
  };

  const res = await axios.post(GQL, payload, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0"
    },
    timeout: 8000
  });

  const items = res.data?.data?.products?.items || [];
  return items.map((item) => ({
    shop: "loverte",
    name: item.name,
    price: item.price_range?.minimum_price?.final_price?.value || null,
    image: item.small_image?.url || null,
    url: `https://www.loverte.com/et/${item.url_key}`
  }));
}

// 2) Public function
export async function searchLoverteProducts(query) {
  try {
    const items = await queryLoverteSearch(query);
    return { shop: "loverte", items };
  } catch (err) {
    console.error("Loverte search error:", err);
    return { shop: "loverte", items: [], error: "search_failed" };
  }
}

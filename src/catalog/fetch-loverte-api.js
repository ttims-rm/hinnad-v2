import axios from "axios";

// Extract slug from URL
export function extractSlug(url) {
  const parts = url.split("/");
  return parts[parts.length - 1]; // last segment
}

// Fetch product JSON from Loverte API
export async function fetchLoverteAPI(url) {
  try {
    const slug = extractSlug(url);

    const apiUrl = `https://www.loverte.com/api/catalog/products/${slug}`;

    const { data } = await axios.get(apiUrl, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    return {
      slug,
      name: data.name || null,
      brand: data.brand?.name || null,
      variant: data.volume || null,
      sku: data.sku || null,
      ean: data.ean || null,
      price: data.price?.regular || null,
      sale_price: data.price?.discounted || null,
      images: data.images || [],
      url,
      apiUrl
    };

  } catch (err) {
    return null;
  }
}

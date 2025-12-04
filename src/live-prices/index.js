import { fetchLoverteOffer } from "../agents/loverteAgent.js";

export async function getLivePrices(product) {
  const parts = [];

  if (product.brand) parts.push(product.brand);
  if (product.name) parts.push(product.name);
  if (product.variant) parts.push(product.variant);

  const query = parts.join(" ") || product.name || "";

  const loverteOffer = await fetchLoverteOffer(query);

  // logime vahepeal, et näha mis tegelikult tuleb
  console.log("Loverte offer for query:", query, loverteOffer);

  const offers = [];

  if (loverteOffer) {
    offers.push(loverteOffer);
  }

  // sorteerime ainult olemasolevad hinnad ettepoole
  offers.sort((a, b) => {
    const ap = a.price == null ? Infinity : a.price;
    const bp = b.price == null ? Infinity : b.price;
    return ap - bp;
  });

  return offers;
}

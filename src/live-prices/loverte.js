import axios from "axios";
import * as cheerio from "cheerio";

export async function fetchLovertePrice(url) {
  try {
    const { data } = await axios.get(url, { timeout: 4000 });
    const $ = cheerio.load(data);

    // TODO: Loverte päris hinnaparser lisame hiljem
    // Praegu tagastame null, et kõik töötaks
    const price = null;

    return {
      shop: "loverte",
      price,
      url
    };

  } catch (err) {
    return {
      shop: "loverte",
      price: null,
      url,
      error: true
    };
  }
}

// netlify/functions/probe-fetch.js
export const handler = async (event) => {
  try {
    const { url } = JSON.parse(event.body || "{}");
    if(!url || !/^https?:\/\//i.test(url)){
      return { statusCode: 400, body: JSON.stringify({error:"Invalid URL"}) };
    }
    const r = await fetch(url, { headers: { "User-Agent": "OptiAI-Probe/1.1" }, redirect: "follow" });
    const html = await r.text();
    const headers = Object.fromEntries(r.headers.entries());
    const host = new URL(url).hostname.toLowerCase();

    let platform = "regular";
    let notes = "";
    let asin = null;
    let productName = null;
    let price = null;

    // Try generic JSON-LD product extraction
    try {
      const ldjson = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/ig))
        .map(m=>m[1]).join("\n");
      if(ldjson){
        const blocks = ldjson.split("\n").map(t=>t.trim()).filter(Boolean);
        for(const b of blocks){
          try{
            const obj = JSON.parse(b);
            const prod = Array.isArray(obj) ? obj.find(x=>x['@type'] && (x['@type']==='Product' || (Array.isArray(x['@type']) && x['@type'].includes('Product')))) : (obj['@type']==='Product' ? obj : null);
            if(prod){
              productName = productName || prod.name || (prod.brand && prod.brand.name) || null;
              if(prod.offers){
                const offers = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
                price = price || offers.price || offers.priceSpecification?.price || null;
              }
            }
          }catch{}
        }
      }
    } catch {}

    // Amazon detection
    if(/(^|\.)amazon\./i.test(host)){
      platform = "amazon";
      const asinMatch = html.match(/"asin"\s*:\s*"([A-Z0-9]{10})"/i) || url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
      asin = asinMatch ? asinMatch[1] : null;
      if(!productName){
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        productName = titleMatch ? titleMatch[1].replace(/\s+\|.*$/,'').trim() : null;
      }
      const priceRegexes = [
        /"price"\s*:\s*"(\d+[\.,]\d{2})"/i,
        /data-asin-price="(\d+[\.,]\d{2})"/i,
        /class="a-offscreen">\s*\$?(\d+[\.,]\d{2})\s*<\/span>/i
      ];
      for(const rx of priceRegexes){
        const m = html.match(rx);
        if(m){ price = price || m[1].replace(",", "."); break; }
      }
      notes = "Detected Amazon; parsed ASIN, title, and price when available.";
    } else {
      // Shopify detection
      const hkeys = Object.keys(headers).join("|");
      const isShopifyHeader = /x-shopid|x-shopify/i.test(hkeys);
      const isShopifyHtml = /Shopify|shopify-features|cdn\.shopify\.com|name="shopify"|window\.Shopify|shopify\.cdn/i.test(html);
      if(isShopifyHeader || isShopifyHtml){
        platform = "shopify";
        if(!productName){
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          productName = titleMatch ? titleMatch[1].trim() : null;
        }
        if(!price){
          const priceRegexes = [
            /"price"\s*:\s*"?(\d+[\.,]\d{2})"?/i,
            /"priceAmount"\s*:\s*"?(\d+[\.,]\d{2})"?/i,
            /price"\s*content="(\d+[\.,]\d{2})"/i,
            /"price":\s*{\s*"amount":\s*"(\d+[\.,]\d{2})"/i
          ];
          for(const rx of priceRegexes){
            const m = html.match(rx);
            if(m){ price = m[1].replace(",", "."); break; }
          }
        }
        notes = "Detected Shopify via headers/meta/scripts; extracted title and price when available.";
      } else {
        notes = "No Amazon/Shopify signals found; treated as regular website.";
      }
    }

    const priceNum = price ? parseFloat(String(price).replace(/[^\d\.]/g,"")) : null;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, notes, asin, productName, price: priceNum })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || "Probe failed" }) };
  }
};

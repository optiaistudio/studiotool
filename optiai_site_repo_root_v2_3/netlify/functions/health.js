// netlify/functions/health.js
export const handler = async () => ({ statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ok:true, version:'2.3'}) });
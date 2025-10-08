// netlify/functions/make-report.js
export const handler = async (event) => {
  try {
    const p = JSON.parse(event.body || "{}");
    const {
      platform="regular",
      productName="Your Product",
      mainKeyword="store",
      projections=[["Conservative",0.05,0],["Expected",0.12,0],["Aggressive",0.22,0]],
      metaTitle, metaDescription, faqJson
    } = p;
    const title = `OptiAI Monthly Report — ${productName}`;
    const safe = (x)=>String(x||"").replace(/[<>&]/g, s=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
    const rows = projections.map(([name,lift,val])=>`<tr><td>${safe(name)}</td><td>${(lift*100).toFixed(0)}%</td><td>$${Number(val||0).toLocaleString()}</td></tr>`).join("");
    const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safe(title)}</title>
<meta name="description" content="${safe(metaDescription||"Automated monthly optimization report.")}">
<style>
body{font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;max-width:900px;margin:0 auto;color:#0b1020}
h1{font-size:24px;margin:0 0 4px} h2{font-size:18px;margin:18px 0 8px}
small{color:#475569} table{width:100%;border-collapse:collapse;margin-top:8px}
td,th{border:1px solid #e5e7eb;padding:8px;text-align:left}
pre{white-space:pre-wrap;background:#f8fafc;border:1px solid #e5e7eb;padding:12px;border-radius:8px}
.header{display:flex;align-items:center;gap:8px}
.badge{display:inline-block;background:#111827;color:#fff;padding:3px 8px;border-radius:999px;font-size:12px;margin-left:6px}
.brand{font-weight:800}
</style>
</head><body>
<div class="header"><div class="brand">OptiAI</div><span class="badge">${safe(platform)}</span></div>
<h1>${safe(productName)}</h1>
<small>Generated ${new Date().toLocaleString()}</small>
<h2>Projections</h2>
<table><tr><th>Scenario</th><th>Lift</th><th>Projected Revenue</th></tr>${rows}</table>
<h2>Suggested Meta</h2>
<p><strong>Title:</strong> ${safe(metaTitle||"")}</p>
<p><strong>Description:</strong> ${safe(metaDescription||"")}</p>
<h2>FAQ JSON-LD</h2>
<pre>${safe(faqJson||"")}</pre>
</body></html>`;
    return { statusCode: 200, headers:{"Content-Type":"text/html"}, body: html };
  } catch (e) {
    return { statusCode: 500, body: e.message||"Failed to generate report" };
  }
};

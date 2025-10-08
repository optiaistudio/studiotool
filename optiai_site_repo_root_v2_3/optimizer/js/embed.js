
import { h, render } from "https://unpkg.com/preact@10.19.6/dist/preact.module.js";
import htm from "https://unpkg.com/htm@3.1.1/dist/htm.module.js";
const html = htm.bind(h);
const VERSION = "2.3";

const styleText = `
*{box-sizing:border-box}
.container{font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e5e7eb;max-width:980px;margin:0 auto}
.card{background:#0f172a;border:1px solid #1f2937;border-radius:16px;padding:16px;margin:12px 0}
h2{font-size:18px;margin:0 0 8px}
label{font-size:13px;color:#94a3b8;display:block;margin-bottom:6px}
input,textarea{width:100%;background:#0b1225;color:#e5e7eb;border:1px solid #1f2937;border-radius:12px;padding:12px}
.row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}
.button{padding:12px 14px;border-radius:12px;border:1px solid #1f2937;background:#ef4444;color:white;cursor:pointer;font-weight:700}
.badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;border:1px solid #1f2937;background:#121b33;color:#e5e7eb;margin-left:8px}
.kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.tile{background:#111827;border:1px solid #1f2937;padding:16px;border-radius:14px}
.value{font-size:20px;font-weight:800}
.small{font-size:12px;color:#94a3b8}
pre.code{white-space:pre-wrap;background:#111827;border:1px solid #1f2937;padding:12px;border-radius:12px}
`;

function currency(n){ const x=+n; return isNaN(x)?"":`$${x.toLocaleString(undefined,{maximumFractionDigits:2})}` }
const lifts = { cons:0.05, exp:0.12, aggr:0.22 };

async function detectPlatform(url){
  const r = await fetch("/.netlify/functions/probe-fetch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
  if(!r.ok) throw new Error("Probe failed: " + r.status);
  return await r.json();
}

function computeProjections(ctx){
  const s=ctx;
  if(s.platform==="amazon"){
    const sessions = +s.sessionsAmazon||8000;
    const unitSession = +s.unitSession||12;
    const price = +s.price||19.99;
    const baseUnits=sessions*(unitSession/100);
    const baseRev=baseUnits*price;
    return [["Conservative",lifts.cons, baseRev*(1+lifts.cons)],
            ["Expected",lifts.exp,     baseRev*(1+lifts.exp)],
            ["Aggressive",lifts.aggr,  baseRev*(1+lifts.aggr)]];
  } else {
    const sessions = +s.sessions||12000;
    const conv = +s.conv||2.0;
    const aov = +s.aov||40;
    const baseOrders=sessions*(conv/100);
    const baseRev=baseOrders*aov;
    return [["Conservative",lifts.cons, baseRev*(1+lifts.cons)],
            ["Expected",lifts.exp,     baseRev*(1+lifts.exp)],
            ["Aggressive",lifts.aggr,  baseRev*(1+lifts.aggr)]];
  }
}

function App({mountId}){
  const [state,setState]=(()=>{let s={
    url:"", loading:false, error:"", platform:null, notes:"",
    productName:"", mainKeyword:"", sessions:"", conv:"", aov:"",
    sessionsAmazon:"", unitSession:"", price:"", adSpend:""
  }; return [()=>s,(u)=>{s={...s,...(typeof u==='function'?u(s):u)}; render(html`<${App} mountId=${mountId} />`, document.getElementById(mountId));}];})();

  async function onRun(){
    try{
      setState({loading:true,error:""});
      const res = await detectPlatform(state().url.trim());
      setState({loading:false, platform:res.platform, notes:res.notes||"", productName:res.productName||state().productName});
      if(res.price){ setState({price:String(res.price)}); }
    }catch(e){
      setState({loading:false,error:e.message||"Failed to analyze URL"});
    }
  }

  const s=state();
  const proj = s.platform ? computeProjections(s): [];

  return html`<div class="container" style="position:relative; z-index:9999; pointer-events:auto;">
    <div class="card">
      <h2>Auto-Fetch & Tailor Plan <span class="badge">v${VERSION}</span></h2>
      <div class="row">
        <input placeholder="Paste a product or store URL" value=${s.url} oninput=${e=>setState({url:e.target.value})}/>
        <button class="button" onclick=${onRun} disabled=${s.loading}>${s.loading?"Analyzing…":"Auto-Fetch & Tailor Plan"}</button>
      </div>
      ${s.platform && html`<div class="small" style="margin-top:6px">Detected: <span class="badge">${s.platform}</span> ${s.notes? "· "+s.notes:""}</div>`}
      ${s.error && html`<div class="small" style="margin-top:6px;color:#fda4af">${s.error} — If functions aren’t active yet, use the manual platform selector below.</div>`}
    </div>

    <div class="card">
      <div class="small" style="margin-bottom:6px">Manual platform (fallback)</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="button" onclick=${()=>setState({platform:"shopify"})}>Set: Shopify</button>
        <button class="button" onclick=${()=>setState({platform:"amazon"})}>Set: Amazon</button>
        <button class="button" onclick=${()=>setState({platform:"regular"})}>Set: Regular</button>
      </div>
    </div>

    ${s.platform && html`
      <div class="card">
        <div class="kpi">
          <div class="tile"><div class="small">Platform</div><div class="value">${s.platform}</div></div>
          <div class="tile"><div class="small">Product</div><div class="value">${s.productName||"—"}</div></div>
          <div class="tile"><div class="small">Keyword</div><div class="value">${s.mainKeyword||"—"}</div></div>
        </div>
      </div>

      <div class="card">
        <h2>Projected Impact</h2>
        <div class="kpi">
          ${proj.map(([name, lift, val])=>html`
            <div class="tile">
              <div class="small">${name} (${(lift*100).toFixed(0)}%)</div>
              <div class="value">${currency(val)}</div>
            </div>
          `)}
        </div>
      </div>

      <div class="card">
        <h2>Actions</h2>
        ${s.platform==="amazon" ? html`
          <ul class="small">
            <li><strong>Title:</strong> 180–200 chars, brand first, include primary keyword once.</li>
            <li><strong>Bullets:</strong> Five benefit-led bullets; weave secondary keywords.</li>
            <li><strong>Images:</strong> Main (white), 3–4 lifestyle, 1 infographic, 1 specs/ingredients.</li>
            <li><strong>A+ Content:</strong> story + comparison chart; cross-sell 3 SKUs.</li>
            <li><strong>Backend Keywords:</strong> ≤250 bytes, no commas, include misspellings.</li>
          </ul>
        ` : s.platform==="shopify" ? html`
          <ul class="small">
            <li><strong>Collections:</strong> keyword-themed; add 80–120 words intro copy.</li>
            <li><strong>Schema:</strong> Product + Review + FAQ JSON-LD.</li>
            <li><strong>Speed:</strong> LCP &lt; 2.5s; compress images; lazy-load below the fold.</li>
            <li><strong>Internal links:</strong> related products & collections.</li>
            <li><strong>Blog:</strong> 2/mo targeting “{keyword} + problem”.</li>
          </ul>
        ` : html`
          <ul class="small">
            <li><strong>Basics:</strong> clear H1, scannable bullets, trust badges, strong CTAs.</li>
            <li><strong>Meta:</strong> primary keyword once in title & description.</li>
            <li><strong>Schema:</strong> Product/FAQ where relevant.</li>
            <li><strong>Performance:</strong> compress images; lazy-load; preconnect critical origins.</li>
          </ul>
        `}
      </div>

      <div class="card">
        <div class="row" style="grid-template-columns:1fr auto">
          <div class="small">Generate a branded report to share with the client.</div>
          <button class="button" onclick=${async ()=>{
            const lifts = { cons:0.05, exp:0.12, aggr:0.22 };
            let projections;
            if(s.platform==='amazon'){
              const sessions=+s.sessionsAmazon||8000; const unitSession=+s.unitSession||12; const price=+s.price||19.99;
              const baseUnits=sessions*(unitSession/100); const baseRev=baseUnits*price;
              projections=[['Conservative',lifts.cons, baseRev*(1+lifts.cons)],['Expected',lifts.exp, baseRev*(1+lifts.exp)],['Aggressive',lifts.aggr, baseRev*(1+lifts.aggr)]];
            } else {
              const sessions=+s.sessions||12000; const conv=+s.conv||2.0; const aov=+s.aov||40;
              const baseOrders=sessions*(conv/100); const baseRev=baseOrders*aov;
              projections=[['Conservative',lifts.cons, baseRev*(1+lifts.cons)],['Expected',lifts.exp, baseRev*(1+lifts.exp)],['Aggressive',lifts.aggr, baseRev*(1+lifts.aggr)]];
            }
            const metaTitle = `${(s.productName||'Product')} – Optimization Plan | OptiAI`;
            const metaDescription = 'Automated monthly optimization report.';
            const faqJson = JSON.stringify({'@context':'https://schema.org','@type':'FAQPage','mainEntity':[{'@type':'Question','name':'What will we do next?','acceptedAnswer':{'@type':'Answer','text':'We will prioritize title/keyword updates, image hygiene, and schema fixes, then re-measure.'}}]}, null, 2);
            const res = await fetch('/.netlify/functions/make-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({platform:s.platform,productName:s.productName||'Your Product',projections,metaTitle,metaDescription,faqJson})});
            const html = await res.text();
            const blob = new Blob([html], {type:'text/html'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href=url; a.download=(s.productName||'OptiAI_Report').replace(/\s+/g,'_')+'.html'; a.click(); URL.revokeObjectURL(url);
          }}>Download Report (HTML)</button>
        </div>
      </div>
    `}
  </div>`;
}

function mountInline(){
  // Ensure our CSS doesn't get overridden and input remains typeable
  const style = document.createElement('style'); style.textContent = styleText; document.body.appendChild(style);
  const host = document.getElementById("optiai-inline-app");
  if(host){ render(html`<${App} mountId="optiai-inline-app" />`, host); }
  const dbg = document.getElementById("optiai-inline-debug");
  if(dbg){
    fetch('/.netlify/functions/health').then(r=>{
      dbg.textContent = r.ok ? `Functions: OK · Inline v${VERSION}` : `Functions: Not responding (${r.status}) · Inline v${VERSION}`;
    }).catch(()=>{ dbg.textContent = `Functions: Not reachable · Inline v${VERSION}`; });
  }
}
mountInline();

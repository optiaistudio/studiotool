// netlify/functions/monthly-reaudit.js
import fs from "fs/promises";
import path from "path";

async function sendEmail(to, subject, html){
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.REPORTS_FROM_EMAIL || "reports@optiai.app";
  if(!key){ return {skipped:true, reason:"No SENDGRID_API_KEY set"}; }
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method:"POST",
    headers:{ "Authorization":`Bearer ${key}`, "Content-Type":"application/json" },
    body: JSON.stringify({
      personalizations:[{to:[{email:to}]}],
      from:{email:from,name:"OptiAI Reports"},
      subject,
      content:[{type:"text/html", value: html}]
    })
  });
  if(!res.ok){
    const t = await res.text();
    return {error:true, status:res.status, body:t};
  }
  return {ok:true};
}

export const handler = async () => {
  try {
    const file = path.join(process.cwd(), "data", "clients.json");
    const raw = await fs.readFile(file, "utf-8").catch(()=>`{"clients":[]}`);
    const db = JSON.parse(raw);
    const results = [];

    for(const c of db.clients){
      try{
        const probe = await fetch(process.env.SITE_ORIGIN + "/.netlify/functions/probe-fetch", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({url: c.url})
        }).then(r=>r.json());

        const lifts = {cons:0.05,exp:0.12,aggr:0.22};
        let projections = [];
        if(probe.platform==="amazon"){
          const sessions=8000, unitSession=12, price= Number(probe.price||19.99);
          const baseUnits = sessions*(unitSession/100);
          const baseRev = baseUnits*price;
          projections = [["Conservative",lifts.cons, baseRev*(1+lifts.cons)],
                         ["Expected",lifts.exp,     baseRev*(1+lifts.exp)],
                         ["Aggressive",lifts.aggr,  baseRev*(1+lifts.aggr)]];
        } else {
          const sessions=12000, conv=2.0, aov=40;
          const baseOrders=sessions*(conv/100);
          const baseRev=baseOrders*aov;
          projections = [["Conservative",lifts.cons, baseRev*(1+lifts.cons)],
                         ["Expected",lifts.exp,     baseRev*(1+lifts.exp)],
                         ["Aggressive",lifts.aggr,  baseRev*(1+lifts.aggr)]];
        }

        const metaTitle = `${(probe.productName||"Product")} – Optimization Plan | OptiAI`;
        const metaDescription = "Automated monthly optimization report.";
        const faqJson = JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What changed this month?","acceptedAnswer":{"@type":"Answer","text":"We rescanned your listing and refreshed action items for titles, keywords, images, and structured data."}}]}, null, 2);

        const reportHtml = await fetch(process.env.SITE_ORIGIN + "/.netlify/functions/make-report", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            platform: probe.platform,
            productName: probe.productName||c.name||"Your Product",
            mainKeyword: "",
            projections, metaTitle, metaDescription, faqJson
          })
        }).then(r=>r.text());

        const subject = `OptiAI Monthly Report — ${probe.productName||c.name||"Your Product"}`;
        const mailRes = await sendEmail(c.email, subject, reportHtml);
        results.push({url:c.url, email:c.email, mailed:mailRes, platform:probe.platform});
      }catch(e){
        results.push({url:c.url, email:c.email, error:e.message||String(e)});
      }
    }

    return { statusCode: 200, body: JSON.stringify({ok:true, processed: results.length, results}) };
  } catch (e) {
    return { statusCode: 500, body: e.message||"Re-audit failed" };
  }
};

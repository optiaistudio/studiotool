// netlify/functions/add-client.js
import fs from "fs/promises";
import path from "path";
export const handler = async (event) => {
  try {
    if(event.httpMethod!=="POST") return { statusCode: 405, body: "Method Not Allowed" };
    const { url, email, name } = JSON.parse(event.body||"{}");
    if(!url || !email) return { statusCode: 400, body: "Missing url or email" };
    const file = path.join(process.cwd(), "data", "clients.json");
    const raw = await fs.readFile(file, "utf-8").catch(()=>`{"clients":[]}`);
    const db = JSON.parse(raw);
    const exists = db.clients.find(c=>c.url===url && c.email===email);
    if(!exists){
      db.clients.push({url, email, name: name||"", addedAt: new Date().toISOString()});
      await fs.writeFile(file, JSON.stringify(db,null,2));
    }
    return { statusCode: 200, body: JSON.stringify({ok:true, total: db.clients.length}) };
  } catch (e) {
    return { statusCode: 500, body: e.message||"Failed to add client" };
  }
};

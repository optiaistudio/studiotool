OptiAI — Final Combined Package
=================================
This bundle merges:
- Core Engine (Mini): UI, scrape, Shopify OAuth, 1-click Apply
- Automation & Dashboard Add-On: monthly re-audit + Google Sheets hook

Deploy (Netlify — Manual Deploy):
1) New Site → Manual Deploy → drag the *CONTENTS* of this folder (not the folder itself).
2) Add environment variables (Site → Settings → Environment):
   APP_URL            = https://<your-site>.netlify.app
   SHOPIFY_API_KEY    = <Shopify app key>
   SHOPIFY_API_SECRET = <Shopify app secret>
   SHEET_WEBAPP_URL   = <Apps Script Web App URL>
3) In Shopify (client store), create an app with scopes:
   read_themes, write_themes
   Redirect URL: APP_URL/.netlify/functions/oauth-callback
4) (Google Sheets) Create a sheet named "Dashboard" with headers:
   Client | Store | Product Name | Product URL | Platform | Current Score | Last Audit | Notes | RowId
   Paste GOOGLE_SHEETS_APPS_SCRIPT.txt into Apps Script and Deploy as Web App (Anyone with link).
5) Use the site:
   - Paste Product URL → Auto-Fetch → Simulate After → Generate ZIP
   - Enter shop domain → Connect → Apply to Shopify
   - Monthly re-audit runs via cron (1st @ 12:00 UTC), or trigger manually:
     {"https://<your-site>.netlify.app/.netlify/functions/monthly-reaudit?run=now"}

Built: 2025-10-07T03:48:40.239598Z

Missing functions (if any): None

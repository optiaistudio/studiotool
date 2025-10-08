OptiAI — Automation & Dashboard Add‑On (Part 2)
==================================================
Adds monthly re-audits + Google Sheets dashboard updates to your existing Core Engine site.

What's inside
- netlify/functions/monthly-reaudit.js  → re-scrapes every URL in your Sheet monthly and updates score/date
- GOOGLE_SHEETS_APPS_SCRIPT.txt         → paste into Apps Script for your Sheet (provides JSON GET + POST update)
- netlify.toml                          → includes the cron schedule (merge/replace your site's netlify.toml)

Environment variables to add (Netlify → Site settings → Environment)
- APP_URL          = https://<your-site>.netlify.app
- SHEET_WEBAPP_URL = <Apps Script web app URL>   (Deploy → New deployment → Web app → copy URL)

Google Sheet setup (one-time)
1) Create a Google Sheet with a sheet named "Dashboard" and headers in row 1 (exactly):
   Client | Store | Product Name | Product URL | Platform | Current Score | Last Audit | Notes | RowId
2) Extensions → Apps Script → paste the contents of GOOGLE_SHEETS_APPS_SCRIPT.txt and Deploy as Web app (Anyone with link).
3) Put the deployed Web app URL into Netlify env var SHEET_WEBAPP_URL.
4) Add rows for each prospect/client (RowId will be filled automatically by the script).

How it works
- On the 1st of every month (12:00 UTC), the function fetches your Sheet rows, re-scrapes Product URL, recomputes the score,
  and POSTs an update back to your Sheet (Current Score + Last Audit). It also appends a JSON snapshot to a "History" sheet.

Manual run (optional)
- You can trigger the function manually by visiting:
  {"https://<your-site>.netlify.app/.netlify/functions/monthly-reaudit?run=now"}

Deploy
1) In your existing Netlify site, upload a new deploy containing:
   - this netlify/functions/monthly-reaudit.js
   - your existing files (index.html, other functions), and the updated netlify.toml (with the [[scheduled.functions]] block)
2) Or: just add this folder's contents to your current site's repository and redeploy.

Built: 2025-10-07T03:39:54.239642Z

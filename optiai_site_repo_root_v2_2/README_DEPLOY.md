# OptiAI Site (v2.2)

## Upload this folder to GitHub (root)
Drag this **folder's contents** into your GitHub repo so the root shows:
- `index.html`
- `optimizer/`
- `netlify/`
- `data/`
- `netlify.toml`

## Netlify settings
- Publish directory: `.`
- Functions directory: `netlify/functions`
Then **Trigger deploy → Clear cache and deploy**.

## Verify
- Home shows: **Auto-Fetch & Tailor Plan v2.2**
- Debug line: "Functions: OK · Inline v2.2"
- Health: `/.netlify/functions/health` returns JSON.

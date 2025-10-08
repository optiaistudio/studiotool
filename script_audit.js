
(function(){
  const $ = s => document.querySelector(s);

  const CONS = { ctrMin: 0.12, ctrMax: 0.18, ordersMin: 0.08, ordersMax: 0.15, revMin: 0.10, revMax: 0.18 };

  function computeBreakdown(before, after){
    const split = [0.30, 0.30, 0.20, 0.20];
    const cats = ["AI Readability", "Content Authority", "Conversion Experience", "AI Placement Potential"];
    const make = (s) => split.map(x => Math.round(s * x));
    const b = make(before), a = make(after);
    return cats.map((name, i)=>({ name, before: b[i], after: a[i], lift: a[i]-b[i] }));
  }

  function conservativeROI(product, before, after, overrides){
    const price = Number(product.price || 0) || 45;
    const sessionsBase = (overrides && overrides.sessions) ? Number(overrides.sessions) : 2600;
    const crBase = (overrides && overrides.cr) ? Number(overrides.cr) : 0.021;

    const delta = Math.max(0, after - before);
    const visibilityLift = Math.min(0.25, delta * 0.003);
    const ctrLift = { min: CONS.ctrMin, max: CONS.ctrMax };
    const ordersLift = { min: CONS.ordersMin, max: CONS.ordersMax };
    const revLift = { min: CONS.revMin, max: CONS.revMax };

    const sessionsAfter = Math.round(sessionsBase * (1 + visibilityLift));
    const ordersBefore = Math.round(sessionsBase * crBase);
    const ordersAfterLo = Math.round(ordersBefore * (1 + ordersLift.min));
    const ordersAfterHi = Math.round(ordersBefore * (1 + ordersLift.max));
    const revBefore = Math.round(ordersBefore * price);
    const revAfterLo = Math.round(revBefore * (1 + revLift.min));
    const revAfterHi = Math.round(revBefore * (1 + revLift.max));

    return {
      sessionsBase, sessionsAfter,
      ordersBefore, ordersAfterLo, ordersAfterHi,
      revBefore, revAfterLo, revAfterHi,
      ctrText: `+${Math.round(ctrLift.min*100)}–${Math.round(ctrLift.max*100)}%`,
      ordersText: `+${Math.round(ordersLift.min*100)}–${Math.round(ordersLift.max*100)}%`
    };
  }

  async function openPDFInNewTab(container){
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit:'px', format:'a4' });
    const canvas = await html2canvas(container, { scale: 2, backgroundColor:'#0e0e10' });
    const img = canvas.toDataURL('image/png');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const w = canvas.width * ratio, h = canvas.height * ratio;
    pdf.addImage(img, 'PNG', (pageW - w)/2, 10, w, h);
    const url = pdf.output('bloburl');
    window.open(url, '_blank');
  }

  function fillOnePager(product, beforeScore, afterScore, overrides){
    const el = $('#auditReport');
    const host = product.url ? (new URL(product.url)).hostname.replace('www.','') : 'store';
    $('#arStore').textContent = host;
    $('#arDate').textContent = new Date().toLocaleDateString();
    $('#arUrl').textContent = product.url || '';

    $('#arBefore').textContent = beforeScore;
    $('#arAfter').textContent = afterScore;
    $('#arSummary').textContent = `We improved structured data, content clarity and trust signals to maximize AI placement and compress buyer friction.`;

    const tb = $('#arBreakdown'); tb.innerHTML = '';
    const rows = computeBreakdown(beforeScore, afterScore);
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:6px 4px;">${r.name}</td>
        <td style="padding:6px 4px;">${r.before}</td>
        <td style="padding:6px 4px;">${r.after}</td>
        <td style="padding:6px 4px;font-weight:600;">+${r.lift}</td>`;
      tb.appendChild(tr);
    });

    const fixes = [
      'Product JSON-LD, FAQ & Breadcrumb schema inlined',
      'Meta + copy normalization for AI parsing',
      'Alt text & media signals standardized',
      'Internal links with semantic anchors',
      'Review/rating eligibility surfaced'
    ];
    const ul = $('#arFixes'); ul.innerHTML = '';
    fixes.forEach(f => { const li = document.createElement('li'); li.textContent = f; ul.appendChild(li); });

    const roi = conservativeROI(product, beforeScore, afterScore, overrides);
    $('#arCTR').textContent = roi.ctrText;
    $('#arOrders').textContent = `${(roi.ordersBefore).toLocaleString()} → ${(roi.ordersAfterLo).toLocaleString()}–${(roi.ordersAfterHi).toLocaleString()}`;
    const revLo = (roi.revAfterLo - roi.revBefore);
    const revHi = (roi.revAfterHi - roi.revBefore);
    $('#arRev').textContent = `$${revLo.toLocaleString()} – $${revHi.toLocaleString()}`;

    return el;
  }

  document.addEventListener('click', async (e)=>{
    if (e.target && e.target.id === 'auditBtn') {
      const before = Number(document.getElementById('scoreBefore')?.textContent||0) || 0;
      const after  = Number(document.getElementById('scoreAfter')?.textContent||0)  || Math.max(before+20, 90);
      const product = (window.product) ? window.product : { url: document.getElementById('url')?.value, price: null };
      const wantsPrecision = confirm("Use real client data to improve the estimate? Click 'Cancel' to use conservative defaults.");
      let overrides = null;
      if (wantsPrecision) {
        const sessions = Number(prompt("Monthly sessions (site visits) for this PDP (e.g., 2500):", "2500"));
        const cr = Number(prompt("Current conversion rate as decimal (e.g., 0.02 for 2%):", "0.021"));
        if (!isNaN(sessions) && !isNaN(cr)) overrides = { sessions, cr };
      }
      const report = fillOnePager(product, before, after, overrides);
      report.classList.remove('hidden');
      await openPDFInNewTab(report);
      report.classList.add('hidden');
    }
  });
})();

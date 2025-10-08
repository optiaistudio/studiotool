
(function(){
  const $ = s => document.querySelector(s);

  document.addEventListener('change', (e)=>{
    if (e.target && e.target.id === 'sheetToggle') {
      const on = e.target.checked;
      const box = $('#sheetInputs'); if (!box) return;
      if (on) box.classList.remove('hidden'); else box.classList.add('hidden');
    }
  });

  document.addEventListener('click', async (e)=>{
    if (e.target && e.target.id === 'sheetSend') {
      const elMsg = document.getElementById('sheetMsg');
      function msg(t){ if (elMsg) elMsg.textContent = t; }

      try{
        const rowId = document.getElementById('sheetRowId')?.value || null;
        const before = Number(document.getElementById('scoreBefore')?.textContent||0) || 0;
        const after  = Number(document.getElementById('scoreAfter')?.textContent||0)  || before;
        const product = (window.product) ? window.product : { url: document.getElementById('url')?.value };
        const signals = (product && product.signals) ? product.signals : {};

        const currentScore = after || before || 0;
        const res = await fetch('/.netlify/functions/sheet-update', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ action:'update', rowId, currentScore, signals, ts: Date.now(), url: product?.url || '' })
        });
        const data = await res.json();
        if (data && data.ok) msg('Updated.');
        else msg('Failed: ' + (data && data.error ? data.error : 'unknown'));
      } catch(err) {
        const elMsg = document.getElementById('sheetMsg'); if (elMsg) elMsg.textContent = 'Error: ' + err.message;
      }
    }
  });
})();

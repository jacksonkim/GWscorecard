// Desktop column comparison view (2–3 hospitals)
(async function(){
  // read IDs from URL or localStorage
  const params = new URLSearchParams(location.search);
  const urlIds = (params.get('ids') || '').split(',').map(s=>s.trim()).filter(Boolean);
  const storedIds = JSON.parse(localStorage.getItem('gw_compare_ids') || '[]');
  const ids = urlIds.length ? urlIds : storedIds;

  // where to mount
  const card = document.querySelector('.page-content .container .card');
  if (!card) return;

  // remove legacy blocks if present
  card.querySelector('.header')?.remove();
  card.querySelector('.filters')?.remove();
  card.querySelector('.table-wrap')?.remove();
  card.querySelector('#cards')?.remove();

  // add simple title
  const title = document.createElement('h2');
  title.textContent = 'Comparison';
  title.style.margin = '0 0 12px';
  card.appendChild(title);

  // mount for grid
  const grid = document.createElement('div');
  grid.className = 'cmp-grid';
  card.appendChild(grid);

  if (ids.length < 2 || ids.length > 3){
    grid.textContent = 'Please select 2 or 3 hospitals from the results page.';
    return;
  }

  // load data
  const res = await fetch('./data/2025/2025_Lown_Index_GA.json', { cache: 'no-store' });
  const raw = await res.json();

  // index by your RECORD_ID
  const byId = new Map(raw.map(h => [String(h.RECORD_ID), h]));
  const chosen = ids.map(id => byId.get(String(id))).filter(Boolean);
  if (chosen.length !== ids.length){
    grid.textContent = 'One or more selected hospitals were not found.';
    return;
  }

  grid.style.setProperty('--cols', String(chosen.length));

  // helpers
  const g2s = (g) => {
    const map = {"A+":5,"A":5,"A-":4.5,"B+":4.5,"B":4,"B-":3.5,"C+":3.5,"C":3,"C-":2.5,"D+":2.5,"D":2,"D-":1.5,"F":1};
    return map[String(g||'').toUpperCase()] || 0;
  };
  const stars = (n) => {
    const wrap = document.createElement('span'); wrap.className='stars';
    const full = Math.floor(n);
    for(let i=1;i<=5;i++){
      const s=document.createElement('span');
      s.className='star' + (i<=full ? ' filled' : '');
      wrap.appendChild(s);
    }
    return wrap;
  };
  const text = (s)=> document.createTextNode(String(s ?? '—'));
  const cell = (child, cls='')=>{ const c=document.createElement('div'); c.className='cmp-cell ' + cls; if (child) c.appendChild(child); return c; };
  const label = (txt)=> cell(text(txt), 'cmp-cell--label');

  // header row with hospital info cards
  const head = document.createElement('div'); head.className='cmp-row cmp-row--head';
  head.appendChild(label('Hospital Name'));
  chosen.forEach((h, idx)=> head.appendChild(cell(hcard(h), idx>0 ? 'cmp-col-split' : '')));
  grid.appendChild(head);

  // metric and section builders
  const metricRow = (labelText, getter) => {
    const row = document.createElement('div'); row.className='cmp-row';
    row.appendChild(label(labelText));
    chosen.forEach((h, idx)=>{
      row.appendChild(cell(stars(g2s(getter(h))), idx>0 ? 'cmp-col-split' : ''));
    });
    grid.appendChild(row);
  };

  const section = (titleTxt, items) => {
    const row = document.createElement('div'); row.className='cmp-row';
    row.appendChild(label(titleTxt));
    chosen.forEach((_, idx)=> row.appendChild(cell(document.createTextNode(''), idx>0 ? 'cmp-col-split' : '')));
    grid.appendChild(row);
    items.forEach(([lbl, get])=> metricRow(lbl, get));
  };

  // rows matching your Figma
  metricRow('Overall Grade', h => h['TIER_1_GRADE_Lown_Composite']);

  section('Financial Transparency and Institutional Health', [
    ['Balance Growth',        h => h['TIER_3_GRADE_Exec_Comp']],
    ['Transparency',          h => h['TIER_3_GRADE_OU']],
    ['Fiscal Health',         h => h['TIER_2_GRADE_Value']],
    ['Staffing',              h => h['TIER_2_GRADE_Outcome']]
  ]);

  section('Community Benefit Spending', [
    ['Tax Benefit',           h => h['TIER_3_GRADE_CB']],
    ['Quality of CBS',        h => h['TIER_3_GRADE_CB']],
    ['Strategic Use',         h => h['TIER_3_GRADE_Civic']]
  ]);

  section('Healthcare Affordability and Billing', [
    ['Financial Burden',      h => h['TIER_3_GRADE_Cost_Eff']],
    ['Charity Care',          h => h['TIER_3_GRADE_Civic']],
    ['Medical Debt',          h => h['TIER_3_GRADE_Cost_Eff']]
  ]);

  section('Healthcare Access and Social Responsibility', [
    ['Range of Services',     h => h['TIER_3_GRADE_Pat_Exp']],
    ['Demographic Alignment', h => h['TIER_3_GRADE_Inclusivity']],
    ['Workforce Training',    h => h['TIER_3_GRADE_Pat_Saf']],
    ['Pay Equity Ratio',      h => h['TIER_3_GRADE_Exec_Comp']]
  ]);

  // hospital info card in header
  function hcard(h){
    const wrap = document.createElement('div'); wrap.className='hcard';
    const name = el('div','hcard__name', h.Name || 'Unnamed Hospital');
    const meta = el('div','hcard__meta', [h.City, h.State].filter(Boolean).join(', ') || '—');
    const info = document.createElement('div'); info.className='hinfo';

    info.appendChild(infoRow('Beds:', '—')); // dataset lacks exact beds
    info.appendChild(infoRow(h.TYPE_rural ? 'Rural' : 'Urban', ''));
    info.appendChild(infoRow('Critical Access:', truthy(h.TYPE_HospTyp_CAH) ? 'Yes' : 'No'));
    info.appendChild(infoRow('System:', truthy(h.HOSPITAL_SYSTEM) ? 'Yes' : 'No'));
    info.appendChild(infoRow('County:', h.County || '—'));

    wrap.appendChild(name); wrap.appendChild(meta); wrap.appendChild(info);
    return wrap;
  }
  function infoRow(label, value){
    const row = document.createElement('div'); row.className='hinfo__row';
    const dot = document.createElement('span'); dot.className='hinfo__dot';
    const txt = document.createElement('span'); txt.textContent = [label, value].filter(Boolean).join(' ').trim();
    row.appendChild(dot); row.appendChild(txt);
    return row;
  }
  function truthy(v){ return v===1 || v==='1' || v==='Y' || v==='Yes' || v===true; }
  function el(tag, cls, content){
    const n = document.createElement(tag); if (cls) n.className = cls;
    if (typeof content === 'string') n.textContent = content;
    else if (Array.isArray(content)) n.textContent = content.join(' ');
    return n;
  }
})();

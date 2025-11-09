// Load selected IDs from URL ?ids=... or localStorage (set by index page)
const params = new URLSearchParams(location.search);
const urlIds = (params.get('ids') || '').split(',').filter(Boolean);
const storedIds = JSON.parse(localStorage.getItem('gw_compare_ids') || '[]');
const selectedIds = new Set(urlIds.length ? urlIds : storedIds);

// Elements
const tbody = document.getElementById('tbody');
const cards = document.getElementById('cards');
const countySel = document.getElementById('county');
const ownerSel  = document.getElementById('ownership');
const teachYes  = document.getElementById('teachYes');
const teachNo   = document.getElementById('teachNo');
const minStars  = document.getElementById('minStars');
const minStarsVal = document.getElementById('minStarsVal');
const activeBar = document.getElementById('activeFilters');
const resetBtn  = document.getElementById('resetBtn');
const compareCount = document.getElementById('compareCount');

let data = [];                 // normalized rows for UI
const compared = new Set();    // live compare set in this page
let sortKey = 'overall_stars';
let sortDir = 'desc';

// --- Helpers (self-contained, no dependency on details.js) ---
function convertGradeToStars(grade) {
  const g = String(grade ?? '').trim().toUpperCase();
  const map = {"A+":5,"A":5,"A-":4.5,"B+":4.5,"B":4,"B-":3.5,"C+":3.5,"C":3,"C-":2.5,"D+":2.5,"D":2,"D-":1.5,"F":1};
  return { value: map[g] || 0 };
}
function starEl(n){
  const wrap=document.createElement('span'); wrap.className='stars';
  for(let i=1;i<=5;i++){ const s=document.createElement('span'); s.className='star'+(i<=n?' filled':''); wrap.appendChild(s); }
  return wrap;
}
const by = (key, dir='asc') => (a,b)=>{
  const va=a[key], vb=b[key];
  if(va===vb) return a.name.localeCompare(b.name);
  if(typeof va==='number' && typeof vb==='number') return dir==='asc'? va-vb : vb-va;
  return dir==='asc'? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
};
function uniqueVals(rows,key){ return [...new Set(rows.map(r=>r[key]))].filter(Boolean).sort(); }

// --- Load data from your dataset, normalize, and filter to selection ---
(async function init(){
  const res = await fetch('./data/2025/2025_Lown_Index_GA.json');
  const raw = await res.json();

  // normalize a subset of fields you use in index/details
  let rows = raw.map(h => {
    const id = String(h.RECORD_ID ?? h.Id ?? h.id ?? '');
    const name = h.Name || h.HOSPITAL_NAME || 'Unnamed Hospital';
    const county = h.County || '';
    const ownership = (h.TYPE_ForProfit ? 'For-profit'
                      : h.TYPE_NonProfit ? 'Nonprofit'
                      : h.TYPE_Government ? 'Government' : '');
    const teaching = (h.TYPE_AMC === 1 || String(h.TYPE_AMC).toUpperCase()==='Y'); // rough signal
    const beds = ''; // not in dataset; leave blank
    const overallGrade = h['TIER_1_GRADE_Lown_Composite'] || 'N/A';
    const safetyGrade  = h['TIER_3_GRADE_Pat_Saf'] || 'N/A';
    const expGrade     = h['TIER_3_GRADE_Pat_Exp'] || 'N/A';
    const equityGrade  = h['TIER_3_GRADE_Inclusivity'] || 'N/A';
    const valueGrade   = h['TIER_2_GRADE_Value'] || 'N/A';
    const outcomes     = h['TIER_2_GRADE_Outcome'] || h['TIER_2_GRADE_Outcomes'] || 'N/A';

    return {
      id, name, county,
      ownership: ownership || '—',
      teaching_hospital: !!teaching,
      beds: beds || '—',
      overall_stars: convertGradeToStars(overallGrade).value,
      patient_safety: convertGradeToStars(safetyGrade).value,
      patient_experience: convertGradeToStars(expGrade).value,
      equity: convertGradeToStars(equityGrade).value,
      affordability: convertGradeToStars(valueGrade).value,
      outcomes: convertGradeToStars(outcomes).value
    };
  });

  if (selectedIds.size) rows = rows.filter(r => selectedIds.has(r.id));
  data = rows;

  // seed compare set from selection
  (selectedIds.size ? selectedIds : new Set(rows.map(r=>r.id))).forEach(id=> compared.add(id));

  // bootstrap UI
  fillSelect(countySel, uniqueVals(data,'county'));
  fillSelect(ownerSel, uniqueVals(data,'ownership'));
  [minStars, teachYes, teachNo, countySel, ownerSel].forEach(el=> el.addEventListener('input', render));
  if (resetBtn) resetBtn.addEventListener('click', resetAll);

  if (compareCount) compareCount.textContent = `Comparing ${compared.size} hospital(s)`;
  render();
})();

function fillSelect(sel, vals){ sel.innerHTML=''; vals.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); }); }
function getFilters(){
  const counties=[...countySel.selectedOptions].map(o=>o.value);
  const owners=[...ownerSel.selectedOptions].map(o=>o.value);
  const teach = teachYes.checked && !teachNo.checked ? true : (!teachYes.checked && teachNo.checked ? false : null);
  const min = Number(minStars.value);
  minStarsVal.textContent = String(min);
  return { county:counties, ownership:owners, teaching:teach, minOverall:min };
}
function clearFilter(key){
  if(key==='county') countySel.selectedIndex=-1;
  if(key==='ownership') ownerSel.selectedIndex=-1;
  if(key==='teaching'){ teachYes.checked=false; teachNo.checked=false; }
  if(key==='minOverall') minStars.value=1;
}
function activeFiltersUI(filters){
  activeBar.innerHTML='';
  Object.entries(filters).forEach(([k,v])=>{
    if(v==null) return; if(Array.isArray(v)&&v.length===0) return;
    const pill=document.createElement('span'); pill.className='pill'; pill.textContent=`${k}: ${Array.isArray(v)?v.join(', '):v}`;
    const x=document.createElement('button'); x.textContent='✕'; x.onclick=()=>{ clearFilter(k); render(); };
    pill.appendChild(x); activeBar.appendChild(pill);
  });
  if(compared.size>0){
    const c=document.createElement('span'); c.className='pill'; c.textContent=`Comparing ${compared.size}`;
    const x=document.createElement('button'); x.textContent='✕'; x.onclick=()=>{ compared.clear(); render(); };
    c.appendChild(x); activeBar.appendChild(c);
  }
}
function applyFilters(rows){
  const f=getFilters(); activeFiltersUI(f);
  return rows.filter(r=>{
    if(f.county.length && !f.county.includes(r.county)) return false;
    if(f.ownership.length && !f.ownership.includes(r.ownership)) return false;
    if(f.teaching!==null && r.teaching_hospital!==f.teaching) return false;
    if((r.overall_stars||0) < f.minOverall) return false;
    return true;
  });
}
function render(){
  let rows = applyFilters(data.slice());
  rows.sort(by(sortKey, sortDir));
  rows.sort((a,b)=> Number(compared.has(b.id)) - Number(compared.has(a.id)));

  // table
  tbody.innerHTML='';
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    if(compared.has(r.id)) tr.classList.add('compare-row');

    const th=document.createElement('th'); th.scope='row'; th.className='sticky-col'; th.textContent=r.name; tr.appendChild(th);
    const add=(el)=>{ const td=document.createElement('td'); if(el instanceof HTMLElement) td.appendChild(el); else td.textContent=el; tr.appendChild(td); };

    add(starEl(r.overall_stars));
    add(starEl(r.patient_safety));
    add(starEl(r.patient_experience));
    add(starEl(r.equity));
    add(starEl(r.affordability));
    add(starEl(r.outcomes));
    add(r.ownership);
    add(r.teaching_hospital ? 'Yes':'No');
    add(String(r.beds));

    const td=document.createElement('td');
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=compared.has(r.id);
    cb.onchange=()=>{ if(cb.checked){ if(compared.size>=4){ cb.checked=false; alert('You can compare up to 4 hospitals.'); return; } compared.add(r.id);} else compared.delete(r.id); render(); };
    td.appendChild(cb); tr.appendChild(td);

    tbody.appendChild(tr);
  });

  // mobile cards
  cards.innerHTML='';
  rows.forEach(r=>{
    const el=document.createElement('div'); el.className='card-item';
    el.innerHTML=`
      <h3>${r.name}</h3>
      <div class="mrow"><span>Overall</span><span>${'★'.repeat(r.overall_stars)}${'☆'.repeat(5-r.overall_stars)}</span></div>
      <div class="mrow"><span>Safety</span><span>${'★'.repeat(r.patient_safety)}${'☆'.repeat(5-r.patient_safety)}</span></div>
      <div class="mrow"><span>Experience</span><span>${'★'.repeat(r.patient_experience)}${'☆'.repeat(5-r.patient_experience)}</span></div>
      <div class="mrow"><span>Equity</span><span>${'★'.repeat(r.equity)}${'☆'.repeat(5-r.equity)}</span></div>
      <div class="mrow"><span>Affordability</span><span>${'★'.repeat(r.affordability)}${'☆'.repeat(5-r.affordability)}</span></div>
      <div class="mrow"><span>Outcomes</span><span>${'★'.repeat(r.outcomes)}${'☆'.repeat(5-r.outcomes)}</span></div>
      <div class="mrow"><span>Ownership</span><span>${r.ownership}</span></div>
      <div class="mrow"><span>Teaching</span><span>${r.teaching_hospital?'Yes':'No'}</span></div>
      <div class="mrow"><span>Beds</span><span>${r.beds}</span></div>
      <div class="mrow"><label><input type="checkbox" ${compared.has(r.id)?'checked':''}/> Compare</label></div>`;
    el.querySelector('input[type="checkbox"]').onchange=(e)=>{
      if(e.target.checked){ if(compared.size>=4){ e.target.checked=false; alert('You can compare up to 4 hospitals.'); return; } compared.add(r.id); }
      else compared.delete(r.id);
      render();
    };
    cards.appendChild(el);
  });
}
function resetAll(){
  countySel.selectedIndex=-1; ownerSel.selectedIndex=-1; teachYes.checked=false; teachNo.checked=false; minStars.value=1; compared.clear(); sortKey='overall_stars'; sortDir='desc'; render();
}

// Desktop-only comparison grid (self-contained)
// - Reads ?ids=ID1,ID2[,ID3] or falls back to localStorage "gw_compare_ids"
// - Loads ./data/2025/2025_Lown_Index_GA.json
// - Builds a sticky-label grid with star rows (no external helpers needed)

(async function () {
  const params = new URLSearchParams(location.search);
  const urlIds = (params.get('ids') || '').split(',').map(s => s.trim()).filter(Boolean);
  const storedIds = JSON.parse(localStorage.getItem('gw_compare_ids') || '[]');
  const ids = urlIds.length ? urlIds : storedIds;

  // mount point: use the first .card in the page content
  const card = document.querySelector('.page-content .container .card');
  if (!card) return;

  // nuke legacy UI blocks so only the new grid shows
  card.querySelector('.header')?.remove();
  card.querySelector('.filters')?.remove();
  card.querySelector('.table-wrap')?.remove();
  card.querySelector('#cards')?.remove();

  const title = document.createElement('h2');
  title.textContent = 'Comparison';
  title.style.margin = '0 0 12px';
  card.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'cmp-grid';
  card.appendChild(grid);

  if (ids.length < 2 || ids.length > 3) {
    grid.textContent = 'Please select 2 or 3 hospitals from the results page.';
    return;
  }

  // load dataset
  const res = await fetch('./data/2025/2025_Lown_Index_GA.json', { cache: 'no-store' });
  const all = await res.json();

  // index by RECORD_ID
  const byId = new Map(all.map(h => [String(h.RECORD_ID), h]));
  const chosen = ids.map(id => byId.get(String(id))).filter(Boolean);
  if (chosen.length !== ids.length) {
    grid.textContent = 'One or more selected hospitals were not found.';
    return;
  }

  grid.style.setProperty('--cols', String(chosen.length));

  // ---- helpers ----
  const gradeToStars = (g) => {
    const map = { "A+":5, A:5, "A-":4.5, "B+":4.5, B:4, "B-":3.5, "C+":3.5, C:3, "C-":2.5, "D+":2.5, D:2, "D-":1.5, F:1 };
    return map[String(g || '').toUpperCase()] ?? 0;
  };
  
  // Round to nearest 0.5 (so we keep half-stars)
	function roundToHalf(x){ return Math.round(x * 2) / 2; }

	// Average a list of metric getters for one hospital -> stars (0..5, .5 steps)
	function averageStars(getters, hospital){
	  const vals = getters
		.map(get => gradeToStars(get(hospital)))      // letter grade -> numeric stars
		.filter(n => Number.isFinite(n) && n > 0);    // ignore missing/invalid (0 treated as “no data”)
	  if (!vals.length) return 0;                      // no data → empty stars
	  return roundToHalf(vals.reduce((a,b)=>a+b, 0) / vals.length);
	}

  // simple inline-SVG stars; no external CSS required
  function starSVG(fill) {
    return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="${fill}" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>`;
  }
  function renderStars(n) {
    const full = Math.floor(n + 1e-9);
    const half = (n - full) >= 0.5 ? 1 : 0; // we map only x.0 or x.5 from Lown grades
    const totalEmpty = 5 - full - half;
    // colors match your palette: filled=orange, empty=light green
    const filled = starSVG('#f48810').repeat(full);
    const halfStar = half ? starSVG('url(#half)') : ''; // visual half becomes filled for simplicity
    const empty = starSVG('#a4cc95').repeat(totalEmpty);
    // To keep things simple and reliable across browsers, render half as filled too:
    return `<span class="stars">${filled}${half ? starSVG('#f48810') : ''}${empty}</span>`;
  }

  const cell = (childHTML, cls='') => {
    const d = document.createElement('div');
    d.className = 'cmp-cell ' + cls;
    if (childHTML != null) d.innerHTML = childHTML;
    return d;
  };
  const labelCell = (txt) => {
    const d = document.createElement('div');
    d.className = 'cmp-cell cmp-cell--label';
    d.textContent = txt;
    return d;
  };

  // header row (info cards)
  const head = document.createElement('div');
  head.className = 'cmp-row cmp-row--head';
  head.appendChild(labelCell('Hospital Name'));
  chosen.forEach((h, i) => head.appendChild(cell(hcard(h), i>0 ? 'cmp-col-split' : '')));
  grid.appendChild(head);

  // metric row builder
  const metricRow = (label, getter) => {
    const row = document.createElement('div'); row.className = 'cmp-row';
    row.appendChild(labelCell(label));
    chosen.forEach((h, i) => {
      const g = getter(h);            // e.g., "B+" etc.
      const n = gradeToStars(g);      // → 0..5 in 0.5 steps
      row.appendChild(cell(renderStars(n), i>0 ? 'cmp-col-split' : ''));
    });
    grid.appendChild(row);
  };

  // section builder (overall-average row + individual metric rows)
	const section = (title, items) => {
	  // Overall average row for this category
	  const getters = items.map(([_, get]) => get);
	  const overall = document.createElement('div');
	  overall.className = 'cmp-row';
	  overall.appendChild(labelCell(title));
	  chosen.forEach((h, i) => {
		const n = averageStars(getters, h);
		overall.appendChild(cell(renderStars(n), i > 0 ? 'cmp-col-split' : ''));
	  });
	  grid.appendChild(overall);

	  // Individual metric rows
	  items.forEach(([lbl, keyGetter]) => metricRow(lbl, keyGetter));
	};

  // ---- rows (keys verified against your JSON) ----
  metricRow('Overall Grade', h => h['TIER_1_GRADE_Lown_Composite']);

  section('Financial Transparency and Institutional Health', [
    ['Balance Growth',   h => h['TIER_3_GRADE_Exec_Comp']],
    ['Transparency',     h => h['TIER_3_GRADE_OU']],
    ['Fiscal Health',    h => h['TIER_2_GRADE_Value']],
    ['Staffing',         h => h['TIER_2_GRADE_Outcome']],
  ]);

  section('Community Benefit Spending', [
    ['Tax Benefit',      h => h['TIER_3_GRADE_CB']],
    ['Quality of CBS',   h => h['TIER_3_GRADE_CB']],          // same source per dataset
    ['Strategic Use',    h => h['TIER_2_GRADE_Civic']],       // NOTE: Tier 2 (not Tier 3)
  ]);

  section('Healthcare Affordability and Billing', [
    ['Financial Burden', h => h['TIER_3_GRADE_Cost_Eff']],
    ['Charity Care',     h => h['TIER_2_GRADE_Civic']],
    ['Medical Debt',     h => h['TIER_3_GRADE_Cost_Eff']],
  ]);

  section('Healthcare Access and Social Responsibility', [
    ['Range of Services',     h => h['TIER_3_GRADE_Pat_Exp']],
    ['Demographic Alignment', h => h['TIER_3_GRADE_Inclusivity']],
    ['Workforce Training',    h => h['TIER_3_GRADE_Pat_Saf']],
    ['Pay Equity Ratio',      h => h['TIER_3_GRADE_Exec_Comp']],
  ]);

  // info card in header
  function hcard(h) {
    const county = h.County || '—';
    const rural = h.TYPE_rural ? 'Rural' : 'Urban';
    const cah = truthy(h.TYPE_HospTyp_CAH) ? 'Yes' : 'No';
    const sys = truthy(h.HOSPITAL_SYSTEM) ? 'Yes' : 'No';

    return `
      <div class="hcard">
        <div class="hcard__name">${escapeHTML(h.Name || 'Unnamed Hospital')}</div>
        <div class="hcard__meta">${escapeHTML([h.City, h.State].filter(Boolean).join(', ') || '—')}</div>
        <div class="hinfo">
          ${infoRow('Beds:', '—')}
          ${infoRow('', rural)}
          ${infoRow('Critical Access:', cah)}
          ${infoRow('System:', sys)}
          ${infoRow('County:', county)}
        </div>
      </div>
    `;
  }
  function infoRow(label, value) {
    const txt = [label, value].filter(Boolean).join(' ').trim();
    return `<div class="hinfo__row"><span class="hinfo__dot"></span><span>${escapeHTML(txt)}</span></div>`;
  }
  function truthy(v){ return v===1 || v==='1' || v==='Y' || v==='Yes' || v===true; }
  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
})();
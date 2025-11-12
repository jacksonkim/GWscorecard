// comparison.js — grid layout matching your desktop mock

const DATA_URL = "data/2025_Lown_Index_GA.json"; // adjust if your path differs

// Normalize current JSON structure
function normalizeLown(h){
  return {
    id: String(h.RECORD_ID),
    name: h.Name,
    city: h.City,
    state: h.State,
    // core grades (letters A–F)
    comp:    h.TIER_1_GRADE_Lown_Composite,
    outcome: h.TIER_2_GRADE_Outcome,
    value:   h.TIER_2_GRADE_Value,
    civic:   h.TIER_2_GRADE_Civic,
    patExp:  h.TIER_3_GRADE_Pat_Exp,
    // optional details if you add them later; safe fallbacks:
    beds:    h.Bed_Size || h.Beds || null,
    rural:   h.Urban_Rural || null,
    critical:h.Critical_Access || null,
    system:  h.System_Name || null,
    county:  h.County || null,
  };
}

// Utility
function qs(name, d=document){ return d.querySelector(name); }
function getSelectedIds(){
  const q = new URLSearchParams(location.search).get("ids") || "";
  return q.split(",").map(s => s.trim()).filter(Boolean).map(String);
}

// Build the header “info card” for each hospital column
function headerCard(h){
  const bullets = [
    h.beds    ? `Beds: ${h.beds}` : null,
    h.rural   ? `${h.rural}` : null,
    h.critical? `Critical Access: ${h.critical}` : null,
    h.system  ? `System: ${h.system}` : null,
    h.county  ? `County: ${h.county}` : null,
  ].filter(Boolean).map(x => `<li><span class="cmp-dot"></span>${x}</li>`).join("");

  return `
    <div class="cmp-hdr">
      <div class="cmp-name">${h.name}</div>
      <div class="cmp-sub">${h.city ? `${h.city}, ` : ""}${h.state ?? ""}</div>
      ${bullets ? `<ul class="cmp-bullets">${bullets}</ul>` : ""}
    </div>
  `;
}

// Metric rows (use what you have now; add more later as your JSON expands)
const METRICS = [
  { key: "comp",    label: "Overall Grade" },
  { key: "outcome", label: "Outcome" },
  { key: "value",   label: "Value" },
  { key: "civic",   label: "Civic" },
  { key: "patExp",  label: "Patient Experience" },
];

// Render a letter pill; if you later switch to stars, replace here.
function gradePill(letter){
  const txt = letter ?? "—";
  const cls = String(letter || "").toLowerCase();
  return `<span class="cmp-pill rc-grade rc-grade-${cls}">${txt}</span>`;
}

// Main render
function renderGrid(hospitals){
  const root = qs("#compareGrid");
  if(!root) return;

  if(!hospitals.length){
    root.innerHTML = `<p>No matching hospitals found for the requested IDs.</p>`;
    return;
  }

  // Set the grid columns: fixed 260px labels + N hospital columns
  root.style.gridTemplateColumns = `260px repeat(${hospitals.length}, 1fr)`;

  const cells = [];

  // Top row: left title cell + one header card per hospital
  cells.push(`<div class="cmp-label" style="background:transparent; border:none;"></div>`);
  hospitals.forEach(h => cells.push(`<div class="cmp-cell">${headerCard(h)}</div>`));

  // Metric rows
  METRICS.forEach(m => {
    // left label
    cells.push(`<div class="cmp-rowlabel">${m.label}</div>`);
    // one cell per hospital
    hospitals.forEach(h => {
      const val = h[m.key];
      cells.push(`<div class="cmp-cell">${gradePill(val)}</div>`);
    });
  });

  root.innerHTML = cells.join("");
}

// Bootstrap
(async function init(){
  const ids = getSelectedIds();
  const resp = await fetch(DATA_URL);
  const raw  = await resp.json();
  const rows = Array.isArray(raw) ? raw : (raw.hospitals || raw.rows || []);
  const all  = rows.map(normalizeLown);

  // Pick by RECORD_ID; hard cap 3 columns
  const pick = new Set(ids.slice(0,3));
  const hospitals = all.filter(h => pick.has(h.id));

  renderGrid(hospitals);
})();

// ===============================
// Data Storage
// ===============================
let hospitalData = [];

document.addEventListener('DOMContentLoaded', () => {
  const toggle   = document.getElementById('filtersToggle');
  const drawer   = document.getElementById('filtersDrawer'); // <aside class="sidebar" id="filtersDrawer">
  const backdrop = document.getElementById('drawerBackdrop');

  if (!toggle || !drawer || !backdrop) return;

  let lastFocused = null;

  const openDrawer = () => {
    lastFocused = document.activeElement;
    document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    backdrop.hidden = false;
    // optional: focus first interactive element in the drawer
    const first = drawer.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (first) first.focus({ preventScroll: true });
  };

  const closeDrawer = () => {
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
    if (lastFocused) lastFocused.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = document.body.classList.contains('drawer-open');
    isOpen ? closeDrawer() : openDrawer();
  });

  backdrop.addEventListener('click', closeDrawer);

  // Close on Esc
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) {
      closeDrawer();
    }
  });

  // Auto-close drawer when moving to desktop width
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 993 && document.body.classList.contains('drawer-open')) {
      closeDrawer();
    }
  });

    const applyBtn = document.getElementById('applyFiltersBtn');
	  if (applyBtn) applyBtn.addEventListener('click', closeDrawer);

	  // NEW: X button inside the drawer
	  const closeBtn = document.getElementById('closeDrawerBtn');
	  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
});

});


// ===============================
// Load JSON Data
// ===============================
fetch("./data/2025/2025_GW_HospitalScores.json")
  .then(res => res.json())
  .then(data => {
    hospitalData = data;
    console.log("Hospital data loaded:", hospitalData.length, "records");

    // Initial render
    renderHospitals(hospitalData);
	initHospitalMap(hospitalData);

  })
  .catch(err => console.error("Error loading JSON:", err));

// ===============================
// Render Hospitals
// ===============================
function renderHospitals(data) {
  const resultsTable = document.getElementById("hospitalResults");
  const resultsCount = document.getElementById("resultsCount");

  // Clear old results
  resultsTable.innerHTML = "";

  // Update results count
  resultsCount.textContent = `Viewing ${data.length} results`;

  if (!data.length) {
    resultsTable.innerHTML = `
      <tr>
        <td colspan="4">No hospitals match the selected filters.</td>
      </tr>
    `;
    return;
  }

  // Helper to clamp numeric ratings to 0–5
  const clampRating = (raw) => {
    const n = Number(raw);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(5, n));
  };

  data.forEach(hospital => {
    // Use your new Hospital_ID as the primary id
    const hid = String(
      hospital.Hospital_ID ??
      hospital.hospital_id ??
      ""
    );

    // Overall star rating (0–5 numeric)
    const overall = clampRating(hospital.Overall_Star_Rating);

    // === Main Row ===
    const row = document.createElement("tr");
    row.classList.add("hospital-row");
    if (hid) row.dataset.id = hid;

    // Column 1: Overall grade stars
    const gradeCell = document.createElement("td");
    gradeCell.innerHTML = `
      <div class="star-rating" aria-label="${overall} out of 5 stars">
        ${renderStars(overall)}
      </div>
      <div class="overall-label">Overall score</div>
    `;
    row.appendChild(gradeCell);

    // Column 2: Hospital name + location
    const nameCell = document.createElement("td");

    const name   = hospital.Hospital_Name || "Unnamed Hospital";
    const city   = hospital.City || "";
    const state  = hospital.State || "";
    const zip    = hospital.ZIP_Code || "";
    const county = hospital.County ? `${hospital.County} County` : "";
    const addressLine = hospital.Street_Address
      ? `${hospital.Street_Address}, ${city}, ${state} ${zip}`
      : `${city}, ${state} ${zip}`.trim();

    const detailsUrl = `details.html?id=${encodeURIComponent(hid)}`;

    nameCell.innerHTML = `
      <div class="hospital-main">
        <strong>
          <a href="${detailsUrl}" class="hospital-link">
            ${name}
          </a>
        </strong>
        <div class="hospital-meta">
          ${addressLine ? `<div class="hospital-address">${addressLine}</div>` : ""}
          ${county ? `<div class="hospital-county">${county}</div>` : ""}
        </div>
      </div>
    `;
    row.appendChild(nameCell);

    // Column 3: Accordion toggle + "Full details" button
    const buttonCell = document.createElement("td");
    buttonCell.classList.add("details-buttons");

    const detailsButton = document.createElement("button");
    detailsButton.type = "button";
    detailsButton.textContent = "View Category Scores ▼";
    detailsButton.classList.add("toggle-detail");

    const fullDetailsButton = document.createElement("button");
    fullDetailsButton.type = "button";
    fullDetailsButton.textContent = "Full details";
    fullDetailsButton.classList.add("view-full-detail");
    fullDetailsButton.addEventListener("click", () => {
      if (hid) {
        window.location.href = detailsUrl;
      }
    });

    buttonCell.appendChild(detailsButton);
    buttonCell.appendChild(fullDetailsButton);
    row.appendChild(buttonCell);

    // Column 4: Compare toggle (uses existing compareSet / localStorage)
    const cmpCell = document.createElement("td");
    const isSelected = compareSet && compareSet.has(hid);

    cmpCell.innerHTML = `
      <button
        class="cmp-toggle js-compare-toggle"
        type="button"
        aria-pressed="${isSelected ? "true" : "false"}"
        data-id="${hid}"
        title="${isSelected ? "Selected for comparison" : "Select for comparison"}"
      >
        <!-- Outline = unselected -->
        <svg class="cmp-icon cmp-icon--off" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0-2C6.6 2 3 5 3 9.5S6.6 17 11 17s8-3.6 8-7.5S15.4 2 11 2zm0 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"/>
        </svg>

        <!-- Filled = selected -->
        <svg class="cmp-icon cmp-icon--on" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 10.5 17a6.47 6.47 0 0 0 4.93-2.32l.27.28h.8l5 5-1.5 1.5-5-5zm-5 1.5C7.5 15.5 5 13 5 10s2.5-5 5.5-5 5.5 2.5 5.5 5-2.5 5.5-5.5 5.5z"/>
        </svg>
      </button>
    `;
    row.appendChild(cmpCell);

    // === Accordion detail row with 4 main categories ===
    const detailRow = document.createElement("tr");
    detailRow.classList.add("hospital-detail-row");
    detailRow.style.display = "none";

    const detailCell = document.createElement("td");
    detailCell.colSpan = 4;

    const ftih = clampRating(hospital.FTIH_Category_Rating);
    const cbs  = clampRating(hospital.CBS_Category_Rating);
    const hab  = clampRating(hospital.HAB_Category_Rating);
    const hasr = clampRating(hospital.HASR_Category_Rating);

    detailCell.innerHTML = `
      <div class="detail-info category-grid">
        <div class="category-row">
          <h4>Financial Transparency &amp; Institutional Health</h4>
          <div class="category-stars">${renderStars(ftih)}</div>
        </div>
        <div class="category-row">
          <h4>Community Benefit Spending</h4>
          <div class="category-stars">${renderStars(cbs)}</div>
        </div>
        <div class="category-row">
          <h4>Healthcare Affordability &amp; Billing</h4>
          <div class="category-stars">${renderStars(hab)}</div>
        </div>
        <div class="category-row">
          <h4>Healthcare Access &amp; Social Responsibility</h4>
          <div class="category-stars">${renderStars(hasr)}</div>
        </div>
      </div>
    `;
    detailRow.appendChild(detailCell);

    // Toggle accordion open/close
    detailsButton.addEventListener("click", () => {
      const isHidden =
        detailRow.style.display === "none" ||
        detailRow.style.display === "";

      detailRow.style.display = isHidden ? "table-row" : "none";
      detailsButton.textContent = isHidden
        ? "Hide Category Scores ▲"
        : "View Category Scores ▼";
    });

    // Append both rows to the table
    resultsTable.appendChild(row);
    resultsTable.appendChild(detailRow);
  });
}


// --- Mobile card renderer (for phones) ---
function renderMobileCards(hospitals) {
  const container = document.getElementById('results');
  if (!container) return;
  const list = Array.isArray(hospitals) ? hospitals : [];

  container.innerHTML = list.map(h => `
    <article class="result-card">
      <header class="rc-head">
        <h3 class="rc-title">${h.Name}</h3>
        <div class="rc-meta">
          <span class="rc-grade rc-grade-${String(h.TIER_1_GRADE_Lown_Composite || '').toLowerCase()}">
			  ${h.TIER_1_GRADE_Lown_Composite ?? '—'}
			</span>
          <span class="rc-loc">${h.City || ''}, ${h.State || ''}</span>
        </div>
      </header>

      <div class="rc-body">
		<div class="star-rating" aria-label="${(h.Overall_Star_Rating ?? 0)} out of 5 stars">
		  ${renderStars(h.Overall_Star_Rating ?? 0)}
		  </div>
		  <ul class="rc-metrics">
			 <li><strong>Outcome:</strong> ${h.TIER_2_GRADE_Outcome ?? '—'}</li>
			 <li><strong>Value:</strong> ${h.TIER_2_GRADE_Value ?? '—'}</li>
			 <li><strong>Civic:</strong> ${h.TIER_2_GRADE_Civic ?? '—'}</li>
			 <li><strong>Patient Experience:</strong> ${h.TIER_3_GRADE_Pat_Exp ?? '—'}</li>
		  </ul>
		</div>

      <footer class="rc-foot">
        <a class="btn btn-outline" href="details.html?id=${encodeURIComponent(h.RECORD_ID)}">View details</a>
        <a class="btn btn-solid" href="details.html?id=${encodeURIComponent(h.RECORD_ID)}&tab=full">Full details</a>
      </footer>
    </article>
  `).join('');
}

// --- Use cards as the primary render and clear legacy table ---
  const _renderHospitals = renderHospitals; // keep reference just in case
  renderHospitals = function(list){
    // render cards
    renderMobileCards(list || []);
    // update count
    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.textContent = `Viewing ${(list?.length)||0} results`;
    // clear legacy table (keeps DOM but prevents double UI)
    const tbody = document.getElementById('hospitalResults');
    if (tbody) tbody.innerHTML = '';
  };


function toggleHospitalDetails(hospitalId, button) {
  const existingRow = document.querySelector(`.details-row[data-id="${hospitalId}"]`);
  if (existingRow) {
    existingRow.remove(); // close if already open
    return;
  }

  const hospital = hospitalData.find(h => h.RECORD_ID === hospitalId);
  if (!hospital) {
    console.error("Hospital not found:", hospitalId);
    return;
  }

  const detailsRow = document.createElement("tr");
  detailsRow.classList.add("details-row");
  detailsRow.setAttribute("data-id", hospitalId);

  detailsRow.innerHTML = `
    <td colspan="3">
      <div class="hospital-details-dropdown show">
        <div class="details-grid">
          ${renderGrades(hospital)}
        </div>
      </div>
    </td>
  `;

  const currentRow = button.closest("tr");
  currentRow.parentNode.insertBefore(detailsRow, currentRow.nextSibling);
}


function renderGrades(hospital) {
  const metrics = [
    { key: "TIER_1_GRADE_Lown_Composite", label: "Tier 1 Composite" },
    { key: "TIER_2_GRADE_Outcome", label: "Tier 2 Outcome" },
    { key: "TIER_2_GRADE_Value", label: "Tier 2 Value" },
    { key: "TIER_2_GRADE_Civic", label: "Tier 2 Civic" },
    { key: "TIER_3_GRADE_Outcome", label: "Tier 3 Outcome" },
    { key: "TIER_3_GRADE_Pat_Saf", label: "Tier 3 Patient Safety" },
    { key: "TIER_3_GRADE_Pat_Exp", label: "Tier 3 Patient Experience" },
    { key: "TIER_3_GRADE_OU", label: "Tier 3 Overuse" },
    { key: "TIER_3_GRADE_Cost_Eff", label: "Tier 3 Cost Efficiency" },
    { key: "TIER_3_GRADE_Exec_Comp", label: "Tier 3 Exec Comp" },
    { key: "TIER_3_GRADE_CB", label: "Tier 3 Community Benefit" },
    { key: "TIER_3_GRADE_Inclusivity", label: "Tier 3 Inclusivity" }
  ];

  return metrics.map(m => {
	  const grade = hospital[m.key] || "N/A";
	  const stars = convertGradeToStars(grade);
	  return `
		<div class="details-section">
		  <h4>${m.label}</h4>
		  <div class="star-rating" aria-label="${stars.value} out of 5 stars (Grade ${grade})">
			${renderStars(stars.value)}
			<span class="sr-only">${stars.value} out of 5 stars (Grade ${grade})</span>
		  </div>
		</div>
	  `;
	}).join("");

}



const viewSystemsBtn = document.getElementById("viewSystemsBtn");
const viewIndividualsBtn = document.getElementById("viewIndividualsBtn");
const individualOptions = document.getElementById("individualOptions");

const filterCriticalBtn = document.getElementById("filterCriticalBtn");
const filterAcuteBtn = document.getElementById("filterAcuteBtn");

function deactivateHospitalTypeButtons() {
  filterCriticalBtn.classList.remove("active");
  filterAcuteBtn.classList.remove("active");
}

// Critical Access toggle
filterCriticalBtn.addEventListener("click", () => {
  const isActive = filterCriticalBtn.classList.contains("active");

  deactivateHospitalTypeButtons();
  if (!isActive) {
    filterCriticalBtn.classList.add("active");
  }

  console.log("Hospital type selected:", getSelectedHospitalType());
});

// Acute Care toggle
filterAcuteBtn.addEventListener("click", () => {
  const isActive = filterAcuteBtn.classList.contains("active");

  deactivateHospitalTypeButtons();
  if (!isActive) {
    filterAcuteBtn.classList.add("active");
  }

  console.log("Hospital type selected:", getSelectedHospitalType());
});

// Helper function to get current selection
function getSelectedHospitalType() {
  if (filterCriticalBtn.classList.contains("active")) return "Critical Access";
  if (filterAcuteBtn.classList.contains("active")) return "Acute Care";
  return null;
}

viewSystemsBtn.addEventListener("click", () => {
  viewSystemsBtn.classList.add("active");
  viewIndividualsBtn.classList.remove("active");
  individualOptions.style.display = "none";

  console.log("View set to: Hospital Systems");
  // TODO: Implement system-level rendering
  renderHospitals(hospitalData); // placeholder
});

viewIndividualsBtn.addEventListener("click", () => {
  viewIndividualsBtn.classList.add("active");
  viewSystemsBtn.classList.remove("active");
  individualOptions.style.display = "block";

  console.log("View set to: Individual Hospitals");
  // TODO: Implement individual rendering with critical/acute filtering
  renderHospitals(hospitalData); // placeholder
});

function sortAndRender(data) {
  const sortValue = document.getElementById("sortSelect").value;

  let sorted = [...data];

  if (sortValue === "grade") {
    sorted.sort((a, b) => {
      const gradeA = a.TIER_1_GRADE_Lown_Composite || "F";
      const gradeB = b.TIER_1_GRADE_Lown_Composite || "F";
      return gradeA.localeCompare(gradeB); // or reverse it if needed
    });
  } else if (sortValue === "distance") {
    sorted.sort((a, b) => {
      return (a.distance || 99999) - (b.distance || 99999); // assumes `.distance` was set by ZIP logic
    });
  } else if (sortValue === "name") {
    sorted.sort((a, b) => (a.Name || "").localeCompare(b.Name || ""));
  }
    else if (sortValue === "size") {
    const sizeOrder = ["Small", "Medium", "Large", "Extra Large"];

    sorted.sort((a, b) => {
      const sizeA = a.Size || "";
      const sizeB = b.Size || "";
      const indexA = sizeOrder.indexOf(sizeA) !== -1 ? sizeOrder.indexOf(sizeA) : 999;
      const indexB = sizeOrder.indexOf(sizeB) !== -1 ? sizeOrder.indexOf(sizeB) : 999;
      return indexA - indexB;
    });
  }


  renderHospitals(sorted);
}

// ===============================
// Apply Filters
// ===============================
document.getElementById("applyFiltersBtn").addEventListener("click", () => {
  const zip = document.getElementById("zipInput").value.trim();
  const radius = document.getElementById("radiusSelect").value;
  const checked = [...document.querySelectorAll("input[type='checkbox']:checked")].map(cb => cb.value);

  console.log("ZIP:", zip, "Radius:", radius);
  console.log("Selected Filters:", checked);

  // TODO: Real filtering logic (hook into fields in JSON)
  let filtered = hospitalData.filter(h => {
    return checked.every(val =>
      JSON.stringify(h).toLowerCase().includes(val.toLowerCase())
    );
  });

  renderHospitals(filtered);
  initHospitalMap(filtered);

});

// ===============================
// Reset Filters
// ===============================
document.getElementById("resetFiltersBtn").addEventListener("click", () => {
  document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
  document.getElementById("zipInput").value = "";
  document.getElementById("radiusSelect").selectedIndex = 0;
  console.log("Filters reset");

  renderHospitals(hospitalData);
});

// ===============================
// Download Data (Stub)
// ===============================
document.getElementById("downloadDataBtn").addEventListener("click", () => {
  console.log("Download triggered");
  // TODO: backend or SheetJS export
});

function showHospitalDetailPage(hospitalId) {
    document.querySelector('.main-content').style.display = 'none';
    document.querySelector('.map-section').style.display = 'none';

    const hospital = hospitalData.find(h => h.RECORD_ID == hospitalId);

    if (!hospital) {
        window.location.href = window.location.pathname;
        return;
    }

    const detailContainer = document.createElement('div');
    detailContainer.className = 'hospital-detail-container';

    const gradeClass = `grade-${hospital.TIER_1_GRADE_Lown_Composite}`;

    const lat = 32.6782 + (Math.random() - 0.5) * 2;
    const lng = -83.2226 + (Math.random() - 0.5) * 2;

    detailContainer.innerHTML = `
        <div class="hospital-header">
            <h2>${hospital.HOSPITAL_NAME}</h2>
            <span class="hospital-grade ${gradeClass}">${hospital.TIER_1_GRADE_Lown_Composite}</span>
        </div>
        <p><strong>Location:</strong> ${hospital.CITY}, ${hospital.STATE}</p>
        <p><strong>Type:</strong> ${hospital.HOSPITAL_TYPE}</p>
        <p><strong>Ownership:</strong> ${hospital.OWNERSHIP}</p>
        <p><strong>System Name:</strong> ${hospital.SYSTEM_NAME}</p>
        <p><strong>Zip Code:</strong> ${hospital.ZIP_CODE}</p>
        <button onclick="window.location.reload()">Back to Results</button>
    `;

    document.body.appendChild(detailContainer);
}

// ===============================
// Star Rating Utilities
// ===============================
function convertGradeToStars(grade) {
  const gradeMap = {
    "A+": 5,
    "A": 5,
    "A-": 4.5,
    "B+": 4.5,
    "B": 4,
    "B-": 3.5,
    "C+": 3.5,
    "C": 3,
    "C-": 2.5,
    "D+": 2.5,
    "D": 2,
    "D-": 1.5,
    "F": 1,
  };
  const value = gradeMap[grade.trim()] || 0;
  return { value };
}

function renderStars(value) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (value >= i) {
      html += fullStarSVG();
    } else if (value >= i - 0.5) {
      html += halfStarSVG();
    } else {
      html += emptyStarSVG();
    }
  }
  return html;
}

function fullStarSVG() {
  return `
    <svg class="star full" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>
  `;
}

function halfStarSVG() {
  return `
    <svg class="star half" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="halfGradient" x1="0" x2="1">
          <stop offset="50%" stop-color="#f48810" />
          <stop offset="50%" stop-color="#a4cc95" />
        </linearGradient>
      </defs>
      <path fill="url(#halfGradient)" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>
  `;
}

function emptyStarSVG() {
  return `
    <svg class="star empty" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>
  `;
}

// ===============================
// Leaflet Map Integration
// ===============================
let map; // Global map instance so we can reuse it
let mapMarkers = []; // Store current markers to clear them later

// ===============================
// ZIP-Based Coordinate Approximation (for hospitals without lat/lon)
// ===============================
function getZipCoords(zip) {
  const baseLat = 31.0;   // southern edge of Georgia
  const baseLon = -85.5;  // western edge of Georgia
  const zipNum = parseInt(String(zip).replace(/\D/g, "")) || 30000;

  // Spread zip codes somewhat evenly across the state
  const offsetLat = ((zipNum % 300) / 100) * 0.8; // 0–2.4° northward variation
  const offsetLon = ((zipNum % 700) / 100) * 0.8; // 0–2.4° eastward variation

  return [baseLat + offsetLat, baseLon + offsetLon];
}

function initHospitalMap(data) {
  const mapDiv = document.getElementById("mainMap");
  if (!mapDiv) return;

  // Initialize only once
	if (!map) {
	  map = L.map("mainMap").setView([32.7, -83.4], 7); // centered around Georgia
	  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
		attribution: "&copy; OpenStreetMap contributors"
	  }).addTo(map);
	}

  // Clear old markers
  mapMarkers.forEach(marker => map.removeLayer(marker));
  mapMarkers = [];

  // Add new markers
  data.forEach(hospital => {
    // Try all common latitude/longitude field names
	let lat =
	  parseFloat(hospital.Latitude) ||
	  parseFloat(hospital.LAT) ||
	  parseFloat(hospital.lat) ||
	  parseFloat(hospital.latitude);
	let lon =
	  parseFloat(hospital.Longitude) ||
	  parseFloat(hospital.LON) ||
	  parseFloat(hospital.lon) ||
	  parseFloat(hospital.longitude);

	// If no coordinates, approximate from ZIP code
	if ((!lat || !lon) && hospital.Zip) {
	  [lat, lon] = getZipCoords(hospital.Zip);
	}
	if (!lat || !lon) return; // Skip entries missing coordinates

    const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
    const stars = convertGradeToStars(grade);

    const popupHTML = `
      <strong>${hospital.HOSPITAL_NAME || hospital.Name}</strong><br>
      ${hospital.CITY || ""}, ${hospital.STATE || ""}<br>
      <div class="star-rating">${renderStars(stars.value)}</div>
      <a href="details.html?id=${hospital.RECORD_ID}" target="_blank" class="view-full-detail">
        View Full Details
      </a>
    `;

    const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
    mapMarkers.push(marker);
  });

  // Adjust map to fit all visible markers
  if (mapMarkers.length > 0) {
    const group = L.featureGroup(mapMarkers);
    map.fitBounds(group.getBounds().pad(0.2));
  } else {
    // Reset to Georgia default if no markers
    map.setView([32.1656, -82.9001], 7);
  }
  
  setTimeout(() => {
  map.invalidateSize();
	}, 200);
}

// ===============================
// Error Popup Utility
// ===============================
function showErrorPopup(message) {
  const popup = document.createElement("div");
  popup.className = "error-popup";
  popup.innerHTML = `<p>${message}</p>`;
  document.body.appendChild(popup);

  // Animate fade-in
  setTimeout(() => popup.classList.add("visible"), 10);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    popup.classList.remove("visible");
    setTimeout(() => popup.remove(), 400);
  }, 4000);
}

// === Compare state ===
const COMPARE_KEY = 'gw_compare_ids';
let compareSet;
try { compareSet = new Set(JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]')); }
catch { compareSet = new Set(); }

const openCompareBtn = document.getElementById('openCompare');

function saveCompare(){ localStorage.setItem(COMPARE_KEY, JSON.stringify([...compareSet])); }
function updateCompareBtn(){
  if (!openCompareBtn) return;
  const n = compareSet.size;
  openCompareBtn.textContent = `Compare (${n})`;
  openCompareBtn.disabled = n === 0;
}
updateCompareBtn();

if (openCompareBtn){
  openCompareBtn.addEventListener('click', ()=>{
    const ids = [...compareSet].join(',');
    window.location.href = `comparison.html?ids=${encodeURIComponent(ids)}`;
  });
}

// Delegate clicks for the magnifying-glass toggle
document.getElementById('hospitalResults').addEventListener('click', (e) => {
  const btn = e.target.closest('.js-compare-toggle');
  if (!btn) return;

  const id = String(btn.dataset.id || '');
  if (!id) return;

  const willSelect = btn.getAttribute('aria-pressed') === 'false';

  if (willSelect) {
    if (compareSet.size >= 3) {
      // bounce
      btn.blur();
      return;
    }
    compareSet.add(id);
    btn.setAttribute('aria-pressed', 'true');
    btn.title = 'Selected for comparison';
  } else {
    compareSet.delete(id);
    btn.setAttribute('aria-pressed', 'false');
    btn.title = 'Select for comparison';
  }

  saveCompare();
  updateCompareBtn();
});

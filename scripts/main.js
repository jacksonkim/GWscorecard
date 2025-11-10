// ===============================
// Data Storage
// ===============================
let hospitalData = [];

// ===============================
// Load JSON Data
// ===============================
fetch("./data/2025/2025_Lown_Index_GA.json")
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
    resultsTable.innerHTML = `<tr><td colspan="4">No hospitals match the selected filters.</td></tr>`;
    return;
  }

  data.forEach(hospital => {
    // Convert letter grade to star rating
    const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
    const stars = convertGradeToStars(grade);

    // === Main Row ===
    const row = document.createElement("tr");
    row.classList.add("hospital-row");
	
	const hid = String(hospital.RECORD_ID || "");
	if (hid) row.dataset.id = hid;



    const gradeCell = document.createElement("td");
    gradeCell.innerHTML = `
      <div class="star-rating" aria-label="${stars.value} out of 5 stars">
        ${renderStars(stars.value)}
      </div>
    `;
    row.appendChild(gradeCell);

    const nameCell = document.createElement("td");
    nameCell.innerHTML = `
      <strong>
        <a href="details.html?id=${hospital.RECORD_ID}" class="hospital-link">
          ${hospital.Name || "Unnamed Hospital"}
        </a>
      </strong><br>
      ${hospital.City || ""}, ${hospital.State || ""}
    `;
    row.appendChild(nameCell);

    // === Buttons ===
    const buttonCell = document.createElement("td");
    buttonCell.classList.add("details-buttons");

    const detailsButton = document.createElement("button");
    detailsButton.textContent = "View Details ▼";
    detailsButton.classList.add("toggle-detail");

    const fullDetailsButton = document.createElement("button");
    fullDetailsButton.textContent = "View Full Details";
    fullDetailsButton.classList.add("view-full-detail");
    fullDetailsButton.addEventListener("click", () => {
      if (hospital.RECORD_ID) {
        window.location.href = `details.html?id=${hospital.RECORD_ID}`;
      } else {
        showErrorPopup("Sorry, we couldn't find more details for this hospital.");
      }
    });

    buttonCell.appendChild(detailsButton);
    buttonCell.appendChild(fullDetailsButton);
    row.appendChild(buttonCell);

	const cmpCell = document.createElement("td");
	cmpCell.innerHTML = `
	  <button
		class="cmp-toggle js-compare-toggle"
		type="button"
		aria-pressed="${compareSet.has(hid) ? 'true' : 'false'}"
		data-id="${hid}"
		title="${compareSet.has(hid) ? 'Selected for comparison' : 'Select for comparison'}"
	  >
		<!-- Outline = unselected -->
		<svg class="cmp-icon cmp-icon--off" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
		  <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0-2C6.6 2 3 5.6 3 10s3.6 8 8 8a7.96 7.96 0 0 0 4.9-1.7l4.6 4.6 1.4-1.4-4.6-4.6A7.96 7.96 0 0 0 19 10c0-4.4-3.6-8-8-8z"/>
		</svg>

		<!-- Filled = selected -->
		<svg class="cmp-icon cmp-icon--on" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
		  <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 10.5 17a6.47 6.47 0 0 0 3.23-.87l.27.28v.79L21 22.49 22.49 21 15.5 14zM10.5 15C7.5 15 5 12.5 5 9.5S7.5 4 10.5 4 16 6.5 16 9.5 13.5 15 10.5 15z"/>
		</svg>
	  </button>
	`;
	row.appendChild(cmpCell);

	
    // === Detail Row (collapsed preview) ===
    const detailRow = document.createElement("tr");
    detailRow.classList.add("hospital-detail-row");
    detailRow.style.display = "none";

    const detailCell = document.createElement("td");
    detailCell.colSpan = 4;
    detailCell.innerHTML = `
	  <div class="detail-info">
		<p class="inline-stars"><strong>Outcome:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Outcome || "F").value)}</p>
		<p class="inline-stars"><strong>Value:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Value || "F").value)}</p>
		<p class="inline-stars"><strong>Civic:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Civic || "F").value)}</p>
		<p class="inline-stars"><strong>Safety:</strong> ${renderStars(convertGradeToStars(hospital.TIER_3_GRADE_Pat_Saf || "F").value)}</p>
		<p class="inline-stars"><strong>Experience:</strong> ${renderStars(convertGradeToStars(hospital.TIER_3_GRADE_Pat_Exp || "F").value)}</p>
	  </div>
	`;
    detailRow.appendChild(detailCell);

    // === Toggle Logic (single listener) ===
    detailsButton.addEventListener("click", () => {
      const isHidden = detailRow.style.display === "none" || detailRow.style.display === "";
      detailRow.style.display = isHidden ? "table-row" : "none";
      detailsButton.textContent = isHidden ? "Hide Details ▲" : "View Details ▼";
    });

    // === Append both rows ===
    resultsTable.appendChild(row);
    resultsTable.appendChild(detailRow);
  });
}


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
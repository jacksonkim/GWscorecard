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
function showHospitalDetails(hospital, container) {
  // Determine grade class for color coding
  const gradeClass = `grade-${hospital.TIER_1_GRADE_Lown_Composite}`;

  // Set hospital details
  container.innerHTML = `
    <div class="details-grid">
      <div class="details-section">
        <h4>Hospital Information</h4>
        <p><strong>Grade:</strong> <span class="grade-circle ${gradeClass}">${hospital.TIER_1_GRADE_Lown_Composite || "N/A"}</span></p>
        <p><strong>Size:</strong> ${hospital.Size || "N/A"}</p>
        <p><strong>Type:</strong> ${hospital.TYPE_NonProfit ? 'Nonprofit' : 'For Profit'}</p>
        <p><strong>Location:</strong> ${hospital.TYPE_urban ? 'Urban' : 'Rural'}</p>
        <p><strong>County Income:</strong> ${hospital.county_income_shrt || 'N/A'}</p>
      </div>

      <div class="details-section">
        <h4>Key Metrics</h4>
        <p><strong>Outcome Grade:</strong> ${hospital.TIER_2_GRADE_Outcome || "N/A"}</p>
        <p><strong>Value Grade:</strong> ${hospital.TIER_2_GRADE_Value || "N/A"}</p>
        <p><strong>Civic Grade:</strong> ${hospital.TIER_2_GRADE_Civic || "N/A"}</p>
        <p><strong>Patient Safety Grade:</strong> ${hospital.TIER_3_GRADE_Pat_Saf || "N/A"}</p>
        <p><strong>Patient Experience Grade:</strong> ${hospital.TIER_3_GRADE_Pat_Exp || "N/A"}</p>
      </div>
    </div>
    <div style="text-align: center; margin-top: 15px;">
      const detailsButton = document.createElement("button");
detailsButton.textContent = "View Details";
detailsButton.classList.add("details-button");
detailsButton.addEventListener("click", () => {
  toggleHospitalDetails(hospital.RECORD_ID, detailsButton);
});

const detailsCell = document.createElement("td");
detailsCell.appendChild(detailsButton);
row.appendChild(detailsCell);
    </div>
  `;
}



function renderHospitals(data) {
  const resultsTable = document.getElementById("hospitalResults");
  const resultsCount = document.getElementById("resultsCount");

  // Clear old results
  resultsTable.innerHTML = "";

  // Update results count
  resultsCount.textContent = `Viewing ${data.length} results`;

  if (!data.length) {
    resultsTable.innerHTML = `<tr><td colspan="3">No hospitals match the selected filters.</td></tr>`;
    return;
  }

data.forEach(hospital => {
  // Convert letter grade to star rating
	const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
	const stars = convertGradeToStars(grade);

  // === Main Row ===
  const row = document.createElement("tr");
  row.classList.add("hospital-row");

  const gradeCell = document.createElement("td");
	gradeCell.innerHTML = `
	  <div class="star-rating" aria-label="${stars.value} out of 5 stars (Grade ${grade})">
		${renderStars(stars.value)}
		<span class="sr-only">${stars.value} out of 5 stars (Grade ${grade})</span>
	  </div>
	`;
	row.appendChild(gradeCell);

  const nameCell = document.createElement("td");
  nameCell.innerHTML = `
    <strong>${hospital.Name || "Unnamed Hospital"}</strong><br>
    ${hospital.City || ""}, ${hospital.State || ""}
  `;
  row.appendChild(nameCell);

  const buttonCell = document.createElement("td");
  buttonCell.style.textAlign = "center";
  const detailsButton = document.createElement("button");
  detailsButton.textContent = "View Details ▼";
  detailsButton.classList.add("view-detail");
  buttonCell.appendChild(detailsButton);
  row.appendChild(buttonCell);

  // === Detail Row ===
  const detailRow = document.createElement("tr");
  detailRow.classList.add("hospital-detail-row");
  detailRow.style.display = "none";

  const detailCell = document.createElement("td");
  detailCell.colSpan = 3;
  detailCell.innerHTML = `
    <div class="detail-info">
      <p><strong>Outcome Grade:</strong> ${hospital.TIER_2_GRADE_Outcome || "N/A"}</p>
      <p><strong>Value Grade:</strong> ${hospital.TIER_2_GRADE_Value || "N/A"}</p>
      <p><strong>Civic Grade:</strong> ${hospital.TIER_2_GRADE_Civic || "N/A"}</p>
      <p><strong>Safety Grade:</strong> ${hospital.TIER_3_GRADE_Pat_Saf || "N/A"}</p>
      <p><strong>Experience Grade:</strong> ${hospital.TIER_3_GRADE_Pat_Exp || "N/A"}</p>
    </div>
  `;
  detailRow.appendChild(detailCell);

  // === Toggle Logic ===
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
    const gradeClass = `grade-${grade}`;
    return `
      <div class="details-section">
        <h4>${m.label}</h4>
        <span class="grade-circle ${gradeClass}">${grade}</span>
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
function initHospitalMap(data) {
  const mapDiv = document.getElementById("mainMap");
  if (!mapDiv) return;

  // Initialize map (centered roughly on Georgia)
  const map = L.map("mainMap").setView([32.1656, -82.9001], 7);

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  // Add markers
  data.forEach(hospital => {
    const lat = parseFloat(hospital.Latitude || hospital.LAT || hospital.lat);
    const lon = parseFloat(hospital.Longitude || hospital.LON || hospital.lon);

    if (!lat || !lon) return; // skip if no coordinates

    const popupHTML = `
      <strong>${hospital.HOSPITAL_NAME || hospital.Name}</strong><br>
      ${hospital.CITY || ""}, ${hospital.STATE || ""}<br>
      <a href="details.html?id=${hospital.RECORD_ID}" target="_blank">View Details</a>
    `;

    L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
  });
}

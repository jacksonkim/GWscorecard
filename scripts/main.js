// ===============================
// Accordion Toggle
// ===============================
document.querySelectorAll(".accordion").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
    const panel = btn.nextElementSibling;
    panel.style.display = (panel.style.display === "block") ? "none" : "block";
  });
});

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
  
  const detailsButton = document.createElement("button");
  detailsButton.textContent = "View Details";
  detailsButton.classList.add("details-button");
  detailsButton.addEventListener("click", () => {
  toggleHospitalDetails(hospital.RECORD_ID, detailsButton);
  });

  // Clear old results
  resultsTable.innerHTML = "";

  // Update results count
  resultsCount.textContent = `Viewing ${data.length} results`;

  if (!data.length) {
    resultsTable.innerHTML = `<tr><td colspan="3">No hospitals match the selected filters.</td></tr>`;
    return;
  }

  data.forEach(hospital => {
    const row = document.createElement("tr");

    // Build grade bubble
    const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
    const gradeClass = `grade-${grade}`;
    const gradeHTML = grade !== "N/A"
      ? `<span class="grade-circle ${gradeClass}">${grade}</span>`
      : "N/A";

    row.innerHTML = `
      <td>${gradeHTML}</td>
      <td>
        <strong>${hospital.Name || "Unnamed Hospital"}</strong><br>
        ${hospital.City || ""}, ${hospital.State || ""}
      </td>
      <td style="text-align: center;">
        <button class="details-button" onclick="toggleHospitalDetails('${hospital.RECORD_ID}', this)">View Details</button>
      </td>
    `;

    resultsTable.appendChild(row);
  });
}

function toggleHospitalDetails(hospitalId, button) {
  // Remove existing detail row if it's already open
  const existingRow = document.querySelector(`.details-row[data-id="${hospitalId}"]`);
  if (existingRow) {
    existingRow.remove();
    return;
  }

  // Find the hospital data from the global hospitalsData array
  const hospital = hospitalsData.find(h => h.RECORD_ID === hospitalId);
  if (!hospital) return;

  // Create the detail row element
  const detailsRow = document.createElement("tr");
  detailsRow.classList.add("details-row");
  detailsRow.setAttribute("data-id", hospitalId);

  // Fill in detail preview content
  detailsRow.innerHTML = `
    <td colspan="3">
      <div class="hospital-details-dropdown show">
        <div class="details-grid">
          ${renderGrades(hospital)}
        </div>
      </div>
    </td>
  `;

  // Insert it after the clicked row
  const currentRow = button.closest("tr");
  currentRow.parentNode.insertBefore(detailsRow, currentRow.nextSibling);
}


function renderGrades(hospital) {
  const metrics = [
    "TIER_1_GRADE_Lown_Composite",
    "TIER_2_GRADE_Lown_PatientOutcomes",
    "TIER_3_GRADE_Lown_CareResponsiveness",
    "TIER_4_GRADE_Lown_Transparency"
  ];

  return metrics.map(metric => {
    const grade = hospital[metric] || "N/A";
    const label = metric.replace("TIER_", "Tier ").replace(/_/g, " ");
    const gradeClass = `grade-${grade}`;

    return `
      <div class="details-section">
        <h4>${label}</h4>
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


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
  const gradeClass = `grade-${hospital.TIER_1_GRADE_Lown_Composite}`;

  container.innerHTML = `
    <h3>${hospital.Name || "Unnamed Hospital"}</h3>
    <p><strong>Grade:</strong> <span class="grade-circle ${gradeClass}">
      ${hospital.TIER_1_GRADE_Lown_Composite}
    </span></p>
    <p><strong>Type:</strong> ${hospital.TYPE_NonProfit ? "Nonprofit" : "For Profit"}</p>
    <p><strong>Location:</strong> ${hospital.TYPE_urban ? "Urban" : "Rural"}</p>
    <p><strong>County Income:</strong> ${hospital.county_income_shrt || "N/A"}</p>
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
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${hospital.TIER_1_GRADE_Lown_Composite || "N/A"}</td>
      <td>
        <strong>${hospital.Name || "Unnamed Hospital"}</strong><br>
        ${hospital.City || ""}, ${hospital.State || ""}
      </td>
      <td><a href="?id=${hospital.RECORD_ID}" class="details-button">View Details</a></td>
    `;

    resultsTable.appendChild(row);
  });
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


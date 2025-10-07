// ===============================
// Hospital Details Page Logic
// ===============================

// Wait for page to load
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const hospitalId = params.get("id");
  const container = document.getElementById("detailRoot");

  if (!hospitalId) {
    container.innerHTML = "<p>Hospital ID missing from URL.</p>";
    return;
  }

  try {
    // Load JSON data
    const res = await fetch("./data/2025/2025_Lown_Index_GA.json");
    const data = await res.json();
    const hospital = data.find(h => String(h.RECORD_ID) === String(hospitalId));

    if (!hospital) {
      container.innerHTML = "<p>Hospital not found.</p>";
      return;
    }

    populateHospitalDetails(hospital);
  } catch (err) {
    container.innerHTML = `<p>Error loading data: ${err.message}</p>`;
  }
});


// ===============================
// Fill top-level hospital info
// ===============================
function populateHospitalDetails(h) {
  // Name & address
  document.getElementById("hospitalName").textContent =
    h.HOSPITAL_NAME || h.Name || "Unnamed Hospital";
  document.getElementById("hospitalAddress").textContent = [
    h.ADDRESS || h.Address,
    h.CITY || h.City,
    h.STATE || h.State,
    h.ZIP_CODE || h.Zip
  ]
    .filter(Boolean)
    .join(", ");

  // Overall stars
  const overallGrade = h.TIER_1_GRADE_Lown_Composite || "N/A";
  const stars = convertGradeToStars(overallGrade);
  document.getElementById("overallStars").innerHTML = renderStars(stars.value);
  document.getElementById("overallGradeText").textContent = `Overall Grade: ${overallGrade}`;

  // Services
  populateServices(h);

  // Metric accordions
  populateMetrics(h);

  // Map
  initMap(h);
}


// ===============================
// Services Section
// ===============================
function populateServices(h) {
  const list = document.getElementById("hospitalServices");
  list.innerHTML = "";

  let services = [];
  if (Array.isArray(h.Services)) services = h.Services;
  else if (typeof h.Services === "string") services = h.Services.split(",").map(s => s.trim());
  else if (typeof h.SERVICES === "string") services = h.SERVICES.split(",").map(s => s.trim());

  if (!services.length) {
    list.innerHTML = `<li class="muted">No services listed.</li>`;
    return;
  }

  list.innerHTML = services.map(s => `<li>${s}</li>`).join("");
}


// ===============================
// Metrics Accordions
// ===============================
function populateMetrics(h) {
  // Helper to insert metrics
  function fill(sectionId, metrics) {
    const section = document.querySelector(`#${sectionId} .metric-body`);
    if (!section) return;
    section.innerHTML = metrics
      .map(([key, label]) => {
        const grade = h[key] || "N/A";
        const stars = renderStars(convertGradeToStars(grade).value);
        return `
          <div class="metric-row">
            <p><strong>${label}:</strong></p>
            <div class="star-rating" aria-label="${grade} grade">${stars}</div>
          </div>
        `;
      })
      .join("");
  }

  fill("financialTransparency", [
    ["TIER_2_GRADE_Value", "Value Grade"],
    ["TIER_2_GRADE_Outcome", "Outcome Grade"],
    ["TIER_2_GRADE_Civic", "Civic Grade"]
  ]);

  fill("communityBenefit", [
    ["TIER_3_GRADE_CB", "Community Benefit"],
    ["TIER_3_GRADE_Exec_Comp", "Executive Compensation"]
  ]);

  fill("affordabilityBilling", [
    ["TIER_3_GRADE_Cost_Eff", "Cost Efficiency"],
    ["TIER_3_GRADE_Pat_Saf", "Patient Safety"]
  ]);

  fill("accessResponsibility", [
    ["TIER_3_GRADE_Inclusivity", "Inclusivity"],
    ["TIER_3_GRADE_Pat_Exp", "Patient Experience"]
  ]);
}


// ===============================
// Leaflet Map Placeholder
// ===============================
function initMap(h) {
  const mapDiv = document.getElementById("leafletMap");
  if (!mapDiv) return;

  // Default GA center (if no coords)
  const lat = parseFloat(h.Latitude || h.LAT || 32.1656);
  const lng = parseFloat(h.Longitude || h.LON || -82.9001);

  const map = L.map(mapDiv).setView([lat, lng], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  L.marker([lat, lng]).addTo(map).bindPopup(h.HOSPITAL_NAME || "Hospital");
}

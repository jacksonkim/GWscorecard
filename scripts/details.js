// =======================================
//  Georgia Watch Details Page Script
//  Updated for Lown 2025 dataset structure
//  Author: Chatty for Kim 💪
// =======================================

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const hospitalId = params.get("id");
  if (!hospitalId) return;

  try {
    const res = await fetch("./data/2025/2025_Lown_Index_GA.json");
    const data = await res.json();
    const h = data.find(x => String(x.RECORD_ID) === String(hospitalId));
    if (!h) return;

    // ===== Helper functions =====
    const safe = val =>
      val && val !== "NULL" && val !== "—" ? val : "—";

    const isTrue = val =>
      val === 1 || val === "1" || val === "Y" || val === "Yes" || val === "TRUE";

    const getVal = (...keys) =>
      keys.map(k => h[k]).find(v => v && v !== "NULL" && v !== "—") || "—";

    // ===== Hospital Name =====
    const name = h.HOSPITAL_NAME || h.Name || "Unnamed Hospital";
    const nameTop = document.getElementById("hospitalNameTop");
    const nameCenter = document.getElementById("hospitalName");
    if (nameTop) nameTop.textContent = name;
    if (nameCenter) nameCenter.textContent = name;

    // ===== Address =====
    document.getElementById("streetLine").textContent = safe(h.ADDRESS);
    document.getElementById("cityStateZip").textContent =
      [h.CITY, h.STATE, h.ZIP_CODE].filter(Boolean).join(", ");

    // ===== Hospital Info =====
    const info = {
      hospitalCounty: getVal("COUNTY_NAME", "COUNTY"),
      hospitalSize: getVal("BED_SIZE", "SIZE", "Hospital_Size"),
      hospitalCareLevel: getVal("HOSPITAL_TYPE", "CARE_LEVEL", "Type_of_Care"),
      hospitalUrbanRural: isTrue(h.Urban)
        ? "Urban"
        : isTrue(h.Rural)
        ? "Rural"
        : h.URBAN_RURAL_DESIGNATION || "—",
      hospitalSystem: getVal("HEALTH_SYSTEM", "SYSTEM_NAME", "System_Affiliation") || "Independent",
      hospitalType: getVal("OWNERSHIP", "Type"),
      hospitalBeds: getVal("BED_SIZE", "BEDS", "Bed_Range")
    };

    for (const [id, val] of Object.entries(info)) {
      const el = document.getElementById(id);
      if (el) el.textContent = safe(val);
    }

    // ===== Binary attribute flags (display only if TRUE) =====
    const attributes = [];
    if (isTrue(h.Teaching)) attributes.push("Teaching Hospital");
    if (isTrue(h.CriticalAccess)) attributes.push("Critical Access Hospital");
    if (isTrue(h.SafetyNet)) attributes.push("Safety Net Hospital");
    if (isTrue(h.Academic)) attributes.push("Academic Medical Center");
    if (attributes.length > 0) {
      const wrap = document.getElementById("hospitalAddress");
      const list = document.createElement("p");
      list.textContent = attributes.join(" • ");
      wrap.appendChild(list);
    }

    // ===== Services =====
    const list = document.getElementById("hospitalServices");
    list.innerHTML = "";
    let services = [];

    if (typeof h.SERVICES === "string") {
      services = h.SERVICES.split(",").map(s => s.trim());
    } else if (Array.isArray(h.Services)) {
      services = h.Services.map(s => s.trim());
    }

    if (!services.length) {
      services = [
        "Behavioral Health",
        "Cardiology",
        "Emergency Care",
        "Imaging & Radiology",
        "Maternity & Neonatal ICU",
        "Oncology",
        "Orthopedics",
        "Outpatient Surgery",
        "Pediatric Services",
        "Pharmacy",
        "Physical Therapy",
        "Rehabilitation"
      ];
    }
    list.innerHTML = services.map(s => `<li>${s}</li>`).join("");

    // ===== Overall Grade =====
    const overallGrade = h.TIER_1_GRADE_Lown_Composite || "N/A";
    const starWrap = document.getElementById("overallStars");
    if (starWrap) starWrap.innerHTML = renderStars(convertGradeToStars(overallGrade).value);
    // Hide redundant grade text
    const gradeText = document.getElementById("overallGradeText");
    if (gradeText) gradeText.textContent = "";

    // ===== Category-level stars =====
    const starMap = {
      financialTransparencyStars: h.TIER_2_GRADE_Value || "F",
      communityBenefitStars: h.TIER_3_GRADE_CB || "F",
      affordabilityBillingStars: h.TIER_3_GRADE_Cost_Eff || "F",
      accessResponsibilityStars: h.TIER_3_GRADE_Inclusivity || "F"
    };
    for (const [id, grade] of Object.entries(starMap)) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = renderStars(convertGradeToStars(grade).value);
    }

    // ===== Map =====
    const mapDiv = document.getElementById("leafletMap");
    if (mapDiv) {
      let lat = parseFloat(h.Latitude || h.LAT);
      let lon = parseFloat(h.Longitude || h.LON);

      if (!lat || !lon) {
        const coords = getZipCoords(h.ZIP_CODE || h.Zip);
        lat = coords[0];
        lon = coords[1];
      }

      const map = L.map(mapDiv).setView([lat, lon], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);

      L.marker([lat, lon]).addTo(map).bindPopup(name);

      document.getElementById("gmapsLink").href =
        `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }
  } catch (err) {
    console.error("Error loading hospital details:", err);
  }
});

// ====== STAR UTILITY FUNCTIONS ======
function convertGradeToStars(grade) {
  // Convert letter grades A–F to star counts
  const map = { A: 5, B: 4, C: 3, D: 2, F: 1 };
  const upper = String(grade).trim().toUpperCase();
  return { value: map[upper] || 0 };
}

function renderStars(count) {
  const fullStar = "★";
  const emptyStar = "☆";
  return `<span class="stars">${fullStar.repeat(count)}${emptyStar.repeat(
    5 - count
  )}</span>`;
}

// ====== ZIPCODE FALLBACK FUNCTION ======
function getZipCoords(zip) {
  // fallback approximate coords (center of Georgia)
  return [32.5, -83.5];
}
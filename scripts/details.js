// =======================================
//  Georgia Watch Details Page Script
//  Finalized for Lown 2025 JSON structure
// =======================================

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const hospitalId = params.get("id");
  if (!hospitalId) {
    console.warn("No ?id= parameter found in URL.");
    return;
  }

  try {
    const res = await fetch("./data/2025/2025_Lown_Index_GA.json");
    const data = await res.json();

    // Match using flexible field names
    const h = data.find(x =>
      String(
        x["Record ID"] ||
        x["RECORD ID"] ||
        x["RECORD_ID"] ||
        x["id"]
      ) === String(hospitalId)
    );

    if (!h) {
      console.error("Hospital not found for ID:", hospitalId);
      return;
    }

    // ===== Helper functions =====
    const safe = val => (val && val !== "NULL" ? val : "—");
    const isTrue = val => val === 1 || val === "1" || val === "Y" || val === "Yes" || val === "TRUE";

    // ===== Hospital Name =====
    const name = h["Hospital Name"] || "Unnamed Hospital";
    document.getElementById("hospitalNameTop").textContent = name;
    const centerName = document.getElementById("hospitalName");
    if (centerName) centerName.textContent = name;

    // ===== Address =====
    const addr = safe(h["Address"]);
    const city = safe(h["City"]);
    const state = safe(h["State"]);
    const zip = safe(h["ZIP Code"]);
    document.getElementById("streetLine").textContent = addr;
    document.getElementById("cityStateZip").textContent = [city, state, zip].filter(Boolean).join(", ");

    // ===== Hospital Info =====
    const info = {
      hospitalCounty: safe(h["County"]),
      hospitalSize: safe(h["Bed Size"]),
      hospitalCareLevel: safe(h["Hospital Type"]),
      hospitalUrbanRural: safe(h["Urban/Rural"]),
      hospitalSystem: safe(h["Health System"] || "Independent"),
      hospitalType: safe(h["Ownership"]),
      hospitalBeds: safe(h["Bed Size"])
    };

    for (const [id, val] of Object.entries(info)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }

    // ===== Overall Grade =====
    const overallGrade = safe(h["TIER 1 GRADE Lown Composite"]);
    const starWrap = document.getElementById("overallStars");
    if (starWrap)
      starWrap.innerHTML = renderStars(
        convertGradeToStars(overallGrade).value,
        overallGrade
      );

    // Hide redundant grade text
    const gradeText = document.getElementById("overallGradeText");
    if (gradeText) gradeText.textContent = "";

    // ===== Category-level stars =====
    const starMap = {
      financialTransparencyStars: h["TIER 2 GRADE Value"],
      communityBenefitStars: h["TIER 3 GRADE CB"],
      affordabilityBillingStars: h["TIER 3 GRADE Cost Eff"],
      accessResponsibilityStars: h["TIER 3 GRADE Inclusivity"]
    };

    for (const [id, grade] of Object.entries(starMap)) {
      const el = document.getElementById(id);
      if (el)
        el.innerHTML = renderStars(
          convertGradeToStars(grade).value,
          grade
        );
    }

    // ===== Map =====
    const mapDiv = document.getElementById("leafletMap");
    if (mapDiv) {
      let lat = parseFloat(h["Latitude"]);
      let lon = parseFloat(h["Longitude"]);

      if (!lat || !lon) {
        const coords = getZipCoords(zip);
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

// ====== STAR UTILITIES ======
function convertGradeToStars(grade) {
  const map = { A: 5, B: 4, C: 3, D: 2, F: 1 };
  const upper = String(grade).trim().toUpperCase();
  return { value: map[upper] || 0 };
}

function renderStars(count, grade = "") {
  const maxStars = 5;
  const color =
    ["A", "B"].includes(grade) ? "#6fb353" :
    grade === "C" ? "#a4cc95" :
    ["D", "F"].includes(grade) ? "#f48810" :
    "#ccc";

  let html = `<div class="star-rating" aria-label="Rating: ${count} out of ${maxStars} stars">`;
  for (let i = 1; i <= maxStars; i++) {
    html += `
      <svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20" height="20"
        fill="${i <= count ? color : '#ddd'}"
        style="margin-right: 2px">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>`;
  }
  html += `</div>`;
  return html;
}

// ====== ZIPCODE FALLBACK FUNCTION ======
function getZipCoords(zip) {
  return [32.5, -83.5];
}

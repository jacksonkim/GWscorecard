// =======================================
//  Georgia Watch Details Page Script
//  Synced to Lown 2025 JSON (underscored keys)
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

    // Match by RECORD_ID (integer in this dataset)
    const h = data.find(x => String(x.RECORD_ID) === String(hospitalId));
    if (!h) {
      console.error("Hospital not found for ID:", hospitalId);
      return;
    }

    // ===== Helpers =====
    const safe = v => (v !== null && v !== undefined && v !== "NULL" && v !== "" ? v : "—");
    const isTrue = v => v === 1 || v === "1" || v === "Y" || v === "Yes" || v === true;

    // ===== Hospital Name =====
    const name = h.Name || "Unnamed Hospital";
    const nameTop = document.getElementById("hospitalNameTop");
    const nameCenter = document.getElementById("hospitalName");
    if (nameTop) nameTop.textContent = name;
    if (nameCenter) nameCenter.textContent = name;

    // ===== Address (includes ZIP) =====
    const addr = safe(h.Address);
    const city = safe(h.City);
    const state = safe(h.State);
    const zip = safe(h.Zip);
    const streetLineEl = document.getElementById("streetLine");
    const cityStateZipEl = document.getElementById("cityStateZip");
    if (streetLineEl) streetLineEl.textContent = addr;
    if (cityStateZipEl) cityStateZipEl.textContent = [city, state, zip].filter(Boolean).join(", ");

    // ===== Hospital Info (matching available fields) =====
    // County: not present in this JSON -> "—"
    // Size: map 's','m','l' to Small/Medium/Large when present
    const sizeMap = { s: "Small", m: "Medium", l: "Large" };
    const prettySize = h.Size && sizeMap[String(h.Size).toLowerCase()] ? sizeMap[String(h.Size).toLowerCase()] : (h.Size || "—");

    // Ownership Type from flags
    let ownership = "—";
    if (isTrue(h.TYPE_NonProfit)) ownership = "Nonprofit";
    else if (isTrue(h.TYPE_ForProfit)) ownership = "For-Profit";

    // Care Level from flags
    let careLevel = "—";
    if (isTrue(h.TYPE_HospTyp_CAH)) careLevel = "Critical Access";
    else if (isTrue(h.TYPE_HospTyp_ACH)) careLevel = "Acute Care";

    // Urban/Rural setting from flags
    let setting = "—";
    if (isTrue(h.TYPE_urban)) setting = "Urban";
    else if (isTrue(h.TYPE_rural)) setting = "Rural";

    // System Affiliation from HOSPITAL_SYSTEM
    let systemAff = "Independent";
    if (String(h.HOSPITAL_SYSTEM).toUpperCase() === "Y") {
      systemAff = h.SYSTEM_ID ? `Affiliated (System ID: ${h.SYSTEM_ID})` : "Affiliated";
    }

    const info = {
      hospitalCounty: "—",            // not in this file
      hospitalSize: prettySize,       // from Size (s/m/l)
      hospitalType: ownership,        // Nonprofit / For-Profit
      hospitalCareLevel: careLevel,   // Acute Care / Critical Access
      hospitalSystem: systemAff,      // Independent or Affiliated
      hospitalUrbanRural: setting,    // Urban / Rural
      hospitalBeds: "—"               // not in this file
    };

    for (const [id, val] of Object.entries(info)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }

    // ===== Attribute badges (only show true ones) =====
    const attrs = [];
    if (isTrue(h.TYPE_AMC)) attrs.push("Academic Medical Center");
    if (isTrue(h.TYPE_isSafetyNet)) attrs.push("Safety Net Hospital");
    if (isTrue(h.TYPE_chrch_affl_f)) attrs.push("Church-Affiliated");
    if (attrs.length) {
      const wrap = document.getElementById("hospitalAddress");
      if (wrap) {
        const p = document.createElement("p");
        p.className = "attr-badges";
        p.textContent = attrs.join(" • ");
        wrap.appendChild(p);
      }
    }

    // ===== Overall Grade (underscored key names) =====
    const overallGrade = h.TIER_1_GRADE_Lown_Composite || "N/A";
    const starWrap = document.getElementById("overallStars");
    if (starWrap)
      starWrap.innerHTML = renderStars(convertGradeToStars(overallGrade).value, overallGrade);
    const gradeText = document.getElementById("overallGradeText");
    if (gradeText) gradeText.textContent = "";

    // ===== Category stars (underscored keys) =====
    const starMap = {
      financialTransparencyStars: h.TIER_2_GRADE_Value || "F",
      communityBenefitStars: h.TIER_3_GRADE_CB || "F",
      affordabilityBillingStars: h.TIER_3_GRADE_Cost_Eff || "F",
      accessResponsibilityStars: h.TIER_3_GRADE_Inclusivity || "F"
    };
    for (const [id, grade] of Object.entries(starMap)) {
      const el = document.getElementById(id);
      if (el)
        el.innerHTML = renderStars(convertGradeToStars(grade).value, grade);
    }

    // ===== Map (fallback to ZIP centroid) =====
    const mapDiv = document.getElementById("leafletMap");
    if (mapDiv) {
      let lat = parseFloat(h.Latitude || h.LAT);
      let lon = parseFloat(h.Longitude || h.LON);

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

      const gmapsLink = document.getElementById("gmapsLink");
      if (gmapsLink) {
        gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      }
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
  // Placeholder: center of Georgia until we wire a ZIP-to-lat/lon table
  return [32.5, -83.5];
}

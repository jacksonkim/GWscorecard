// =======================================
//  Georgia Watch Details Page Script
//  Updated for Lown 2025 dataset structure
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

    // Match flexible key names (handles spaces and case)
    const h = data.find(x => String(x.RECORD_ID) === String(hospitalId));

    if (!h) {
      console.error("Hospital not found for ID:", hospitalId);
      return;
    }

    // ===== Helper functions =====
    const safe = val =>
      val && val !== "NULL" && val !== "—" ? val : "—";

    const isTrue = val =>
      val === 1 || val === "1" || val === "Y" || val === "Yes" || val === "TRUE";

    // ===== Hospital Name =====
	const hospitalName = h.Name || "Unnamed Hospital";
	const nameEl = document.getElementById("hospitalName");
	if (nameEl) nameEl.textContent = hospitalName;


    // ===== Address =====
    const streetEl = document.getElementById("streetLine");
    if (streetEl) streetEl.textContent = h.Address || "—";

    const cityStateZipEl = document.getElementById("cityStateZip");
    if (cityStateZipEl)
      cityStateZipEl.textContent = [h.City, h.State, h.Zip].filter(Boolean).join(", ");

	// ===== Hospital Info =====
	const infoMap = {
	  // ===== County =====
	  hospitalCounty: h.County || "—",

	  // ===== Bed Size / Hospital Size =====
	  hospitalSize: (() => {
		const sizeMap = {
		  xs: "Extra Small",
		  s: "Small",
		  m: "Medium",
		  l: "Large",
		  xl: "Extra Large"
		};
		const sizeKey = String(h.Size || "").toLowerCase().trim();
		return sizeMap[sizeKey] || "—";
	  })(),

	  // ===== Hospital Type =====
	  hospitalType: (() => {
		const types = [];

		if (isTrue(h.TYPE_HospTyp_ACH)) types.push("Acute Care Hospital");
		if (isTrue(h.TYPE_HospTyp_CAH)) types.push("Critical Access Hospital");
		if (isTrue(h.TYPE_AMC)) types.push("Academic Medical Center");

		if (isTrue(h.TYPE_ForProfit)) types.push("For-Profit");
		if (isTrue(h.TYPE_NonProfit)) types.push("Nonprofit");
		if (isTrue(h.TYPE_chrch_affl_f)) types.push("Faith-Affiliated");

		if (isTrue(h.TYPE_isSafetyNet)) types.push("Safety Net Hospital");

		return types.length ? types.join(", ") : "—";
	  })(),

	  // ===== Care Level =====
	  hospitalCareLevel: (() => {
		if (isTrue(h.TYPE_HospTyp_CAH)) return "Critical Access";
		if (isTrue(h.TYPE_HospTyp_ACH)) return "Acute Care";
		if (isTrue(h.TYPE_AMC)) return "Academic / Teaching";
		return "—";
	  })(),

	  // ===== System Affiliation =====
	  hospitalSystem: isTrue(h.HOSPITAL_SYSTEM)
		? "Part of a Health System"
		: "Independent",

	  // ===== Setting (Urban vs Rural) =====
	  hospitalUrbanRural: (() => {
		if (isTrue(h.TYPE_urban)) return "Urban";
		if (isTrue(h.TYPE_rural)) return "Rural";
		return "—";
	  })(),

	  // ===== Bed Count =====
	  hospitalBeds: "—" // dataset doesn’t contain numeric beds; size used instead
	};

	// Apply infoMap values to page
	for (const [id, val] of Object.entries(infoMap)) {
	  const el = document.getElementById(id);
	  if (el) el.textContent = val;
	}

    // ===== Services =====
	const list = document.getElementById("hospitalServices");
	list.innerHTML = "";

	// Default fallback list if dataset has no service info
	let services = [
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

	// Check for multiple possible keys
	const rawServices =
	  h["SERVICES"] ||
	  h["Services"] ||
	  h["Services Offered"] ||
	  h["Service List"];

	if (typeof rawServices === "string" && rawServices.trim() && rawServices.toUpperCase() !== "NULL") {
	  const parsed = rawServices.split(",").map(s => s.trim()).filter(Boolean);
	  if (parsed.length) services = parsed;
	} else if (Array.isArray(rawServices) && rawServices.length) {
	  services = rawServices.map(s => s.trim()).filter(Boolean);
	}

	list.innerHTML = services.map(s => `<li>${s}</li>`).join("");

    // ===== Overall Grade =====
    const overallGrade = h["TIER_1_GRADE_Lown_Composite"] || "N/A";
    const starWrap = document.getElementById("overallStars");
    if (starWrap)
      starWrap.innerHTML = renderStars(
        convertGradeToStars(overallGrade).value,
        overallGrade
      );

    // Hide redundant text
    const gradeText = document.getElementById("overallGradeText");
    if (gradeText) gradeText.textContent = "";

    // ===== Category-level stars =====
	const categoryMap = {
	  financialTransparencyStars: [
		"TIER 2 GRADE Value",
		"TIER_2_GRADE_Value",
		"TIER 1 GRADE Lown Composite"
	  ],
	  communityBenefitStars: [
		"TIER 3 GRADE CB",
		"TIER_3_GRADE_CB"
	  ],
	  affordabilityBillingStars: [
		"TIER 3 GRADE Cost Eff",
		"TIER_3_GRADE_Cost_Eff"
	  ],
	  accessResponsibilityStars: [
		"TIER 3 GRADE Inclusivity",
		"TIER_3_GRADE_Inclusivity"
	  ]
	};

	for (const [id, fields] of Object.entries(categoryMap)) {
	  let grade = "N/A";
	  for (const key of fields) {
		if (h[key] && h[key] !== "NULL" && h[key] !== "—") {
		  grade = h[key];
		  break;
		}
	  }
	  const el = document.getElementById(id);
	  if (el) el.innerHTML = renderStars(convertGradeToStars(grade).value, grade);
	}


    // ===== Map =====
    const mapDiv = document.getElementById("leafletMap");
    if (mapDiv) {
      let lat = parseFloat(h["Latitude"]);
      let lon = parseFloat(h["Longitude"]);

      if (!lat || !lon) {
        const coords = getZipCoords(h.Zip);
        lat = coords[0];
        lon = coords[1];
      }

      const map = L.map(mapDiv).setView([lat, lon], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);

      L.marker([lat, lon]).addTo(map).bindPopup(hospitalName);

      document.getElementById("gmapsLink").href =
        `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }
  } catch (err) {
    console.error("Error loading hospital details:", err);
  }
});

// ====== STAR UTILITIES ======
	function convertGradeToStars(grade) {
	  const gradeMap = {
		"A+": 5, "A": 5, "A-": 4.5,
		"B+": 4.5, "B": 4, "B-": 3.5,
		"C+": 3.5, "C": 3, "C-": 2.5,
		"D+": 2.5, "D": 2, "D-": 1.5,
		"F": 1
	  };
	  const g = String(grade).trim().toUpperCase();
	  return { value: gradeMap[g] || 0 };
	}

	function renderStars(value, grade = "") {
	  let html = `<div class="star-rating" aria-label="${grade} (${value} of 5 stars)">`;
	  for (let i = 1; i <= 5; i++) {
		if (value >= i) html += fullStarSVG();
		else if (value >= i - 0.5) html += halfStarSVG();
		else html += emptyStarSVG();
	  }
	  html += `</div>`;
	  return html;
	}

	function fullStarSVG() {
	  return `<svg class="star full" viewBox="0 0 24 24" width="20" height="20">
		<path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
	  </svg>`;
	}

	function halfStarSVG() {
	  return `<svg class="star half" viewBox="0 0 24 24" width="20" height="20">
		<defs><linearGradient id="halfGradient" x1="0" x2="1">
		  <stop offset="50%" stop-color="#f48810"/><stop offset="50%" stop-color="#a4cc95"/>
		</linearGradient></defs>
		<path fill="url(#halfGradient)" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
	  </svg>`;
	}

	function emptyStarSVG() {
	  return `<svg class="star empty" viewBox="0 0 24 24" width="20" height="20">
		<path fill="#ddd" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
	  </svg>`;
	}

// ====== ZIPCODE FALLBACK FUNCTION ======
function getZipCoords(zip) {
  // Basic GA ZIP-to-lat/lon lookup (approximate centers)
  const lookup = {
    "30303": [33.7525, -84.3915], // Atlanta
    "30720": [34.7698, -84.9719], // Dalton
    "31201": [32.8306, -83.6513], // Macon
    "31901": [32.464, -84.9877],  // Columbus
    "31401": [32.0809, -81.0912], // Savannah
    "31520": [31.1499, -81.4915], // Brunswick
    "31701": [31.5795, -84.1557], // Albany
    "39817": [30.9043, -84.5762], // Bainbridge
    "30601": [33.959, -83.3767],  // Athens
    "30161": [34.2546, -85.1647], // Rome
    "30501": [34.2963, -83.8255], // Gainesville
    "39840": [31.3141, -84.6191], // Dawson
    "30040": [34.2282, -84.1596], // Cumming
    "30809": [33.5515, -82.0903], // Evans/Augusta area
    "31794": [31.4505, -83.5085], // Tifton
    "30263": [33.3768, -84.8038], // Newnan
    "31021": [32.5404, -82.9056], // Dublin
    "30114": [34.196, -84.5049],  // Canton
    "30240": [33.036, -85.0318],  // LaGrange
    "31525": [31.2609, -81.5163], // Glynn County
  };

  const coords = lookup[String(zip)] || [32.5, -83.5];
  return coords;
}


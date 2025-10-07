document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const hospitalId = params.get("id");
  if (!hospitalId) return;

  try {
    const res = await fetch("./data/2025/2025_Lown_Index_GA.json");
    const data = await res.json();
    const h = data.find(x => String(x.RECORD_ID) === String(hospitalId));
    if (!h) return;

    // === Hospital info ===
    document.getElementById("hospitalName").textContent =
      h.HOSPITAL_NAME || h.Name || "Unnamed Hospital";

    // Update the topbar title too
    const nameTop = document.getElementById("hospitalNameTop");
    if (nameTop) nameTop.textContent = h.HOSPITAL_NAME || h.Name || "Unnamed Hospital";

    // Address split into envelope-style lines
    document.getElementById("streetLine").textContent = h.ADDRESS || h.Address || "";
    document.getElementById("cityStateZip").textContent = 
      [h.CITY || h.City, h.STATE || h.State, h.ZIP_CODE || h.Zip]
        .filter(Boolean)
        .join(", ");

		// NEW FIELDS (add these right here)
		document.getElementById("hospitalCounty").textContent =
		  h.COUNTY || h.County || "—";

		document.getElementById("hospitalSize").textContent =
		  h.SIZE || h.Hospital_Size || "—";

		document.getElementById("hospitalCareLevel").textContent =
		  h.CRITICAL_ACCESS === "Y"
			? "Critical Access"
			: h.CARE_LEVEL || h.Type_of_Care || "Acute Care";

		document.getElementById("hospitalUrbanRural").textContent =
		  h.URBAN_RURAL || h.Urban_Rural || "—";

		document.getElementById("hospitalSystem").textContent =
		  h.SYSTEM_NAME && h.SYSTEM_NAME !== "Independent"
			? h.SYSTEM_NAME
			: "Independent";

		document.getElementById("hospitalType").textContent =
		  h.HOSPITAL_TYPE || h.Type || "—";

		document.getElementById("hospitalBeds").textContent =
		  h.BEDS || h.Bed_Range || "—";

    // === Services ===
    const list = document.getElementById("hospitalServices");
    list.innerHTML = "";

    // Try to read from JSON first
    let services = [];
    if (typeof h.SERVICES === "string") {
      services = h.SERVICES.split(",").map(s => s.trim());
    } else if (Array.isArray(h.Services)) {
      services = h.Services.map(s => s.trim());
    }

    // If no data, use a consistent fallback list (alphabetical)
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

    // === Overall grade ===
    const overallGrade = h.TIER_1_GRADE_Lown_Composite || "N/A";
    document.getElementById("overallStars").innerHTML =
      renderStars(convertGradeToStars(overallGrade).value);
    document.getElementById("overallGradeText").textContent =
      `Overall Grade: ${overallGrade}`;

    // === Category-level stars ===
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

    // === Map ===
    const mapDiv = document.getElementById("leafletMap");
    if (mapDiv) {
      let lat = parseFloat(h.Latitude || h.LAT);
      let lon = parseFloat(h.Longitude || h.LON);

      // Fallback to ZIP-derived coordinates if lat/lon missing
      if (!lat || !lon) {
        const coords = getZipCoords(h.ZIP_CODE || h.Zip);
        lat = coords[0];
        lon = coords[1];
      }

      const map = L.map(mapDiv).setView([lat, lon], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);

      L.marker([lat, lon]).addTo(map).bindPopup(h.HOSPITAL_NAME || "Hospital");

      // Google Maps link
      document.getElementById("gmapsLink").href =
        `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }

  } catch (err) {
    console.error("Error loading hospital details:", err);
  }
});

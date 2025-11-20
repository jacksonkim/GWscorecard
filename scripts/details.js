// =======================================
// Georgia Watch Details Page Script
// Updated for 2025 GW numeric dataset
// =======================================
document.addEventListener("DOMContentLoaded", async () => {
	
	if (typeof initMobileNavigation === "function") {
        initMobileNavigation();
    }
	

    const params = new URLSearchParams(window.location.search);
    const hospitalId = params.get("id");
    
    if (!hospitalId) {
        console.warn("No ?id= parameter found in URL.");
        return;
    }
    
    try {
        const res = await fetch("./data/2025/2025_GW_HospitalScores.json");
        const data = await res.json();
        
        const h = data.find(x => String(x.Hospital_ID) === String(hospitalId));
        
        if (!h) {
            console.error("Hospital not found for ID:", hospitalId);
            return;
        }
        
        // ===== Helper functions =====
        const safe = val => 
            val && val !== "NULL" && val !== "---" ? val : "---";
        
        const isTrue = val =>
            val === 1 || val === "1" || val === "Y" || val === "Yes" || val === "TRUE";
        
        // ===== Hospital Name =====
        const hospitalName = h.Hospital_Name || "Unnamed Hospital";
        const nameEl = document.getElementById("hospitalName");
        if (nameEl) nameEl.textContent = hospitalName;
        
        // ===== Address =====
        const streetEl = document.getElementById("streetLine");
        if (streetEl) streetEl.textContent = safe(h.Street_Address);
        
        const cityStateZipEl = document.getElementById("cityStateZip");
        if (cityStateZipEl) {
            const parts = [h.City, h.State, h.ZIP_Code].filter(Boolean);
            cityStateZipEl.textContent = parts.join(", ");
        }
        
        // ===== Hospital Info =====
        const sizeLabelFromGroup = (group) => {
            const map = {
                "XS": "Extra Small",
                "S":  "Small",
                "M":  "Medium",
                "L":  "Large",
                "XL": "Extra Large",
                "XXL":"Very Large"
            };
            const key = String(group || "").toUpperCase().trim();
            return map[key] || "---";
        };

        const hospitalTypeLabel = () => {
            const ownership = safe(h.Ownership_Type);
            const care = safe(h.Care_Level);
            if (ownership !== "---" && care !== "---") {
                return `${ownership} – ${care}`;
            }
            if (ownership !== "---") return ownership;
            if (care !== "---") return care;
            return "---";
        };

        const hospitalSystemLabel = () => {
            if (isTrue(h.In_System)) {
                return h.System_Name ? `Part of ${h.System_Name}` : "Part of a Health System";
            }
            return "Independent";
        };

        const infoMap = {
            hospitalCounty: safe(h.County),
            hospitalSize: sizeLabelFromGroup(h.Size_Group),
            hospitalType: hospitalTypeLabel(),
            hospitalCareLevel: safe(h.Care_Level),
            hospitalSystem: hospitalSystemLabel(),
            hospitalUrbanRural: safe(h.Urban_Rural),
            hospitalBeds: safe(h.Bed_Size)
        };
        
        // Apply infoMap values to page
        for (const [id, val] of Object.entries(infoMap)) {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        }
        
        // ===== Services =====
        const list = document.getElementById("hospitalServices");
        if (list) {
            list.innerHTML = "";
            
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
            
            // Column may be spelled correctly or with the typo
            const rawServices = 
                h["Services_Offered"] ||
                h["Servcies_Offered"]; // as per schema note
            
            if (typeof rawServices === "string" && rawServices.trim() && rawServices.toUpperCase() !== "NULL") {
				const parsed = rawServices
					// split on commas, semicolons, pipes, or line breaks
					.split(/[,;\n\r|]+/)
					.map(s => s.trim())
					.filter(Boolean);

				if (parsed.length) services = parsed;
			} else if (Array.isArray(rawServices) && rawServices.length) {
                services = rawServices.map(s => String(s).trim()).filter(Boolean);
            }
            
            list.innerHTML = services.map(s => `<li>${s}</li>`).join("");
        }
        
        // ===== Overall Star Rating (numeric 0–5) =====
        const overallStarsContainer = document.getElementById("overallStars");
        const overallScore = parseFloat(h.Overall_Star_Rating);
        if (overallStarsContainer) {
            const starVal = convertGradeToStars(overallScore).value;
            overallStarsContainer.innerHTML = renderStars(starVal, `${overallScore} of 5`);
        }
        
        const gradeText = document.getElementById("overallGradeText");
        if (gradeText) gradeText.textContent = "";
        
        // ===== Category-level stars (numeric 0–5) =====
        const categoryFieldMap = {
            financialTransparencyStars: "FTIH_Category_Rating",
            communityBenefitStars:      "CBS_Category_Rating",
            affordabilityBillingStars:  "HAB_Category_Rating",
            accessResponsibilityStars:  "HASR_Category_Rating"
        };
        
        for (const [id, field] of Object.entries(categoryFieldMap)) {
            const el = document.getElementById(id);
            if (!el) continue;

            const raw = h[field];
            const score = parseFloat(raw);
            const starVal = convertGradeToStars(score).value;
            el.innerHTML = renderStars(starVal, `${score} of 5`);
        }
        
		
		// ===== Metric-level stars (numeric 0–5) =====
		const metricFieldMap = {
			// Financial Transparency & Institutional Health
			balanceGrowthStars:   "Balance_Growth",
			transparencyStars:    "Transparency",
			fiscalHealthStars:    "Fiscal_Health",
			staffingStars:        "Staffing",

			// Community Benefit Spending
			taxBenefitStars:      "Tax_Benefit",
			qualityCbsStars:      "Quality_of_CBS",
			strategicUseStars:    "Strategic_Use",

			// Healthcare Affordability & Billing
			financialBurdenStars: "Financial_Burden",
			charityCareStars:     "Charity_Care",
			medicalDebtStars:     "Medical_Debt",

			// Healthcare Access & Social Responsibility
			rangeServicesStars:    "Range_of_Services",
			demoAlignStars:        "Demographic_Alignment",
			workforceTrainingStars:"Workforce_Training",
			payEquityStars:        "Pay_Equity_Ratio"
		};

		for (const [id, field] of Object.entries(metricFieldMap)) {
			const el = document.getElementById(id);
			if (!el) continue;

			const raw = h[field];
			const score = parseFloat(raw);
			const starVal = convertGradeToStars(score).value;

			el.innerHTML = renderStars(starVal, `${score} of 5`);
		}

        // ===== Map =====
        const mapDiv = document.getElementById("leafletMap");
        if (mapDiv) {
            let lat = parseFloat(h.Latitude);
            let lon = parseFloat(h.Longitude);
            
            if ((!lat || !lon) && h.ZIP_Code) {
                const coords = getZipCoords(h.ZIP_Code);
                lat = coords[0];
                lon = coords[1];
            }
            
            if (lat && lon) {
                const map = L.map(mapDiv).setView([lat, lon], 9);
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: "&copy; OpenStreetMap contributors"
                }).addTo(map);
                
                L.marker([lat, lon]).addTo(map).bindPopup(hospitalName);
                
                const gmapsEl = document.getElementById("gmapsLink");
                if (gmapsEl) {
                    gmapsEl.href =
                        `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
                }
            }
        }
        
    } catch (err) {
        console.error("Error loading hospital details:", err);
    }
});

// ====== STAR UTILITIES ======
// Now expects numeric 0–5 scores from the dataset
function convertGradeToStars(score) {
    let value = parseFloat(score);
    if (isNaN(value)) value = 0;
    value = Math.max(0, Math.min(5, value)); // clamp
    return { value };
}

function renderStars(value, label = "") {
    const aria = label || `${value} of 5 stars`;
    let html = `<div class="star-rating" aria-label="${aria}">`;
    
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
        "31901": [32.464, -84.9877], // Columbus
        "31401": [32.0809, -81.0912], // Savannah
        "31520": [31.1499, -81.4915], // Brunswick
        "31701": [31.5795, -84.1557], // Albany
        "39817": [30.9043, -84.5762], // Bainbridge
        "30601": [33.959, -83.3767], // Athens
        "30161": [34.2546, -85.1647], // Rome
        "30501": [34.2963, -83.8255], // Gainesville
        "39840": [31.3141, -84.6191], // Dawson
        "30040": [34.2282, -84.1596], // Cumming
        "30809": [33.5515, -82.0903], // Evans/Augusta area
        "31794": [31.4505, -83.5085], // Tifton
        "30263": [33.3768, -84.8038], // Newnan
        "31021": [32.5404, -82.9056], // Dublin
        "30114": [34.196, -84.5049], // Canton
        "30240": [33.036, -85.0318], // LaGrange
        "31525": [31.2609, -81.5163], // Glynn County
    };
    
    const coords = lookup[String(zip)] || [32.5, -83.5];
    return coords;
}


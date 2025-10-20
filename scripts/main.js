// ===============================
// Data Storage
// ===============================
let hospitalData = [];
let filteredHospitalData = [];

// ===============================
// Load JSON Data
// ===============================
fetch("./data/2025/2025_Lown_Index_GA.json")
  .then(res => res.json())
  .then(data => {
    hospitalData = data;
    filteredHospitalData = [...hospitalData];
    console.log("Hospital data loaded:", hospitalData.length, "records");

    // Initial render
    renderHospitals(hospitalData);
    initHospitalMap(hospitalData);
  })
  .catch(err => console.error("Error loading JSON:", err));

// ===============================
// Render Hospitals
// ===============================
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
      <div class="star-rating" aria-label="${stars.value} out of 5 stars">
        ${renderStars(stars.value)}
      </div>
    `;
    row.appendChild(gradeCell);

    const nameCell = document.createElement("td");
    nameCell.innerHTML = `
      <strong>
        <a href="details.html?id=${hospital.RECORD_ID}" class="hospital-link">
          ${hospital.Name || "Unnamed Hospital"}
        </a>
      </strong><br>
      ${hospital.City || ""}, ${hospital.State || ""}
    `;
    row.appendChild(nameCell);

    // === Buttons ===
    const buttonCell = document.createElement("td");
    buttonCell.classList.add("details-buttons");

    const detailsButton = document.createElement("button");
    detailsButton.textContent = "View Details ▼";
    detailsButton.classList.add("toggle-detail");

    const fullDetailsButton = document.createElement("button");
    fullDetailsButton.textContent = "View Full Details";
    fullDetailsButton.classList.add("view-full-detail");
    fullDetailsButton.addEventListener("click", () => {
      if (hospital.RECORD_ID) {
        window.location.href = `details.html?id=${hospital.RECORD_ID}`;
      } else {
        showErrorPopup("Sorry, we couldn't find more details for this hospital.");
      }
    });

    buttonCell.appendChild(detailsButton);
    buttonCell.appendChild(fullDetailsButton);
    row.appendChild(buttonCell);

    // === Detail Row (collapsed preview) ===
    const detailRow = document.createElement("tr");
    detailRow.classList.add("hospital-detail-row");
    detailRow.style.display = "none";

    const detailCell = document.createElement("td");
    detailCell.colSpan = 3;
    detailCell.innerHTML = `
      <div class="detail-info">
        <p class="inline-stars"><strong>Outcome:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Outcome || "F").value)}</p>
        <p class="inline-stars"><strong>Value:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Value || "F").value)}</p>
        <p class="inline-stars"><strong>Civic:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Civic || "F").value)}</p>
        <p class="inline-stars"><strong>Safety:</strong> ${renderStars(convertGradeToStars(hospital.TIER_3_GRADE_Pat_Saf || "F").value)}</p>
        <p class="inline-stars"><strong>Experience:</strong> ${renderStars(convertGradeToStars(hospital.TIER_3_GRADE_Pat_Exp || "F").value)}</p>
      </div>
    `;
    detailRow.appendChild(detailCell);

    // === Toggle Logic (single listener) ===
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

// ===============================
// View Toggle and Filter Buttons
// ===============================
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
  applyAllFilters();
});

// Acute Care toggle
filterAcuteBtn.addEventListener("click", () => {
  const isActive = filterAcuteBtn.classList.contains("active");
  deactivateHospitalTypeButtons();
  if (!isActive) {
    filterAcuteBtn.classList.add("active");
  }
  applyAllFilters();
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
  individualOptions.style.display = "none"; // NOTE: Hides individual hospital type options
  applyAllFilters();
});

viewIndividualsBtn.addEventListener("click", () => {
  viewIndividualsBtn.classList.add("active");
  viewSystemsBtn.classList.remove("active");
  individualOptions.style.display = "block"; // NOTE: Shows individual hospital type options
  applyAllFilters();
});

// ===============================
// Apply Location Button - NOTE: ADDED THIS MISSING EVENT LISTENER
// ===============================
document.getElementById("applyLocationBtn").addEventListener("click", () => {
  applyAllFilters();
});

// ===============================
// Main Filter Function
// ===============================
function applyAllFilters() {
  let filtered = [...hospitalData];

  // Apply hospital type filters
  const selectedHospitalType = getSelectedHospitalType();
  if (selectedHospitalType === 'Critical Access') {
    filtered = filtered.filter(hospital => hospital.TYPE_HospTyp_CAH === 1);
  } else if (selectedHospitalType === 'Acute Care') {
    filtered = filtered.filter(hospital => hospital.TYPE_HospTyp_ACH === 1);
  }

  // Apply checkbox filters
  const checked = [...document.querySelectorAll("input[type='checkbox']:checked")].map(cb => cb.value);
  if (checked.length > 0) {
    filtered = filtered.filter(hospital => {
      return checked.every(val => {
        switch(val) {
          case 'Urban': return hospital.TYPE_urban === 1;
          case 'Rural': return hospital.TYPE_rural === 1;
          case 'Non-profit': return hospital.TYPE_NonProfit === 1;
          case 'For Profit': return hospital.TYPE_ForProfit === 1;
          case 'Church Affiliated': return hospital.TYPE_chrch_affl_f === 1;
          case 'Academic Medical Center': return hospital.TYPE_AMC === 1;
          case 'Safety Net': return hospital.TYPE_isSafetyNet === 1;
          default: return JSON.stringify(hospital).toLowerCase().includes(val.toLowerCase());
        }
      });
    });
  }

  // Apply location filter
  const zip = document.getElementById("zipInput").value.trim();
  const radius = document.getElementById("radiusSelect").value;
  if (zip && /^\d{5}$/.test(zip)) {
    const coords = getZipCoords(zip);
    filtered = filtered.filter(hospital => {
      let lat = parseFloat(hospital.Latitude) || getZipCoords(hospital.Zip)[0];
      let lon = parseFloat(hospital.Longitude) || getZipCoords(hospital.Zip)[1];
      const distance = calculateDistance(coords[0], coords[1], lat, lon);
      return distance <= parseInt(radius);
    });
  }

  filteredHospitalData = filtered;
  
  // Apply sorting and render
  sortAndRender(filteredHospitalData);
  updateMapMarkers(filteredHospitalData);
}

// ===============================
// Distance Calculation
// ===============================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ===============================
// Sorting Function
// ===============================
function sortAndRender(data) {
  const sortValue = document.getElementById("sortSelect").value;
  let sorted = [...data];

  if (sortValue === "grade") {
    sorted.sort((a, b) => {
      const gradeOrder = {"A+": 12, "A": 11, "A-": 10, "B+": 9, "B": 8, "B-": 7, "C+": 6, "C": 5, "C-": 4, "D+": 3, "D": 2, "D-": 1, "F": 0, "N/A": -1};
      const gradeA = a.TIER_1_GRADE_Lown_Composite || "N/A";
      const gradeB = b.TIER_1_GRADE_Lown_Composite || "N/A";
      return gradeOrder[gradeB] - gradeOrder[gradeA]; // High to low
    });
  } else if (sortValue === "distance") {
    // Distance sorting handled in applyAllFilters
  } else if (sortValue === "name") {
    sorted.sort((a, b) => (a.Name || "").localeCompare(b.Name || ""));
  } else if (sortValue === "size") {
    const sizeOrder = {"xs": 1, "s": 2, "m": 3, "l": 4, "xl": 5};
    sorted.sort((a, b) => {
      const sizeA = sizeOrder[a.Size] || 0;
      const sizeB = sizeOrder[b.Size] || 0;
      return sizeA - sizeB; // Small to large
    });
  }

  renderHospitals(sorted);
}

// ===============================
// Apply Filters Button
// ===============================
document.getElementById("applyFiltersBtn").addEventListener("click", () => {
  applyAllFilters();
});

// ===============================
// Reset Filters - NOTE: REMOVED viewIndividualsBtn.click() to prevent auto-showing dropdown
// ===============================
document.getElementById("resetFiltersBtn").addEventListener("click", () => {
  document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
  document.getElementById("zipInput").value = "";
  document.getElementById("radiusSelect").selectedIndex = 0;
  
  // Reset view buttons - NOTE: Only deactivates type buttons, doesn't change view mode
  deactivateHospitalTypeButtons();
  // NOTE: Removed viewIndividualsBtn.click() - reset now keeps current view mode
  
  // Reset to all data
  filteredHospitalData = [...hospitalData];
  renderHospitals(hospitalData);
  updateMapMarkers(hospitalData);
});

// ===============================
// Sort Event Listener
// ===============================
document.getElementById("sortSelect").addEventListener("change", () => {
  sortAndRender(filteredHospitalData);
});

// ===============================
// Download Data
// ===============================
document.getElementById("downloadDataBtn").addEventListener("click", () => {
  console.log("Download triggered");
  // TODO: backend or SheetJS export
});

// ===============================
// Map Functions
// ===============================
let map;
let mapMarkers = [];

function initHospitalMap(data) {
  const mapDiv = document.getElementById("mainMap");
  if (!mapDiv) {
    console.error("Map container not found!");
    return;
  }

  // Initialize map only once
  if (!map) {
    console.log("Initializing map...");
    map = L.map("mainMap").setView([32.7, -83.4], 7);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18
    }).addTo(map);
    
    console.log("Map initialized successfully");
  }

  updateMapMarkers(data);
}

function updateMapMarkers(data) {
  console.log("Updating map markers with", data.length, "hospitals");
  
  // Clear old markers
  mapMarkers.forEach(marker => map.removeLayer(marker));
  mapMarkers = [];

  if (data.length === 0) {
    console.log("No data to display on map");
    return;
  }

  // Add new markers
  data.forEach(hospital => {
    let lat = parseFloat(hospital.Latitude);
    let lon = parseFloat(hospital.Longitude);

    // If no coordinates, approximate from ZIP code
    if ((!lat || !lon) && hospital.Zip) {
      [lat, lon] = getZipCoords(hospital.Zip);
    }

    if (!lat || !lon) {
      console.warn("No coordinates for hospital:", hospital.Name);
      return;
    }

    const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
    const stars = convertGradeToStars(grade);

    const popupHTML = `
      <div class="map-popup">
        <strong>${hospital.Name || "Unnamed Hospital"}</strong><br>
        ${hospital.City || ""}, ${hospital.State || ""}<br>
        <div class="star-rating">${renderStars(stars.value)}</div>
        <a href="details.html?id=${hospital.RECORD_ID}" class="view-full-detail">
          View Full Details
        </a>
      </div>
    `;

    const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
    mapMarkers.push(marker);
  });

  console.log("Added", mapMarkers.length, "markers to map");

  // Adjust map to fit all visible markers
  if (mapMarkers.length > 0) {
    const group = L.featureGroup(mapMarkers);
    map.fitBounds(group.getBounds().pad(0.2));
    console.log("Map bounds adjusted to fit markers");
  }

  // Ensure map is properly sized
  setTimeout(() => {
    map.invalidateSize();
    console.log("Map size invalidated");
  }, 100);
}

// ===============================
// ZIP-Based Coordinate Approximation
// ===============================
function getZipCoords(zip) {
  const lookup = {
    "30303": [33.7525, -84.3915], // Atlanta
    "30606": [33.9597, -83.3764], // Athens
    "31404": [32.0760, -81.0886], // Savannah
    "31533": [31.5185, -82.8499], // Douglas
    "30553": [34.3434, -83.8003], // Lavonia
    "30720": [34.7698, -84.9719], // Dalton
    "31201": [32.8306, -83.6513], // Macon
    "31901": [32.464, -84.9877], // Columbus
    "31401": [32.0809, -81.0912], // Savannah
    "31701": [31.5795, -84.1557], // Albany
    "39817": [30.9043, -84.5762], // Bainbridge
    "30161": [34.2546, -85.1647], // Rome
    "30501": [34.2963, -83.8255], // Gainesville
    "30117": [33.5801, -85.0767], // Carrollton
    "31093": [32.6184, -83.6272], // Warner Robins
    "31405": [32.0316, -81.1028], // Savannah
    "31021": [32.5563, -82.8947], // Dublin
    "31792": [30.8365, -83.9787]  // Thomasville
  };
  const coords = lookup[String(zip)] || [32.5, -83.5]; // Default to central Georgia
  return coords;
}

// ===============================
// Star Rating Utilities
// ===============================
function convertGradeToStars(grade) {
  const gradeMap = {
    "A+": 5, "A": 5, "A-": 4.5,
    "B+": 4.5, "B": 4, "B-": 3.5,
    "C+": 3.5, "C": 3, "C-": 2.5,
    "D+": 2.5, "D": 2, "D-": 1.5,
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
// Error Popup Utility
// ===============================
function showErrorPopup(message) {
  const popup = document.createElement("div");
  popup.className = "error-popup";
  popup.innerHTML = `<p>${message}</p>`;
  document.body.appendChild(popup);

  setTimeout(() => popup.classList.add("visible"), 10);

  setTimeout(() => {
    popup.classList.remove("visible");
    setTimeout(() => popup.remove(), 400);
  }, 4000);
}

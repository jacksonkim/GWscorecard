// ===============================
// Data Storage
// ===============================
let hospitalData = [];
let filteredHospitalData = [];

// ===============================
// Load JSON Data
// ===============================
fetch(DATA_URL)
    .then(res => res.json())
    .then(data => {
        hospitalData = data;
        filteredHospitalData = [...hospitalData];
        console.log("Hospital data loaded:", hospitalData.length, "records");

        // Initial render
        renderHospitals(hospitalData);
        initHospitalMap(hospitalData);
        initMobileMap(hospitalData);

        // Initialize mobile UI
        initMobileUI();
    })
    .catch(err => console.error("Error loading JSON:", err));

// ===============================
// Mobile Navigation & Filter Functions
// ===============================
function initMobileUI() {
    // Initialize mobile event listeners
    initMobileEventListeners();
    // Initialize mobile navigation
    initMobileNavigation();
}

function initMobileEventListeners() {
    // Mobile navigation toggle
    document.querySelector('.mobile-nav-toggle')?.addEventListener('click', toggleMobileNavigation);
    document.querySelector('.mobile-nav-close')?.addEventListener('click', toggleMobileNavigation);
    document.querySelector('.mobile-nav-overlay')?.addEventListener('click', function(e) {
        if (e.target === this) toggleMobileNavigation();
    });

    // Mobile filter toggle
    document.querySelector('.mobile-filter-toggle')?.addEventListener('click', toggleMobileFilters);
    document.querySelector('.mobile-filter-close')?.addEventListener('click', toggleMobileFilters);
    document.querySelector('.mobile-filter-overlay')?.addEventListener('click', function(e) {
        if (e.target === this) toggleMobileFilters();
    });

    // Mobile filter buttons
    document.getElementById('mobileApplyFiltersBtn')?.addEventListener('click', function() {
        applyAllFilters();
        toggleMobileFilters();
    });

    document.getElementById('mobileResetFiltersBtn')?.addEventListener('click', function() {
        resetAllFilters();
        setTimeout(() => {
            toggleMobileFilters();
        }, 100);
    });

    document.getElementById('mobileApplyLocationBtn')?.addEventListener('click', function() {
        applyAllFilters();
        toggleMobileFilters();
    });

    // Mobile view toggle buttons
    const mobileViewSystemsBtn = document.getElementById('mobileViewSystemsBtn');
    const mobileViewIndividualsBtn = document.getElementById('mobileViewIndividualsBtn');
    const mobileFilterCriticalBtn = document.getElementById('mobileFilterCriticalBtn');
    const mobileFilterAcuteBtn = document.getElementById('mobileFilterAcuteBtn');
    const mobileCompareHospitalsBtn = document.getElementById('mobileCompareHospitalsBtn');

    if (mobileViewSystemsBtn) {
        mobileViewSystemsBtn.addEventListener('click', function() {
            document.getElementById('viewSystemsBtn').click();
            syncMobileViewButtons();
        });
    }

    if (mobileViewIndividualsBtn) {
        mobileViewIndividualsBtn.addEventListener('click', function() {
            document.getElementById('viewIndividualsBtn').click();
            syncMobileViewButtons();
        });
    }

    if (mobileCompareHospitalsBtn) {
        mobileCompareHospitalsBtn.addEventListener('click', function() {
            document.getElementById('compareHospitalsBtn').click();
            syncMobileViewButtons();
        });
    }

    if (mobileFilterCriticalBtn) {
        mobileFilterCriticalBtn.addEventListener('click', function() {
            document.getElementById('filterCriticalBtn').click();
            syncMobileFilterButtons();
        });
    }

    if (mobileFilterAcuteBtn) {
        mobileFilterAcuteBtn.addEventListener('click', function() {
            document.getElementById('filterAcuteBtn').click();
            syncMobileFilterButtons();
        });
    }

    // Sync checkbox states
    syncFilterInputs();
}

function syncMobileViewButtons() {
    const viewSystemsBtn = document.getElementById('viewSystemsBtn');
    const viewIndividualsBtn = document.getElementById('viewIndividualsBtn');
    const compareHospitalsBtn = document.getElementById('compareHospitalsBtn');
    const mobileViewSystemsBtn = document.getElementById('mobileViewSystemsBtn');
    const mobileViewIndividualsBtn = document.getElementById('mobileViewIndividualsBtn');
    const mobileCompareHospitalsBtn = document.getElementById('mobileCompareHospitalsBtn');
    const individualOptions = document.getElementById('individualOptions');
    const mobileIndividualOptions = document.getElementById('mobileIndividualOptions');

    if (viewSystemsBtn && mobileViewSystemsBtn) {
        if (viewSystemsBtn.classList.contains('active')) {
            mobileViewSystemsBtn.classList.add('active');
            mobileViewIndividualsBtn.classList.remove('active');
            mobileCompareHospitalsBtn.classList.remove('active');
            if (mobileIndividualOptions) mobileIndividualOptions.style.display = 'none';
        } else if (viewIndividualsBtn.classList.contains('active')) {
            mobileViewSystemsBtn.classList.remove('active');
            mobileViewIndividualsBtn.classList.add('active');
            mobileCompareHospitalsBtn.classList.remove('active');
            if (mobileIndividualOptions) mobileIndividualOptions.style.display = 'block';
        } else if (compareHospitalsBtn.classList.contains('active')) {
            mobileViewSystemsBtn.classList.remove('active');
            mobileViewIndividualsBtn.classList.remove('active');
            mobileCompareHospitalsBtn.classList.add('active');
            if (mobileIndividualOptions) mobileIndividualOptions.style.display = 'none';
        }
    }
}

function syncMobileFilterButtons() {
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');
    const mobileFilterCriticalBtn = document.getElementById('mobileFilterCriticalBtn');
    const mobileFilterAcuteBtn = document.getElementById('mobileFilterAcuteBtn');

    if (filterCriticalBtn && mobileFilterCriticalBtn) {
        if (filterCriticalBtn.classList.contains('active')) {
            mobileFilterCriticalBtn.classList.add('active');
            mobileFilterAcuteBtn.classList.remove('active');
        } else if (filterAcuteBtn.classList.contains('active')) {
            mobileFilterCriticalBtn.classList.remove('active');
            mobileFilterAcuteBtn.classList.add('active');
        } else {
            mobileFilterCriticalBtn.classList.remove('active');
            mobileFilterAcuteBtn.classList.remove('active');
        }
    }
}

function toggleMobileFilters() {
    const body = document.body;
    const overlay = document.querySelector('.mobile-filter-overlay');
    const panel = document.querySelector('.mobile-filter-panel');
    
    body.classList.toggle('mobile-filter-open');
    overlay.style.display = body.classList.contains('mobile-filter-open') ? 'block' : 'none';
    
    setTimeout(() => {
        panel.classList.toggle('active');
        // Sync button states when opening
        if (body.classList.contains('mobile-filter-open')) {
            syncMobileViewButtons();
            syncMobileFilterButtons();
            syncFilterInputs();
        }
    }, 10);
}

function syncFilterInputs() {
    // Sync checkbox states between mobile and desktop
    const desktopCheckboxes = document.querySelectorAll('.sidebar input[type="checkbox"]');
    const mobileCheckboxes = document.querySelectorAll('.mobile-filter-content input[type="checkbox"]');
    
    desktopCheckboxes.forEach((checkbox, index) => {
        if (mobileCheckboxes[index]) {
            mobileCheckboxes[index].checked = checkbox.checked;
        }
    });

    // Sync input values
    const zipInput = document.getElementById('zipInput');
    const mobileZipInput = document.getElementById('mobileZipInput');
    const radiusSelect = document.getElementById('radiusSelect');
    const mobileRadiusSelect = document.getElementById('mobileRadiusSelect');

    if (zipInput && mobileZipInput) {
        mobileZipInput.value = zipInput.value;
    }
    if (radiusSelect && mobileRadiusSelect) {
        mobileRadiusSelect.value = radiusSelect.value;
    }
}

// ===============================
// Mobile Map Functions
// ===============================
let mobileMap = null;
let mobileMapMarkers = [];

function initMobileMap(data) {
    const mapDiv = document.getElementById('mobileMainMap');
    if (!mapDiv) return;

    if (!mobileMap) {
        mobileMap = L.map('mobileMainMap').setView([32.7, -83.4], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(mobileMap);
    }

    updateMobileMapMarkers(data);
}

function updateMobileMapMarkers(data) {
    // Clear old markers
    mobileMapMarkers.forEach(marker => mobileMap.removeLayer(marker));
    mobileMapMarkers = [];

    if (!data || data.length === 0) return;

    data.forEach(hospital => {
        let lat = Number(hospital.Latitude);
        let lon = Number(hospital.Longitude);

        const latBad = Number.isNaN(lat);
        const lonBad = Number.isNaN(lon);

        if ((latBad || lonBad) && hospital.ZIP_Code) {
            const [zipLat, zipLon] = getZipCoords(hospital.ZIP_Code);
            lat = zipLat;
            lon = zipLon;
        }

        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            console.warn('No usable coordinates for hospital (mobile):', hospital.Hospital_Name);
            return;
        }

        const overallScore = Number(hospital.Overall_Star_Rating);
        const overallStars = convertGradeToStars(overallScore);
        const ftiScore = convertGradeToStars(hospital.FTIH_Category_Rating).value;
        const hasrScore = convertGradeToStars(hospital.HASR_Category_Rating).value;

        const typeLabel = hospital.Ownership_Type && hospital.Care_Level
            ? `${hospital.Ownership_Type} – ${hospital.Care_Level}`
            : (hospital.Ownership_Type || hospital.Care_Level || 'Type unknown');

        const bedLabel = hospital.Bed_Size ? `${hospital.Bed_Size} beds` : 'Bed size N/A';

        const systemLabel = hospital.In_System
            ? (hospital.System_Name ? `Part of ${hospital.System_Name}` : 'Part of a health system')
            : 'Independent';

        const popupHTML = `
            <div class="map-popup">
                <strong class="map-popup-title">
                    ${hospital.Hospital_Name || 'Unnamed Hospital'}
                </strong>
                <div class="map-popup-location">
                    ${(hospital.City || '')}, ${(hospital.State || '')}
                </div>

                <div class="map-popup-section">
                    <div class="map-popup-overall">
                        <span class="map-popup-label">Overall:</span>
                        <span class="map-popup-stars" aria-label="${overallStars.value} out of 5 stars">
                            ${renderStars(overallStars.value)}
                        </span>
                        ${Number.isFinite(overallScore)
                            ? `<span class="map-popup-score">${overallScore.toFixed(1)} / 5</span>`
                            : ''}
                    </div>

                    <div class="map-popup-submetrics">
                        <div class="map-popup-submetric">
                            <span class="map-popup-label">Transparency & Health:</span>
                            <span class="map-popup-stars">
                                ${renderStars(ftiScore)}
                            </span>
                        </div>
                        <div class="map-popup-submetric">
                            <span class="map-popup-label">Access & Responsibility:</span>
                            <span class="map-popup-stars">
                                ${renderStars(hasrScore)}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="map-popup-meta">
                    <span>${typeLabel}</span><br>
                    <span>${bedLabel}</span><br>
                    <span>${systemLabel}</span>
                </div>

                <a href="details.html?id=${hospital.Hospital_ID}" class="view-full-detail">
                    View Full Details
                </a>
            </div>
        `;

        const marker = L.marker([lat, lon]).addTo(mobileMap).bindPopup(popupHTML, {
            maxWidth: 320
        });
        mobileMapMarkers.push(marker);
    });

    if (mobileMapMarkers.length > 0) {
		const group = L.featureGroup(mobileMapMarkers);
		const bounds = group.getBounds().pad(0.2);

		// Get the desktop map's current zoom + center
		if (map) {
			const center = map.getCenter();
			const zoom = map.getZoom();
			mobileMap.setView(center, zoom);
		} else {
			// fallback: desktop wasn't initialized yet
			mobileMap.fitBounds(bounds);
		}
	}


    setTimeout(() => {
        if (mobileMap) {
            mobileMap.invalidateSize();
        }
    }, 100);
}


// ===============================
// Render Hospitals
// ===============================
function renderHospitals(data) {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');

    // Clear old results
    resultsTable.innerHTML = '';

    // Update results count
    resultsCount.textContent = `Viewing ${data.length} results`;

    if (!data.length) {
        resultsTable.innerHTML = `<tr><td colspan="3">No hospitals match the selected filters.</td></tr>`;
        return;
    }

    data.forEach(hospital => {
        // Use numeric overall star rating
        const overallScore = hospital.Overall_Star_Rating;
        const stars = convertGradeToStars(overallScore);

        // === Main Row ===
        const row = document.createElement('tr');
        row.classList.add('hospital-row');

        const gradeCell = document.createElement('td');
        gradeCell.innerHTML = `
            <div class="star-rating" aria-label="${stars.value} out of 5 stars">
                ${renderStars(stars.value)}
            </div>
        `;
        row.appendChild(gradeCell);

        const nameCell = document.createElement('td');
        nameCell.innerHTML = `
            <strong>
                <a href="details.html?id=${hospital.Hospital_ID}" class="hospital-link">
                    ${hospital.Hospital_Name || 'Unnamed Hospital'}
                </a>
            </strong><br>
            ${hospital.City || ''}, ${hospital.State || ''}
        `;
        row.appendChild(nameCell);

        // === Buttons ===
        const buttonCell = document.createElement('td');
        buttonCell.classList.add('details-buttons');

        const detailsButton = document.createElement('button');
        detailsButton.textContent = 'View Details ▼';
        detailsButton.classList.add('toggle-detail');

        const fullDetailsButton = document.createElement('button');
        fullDetailsButton.textContent = 'View Full Details';
        fullDetailsButton.classList.add('view-full-detail');
        fullDetailsButton.addEventListener('click', () => {
            if (hospital.Hospital_ID != null) {
                window.location.href = `details.html?id=${hospital.Hospital_ID}`;
            } else {
                showErrorPopup('Sorry, we couldn\'t find more details for this hospital.');
            }
        });

        buttonCell.appendChild(detailsButton);
        buttonCell.appendChild(fullDetailsButton);
        row.appendChild(buttonCell);

        // === Detail Row (collapsed preview) ===
        const detailRow = document.createElement('tr');
        detailRow.classList.add('hospital-detail-row');
        detailRow.style.display = 'none';

        const ftiScore = convertGradeToStars(hospital.FTIH_Category_Rating).value;
        const cbsScore = convertGradeToStars(hospital.CBS_Category_Rating).value;
        const habScore = convertGradeToStars(hospital.HAB_Category_Rating).value;
        const hasrScore = convertGradeToStars(hospital.HASR_Category_Rating).value;
        const overallPreviewScore = convertGradeToStars(hospital.Overall_Star_Rating).value;

        const detailCell = document.createElement('td');
        detailCell.colSpan = 3;
        detailCell.innerHTML = `
            <div class="detail-info">
                <p class="inline-stars"><strong>Financial Transparency & Institutional Health:</strong> ${renderStars(ftiScore)}</p>
                <p class="inline-stars"><strong>Community Benefit Spending:</strong> ${renderStars(cbsScore)}</p>
                <p class="inline-stars"><strong>Affordability & Billing:</strong> ${renderStars(habScore)}</p>
                <p class="inline-stars"><strong>Access & Social Responsibility:</strong> ${renderStars(hasrScore)}</p>
                <p class="inline-stars"><strong>Overall:</strong> ${renderStars(overallPreviewScore)}</p>
            </div>
        `;
        detailRow.appendChild(detailCell);

        // === Toggle Logic (single listener) ===
        detailsButton.addEventListener('click', () => {
            const isHidden = detailRow.style.display === 'none' || detailRow.style.display === '';
            detailRow.style.display = isHidden ? 'table-row' : 'none';
            detailsButton.textContent = isHidden ? 'Hide Details ▲' : 'View Details ▼';
        });

        // === Append both rows ===
        resultsTable.appendChild(row);
        resultsTable.appendChild(detailRow);
    });

    // Update mobile map
    if (mobileMap) {
        updateMobileMapMarkers(data);
    }
}

// ===============================
// View Toggle and Filter Buttons
// ===============================
const viewSystemsBtn = document.getElementById('viewSystemsBtn');
const viewIndividualsBtn = document.getElementById('viewIndividualsBtn');
const compareHospitalsBtn = document.getElementById('compareHospitalsBtn');
const individualOptions = document.getElementById('individualOptions');
const filterCriticalBtn = document.getElementById('filterCriticalBtn');
const filterAcuteBtn = document.getElementById('filterAcuteBtn');

function deactivateAllViewButtons() {
    viewSystemsBtn.classList.remove('active');
    viewIndividualsBtn.classList.remove('active');
    compareHospitalsBtn.classList.remove('active');
}

function deactivateHospitalTypeButtons() {
    filterCriticalBtn.classList.remove('active');
    filterAcuteBtn.classList.remove('active');
}

// View Systems toggle
viewSystemsBtn.addEventListener('click', () => {
    deactivateAllViewButtons();
    viewSystemsBtn.classList.add('active');
    individualOptions.style.display = 'none';
    applyAllFilters();
});

// View Individuals toggle
viewIndividualsBtn.addEventListener('click', () => {
    deactivateAllViewButtons();
    viewIndividualsBtn.classList.add('active');
    individualOptions.style.display = 'block';
    applyAllFilters();
});

// Compare Hospitals toggle
compareHospitalsBtn.addEventListener('click', () => {
    deactivateAllViewButtons();
    compareHospitalsBtn.classList.add('active');
    individualOptions.style.display = 'none';
    // Redirect to compare page
    window.location.href = 'compare.html';
});

// Critical Access toggle
filterCriticalBtn.addEventListener('click', () => {
    const isActive = filterCriticalBtn.classList.contains('active');
    deactivateHospitalTypeButtons();
    if (!isActive) {
        filterCriticalBtn.classList.add('active');
    }
    applyAllFilters();
});

// Acute Care toggle
filterAcuteBtn.addEventListener('click', () => {
    const isActive = filterAcuteBtn.classList.contains('active');
    deactivateHospitalTypeButtons();
    if (!isActive) {
        filterAcuteBtn.classList.add('active');
    }
    applyAllFilters();
});

// Helper function to get current selection
function getSelectedHospitalType() {
    if (filterCriticalBtn.classList.contains('active')) return 'Critical Access';
    if (filterAcuteBtn.classList.contains('active')) return 'Acute Care';
    return null;
}

// ===============================
// Apply Location Button
// ===============================
document.getElementById('applyLocationBtn').addEventListener('click', () => {
    applyAllFilters();
});

// ===============================
// Main Filter Function
// ===============================
function applyAllFilters() {
    let filtered = [...hospitalData];
	
	

    // Apply hospital type filters (map to Care_Level)
    const selectedHospitalType = getSelectedHospitalType();
    if (selectedHospitalType === 'Critical Access') {
        // Approximated as primary/small hospitals in this schema
        filtered = filtered.filter(hospital => hospital.Care_Level === 'Primary');
    } else if (selectedHospitalType === 'Acute Care') {
        filtered = filtered.filter(hospital => hospital.Care_Level === 'Acute Care');
    }

    // Apply checkbox filters
    const checked = [...document.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
    
    if (checked.length > 0) {
        filtered = filtered.filter(hospital => {
            return checked.every(val => {
                switch(val) {
                    case 'Urban':
                        return hospital.Urban_Rural === 'Urban';
                    case 'Rural':
                        return hospital.Urban_Rural === 'Rural';
                    case 'Non-profit':
                        return hospital.Ownership_Type === 'Non-profit' || hospital.Ownership_Type === 'Nonprofit';
                    case 'For Profit':
                        return hospital.Ownership_Type === 'For Profit' || hospital.Ownership_Type === 'For-profit';
                    // The remaining categories (Church Affiliated, Academic Medical Center, Safety Net)
                    // are not explicit in this schema, so we fall back to a text search.
                    case 'Church Affiliated':
                    case 'Academic Medical Center':
                    case 'Safety Net':
                        return JSON.stringify(hospital).toLowerCase().includes(val.toLowerCase());
                    default:
                        return JSON.stringify(hospital).toLowerCase().includes(val.toLowerCase());
                }
            });
        });
    }
	
	filtered = filterByZipAndRadius(filtered);

	filteredHospitalData = filtered;

    // Apply sorting and render
    sortAndRender(filteredHospitalData);
    updateMapMarkers(filteredHospitalData);
    updateMobileMapMarkers(filteredHospitalData);
}

// ===============================
// Sorting Function
// ===============================
function sortAndRender(data) {
    const sortValue = document.getElementById('sortSelect').value;
    let sorted = [...data];

    if (sortValue === 'grade') {
        // Sort by numeric overall star rating (high to low)
        sorted.sort((a, b) => {
            const aScore = typeof a.Overall_Star_Rating === 'number' ? a.Overall_Star_Rating : -1;
            const bScore = typeof b.Overall_Star_Rating === 'number' ? b.Overall_Star_Rating : -1;
            return bScore - aScore;
        });
    } else if (sortValue === 'distance') {
        // Distance sorting handled in applyAllFilters
    } else if (sortValue === 'name') {
        sorted.sort((a, b) => (a.Hospital_Name || '').localeCompare(b.Hospital_Name || ''));
    } else if (sortValue === 'size') {
        // Sort by Size_Group (XS < S < M < L < XL < XXL)
        const sizeOrder = {
            'XS': 1,
            'S': 2,
            'M': 3,
            'L': 4,
            'XL': 5,
            'XXL': 6
        };
        sorted.sort((a, b) => {
            const sizeA = sizeOrder[a.Size_Group] || 0;
            const sizeB = sizeOrder[b.Size_Group] || 0;
            return sizeA - sizeB; // Small to large
        });
    }

    renderHospitals(sorted);
}

function filterByZipAndRadius(hospitals) {
    const zipInput = document.getElementById('zipInput');
    const radiusSelect = document.getElementById('radiusSelect');

    if (!zipInput || !radiusSelect) return hospitals;

    const zip = zipInput.value.trim();
    const radiusMiles = Number(radiusSelect.value);

    if (!zip || Number.isNaN(radiusMiles)) {
        return hospitals; // no ZIP or radius = no filter
    }

    // Convert ZIP → coords safely
    const coords = getZipCoords(zip);
    if (!coords) {
        console.warn("ZIP lookup failed:", zip);
        showErrorPopup("We could not find that ZIP code in our Georgia list. Please check the ZIP or try another one.");
        return hospitals;
    }

    const [zipLat, zipLon] = coords;

    // Use the global calculateDistance function
    return hospitals.filter(h => {
        let lat = Number(h.Latitude);
        let lon = Number(h.Longitude);

        // Fallback if hospital missing coords but has a ZIP
        if ((Number.isNaN(lat) || Number.isNaN(lon)) && h.ZIP_Code) {
            const fallback = getZipCoords(h.ZIP_Code);
            if (fallback) {
                const [zLat, zLon] = fallback;
                lat = zLat;
                lon = zLon;
            }
        }

        if (Number.isNaN(lat) || Number.isNaN(lon)) return false;

        const dist = calculateDistance(zipLat, zipLon, lat, lon);
        return dist <= radiusMiles;
    });
}



// ===============================
// Apply Filters Button
// ===============================
document.getElementById('applyFiltersBtn').addEventListener('click', () => {
    applyAllFilters();
});

// ===============================
// Reset Filters
// ===============================
function resetAllFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('zipInput').value = '';
    document.getElementById('radiusSelect').selectedIndex = 0;

    // Reset view buttons
    deactivateAllViewButtons();
    deactivateHospitalTypeButtons();

    // Reset to all data
    filteredHospitalData = [...hospitalData];
    renderHospitals(hospitalData);
    updateMapMarkers(hospitalData);
    updateMobileMapMarkers(hospitalData);
}

document.getElementById('resetFiltersBtn').addEventListener('click', resetAllFilters);

// ===============================
// Sort Event Listener
// ===============================
document.getElementById('sortSelect').addEventListener('change', () => {
    sortAndRender(filteredHospitalData);
});

// ===============================
// Download Data
// ===============================
const dlBtn = document.getElementById("downloadDataBtn");

if (dlBtn) {
    const csvPath = DATA_URL.replace(".json", ".csv");

    dlBtn.addEventListener("click", () => {
        const link = document.createElement("a");
        link.href = csvPath;

        // Automatically match the file name
        const fileName = csvPath.split("/").pop();
        link.download = fileName;

        link.click();
    });
}

// ===============================
// Map Functions
// ===============================
let map = null;
let mapMarkers = [];

function initHospitalMap(data) {
    const mapDiv = document.getElementById('mainMap');
    if (!mapDiv) {
        console.error('Map container not found!');
        return;
    }

    // Initialize map only once
    if (!map) {
        console.log('Initializing map...');
        map = L.map('mainMap').setView([32.7, -83.4], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
        console.log('Map initialized successfully');
    }

    updateMapMarkers(data);
}

function updateMapMarkers(data) {
    console.log('Updating map markers with', data.length, 'hospitals');

    // Clear old markers
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    if (!data || data.length === 0) {
        console.log('No data to display on map');
        return;
    }

    data.forEach(hospital => {
        // Use numeric coordinates
        let lat = Number(hospital.Latitude);
        let lon = Number(hospital.Longitude);

        const latBad = Number.isNaN(lat);
        const lonBad = Number.isNaN(lon);

        // Fallback: approximate from ZIP only if lat/lon are invalid
        if ((latBad || lonBad) && hospital.ZIP_Code) {
            const [zipLat, zipLon] = getZipCoords(hospital.ZIP_Code);
            lat = zipLat;
            lon = zipLon;
        }

        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            console.warn('No usable coordinates for hospital:', hospital.Hospital_Name);
            return;
        }

        // Overall and category scores (0–5)
        const overallScore = Number(hospital.Overall_Star_Rating);
        const overallStars = convertGradeToStars(overallScore);

        const ftiScore = convertGradeToStars(hospital.FTIH_Category_Rating).value;
        const hasrScore = convertGradeToStars(hospital.HASR_Category_Rating).value;

        // Type / beds / system info
        const typeLabel = hospital.Ownership_Type && hospital.Care_Level
            ? `${hospital.Ownership_Type} – ${hospital.Care_Level}`
            : (hospital.Ownership_Type || hospital.Care_Level || 'Type unknown');

        const bedLabel = hospital.Bed_Size ? `${hospital.Bed_Size} beds` : 'Bed size N/A';

        const systemLabel = hospital.In_System
            ? (hospital.System_Name ? `Part of ${hospital.System_Name}` : 'Part of a health system')
            : 'Independent';

        const popupHTML = `
            <div class="map-popup">
                <strong class="map-popup-title">
                    ${hospital.Hospital_Name || 'Unnamed Hospital'}
                </strong>
                <div class="map-popup-location">
                    ${(hospital.City || '')}, ${(hospital.State || '')}
                </div>

                <div class="map-popup-section">
                    <div class="map-popup-overall">
                        <span class="map-popup-label">Overall:</span>
                        <span class="map-popup-stars" aria-label="${overallStars.value} out of 5 stars">
                            ${renderStars(overallStars.value)}
                        </span>
                        ${Number.isFinite(overallScore)
                            ? `<span class="map-popup-score">${overallScore.toFixed(1)} / 5</span>`
                            : ''}
                    </div>

                    <div class="map-popup-submetrics">
                        <div class="map-popup-submetric">
                            <span class="map-popup-label">Transparency & Health:</span>
                            <span class="map-popup-stars">
                                ${renderStars(ftiScore)}
                            </span>
                        </div>
                        <div class="map-popup-submetric">
                            <span class="map-popup-label">Access & Responsibility:</span>
                            <span class="map-popup-stars">
                                ${renderStars(hasrScore)}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="map-popup-meta">
                    <span>${typeLabel}</span><br>
                    <span>${bedLabel}</span><br>
                    <span>${systemLabel}</span>
                </div>

                <a href="details.html?id=${hospital.Hospital_ID}" class="view-full-detail">
                    View Full Details
                </a>
            </div>
        `;

        const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML, {
            maxWidth: 320
        });
        mapMarkers.push(marker);
    });

    console.log('Added', mapMarkers.length, 'markers to map');

    if (mapMarkers.length > 0) {
        const group = L.featureGroup(mapMarkers);
        map.fitBounds(group.getBounds().pad(0.2));
        console.log('Map bounds adjusted to fit markers');
    }

    setTimeout(() => {
        map.invalidateSize();
        console.log('Map size invalidated');
    }, 100);
}

// ===============================
// Star Rating Utilities
// ===============================
// Now expects numeric 0–5 scores from the dataset
function convertGradeToStars(score) {
    let value = parseFloat(score);
    if (isNaN(value)) value = 0;
    // Clamp between 0 and 5
    value = Math.max(0, Math.min(5, value));
    return { value };
}

function renderStars(value) {
    let html = '';

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
    const popup = document.createElement('div');
    popup.className = 'error-popup';
    popup.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(popup);

    setTimeout(() => popup.classList.add('visible'), 10);
    setTimeout(() => {
        popup.classList.remove('visible');
        setTimeout(() => popup.remove(), 400);
    }, 4000);
}

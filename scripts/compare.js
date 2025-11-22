// ===============================
// Hospital Comparison Script
// ===============================
let hospitalData = [];
let selectedHospitals = {
    hospital1: null,
    hospital2: null
};

// Load hospital data
document.addEventListener('DOMContentLoaded', function() {
    loadHospitalData();
    initializeEventListeners();

    // Only call if it exists (prevents errors on compare.html)
    if (typeof initMobileNavigation === "function") {
        initMobileNavigation();
    }
});

function getHospitalShortName(h) {
    if (!h) return '';
    return h.Hospital_Name || h.Name || 'Hospital';
}

async function loadHospitalData() {
    try {
        const response = await fetch(DATA_URL);
        hospitalData = await response.json();
        console.log('Hospital data loaded for comparison:', hospitalData.length, 'hospitals');
        populateHospitalDropdowns();
    } catch (error) {
        console.error('Error loading hospital data for comparison:', error);
    }
}

function populateHospitalDropdowns() {
    const hospital1Select = document.getElementById('hospital1Select');
    const hospital2Select = document.getElementById('hospital2Select');

    if (!hospital1Select || !hospital2Select) {
        console.warn('[COMPARE] Dropdown elements not found');
        return;
    }

    // Clear existing options except the first one
    while (hospital1Select.options.length > 1) {
        hospital1Select.remove(1);
    }
    while (hospital2Select.options.length > 1) {
        hospital2Select.remove(1);
    }

    // Sort hospitals by name for easier selection
    const sortedHospitals = [...hospitalData].sort((a, b) => {
        const nameA = a.Hospital_Name || 'Unnamed Hospital';
        const nameB = b.Hospital_Name || 'Unnamed Hospital';
        return nameA.localeCompare(nameB);
    });

    // Populate dropdowns
    sortedHospitals.forEach(hospital => {
        const name = hospital.Hospital_Name || 'Unnamed Hospital';
        const location = `${hospital.City || ''}, ${hospital.State || ''}`;
        const optionText = `${name} - ${location}`;

        const option1 = new Option(optionText, hospital.Hospital_ID);
        const option2 = new Option(optionText, hospital.Hospital_ID);

        hospital1Select.add(option1);
        hospital2Select.add(option2);
    });
}

function initializeEventListeners() {
    const hospital1Select = document.getElementById('hospital1Select');
    const hospital2Select = document.getElementById('hospital2Select');
    const compareNowBtn = document.getElementById('compareNowBtn');
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    const backToSelectionBtn = document.getElementById('backToSelectionBtn');

    if (hospital1Select) {
        hospital1Select.addEventListener('change', (e) => {
            const hospitalId = e.target.value;
            if (hospitalId) {
                const hospital = hospitalData.find(h => String(h.Hospital_ID) === String(hospitalId));
                selectHospital(hospital, 'hospital1');
            } else {
                clearHospitalSelection('hospital1');
            }
        });
    }

    if (hospital2Select) {
        hospital2Select.addEventListener('change', (e) => {
            const hospitalId = e.target.value;
            if (hospitalId) {
                const hospital = hospitalData.find(h => String(h.Hospital_ID) === String(hospitalId));
                selectHospital(hospital, 'hospital2');
            } else {
                clearHospitalSelection('hospital2');
            }
        });
    }

    if (compareNowBtn) {
        compareNowBtn.addEventListener('click', compareHospitals);
    }

    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', clearSelection);
    }

    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', backToSelection);
    }

    // Category toggles (for already-rendered accordions, if any)
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', toggleCategory);
    });
}

function selectHospital(hospital, slot) {
    selectedHospitals[slot] = hospital;
    updateSelectedHospitalDisplay(hospital, slot);
    updateCompareButton();
}

function clearHospitalSelection(slot) {
    selectedHospitals[slot] = null;
    const container = document.getElementById(`selected${slot.charAt(0).toUpperCase() + slot.slice(1)}`);
    if (container) {
        container.innerHTML = '<p class="placeholder">No hospital selected</p>';
        container.classList.remove('hospital-selected');
    }
    updateCompareButton();
}

function sizeLabelFromGroup(group) {
    const map = {
        "XS": "Extra Small",
        "S":  "Small",
        "M":  "Medium",
        "L":  "Large",
        "XL": "Extra Large",
        "XXL":"Very Large"
    };
    const key = String(group || "").toUpperCase().trim();
    return map[key] || "N/A";
}

function updateSelectedHospitalDisplay(hospital, slot) {
    const container = document.getElementById(`selected${slot.charAt(0).toUpperCase() + slot.slice(1)}`);
    if (!container || !hospital) return;

    const name = hospital.Hospital_Name || 'Unnamed Hospital';
    const location = `${hospital.City || ''}, ${hospital.State || ''}`;
    const overallScore = parseFloat(hospital.Overall_Star_Rating);
    const overallStars = convertGradeToStars(overallScore);

    container.innerHTML = `
        <div class="hospital-preview">
            <h4>${name}</h4>
            <div class="location">${location}</div>
            <div class="grade">
                Overall Score:
                <div class="star-rating">${renderStars(overallStars.value)}</div>
                <span class="numeric-score">(${isNaN(overallScore) ? 'N/A' : overallScore.toFixed(1)} / 5)</span>
            </div>
            <div class="meta">
                <div>${sizeLabelFromGroup(hospital.Size_Group)} hospital</div>
                <div>${hospital.Ownership_Type || 'Ownership: N/A'}</div>
            </div>
        </div>
    `;
    container.classList.add('hospital-selected');
}

function updateCompareButton() {
    const compareBtn = document.getElementById('compareNowBtn');
    const hasBothHospitals = selectedHospitals.hospital1 && selectedHospitals.hospital2;
    if (compareBtn) compareBtn.disabled = !hasBothHospitals;
}

function clearSelection() {
    selectedHospitals.hospital1 = null;
    selectedHospitals.hospital2 = null;

    const selected1 = document.getElementById('selectedHospital1');
    const selected2 = document.getElementById('selectedHospital2');
    if (selected1) {
        selected1.innerHTML = '<p class="placeholder">No hospital selected</p>';
        selected1.classList.remove('hospital-selected');
    }
    if (selected2) {
        selected2.innerHTML = '<p class="placeholder">No hospital selected</p>';
        selected2.classList.remove('hospital-selected');
    }

    const hospital1Select = document.getElementById('hospital1Select');
    const hospital2Select = document.getElementById('hospital2Select');
    if (hospital1Select) hospital1Select.value = '';
    if (hospital2Select) hospital2Select.value = '';

    updateCompareButton();
    backToSelection();
}

function compareHospitals() {
    if (!selectedHospitals.hospital1 || !selectedHospitals.hospital2) return;

    const selectionSection = document.querySelector('.selection-section');
    const comparisonResults = document.getElementById('comparisonResults');

    if (selectionSection) selectionSection.style.display = 'none';
    if (comparisonResults) comparisonResults.style.display = 'block';

    populateComparison();
}

function backToSelection() {
    const selectionSection = document.querySelector('.selection-section');
    const comparisonResults = document.getElementById('comparisonResults');

    if (selectionSection) selectionSection.style.display = 'block';
    if (comparisonResults) comparisonResults.style.display = 'none';
}

function toggleCategory(event) {
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    header.classList.toggle('active');
    if (content) content.classList.toggle('active');
}

function populateComparison() {
    const comparisonGrid = document.getElementById('comparisonGrid');
    if (!comparisonGrid) return;
    comparisonGrid.innerHTML = '';
	
	// Add top "Hospital Information" cards
	const infoRow = createHospitalInfoRow();
	comparisonGrid.appendChild(infoRow);


    // Define comparison categories and metrics using the new schema
    const categories = [
        {
            name: 'Overall Performance',
            metrics: [
                { key: 'Overall_Star_Rating', label: 'Overall Score (0–5)', type: 'stars' },
                { key: 'Size_Group', label: 'Hospital Size', format: (v) => sizeLabelFromGroup(v) },
                { key: 'Ownership_Type', label: 'Ownership' },
                { key: 'Urban_Rural', label: 'Setting' }
            ]
        },
        {
            name: 'Financial Transparency & Institutional Health',
            metrics: [
                { key: 'Balance_Growth',   label: 'Balance Growth (0–5)', type: 'stars' },
                { key: 'Transparency',     label: 'Transparency (0–5)', type: 'stars' },
                { key: 'Fiscal_Health',    label: 'Fiscal Health (0–5)', type: 'stars' },
                { key: 'Staffing',         label: 'Staffing (0–5)', type: 'stars' },
                { key: 'FTIH_Category_Rating', label: 'Category Score (0–5)', type: 'stars' }
            ]
        },
        {
            name: 'Community Benefit Spending',
            metrics: [
                { key: 'Tax_Benefit',      label: 'Tax Benefit (0–5)', type: 'stars' },
                { key: 'Quality_of_CBS',   label: 'Quality of CBS (0–5)', type: 'stars' },
                { key: 'Strategic_Use',    label: 'Strategic Use (0–5)', type: 'stars' },
                { key: 'CBS_Category_Rating', label: 'Category Score (0–5)', type: 'stars' }
            ]
        },
        {
            name: 'Healthcare Affordability & Billing',
            metrics: [
                { key: 'Financial_Burden',  label: 'Financial Burden (0–5)', type: 'stars' },
                { key: 'Charity_Care',      label: 'Charity Care (0–5)', type: 'stars' },
                { key: 'Medical_Debt',      label: 'Medical Debt (0–5)', type: 'stars' },
                { key: 'HAB_Category_Rating', label: 'Category Score (0–5)', type: 'stars' }
            ]
        },
        {
            name: 'Healthcare Access & Social Responsibility',
            metrics: [
                { key: 'Range_of_Services',     label: 'Range of Services (0–5)', type: 'stars' },
                { key: 'Demographic_Alignment', label: 'Demographic Alignment (0–5)', type: 'stars' },
                { key: 'Workforce_Training',    label: 'Workforce Training (0–5)', type: 'stars' },
                { key: 'Pay_Equity_Ratio',      label: 'Pay Equity Ratio (0–5)', type: 'stars' },
                { key: 'HASR_Category_Rating',  label: 'Category Score (0–5)', type: 'stars' }
            ]
        }
    ];

    categories.forEach(category => {
        const categoryElement = createCategoryElement(category);
        comparisonGrid.appendChild(categoryElement);
    });
}

function createCategoryElement(category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'comparison-category';

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
        <h3>${category.name}</h3>
        <span class="category-toggle">▼</span>
    `;

    const content = document.createElement('div');
    content.className = 'category-content active'; // Start expanded

    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'metrics-grid';

    category.metrics.forEach(metric => {
        const metricRow = createMetricRow(metric);
        metricsGrid.appendChild(metricRow);
    });

    content.appendChild(metricsGrid);
    categoryDiv.appendChild(header);
    categoryDiv.appendChild(content);

    header.addEventListener('click', toggleCategory);

    return categoryDiv;
}

function createMetricRow(metric) {
    const metricRow = document.createElement('div');
    metricRow.className = 'metric-row';

    const hospital1Value = getFormattedValue(selectedHospitals.hospital1, metric);
    const hospital2Value = getFormattedValue(selectedHospitals.hospital2, metric);

    const hospital1Name = getHospitalShortName(selectedHospitals.hospital1);
    const hospital2Name = getHospitalShortName(selectedHospitals.hospital2);

    const isStarMetric = metric.type === 'stars';

    metricRow.innerHTML = `
        <div class="metric-name">${metric.label}</div>
        <div class="metric-divider">vs</div>
        <div class="metric-values">
            <div class="metric-value hospital-1-value">
                <div class="metric-hospital-label">${hospital1Name}</div>
                <div class="metric-value-content">
                    ${
                        isStarMetric
                            ? `<div class="star-comparison">
                                   ${renderStars(
                                       convertGradeToStars(
                                           selectedHospitals.hospital1?.[metric.key] ?? 0
                                       ).value
                                   )}
                               </div>`
                            : `<span class="metric-value-text">${hospital1Value}</span>`
                    }
                </div>
            </div>
            <div class="metric-value hospital-2-value">
                <div class="metric-hospital-label">${hospital2Name}</div>
                <div class="metric-value-content">
                    ${
                        isStarMetric
                            ? `<div class="star-comparison">
                                   ${renderStars(
                                       convertGradeToStars(
                                           selectedHospitals.hospital2?.[metric.key] ?? 0
                                       ).value
                                   )}
                               </div>`
                            : `<span class="metric-value-text">${hospital2Value}</span>`
                    }
                </div>
            </div>
        </div>
    `;

    return metricRow;
}

function getFormattedValue(hospital, metric) {
    if (!hospital) return 'N/A';

    const value = hospital[metric.key];

    if (metric.format) {
        return metric.format(value);
    }

    if (value === null || value === undefined || value === 'NULL') {
        return 'N/A';
    }

    return value;
}

function createHospitalInfoRow() {
    const row = document.createElement('div');
    row.className = 'hospital-info-row';

    ['hospital1', 'hospital2'].forEach(slot => {
        const h = selectedHospitals[slot];
        const col = document.createElement('div');
        col.className = `hospital-info-card ${slot}`;

        if (!h) {
            col.innerHTML = '<p class="placeholder">No hospital selected</p>';
        } else {
            const name = getHospitalShortName(h);

            // match GA JSON fields
            const beds = h.Bed_Size ?? 'N/A';
            const setting = h.Urban_Rural || 'N/A';

            // In_System is 0/1 in GA file
            const inSystem = (h.In_System === 1 || h.In_System === '1') ? 'Yes' : 'No';

            const systemName = h.System_Name || 'Independent';
            const county = h.County || 'N/A';

            col.innerHTML = `
                <div class="hospital-info-header">
                    <h3>${name}</h3>
                </div>
                <div class="hospital-info-body">
                    <h4>Hospital Information</h4>
                    <ul class="hospital-info-list">
                        <li><span class="bullet-dot"></span>Beds: ${beds}</li>
                        <li><span class="bullet-dot"></span>${setting}</li>
                        <li><span class="bullet-dot"></span>In System: ${inSystem}</li>
                        <li><span class="bullet-dot"></span>System: ${systemName}</li>
                        <li><span class="bullet-dot"></span>County: ${county}</li>
                    </ul>
                </div>
            `;
        }

        row.appendChild(col);
    });

    return row;
}



// ===============================
// Star Rating Utilities (numeric 0–5)
// ===============================
function convertGradeToStars(score) {
    let value = parseFloat(score);
    if (isNaN(value)) value = 0;
    value = Math.max(0, Math.min(5, value)); // clamp 0–5
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

function normalizeYesNo(value) {
    if (value === null || value === undefined || value === '' || value === 'NULL') return 'N/A';
    const v = String(value).trim().toLowerCase();
    if (['y', 'yes', 'true', '1'].includes(v)) return 'Yes';
    if (['n', 'no', 'false', '0'].includes(v)) return 'No';
    return value;
}


// ===============================
// Shared Constants & Data Paths
// ===============================

// Centralized JSON data location used across all pages
// (index, compare, and details should all load this)
const DATA_URL = "./data/current/GeorgiaWatch_HospitalScores.json";


// ===============================
// GA ZIP → Coordinate Lookup
// ===============================

// Stores ZIP code coordinates loaded from /data/util/ga_zip_coords.json
let zipCoords = {};

// Load ZIP coordinate lookup once — all pages benefit
fetch("./data/util/ga_zip_coords.json")
    .then(res => res.json())
    .then(data => {
        zipCoords = data;
        console.log("GA ZIP lookup loaded:", Object.keys(zipCoords).length, "ZIPs");
    })
    .catch(err => console.error("Error loading ZIP lookup:", err));

/**
 * Returns [lat, lon] for a given ZIP code.
 * If ZIP not found, returns null.
 */
function getZipCoords(zip) {
    if (!zipCoords || !zipCoords[zip]) {
        console.warn("No coordinates found for ZIP:", zip);
        return null;
    }
    const { lat, lon } = zipCoords[zip];
    return [lat, lon];
}


// ===============================
// Distance Utility
// ===============================

/**
 * Returns distance in miles between two coordinate pairs.
 * Uses basic spherical approximation (plenty accurate for GA-level search).
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}


// ===============================
// Mobile Navigation
// ===============================

/**
 * Toggles mobile navigation by adding/removing the "nav-open" class on <body>.
 */
function toggleMobileNavigation() {
    const body = document.body;
    const overlay = document.querySelector('.mobile-nav-overlay');
    const panel   = document.querySelector('.mobile-nav-panel');

    // toggle scroll-lock class
    const isOpen = body.classList.toggle('mobile-nav-open');

    if (overlay) {
        overlay.style.display = isOpen ? 'block' : 'none';
    }
    if (panel) {
        panel.classList.toggle('active', isOpen);
    }
}

/**
 * Initializes the mobile navigation listeners.
 * Works safely even if elements do not exist on a page.
 */
function initMobileNavigation() {
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mobileNavClose  = document.querySelector('.mobile-nav-close');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');

    // No mobile nav on this page — just skip
    if (!mobileNavOverlay) return;

    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', toggleMobileNavigation);
    }
    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', toggleMobileNavigation);
    }

    // Clicking the overlay background closes the drawer
    mobileNavOverlay.addEventListener('click', function (e) {
        if (e.target === this) toggleMobileNavigation();
    });
}

// Ensure mobile navigation works regardless of JSON loading
document.addEventListener('DOMContentLoaded', () => {
    initMobileNavigation();
});

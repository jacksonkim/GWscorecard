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

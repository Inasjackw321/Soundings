/**
 * Save and Export Module
 * Handles saving sounding data in various formats
 */

class SaveExport {
    constructor() {
        this.currentData = null;
        this.currentStation = null;
        this.currentDate = null;
    }

    /**
     * Set current data to save
     */
    setData(soundingData, station, date) {
        this.currentData = soundingData;
        this.currentStation = station;
        this.currentDate = date;
    }

    /**
     * Save as JSON
     */
    saveAsJSON() {
        if (!this.currentData) {
            alert('No data to save');
            return;
        }

        const exportData = {
            station: this.currentStation,
            date: this.currentDate,
            timestamp: new Date().toISOString(),
            data: this.currentData
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        this.downloadBlob(blob, this.generateFilename('json'));
    }

    /**
     * Save as CSV
     */
    saveAsCSV() {
        if (!this.currentData) {
            alert('No data to save');
            return;
        }

        // Create CSV header
        let csv = 'Pressure (mb),Height (m),Temperature (C),Dewpoint (C),Wind Direction (deg),Wind Speed (kt)\n';

        // Add data rows
        for (let i = 0; i < this.currentData.pressure.length; i++) {
            csv += `${this.currentData.pressure[i]},`;
            csv += `${this.currentData.height[i]},`;
            csv += `${this.currentData.temperature[i]},`;
            csv += `${this.currentData.dewpoint[i]},`;
            csv += `${this.currentData.windDirection[i] || ''},`;
            csv += `${this.currentData.windSpeed[i] || ''}\n`;
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadBlob(blob, this.generateFilename('csv'));
    }

    /**
     * Save diagram as PNG
     */
    saveAsPNG() {
        const canvas = document.getElementById('skewt-canvas');

        if (!canvas) {
            alert('No diagram to save');
            return;
        }

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            this.downloadBlob(blob, this.generateFilename('png'));
        });
    }

    /**
     * Save as PDF report
     */
    async saveAsPDF() {
        if (!this.currentData || typeof jspdf === 'undefined') {
            alert('PDF generation not available');
            return;
        }

        const { jsPDF } = jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4');

        let y = 20;

        // ===== PAGE 1: HEADER AND SEVERE WEATHER ANALYSIS =====

        // Title
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Atmospheric Sounding Analysis', 105, y, { align: 'center' });
        y += 12;

        // Station info box
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const stationInfo = [
            `Station: ${this.currentStation?.name || 'Unknown'} (${this.currentStation?.icao || 'N/A'})`,
            `Location: ${this.currentStation?.lat?.toFixed(2) || 'N/A'}°N, ${this.currentStation?.lon?.toFixed(2) || 'N/A'}°W`,
            `Valid Time: ${this.currentDate || 'N/A'}`,
            `Report Generated: ${new Date().toLocaleString()}`
        ];

        doc.setDrawColor(100, 100, 100);
        doc.setFillColor(245, 245, 245);
        doc.rect(15, y - 5, 180, 22, 'FD');
        doc.setFontSize(10);
        stationInfo.forEach((info, i) => {
            doc.text(info, 20, y + (i * 5));
        });
        y += 25;

        // ===== SEVERE WEATHER ANALYSIS SECTION =====
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Severe Weather Analysis', 20, y);
        y += 8;

        if (this.currentData.parameters) {
            const params = this.currentData.parameters;

            // Define parameter groups
            const paramGroups = [
                {
                    title: 'Composite Indices',
                    params: [
                        { key: 'stp', label: 'Significant Tornado Parameter (STP)', unit: '', critical: 1, elevated: 0.5 },
                        { key: 'scp', label: 'Supercell Composite Parameter (SCP)', unit: '', critical: 4, elevated: 1 },
                        { key: 'ehi', label: 'Energy Helicity Index (EHI)', unit: '', critical: 2, elevated: 1 }
                    ]
                },
                {
                    title: 'Thermodynamic Parameters',
                    params: [
                        { key: 'cape', label: 'CAPE', unit: ' J/kg', critical: 2000, elevated: 1000 },
                        { key: 'cin', label: 'CIN', unit: ' J/kg', critical: -50, elevated: -200, inverse: true },
                        { key: 'lclHeight', label: 'LCL Height', unit: ' m AGL', critical: 1000, elevated: 1500, inverse: true },
                        { key: 'li', label: 'Lifted Index', unit: '', critical: -6, elevated: -3, inverse: true },
                        { key: 'pwat', label: 'Precipitable Water', unit: ' mm', critical: 40, elevated: 30 }
                    ]
                },
                {
                    title: 'Wind Shear & Helicity',
                    params: [
                        { key: 'srh01km', label: 'Storm Relative Helicity (0-1km)', unit: ' m²/s²', critical: 150, elevated: 100 },
                        { key: 'srh03km', label: 'Storm Relative Helicity (0-3km)', unit: ' m²/s²', critical: 250, elevated: 150 },
                        { key: 'shear01km', label: 'Bulk Shear (0-1km)', unit: ' kt', critical: 20, elevated: 15 },
                        { key: 'shear06km', label: 'Bulk Shear (0-6km)', unit: ' kt', critical: 40, elevated: 30 }
                    ]
                }
            ];

            doc.setFontSize(10);

            paramGroups.forEach((group, groupIdx) => {
                // Check if we need a new page
                if (y > 240) {
                    doc.addPage();
                    y = 20;
                }

                // Group title
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text(group.title, 20, y);
                y += 6;

                // Table header
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('Parameter', 22, y);
                doc.text('Value', 120, y);
                doc.text('Assessment', 155, y);
                y += 1;

                // Header line
                doc.setDrawColor(150, 150, 150);
                doc.line(20, y, 190, y);
                y += 5;

                // Parameters
                doc.setFont('helvetica', 'normal');
                group.params.forEach((param, idx) => {
                    const value = params[param.key];
                    if (value !== undefined && value !== null) {
                        // Parameter name
                        doc.text(param.label, 22, y);

                        // Value
                        const valueStr = typeof value === 'number' ? value.toFixed(1) + param.unit : value;
                        doc.text(valueStr, 120, y);

                        // Assessment with color coding
                        let assessment = 'Weak';
                        let color = [100, 100, 100]; // Gray

                        if (typeof value === 'number') {
                            if (param.inverse) {
                                // For inverse parameters (lower is worse)
                                if (value <= param.critical) {
                                    assessment = 'CRITICAL';
                                    color = [239, 68, 68]; // Red
                                } else if (value <= param.elevated) {
                                    assessment = 'Elevated';
                                    color = [245, 158, 11]; // Orange
                                } else {
                                    assessment = 'Weak';
                                    color = [34, 197, 94]; // Green
                                }
                            } else {
                                // For normal parameters (higher is worse)
                                if (value >= param.critical) {
                                    assessment = 'CRITICAL';
                                    color = [239, 68, 68]; // Red
                                } else if (value >= param.elevated) {
                                    assessment = 'Elevated';
                                    color = [245, 158, 11]; // Orange
                                } else {
                                    assessment = 'Weak';
                                    color = [34, 197, 94]; // Green
                                }
                            }
                        }

                        doc.setTextColor(color[0], color[1], color[2]);
                        doc.setFont('helvetica', 'bold');
                        doc.text(assessment, 155, y);
                        doc.setTextColor(0, 0, 0);
                        doc.setFont('helvetica', 'normal');

                        y += 5;
                    }
                });

                y += 5; // Space between groups
            });

            // Additional atmospheric indices
            if (y > 230) {
                doc.addPage();
                y = 20;
            }

            y += 5;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Additional Atmospheric Indices', 20, y);
            y += 6;

            const additionalParams = [
                { key: 'kIndex', label: 'K-Index', unit: '' },
                { key: 'totalTotals', label: 'Total Totals Index', unit: '' },
                { key: 'lfc', label: 'Level of Free Convection', unit: ' mb' },
                { key: 'el', label: 'Equilibrium Level', unit: ' mb' }
            ];

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            additionalParams.forEach(param => {
                const value = params[param.key];
                if (value !== undefined && value !== null) {
                    const valueStr = typeof value === 'number' ? value.toFixed(1) + param.unit : value;
                    doc.text(`${param.label}: ${valueStr}`, 22, y);
                    y += 5;
                }
            });
        }

        // ===== PAGE 2: SKEW-T DIAGRAM =====
        doc.addPage();
        y = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Skew-T Log-P Diagram', 105, y, { align: 'center' });
        y += 10;

        const skewtCanvas = document.getElementById('skewt-canvas');
        if (skewtCanvas) {
            const imgData = skewtCanvas.toDataURL('image/png');
            const imgWidth = 180;
            const imgHeight = (skewtCanvas.height * imgWidth) / skewtCanvas.width;

            // Center the image
            const xPos = (210 - imgWidth) / 2;
            doc.addImage(imgData, 'PNG', xPos, y, imgWidth, imgHeight);
        }

        // ===== PAGE 3: RADAR AND HODOGRAPH =====
        doc.addPage();
        y = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Radar & Wind Profile Analysis', 105, y, { align: 'center' });
        y += 10;

        // Radar Map
        const radarMap = document.getElementById('radar-map');
        if (radarMap) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Current Radar', 20, y);
            y += 6;

            // Capture radar map
            try {
                // Get the Leaflet map container
                const mapContainer = radarMap.querySelector('.leaflet-container');
                if (mapContainer) {
                    // Use html2canvas-like approach or direct canvas capture
                    const canvas = document.createElement('canvas');
                    canvas.width = mapContainer.offsetWidth;
                    canvas.height = mapContainer.offsetHeight;
                    const ctx = canvas.getContext('2d');

                    // Draw background
                    ctx.fillStyle = '#1a1d29';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Get all tile images
                    const tiles = mapContainer.querySelectorAll('.leaflet-tile');
                    tiles.forEach(tile => {
                        if (tile.complete && tile.naturalHeight !== 0) {
                            const transform = tile.style.transform;
                            const match = transform.match(/translate3d\((.+?)px, (.+?)px/);
                            if (match) {
                                ctx.drawImage(tile, parseFloat(match[1]), parseFloat(match[2]));
                            }
                        }
                    });

                    const radarImg = canvas.toDataURL('image/png');
                    const imgWidth = 170;
                    const imgHeight = 100;
                    const xPos = (210 - imgWidth) / 2;
                    doc.addImage(radarImg, 'PNG', xPos, y, imgWidth, imgHeight);
                    y += imgHeight + 10;
                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(10);
                    doc.text('Radar imagery not available in PDF export', 105, y + 20, { align: 'center' });
                    y += 35;
                }
            } catch (error) {
                console.error('Error capturing radar:', error);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(10);
                doc.text('Radar imagery capture failed', 105, y + 20, { align: 'center' });
                y += 35;
            }
        }

        // Hodograph
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Hodograph', 20, y);
        y += 6;

        const hodographCanvas = document.getElementById('hodograph-canvas');
        if (hodographCanvas) {
            const imgData = hodographCanvas.toDataURL('image/png');
            const imgSize = 110;

            // Center the image
            const xPos = (210 - imgSize) / 2;
            doc.addImage(imgData, 'PNG', xPos, y, imgSize, imgSize);
            y += imgSize + 6;

            // Add hodograph legend
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Height Color Legend:', 105, y, { align: 'center' });
            y += 5;

            const legendItems = [
                { color: [239, 68, 68], label: '0-1 km AGL' },
                { color: [249, 115, 22], label: '1-3 km AGL' },
                { color: [234, 179, 8], label: '3-6 km AGL' },
                { color: [34, 197, 94], label: '6+ km AGL' }
            ];

            const legendX = 75;
            legendItems.forEach((item, i) => {
                doc.setFillColor(item.color[0], item.color[1], item.color[2]);
                doc.rect(legendX, y - 3, 4, 3, 'F');
                doc.setFontSize(8);
                doc.text(item.label, legendX + 6, y);
                y += 4;
            });
        }

        // ===== PAGE 4: ENVIRONMENTAL SUMMARY =====
        doc.addPage();
        y = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Environmental Summary', 105, y, { align: 'center' });
        y += 10;

        // NWS Alerts
        const alertsContainer = document.getElementById('nws-alerts-compact');
        if (alertsContainer && alertsContainer.textContent.trim() !== '') {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Active Weather Alerts', 20, y);
            y += 6;

            const alerts = alertsContainer.querySelectorAll('.alert-item-compact');
            if (alerts.length > 0) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                alerts.forEach((alert, idx) => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    const alertText = alert.textContent.trim();
                    // Color code based on severity
                    if (alertText.toLowerCase().includes('warning')) {
                        doc.setTextColor(239, 68, 68); // Red
                        doc.setFont('helvetica', 'bold');
                    } else if (alertText.toLowerCase().includes('watch')) {
                        doc.setTextColor(245, 158, 11); // Orange
                        doc.setFont('helvetica', 'bold');
                    } else {
                        doc.setTextColor(234, 179, 8); // Yellow
                    }
                    doc.text(`• ${alertText}`, 22, y);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'normal');
                    y += 5;
                });
                y += 5;
            } else {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.text('No active alerts for this location', 22, y);
                y += 10;
            }
        }

        // Forecast Summary
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Forecast Summary', 20, y);
        y += 6;

        const forecastContainer = document.getElementById('nws-forecast');
        if (forecastContainer && forecastContainer.textContent.trim() !== '') {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const forecastText = forecastContainer.textContent.trim();
            const lines = doc.splitTextToSize(forecastText, 170);
            lines.forEach(line => {
                if (y > 275) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 22, y);
                y += 5;
            });
            y += 5;
        } else {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text('Forecast data not available', 22, y);
            y += 10;
        }

        // Severe Weather Potential Summary
        if (this.currentData.parameters) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Severe Weather Potential Summary', 20, y);
            y += 6;

            const params = this.currentData.parameters;
            const threats = [];

            // Tornado threat
            if (params.stp >= 1) {
                threats.push({ level: 'HIGH', type: 'Tornado', reason: `STP = ${params.stp.toFixed(1)}` });
            } else if (params.stp >= 0.5) {
                threats.push({ level: 'MODERATE', type: 'Tornado', reason: `STP = ${params.stp.toFixed(1)}` });
            }

            // Supercell threat
            if (params.scp >= 4) {
                threats.push({ level: 'HIGH', type: 'Supercells', reason: `SCP = ${params.scp.toFixed(1)}` });
            } else if (params.scp >= 1) {
                threats.push({ level: 'MODERATE', type: 'Supercells', reason: `SCP = ${params.scp.toFixed(1)}` });
            }

            // Hail threat
            if (params.cape >= 2000 && params.shear06km >= 40) {
                threats.push({ level: 'HIGH', type: 'Large Hail', reason: `High CAPE + Strong Shear` });
            } else if (params.cape >= 1000 && params.shear06km >= 30) {
                threats.push({ level: 'MODERATE', type: 'Hail', reason: `Moderate CAPE + Shear` });
            }

            // Wind threat
            if (params.cape >= 1500 && params.shear06km >= 35) {
                threats.push({ level: 'MODERATE', type: 'Damaging Winds', reason: `CAPE + Shear favorable` });
            }

            // Flooding threat
            if (params.pwat >= 40) {
                threats.push({ level: 'MODERATE', type: 'Heavy Rain/Flooding', reason: `High PWAT = ${params.pwat.toFixed(1)} mm` });
            }

            if (threats.length > 0) {
                doc.setFontSize(9);
                threats.forEach(threat => {
                    if (y > 275) {
                        doc.addPage();
                        y = 20;
                    }

                    if (threat.level === 'HIGH') {
                        doc.setTextColor(239, 68, 68);
                    } else {
                        doc.setTextColor(245, 158, 11);
                    }
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${threat.level}: ${threat.type}`, 22, y);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'normal');
                    doc.text(` - ${threat.reason}`, 70, y);
                    y += 5;
                });
            } else {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.text('Low severe weather potential', 22, y);
            }
            y += 10;
        }

        // Analysis Notes
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Analysis Notes', 20, y);
        y += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const notes = [
            `Data Source: ${document.getElementById('data-source-select')?.selectedOptions[0]?.text || 'NWS'}`,
            `Valid Time: ${this.currentDate || 'N/A'}`,
            `Station Elevation: ${this.currentStation?.elevation || 'N/A'} m`,
            `Analysis generated: ${new Date().toLocaleString()}`
        ];

        notes.forEach(note => {
            doc.text(note, 22, y);
            y += 5;
        });

        // ===== PAGE 5: DATA TABLE =====
        doc.addPage();
        y = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Atmospheric Sounding Data', 105, y, { align: 'center' });
        y += 10;

        // Table header
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const headers = ['Press', 'Hgt', 'Temp', 'Dwpt', 'WDir', 'WSpd'];
        const units = ['(mb)', '(m)', '(°C)', '(°C)', '(°)', '(kt)'];
        const colWidths = [25, 30, 25, 25, 25, 25];
        const startX = 25;

        let x = startX;
        headers.forEach((header, i) => {
            doc.text(header, x, y);
            doc.text(units[i], x, y + 4);
            x += colWidths[i];
        });
        y += 6;

        doc.setDrawColor(150, 150, 150);
        doc.line(startX, y, 180, y);
        y += 5;

        // Table data (sample every 3rd point to fit on page)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        const maxRows = 35; // Fit on page
        const step = Math.ceil(this.currentData.pressure.length / maxRows);

        for (let i = 0; i < this.currentData.pressure.length; i += step) {
            if (y > 280) break; // Don't overflow page

            x = startX;
            const values = [
                this.currentData.pressure[i]?.toFixed(1) || '-',
                this.currentData.height[i]?.toFixed(0) || '-',
                this.currentData.temperature[i]?.toFixed(1) || '-',
                this.currentData.dewpoint[i]?.toFixed(1) || '-',
                this.currentData.windDirection[i]?.toFixed(0) || '-',
                this.currentData.windSpeed[i]?.toFixed(0) || '-'
            ];

            values.forEach((value, j) => {
                doc.text(value, x, y);
                x += colWidths[j];
            });

            y += 4;
        }

        // Footer on last page
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Generated by Weather Soundings Analysis Tool - ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

        // Save PDF
        doc.save(this.generateFilename('pdf'));
    }

    /**
     * Generate filename
     */
    generateFilename(extension) {
        const station = this.currentStation?.icao || 'UNKNOWN';
        const date = this.currentDate?.replace(/[-:]/g, '') || 'NODATE';
        const timestamp = new Date().getTime();

        return `sounding_${station}_${date}_${timestamp}.${extension}`;
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Export diagram as image (for quick export button)
     */
    quickExportImage() {
        this.saveAsPNG();
    }
}

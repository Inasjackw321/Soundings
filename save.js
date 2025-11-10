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

        // ===== PAGE 3: HODOGRAPH =====
        doc.addPage();
        y = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Hodograph', 105, y, { align: 'center' });
        y += 10;

        const hodographCanvas = document.getElementById('hodograph-canvas');
        if (hodographCanvas) {
            const imgData = hodographCanvas.toDataURL('image/png');
            const imgSize = 140; // Square

            // Center the image
            const xPos = (210 - imgSize) / 2;
            doc.addImage(imgData, 'PNG', xPos, y, imgSize, imgSize);
            y += imgSize + 10;

            // Add hodograph legend
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Height Color Legend:', 105, y, { align: 'center' });
            y += 6;

            const legendItems = [
                { color: [239, 68, 68], label: '0-1 km AGL' },
                { color: [249, 115, 22], label: '1-3 km AGL' },
                { color: [234, 179, 8], label: '3-6 km AGL' },
                { color: [34, 197, 94], label: '6+ km AGL' }
            ];

            const legendX = 70;
            legendItems.forEach((item, i) => {
                doc.setFillColor(item.color[0], item.color[1], item.color[2]);
                doc.rect(legendX, y - 3, 5, 4, 'F');
                doc.text(item.label, legendX + 8, y);
                y += 6;
            });
        }

        // ===== PAGE 4: DATA TABLE =====
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

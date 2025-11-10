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
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text('Atmospheric Sounding Report', 20, 20);

        // Station info
        doc.setFontSize(12);
        let y = 35;
        doc.text(`Station: ${this.currentStation?.name || 'Unknown'}`, 20, y);
        y += 7;
        doc.text(`ICAO: ${this.currentStation?.icao || 'N/A'}`, 20, y);
        y += 7;
        doc.text(`Date: ${this.currentDate || 'N/A'}`, 20, y);
        y += 7;
        doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, y);
        y += 15;

        // Parameters
        if (this.currentData.parameters) {
            doc.setFontSize(14);
            doc.text('Atmospheric Parameters', 20, y);
            y += 10;

            doc.setFontSize(10);
            const params = this.currentData.parameters;
            for (const [key, value] of Object.entries(params)) {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                doc.text(`${label}: ${value}`, 25, y);
                y += 6;
            }
        }

        y += 10;

        // Add canvas image
        const canvas = document.getElementById('skewt-canvas');
        if (canvas) {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 170;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (y + imgHeight > 270) {
                doc.addPage();
                y = 20;
            }

            doc.text('Skew-T Log-P Diagram', 20, y);
            y += 10;
            doc.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight);
        }

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

/**
 * Main Application Controller
 * Handles user interactions and coordinates data fetching and visualization
 */

class SoundingApp {
    constructor() {
        this.diagram = null;
        this.dataFetcher = null;
        this.currentData = null;

        this.initializeComponents();
        this.attachEventListeners();
        this.setDefaultDate();
        this.loadSampleData();
    }

    /**
     * Initialize diagram and data fetcher
     */
    initializeComponents() {
        this.diagram = new SkewTDiagram('skewt-canvas');
        this.dataFetcher = new SoundingDataFetcher();
    }

    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        const fetchBtn = document.getElementById('fetch-btn');
        fetchBtn.addEventListener('click', () => this.fetchSounding());

        // Allow Enter key to fetch
        document.getElementById('date-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.fetchSounding();
        });
    }

    /**
     * Set default date to yesterday (soundings often delayed)
     */
    setDefaultDate() {
        const dateInput = document.getElementById('date-input');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');

        dateInput.value = `${year}-${month}-${day}`;
    }

    /**
     * Load sample data on startup
     */
    loadSampleData() {
        this.showStatus('Loading sample data...', 'loading');

        setTimeout(() => {
            this.currentData = this.dataFetcher.generateSampleData();
            this.diagram.render(this.currentData);
            this.displayParameters(this.currentData.parameters);
            this.showStatus('Sample data loaded. Select a station and date to fetch real data.', 'success');
        }, 500);
    }

    /**
     * Fetch sounding data based on user inputs
     */
    async fetchSounding() {
        const stationId = document.getElementById('station-select').value;
        const dateInput = document.getElementById('date-input').value;
        const hour = document.getElementById('hour-select').value;

        if (!dateInput) {
            this.showStatus('Please select a date', 'error');
            return;
        }

        // Parse date
        const [year, month, day] = dateInput.split('-');

        // Disable button during fetch
        const fetchBtn = document.getElementById('fetch-btn');
        fetchBtn.disabled = true;
        this.showStatus('Fetching sounding data...', 'loading');

        try {
            // Attempt to fetch real data
            const data = await this.dataFetcher.fetchSounding(
                stationId,
                year,
                month,
                day + hour
            );

            if (data.pressure.length === 0) {
                throw new Error('No data available for this date/station');
            }

            this.currentData = data;
            this.diagram.render(data);
            this.displayParameters(data.parameters);

            const stationName = document.getElementById('station-select').selectedOptions[0].text;
            this.showStatus(`Loaded: ${stationName} - ${dateInput} ${hour}:00 UTC`, 'success');

        } catch (error) {
            console.error('Fetch error:', error);

            // Fall back to sample data with error message
            this.showStatus(
                'Unable to fetch real data (CORS/API issue). Using sample data. ' +
                'For real data, deploy with a backend proxy.',
                'error'
            );

            this.currentData = this.dataFetcher.generateSampleData();
            this.diagram.render(this.currentData);
            this.displayParameters(this.currentData.parameters);

        } finally {
            fetchBtn.disabled = false;
        }
    }

    /**
     * Display atmospheric parameters
     */
    displayParameters(parameters) {
        const container = document.getElementById('parameters-display');
        container.innerHTML = '';

        if (!parameters) return;

        const parameterLabels = {
            surfacePressure: 'Surface Pressure',
            surfaceTemp: 'Surface Temperature',
            surfaceDewpoint: 'Surface Dewpoint',
            temp500mb: '500mb Temperature',
            lclHeight: 'LCL Height',
            maxWindSpeed: 'Max Wind Speed'
        };

        for (const [key, label] of Object.entries(parameterLabels)) {
            if (parameters[key]) {
                const item = document.createElement('div');
                item.className = 'parameter-item';

                const labelDiv = document.createElement('div');
                labelDiv.className = 'parameter-label';
                labelDiv.textContent = label;

                const valueDiv = document.createElement('div');
                valueDiv.className = 'parameter-value';
                valueDiv.textContent = parameters[key];

                item.appendChild(labelDiv);
                item.appendChild(valueDiv);
                container.appendChild(item);
            }
        }
    }

    /**
     * Show status message
     */
    showStatus(message, type) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = 'status-message ' + type;

        // Auto-clear success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'status-message';
            }, 5000);
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new SoundingApp();

    // Make app globally accessible for debugging
    window.soundingApp = app;
});

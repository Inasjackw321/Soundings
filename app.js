/**
 * Main Application Controller
 * Coordinates all modules and handles user interactions
 */

class SoundingApp {
    constructor() {
        this.diagram = null;
        this.dataFetcher = null;
        this.stationMap = null;
        this.radarDisplay = null;
        this.nwsData = null;
        this.saveExport = null;

        this.currentData = null;
        this.currentStation = null;

        this.initializeComponents();
        this.attachEventListeners();
        this.populateStationDropdown();
        this.setDefaultDate();
        this.loadSampleData();
    }

    /**
     * Initialize all components
     */
    initializeComponents() {
        this.diagram = new SkewTDiagram('skewt-canvas');
        this.dataFetcher = new SoundingDataFetcher();
        this.radarDisplay = new RadarDisplay();
        this.nwsData = new NWSData();
        this.saveExport = new SaveExport();

        // Initialize map with callback
        this.stationMap = new StationMap('map', (station) => {
            this.onStationSelected(station);
        });
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Fetch button
        document.getElementById('fetch-btn').addEventListener('click', () => {
            this.fetchSounding();
        });

        // Station dropdown change
        document.getElementById('station-select').addEventListener('change', (e) => {
            const stationId = e.target.value;
            if (stationId) {
                this.stationMap.selectStationById(stationId);
            }
        });

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.showSaveModal();
        });

        // Quick export image
        document.getElementById('export-image-btn').addEventListener('click', () => {
            this.saveExport.quickExportImage();
        });

        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeSaveModal();
        });

        // Save options
        document.getElementById('save-json').addEventListener('click', () => {
            this.saveExport.saveAsJSON();
            this.closeSaveModal();
        });

        document.getElementById('save-png').addEventListener('click', () => {
            this.saveExport.saveAsPNG();
            this.closeSaveModal();
        });

        document.getElementById('save-pdf').addEventListener('click', () => {
            this.saveExport.saveAsPDF();
            this.closeSaveModal();
        });

        document.getElementById('save-csv').addEventListener('click', () => {
            this.saveExport.saveAsCSV();
            this.closeSaveModal();
        });

        // Radar controls
        document.getElementById('radar-refresh').addEventListener('click', () => {
            this.radarDisplay.refresh();
        });

        document.getElementById('radar-product').addEventListener('change', (e) => {
            this.radarDisplay.changeProduct(e.target.value);
        });

        // Close modal on outside click
        document.getElementById('save-modal').addEventListener('click', (e) => {
            if (e.target.id === 'save-modal') {
                this.closeSaveModal();
            }
        });

        // Enter key to fetch
        document.getElementById('date-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.fetchSounding();
        });
    }

    /**
     * Populate station dropdown
     */
    populateStationDropdown() {
        const select = document.getElementById('station-select');
        const stations = StationDatabase.getAllStations();

        // Clear existing options
        select.innerHTML = '';

        // Group by region
        const regions = {
            'West Coast': [],
            'Mountain West': [],
            'Southwest': [],
            'Great Plains': [],
            'Midwest': [],
            'South': [],
            'Southeast': [],
            'Northeast': []
        };

        stations.forEach(station => {
            // Simple regional classification
            if (station.lon < -115) {
                regions['West Coast'].push(station);
            } else if (station.lon < -105 && station.lat > 40) {
                regions['Mountain West'].push(station);
            } else if (station.lon < -100 && station.lat < 37) {
                regions['Southwest'].push(station);
            } else if (station.lon < -95 && station.lat > 37) {
                regions['Great Plains'].push(station);
            } else if (station.lon < -85 && station.lat > 38) {
                regions['Midwest'].push(station);
            } else if (station.lon < -90 && station.lat < 38) {
                regions['South'].push(station);
            } else if (station.lat < 38) {
                regions['Southeast'].push(station);
            } else {
                regions['Northeast'].push(station);
            }
        });

        // Add optgroups
        for (const [region, stationList] of Object.entries(regions)) {
            if (stationList.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = region;

                stationList
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .forEach(station => {
                        const option = document.createElement('option');
                        option.value = station.id;
                        option.textContent = `${station.name} (${station.icao})`;
                        optgroup.appendChild(option);
                    });

                select.appendChild(optgroup);
            }
        }

        // Select default (Salt Lake City)
        select.value = '72451';
    }

    /**
     * Handle station selection from map
     */
    onStationSelected(station) {
        this.currentStation = station;

        // Update dropdown
        document.getElementById('station-select').value = station.id;

        // Update station info display
        this.displayStationInfo(station);

        // Load radar and NWS data
        this.radarDisplay.loadRadarForStation(station);
        this.nwsData.loadDataForStation(station);
    }

    /**
     * Display station information
     */
    displayStationInfo(station) {
        const infoDisplay = document.getElementById('station-info');

        const html = `
            <div class="info-item">
                <span class="info-label">Station Name:</span>
                <span class="info-value">${station.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">ICAO Code:</span>
                <span class="info-value">${station.icao}</span>
            </div>
            <div class="info-item">
                <span class="info-label">WMO ID:</span>
                <span class="info-value">${station.id}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Latitude:</span>
                <span class="info-value">${station.lat.toFixed(4)}°</span>
            </div>
            <div class="info-item">
                <span class="info-label">Longitude:</span>
                <span class="info-value">${station.lon.toFixed(4)}°</span>
            </div>
            <div class="info-item">
                <span class="info-label">NEXRAD Site:</span>
                <span class="info-value">${station.radar}</span>
            </div>
            <div class="info-item">
                <span class="info-label">NWS Office:</span>
                <span class="info-value">${station.nws}</span>
            </div>
        `;

        infoDisplay.innerHTML = html;
    }

    /**
     * Set default date
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
            this.populateDataTable(this.currentData);

            // Select default station
            const defaultStation = StationDatabase.getStationById('72451');
            if (defaultStation) {
                this.stationMap.selectStationById(defaultStation.id);
            }

            this.showStatus('Sample data loaded. Select a station and date to fetch real data.', 'success');
        }, 500);
    }

    /**
     * Fetch sounding data
     */
    async fetchSounding() {
        const stationId = document.getElementById('station-select').value;
        const dateInput = document.getElementById('date-input').value;
        const hour = document.getElementById('hour-select').value;

        if (!stationId) {
            this.showStatus('Please select a station', 'error');
            return;
        }

        if (!dateInput) {
            this.showStatus('Please select a date', 'error');
            return;
        }

        const station = StationDatabase.getStationById(stationId);
        const [year, month, day] = dateInput.split('-');

        const fetchBtn = document.getElementById('fetch-btn');
        fetchBtn.disabled = true;
        this.showStatus('Fetching sounding data...', 'loading');

        try {
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
            this.populateDataTable(data);

            // Update diagram title
            const dateStr = `${dateInput} ${hour}:00 UTC`;
            document.getElementById('diagram-subtitle').textContent =
                `${station.name} (${station.icao}) - ${dateStr}`;

            // Update save export data
            this.saveExport.setData(data, station, dateStr);

            this.showStatus(`Loaded: ${station.name} - ${dateStr}`, 'success');

        } catch (error) {
            console.error('Fetch error:', error);
            this.showStatus(
                'Unable to fetch real data. Using sample data. Try a different date or station.',
                'error'
            );

            this.currentData = this.dataFetcher.generateSampleData();
            this.diagram.render(this.currentData);
            this.displayParameters(this.currentData.parameters);
            this.populateDataTable(this.currentData);

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
            temp700mb: '700mb Temperature',
            temp850mb: '850mb Temperature',
            lclHeight: 'LCL Height',
            lclPressure: 'LCL Pressure',
            maxWindSpeed: 'Max Wind Speed',
            precipitableWater: 'Precipitable Water',
            cape: 'CAPE',
            cin: 'CIN'
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
     * Populate the data table
     */
    populateDataTable(data) {
        const tbody = document.getElementById('sounding-table-body');
        tbody.innerHTML = '';

        if (!data || data.pressure.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No data available</td></tr>';
            return;
        }

        for (let i = 0; i < data.pressure.length; i++) {
            const row = document.createElement('tr');

            // Calculate relative humidity
            const rh = this.calculateRelativeHumidity(
                data.temperature[i],
                data.dewpoint[i]
            );

            row.innerHTML = `
                <td>${data.pressure[i].toFixed(1)}</td>
                <td>${data.height[i]}</td>
                <td>${data.temperature[i].toFixed(1)}</td>
                <td>${data.dewpoint[i].toFixed(1)}</td>
                <td>${rh !== null ? rh.toFixed(0) : 'N/A'}</td>
                <td>${data.windDirection[i] !== null ? data.windDirection[i].toFixed(0) : 'N/A'}</td>
                <td>${data.windSpeed[i] !== null ? data.windSpeed[i].toFixed(1) : 'N/A'}</td>
            `;

            tbody.appendChild(row);
        }
    }

    /**
     * Calculate relative humidity from temperature and dewpoint
     */
    calculateRelativeHumidity(temp, dewpoint) {
        if (isNaN(temp) || isNaN(dewpoint)) return null;

        // Magnus formula
        const a = 17.27;
        const b = 237.7;

        const alpha_t = (a * temp) / (b + temp);
        const alpha_d = (a * dewpoint) / (b + dewpoint);

        const rh = 100 * Math.exp(alpha_d - alpha_t);
        return Math.min(100, Math.max(0, rh));
    }

    /**
     * Show status message
     */
    showStatus(message, type) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = 'status-message ' + type;

        if (type === 'success') {
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'status-message';
            }, 5000);
        }
    }

    /**
     * Show save modal
     */
    showSaveModal() {
        document.getElementById('save-modal').classList.add('active');
    }

    /**
     * Close save modal
     */
    closeSaveModal() {
        document.getElementById('save-modal').classList.remove('active');
    }

    /**
     * Public method to select station by ID (called from map popups)
     */
    selectStationById(stationId) {
        this.stationMap.selectStationById(stationId);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.soundingApp = new SoundingApp();
});

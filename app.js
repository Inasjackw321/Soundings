/**
 * Main Application Controller - Pivotal Weather Style
 * Unified interface with all data on one graphic
 */

class SoundingApp {
    constructor() {
        this.diagram = null;
        this.dataFetcher = null;
        this.stationMap = null;
        this.rainViewerRadar = null;
        this.nwsData = null;
        this.saveExport = null;

        this.currentData = null;
        this.currentStation = null;

        this.initializeComponents();
        this.attachEventListeners();
        this.populateStationDropdown();
        this.setDefaultDate();
        this.autoLoadLatestSounding();
    }

    /**
     * Initialize all components
     */
    initializeComponents() {
        this.diagram = new SkewTDiagram('skewt-canvas');
        this.hodograph = new Hodograph('hodograph-canvas');
        this.dataFetcher = new NWSUpperAir(); // Use new NWS data source
        this.rainViewerRadar = new RainViewerRadar('radar-map');
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

        // Data source selection
        document.getElementById('data-source-select').addEventListener('change', (e) => {
            this.dataFetcher.setSource(e.target.value);
            this.showStatus(`Data source changed to: ${e.target.options[e.target.selectedIndex].text}`, 'info');
        });

        // Save buttons
        document.getElementById('save-pdf').addEventListener('click', () => {
            this.saveExport.saveAsPDF();
        });

        document.getElementById('save-json').addEventListener('click', () => {
            this.saveExport.saveAsJSON();
        });

        document.getElementById('save-csv').addEventListener('click', () => {
            this.saveExport.saveAsCSV();
        });

        document.getElementById('save-png').addEventListener('click', () => {
            this.saveExport.saveAsPNG();
        });

        // Radar controls
        document.getElementById('radar-play').addEventListener('click', () => {
            this.rainViewerRadar.toggleAnimation();
        });

        document.getElementById('radar-slider').addEventListener('input', (e) => {
            this.rainViewerRadar.onSliderChange(e.target.value);
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

        select.value = '72451';
    }

    /**
     * Handle station selection
     */
    onStationSelected(station) {
        this.currentStation = station;

        // Update dropdown
        document.getElementById('station-select').value = station.id;

        // Update station display
        document.getElementById('station-name-display').textContent =
            `${station.name} (${station.icao})`;
        document.getElementById('station-coords-display').textContent =
            `${station.lat.toFixed(2)}°, ${station.lon.toFixed(2)}°`;

        // Center radar on station
        this.rainViewerRadar.centerOnStation(station);

        // Load NWS data
        this.loadNWSDataCompact(station);
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
     * Auto-load latest sounding from default station
     */
    async autoLoadLatestSounding() {
        this.showStatus('Loading latest sounding...', 'loading');

        // Set default station
        const defaultStation = StationDatabase.getStationById('72451'); // OKC
        if (defaultStation) {
            this.stationMap.selectStationById(defaultStation.id);
            document.getElementById('station-select').value = defaultStation.id;
        }

        // Get latest sounding time
        const latestTime = this.dataFetcher.getLatestSoundingTime();

        // Update date input
        const dateStr = `${latestTime.year}-${String(latestTime.month).padStart(2, '0')}-${String(latestTime.day).padStart(2, '0')}`;
        document.getElementById('date-input').value = dateStr;
        document.getElementById('hour-select').value = String(latestTime.hour).padStart(2, '0');

        // Fetch real data
        setTimeout(() => {
            this.fetchSounding();
        }, 500);
    }

    /**
     * Fetch sounding data
     */
    async fetchSounding() {
        const stationId = document.getElementById('station-select').value;
        const dateInput = document.getElementById('date-input').value;
        const hour = document.getElementById('hour-select').value;

        if (!stationId || !dateInput) {
            this.showStatus('Please select station and date', 'error');
            return;
        }

        const station = StationDatabase.getStationById(stationId);
        const [year, month, day] = dateInput.split('-');

        const fetchBtn = document.getElementById('fetch-btn');
        fetchBtn.disabled = true;
        this.showStatus('Fetching sounding data from NWS sources...', 'loading');

        try {
            // Use new NWS data fetcher with separate hour parameter
            const data = await this.dataFetcher.fetchSounding(
                stationId,
                parseInt(year),
                parseInt(month),
                parseInt(day),
                parseInt(hour)
            );

            if (data.pressure.length === 0) {
                throw new Error('No data available');
            }

            this.currentData = data;
            this.diagram.render(data);
            this.hodograph.plot(
                data.pressure,
                data.windDirection,
                data.windSpeed,
                data.height
            );
            this.displaySevereWeatherAnalysis(data.parameters);
            this.displayParametersCompact(data.parameters);
            this.populateDataTableCompact(data);

            const dateStr = `${dateInput} ${hour}:00 UTC`;
            document.getElementById('diagram-subtitle').textContent =
                `${station.name} (${station.icao}) - ${dateStr}`;

            this.saveExport.setData(data, station, dateStr);

            this.showStatus(`Loaded: ${station.name} - ${dateStr}`, 'success');

        } catch (error) {
            console.error('Fetch error:', error);
            this.showStatus(`Failed to fetch data: ${error.message}. Try different date/station/source.`, 'error');

        } finally {
            fetchBtn.disabled = false;
        }
    }

    /**
     * Display severe weather analysis
     */
    displaySevereWeatherAnalysis(parameters) {
        const container = document.getElementById('severe-wx-grid');
        container.innerHTML = '';

        if (!parameters) return;

        const severeParams = [
            {
                key: 'stp',
                label: 'STP',
                fullName: 'Sig Tornado Parameter',
                thresholds: { critical: 1.0, elevated: 0.5 }
            },
            {
                key: 'scp',
                label: 'SCP',
                fullName: 'Supercell Composite',
                thresholds: { critical: 4.0, elevated: 1.0 }
            },
            {
                key: 'cape',
                label: 'CAPE',
                fullName: 'Conv Avail Pot Energy',
                thresholds: { critical: 2000, elevated: 1000 }
            },
            {
                key: 'cin',
                label: 'CIN',
                fullName: 'Conv Inhibition',
                thresholds: { critical: -50, elevated: -100 }
            },
            {
                key: 'srh01km',
                label: '0-1KM SRH',
                fullName: 'Storm Rel Helicity',
                thresholds: { critical: 150, elevated: 100 }
            },
            {
                key: 'srh03km',
                label: '0-3KM SRH',
                fullName: 'Storm Rel Helicity',
                thresholds: { critical: 250, elevated: 150 }
            },
            {
                key: 'shear01km',
                label: '0-1KM SHEAR',
                fullName: 'Bulk Shear',
                thresholds: { critical: 20, elevated: 15 }
            },
            {
                key: 'shear06km',
                label: '0-6KM SHEAR',
                fullName: 'Bulk Shear',
                thresholds: { critical: 40, elevated: 30 }
            },
            {
                key: 'ehi',
                label: 'EHI',
                fullName: 'Energy Helicity Index',
                thresholds: { critical: 2.0, elevated: 1.0 }
            },
            {
                key: 'lclHeight',
                label: 'LCL',
                fullName: 'Lift Cond Level',
                thresholds: { critical: 1000, elevated: 1500 }
            },
            {
                key: 'li',
                label: 'LIFTED INDEX',
                fullName: 'Lifted Index',
                thresholds: { critical: -6, elevated: -3 }
            },
            {
                key: 'pw',
                label: 'PWAT',
                fullName: 'Precipitable Water',
                thresholds: { critical: 2.0, elevated: 1.5 }
            }
        ];

        severeParams.forEach(param => {
            if (parameters[param.key]) {
                const value = parseFloat(parameters[param.key]);
                let classification = 'marginal';

                if (!isNaN(value) && param.thresholds) {
                    if (param.key === 'cin' || param.key === 'li' || param.key === 'lclHeight') {
                        // Inverse thresholds
                        if (value <= param.thresholds.critical) classification = 'critical';
                        else if (value <= param.thresholds.elevated) classification = 'elevated';
                    } else {
                        // Normal thresholds
                        if (value >= param.thresholds.critical) classification = 'critical';
                        else if (value >= param.thresholds.elevated) classification = 'elevated';
                    }
                }

                const item = document.createElement('div');
                item.className = `severe-wx-item ${classification}`;
                item.innerHTML = `
                    <div class="severe-wx-label">${param.label}</div>
                    <div class="severe-wx-value">${parameters[param.key]}</div>
                    <div class="severe-wx-interpretation">${param.fullName}</div>
                `;
                container.appendChild(item);
            }
        });
    }

    /**
     * Display parameters in compact grid
     */
    displayParametersCompact(parameters) {
        const container = document.getElementById('parameters-grid');
        container.innerHTML = '';

        if (!parameters) return;

        const paramsList = [
            { key: 'surfacePressure', label: 'SFC PRES' },
            { key: 'surfaceTemp', label: 'SFC TEMP' },
            { key: 'surfaceDewpoint', label: 'SFC DWPT' },
            { key: 'temp850mb', label: '850MB T' },
            { key: 'temp700mb', label: '700MB T' },
            { key: 'temp500mb', label: '500MB T' },
            { key: 'lfc', label: 'LFC' },
            { key: 'el', label: 'EQ LEVEL' },
            { key: 'kIndex', label: 'K-INDEX' },
            { key: 'totalTotals', label: 'TOT-TOT' }
        ];

        paramsList.forEach(param => {
            if (parameters[param.key]) {
                const item = document.createElement('div');
                item.className = 'param-item-compact';
                item.innerHTML = `
                    <div class="param-label-compact">${param.label}</div>
                    <div class="param-value-compact">${parameters[param.key]}</div>
                `;
                container.appendChild(item);
            }
        });
    }

    /**
     * Populate data table
     */
    populateDataTableCompact(data) {
        const tbody = document.getElementById('sounding-table-body');
        tbody.innerHTML = '';

        if (!data || data.pressure.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No data</td></tr>';
            return;
        }

        for (let i = 0; i < data.pressure.length; i++) {
            const row = document.createElement('tr');

            const rh = this.calculateRelativeHumidity(
                data.temperature[i],
                data.dewpoint[i]
            );

            row.innerHTML = `
                <td>${data.pressure[i].toFixed(0)}</td>
                <td>${data.height[i]}</td>
                <td>${data.temperature[i].toFixed(1)}</td>
                <td>${data.dewpoint[i].toFixed(1)}</td>
                <td>${rh !== null ? rh.toFixed(0) : '-'}</td>
                <td>${data.windDirection[i] !== null ? data.windDirection[i].toFixed(0) : '-'}</td>
                <td>${data.windSpeed[i] !== null ? data.windSpeed[i].toFixed(0) : '-'}</td>
            `;

            tbody.appendChild(row);
        }
    }

    /**
     * Load NWS data in compact format
     */
    async loadNWSDataCompact(station) {
        try {
            // Load alerts
            const alertsResponse = await fetch(
                `https://api.weather.gov/alerts/active?point=${station.lat},${station.lon}`
            );

            if (alertsResponse.ok) {
                const alertsData = await alertsResponse.json();
                this.displayAlertsCompact(alertsData.features);
            }

            // Load current observations
            const obsResponse = await fetch(
                `https://api.weather.gov/stations/${station.icao}/observations/latest`
            );

            if (obsResponse.ok) {
                const obsData = await obsResponse.json();
                this.displayObservationsCompact(obsData.properties);
            }

        } catch (error) {
            console.error('Error loading NWS data:', error);
        }
    }

    /**
     * Display alerts compact
     */
    displayAlertsCompact(alerts) {
        const container = document.getElementById('nws-alerts-compact');

        if (!alerts || alerts.length === 0) {
            container.innerHTML = '<div style="padding:10px;color:#6b7280;font-size:0.8em;">No active alerts</div>';
            return;
        }

        let html = '';
        alerts.slice(0, 3).forEach(alert => {
            const props = alert.properties;
            let alertClass = 'advisory';
            if (props.event.includes('Warning')) alertClass = 'warning';
            else if (props.event.includes('Watch')) alertClass = 'watch';

            html += `
                <div class="alert-item-compact ${alertClass}">
                    <div class="alert-title-compact">${props.event}</div>
                    <div class="alert-time-compact">${new Date(props.effective).toLocaleTimeString()}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Display observations compact
     */
    displayObservationsCompact(obs) {
        const container = document.getElementById('current-obs-compact');

        if (!obs) {
            container.innerHTML = '<div style="padding:10px;color:#6b7280;font-size:0.8em;">No data</div>';
            return;
        }

        const tempC = obs.temperature.value;
        const tempF = tempC !== null ? (tempC * 9/5 + 32).toFixed(0) : '-';
        const dewpointC = obs.dewpoint.value;
        const dewpointF = dewpointC !== null ? (dewpointC * 9/5 + 32).toFixed(0) : '-';
        const windSpeed = obs.windSpeed.value !== null ? (obs.windSpeed.value * 1.94384).toFixed(0) : '-';
        const windDir = obs.windDirection.value || '-';
        const pressure = obs.barometricPressure.value !== null ? (obs.barometricPressure.value / 100).toFixed(1) : '-';
        const humidity = obs.relativeHumidity.value !== null ? obs.relativeHumidity.value.toFixed(0) : '-';

        const html = `
            <div class="obs-item-compact">
                <div class="obs-label-compact">Temp</div>
                <div class="obs-value-compact">${tempF}°F</div>
            </div>
            <div class="obs-item-compact">
                <div class="obs-label-compact">Dewpoint</div>
                <div class="obs-value-compact">${dewpointF}°F</div>
            </div>
            <div class="obs-item-compact">
                <div class="obs-label-compact">Wind</div>
                <div class="obs-value-compact">${windDir}°@${windSpeed}</div>
            </div>
            <div class="obs-item-compact">
                <div class="obs-label-compact">Pressure</div>
                <div class="obs-value-compact">${pressure}mb</div>
            </div>
            <div class="obs-item-compact">
                <div class="obs-label-compact">RH</div>
                <div class="obs-value-compact">${humidity}%</div>
            </div>
            <div class="obs-item-compact">
                <div class="obs-label-compact">Conditions</div>
                <div class="obs-value-compact" style="font-size:0.85em;">${obs.textDescription || 'N/A'}</div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Calculate relative humidity
     */
    calculateRelativeHumidity(temp, dewpoint) {
        if (isNaN(temp) || isNaN(dewpoint)) return null;

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
        const statusBar = document.getElementById('status-bar');
        statusBar.textContent = message;
        statusBar.className = 'status-bar ' + type;
    }

    /**
     * Public method for map callback
     */
    selectStationById(stationId) {
        this.stationMap.selectStationById(stationId);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    window.soundingApp = new SoundingApp();
});

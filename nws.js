/**
 * National Weather Service API Integration
 * Fetches forecasts, alerts, and current observations
 */

class NWSData {
    constructor() {
        this.baseURL = 'https://api.weather.gov';
        this.currentStation = null;
    }

    /**
     * Load all NWS data for a station
     */
    async loadDataForStation(station) {
        if (!station) return;

        this.currentStation = station;

        // Load all data in parallel
        await Promise.all([
            this.loadForecast(station.lat, station.lon),
            this.loadAlerts(station.lat, station.lon),
            this.loadCurrentObservations(station.icao)
        ]);
    }

    /**
     * Fetch forecast discussion
     */
    async loadForecast(lat, lon) {
        const forecastDisplay = document.getElementById('nws-forecast');

        try {
            // Get grid point
            const pointResponse = await fetch(`${this.baseURL}/points/${lat.toFixed(4)},${lon.toFixed(4)}`);

            if (!pointResponse.ok) {
                throw new Error('Failed to fetch grid point');
            }

            const pointData = await pointResponse.json();
            const forecastUrl = pointData.properties.forecast;

            // Get forecast
            const forecastResponse = await fetch(forecastUrl);
            const forecastData = await forecastResponse.json();

            // Display forecast periods
            this.displayForecast(forecastData.properties.periods);

        } catch (error) {
            console.error('Error loading forecast:', error);
            forecastDisplay.innerHTML = '<p class="info-placeholder">Unable to load forecast data</p>';
        }
    }

    /**
     * Display forecast periods
     */
    displayForecast(periods) {
        const forecastDisplay = document.getElementById('nws-forecast');

        if (!periods || periods.length === 0) {
            forecastDisplay.innerHTML = '<p class="info-placeholder">No forecast data available</p>';
            return;
        }

        let html = '';

        // Show first 4 periods (2 days)
        periods.slice(0, 4).forEach(period => {
            html += `
                <div class="forecast-section">
                    <div class="forecast-period">${period.name}</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">
                        ${period.temperature}°${period.temperatureUnit} - ${period.shortForecast}
                    </div>
                    <div style="font-size: 0.9em; line-height: 1.5;">
                        ${period.detailedForecast}
                    </div>
                </div>
            `;
        });

        forecastDisplay.innerHTML = html;
    }

    /**
     * Fetch active alerts and warnings
     */
    async loadAlerts(lat, lon) {
        const alertsDisplay = document.getElementById('nws-alerts');

        try {
            const response = await fetch(`${this.baseURL}/alerts/active?point=${lat},${lon}`);

            if (!response.ok) {
                throw new Error('Failed to fetch alerts');
            }

            const data = await response.json();
            this.displayAlerts(data.features);

        } catch (error) {
            console.error('Error loading alerts:', error);
            alertsDisplay.innerHTML = '<p class="info-placeholder">Unable to load alerts</p>';
        }
    }

    /**
     * Display alerts
     */
    displayAlerts(alerts) {
        const alertsDisplay = document.getElementById('nws-alerts');

        if (!alerts || alerts.length === 0) {
            alertsDisplay.innerHTML = '<p class="info-placeholder">No active alerts</p>';
            return;
        }

        let html = '';

        alerts.forEach(alert => {
            const props = alert.properties;
            const severity = props.severity.toLowerCase();

            // Determine alert class
            let alertClass = 'advisory';
            if (props.event.includes('Warning')) {
                alertClass = 'warning';
            } else if (props.event.includes('Watch')) {
                alertClass = 'watch';
            }

            html += `
                <div class="alert-item ${alertClass}">
                    <div class="alert-title">${props.event}</div>
                    <div class="alert-description">
                        ${props.headline || props.description.substring(0, 150) + '...'}
                    </div>
                    <div style="font-size: 0.75em; margin-top: 8px; color: #a8b7c7;">
                        Effective: ${new Date(props.effective).toLocaleString()}
                    </div>
                </div>
            `;
        });

        alertsDisplay.innerHTML = html;
    }

    /**
     * Fetch current observations for station
     */
    async loadCurrentObservations(icao) {
        const obsDisplay = document.getElementById('current-obs');

        try {
            // Get station observations
            const response = await fetch(`${this.baseURL}/stations/${icao}/observations/latest`);

            if (!response.ok) {
                throw new Error('Failed to fetch observations');
            }

            const data = await response.json();
            this.displayObservations(data.properties);

        } catch (error) {
            console.error('Error loading observations:', error);
            obsDisplay.innerHTML = '<p class="info-placeholder">Unable to load current observations</p>';
        }
    }

    /**
     * Display current observations
     */
    displayObservations(obs) {
        const obsDisplay = document.getElementById('current-obs');

        if (!obs) {
            obsDisplay.innerHTML = '<p class="info-placeholder">No observation data available</p>';
            return;
        }

        const tempC = obs.temperature.value;
        const tempF = tempC !== null ? (tempC * 9/5 + 32).toFixed(1) : 'N/A';
        const dewpointC = obs.dewpoint.value;
        const dewpointF = dewpointC !== null ? (dewpointC * 9/5 + 32).toFixed(1) : 'N/A';
        const windSpeed = obs.windSpeed.value !== null ? (obs.windSpeed.value * 1.94384).toFixed(1) : 'N/A'; // m/s to knots
        const windDir = obs.windDirection.value || 'N/A';
        const pressure = obs.barometricPressure.value !== null ? (obs.barometricPressure.value / 100).toFixed(1) : 'N/A'; // Pa to mb
        const humidity = obs.relativeHumidity.value !== null ? obs.relativeHumidity.value.toFixed(0) : 'N/A';
        const visibility = obs.visibility.value !== null ? (obs.visibility.value / 1609.34).toFixed(1) : 'N/A'; // m to miles

        const html = `
            <div class="obs-item">
                <div class="obs-label">Temperature</div>
                <div class="obs-value">${tempF}°F</div>
            </div>
            <div class="obs-item">
                <div class="obs-label">Dewpoint</div>
                <div class="obs-value">${dewpointF}°F</div>
            </div>
            <div class="obs-item">
                <div class="obs-label">Wind</div>
                <div class="obs-value">${windDir}° ${windSpeed} kt</div>
            </div>
            <div class="obs-item">
                <div class="obs-label">Pressure</div>
                <div class="obs-value">${pressure} mb</div>
            </div>
            <div class="obs-item">
                <div class="obs-label">Humidity</div>
                <div class="obs-value">${humidity}%</div>
            </div>
            <div class="obs-item">
                <div class="obs-label">Visibility</div>
                <div class="obs-value">${visibility} mi</div>
            </div>
            <div class="obs-item">
                <div class="obs-label">Conditions</div>
                <div class="obs-value">${obs.textDescription || 'N/A'}</div>
            </div>
            <div class="obs-item">
                <div class="obs-label">Time</div>
                <div class="obs-value" style="font-size: 0.9em;">
                    ${new Date(obs.timestamp).toLocaleString()}
                </div>
            </div>
        `;

        obsDisplay.innerHTML = html;
    }

    /**
     * Refresh all NWS data
     */
    async refresh() {
        if (this.currentStation) {
            await this.loadDataForStation(this.currentStation);
        }
    }
}

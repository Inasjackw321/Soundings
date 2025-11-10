/**
 * Weather Sounding Data Fetcher
 * Fetches and processes atmospheric sounding data from the University of Wyoming
 */

class SoundingDataFetcher {
    constructor() {
        // University of Wyoming sounding data endpoint
        this.baseURL = 'https://weather.uwyo.edu/cgi-bin/sounding';
    }

    /**
     * Fetch sounding data for a given station and time
     * @param {string} stationId - WMO station ID
     * @param {string} year - Year (YYYY)
     * @param {string} month - Month (MM)
     * @param {string} day - Day (DD)
     * @param {string} hour - Hour (00 or 12)
     * @returns {Promise<Object>} Parsed sounding data
     */
    async fetchSounding(stationId, year, month, day, hour) {
        // Construct the URL
        const params = new URLSearchParams({
            region: 'naconf',
            TYPE: 'TEXT:LIST',
            YEAR: year,
            MONTH: month,
            FROM: day + hour,
            TO: day + hour,
            STNM: stationId
        });

        const url = `${this.baseURL}?${params.toString()}`;

        try {
            // Use a CORS proxy for demonstration (in production, you'd use a backend)
            const proxyURL = 'https://api.allorigins.win/raw?url=';
            const response = await fetch(proxyURL + encodeURIComponent(url));

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            return this.parseSoundingData(text);
        } catch (error) {
            console.error('Error fetching sounding:', error);
            throw error;
        }
    }

    /**
     * Parse the text sounding data into structured format
     * @param {string} text - Raw text data from Wyoming
     * @returns {Object} Parsed sounding data
     */
    parseSoundingData(text) {
        const lines = text.split('\n');
        const data = {
            pressure: [],
            height: [],
            temperature: [],
            dewpoint: [],
            windDirection: [],
            windSpeed: [],
            metadata: {}
        };

        let inDataSection = false;
        let headerFound = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Extract station information
            if (line.includes('Station number:')) {
                data.metadata.station = line.split(':')[1].trim();
            }
            if (line.includes('Observation time:')) {
                data.metadata.time = line.split(':').slice(1).join(':').trim();
            }
            if (line.includes('Station latitude:')) {
                data.metadata.latitude = parseFloat(line.split(':')[1]);
            }
            if (line.includes('Station longitude:')) {
                data.metadata.longitude = parseFloat(line.split(':')[1]);
            }
            if (line.includes('Station elevation:')) {
                data.metadata.elevation = parseFloat(line.split(':')[1]);
            }

            // Find the data header
            if (line.includes('PRES') && line.includes('HGHT') && line.includes('TEMP')) {
                headerFound = true;
                continue;
            }

            // Start parsing data after header and separator line
            if (headerFound && line.includes('---')) {
                inDataSection = true;
                continue;
            }

            // Parse data lines
            if (inDataSection && line.length > 0) {
                // Stop at the end of data
                if (line.includes('Station information') ||
                    line.includes('Station pressure') ||
                    line.includes('</PRE>') ||
                    line.startsWith('Station')) {
                    break;
                }

                const parts = line.split(/\s+/);

                if (parts.length >= 6) {
                    const pres = parseFloat(parts[0]);
                    const hght = parseFloat(parts[1]);
                    const temp = parseFloat(parts[2]);
                    const dwpt = parseFloat(parts[3]);
                    const wdir = parseFloat(parts[6]);
                    const wspd = parseFloat(parts[7]);

                    // Only add valid data points
                    if (!isNaN(pres) && !isNaN(temp)) {
                        data.pressure.push(pres);
                        data.height.push(hght);
                        data.temperature.push(temp);
                        data.dewpoint.push(dwpt);
                        data.windDirection.push(isNaN(wdir) ? null : wdir);
                        data.windSpeed.push(isNaN(wspd) ? null : wspd);
                    }
                }
            }
        }

        // Calculate derived parameters
        if (data.pressure.length > 0) {
            data.parameters = this.calculateParameters(data);
        }

        return data;
    }

    /**
     * Calculate atmospheric parameters from sounding data
     * @param {Object} data - Sounding data
     * @returns {Object} Calculated parameters
     */
    calculateParameters(data) {
        const params = {};

        // Surface values
        if (data.pressure.length > 0) {
            params.surfacePressure = data.pressure[0].toFixed(1) + ' mb';
            params.surfaceTemp = data.temperature[0].toFixed(1) + ' °C';
            params.surfaceDewpoint = data.dewpoint[0].toFixed(1) + ' °C';
        }

        // Find 500mb temperature (common meteorological parameter)
        const idx500 = data.pressure.findIndex(p => Math.abs(p - 500) < 10);
        if (idx500 !== -1) {
            params.temp500mb = data.temperature[idx500].toFixed(1) + ' °C';
        }

        // Calculate lifting condensation level (simplified)
        const lcl = this.calculateLCL(data.temperature[0], data.dewpoint[0]);
        params.lclHeight = Math.round(lcl) + ' m';

        // Maximum wind speed
        const maxWind = Math.max(...data.windSpeed.filter(w => !isNaN(w) && w !== null));
        if (maxWind > 0) {
            params.maxWindSpeed = maxWind.toFixed(1) + ' knots';
        }

        return params;
    }

    /**
     * Calculate Lifting Condensation Level (simplified)
     * @param {number} temp - Temperature in Celsius
     * @param {number} dewpoint - Dewpoint in Celsius
     * @returns {number} LCL height in meters
     */
    calculateLCL(temp, dewpoint) {
        // Simplified formula: LCL height ≈ 125 * (T - Td) meters
        const spread = temp - dewpoint;
        return 125 * spread;
    }

    /**
     * Generate sample data for demonstration when API is unavailable
     * @returns {Object} Sample sounding data
     */
    generateSampleData() {
        const data = {
            pressure: [],
            height: [],
            temperature: [],
            dewpoint: [],
            windDirection: [],
            windSpeed: [],
            metadata: {
                station: 'SAMPLE',
                time: new Date().toISOString(),
                latitude: 40.0,
                longitude: -105.0,
                elevation: 1500
            }
        };

        // Generate realistic sounding profile
        const pressureLevels = [1000, 975, 950, 925, 900, 850, 800, 750, 700, 650, 600, 550, 500, 450, 400, 350, 300, 250, 200, 150, 100];

        for (let i = 0; i < pressureLevels.length; i++) {
            const p = pressureLevels[i];
            // Standard atmosphere approximation
            const h = 44330 * (1 - Math.pow(p / 1013.25, 1 / 5.255));
            const t = 15 - 0.0065 * h - Math.random() * 5;
            const td = t - (5 + Math.random() * 10);
            const wd = 180 + Math.random() * 180;
            const ws = 10 + Math.random() * 40;

            data.pressure.push(p);
            data.height.push(Math.round(h));
            data.temperature.push(parseFloat(t.toFixed(1)));
            data.dewpoint.push(parseFloat(td.toFixed(1)));
            data.windDirection.push(Math.round(wd));
            data.windSpeed.push(parseFloat(ws.toFixed(1)));
        }

        data.parameters = this.calculateParameters(data);
        return data;
    }
}

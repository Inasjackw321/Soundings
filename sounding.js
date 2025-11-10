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

        // Mandatory level temperatures
        const idx850 = data.pressure.findIndex(p => Math.abs(p - 850) < 10);
        const idx700 = data.pressure.findIndex(p => Math.abs(p - 700) < 10);
        const idx500 = data.pressure.findIndex(p => Math.abs(p - 500) < 10);

        if (idx850 !== -1) params.temp850mb = data.temperature[idx850].toFixed(1) + ' °C';
        if (idx700 !== -1) params.temp700mb = data.temperature[idx700].toFixed(1) + ' °C';
        if (idx500 !== -1) params.temp500mb = data.temperature[idx500].toFixed(1) + ' °C';

        // Calculate parcel path and CAPE/CIN
        const parcelData = this.calculateCAPE(data);
        if (parcelData) {
            params.cape = parcelData.cape.toFixed(0) + ' J/kg';
            params.cin = parcelData.cin.toFixed(0) + ' J/kg';
            params.lclHeight = parcelData.lclHeight.toFixed(0) + ' m';
            params.lclPressure = parcelData.lclPressure.toFixed(0) + ' mb';
            if (parcelData.lfc) params.lfc = parcelData.lfc.toFixed(0) + ' m';
            if (parcelData.el) params.el = parcelData.el.toFixed(0) + ' m';
            params.li = parcelData.li.toFixed(1);
        }

        // Bulk shear calculations
        const shear01km = this.calculateBulkShear(data, 0, 1000);
        const shear03km = this.calculateBulkShear(data, 0, 3000);
        const shear06km = this.calculateBulkShear(data, 0, 6000);

        if (shear01km) params.shear01km = shear01km.toFixed(1) + ' kt';
        if (shear03km) params.shear03km = shear03km.toFixed(1) + ' kt';
        if (shear06km) params.shear06km = shear06km.toFixed(1) + ' kt';

        // Storm Relative Helicity
        const srh01km = this.calculateSRH(data, 0, 1000);
        const srh03km = this.calculateSRH(data, 0, 3000);

        if (srh01km) params.srh01km = srh01km.toFixed(0) + ' m²/s²';
        if (srh03km) params.srh03km = srh03km.toFixed(0) + ' m²/s²';

        // Significant Tornado Parameter
        if (parcelData && shear06km && srh01km) {
            const stp = this.calculateSTP(parcelData.cape, parcelData.cin, parcelData.lclHeight, shear06km, srh01km);
            params.stp = stp.toFixed(2);
        }

        // Supercell Composite Parameter
        if (parcelData && shear06km) {
            const scp = this.calculateSCP(parcelData.cape, shear06km);
            params.scp = scp.toFixed(1);
        }

        // Energy Helicity Index
        if (parcelData && srh01km) {
            const ehi = (parcelData.cape * srh01km) / 160000;
            params.ehi = ehi.toFixed(1);
        }

        // Precipitable Water
        const pw = this.calculatePW(data);
        if (pw) params.pw = pw.toFixed(2) + ' in';

        // K-Index
        const kIndex = this.calculateKIndex(data);
        if (kIndex) params.kIndex = kIndex.toFixed(1);

        // Total Totals
        const tt = this.calculateTotalTotals(data);
        if (tt) params.totalTotals = tt.toFixed(1);

        // Maximum wind speed
        const maxWind = Math.max(...data.windSpeed.filter(w => !isNaN(w) && w !== null));
        if (maxWind > 0) params.maxWindSpeed = maxWind.toFixed(1) + ' kt';

        return params;
    }

    /**
     * Calculate CAPE and CIN using parcel theory
     */
    calculateCAPE(data) {
        if (data.pressure.length < 3) return null;

        const p0 = data.pressure[0];
        const t0 = data.temperature[0];
        const td0 = data.dewpoint[0];

        // Calculate LCL
        const lclData = this.calculateLCLAdvanced(t0, td0, p0);

        let cape = 0;
        let cin = 0;
        let lfc = null;
        let el = null;

        // Lift parcel from surface
        for (let i = 1; i < data.pressure.length; i++) {
            const p = data.pressure[i];
            const t = data.temperature[i];
            const h = data.height[i];

            // Calculate parcel temperature at this level
            let parcelT;
            if (p > lclData.pressure) {
                // Below LCL - dry adiabatic
                parcelT = t0 * Math.pow(p / p0, 0.286);
            } else {
                // Above LCL - moist adiabatic (simplified)
                parcelT = lclData.temperature * Math.pow(p / lclData.pressure, 0.286) - (lclData.pressure - p) * 0.006;
            }

            // Virtual temperature correction
            const envTV = t + 273.15;
            const parcelTV = parcelT + 273.15;

            // Calculate CAPE/CIN
            const dz = i > 0 ? data.height[i] - data.height[i - 1] : 0;
            const buoyancy = 9.81 * (parcelTV - envTV) / envTV * dz;

            if (parcelTV > envTV) {
                cape += buoyancy;
                if (!lfc) lfc = h;
                el = h;
            } else {
                cin += buoyancy;
            }
        }

        // Lifted Index
        const idx500 = data.pressure.findIndex(p => Math.abs(p - 500) < 10);
        let li = 0;
        if (idx500 !== -1) {
            const t500 = data.temperature[idx500];
            const parcelT500 = lclData.temperature * Math.pow(500 / lclData.pressure, 0.286) - (lclData.pressure - 500) * 0.006;
            li = t500 - parcelT500;
        }

        return {
            cape: Math.max(0, cape),
            cin: Math.min(0, cin),
            lclHeight: lclData.height,
            lclPressure: lclData.pressure,
            lfc: lfc,
            el: el,
            li: li
        };
    }

    /**
     * Advanced LCL calculation
     */
    calculateLCLAdvanced(temp, dewpoint, pressure) {
        const spread = temp - dewpoint;
        const height = 125 * spread;

        // Calculate LCL pressure using Poisson equation
        const lclPressure = pressure * Math.pow((temp - spread * 0.0008) / temp, 3.5);
        const lclTemp = temp - 0.0008 * height;

        return {
            height: height,
            pressure: lclPressure,
            temperature: lclTemp
        };
    }

    /**
     * Calculate bulk shear between two heights
     */
    calculateBulkShear(data, heightBottom, heightTop) {
        let windBottom = null;
        let windTop = null;

        for (let i = 0; i < data.pressure.length; i++) {
            const height = data.height[i];
            const dir = data.windDirection[i];
            const spd = data.windSpeed[i];

            if (dir === null || spd === null || isNaN(dir) || isNaN(spd)) continue;

            if (windBottom === null && height >= heightBottom) {
                windBottom = { dir, spd };
            }
            if (height >= heightTop) {
                windTop = { dir, spd };
                break;
            }
        }

        if (!windBottom || !windTop) return null;

        const u1 = -windBottom.spd * Math.sin(windBottom.dir * Math.PI / 180);
        const v1 = -windBottom.spd * Math.cos(windBottom.dir * Math.PI / 180);
        const u2 = -windTop.spd * Math.sin(windTop.dir * Math.PI / 180);
        const v2 = -windTop.spd * Math.cos(windTop.dir * Math.PI / 180);

        return Math.sqrt((u2 - u1) ** 2 + (v2 - v1) ** 2);
    }

    /**
     * Calculate Storm Relative Helicity
     */
    calculateSRH(data, heightBottom, heightTop) {
        let srh = 0;
        let prevWind = null;

        for (let i = 0; i < data.pressure.length; i++) {
            const height = data.height[i];
            const dir = data.windDirection[i];
            const spd = data.windSpeed[i];

            if (height < heightBottom || height > heightTop) continue;
            if (dir === null || spd === null || isNaN(dir) || isNaN(spd)) continue;

            const u = -spd * Math.sin(dir * Math.PI / 180);
            const v = -spd * Math.cos(dir * Math.PI / 180);

            if (prevWind) {
                const du = u - prevWind.u;
                const dv = v - prevWind.v;
                srh += (prevWind.u * dv - prevWind.v * du);
            }

            prevWind = { u, v };
        }

        return Math.abs(srh) * 0.5144; // Convert to m²/s²
    }

    /**
     * Calculate Significant Tornado Parameter
     */
    calculateSTP(cape, cin, lclHeight, shear06km, srh01km) {
        const capeTerm = cape / 1500;
        const cinTerm = (cin + 200) / 150;
        const lclTerm = (2000 - lclHeight) / 1000;
        const shearTerm = shear06km / 20;
        const srhTerm = srh01km / 150;

        return capeTerm * cinTerm * lclTerm * shearTerm * srhTerm;
    }

    /**
     * Calculate Supercell Composite Parameter
     */
    calculateSCP(cape, shear06km) {
        return (cape / 1000) * (shear06km / 20);
    }

    /**
     * Calculate Precipitable Water
     */
    calculatePW(data) {
        let pw = 0;

        for (let i = 0; i < data.pressure.length - 1; i++) {
            const p1 = data.pressure[i];
            const p2 = data.pressure[i + 1];
            const t = (data.temperature[i] + data.temperature[i + 1]) / 2;
            const td = (data.dewpoint[i] + data.dewpoint[i + 1]) / 2;

            // Mixing ratio
            const e = 6.112 * Math.exp((17.67 * td) / (td + 243.5));
            const w = 0.622 * e / (((p1 + p2) / 2) - e);

            pw += w * (p1 - p2) / 9.81;
        }

        return pw * 0.0393701; // Convert to inches
    }

    /**
     * Calculate K-Index
     */
    calculateKIndex(data) {
        const idx850 = data.pressure.findIndex(p => Math.abs(p - 850) < 10);
        const idx700 = data.pressure.findIndex(p => Math.abs(p - 700) < 10);
        const idx500 = data.pressure.findIndex(p => Math.abs(p - 500) < 10);

        if (idx850 === -1 || idx700 === -1 || idx500 === -1) return null;

        const t850 = data.temperature[idx850];
        const td850 = data.dewpoint[idx850];
        const t700 = data.temperature[idx700];
        const td700 = data.dewpoint[idx700];
        const t500 = data.temperature[idx500];

        return (t850 - t500) + td850 - (t700 - td700);
    }

    /**
     * Calculate Total Totals Index
     */
    calculateTotalTotals(data) {
        const idx850 = data.pressure.findIndex(p => Math.abs(p - 850) < 10);
        const idx500 = data.pressure.findIndex(p => Math.abs(p - 500) < 10);

        if (idx850 === -1 || idx500 === -1) return null;

        const t850 = data.temperature[idx850];
        const td850 = data.dewpoint[idx850];
        const t500 = data.temperature[idx500];

        return t850 + td850 - 2 * t500;
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

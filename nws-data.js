/**
 * NWS Upper Air Data Module
 * Fetches radiosonde data from multiple official sources
 */

class NWSUpperAir {
    constructor() {
        this.sources = {
            IOWA_STATE: 'iowa-state',
            UWYO: 'uwyo',
            SPC: 'spc'
        };
        this.currentSource = this.sources.IOWA_STATE;

        // Use SoundingDataFetcher for parameter calculations
        this.calculator = new SoundingDataFetcher();
    }

    /**
     * Set data source
     */
    setSource(source) {
        if (Object.values(this.sources).includes(source)) {
            this.currentSource = source;
        }
    }

    /**
     * Fetch sounding data with automatic fallback between sources
     */
    async fetchSounding(stationId, year, month, day, hour) {
        const sources = [this.currentSource];

        // Add other sources as fallback
        if (this.currentSource !== this.sources.IOWA_STATE) sources.push(this.sources.IOWA_STATE);
        if (this.currentSource !== this.sources.UWYO) sources.push(this.sources.UWYO);
        if (this.currentSource !== this.sources.SPC) sources.push(this.sources.SPC);

        let lastError = null;

        for (const source of sources) {
            try {
                console.log(`Attempting to fetch from ${source}...`);
                let data;

                switch (source) {
                    case this.sources.UWYO:
                        data = await this.fetchFromUWyo(stationId, year, month, day, hour);
                        break;
                    case this.sources.SPC:
                        data = await this.fetchFromSPC(stationId, year, month, day, hour);
                        break;
                    case this.sources.IOWA_STATE:
                    default:
                        data = await this.fetchFromIowaState(stationId, year, month, day, hour);
                        break;
                }

                console.log(`Successfully fetched from ${source}`);
                return data;

            } catch (error) {
                console.warn(`Failed to fetch from ${source}: ${error.message}`);
                lastError = error;
                // Try next source
                continue;
            }
        }

        // All sources failed
        throw new Error(`All data sources failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    /**
     * Fetch from Iowa State Mesonet (near real-time NWS data from SPC/NCEI)
     */
    async fetchFromIowaState(stationId, year, month, day, hour) {
        const url = `https://mesonet.agron.iastate.edu/json/raob.py?ts=${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${hour.toString().padStart(2, '0')}&station=${stationId}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Iowa State API error: ${response.status}`);
        }

        const data = await response.json();
        return this.parseIowaStateData(data);
    }

    /**
     * Fetch from University of Wyoming (official archive)
     */
    async fetchFromUWyo(stationId, year, month, day, hour) {
        // University of Wyoming uses WMO station numbers
        // URL format: http://weather.uwyo.edu/cgi-bin/sounding?region=naconf&TYPE=TEXT:LIST&YEAR=2025&MONTH=01&FROM=0100&TO=0100&STNM=72340

        const paddedMonth = month.toString().padStart(2, '0');
        const paddedDay = day.toString().padStart(2, '0');
        const paddedHour = hour.toString().padStart(2, '0');
        const fromTo = `${paddedDay}${paddedHour}`;

        const url = `https://weather.uwyo.edu/cgi-bin/sounding?region=naconf&TYPE=TEXT:LIST&YEAR=${year}&MONTH=${paddedMonth}&FROM=${fromTo}&TO=${fromTo}&STNM=${stationId}`;

        // Try with CORS proxy for browser compatibility
        const proxyURL = 'https://api.allorigins.win/raw?url=';
        const finalURL = proxyURL + encodeURIComponent(url);

        const response = await fetch(finalURL);
        if (!response.ok) {
            throw new Error(`UWyo API error: ${response.status}`);
        }

        const text = await response.text();
        return this.parseUWyoData(text);
    }

    /**
     * Fetch from SPC (Storm Prediction Center - near real-time)
     */
    async fetchFromSPC(stationId, year, month, day, hour) {
        // SPC provides recent soundings
        // Format: https://www.spc.noaa.gov/exper/soundings/YYYYMMDDHH_OBS/STATION.txt

        const dateStr = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${hour.toString().padStart(2, '0')}`;
        const url = `https://www.spc.noaa.gov/exper/soundings/${dateStr}_OBS/${stationId}.txt`;

        // Try with CORS proxy for browser compatibility
        const proxyURL = 'https://api.allorigins.win/raw?url=';
        const finalURL = proxyURL + encodeURIComponent(url);

        const response = await fetch(finalURL);
        if (!response.ok) {
            throw new Error(`SPC API error: ${response.status}`);
        }

        const text = await response.text();
        return this.parseSPCData(text);
    }

    /**
     * Parse Iowa State JSON format
     */
    parseIowaStateData(data) {
        if (!data.profiles || data.profiles.length === 0) {
            throw new Error('No sounding data available');
        }

        const profile = data.profiles[0];
        const result = {
            pressure: [],
            height: [],
            temperature: [],
            dewpoint: [],
            windDirection: [],
            windSpeed: [],
            station: data.station,
            validTime: profile.valid
        };

        for (const level of profile.profile) {
            result.pressure.push(level.pres);
            result.height.push(level.hght);
            result.temperature.push(level.tmpc);
            result.dewpoint.push(level.dwpc);
            result.windDirection.push(level.drct);
            result.windSpeed.push(level.sknt);
        }

        // Calculate atmospheric parameters
        if (result.pressure.length > 0) {
            result.parameters = this.calculator.calculateParameters(result);
        }

        return result;
    }

    /**
     * Parse University of Wyoming text format
     */
    parseUWyoData(text) {
        const result = {
            pressure: [],
            height: [],
            temperature: [],
            dewpoint: [],
            windDirection: [],
            windSpeed: [],
            station: '',
            validTime: ''
        };

        const lines = text.split('\n');
        let inData = false;

        for (const line of lines) {
            // Check for station header
            if (line.includes('Station number:')) {
                const match = line.match(/Station number:\s*(\d+)/);
                if (match) result.station = match[1];
            }

            // Check for observation time
            if (line.includes('Observation time:')) {
                const match = line.match(/Observation time:\s*(\d+)/);
                if (match) result.validTime = match[1];
            }

            // Start of data section
            if (line.includes('PRES') && line.includes('HGHT') && line.includes('TEMP')) {
                inData = true;
                continue;
            }

            // End of data section
            if (inData && line.trim() === '') {
                inData = false;
                continue;
            }

            // Parse data lines
            if (inData && line.trim() !== '' && !line.includes('---')) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 6) {
                    const pres = parseFloat(parts[0]);
                    const hght = parseFloat(parts[1]);
                    const temp = parseFloat(parts[2]);
                    const dwpt = parseFloat(parts[3]);
                    const drct = parseFloat(parts[6]);
                    const sknt = parseFloat(parts[7]);

                    // Skip lines with missing data
                    if (!isNaN(pres) && !isNaN(hght) && !isNaN(temp)) {
                        result.pressure.push(pres);
                        result.height.push(hght);
                        result.temperature.push(temp);
                        result.dewpoint.push(dwpt);
                        result.windDirection.push(drct);
                        result.windSpeed.push(sknt);
                    }
                }
            }
        }

        if (result.pressure.length === 0) {
            throw new Error('No valid sounding data found in response');
        }

        // Calculate atmospheric parameters
        if (result.pressure.length > 0) {
            result.parameters = this.calculator.calculateParameters(result);
        }

        return result;
    }

    /**
     * Parse SPC text format
     */
    parseSPCData(text) {
        const result = {
            pressure: [],
            height: [],
            temperature: [],
            dewpoint: [],
            windDirection: [],
            windSpeed: [],
            station: '',
            validTime: ''
        };

        const lines = text.split('\n');
        let inData = false;

        for (const line of lines) {
            // Check for station identifier
            if (line.includes('RAOB') || line.includes('Observations at')) {
                const match = line.match(/\b[A-Z]{3,4}\b/);
                if (match) result.station = match[0];
            }

            // Start of data section (after header with pressure, height, etc.)
            if (line.includes('PRES') || line.includes('MB') && line.includes('M')) {
                inData = true;
                continue;
            }

            // Parse data lines
            if (inData && line.trim() !== '') {
                // SPC format: PRES (mb), HGHT (m), TEMP (C), DWPT (C), WDIR, WSPD (kt)
                const parts = line.trim().split(/\s+/);

                if (parts.length >= 6) {
                    const pres = parseFloat(parts[0]);
                    const hght = parseFloat(parts[1]);
                    const temp = parseFloat(parts[2]);
                    const dwpt = parseFloat(parts[3]);
                    const drct = parseFloat(parts[4]);
                    const sknt = parseFloat(parts[5]);

                    // Only add valid data points
                    if (!isNaN(pres) && pres > 0 && !isNaN(temp)) {
                        result.pressure.push(pres);
                        result.height.push(hght || 0);
                        result.temperature.push(temp);
                        result.dewpoint.push(dwpt);
                        result.windDirection.push(drct || 0);
                        result.windSpeed.push(sknt || 0);
                    }
                }
            }

            // Stop if we hit end of data
            if (inData && line.includes('Station information')) {
                break;
            }
        }

        if (result.pressure.length === 0) {
            throw new Error('No valid sounding data found in SPC response');
        }

        // Calculate atmospheric parameters
        if (result.pressure.length > 0) {
            result.parameters = this.calculator.calculateParameters(result);
        }

        return result;
    }

    /**
     * Get latest available sounding time
     * Returns the most recent standard sounding time (00Z or 12Z)
     */
    getLatestSoundingTime() {
        const now = new Date();
        const utcHour = now.getUTCHours();

        // Soundings are typically at 00Z and 12Z
        let soundingHour;
        if (utcHour >= 12) {
            soundingHour = 12;
        } else {
            soundingHour = 0;
        }

        // If current time is less than 4 hours after sounding time,
        // use previous sounding (data may not be available yet)
        // Upper air data can take 2-4 hours to be processed and uploaded
        if (utcHour < soundingHour + 4) {
            soundingHour = soundingHour === 0 ? 12 : 0;
            if (soundingHour === 12) {
                now.setUTCDate(now.getUTCDate() - 1);
            }
        }

        return {
            year: now.getUTCFullYear(),
            month: now.getUTCMonth() + 1,
            day: now.getUTCDate(),
            hour: soundingHour
        };
    }

    /**
     * Fetch latest sounding for station
     */
    async fetchLatestSounding(stationId) {
        const time = this.getLatestSoundingTime();
        return await this.fetchSounding(
            stationId,
            time.year,
            time.month,
            time.day,
            time.hour
        );
    }
}

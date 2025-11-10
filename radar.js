/**
 * Radar Integration Module
 * Fetches and displays NEXRAD radar imagery
 */

class RadarDisplay {
    constructor() {
        this.radarImage = document.getElementById('radar-image');
        this.radarTimestamp = document.getElementById('radar-timestamp');
        this.currentStation = null;
        this.currentProduct = 'N0R';
    }

    /**
     * Load radar for a given station
     */
    async loadRadarForStation(station) {
        if (!station || !station.radar) {
            this.showNoRadar();
            return;
        }

        this.currentStation = station;
        await this.fetchRadarImage(station.radar, this.currentProduct);
    }

    /**
     * Fetch radar image from Iowa Environmental Mesonet
     */
    async fetchRadarImage(radarSite, product = 'N0R') {
        try {
            // Iowa Environmental Mesonet provides NEXRAD imagery
            const baseUrl = 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi';

            // Get current time for timestamp
            const now = new Date();
            const timestamp = now.toISOString();

            // Construct WMS request for radar image
            const params = new URLSearchParams({
                SERVICE: 'WMS',
                REQUEST: 'GetMap',
                VERSION: '1.1.1',
                LAYERS: 'nexrad-n0r-wmst',
                STYLES: '',
                FORMAT: 'image/png',
                TRANSPARENT: 'TRUE',
                HEIGHT: '400',
                WIDTH: '400',
                SRS: 'EPSG:4326',
                BBOX: this.calculateBBox(radarSite)
            });

            // Alternative: Use Ridge radar images
            const ridgeUrl = `https://radar.weather.gov/ridge/standard/${radarSite}_0.gif`;

            // Try Ridge first (more reliable)
            this.radarImage.src = ridgeUrl;
            this.radarImage.style.display = 'block';
            this.radarTimestamp.textContent = `Updated: ${now.toLocaleString()}`;

            // Handle load errors
            this.radarImage.onerror = () => {
                this.showNoRadar();
            };

        } catch (error) {
            console.error('Error loading radar:', error);
            this.showNoRadar();
        }
    }

    /**
     * Calculate bounding box for radar site
     */
    calculateBBox(radarSite) {
        // Approximate bounding box (±2 degrees from radar site)
        // In production, you'd look up actual radar coordinates
        const station = this.currentStation;
        if (station) {
            const padding = 2;
            const west = station.lon - padding;
            const south = station.lat - padding;
            const east = station.lon + padding;
            const north = station.lat + padding;
            return `${west},${south},${east},${north}`;
        }
        return '-100,30,-90,40'; // Default
    }

    /**
     * Show "no radar" message
     */
    showNoRadar() {
        this.radarImage.style.display = 'none';
        this.radarTimestamp.textContent = 'Radar data unavailable';
    }

    /**
     * Refresh radar image
     */
    async refresh() {
        if (this.currentStation) {
            await this.fetchRadarImage(this.currentStation.radar, this.currentProduct);
        }
    }

    /**
     * Change radar product
     */
    async changeProduct(product) {
        this.currentProduct = product;
        if (this.currentStation) {
            await this.fetchRadarImage(this.currentStation.radar, product);
        }
    }
}

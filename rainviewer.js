/**
 * RainViewer Radar Integration
 * Provides animated weather radar using RainViewer API
 */

class RainViewerRadar {
    constructor(mapElementId) {
        this.mapElement = document.getElementById(mapElementId);
        this.map = null;
        this.radarLayers = [];
        this.animationPosition = 0;
        this.animationTimer = null;
        this.timestamps = [];
        this.isPlaying = false;
        this.currentStation = null;

        this.initMap();
        this.loadRadarData();
    }

    /**
     * Initialize the Leaflet map
     */
    initMap() {
        // Create map
        this.map = L.map(this.mapElement, {
            center: [39.8283, -98.5795],
            zoom: 5,
            zoomControl: true,
            attributionControl: true
        });

        // Add dark tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://www.rainviewer.com/">RainViewer</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);
    }

    /**
     * Load available radar timestamps from RainViewer
     */
    async loadRadarData() {
        try {
            const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data = await response.json();

            if (data && data.radar && data.radar.past) {
                this.timestamps = [
                    ...data.radar.past,
                    data.radar.nowcast[0]
                ];

                // Initialize animation position to most recent
                this.animationPosition = this.timestamps.length - 1;

                // Add radar layers
                this.addRadarLayers();

                // Show most recent frame
                this.showFrame(this.animationPosition);

                // Update slider
                const slider = document.getElementById('radar-slider');
                if (slider) {
                    slider.max = this.timestamps.length - 1;
                    slider.value = this.animationPosition;
                }

                // Update time display
                this.updateTimeDisplay();

            }
        } catch (error) {
            console.error('Error loading RainViewer data:', error);
        }
    }

    /**
     * Add radar tile layers to map
     */
    addRadarLayers() {
        // Clear existing layers
        this.radarLayers.forEach(layer => {
            this.map.removeLayer(layer);
        });
        this.radarLayers = [];

        // Add layer for each timestamp
        this.timestamps.forEach((timestamp, idx) => {
            const layer = L.tileLayer(
                `https://tilecache.rainviewer.com/v2/radar/${timestamp.path}/512/{z}/{x}/{y}/4/1_1.png`,
                {
                    tileSize: 512,
                    opacity: 0.001,
                    zIndex: timestamp.time,
                    attribution: 'RainViewer'
                }
            );

            layer.addTo(this.map);
            this.radarLayers.push(layer);
        });
    }

    /**
     * Show specific radar frame
     */
    showFrame(position) {
        // Hide all layers
        this.radarLayers.forEach(layer => {
            layer.setOpacity(0);
        });

        // Show requested frame
        if (this.radarLayers[position]) {
            this.radarLayers[position].setOpacity(0.6);
        }

        this.animationPosition = position;
        this.updateTimeDisplay();
    }

    /**
     * Start/stop animation
     */
    toggleAnimation() {
        if (this.isPlaying) {
            this.stopAnimation();
        } else {
            this.startAnimation();
        }
    }

    /**
     * Start radar animation
     */
    startAnimation() {
        this.isPlaying = true;

        const playButton = document.getElementById('radar-play');
        if (playButton) {
            playButton.textContent = '⏸';
        }

        this.animationTimer = setInterval(() => {
            this.animationPosition = (this.animationPosition + 1) % this.timestamps.length;
            this.showFrame(this.animationPosition);

            const slider = document.getElementById('radar-slider');
            if (slider) {
                slider.value = this.animationPosition;
            }
        }, 500);
    }

    /**
     * Stop radar animation
     */
    stopAnimation() {
        this.isPlaying = false;

        const playButton = document.getElementById('radar-play');
        if (playButton) {
            playButton.textContent = '▶';
        }

        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
    }

    /**
     * Update time display
     */
    updateTimeDisplay() {
        const timeLabel = document.getElementById('radar-time');
        if (!timeLabel || !this.timestamps[this.animationPosition]) return;

        const timestamp = this.timestamps[this.animationPosition].time;
        const date = new Date(timestamp * 1000);

        const now = new Date();
        const diffMinutes = Math.round((now - date) / 60000);

        if (diffMinutes === 0) {
            timeLabel.textContent = 'Now';
        } else if (diffMinutes < 60) {
            timeLabel.textContent = `-${diffMinutes}min`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            const mins = diffMinutes % 60;
            timeLabel.textContent = `-${hours}h ${mins}m`;
        }
    }

    /**
     * Center map on station
     */
    centerOnStation(station) {
        if (!station) return;

        this.currentStation = station;
        this.map.setView([station.lat, station.lon], 7);

        // Add station marker if not exists
        if (this.stationMarker) {
            this.map.removeLayer(this.stationMarker);
        }

        this.stationMarker = L.circleMarker([station.lat, station.lon], {
            radius: 8,
            fillColor: '#4a9eff',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.map);

        this.stationMarker.bindPopup(`<strong>${station.name}</strong><br>${station.icao}`);
    }

    /**
     * Handle slider change
     */
    onSliderChange(position) {
        this.stopAnimation();
        this.showFrame(parseInt(position));
    }

    /**
     * Refresh radar data
     */
    async refresh() {
        this.stopAnimation();
        await this.loadRadarData();
    }

    /**
     * Resize map
     */
    resize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }
}

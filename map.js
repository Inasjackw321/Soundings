/**
 * Interactive Map Module
 * Handles station selection via Leaflet map
 */

class StationMap {
    constructor(mapElementId, onStationSelect) {
        this.mapElement = document.getElementById(mapElementId);
        this.onStationSelect = onStationSelect;
        this.map = null;
        this.markers = [];
        this.selectedMarker = null;
        this.markerIcon = null;
        this.selectedIcon = null;

        this.initMap();
    }

    /**
     * Initialize the Leaflet map
     */
    initMap() {
        // Create map centered on continental US
        this.map = L.map(this.mapElement, {
            center: [39.8283, -98.5795],
            zoom: 4,
            zoomControl: true,
            scrollWheelZoom: true
        });

        // Add dark themed tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Create custom icons
        this.createCustomIcons();

        // Add all station markers
        this.addStationMarkers();
    }

    /**
     * Create custom marker icons
     */
    createCustomIcons() {
        // Normal station icon
        this.markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background: #3bb3eb;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 2px solid #fff;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            "></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        // Selected station icon
        this.selectedIcon = L.divIcon({
            className: 'custom-marker-selected',
            html: `<div style="
                background: #e74c3c;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 3px solid #fff;
                box-shadow: 0 0 12px rgba(231,76,60,0.8);
                animation: pulse 1.5s ease-in-out infinite;
            "></div>
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
            </style>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });
    }

    /**
     * Add markers for all stations
     */
    addStationMarkers() {
        const stations = StationDatabase.getAllStations();

        stations.forEach(station => {
            const marker = L.marker([station.lat, station.lon], {
                icon: this.markerIcon,
                title: station.name
            });

            // Create popup content
            const popupContent = `
                <div style="color: #2c3e50; min-width: 200px;">
                    <h3 style="margin: 0 0 8px 0; color: #3bb3eb;">${station.name}</h3>
                    <p style="margin: 4px 0; font-size: 0.9em;">
                        <strong>ICAO:</strong> ${station.icao}<br>
                        <strong>WMO ID:</strong> ${station.id}<br>
                        <strong>Lat/Lon:</strong> ${station.lat.toFixed(2)}°, ${station.lon.toFixed(2)}°<br>
                        <strong>Radar:</strong> ${station.radar}<br>
                        <strong>NWS Office:</strong> ${station.nws}
                    </p>
                    <button onclick="window.soundingApp.selectStationById('${station.id}')"
                            style="
                                margin-top: 8px;
                                padding: 8px 16px;
                                background: #3bb3eb;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-weight: 600;
                                width: 100%;
                            ">
                        Select Station
                    </button>
                </div>
            `;

            marker.bindPopup(popupContent);

            // Store station data with marker
            marker.stationData = station;

            // Add click handler
            marker.on('click', () => {
                this.selectStation(marker);
            });

            marker.addTo(this.map);
            this.markers.push(marker);
        });
    }

    /**
     * Select a station on the map
     */
    selectStation(marker) {
        // Deselect previous marker
        if (this.selectedMarker) {
            this.selectedMarker.setIcon(this.markerIcon);
        }

        // Select new marker
        this.selectedMarker = marker;
        marker.setIcon(this.selectedIcon);

        // Pan to marker
        this.map.panTo(marker.getLatLng());

        // Callback with station data
        if (this.onStationSelect) {
            this.onStationSelect(marker.stationData);
        }
    }

    /**
     * Select station by ID
     */
    selectStationById(stationId) {
        const marker = this.markers.find(m => m.stationData.id === stationId);
        if (marker) {
            this.selectStation(marker);
            marker.openPopup();
        }
    }

    /**
     * Highlight nearest station to given coordinates
     */
    highlightNearestStation(lat, lon) {
        const result = StationDatabase.findNearestStation(lat, lon);
        if (result.station) {
            this.selectStationById(result.station.id);
        }
    }

    /**
     * Get currently selected station
     */
    getSelectedStation() {
        return this.selectedMarker ? this.selectedMarker.stationData : null;
    }

    /**
     * Resize map (call after container resize)
     */
    resize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }
}

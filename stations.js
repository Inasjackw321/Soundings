/**
 * Weather Station Database
 * Comprehensive database of radiosonde stations across North America
 */

const WEATHER_STATIONS = [
    // United States - West Coast
    { id: '72797', name: 'Quillayute, WA', icao: 'KUIL', lat: 47.95, lon: -124.55, radar: 'KLGX', nws: 'SEW' },
    { id: '72572', name: 'Salem, OR', icao: 'KSLE', lat: 44.92, lon: -123.00, radar: 'KRTX', nws: 'PQR' },
    { id: '72493', name: 'Albuquerque, NM', icao: 'KABQ', lat: 35.04, lon: -106.62, radar: 'KABX', nws: 'ABQ' },
    { id: '72327', name: 'Oakland, CA', icao: 'KOAK', lat: 37.75, lon: -122.22, radar: 'KMUX', nws: 'MTR' },
    { id: '72340', name: 'Vandenberg AFB, CA', icao: 'KVBG', lat: 34.73, lon: -120.57, radar: 'KVBX', nws: 'LOX' },
    { id: '72363', name: 'San Diego, CA', icao: 'KNKX', lat: 32.87, lon: -117.14, radar: 'KNKX', nws: 'SGX' },
    { id: '72249', name: 'Reno, NV', icao: 'KREV', lat: 39.57, lon: -119.80, radar: 'KRGX', nws: 'REV' },
    { id: '72572', name: 'Medford, OR', icao: 'KMFR', lat: 42.37, lon: -122.87, radar: 'KMAX', nws: 'MFR' },

    // United States - Pacific Northwest & Mountain West
    { id: '72793', name: 'Boise, ID', icao: 'KBOI', lat: 43.57, lon: -116.22, radar: 'KCBX', nws: 'BOI' },
    { id: '72681', name: 'Great Falls, MT', icao: 'KTFX', lat: 47.46, lon: -111.38, radar: 'KTFX', nws: 'TFX' },
    { id: '72768', name: 'Glasgow, MT', icao: 'KGGW', lat: 48.21, lon: -106.62, radar: 'KGGW', nws: 'GGW' },
    { id: '72776', name: 'Missoula, MT', icao: 'KMSO', lat: 46.92, lon: -114.08, radar: 'KMSX', nws: 'MSO' },
    { id: '72582', name: 'Riverton, WY', icao: 'KRIW', lat: 43.06, lon: -108.48, radar: 'KRIW', nws: 'RIW' },
    { id: '72469', name: 'Grand Junction, CO', icao: 'KGJT', lat: 39.12, lon: -108.53, radar: 'KGJX', nws: 'GJT' },
    { id: '72476', name: 'Denver, CO', icao: 'KDEN', lat: 39.75, lon: -104.87, radar: 'KFTG', nws: 'BOU' },
    { id: '72451', name: 'Salt Lake City, UT', icao: 'KSLC', lat: 40.78, lon: -111.97, radar: 'KMTX', nws: 'SLC' },
    { id: '72230', name: 'Spokane, WA', icao: 'KOTX', lat: 47.68, lon: -117.63, radar: 'KOTX', nws: 'OTX' },

    // United States - Southwest
    { id: '72274', name: 'Flagstaff, AZ', icao: 'KFGZ', lat: 35.23, lon: -111.82, radar: 'KFSX', nws: 'FGZ' },
    { id: '72290', name: 'Tucson, AZ', icao: 'KTUS', lat: 32.22, lon: -110.93, radar: 'KEMX', nws: 'TWC' },
    { id: '72365', name: 'Phoenix, AZ', icao: 'KPSR', lat: 33.45, lon: -112.07, radar: 'KIWA', nws: 'PSR' },
    { id: '72357', name: 'Las Vegas, NV', icao: 'KVEF', lat: 36.08, lon: -115.18, radar: 'KESX', nws: 'VEF' },
    { id: '72489', name: 'Midland, TX', icao: 'KMAF', lat: 31.94, lon: -102.18, radar: 'KMAF', nws: 'MAF' },
    { id: '72562', name: 'El Paso, TX', icao: 'KEPZ', lat: 31.76, lon: -106.49, radar: 'KEPZ', nws: 'EPZ' },

    // United States - Great Plains
    { id: '72520', name: 'Rapid City, SD', icao: 'KUNR', lat: 44.05, lon: -103.20, radar: 'KUDX', nws: 'UNR' },
    { id: '72558', name: 'Amarillo, TX', icao: 'KAMA', lat: 35.23, lon: -101.71, radar: 'KAMA', nws: 'AMA' },
    { id: '72528', name: 'Dodge City, KS', icao: 'KDDC', lat: 37.76, lon: -99.97, radar: 'KDDC', nws: 'DDC' },
    { id: '72540', name: 'North Platte, NE', icao: 'KLBF', lat: 41.13, lon: -100.68, radar: 'KLNX', nws: 'LBF' },
    { id: '72456', name: 'Bismarck, ND', icao: 'KBIS', lat: 46.77, lon: -100.75, radar: 'KBIS', nws: 'BIS' },
    { id: '72468', name: 'Omaha, NE', icao: 'KOAX', lat: 41.32, lon: -96.37, radar: 'KOAX', nws: 'OAX' },
    { id: '72659', name: 'Topeka, KS', icao: 'KTOP', lat: 39.07, lon: -95.63, radar: 'KTWX', nws: 'TOP' },

    // United States - South & Southeast
    { id: '72251', name: 'Corpus Christi, TX', icao: 'KCRP', lat: 27.77, lon: -97.50, radar: 'KCRP', nws: 'CRP' },
    { id: '72250', name: 'Brownsville, TX', icao: 'KBRO', lat: 25.90, lon: -97.43, radar: 'KBRO', nws: 'BRO' },
    { id: '72645', name: 'Fort Worth, TX', icao: 'KFWD', lat: 32.83, lon: -97.30, radar: 'KFWS', nws: 'FWD' },
    { id: '72672', name: 'Lake Charles, LA', icao: 'KLCH', lat: 30.13, lon: -93.22, radar: 'KLCH', nws: 'LCH' },
    { id: '72340', name: 'Shreveport, LA', icao: 'KSHV', lat: 32.45, lon: -93.82, radar: 'KSHV', nws: 'SHV' },
    { id: '72230', name: 'Little Rock, AR', icao: 'KLZK', lat: 34.84, lon: -92.26, radar: 'KLZK', nws: 'LZK' },
    { id: '72327', name: 'Jackson, MS', icao: 'KJAN', lat: 32.32, lon: -90.08, radar: 'KDGX', nws: 'JAN' },
    { id: '72235', name: 'Birmingham, AL', icao: 'KBMX', lat: 33.57, lon: -86.75, radar: 'KBMX', nws: 'BMX' },
    { id: '72776', name: 'Nashville, TN', icao: 'KBNA', lat: 36.25, lon: -86.57, radar: 'KOHX', nws: 'OHX' },
    { id: '72248', name: 'Memphis, TN', icao: 'KMEM', lat: 35.05, lon: -90.00, radar: 'KNQA', nws: 'MEG' },
    { id: '72208', name: 'Atlanta, GA', icao: 'KFFC', lat: 33.36, lon: -84.57, radar: 'KFFC', nws: 'FFC' },
    { id: '72317', name: 'Tallahassee, FL', icao: 'KTLH', lat: 30.40, lon: -84.35, radar: 'KTLH', nws: 'TAE' },
    { id: '72206', name: 'Jacksonville, FL', icao: 'KJAX', lat: 30.48, lon: -81.70, radar: 'KJAX', nws: 'JAX' },
    { id: '72210', name: 'Tampa, FL', icao: 'KTBW', lat: 27.70, lon: -82.40, radar: 'KTBW', nws: 'TBW' },
    { id: '74389', name: 'Miami, FL', icao: 'KMFL', lat: 25.75, lon: -80.38, radar: 'KAMX', nws: 'MFL' },
    { id: '72202', name: 'Key West, FL', icao: 'KEYW', lat: 24.55, lon: -81.75, radar: 'KBYX', nws: 'KEY' },

    // United States - Midwest & Great Lakes
    { id: '72340', name: 'Minneapolis, MN', icao: 'KMPX', lat: 44.85, lon: -93.57, radar: 'KMPX', nws: 'MPX' },
    { id: '72645', name: 'Green Bay, WI', icao: 'KGRB', lat: 44.50, lon: -88.11, radar: 'KGRB', nws: 'GRB' },
    { id: '72426', name: 'Davenport, IA', icao: 'KDVN', lat: 41.61, lon: -90.58, radar: 'KDVN', nws: 'DVN' },
    { id: '72451', name: 'Springfield, MO', icao: 'KSGF', lat: 37.24, lon: -93.40, radar: 'KSGF', nws: 'SGF' },
    { id: '72340', name: 'Lincoln, IL', icao: 'KILX', lat: 40.15, lon: -89.34, radar: 'KILX', nws: 'ILX' },
    { id: '72530', name: 'Indianapolis, IN', icao: 'KIND', lat: 39.71, lon: -86.27, radar: 'KIND', nws: 'IND' },
    { id: '72632', name: 'Detroit, MI', icao: 'KDTX', lat: 42.70, lon: -83.47, radar: 'KDTX', nws: 'DTX' },
    { id: '72528', name: 'Grand Rapids, MI', icao: 'KGRR', lat: 42.89, lon: -85.52, radar: 'KGRR', nws: 'GRR' },
    { id: '72645', name: 'Cleveland, OH', icao: 'KCLE', lat: 41.41, lon: -81.86, radar: 'KCLE', nws: 'CLE' },

    // United States - Northeast
    { id: '72528', name: 'Pittsburgh, PA', icao: 'KPIT', lat: 40.53, lon: -80.22, radar: 'KPBZ', nws: 'PBZ' },
    { id: '72501', name: 'Buffalo, NY', icao: 'KBUF', lat: 42.94, lon: -78.74, radar: 'KBUF', nws: 'BUF' },
    { id: '72518', name: 'Albany, NY', icao: 'KALB', lat: 42.70, lon: -73.83, radar: 'KENX', nws: 'ALY' },
    { id: '74494', name: 'Chatham, MA', icao: 'KBOX', lat: 41.96, lon: -70.87, radar: 'KBOX', nws: 'BOX' },
    { id: '72403', name: 'Wallops Island, VA', icao: 'KWAL', lat: 37.94, lon: -75.48, radar: 'KAKQ', nws: 'AKQ' },
    { id: '72208', name: 'Greensboro, NC', icao: 'KGSO', lat: 36.10, lon: -79.95, radar: 'KRAX', nws: 'RAH' },
    { id: '72317', name: 'Charleston, SC', icao: 'KCHS', lat: 32.90, lon: -80.04, radar: 'KCLX', nws: 'CHS' },
    { id: '72520', name: 'Sterling, VA', icao: 'KIAD', lat: 38.98, lon: -77.48, radar: 'KLWX', nws: 'LWX' },
    { id: '72597', name: 'Gray, ME', icao: 'KGYX', lat: 43.89, lon: -70.26, radar: 'KGYX', nws: 'GYX' }
];

// Helper functions
const StationDatabase = {
    /**
     * Get all stations
     */
    getAllStations() {
        return WEATHER_STATIONS;
    },

    /**
     * Find station by ID
     */
    getStationById(id) {
        return WEATHER_STATIONS.find(station => station.id === id);
    },

    /**
     * Find station by ICAO code
     */
    getStationByIcao(icao) {
        return WEATHER_STATIONS.find(station => station.icao === icao);
    },

    /**
     * Get stations within a bounding box
     */
    getStationsInBounds(north, south, east, west) {
        return WEATHER_STATIONS.filter(station => {
            return station.lat <= north &&
                   station.lat >= south &&
                   station.lon <= east &&
                   station.lon >= west;
        });
    },

    /**
     * Find nearest station to given coordinates
     */
    findNearestStation(lat, lon) {
        let nearest = null;
        let minDistance = Infinity;

        WEATHER_STATIONS.forEach(station => {
            const distance = this.calculateDistance(lat, lon, station.lat, station.lon);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = station;
            }
        });

        return { station: nearest, distance: minDistance };
    },

    /**
     * Calculate distance between two points (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    },

    /**
     * Get station display name with ICAO
     */
    getDisplayName(station) {
        return `${station.name} (${station.icao})`;
    }
};

# Professional Weather Soundings Analysis System

A comprehensive web-based platform for analyzing atmospheric soundings with integrated radar, NWS data, and advanced visualization tools. Built for meteorologists, weather enthusiasts, and atmospheric researchers.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

### Interactive Station Selection
- **Interactive Map**: Click-to-select stations on a Leaflet-powered map
- **70+ Stations**: Comprehensive coverage of North America radiosonde stations
- **Station Details**: View coordinates, NEXRAD radar site, and NWS office information
- **Regional Grouping**: Stations organized by geographic region

### Advanced Sounding Visualization
- **Skew-T Log-P Diagrams**: Professional-grade custom canvas rendering
- **Temperature & Dewpoint Profiles**: Color-coded curves with data points
- **Wind Barbs**: Standard meteorological wind notation at multiple levels
- **Atmospheric Parameters**: Calculated indices including:
  - Surface conditions (pressure, temperature, dewpoint)
  - Mandatory level temps (850mb, 700mb, 500mb)
  - Lifting Condensation Level (LCL)
  - Maximum wind speed aloft
  - Precipitable water
  - CAPE and CIN (when available)

### Complete Sounding Data Table
- **Full Vertical Profile**: Every pressure level displayed
- **Comprehensive Variables**: Pressure, height, temperature, dewpoint, RH, wind
- **Calculated Values**: Relative humidity computed from temperature and dewpoint
- **Sortable & Scrollable**: Easy data exploration

### NEXRAD Radar Integration
- **Real-Time Radar**: Live NEXRAD radar imagery from NOAA
- **Multiple Products**: Base reflectivity, velocity, storm relative velocity
- **Auto-Refresh**: Keep radar data current
- **Station-Linked**: Automatically loads nearest radar site

### NWS Data Integration
- **Forecast Discussion**: Latest NWS forecast for station location
- **Active Alerts**: Weather warnings, watches, and advisories
- **Current Observations**: Real-time METAR data including:
  - Temperature and dewpoint
  - Wind speed and direction
  - Pressure and humidity
  - Visibility and conditions
  - Observation timestamp

### Save & Export Tools
- **Multiple Formats**:
  - **JSON**: Full data export for analysis
  - **CSV**: Spreadsheet-compatible tabular data
  - **PNG**: High-quality diagram image export
  - **PDF**: Complete report with diagram and parameters
- **Quick Export**: One-click image export from header
- **Timestamped Files**: Automatic naming with station and date

### Professional UI/UX
- **Dark Theme**: Easy on the eyes for long analysis sessions
- **Three-Panel Layout**: Map/controls, sounding display, radar/NWS data
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modal Dialogs**: Clean interface for save options
- **Status Messages**: Real-time feedback on all operations

## Installation & Usage

### Quick Start (Open Locally)

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. That's it! No build process or server required

### Deployment to Web Server

Deploy to any static hosting service:

```bash
# Example: Deploy to GitHub Pages
git add .
git commit -m "Deploy soundings app"
git push origin main

# Or use Netlify CLI
netlify deploy --prod

# Or use Vercel
vercel --prod
```

### Using the Application

1. **Select a Station**
   - Click on a station marker on the map, OR
   - Choose from the dropdown menu
   - Station info appears in left panel

2. **Choose Date & Time**
   - Select date (soundings typically 1-2 days delayed)
   - Choose observation time (00Z or 12Z)

3. **Load Sounding**
   - Click "Load Sounding Data"
   - View diagram, data table, and parameters

4. **View Additional Data**
   - Radar imagery loads automatically
   - NWS forecast and alerts populate right panel
   - Current observations show real-time METAR

5. **Save Your Analysis**
   - Click "Save Analysis" for full modal
   - Or "Export Image" for quick PNG export

## Technical Architecture

### Frontend Stack
- **Pure JavaScript**: No frameworks, maximum performance
- **HTML5 Canvas**: Custom Skew-T rendering
- **Leaflet.js**: Interactive mapping
- **jsPDF**: PDF generation

### Modules

```
├── index.html          # Main application structure
├── styles.css          # Professional dark theme styling
├── stations.js         # Station database (70+ stations)
├── map.js             # Interactive map functionality
├── skewt.js           # Skew-T diagram renderer
├── sounding.js        # Data fetching and parsing
├── radar.js           # NEXRAD radar integration
├── nws.js             # National Weather Service API
├── save.js            # Export functionality
├── app.js             # Main application controller
└── README.md          # This file
```

### Data Sources

- **Sounding Data**: University of Wyoming Upper Air Archive
- **Radar Imagery**: NOAA NEXRAD via Iowa Environmental Mesonet
- **Forecasts & Alerts**: NWS API (api.weather.gov)
- **Current Observations**: NWS METAR observations

### Key Technologies

- **Leaflet**: v1.9.4 - Interactive maps
- **jsPDF**: v2.5.1 - PDF generation
- **Canvas API**: Custom diagram rendering
- **Fetch API**: Async data retrieval

## API & Data Access

### CORS Considerations

The application uses public APIs that may have CORS restrictions:

- **Wyoming Soundings**: Uses CORS proxy (allorigins.win)
- **NWS API**: Generally CORS-friendly
- **NEXRAD Radar**: Direct image loading

For production deployment with high reliability, implement a backend proxy:

```javascript
// Example Node.js proxy endpoint
app.get('/api/sounding', async (req, res) => {
    const { station, year, month, day, hour } = req.query;
    const url = `http://weather.uwyo.edu/cgi-bin/sounding?...`;
    const response = await fetch(url);
    const data = await response.text();
    res.send(data);
});
```

## Atmospheric Parameters Explained

### Surface Conditions
- Pressure, temperature, and dewpoint at ground level
- Critical for near-surface stability assessment

### Mandatory Levels
- **850mb (~5,000 ft)**: Low-level moisture and temperature
- **700mb (~10,000 ft)**: Mid-level analysis
- **500mb (~18,000 ft)**: Vorticity maximum, used in forecasting

### Derived Indices
- **LCL**: Lifting Condensation Level - cloud base height
- **CAPE**: Convective Available Potential Energy - thunderstorm fuel
- **CIN**: Convective Inhibition - cap strength

## Browser Compatibility

- Chrome/Edge: Full support ✓
- Firefox: Full support ✓
- Safari: Full support ✓
- Mobile browsers: Responsive layout ✓

## Development

### Project Structure

```
Soundings/
│
├── Core Application
│   ├── index.html          # Main HTML structure
│   ├── styles.css          # Styling and layout
│   └── app.js              # Application controller
│
├── Data & Integration
│   ├── stations.js         # Station database
│   ├── sounding.js         # Sounding data fetcher
│   ├── radar.js            # Radar display
│   └── nws.js              # NWS API integration
│
├── Visualization
│   ├── skewt.js            # Diagram renderer
│   └── map.js              # Interactive map
│
└── Utilities
    └── save.js             # Export functionality
```

### Adding New Stations

Edit `stations.js`:

```javascript
{
    id: '72XXX',           // WMO station ID
    name: 'City, ST',      // Display name
    icao: 'KXXX',         // ICAO code
    lat: 00.00,           // Latitude
    lon: -000.00,         // Longitude
    radar: 'KXXX',        // NEXRAD site
    nws: 'XXX'            // NWS office
}
```

### Customizing the Diagram

Modify `skewt.js` to adjust:
- Canvas dimensions
- Pressure range
- Temperature range
- Skew angle
- Grid spacing
- Color schemes

## Troubleshooting

### No Data Loading
- Check date - soundings are typically 1-2 days delayed
- Try a different station
- Verify internet connection
- Check browser console for errors

### Radar Not Displaying
- Some stations may have inactive radar sites
- Try refreshing the radar manually
- Check NOAA radar status

### NWS Data Unavailable
- API may be temporarily down
- Station coordinates may not match NWS grid
- Check api.weather.gov status

### Map Not Loading
- Verify Leaflet CDN is accessible
- Check browser console for errors
- Ensure JavaScript is enabled

## Future Enhancements

Potential additions:
- [ ] Hodograph display for wind shear analysis
- [ ] Parcel trajectory calculations
- [ ] Multiple sounding overlay comparison
- [ ] Time series animation
- [ ] Additional thermodynamic calculations
- [ ] Satellite imagery integration
- [ ] Model sounding comparisons
- [ ] Custom color schemes
- [ ] Annotation tools for diagrams
- [ ] Social sharing capabilities

## Contributing

Contributions are welcome! Areas for improvement:
- Additional weather stations
- More atmospheric calculations
- Enhanced mobile experience
- Accessibility improvements
- Performance optimizations
- Bug fixes

## Credits

- **Sounding Data**: University of Wyoming Department of Atmospheric Science
- **Radar Data**: NOAA NEXRAD, Iowa Environmental Mesonet
- **Forecast Data**: National Weather Service
- **Mapping**: OpenStreetMap contributors, CartoDB, Leaflet
- **PDF Generation**: jsPDF library

## License

MIT License - Free to use, modify, and distribute

Copyright (c) 2024 Weather Soundings Analysis System

## Acknowledgments

Special thanks to:
- University of Wyoming for maintaining the sounding archive
- NOAA for providing radar and forecast data
- The open-source community for excellent libraries
- Meteorologists worldwide who use and provide feedback

## Contact & Support

For issues, feature requests, or contributions, please open an issue on the GitHub repository.

---

**Built with passion for meteorology and atmospheric science** 🌡️⛈️🌪️


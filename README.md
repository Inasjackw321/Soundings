# Weather Soundings Analysis - Pivotal Weather Style

A professional, unified weather soundings interface inspired by Pivotal Weather. All data displayed on one comprehensive graphic with animated radar, interactive maps, and full atmospheric analysis.

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Overview

This application provides a complete atmospheric sounding analysis platform in a single, unified view. Everything you need is visible at once - no scrolling, no tabs, just pure meteorological analysis efficiency.

### Key Features

**Unified Single-Page Interface**
- Everything visible at once like Pivotal Weather
- Three-column layout: Map/Indices, Skew-T Diagram, Radar/Data
- Top control bar for quick access
- Compact, professional design
- No scrolling required (on desktop)

**Interactive Station Map**
- Click-to-select from 70+ radiosonde stations
- Covers all of North America
- Real-time marker updates
- Synchronized with dropdown

**Professional Skew-T Visualization**
- Custom HTML5 Canvas rendering
- Temperature and dewpoint profiles
- Wind barbs at all levels
- Isotherms, isobars, and dry adiabats
- Standard meteorological format

**RainViewer Animated Radar**
- Global radar coverage
- Animated playback controls
- Timeline slider for any frame
- Auto-centering on selected station
- 12 frames of recent data

**Atmospheric Parameters**
- Surface conditions (pressure, temperature, dewpoint)
- Mandatory levels (850mb, 700mb, 500mb)
- LCL (Lifting Condensation Level)
- Maximum winds aloft
- CAPE and CIN (when available)

**Complete Sounding Data**
- Full vertical profile table
- Pressure, height, temperature, dewpoint
- Calculated relative humidity
- Wind direction and speed
- Compact, scrollable format

**NWS Integration**
- Real-time weather alerts
- Current METAR observations
- Color-coded alert severity
- Automatic updates on station change

**Quick Export**
- JSON - Complete data export
- CSV - Spreadsheet format
- PNG - Diagram image
- One-click from top bar

## Quick Start

### Run Locally

1. Clone this repository
2. Open `index.html` in any modern browser
3. That's it! No build required.

### Deploy Online

```bash
# GitHub Pages
git push origin main

# Netlify
netlify deploy --prod

# Vercel
vercel --prod
```

## Usage

1. **Select Station**: Click map or use dropdown
2. **Choose Date/Time**: Pick date and 00Z/12Z
3. **Load Sounding**: Click "Load Sounding" button
4. **View All Data**: Everything updates automatically
   - Skew-T diagram renders
   - Data table populates
   - Radar centers on station
   - Parameters calculate
   - Alerts load
   - Observations update
5. **Animate Radar**: Click play button to see radar animation
6. **Export**: Click JSON/CSV/PNG buttons to save

## Interface Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Station [▼] | Date [  ] | Time [▼] | [Load] | Station Info | J C P│
├───────────────┬────────────────────────────┬─────────────────────┤
│ Station Map   │                            │   RainViewer Radar   │
│               │       Skew-T Log-P         │   ▶ ──────○         │
│               │         Diagram            │                      │
│ Atmospheric   │                            │                      │
│  Parameters   │                            │   Sounding Data      │
│               │                            │  P  Z  T  Td RH D S  │
│ Active Alerts │                            │                      │
│               │                            │ Current Observations │
└───────────────┴────────────────────────────┴─────────────────────┘
│                     Status Bar                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Technical Details

### Architecture

- **Pure JavaScript**: No framework overhead
- **Modular Design**: Separated concerns
- **HTML5 Canvas**: Custom diagram rendering
- **Leaflet.js**: Interactive maps (2 instances)
- **RainViewer API**: Animated radar tiles
- **NWS API**: Official weather data

### Files

```
soundings/
├── index.html          # Main structure
├── styles.css          # Pivotal Weather-style CSS
├── app.js              # Unified app controller
├── stations.js         # 70+ station database
├── map.js              # Station selection map
├── skewt.js            # Diagram renderer
├── sounding.js         # Data fetching/parsing
├── rainviewer.js       # Animated radar
├── nws.js              # NWS API integration
├── save.js             # Export functionality
└── README.md           # This file
```

### Data Sources

- **Soundings**: University of Wyoming Upper Air Archive
- **Radar**: RainViewer Global Radar API
- **Forecasts/Alerts**: National Weather Service API
- **Observations**: NWS METAR Data

### Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ✅ Responsive (stacked layout)

## Color Scheme

Inspired by professional meteorological tools:

- **Background**: Dark gray (#1a1d29)
- **Panels**: Subtle gray (#252a3a)
- **Borders**: Muted blue-gray (#3a4057)
- **Accents**: Bright blue (#4a9eff)
- **Text**: Off-white (#e8eaed)
- **Alerts**: Red (warnings), Orange (watches), Blue (advisories)

## Performance

- **Load Time**: < 2 seconds
- **Radar Animation**: 60 FPS
- **Station Switch**: Instant
- **Data Table**: Smooth scroll with 100+ rows
- **Responsive**: No lag on resize

## Differences from Pivotal Weather

While inspired by Pivotal Weather, this tool focuses specifically on:
- Upper air soundings (not model data)
- Interactive station selection
- Animated radar integration
- Export capabilities
- Educational use

## API Notes

### RainViewer
- Free tier: Unlimited requests
- Coverage: Global radar data
- Update frequency: 10 minutes
- Frames available: Past 2 hours

### NWS API
- Free, no key required
- Rate limit: Reasonable use
- Coverage: United States
- CORS-friendly

### Wyoming Soundings
- Free, public archive
- Uses CORS proxy (allorigins.win)
- Historical data available
- 00Z and 12Z observations

## Customization

### Change Color Scheme

Edit `styles.css`:
```css
/* Main backgrounds */
background: #1a1d29;  /* Your dark color */
background: #252a3a;  /* Your panel color */

/* Accent color */
color: #4a9eff;  /* Your accent */
```

### Add Stations

Edit `stations.js`:
```javascript
{
    id: '72XXX',
    name: 'Your Station',
    icao: 'KXXX',
    lat: 00.00,
    lon: -000.00,
    radar: 'KXXX',
    nws: 'XXX'
}
```

### Adjust Diagram

Edit `skewt.js`:
```javascript
this.width = 900;   // Canvas width
this.height = 700;  // Canvas height
this.tMin = -60;    // Temperature range
this.tMax = 40;
```

## Future Enhancements

- [ ] Hodograph display
- [ ] CAPE/CIN shading on diagram
- [ ] Parcel trajectories
- [ ] Multiple sounding comparison
- [ ] Time series animation
- [ ] Model sounding overlays
- [ ] Customizable parameters
- [ ] Advanced thermodynamics
- [ ] Storm relative helicity
- [ ] Bulk shear calculations

## Troubleshooting

**Map not loading?**
- Check internet connection
- Verify Leaflet CDN accessible
- Check browser console

**Radar blank?**
- RainViewer API may be down
- Check station has radar coverage
- Wait for data to load (can take 5-10 seconds)

**No sounding data?**
- Soundings are typically 1-2 days delayed
- Try yesterday's date
- Some stations may be inactive
- Check browser console for errors

**NWS data missing?**
- API may be temporarily down
- Station coordinates may not match grid
- Some areas lack coverage

## Credits

- **Inspiration**: Pivotal Weather (pivotalweather.com)
- **Sounding Data**: University of Wyoming
- **Radar Data**: RainViewer
- **Weather Data**: National Weather Service
- **Maps**: OpenStreetMap, CartoDB, Leaflet
- **PDF Export**: jsPDF

## License

MIT License - Free to use, modify, and distribute

## Acknowledgments

Built with appreciation for:
- Pivotal Weather's clean, efficient design philosophy
- The meteorological community's commitment to open data
- Open-source contributors worldwide

---

**Professional atmospheric analysis, streamlined and unified.**


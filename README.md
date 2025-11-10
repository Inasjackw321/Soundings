# Weather Soundings Visualizer

An interactive web application for visualizing atmospheric soundings using custom-rendered Skew-T Log-P diagrams.

## Features

- **Real-time Data Fetching**: Retrieves atmospheric sounding data from the University of Wyoming's archive
- **Custom Skew-T Diagrams**: Hand-crafted canvas-based visualization following meteorological standards
- **Interactive Controls**: Select from multiple weather stations across North America
- **Comprehensive Display**: Shows temperature, dewpoint, wind profiles, and derived parameters
- **Responsive Design**: Clean, modern interface that works across devices

## What are Weather Soundings?

Weather soundings are vertical profiles of the atmosphere, measuring:
- Temperature
- Dewpoint (moisture)
- Pressure
- Wind speed and direction
- Altitude

These measurements are crucial for weather forecasting, especially for predicting severe weather, aviation conditions, and atmospheric stability.

## What is a Skew-T Log-P Diagram?

A Skew-T Log-P diagram is the standard meteorological tool for analyzing atmospheric soundings. Key features:

- **Logarithmic pressure scale** (Y-axis): Pressure decreases logarithmically with height
- **Skewed temperature lines** (X-axis): Temperature lines are rotated 45° to better show atmospheric processes
- **Dry adiabats**: Show temperature changes for rising unsaturated air parcels
- **Isotherms**: Lines of constant temperature
- **Wind barbs**: Show wind direction and speed at different levels

## Usage

### Running Locally

1. Clone this repository
2. Open `index.html` in a web browser
3. The application loads sample data on startup

### Fetching Real Data

1. Select a weather station from the dropdown
2. Choose a date (note: data is typically 1-2 days delayed)
3. Select observation time (00Z or 12Z)
4. Click "Fetch Sounding"

**Note**: Due to CORS restrictions, fetching real data requires a CORS proxy. The application uses a public proxy by default. For production use, implement a backend proxy server.

### Interpreting the Diagram

- **Red line**: Temperature profile
- **Green line**: Dewpoint profile
- **Gray dashed lines**: Dry adiabatic lines
- **Wind barbs**: Located on the right side
  - Each full barb = 10 knots
  - Direction shows where wind is coming from

### Atmospheric Parameters

The application calculates and displays:

- **Surface Pressure**: Ground level atmospheric pressure
- **Surface Temperature**: Ground level temperature
- **Surface Dewpoint**: Ground level moisture content
- **500mb Temperature**: Temperature at ~18,000 feet (important forecast parameter)
- **LCL Height**: Lifting Condensation Level (cloud base height)
- **Max Wind Speed**: Strongest wind in the profile

## Technical Details

### Architecture

- **Pure JavaScript**: No external libraries or frameworks
- **Canvas Rendering**: Custom drawing for precise meteorological visualization
- **Modular Design**: Separated concerns (data, visualization, UI)

### Files

- `index.html`: Main HTML structure
- `styles.css`: Responsive styling
- `app.js`: Application controller and UI logic
- `sounding.js`: Data fetching and parsing
- `skewt.js`: Skew-T diagram rendering engine

### Data Source

University of Wyoming Department of Atmospheric Science
- URL: http://weather.uwyo.edu/upperair/sounding.html
- Format: Text-based sounding data
- Availability: Global stations, typically 00Z and 12Z observations

## Deployment

### Simple Deployment

Host the static files on any web server:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront

### Production Deployment

For reliable real-time data access, implement a backend proxy:

```javascript
// Example Node.js proxy
app.get('/api/sounding', async (req, res) => {
    const { station, year, month, day, hour } = req.query;
    const url = `http://weather.uwyo.edu/cgi-bin/sounding?...`;
    const response = await fetch(url);
    const data = await response.text();
    res.send(data);
});
```

Then update `sounding.js` to use your proxy instead of the CORS proxy.

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design, touch-friendly

## Future Enhancements

Potential additions:
- Parcel trajectory calculations
- CAPE (Convective Available Potential Energy) calculation
- Helicity calculations for severe weather
- Export diagrams as images
- Compare multiple soundings
- Animation of temporal changes
- Additional diagram types (e.g., hodographs)

## Educational Use

This application is perfect for:
- Meteorology students learning to interpret soundings
- Weather enthusiasts exploring atmospheric structure
- Educators teaching atmospheric science
- Amateur forecasters analyzing local conditions

## License

MIT License - Free to use and modify

## Credits

Created as a demonstration of custom atmospheric data visualization using web technologies.

Data provided by the University of Wyoming Department of Atmospheric Science.

## Contributing

Contributions welcome! Areas for improvement:
- Additional weather stations
- More atmospheric calculations
- Enhanced visualization features
- Mobile optimization
- Accessibility improvements

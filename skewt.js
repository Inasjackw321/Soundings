/**
 * Skew-T Log-P Diagram Renderer
 * Custom visualization for atmospheric soundings
 */

class SkewTDiagram {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.width = 900;
        this.height = 700;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Margins
        this.margin = { top: 40, right: 100, bottom: 50, left: 60 };
        this.plotWidth = this.width - this.margin.left - this.margin.right;
        this.plotHeight = this.height - this.margin.top - this.margin.bottom;

        // Pressure range (mb)
        this.pMin = 100;
        this.pMax = 1050;

        // Temperature range (°C)
        this.tMin = -60;
        this.tMax = 40;

        // Skew factor (tan of skew angle)
        this.skew = 1.0;
    }

    /**
     * Convert pressure to Y coordinate (logarithmic scale)
     */
    pressureToY(p) {
        const logPmin = Math.log(this.pMin);
        const logPmax = Math.log(this.pMax);
        const logP = Math.log(p);

        const fraction = (logP - logPmin) / (logPmax - logPmin);
        return this.margin.top + this.plotHeight * (1 - fraction);
    }

    /**
     * Convert temperature to X coordinate (with skew)
     */
    tempToX(t, p) {
        const fraction = (t - this.tMin) / (this.tMax - this.tMin);
        const baseX = this.margin.left + fraction * this.plotWidth;

        // Apply skew based on pressure
        const yPos = this.pressureToY(p);
        const skewOffset = (yPos - this.margin.top) * this.skew * 0.5;

        return baseX + skewOffset;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw the background grid and axes
     */
    drawBackground() {
        // Draw title area
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.width, this.margin.top);

        // Draw main plotting area background
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(
            this.margin.left,
            this.margin.top,
            this.plotWidth,
            this.plotHeight
        );

        // Draw pressure isobars (horizontal lines)
        this.drawIsobars();

        // Draw isotherms (skewed lines)
        this.drawIsotherms();

        // Draw dry adiabats
        this.drawDryAdiabats();

        // Draw axes
        this.drawAxes();
    }

    /**
     * Draw pressure isobars
     */
    drawIsobars() {
        const pressureLevels = [1000, 950, 900, 850, 800, 750, 700, 650, 600, 550, 500, 450, 400, 350, 300, 250, 200, 150, 100];

        pressureLevels.forEach(p => {
            const y = this.pressureToY(p);

            // Determine line style
            const isMajor = p % 100 === 0;
            this.ctx.strokeStyle = isMajor ? '#666' : '#ccc';
            this.ctx.lineWidth = isMajor ? 1.5 : 0.5;

            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.margin.left + this.plotWidth, y);
            this.ctx.stroke();

            // Label major isobars
            if (isMajor) {
                this.ctx.fillStyle = '#333';
                this.ctx.font = '12px sans-serif';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(p + ' mb', this.margin.left - 5, y + 4);
            }
        });
    }

    /**
     * Draw temperature isotherms (skewed vertical lines)
     */
    drawIsotherms() {
        for (let t = -80; t <= 50; t += 10) {
            const isMajor = t % 20 === 0;
            this.ctx.strokeStyle = isMajor ? '#e74c3c' : '#ffcccc';
            this.ctx.lineWidth = isMajor ? 1 : 0.5;

            this.ctx.beginPath();
            const x1 = this.tempToX(t, this.pMax);
            const y1 = this.pressureToY(this.pMax);
            const x2 = this.tempToX(t, this.pMin);
            const y2 = this.pressureToY(this.pMin);

            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();

            // Label at bottom
            if (x1 >= this.margin.left && x1 <= this.margin.left + this.plotWidth) {
                this.ctx.fillStyle = '#c0392b';
                this.ctx.font = '11px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(t + '°', x1, this.height - this.margin.bottom + 20);
            }
        }
    }

    /**
     * Draw dry adiabatic lines
     */
    drawDryAdiabats() {
        // Simplified dry adiabats
        for (let theta = -40; theta <= 120; theta += 10) {
            this.ctx.strokeStyle = '#95a5a6';
            this.ctx.lineWidth = 0.5;
            this.ctx.setLineDash([2, 2]);

            this.ctx.beginPath();
            let firstPoint = true;

            for (let p = this.pMax; p >= this.pMin; p -= 10) {
                // Poisson equation: T = theta * (p/1000)^0.286
                const t = theta * Math.pow(p / 1000, 0.286);
                const x = this.tempToX(t, p);
                const y = this.pressureToY(p);

                if (x >= this.margin.left && x <= this.margin.left + this.plotWidth) {
                    if (firstPoint) {
                        this.ctx.moveTo(x, y);
                        firstPoint = false;
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
            }
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    /**
     * Draw axes and labels
     */
    drawAxes() {
        // Title
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Skew-T Log-P Diagram', this.width / 2, 25);

        // Y-axis label
        this.ctx.save();
        this.ctx.translate(15, this.height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Pressure (mb)', 0, 0);
        this.ctx.restore();

        // X-axis label
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Temperature (°C)', this.margin.left + this.plotWidth / 2, this.height - 10);
    }

    /**
     * Draw the temperature profile
     */
    drawTemperature(pressures, temperatures) {
        if (pressures.length === 0) return;

        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        let firstPoint = true;
        for (let i = 0; i < pressures.length; i++) {
            const p = pressures[i];
            const t = temperatures[i];

            if (!isNaN(t) && !isNaN(p)) {
                const x = this.tempToX(t, p);
                const y = this.pressureToY(p);

                if (firstPoint) {
                    this.ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        this.ctx.stroke();

        // Draw points
        this.ctx.fillStyle = '#c0392b';
        for (let i = 0; i < pressures.length; i++) {
            const p = pressures[i];
            const t = temperatures[i];

            if (!isNaN(t) && !isNaN(p)) {
                const x = this.tempToX(t, p);
                const y = this.pressureToY(p);

                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    /**
     * Draw the dewpoint profile
     */
    drawDewpoint(pressures, dewpoints) {
        if (pressures.length === 0) return;

        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        let firstPoint = true;
        for (let i = 0; i < pressures.length; i++) {
            const p = pressures[i];
            const td = dewpoints[i];

            if (!isNaN(td) && !isNaN(p)) {
                const x = this.tempToX(td, p);
                const y = this.pressureToY(p);

                if (firstPoint) {
                    this.ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        this.ctx.stroke();

        // Draw points
        this.ctx.fillStyle = '#229954';
        for (let i = 0; i < pressures.length; i++) {
            const p = pressures[i];
            const td = dewpoints[i];

            if (!isNaN(td) && !isNaN(p)) {
                const x = this.tempToX(td, p);
                const y = this.pressureToY(p);

                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    /**
     * Draw wind barbs
     */
    drawWindBarbs(pressures, directions, speeds) {
        const x = this.margin.left + this.plotWidth + 20;

        // Draw every few levels to avoid crowding
        for (let i = 0; i < pressures.length; i += 3) {
            const p = pressures[i];
            const dir = directions[i];
            const spd = speeds[i];

            if (!isNaN(dir) && !isNaN(spd) && dir !== null && spd !== null) {
                const y = this.pressureToY(p);
                this.drawWindBarb(x, y, dir, spd);
            }
        }

        // Legend
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Wind', x - 10, this.margin.top - 10);
    }

    /**
     * Draw a single wind barb
     */
    drawWindBarb(x, y, direction, speed) {
        const length = 20;
        const angle = (direction - 90) * Math.PI / 180; // Convert to radians

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        // Draw shaft
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(length, 0);
        this.ctx.stroke();

        // Draw barbs (simplified: one barb per 10 knots)
        const numBarbs = Math.floor(speed / 10);
        const barbLength = 8;
        const barbSpacing = 4;

        for (let i = 0; i < Math.min(numBarbs, 5); i++) {
            const barbX = length - i * barbSpacing;
            this.ctx.beginPath();
            this.ctx.moveTo(barbX, 0);
            this.ctx.lineTo(barbX - barbLength * 0.5, -barbLength);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * Draw legend
     */
    drawLegend() {
        const x = this.margin.left + this.plotWidth - 200;
        const y = this.margin.top + 20;

        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(x - 10, y - 10, 180, 80);
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - 10, y - 10, 180, 80);

        // Temperature line
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + 30, y);
        this.ctx.stroke();

        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '13px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Temperature', x + 40, y + 4);

        // Dewpoint line
        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 25);
        this.ctx.lineTo(x + 30, y + 25);
        this.ctx.stroke();

        this.ctx.fillText('Dewpoint', x + 40, y + 29);

        // Wind barb
        this.drawWindBarb(x + 15, y + 50, 270, 25);
        this.ctx.fillText('Wind Barbs', x + 40, y + 54);
    }

    /**
     * Render complete sounding
     */
    render(soundingData) {
        this.clear();
        this.drawBackground();

        if (soundingData && soundingData.pressure.length > 0) {
            this.drawTemperature(soundingData.pressure, soundingData.temperature);
            this.drawDewpoint(soundingData.pressure, soundingData.dewpoint);
            this.drawWindBarbs(soundingData.pressure, soundingData.windDirection, soundingData.windSpeed);
            this.drawLegend();
        }
    }
}

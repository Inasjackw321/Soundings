/**
 * Hodograph Visualization
 * Displays wind profile with shear vectors
 */

class Hodograph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.size = 300;
        this.canvas.width = this.size;
        this.canvas.height = this.size;

        // Margins and plot area
        this.margin = 30;
        this.plotSize = this.size - 2 * this.margin;
        this.centerX = this.size / 2;
        this.centerY = this.size / 2;

        // Max wind speed for scale (knots)
        this.maxWind = 80;
    }

    /**
     * Convert wind speed to radius
     */
    windToRadius(speed) {
        return (speed / this.maxWind) * (this.plotSize / 2);
    }

    /**
     * Convert wind direction to angle (meteorological to mathematical)
     */
    dirToAngle(direction) {
        // Meteorological: 0° = from north, clockwise
        // Mathematical: 0° = east, counterclockwise
        return (90 - direction) * Math.PI / 180;
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.size, this.size);
        this.ctx.fillStyle = '#1a1d29';
        this.ctx.fillRect(0, 0, this.size, this.size);
    }

    /**
     * Draw background grid
     */
    drawBackground() {
        // Draw concentric circles
        const rings = [20, 40, 60, 80];

        rings.forEach(speed => {
            const radius = this.windToRadius(speed);

            this.ctx.strokeStyle = '#3a4057';
            this.ctx.lineWidth = speed === 40 ? 1.5 : 0.8;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, radius, 0, 2 * Math.PI);
            this.ctx.stroke();

            // Label
            this.ctx.fillStyle = '#6b7280';
            this.ctx.font = '10px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(speed + '', this.centerX, this.centerY - radius - 3);
        });

        // Draw cardinal directions
        const directions = [
            { label: 'N', angle: 0 },
            { label: 'E', angle: 90 },
            { label: 'S', angle: 180 },
            { label: 'W', angle: 270 }
        ];

        this.ctx.strokeStyle = '#3a4057';
        this.ctx.lineWidth = 0.5;

        directions.forEach(dir => {
            const angle = this.dirToAngle(dir.angle);
            const radius = this.plotSize / 2;

            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(
                this.centerX + radius * Math.cos(angle),
                this.centerY - radius * Math.sin(angle)
            );
            this.ctx.stroke();

            // Label
            const labelRadius = radius + 15;
            this.ctx.fillStyle = '#9ca3af';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                dir.label,
                this.centerX + labelRadius * Math.cos(angle),
                this.centerY - labelRadius * Math.sin(angle) + 4
            );
        });

        // Center dot
        this.ctx.fillStyle = '#4a9eff';
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 3, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Plot hodograph from wind data
     */
    plot(pressures, directions, speeds, heights) {
        this.clear();
        this.drawBackground();

        if (!pressures || pressures.length === 0) return;

        // Filter valid wind data
        const windData = [];
        for (let i = 0; i < pressures.length; i++) {
            if (directions[i] !== null && speeds[i] !== null &&
                !isNaN(directions[i]) && !isNaN(speeds[i])) {
                windData.push({
                    pressure: pressures[i],
                    direction: directions[i],
                    speed: speeds[i],
                    height: heights[i]
                });
            }
        }

        if (windData.length === 0) return;

        // Draw hodograph line with color gradient by height
        for (let i = 0; i < windData.length - 1; i++) {
            const w1 = windData[i];
            const w2 = windData[i + 1];

            const angle1 = this.dirToAngle(w1.direction);
            const angle2 = this.dirToAngle(w2.direction);
            const radius1 = this.windToRadius(w1.speed);
            const radius2 = this.windToRadius(w2.speed);

            const x1 = this.centerX + radius1 * Math.cos(angle1);
            const y1 = this.centerY - radius1 * Math.sin(angle1);
            const x2 = this.centerX + radius2 * Math.cos(angle2);
            const y2 = this.centerY - radius2 * Math.sin(angle2);

            // Color based on height
            const heightKm = w1.height / 1000;
            let color;
            if (heightKm < 1) {
                color = '#ef4444'; // Red - surface to 1km
            } else if (heightKm < 3) {
                color = '#f59e0b'; // Orange - 1-3km
            } else if (heightKm < 6) {
                color = '#eab308'; // Yellow - 3-6km
            } else {
                color = '#22c55e'; // Green - above 6km
            }

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }

        // Draw points at key levels
        const keyLevels = [1000, 850, 700, 500, 300];
        windData.forEach(w => {
            if (keyLevels.includes(w.pressure)) {
                const angle = this.dirToAngle(w.direction);
                const radius = this.windToRadius(w.speed);
                const x = this.centerX + radius * Math.cos(angle);
                const y = this.centerY - radius * Math.sin(angle);

                this.ctx.fillStyle = '#e8eaed';
                this.ctx.strokeStyle = '#1a1d29';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();

                // Label
                this.ctx.fillStyle = '#e8eaed';
                this.ctx.font = '9px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(w.pressure + '', x, y - 8);
            }
        });

        // Draw legend
        this.drawLegend();
    }

    /**
     * Draw color legend
     */
    drawLegend() {
        const legend = [
            { color: '#ef4444', label: '0-1km' },
            { color: '#f59e0b', label: '1-3km' },
            { color: '#eab308', label: '3-6km' },
            { color: '#22c55e', label: '>6km' }
        ];

        let y = 10;
        legend.forEach(item => {
            this.ctx.strokeStyle = item.color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(10, y);
            this.ctx.lineTo(30, y);
            this.ctx.stroke();

            this.ctx.fillStyle = '#e8eaed';
            this.ctx.font = '10px sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(item.label, 35, y + 3);

            y += 15;
        });
    }

    /**
     * Calculate bulk shear vector
     */
    calculateShear(windData, heightBottom, heightTop) {
        // Find winds at bottom and top heights
        let windBottom = null;
        let windTop = null;

        for (let i = 0; i < windData.length; i++) {
            const height = windData[i].height;
            if (windBottom === null && height >= heightBottom) {
                windBottom = windData[i];
            }
            if (height >= heightTop) {
                windTop = windData[i];
                break;
            }
        }

        if (!windBottom || !windTop) return null;

        // Calculate U and V components
        const u1 = -windBottom.speed * Math.sin(windBottom.direction * Math.PI / 180);
        const v1 = -windBottom.speed * Math.cos(windBottom.direction * Math.PI / 180);
        const u2 = -windTop.speed * Math.sin(windTop.direction * Math.PI / 180);
        const v2 = -windTop.speed * Math.cos(windTop.direction * Math.PI / 180);

        const shearU = u2 - u1;
        const shearV = v2 - v1;
        const magnitude = Math.sqrt(shearU * shearU + shearV * shearV);

        return magnitude;
    }
}

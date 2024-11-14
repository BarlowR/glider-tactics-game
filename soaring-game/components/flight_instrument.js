
const unit = 400;
const dial_spring_const = 0.04;

class FlightInstrument {
    constructor(dom_parent,
        window_width = 1000,
        base_color = "#000000",
        highlight_color = "#e1d9d9",
        dial_color = "#ffffff") {
        var fi_canvas = document.createElement("canvas");
        fi_canvas.id = "flight_instrument"
        fi_canvas.style.position = "relative"
        fi_canvas.style.left = (window_width - 220) + "px";
        dom_parent.appendChild(fi_canvas);

        fi_canvas.width = unit;
        fi_canvas.height = unit;

        this.base_color = base_color;
        this.highlight_color = highlight_color;
        this.dial_color = dial_color;

        this.dial_speed = 0;
        this.fi_canvas_context = fi_canvas.getContext("2d");
        this.update_instrument(2, 1000, 800);
    }
    update_instrument(vertical_speed, msl, agl) {
        // Draw outline 
        this.fi_canvas_context.fillStyle = this.base_color;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.arc(unit / 2, unit / 2, unit / 2, 0, 2 * Math.PI);
        this.fi_canvas_context.fill();

        this.dial_speed += dial_spring_const * (vertical_speed - this.dial_speed);
        this.draw_ticks();
        this.draw_dial(this.dial_speed);

        // Draw inner 
        // this.fi_canvas_context.fillStyle = this.base_color;
        // this.fi_canvas_context.beginPath();
        // this.fi_canvas_context.arc(unit/2, unit/2, unit * 0.4, 0, 2 * Math.PI);
        // this.fi_canvas_context.fill();

        this.draw_altitude_readout(msl, agl);
    }

    angle_to_dial_cartesian(angle, radius, center_x, center_y) {
        const cartesian_x = -Math.sin(angle) * radius + center_x;
        const cartesian_y = Math.cos(angle) * radius + center_y;
        return [cartesian_x, cartesian_y]
    }

    draw_ticks(min_vs = -3, max_vs = 6) {
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.strokeStyle = this.highlight_color;
        this.fi_canvas_context.lineWidth = 4;
        for (var major_tick of [0, 1, 2, 3]) {
            const major_tick_angle = major_tick * Math.PI / 2;
            const major_tick_value = (((max_vs - min_vs) * major_tick / 3) + min_vs).toFixed(0);
            const [num_x, num_y] = this.angle_to_dial_cartesian(major_tick_angle, unit * 0.35, unit / 2, unit / 2);
            this.fi_canvas_context.fillStyle = this.highlight_color;
            this.fi_canvas_context.textAlign = "center";
            this.fi_canvas_context.textBaseline = "middle";
            this.fi_canvas_context.font = "36px Courier New";
            this.fi_canvas_context.fillText(major_tick_value, num_x, num_y);

            const [start_x, start_y] = this.angle_to_dial_cartesian(major_tick_angle, unit * 0.42, unit / 2, unit / 2);
            const [end_x, end_y] = this.angle_to_dial_cartesian(major_tick_angle, unit / 2, unit / 2, unit / 2);
            this.fi_canvas_context.moveTo(start_x, start_y);
            this.fi_canvas_context.lineTo(end_x, end_y);
            if (major_tick == 3) {
                continue;
            }
            for (var minor_tick of [1, 2]) {
                const minor_tick_angle = major_tick_angle + (minor_tick * Math.PI / 6);
                const [start_x, start_y] = this.angle_to_dial_cartesian(minor_tick_angle, unit * 0.45, unit / 2, unit / 2);
                const [end_x, end_y] = this.angle_to_dial_cartesian(minor_tick_angle, unit / 2, unit / 2, unit / 2);
                this.fi_canvas_context.moveTo(start_x, start_y);
                this.fi_canvas_context.lineTo(end_x, end_y);
            }
        }
        this.fi_canvas_context.stroke();
    }

    draw_dial(vertical_speed, min_vs = -3, max_vs = 6) {
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.strokeStyle = this.dial_color;
        this.fi_canvas_context.lineWidth = 4;
        const angle_of_dial = ((vertical_speed - min_vs) / (max_vs - min_vs)) * 1.5 * Math.PI
        const [dial_end_x, dial_end_y] = this.angle_to_dial_cartesian(angle_of_dial, unit / 2, unit / 2, unit / 2);

        this.fi_canvas_context.moveTo(unit / 2, unit / 2);
        this.fi_canvas_context.lineTo(dial_end_x, dial_end_y);
        this.fi_canvas_context.stroke();
    }
    draw_altitude_readout(msl, agl) {
        // Convert from units of km to units of m and round to 10s of meters
        const msl_formatted = (msl * 100).toFixed(0) * 10;
        const agl_formatted = (agl * 100).toFixed(0) * 10;

        // Draw text
        this.fi_canvas_context.fillStyle = this.highlight_color;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.roundRect(unit / 4, 1 / 4 * unit, unit / 2, 1 / 2 * unit, unit / 6)
        this.fi_canvas_context.fill();
        this.fi_canvas_context.fillStyle = this.base_color;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.textAlign = "right";
        this.fi_canvas_context.textBaseline = "middle";
        this.fi_canvas_context.font = "40px Courier New";
        this.fi_canvas_context.fillText(agl_formatted, .55 * unit, 3 / 8 * unit);
        this.fi_canvas_context.fillText(msl_formatted, .55 * unit, 5 / 8 * unit);
        this.fi_canvas_context.textAlign = "left";
        this.fi_canvas_context.textBaseline = "top";
        this.fi_canvas_context.font = "20px Courier New";
        this.fi_canvas_context.fillText("m agl", .55 * unit, 3 / 8 * unit);
        this.fi_canvas_context.fillText("m msl", .55 * unit, 5 / 8 * unit);
        this.fi_canvas_context.stroke();
    }
}




export { FlightInstrument }

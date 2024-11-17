import { velocity } from "three/webgpu";

const unit = 400;
const standard_radius = unit/6;
const dial_spring_const = 0.04;
const velocity_dial_spring_const = 0.12;
const outer_radius = unit * 0.45;

const date_display =  { hour: 'long', minute: 'numeric', second: 'long'};

class FlightInstrument {
    constructor(dom_parent,
        window_width = 1000,
        base_color = "#000000",
        highlight_color = "#e1d9d9",
        dial_color = "#ffffff",
        panel_color = "#6e6e6e", 
        instrument_panel_scaling = 0.5, 
        padding = 10) {
        var fi_canvas = document.createElement("canvas");
        fi_canvas.id = "flight_instrument"
        dom_parent.appendChild(fi_canvas);
        
        fi_canvas.width = 1.6 * unit;
        fi_canvas.height = unit;
        fi_canvas.style.width = fi_canvas.width * instrument_panel_scaling + "px";
        fi_canvas.style.height = fi_canvas.height * instrument_panel_scaling + "px";
        fi_canvas.style.position = "relative"

        fi_canvas.style.left = (window_width - (fi_canvas.width * instrument_panel_scaling + padding)) + "px";
        fi_canvas.style.top = padding + "px";

        this.base_color = base_color;
        this.highlight_color = highlight_color;
        this.dial_color = dial_color;
        this.panel_color = panel_color;

        this.vertical_dial_speed = 0;
        this.velocity_dial_speed = 0;
        this.fi_canvas_context = fi_canvas.getContext("2d");
        this.update_instrument(2, 2, 2, 100, 120000);
    }
    update_instrument = (vertical_speed, msl, agl, velocity, time)  => {
        // Draw background 

        
        this.vertical_dial_speed += dial_spring_const * (vertical_speed - this.vertical_dial_speed);
        this.velocity_dial_speed += velocity_dial_spring_const * (velocity - this.velocity_dial_speed);

        this.draw_vertical_speed_instrument(180, 180, outer_radius * .9, msl, agl);
        this.draw_velocity_instrument(460, 220, outer_radius * 0.6);
        this.draw_timer(460, 60, outer_radius * 0.6 * 2, time);
    }

    draw_vertical_speed_instrument = (center_x, center_y, radius, msl, agl) => {
        this.draw_vertical_speed_background(center_x, center_y, radius);
        this.draw_vertical_speed_dial(center_x, center_y, radius, this.vertical_dial_speed);
        this.draw_altitude_readout(center_x, center_y, radius, msl, agl);
    }

    draw_velocity_instrument = (center_x, center_y, radius) => {
        this.draw_velocity_background(center_x, center_y, radius);
        this.draw_velocity_dial(center_x, center_y, radius, this.velocity_dial_speed);
    }

    angle_to_dial_cartesian = (angle, radius, center_x, center_y, zero_offset = 0)  => {
        const cartesian_x = -Math.sin(angle + zero_offset) * radius + center_x;
        const cartesian_y = Math.cos(angle + zero_offset) * radius + center_y;
        return [cartesian_x, cartesian_y]
    }

    draw_vertical_speed_background = (center_x, center_y, radius, min_vs = -3, max_vs = 6)  => {
        this.fi_canvas_context.fillStyle = this.highlight_color;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.arc(center_x, center_y, radius, 0, 2 * Math.PI);
        this.fi_canvas_context.fill();

        this.fi_canvas_context.fillStyle = this.base_color;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.arc(center_x, center_y, radius*0.98, 0, 2 * Math.PI);
        this.fi_canvas_context.fill();

        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.strokeStyle = this.highlight_color;
        this.fi_canvas_context.lineWidth = 4;
        for (var major_tick of [0, 1, 2, 3]) {
            const major_tick_angle = major_tick * Math.PI / 2;
            const major_tick_value = (((max_vs - min_vs) * major_tick / 3) + min_vs).toFixed(0);
            const [num_x, num_y] = this.angle_to_dial_cartesian(major_tick_angle, radius * 0.75, center_x, center_y);
            this.fi_canvas_context.fillStyle = this.highlight_color;
            this.fi_canvas_context.textAlign = "center";
            this.fi_canvas_context.textBaseline = "middle";
            this.fi_canvas_context.font = radius * .2 + "px Courier New";
            this.fi_canvas_context.fillText(major_tick_value, num_x, num_y);

            const [start_x, start_y] = this.angle_to_dial_cartesian(major_tick_angle, radius * 0.85, center_x, center_y);
            const [end_x, end_y] = this.angle_to_dial_cartesian(major_tick_angle, radius, center_x, center_y);
            this.fi_canvas_context.moveTo(start_x, start_y);
            this.fi_canvas_context.lineTo(end_x, end_y);
            if (major_tick == 3) {
                continue;
            }
            for (var minor_tick of [1, 2]) {
                const minor_tick_angle = major_tick_angle + (minor_tick * Math.PI / 6);
                const [start_x, start_y] = this.angle_to_dial_cartesian(minor_tick_angle, radius * 0.9, center_x, center_y);
                const [end_x, end_y] = this.angle_to_dial_cartesian(minor_tick_angle, radius, center_x, center_y);
                this.fi_canvas_context.moveTo(start_x, start_y);
                this.fi_canvas_context.lineTo(end_x, end_y);
            }
        }
        this.fi_canvas_context.stroke();
    }

    draw_vertical_speed_dial = (center_x, center_y, radius, vertical_speed, min_vs = -3, max_vs = 6)  => {
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.strokeStyle = this.dial_color;
        this.fi_canvas_context.lineWidth = 4;
        const angle_of_dial = ((vertical_speed - min_vs) / (max_vs - min_vs)) * 1.5 * Math.PI
        const [dial_end_x, dial_end_y] = this.angle_to_dial_cartesian(angle_of_dial, radius, center_x, center_y);

        this.fi_canvas_context.moveTo(center_x, center_y);
        this.fi_canvas_context.lineTo(dial_end_x, dial_end_y);
        this.fi_canvas_context.stroke();
    }

    draw_altitude_readout = (center_x, center_y, radius, msl, agl)  => {
        // Convert from units of km to units of m and round to 10s of meters
        const msl_formatted = (msl * 100).toFixed(0) * 10;
        const agl_formatted = (agl * 100).toFixed(0) * 10;

        // Draw text
        this.fi_canvas_context.fillStyle = this.highlight_color;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.roundRect(center_x - radius * .55, 
                                         center_y - radius * .55, 
                                         radius * 1.1, 
                                         radius * 1.1, standard_radius)
        this.fi_canvas_context.fill();
        this.fi_canvas_context.fillStyle = this.base_color;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.textAlign = "right";
        this.fi_canvas_context.textBaseline = "middle";
        this.fi_canvas_context.font = radius * .22 +"px Courier New";
        this.fi_canvas_context.fillText(agl_formatted, center_x + radius * 0.1, center_y - radius * 0.25);
        this.fi_canvas_context.fillText(msl_formatted, center_x + radius * 0.1, center_y + radius * 0.25);
        this.fi_canvas_context.textAlign = "left";
        this.fi_canvas_context.textBaseline = "top";
        this.fi_canvas_context.font = radius * .12 + "px Courier New";
        this.fi_canvas_context.fillText("m agl", center_x + radius * 0.1, center_y - radius * 0.25);
        this.fi_canvas_context.fillText("m msl", center_x + radius * 0.1, center_y + radius * 0.25);
        this.fi_canvas_context.stroke();
    }

    angle_to_spiral_cartesian = (angle, starting_radius, center_x, center_y, offset = 0, spiral_factor = 0.4)  => {
        const spiral_radius = (starting_radius * (1 - (spiral_factor * (angle/(2* Math.PI))))) + offset
        const cartesian_x = -Math.sin(angle) * spiral_radius + center_x;
        const cartesian_y = Math.cos(angle) * spiral_radius + center_y;
        return [cartesian_x, cartesian_y]
    }

    draw_spiral = (center_x, center_y, radius, start_angle, end_angle, color, spiral_factor = 1) => {
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.strokeStyle = color;
        this.fi_canvas_context.lineWidth = 8;
        const [start_x, start_y] = this.angle_to_spiral_cartesian(i, radius, center_x, center_y, -5, spiral_factor);
        this.fi_canvas_context.moveTo(start_x, start_y);
        for (var i = start_angle; i < end_angle; i+= Math.PI / 180) {
            const [next_x, next_y] = this.angle_to_spiral_cartesian(i, radius, center_x, center_y, -5, spiral_factor)
            this.fi_canvas_context.lineTo(next_x, next_y);
        }
        this.fi_canvas_context.stroke();
    }

    draw_velocity_background = (center_x, center_y, radius, velocity_ne = 260)  => {
        this.fi_canvas_context.fillStyle = this.highlight_color;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.arc(center_x, center_y, radius, 0, 2 * Math.PI);
        this.fi_canvas_context.fill();

        this.fi_canvas_context.fillStyle = this.base_color;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.arc(center_x, center_y, radius*0.98, 0, 2 * Math.PI);
        this.fi_canvas_context.fill();

        const half_spiral_radius = radius * 4/3;
        const inner_circle_radius = radius * 2/3;
        const major_tick_offset = radius * 0.2;
        const minor_tick_offset = radius * 0.1;
        const text_offset = radius * 0.38;



        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.strokeStyle = this.highlight_color;
        this.fi_canvas_context.lineWidth = 4;

        for (var tick_velocity = 0; tick_velocity <= velocity_ne; tick_velocity += 20){
            const tick_angle = 2.6 * Math.PI * tick_velocity / velocity_ne;
            var start_x, start_y, end_x, end_y
            
            var tick_offset;
            if (tick_velocity % 20 == 0){
                tick_offset = major_tick_offset
            } else {
                tick_offset = minor_tick_offset
            }
            
            var readout = ( tick_velocity == 80 ||
                            tick_velocity == 120 ||
                            tick_velocity == 160 ||
                            tick_velocity == 220 ||
                            tick_velocity == 260 )

            var text_x, text_y;
            if (tick_angle < Math.PI){
                [start_x, start_y] = this.angle_to_dial_cartesian(tick_angle, radius-2.5, center_x, center_y);
                [end_x, end_y] = this.angle_to_dial_cartesian(tick_angle, radius - tick_offset, center_x, center_y);
                this.fi_canvas_context.moveTo(start_x, start_y);
                this.fi_canvas_context.lineTo(end_x, end_y);
                [text_x, text_y] = this.angle_to_dial_cartesian(tick_angle, radius - text_offset, center_x, center_y);
            }
            else if (tick_angle < 2 * Math.PI){
                [start_x, start_y] = this.angle_to_spiral_cartesian(tick_angle, half_spiral_radius, center_x, center_y, -5, 0.5);
                [end_x, end_y] = this.angle_to_spiral_cartesian(tick_angle, half_spiral_radius, center_x, center_y, -tick_offset, 0.5);
                this.fi_canvas_context.moveTo(start_x, start_y);
                this.fi_canvas_context.lineTo(end_x, end_y);
                [text_x, text_y] = this.angle_to_spiral_cartesian(tick_angle, half_spiral_radius, center_x, center_y, -text_offset, 0.5);
            } else {
                [start_x, start_y] = this.angle_to_dial_cartesian(tick_angle, inner_circle_radius-5, center_x, center_y);
                [end_x, end_y] = this.angle_to_dial_cartesian(tick_angle, inner_circle_radius - tick_offset * 0.9, center_x, center_y);
                this.fi_canvas_context.moveTo(start_x, start_y);
                this.fi_canvas_context.lineTo(end_x, end_y);
                [text_x, text_y] = this.angle_to_dial_cartesian(tick_angle, inner_circle_radius - text_offset, center_x, center_y);
            }
            if (readout){
                this.fi_canvas_context.fillStyle = this.highlight_color;
                this.fi_canvas_context.textAlign = "center";
                this.fi_canvas_context.textBaseline = "middle";
                this.fi_canvas_context.font = radius * .2 + "px Courier New";
                this.fi_canvas_context.fillText(tick_velocity, text_x, text_y);
            }
        }
        this.fi_canvas_context.stroke();

        this.draw_spiral(center_x, center_y, radius, 0, Math.PI, this.highlight_color, 0);
        this.draw_spiral(center_x, center_y, half_spiral_radius, Math.PI, 2 * Math.PI, "green", 0.5);
        this.draw_spiral(center_x, center_y, radius * 2/3, 2 * Math.PI, 2.5 * Math.PI, "yellow", 0);
        this.draw_spiral(center_x, center_y, radius * 2/3, 2.5 * Math.PI, 2.615 * Math.PI, "red", 0);
        this.fi_canvas_context.stroke();

    }

    draw_velocity_dial = (center_x, center_y, radius, velocity_ms, velocity_ne = 260)  => {
        const velocity_kmh = velocity_ms * 3.6;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.strokeStyle = this.dial_color;
        this.fi_canvas_context.lineWidth = 4;
        const angle_of_dial = 2.6 * Math.PI * velocity_kmh / velocity_ne;
        const [dial_end_x, dial_end_y] = this.angle_to_dial_cartesian(angle_of_dial, radius, center_x, center_y);

        this.fi_canvas_context.moveTo(center_x, center_y);
        this.fi_canvas_context.lineTo(dial_end_x, dial_end_y);
        this.fi_canvas_context.stroke();
    }

    draw_timer = (center_x, center_y, width, timer_value) => {
        this.fi_canvas_context.fillStyle = this.base_color;
        this.fi_canvas_context.beginPath();
        const height = 0.3 * width;
        this.fi_canvas_context.roundRect(center_x - width/2, 
                                         center_y - height/2, 
                                         width, 
                                         height, standard_radius);
        this.fi_canvas_context.fill();
        const total_seconds = Math.floor(timer_value / 1000) % 86400;
        const hours = Math.floor(total_seconds / 3600);
        const minutes = Math.floor(total_seconds / 60) - (hours * 60);
        const seconds = total_seconds - ((minutes * 60) + (hours * 3600));
        console.log(hours, minutes, seconds)

        const hours_str = String(hours).padStart(2, '0');
        const minutes_str = String(minutes).padStart(2, '0');
        const seconds_str = String(seconds).padStart(2, '0');
        const time_str = hours_str + ":" + minutes_str + ":" + seconds_str;

        this.fi_canvas_context.fillStyle = this.highlight_color;
        this.fi_canvas_context.textAlign = "center";
        this.fi_canvas_context.textBaseline = "middle";
        this.fi_canvas_context.font = width * .16 +"px Courier New";
        this.fi_canvas_context.fillText(time_str, center_x, center_y);
        this.fi_canvas_context.stroke()
    }
}




export { FlightInstrument }


const unit = 400;
const dial_spring_const = 0.04;
class FlightInstrument{
    constructor(dom_parent){
        const fi_canvas = document.createElement("canvas");
        dom_parent. appendChild(fi_canvas);
        
        fi_canvas.style.width = "200px";
        fi_canvas.style.height = "200px";
        fi_canvas.width = unit;
        fi_canvas.height = unit;
        fi_canvas.style.position = 'absolute';
        fi_canvas.style.left = '800px';
        fi_canvas.style.top = '0';

        this.dial_speed = 0;
        this.fi_canvas_context = fi_canvas.getContext("2d");
        this.update_instrument(2,1000, 800);
    }
    update_instrument(vertical_speed, msl, agl){
        // Draw outline 
        this.fi_canvas_context.fillStyle = "black";
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.arc(unit/2, unit/2, unit/2, 0, 2 * Math.PI);
        this.fi_canvas_context.fill();
        
        this.dial_speed += dial_spring_const * (vertical_speed - this.dial_speed);
        this.draw_dial(this.dial_speed); 

        // Draw inner 
        this.fi_canvas_context.fillStyle = "black";
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.arc(unit/2, unit/2, unit * 0.4, 0, 2 * Math.PI);
        this.fi_canvas_context.fill();

        this.draw_altitude_readout(msl, agl);
    }

    draw_dial(vertical_speed, min_vs = -3, max_vs = 6){
        //TODO: Draw scale ticks
        this.fi_canvas_context.strokeStyle = "white";
        this.fi_canvas_context.lineWidth = 4;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.moveTo(unit/2,  unit/2);
        this.fi_canvas_context.lineTo(unit/2,  unit);
        this.fi_canvas_context.moveTo(unit/2,  unit/2);
        this.fi_canvas_context.lineTo(unit,  unit/2);
        const angle_of_dial = ((vertical_speed - min_vs) / (max_vs - min_vs)) * 1.5 * Math.PI
        const dial_end_x = -Math.sin(angle_of_dial) * unit/2 + unit/2
        const dial_end_y = Math.cos(angle_of_dial) * unit/2 + unit/2
        this.fi_canvas_context.moveTo(unit/2,  unit/2);
        console.log(dial_end_x,  dial_end_y);
        this.fi_canvas_context.lineTo(dial_end_x,  dial_end_y);
        this.fi_canvas_context.stroke();
    }
    draw_altitude_readout(msl, agl){
        this.fi_canvas_context.fillStyle = "white";
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.roundRect(unit/4, 1/4*unit, unit/2, 1/2 * unit, unit/6)
        this.fi_canvas_context.fill();
        this.fi_canvas_context.fillStyle = "black";
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.textAlign = "right";
        this.fi_canvas_context.textBaseline = "middle";
        this.fi_canvas_context.font = "48px serif";
        this.fi_canvas_context.fillText(agl, .55 * unit, 3/8 * unit);
        this.fi_canvas_context.fillText(msl, .55 * unit, 5/8 * unit);
        this.fi_canvas_context.textAlign = "left";
        this.fi_canvas_context.textBaseline = "top";
        this.fi_canvas_context.font = "24px serif";
        this.fi_canvas_context.fillText("m agl", .55 * unit, 3/8 * unit);
        this.fi_canvas_context.fillText("m msl", .55 * unit, 5/8 * unit);
        this.fi_canvas_context.stroke();
    }
}




export { FlightInstrument }

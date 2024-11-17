const normal_unit = 1000

class Button {
    constructor (center_x, center_y, width, height, text, color, ctx, name, action) {
        this.center_x = center_x ;
        this.center_y = center_y ;
        this.width = width ;
        this.height = height ;
        this.text = text ;
        this.color = color ;
        this.name = name ;
        this.action = action;
        this.ctx = ctx;
    }
    draw_button = () => {
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.rect(this.center_x - this.width/2, 
                      this.center_y - this.height/2,
                      this.width, this.height);
        this.ctx.fill();
        this.ctx.fillStyle = "black";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.font = 30 + "px Courier New";
        this.ctx.fillText(this.text, this.center_x, this.center_y);
    }
    checkClicked = (mouse_x, mouse_y) =>{
        if ((mouse_x > (this.center_x - this.width/2)) &&
            (mouse_x < (this.center_x + this.width/2)) &&
            (mouse_y > (this.center_y - this.height/2)) &&
            (mouse_y < (this.center_y + this.height/2))) {
            this.action();
            return true;
        }
        return false;
    }
}
class Menu {
    constructor(dom_parent,
        width,
        height,
        base_color = "#000000",
        highlight_color = "#e1d9d9",
        highlight_color_2 = "#ffffff",
        panel_color = "#6e6e6e") {

        var fi_canvas = document.createElement("canvas");
        fi_canvas.id = "menu"
        dom_parent.appendChild(fi_canvas);
        this.width = fi_canvas.width = normal_unit;
        this.height = fi_canvas.height = height/width * normal_unit;
        this.canvas_pixel_width = width;
        this.canvas_pixel_height = height;
        
        fi_canvas.style.width = width + "px";
        fi_canvas.style.height = height + "px";
        fi_canvas.style.position = "absolute"

        fi_canvas.style.left = "0px";
        fi_canvas.style.top = "0px";
        this.fi_canvas_context = fi_canvas.getContext("2d");

        this.base_color = base_color;
        this.highlight_color = highlight_color;
        this.panel_color = panel_color;   
        
        this.buttons = {}

        this.fill_background(this.panel_color);


        
    }

    populate_start_menu(){
        const test_button_1 = new Button(400, 400, 200, 100, "Test1", "#ff0000", this.fi_canvas_context, "rob", () => {
            console.log("Button Test 1");
        })
        const test_button_2 = new Button(500, 400, 200, 200, "Test2", "#00ff00", this.fi_canvas_context, "maggie", () => {
            console.log("Button Test 2");
            this.remove_all_buttons()
        })
        this.register_button(test_button_1);
        this.register_button(test_button_2);
    }

    fill_background = (color) => {
        this.fi_canvas_context.fillStyle = color;
        this.fi_canvas_context.beginPath();
        this.fi_canvas_context.rect(0, 0, this.width, this.height);
        this.fi_canvas_context.fill();
    }

    register_button = (button) => {
        this.buttons[button.name] = button;
        button.draw_button();
    }

    remove_button = (name) => {
        delete this.buttons[name];
    }

    remove_all_buttons = () => {
        const button_keys = Object.keys(this.buttons);

        for (const button_name of button_keys){
            delete this.buttons[button_name];
        }
        this.fill_background(this.panel_color);
    }


    onclick = (e) => {
        var rect = e.target.getBoundingClientRect();
        const x_element = e.clientX - rect.left; //x position within the element.
        const y_element = e.clientY - rect.top;  //y position within the element.
        const x_context = (x_element / this.canvas_pixel_width) * normal_unit
        const y_context = (y_element / this.canvas_pixel_height) * (normal_unit * this.height / this.width);

        if (x_context > this.width || y_context > this.height){
            return;
        }
        
        const button_keys_reversed = Object.keys(this.buttons).reverse();

        for (const button_name of button_keys_reversed){
            const in_button = this.buttons[button_name].checkClicked(x_context, y_context);
            if (in_button){
                break;
            }
        }
    }
}

export { Menu }

const normal_unit = 1000
const default_text_color = "#140c0c"
const inaccessible_text_color = "#948c8c"
const standard_radius = 400/6;

class CanvasDomElement {
    constructor(context, width, height, element_width, element_height){
        this.context = context;
        this.width = width;
        this.height = height;
        this.element_width = element_width;
        this.element_height = element_height;
    }
}
class Button {
    constructor (center_x, center_y, width, height, text, color, text_color, ctx, name, action) {
        this.center_x = center_x ;
        this.center_y = center_y ;
        this.width = width ;
        this.height = height ;
        this.text = text ;
        this.color = color ;
        this.text_color = text_color ;
        this.name = name ;
        this.action = action ;
        this.ctx = ctx ;
    }
    draw_button = () => {
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.roundRect(this.center_x - this.width/2, 
                             this.center_y - this.height/2,
                             this.width, this.height,
                             standard_radius/2);
        // check for NaN
        if (this.color != this.color){
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = this.text_color;
            this.ctx.stroke();
        } else {
            this.ctx.fill();
        }

        this.ctx.fillStyle = this.text_color;
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
    constructor(canvas_element) {
        this.canvas_element = canvas_element;
        this.buttons = {};
    }
    build_menu = (menu_context) => {
        throw new Error("Base Class");
    }
    fill_background = (color) => {
        this.canvas_element.context.fillStyle = color;
        this.canvas_element.context.beginPath();
        this.canvas_element.context.rect(0, 0, this.canvas_element.width, this.canvas_element.height);
        this.canvas_element.context.fill();
        this.draw_logo();
    }
    draw_logo = (center_x = 180, center_y = 60) => {
        const width =  300;
        const height = 60;
        this.canvas_element.context.strokeStyle = default_text_color;
        this.canvas_element.context.lineWidth = 4;
        this.canvas_element.context.beginPath();
        this.canvas_element.context.roundRect(center_x - width/2, center_y - height/2, width, height, standard_radius);
        this.canvas_element.context.stroke();
        this.canvas_element.context.fillStyle = default_text_color;
        this.canvas_element.context.textAlign = "center";
        this.canvas_element.context.textBaseline = "middle";
        this.canvas_element.context.font = 30 + "px Courier New";
        this.canvas_element.context.fillText("Micro Soaring", center_x, center_y);

    }
    register_button = (button) => {
        this.buttons[button.name] = button;
        button.draw_button();
    }
    remove_button = (name) => {
        delete this.buttons[name];
    }
    remove_all_buttons = (color) => {
        const button_keys = Object.keys(this.buttons);

        for (const button_name of button_keys){
            delete this.buttons[button_name];
        }
        this.fill_background(color);
    }
    onclick = (e) => {
        var rect = e.target.getBoundingClientRect();
        const x_element = e.clientX - rect.left; //x position within the element.
        const y_element = e.clientY - rect.top;  //y position within the element.
        const x_context = (x_element / this.canvas_element.element_width) * normal_unit
        const y_context = (y_element / this.canvas_element.element_height) * (normal_unit * this.canvas_element.height / this.canvas_element.width);

        if (x_context > this.canvas_element.width || y_context > this.canvas_element.height){
            return;
        }
        
        const button_keys_reversed = Object.keys(this.buttons).reverse();

        for (const button_name of button_keys_reversed){
            const in_button = this.buttons[button_name].checkClicked(x_context, y_context);
            if (in_button){
                // Only execute the function from the most recently registered (top in drawing stack)
                break;
            }
        }
    }
}

class MainMenu extends Menu {
    build_menu = (menu_context, background_color) =>{
        this.fill_background(background_color);
        const single_player_menu = new Button(500, 200, 340, 80, "Single Player", 
                                      NaN, default_text_color, 
                                      this.canvas_element.context, "single", () => {
            menu_context.change_state(new SinglePlayerMenu(this.canvas_element))
        })
        const lobby_menu = new Button(500, 300, 340, 80, "Multiplayer Lobby", 
                                      NaN, inaccessible_text_color, 
                                      this.canvas_element.context, "lobby", () => {
            return
        })
        const settings_menu = new Button(500, 400, 340, 80, "Settings", 
                                      NaN, default_text_color,  
                                      this.canvas_element.context, "settings", () => {
            menu_context.change_state(new SettingsMenu(this.canvas_element))
        })
        this.register_button(single_player_menu);
        this.register_button(lobby_menu);
        this.register_button(settings_menu);
    }
}

class SettingsMenu extends Menu {
    build_menu = (menu_context, background_color) =>{
        this.fill_background(background_color);
        const main_menu_button = new Button(500, 400, 340, 80, "Main Menu", NaN, default_text_color, this.canvas_element.context, "main_menu", () => {
            menu_context.change_state(new MainMenu(this.canvas_element))
        })
        this.register_button(main_menu_button);
    }
}

class CrashedMenu extends Menu {
    constructor(canvas_element, text) {
        super(canvas_element)
        this.crash_text = text;
    }
    build_menu = (menu_context, background_color) =>{
        this.canvas_element.context.clearRect(0, 0, this.canvas_element.width, this.canvas_element.height);
        const crashed_button = new Button(500, 300, 340, 80, this.crash_text, default_text_color, "#ffffff", this.canvas_element.context, "crash", () => {
        })
        const main_menu_button = new Button(500, 400, 340, 80, "Main Menu", default_text_color, "#ffffff", this.canvas_element.context, "main_menu", () => {
            menu_context.change_state(new MainMenu(this.canvas_element))
        })
        this.register_button(main_menu_button);
        this.register_button(crashed_button);
    }
}

class SinglePlayerMenu extends Menu {
    build_menu = (menu_context, background_color) =>{
        this.fill_background(background_color);
        const start_button = new Button(500, 200, 340, 80, 
                                        "Start", NaN, default_text_color, this.canvas_element.context, "rob", () => {
            menu_context.change_state(new HiddenMenu(this.canvas_element))
            menu_context.start();
        })
        const main_menu_button = new Button(500, 300, 340, 80, "Main Menu", NaN, default_text_color, this.canvas_element.context, "main_menu", () => {
            menu_context.change_state(new MainMenu(this.canvas_element))
        })
        this.register_button(start_button);
        this.register_button(main_menu_button);
    }
}

class HiddenMenu extends Menu {
    build_menu = (menu_context, background_color) => {
        this.canvas_element.context.clearRect(0, 0, this.canvas_element.width, this.canvas_element.height);
    }
}

class GameMenu {
    constructor(dom_parent,
        width,
        height,
        base_color = "#000000",
        highlight_color = "#e1d9d9",
        highlight_color_2 = "#ffffff",
        panel_color = "#e7e7e7") {

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
        this.dom_element = new CanvasDomElement(this.fi_canvas_context, this.width, this.height, this.canvas_pixel_width, this.canvas_pixel_height);
        
        this.state = new MainMenu(this.dom_element, this.panel_color);
        this.state.build_menu(this, this.panel_color);
        this.start;
    }
    onclick = (e) => {
        this.state.onclick(e);
    }
    change_state(new_state){
        this.state = new_state;
        this.state.build_menu(this, this.panel_color);
    }
    set_start(start){
        this.start = start;
    }
    crashed = (text) => {
        this.change_state(new CrashedMenu(this.dom_element, text))
    }
}

export { GameMenu }

const normal_unit = 1000
const default_text_color = "#140c0c"
const inaccessible_text_color = "#948c8c"
const standard_radius = 400/6;

const instruction_text = `Controls: 
Arrow keys for direction
Q/A to speed up/slow down
+/- to zoom map
R to reset

Scoring: 
Straight line distance from starting position. 
Timed to 2 mins
(More modes coming soon...)

Advice: 
Thermals are generally found at the
apex of mountains or where steep 
terrain drops to shallow.
Go fast to go far.`

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
    constructor (center_x, center_y, width, height, text, color, text_color, ctx, name, action, outline = false) {
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
        this.outline = outline;
    }
    draw_button = () => {
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.roundRect(this.center_x - this.width/2, 
                             this.center_y - this.height/2,
                             this.width, this.height,
                             standard_radius/2);
        // check for NaN
        const color_is_nan = (this.color != this.color);
        if (color_is_nan || this.outline){
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = this.text_color;
            this.ctx.stroke();
        } 
        if (!color_is_nan){
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


function draw_text_lines (context, text, center_x, start_y) {
    context.fillStyle = default_text_color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = 20 + "px Courier New";

    var y_index = start_y;
    for (const line of text.split("\n")){
        context.fillText(line, center_x, y_index);
        y_index += 20;
    }
}

class Menu {
    constructor(canvas_element) {
        this.canvas_element = canvas_element;
        this.buttons = {};
    }
    build_menu = (menu_context) => {
        throw new Error("Base Class, use one of the derived class");
    }
    fill_background = (color) => {
        this.canvas_element.context.fillStyle = color;
        this.canvas_element.context.beginPath();
        this.canvas_element.context.rect(0, 0, this.canvas_element.width, this.canvas_element.height);
        this.canvas_element.context.fill();
        this.draw_logo();
    }
    draw_logo = (center_x = 150, center_y = 60) => {
        const width =  200;
        const height = 40;
        this.canvas_element.context.strokeStyle = default_text_color;
        this.canvas_element.context.lineWidth = 2;
        this.canvas_element.context.beginPath();
        this.canvas_element.context.roundRect(center_x - width/2, center_y - height/2, width, height, standard_radius);
        this.canvas_element.context.stroke();
        this.canvas_element.context.fillStyle = default_text_color;
        this.canvas_element.context.textAlign = "center";
        this.canvas_element.context.textBaseline = "middle";
        this.canvas_element.context.font = 22 + "px Courier New";
        this.canvas_element.context.fillText("Micro Soaring", center_x, center_y);
        this.canvas_element.context.font = 15 + "px Courier New";
        this.canvas_element.context.fillText("Rob Barlow", center_x - 40, center_y + 40);
    }
    register_button = (button) => {
        this.buttons[button.name] = button;
        button.draw_button();
    }
    remove_button = (name) => {
        if (this.buttons[name]){
            delete this.buttons[name];
            return true;
        }
        return false;
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
                                      NaN, default_text_color, 
                                      this.canvas_element.context, "lobby", () => {
            menu_context.change_state(new MultiplayerMenu(this.canvas_element))
        })
        const instructions_menu = new Button(500, 400, 340, 80, "Instructions", 
                                      NaN, default_text_color, 
                                      this.canvas_element.context, "instructions", () => {
            menu_context.change_state(new InstructionsMenu(this.canvas_element))
        })
        const settings_menu = new Button(500, 500, 340, 80, "Settings", 
                                      NaN, default_text_color,  
                                      this.canvas_element.context, "settings", () => {
            menu_context.change_state(new SettingsMenu(this.canvas_element))
        })
        this.register_button(single_player_menu);
        this.register_button(lobby_menu);
        this.register_button(instructions_menu);
        this.register_button(settings_menu);
    }
}

class EndMenu extends Menu {
    constructor(canvas_element, score, text, clear_function) {
        super(canvas_element)
        this.score = score;
        this.end_text = text;
        this.clear_function = clear_function;
    }
    build_menu = (menu_context, background_color) =>{
        this.canvas_element.context.clearRect(0, 0, this.canvas_element.width, this.canvas_element.height);
        console.log(this.score)
        const score_string = "Score: " + this.score.toFixed(0)
        const score_button = new Button(500, 200, 340, 80, score_string, default_text_color, "#ffffff", this.canvas_element.context, "crash", () => {
        })
        const crashed_button = new Button(500, 300, 800, 80, this.end_text, default_text_color, "#ffffff", this.canvas_element.context, "crash", () => {
        })
        const main_menu_button = new Button(500, 400, 340, 80, "Main Menu", inaccessible_text_color, "#ffffff", this.canvas_element.context, "main_menu", () => {
            this.clear_function();
            menu_context.change_state(new MainMenu(this.canvas_element))
        })
        this.register_button(main_menu_button);
        this.register_button(crashed_button);
        this.register_button(score_button);
    }
}


class SettingsMenu extends Menu {
    build_menu = (menu_context, background_color) =>{
        let settings = menu_context.settings

        this.draw_color_buttons(menu_context, background_color)
    }

    draw_color_buttons = (menu_context, background_color) => {
        const choose_color_button = new Button(500, 400, 340, 80, "Choose Color:", NaN, inaccessible_text_color, this.canvas_element.context, "choose_color_button", () => {});
        const main_menu_button = new Button(500, 600, 340, 80, "Main Menu", NaN, default_text_color, this.canvas_element.context, "main_menu", () => {
            menu_context.change_state(new MainMenu(this.canvas_element))
        })
        this.fill_background(background_color, background_color);

        this.register_button(choose_color_button);
        this.register_button(main_menu_button);
        let settings = menu_context.settings;
        const colors = settings.glider_color_options;
        for (let color_idx = 0; color_idx < colors.length; color_idx++) {
            const button_id = "color_" +color_idx;
            // Remove the buttons if they exist
            this.remove_button(button_id);
            const color = colors[color_idx];
            const is_active_color = (color == settings.glider_color);
            var button_width = 75;
            const button_width_w_padding = button_width + 10;
            const x_width = (colors.length -1) * (button_width_w_padding);
            const x_offset = 500 - (x_width/2) + (button_width_w_padding * color_idx)
            var color_button
            color_button = new Button(x_offset, 500, button_width, button_width, "", color, default_text_color, this.canvas_element.context, button_id, () => {
                settings.glider_color = color
                this.draw_color_buttons(menu_context, background_color);
            }, is_active_color);
            this.register_button(color_button);
        }
        const using_big_terrain = settings.terrain.name == "Big Mountains";
        console.log(using_big_terrain);
        const set_big_terrain = new Button( 500, 200, 340, 80, "Big Terrain", 
                                            (using_big_terrain ? default_text_color : NaN), 
                                            (using_big_terrain ? inaccessible_text_color : default_text_color),
                                            this.canvas_element.context, "big_terrain", () => {
            settings.load_map("./assets/maps/big_ranges", "Big Mountains");
            this.draw_color_buttons(menu_context, background_color);
        })
        const set_little_terrain = new Button(  500, 300, 340, 80, "Little Terrain", 
                                                (using_big_terrain? NaN : default_text_color), 
                                                (using_big_terrain ? default_text_color : inaccessible_text_color),
                                                this.canvas_element.context, "little_terrain", () => {
            settings.load_map("./assets/maps/little_ranges", "Little Mountains");
            this.draw_color_buttons(menu_context, background_color);
        });        
        this.register_button(set_big_terrain);
        this.register_button(set_little_terrain);
    }
}

class SinglePlayerMenu extends Menu {
    build_menu = (menu_context, background_color) =>{
        this.fill_background(background_color);
        var setup_text = "Glider: " + menu_context.settings.glider_model.model_name + "\n"
        setup_text += "Terrain: " + menu_context.settings.terrain.name + "\n"
        setup_text += "(Change these in the Settings Menu)"
        
        draw_text_lines(this.canvas_element.context, setup_text, 500, 100);

        const loading_button = new Button(500, 400, 1000, 80, 
                                        "Still loading maps, try again in a moment or two", NaN, inaccessible_text_color, this.canvas_element.context, "start", () => {               
        })
        const start_button = new Button(500, 200, 340, 80, 
                                        "Start", NaN, default_text_color, this.canvas_element.context, "start", () => {
            if (menu_context.start()){
                menu_context.change_state(new HiddenMenu(this.canvas_element))
            } else {
                this.register_button(loading_button)
            }               
        })
        const main_menu_button = new Button(500, 300, 340, 80, "Main Menu", NaN, default_text_color, this.canvas_element.context, "main_menu", () => {
            menu_context.change_state(new MainMenu(this.canvas_element))
        })
        this.register_button(start_button);
        this.register_button(main_menu_button);
    }
}


class MultiplayerMenu extends Menu {
    build_menu = (menu_context, background_color) =>{
        this.fill_background(background_color);
        var multiplayer_client = menu_context.multiplayer_client;
        var settings = menu_context.settings;

        const loading_button = new Button(500, 200, 340, 80, 
            "loading...", NaN, inaccessible_text_color, this.canvas_element.context, "loading", () => {})
        this.register_button(loading_button)
        multiplayer_client.open_connection()

        // wait for websocket connection attempt
        setTimeout(() => {
            this.remove_button("loading")
            if (!multiplayer_client.server_connected){

                this.fill_background(background_color);
                const error_button = new Button(500, 200, 900, 80, 
                    "Could not connect to server. Try again later", NaN, inaccessible_text_color, this.canvas_element.context, "can't join", () => {})
                
                const main_menu_button = new Button(500, 300, 340, 80, "Main Menu", NaN, default_text_color, this.canvas_element.context, "main_menu", () => {
                    menu_context.change_state(new MainMenu(this.canvas_element))
                })
                this.register_button(error_button)
                this.register_button(main_menu_button)
                return
            }
            multiplayer_client.send_join_message("Rob" + new Date().getSeconds(), settings.glider_color);
            this.render_wait_menu(menu_context, background_color)
        }, 100);
    }

    render_wait_menu = (menu_context, background_color) => {
        this.fill_background(background_color);
        this.clear = false;
        var multiplayer_client = menu_context.multiplayer_client

        var setup_text = "Connected Players: " + Object.keys(multiplayer_client.multiplayer_gliders.gliders).length
        
        draw_text_lines(this.canvas_element.context, setup_text, 500, 100);
        const main_menu_button = new Button(500, 300, 340, 80, "Main Menu", NaN, default_text_color, this.canvas_element.context, "main_menu", () => {
            menu_context.change_state(new MainMenu(this.canvas_element))
            multiplayer_client.close_connection();
            this.clear = true;
        })
        this.register_button(main_menu_button)

        setTimeout(() => {
            if (this.clear){
                return
            }
            this.remove_all_buttons()
            this.render_wait_menu(menu_context, background_color)
        }, 100)
    }
}

class InstructionsMenu extends Menu {
    build_menu = (menu_context, background_color) =>{
        this.fill_background(background_color);
        draw_text_lines(this.canvas_element.context, instruction_text, 500, 100);
        const main_menu_button = new Button(500, 500, 340, 80, "Main Menu", NaN, default_text_color, this.canvas_element.context, "main_menu", () => {
            menu_context.change_state(new MainMenu(this.canvas_element))
        })
        this.register_button(main_menu_button);
    }
}

class HiddenMenu extends Menu {
    build_menu = (menu_context, background_color) => {
        this.canvas_element.context.clearRect(0, 0, this.canvas_element.width, this.canvas_element.height);
        this.draw_logo();
    }
}

class MenuContainer {
    constructor(dom_parent,
        width,
        height,
        settings,
        multiplayer_client,
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
        
        this.settings = settings
        this.multiplayer_client = multiplayer_client

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

    crashed = (score, text, clear_function) => {
        this.change_state(new EndMenu(this.dom_element, score, text, clear_function))
    }
}

export { MenuContainer, Menu}

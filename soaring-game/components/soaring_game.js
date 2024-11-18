import { World, createDirectionalLight } from "./world.js"
import { create_terrain_mesh } from "./terrain_tools.js"
import { FlightInstrument } from "./flight_instrument.js"
import { Glider } from "./glider.js"
import { MenuContainer } from "./menu.js"


const camera_x_offset = 10;
const camera_y_offset = 10;
const camera_z_offset = 10;
const camera_spring_constant = 0.05;

// const starting_position = [150, 150, 4];
const height_scaling_factor = 1.5;

const glide_polar_js3 = {
    80: -0.7,
    90: -0.67,
    100: -0.65,
    110: -0.65,
    120: -0.67,
    130: -0.70,
    140: -0.75,
    150: -0.82,
    160: -0.95,
    170: -1.07,
    180: -1.2,
    190: -1.34,
    200: -1.5,
    210: -1.7,
    220: -1.93,
    230: -2.2,
    240: -2.5,
    250: -2.85,
    260: -3.4
}
const velocity_ne = 260;

const light_position = [-10, 10, 30]

class SoaringGame {
    constructor(dim_x,
        dim_y,
        starting_position,
        height_map,
        thermal_map,
        ) {

        // Look for window div and set its width 
        this.game_window_div = document.getElementById("game_window");
        this.game_window_div.style.width = dim_x + "px";

        this.dim_x = dim_x;
        this.dim_y = dim_y;

        // Setup member variables
        this.height_map = height_map;
        this.thermal_map = thermal_map;
        this.starting_position = starting_position;
        this.world_start_time = new Date().getTime();
        this.reset = false;
        
        // Create the Menu system
        this.menu = new MenuContainer (this.game_window_div, dim_x, dim_y);
        this.menu.set_start(this.start);
        
        // register DOM event functions
        this.latest_event = "";
        this.register_event_functions();
    }

    set_terrain_mesh = (height_map, thermal_map, scaling_factor) => {
        this.height_map = height_map;
        this.thermal_map = thermal_map;
        var terrain = create_terrain_mesh(height_map, scaling_factor);
        terrain.name = "terrain_mesh";
        this.world.scene.add(terrain);
    }
    remove_terrain_mesh = () => {
        const terrain_object = this.world.scene.getObjectByName("terrain_mesh");
        this.world.scene.remove(terrain_object);
    }
    // Update the camera's positon 
    move_camera_to_follow_object = (object_position) => {
        this.world.camera.position.y += camera_spring_constant * ((object_position.y - camera_y_offset) - this.world.camera.position.y);
        this.world.camera.position.x += camera_spring_constant * ((object_position.x - camera_x_offset) - this.world.camera.position.x);
        this.world.camera.position.z += camera_spring_constant * ((object_position.z + camera_z_offset) - this.world.camera.position.z);
    }

    register_event_functions = () => {
        // Setup an event queue with a length of one ;) 
        onkeydown = onkeyup = (e) => {
            if (e.type == 'keydown') {
                this.latest_event = e.key;
            } else if (e.type == 'keyup') {
                if (e.key == "r"){
                    this.reset = true;
                } else if (e.key == this.latest_event){
                    this.latest_event = "";
                }
            }
        }
        onclick = (e) => {
            this.menu.state.onclick(e);
        }
    }

    end_popup = () => {
        const end = document.createElement("div");
        document.body.appendChild(end);

        end.style.width = "300px";
        end.style.height = "100px";
        end.style.position = 'absolute';
        end.style.backgroundColor = 'white';
        end.style.top = '400px';
        end.style.left = '400px';
        if (this.user_glider.crashed) { end.innerText = "Crashed....\n"; }
        else if (this.user_glider.flutter) { end.innerText = "Fluttered....\n"; }
        else if (this.user_glider.stalled) { end.innerText = "Stalled....\n"; }
        else { end.innerText = "Time's Up \n"; }

        end.innerText += "Distance Flow: " + (x_dist + y_dist).toFixed();
    }

    check_end_criteria = () => {
        const elapsed_millis = new Date().getTime() - this.world_start_time;
        const elapsed_s = elapsed_millis / 1000;

        if (this.user_glider.crashed || this.user_glider.flutter || this.user_glider.stalled || (elapsed_s > 120) || this.reset) {
            console.log("End criteria met");
            this.world.stop();
            var end_text;
            if (this.user_glider.crashed){
                end_text = "Crashed..."
            } else if (this.user_glider.flutter){
                end_text = "Fluttered..."
            } else if (this.user_glider.stalled){
                end_text = "Staled..."
            } else if (this.reset){
                end_text = "Reset"
                this.reset = false;
            } else if (elapsed_s > 120) {
                end_text = "Great Job"
            }
            const score = this.score();
            this.menu.crashed(score, end_text, this.clear);
        }
    }

    score = () => {
        const x_dist = Math.abs(this.starting_position[0] - this.user_glider.position.x);
        const y_dist = Math.abs(this.starting_position[1] - this.user_glider.position.y);
        const score = (x_dist + y_dist);
        return score;
    }

    update_countdown_timer = () =>{
        return
    }

    register_tick_functions = () => {
        this.world.register_tick_function((tick, dt) => {
            const remaining_seconds = Math.round((new Date().getTime() - this.world_start_time) / 1000)
            if (remaining_seconds < 3){
                this.begin_flight = false
                this.update_countdown_timer(remaining_seconds);
            } else {
                this.begin_flight = true;
                this.world.remove_tick_function("countdown_timer");
                this.world_start_time = new Date().getTime();
            }
        }, "countdown_timer");
        // Update glider
        this.world.register_tick_function((tick, dt) => {
            if (!this.begin_flight){
                return;
            }
            this.user_glider.update(tick,
                dt,
                this.latest_event,
                this.height_map,
                this.thermal_map)
        }, "glider_update");
        // Update flight instrument from glider position
        this.world.register_tick_function((tick, dt) => {
            var start_time = this.world_start_time;
            if (!this.begin_flight){
                start_time = new Date().getTime();
            }
            this.flight_instrument.update_instrument(this.user_glider.velocity.z,
                this.user_glider.position.z,
                this.user_glider.agl, 
                this.user_glider.airspeed, 
                (start_time + 120000) - new Date().getTime() )
        }, "update_instrument");

        // Move the camera to follow the glider positon
        this.world.register_tick_function((tick, dt) => {
            this.move_camera_to_follow_object(this.user_glider.position)
        }, "follow_user_glider");


        this.world.register_tick_function((tick, dt) => {
            this.check_end_criteria();
        }, "check_end_criteria");
    }

    start = () => {
        this.world_start_time = new Date().getTime();

        // Create the "world"
        this.world = new World(this.game_window_div,
            this.dim_x,
            this.dim_y,
            camera_x_offset,
            camera_y_offset);
        
        // Set initial camera position
        this.world.camera.position.x = this.starting_position[0] - camera_x_offset;
        this.world.camera.position.y = this.starting_position[1] - camera_y_offset;
        this.world.camera.position.z = this.starting_position[2] + camera_z_offset;
        
        // Create flight instrument
        this.flight_instrument = new FlightInstrument(this.game_window_div, this.dim_x);

        // Create the glider object
        this.user_glider = new Glider(this.starting_position, glide_polar_js3, velocity_ne, height_scaling_factor);

        // Add a light to the world
        this.light = createDirectionalLight(light_position);

        // Add glider and light to world scene
        this.world.scene.add(this.light, this.user_glider.mesh, this.user_glider.line);

        // Create the terrain. (This adds the mesh to the scene so no need to add it to the scene)
        this.set_terrain_mesh(this.height_map, this.thermal_map, height_scaling_factor);

        // register world tick functions
        this.register_tick_functions();

        // Start the world
        this.world.start();
    }
    stop = () => {
        this.world.stop();
    }
    clear = () => {
        const game_canvas = document.getElementById("game_canvas");
        const flight_instrument = document.getElementById("flight_instrument");
        game_canvas?.remove();
        flight_instrument?.remove();
    }
    remove_tick_function = (name) => {
        this.world.remove_tick_function(name)
    }
}

export { SoaringGame }

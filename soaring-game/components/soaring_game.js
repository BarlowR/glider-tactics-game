import { World, createDirectionalLight } from "./world.js"
import { create_terrain_mesh } from "./terrain_tools.js"
import { FlightInstrument } from "./flight_instrument.js"
import { Glider } from "./glider.js"


const camera_x_offset = 10;
const camera_y_offset = 10;
const camera_z_offset = 10;
const camera_spring_constant = 0.05;

// const starting_position = [150, 150, 4];

const height_scaling_factor = 1.5;

class SoaringGame {
    constructor(dim_x,
        dim_y,
        starting_position,
        height_map,
        thermal_map,
        light_position = [-10, 10, 30]) {

        var game_window_div = document.getElementById("game_window");
        game_window_div.style.width = dim_x + "px";

        this.height_map = height_map;
        this.thermal_map = thermal_map;
        this.starting_position = starting_position;
        this.world_start_time = new Date().getTime();
        this.world = new World(game_window_div,
            dim_x,
            dim_y,
            camera_x_offset,
            camera_y_offset);
        this.flight_instrument = new FlightInstrument(game_window_div, dim_x);
        this.latest_event = "";
        this.reset = false;

        // Set initial camera position
        this.world.camera.position.x = this.starting_position[0] + camera_x_offset;
        this.world.camera.position.y = this.starting_position[1] + camera_y_offset;
        this.world.camera.position.z = this.starting_position[2] + camera_z_offset;

        // Add a light
        this.light = createDirectionalLight(light_position);

        // Make the glider object
        this.user_glider = new Glider(this.starting_position, height_scaling_factor);

        // Add glider and light to scene
        this.world.scene.add(this.light, this.user_glider.mesh, this.user_glider.line);

        console.log(this.user_glider.position.x);

        // Create the terrain. (This adds the mesh to the scene so no need to add it to the scene)
        this.set_terrain_mesh(height_map, thermal_map, height_scaling_factor);

        // register DOM event functions
        this.register_event_functions();

        // register world tick functions
        this.register_tick_functions();
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
            } else if (e.type == 'keyup' && e.key == "r") {
                this.reset = true;
            }
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
        else { end.innerText = "Time's Up \n"; }
        const x_dist = Math.abs(this.starting_position[0] - this.user_glider.position.x);
        const y_dist = Math.abs(this.starting_position[1] - this.user_glider.position.y);
        end.innerText += "Distance Flow: " + (x_dist + y_dist).toFixed();
    }

    check_end_criteria = () => {
        const elapsed_millis = new Date().getTime() - this.world_start_time;
        const elapsed_s = elapsed_millis / 1000;

        if (this.user_glider.crashed || (elapsed_s > 120)) {
            this.end_popup()
            this.world.stop();
        }
    }

    reset_glider_and_camera = (reset_position) => {
        if (this.reset) {
            this.user_glider.position.x = reset_position[0];
            this.user_glider.position.y = reset_position[1];
            this.user_glider.position.z = reset_position[2];
            this.reset = false;
        }
    }

    register_tick_functions = () => {
        // Update glider
        this.world.register_tick_function((tick, dt) => {
            console.log(this.latest_event);
            this.user_glider.update(tick,
                dt,
                this.latest_event,
                this.height_map,
                this.thermal_map)
        }, "glider_update");
        // Update flight instrument from glider position
        this.world.register_tick_function((tick, dt) => {
            this.flight_instrument.update_instrument(this.user_glider.velocity.z,
                this.user_glider.position.z,
                this.user_glider.agl)
        }, "update_instrument");

        // Move the camera to follow the glider positon
        this.world.register_tick_function((tick, dt) => {
            this.move_camera_to_follow_object(this.user_glider.position)
        }, "follow_user_glider");


        this.world.register_tick_function((tick, dt) => {
            this.check_end_criteria();
        }, "check_end_criteria");

        this.world.register_tick_function((tick, dt) => {
            this.reset_glider_and_camera(this.starting_position);
        }, "reset_glider");
    }

    start = () => {
        this.world.start();
    }
    stop = () => {
        this.world.stop();
    }
    remove_tick_function = (name) => {
        this.world.remove_tick_function(name)
    }
}

export { SoaringGame }

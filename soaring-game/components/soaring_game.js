import { World, createDirectionalLight } from "./world.js"
import { FlightInstrument } from "./flight_instrument.js"
import { GliderModel, Glider } from "./glider.js"
import { MenuContainer } from "./menu.js"
import { SettingsManager } from "./settings.js"
import { WorldMap } from "./world_map.js"
import { MultiplayerClient } from "./multiplayer_client.js"

const velocity_ne = 260;

class SoaringGame {
    constructor(dim_x, dim_y) {

        // Look for window div and set its width 
        this.game_window_div = document.getElementById("game_window");
        this.game_window_div.style.width = dim_x + "px";

        this.dim_x = dim_x;
        this.dim_y = dim_y;

        this.user_glider;
        this.multiplayer_gliders = {};
        this.world_map;

        // Create the settings singleton
        this.settings = new SettingsManager();

        this.multiplayer_client = new MultiplayerClient()

        // Setup member variables
        this.starting_position = {x: 0, 
                                 y: 0, 
                                 z: 3}
        this.world_start_time = new Date().getTime();
        this.reset = false;

        // Create the menu system
        this.menu = new MenuContainer(this.game_window_div, dim_x, dim_y, this.settings, this.multiplayer_client);
        this.menu.set_start(this.start);

        // register DOM event functions
        this.latest_event = "";
        this.register_event_functions();

        // Set the glider model
        this.settings.set_glider_model("JS3");

        // load the map
        this.settings.load_map("./assets/maps/big_ranges", "Big Mountains")
    }
    remove_terrain_mesh = () => {
        const terrain_object = this.world.scene.getObjectByName("terrain_mesh");
        this.world.scene.remove(terrain_object);
    }
    // Update the camera's positon 
    camera_to_follow_object = (object_position) => {
        this.world.camera.position.y += this.settings.camera_spring_constant * ((object_position.y - this.settings.camera_y_offset) - this.world.camera.position.y);
        this.world.camera.position.x += this.settings.camera_spring_constant * ((object_position.x - this.settings.camera_x_offset) - this.world.camera.position.x);
        this.world.camera.position.z += this.settings.camera_spring_constant * ((object_position.z + this.settings.camera_z_offset) - this.world.camera.position.z);
    }

    register_event_functions = () => {
        // Setup an event queue with a length of one ;) 
        onkeydown = onkeyup = (e) => {
            if (e.type == 'keydown') {
                this.latest_event = e.key;
            } else if (e.type == 'keyup') {
                if (e.key == "r") {
                    this.reset = true;
                } else if (e.key == this.latest_event) {
                    this.latest_event = "";
                }
            }
        }
        onclick = (e) => {
            this.menu.state.onclick(e);
        }
    }

    single_player_end = () => {
        const elapsed_millis = new Date().getTime() - this.world_start_time;
        const elapsed_s = elapsed_millis / 1000;
        return (elapsed_s > 120);
    }

    check_end_criteria = () => {
        const single_player_finished = this.single_player_end();
        if (this.user_glider.crashed || 
            this.user_glider.flutter || 
            this.user_glider.stalled || 
            (single_player_finished && !this.multiplayer_client.server_connected) || 
            this.reset) {
            console.log("End criteria met");
            this.world.stop();
            var end_text;
            if (this.user_glider.crashed) {
                end_text = "Crashed! Proximity flying is dangerous"
            } else if (this.user_glider.flutter) {
                end_text = "Fluttered! Airspeed too high"
            } else if (this.user_glider.stalled) {
                end_text = "Stalled! Airspeed too low"
            } else if (this.reset) {
                end_text = "Pilot Reset (Don't try this in real life)"
                this.reset = false;
            } else if (single_player_finished) {
                end_text = "Complete, Great Job!"
            }
            var score = this.score();
            if (this.multiplayer_client.server_connected){
                score = this.multiplayer_client.multiplayer_gliders.gliders[this.multiplayer_client.id].score 
            }
            this.menu.crashed(score, end_text, this.clear, this.multiplayer_client.server_connected);
        }
    }

    score = () => {
        const x_dist = Math.abs(this.starting_position.x - this.user_glider.dynamics.position.x);
        const y_dist = Math.abs(this.starting_position.y - this.user_glider.dynamics.position.y);
        const score = (x_dist + y_dist);
        return score;
    }

    update_countdown_timer = () => {
        return
    }

    register_tick_functions = () => {
        this.world.register_tick_function((tick, dt) => {
            const remaining_seconds = Math.round((new Date().getTime() - this.world_start_time) / 1000)
            if (remaining_seconds < 3) {
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
            if (!this.begin_flight) {
                return;
            }
            this.user_glider.update(tick,
                dt,
                this.latest_event,
                this.settings.terrain.height_map,
                this.settings.terrain.thermal_map)
        }, "glider_update");
        // Update flight instrument from glider position
        this.world.register_tick_function((tick, dt) => {
            var start_time = this.world_start_time;
            if (!this.begin_flight) {
                start_time = new Date().getTime();
            }

            var time_to_display
            if (this.multiplayer_client.server_connected){
                time_to_display = this.multiplayer_client.multiplayer_gliders.server_time
            } else {
                time_to_display = (start_time + 120000) - new Date().getTime()
            }
            this.flight_instrument.update_instrument(this.user_glider.dynamics.velocity.z,
                this.user_glider.dynamics.position.z,
                this.user_glider.agl,
                this.user_glider.dynamics.airspeed,
                time_to_display)
        }, "update_instrument");

        this.world.register_tick_function((tick, dt) => {
            this.world_map.update_world_map(this.user_glider.dynamics.position,
                                            this.latest_event);
        }, "update_world_map");

        // Move the camera to follow the glider positon
        this.world.register_tick_function((tick, dt) => {
            this.camera_to_follow_object(this.user_glider.dynamics.position)
        }, "follow_user_glider");


        this.world.register_tick_function((tick, dt) => {
            this.check_end_criteria();
        }, "check_end_criteria");

        if (this.multiplayer_client.server_connected){
            this.world.register_tick_function((tick, dt) => {  
                this.multiplayer_client.send_dynamics_message(this.user_glider.dynamics)
                if (this.multiplayer_client.multiplayer_gliders.game_state == 2){
                    this.stop()
                    this.clear()
                    this.remove_tick_function("update_multiplayer_gliders")
                    this.menu.multiplayer_end()
                } 
                this.update_multiplayer_gliders(tick);
            }, "update_multiplayer_gliders")
        }
    }
    update_multiplayer_gliders = (tick) => {
        var multiplayer_gliders = this.multiplayer_client.multiplayer_gliders.gliders
        for (const glider_id in multiplayer_gliders){
            if (glider_id in this.multiplayer_gliders && glider_id != this.multiplayer_client.id){
                var multiplayer_glider = multiplayer_gliders[glider_id]
                this.multiplayer_gliders[glider_id].dynamics = multiplayer_glider.dynamics
                this.multiplayer_gliders[glider_id].update_position(multiplayer_glider.dynamics.position)
                this.multiplayer_gliders[glider_id].update_sprite(tick)
            } 
        }
    }
    start = () => {
        if (!(this.settings.terrain.loaded_thermal_map && this.settings.terrain.loaded_height_map && this.settings.terrain.mesh_created)) {
            return false
        }
        this.world_start_time = new Date().getTime();

        // Create the "world"
        this.world = new World(this.game_window_div,
            this.dim_x,
            this.dim_y,
            this.settings.camera_x_offset,
            this.settings.camera_y_offset);
            
        if (this.multiplayer_client.server_connected){
            
            var multiplayer_gliders = this.multiplayer_client.multiplayer_gliders.gliders
            for (const glider_id in multiplayer_gliders){
                if (glider_id == this.multiplayer_client.id){
                    continue
                }
                console.log(glider_id)
                var multiplayer_glider = multiplayer_gliders[glider_id]
                this.multiplayer_gliders[glider_id] = new Glider(this.starting_position, multiplayer_glider.model, multiplayer_glider.color, velocity_ne, this.settings.height_scaling_factor);
                this.world.scene.add(this.multiplayer_gliders[glider_id].mesh, this.multiplayer_gliders[glider_id].line)
            }
            this.starting_position.x = this.multiplayer_client.multiplayer_gliders.starting_position.x
            this.starting_position.y = this.multiplayer_client.multiplayer_gliders.starting_position.y
        } else {
            this.starting_position.x = this.settings.terrain.height_map.length / 2 + (this.settings.terrain.height_map.length / 4 * (Math.random() - 0.5));
            this.starting_position.y = this.settings.terrain.height_map[0].length / 2 + (this.settings.terrain.height_map[0].length / 4 * (Math.random() - 0.5));
        }
            
        // Set initial camera position
        this.world.camera.position.x = this.starting_position.x - this.settings.camera_x_offset;
        this.world.camera.position.y = this.starting_position.y - this.settings.camera_y_offset;
        this.world.camera.position.z = this.starting_position.z + this.settings.camera_z_offset;

        // Create flight instrument
        this.flight_instrument = new FlightInstrument(this.game_window_div, this.dim_x);

        // Create the glider object
        this.user_glider = new Glider(this.starting_position, this.settings.glider_model, this.settings.glider_color, velocity_ne, this.settings.height_scaling_factor);

        this.world_map = new WorldMap(this.game_window_div, this.dim_x, this.dim_y, this.starting_position, this.settings.terrain.color_map, this.settings)
        // Add a light to the world
        this.light = createDirectionalLight(this.settings.light_position);

        // Add everything to the scene
        this.world.scene.add(this.light, this.user_glider.mesh, this.user_glider.line, this.settings.terrain.mesh)

        // register world tick functions
        this.register_tick_functions();

        // Start the world
        this.world.start();
        return true
    }
    stop = () => {
        this.world.stop();
    }
    clear = () => {
        this.stop()
        const game_canvas = document.getElementById("game_canvas");
        const flight_instrument = document.getElementById("flight_instrument");
        const world_map = document.getElementById("world_map");
        game_canvas?.remove();
        flight_instrument?.remove();
        world_map?.remove();
    }
    remove_tick_function = (name) => {
        this.world.remove_tick_function(name)
    }
}

export { SoaringGame }

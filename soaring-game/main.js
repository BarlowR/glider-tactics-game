import { World, createDirectionalLight } from "./components/world.js"
import { create_terrain_mesh } from "./components/terrain_tools.js"
import { heightmap_const, thermalmap_const } from "./components/maps.js"
import { FlightInstrument } from "./components/flight_instrument.js"
import { Glider } from "./components/glider.js"

const dim_x = 1000;
const dim_y = 800;

const camera_x_offset = 10;
const camera_y_offset = 10;
const camera_z_offset = 10;
const camera_spring_constant = 0.05;

const starting_position = [150, 150, 4];

const height_scaling_factor = 1.5;

function main(){
    var world = new World(document.body, 
                          dim_x, 
                          dim_y,
                          camera_x_offset,
                          camera_y_offset);

    var flight_instrument = new FlightInstrument(document.body);
    
    world.camera.position.x = starting_position[0]
    world.camera.position.y = starting_position[1]

    // Add a light
    var light = createDirectionalLight([-10, 10, 15]);

    // Create the terrain
    // TODO: pull this from server
    const terrain = create_terrain_mesh(heightmap_const, height_scaling_factor);

    // Make the glider object
    var glider = new Glider(starting_position, height_scaling_factor);

    // Add meshes to the scene
    world.scene.add(light, terrain, glider.mesh, glider.line);

    // Setup an event queue with a length of one ;) 
    var latest_event = ""; 
    onkeydown = onkeyup = function(e){
        if (e.type == 'keydown'){
            latest_event = e.key;
        }
    }

    // Update the camera's positon 
    function move_camera_to_follow_object(object_position){
        world.camera.position.y += camera_spring_constant * ((object_position.y - camera_y_offset) - world.camera.position.y);
        world.camera.position.x += camera_spring_constant * ((object_position.x - camera_x_offset) - world.camera.position.x);
        world.camera.position.z += camera_spring_constant * ((object_position.z + camera_z_offset) - world.camera.position.z);
    }

    world.register_tick_function(function(tick, dt){glider.update(tick, dt, latest_event, heightmap_const, thermalmap_const)}, 0);
    world.register_tick_function(function(tick, dt){flight_instrument.update_instrument(glider.velocity.z, 
        (glider.position.z * 100).toFixed(0) * 10,
        (glider.agl * 100).toFixed(0) * 10)}, 2);
    world.register_tick_function(function(tick, dt){move_camera_to_follow_object(glider.position)}, 5);
    world.register_tick_function(function(tick, dt){
        if (glider.crashed || (tick > 10000)){
            const end = document.createElement("div");
            document.body.appendChild(end);
            
            end.style.width = "300px";
            end.style.height = "100px";
            end.style.position = 'absolute';
            end.style.backgroundColor = 'white';
            end.style.top = '400px';
            end.style.left = '400px';
            if (glider.crashed) { end.innerText = "Crashed....\n"; }
            else { end.innerText = "Time's Up \n"; }
            const x_dist = Math.abs(starting_position[0] - glider.position.x);
            const y_dist = Math.abs(starting_position[1] - glider.position.y);
            end.innerText += "Distance Flow: " + (x_dist + y_dist).toFixed();
            world.stop();
        }
    }, 6);
    

    world.start();
}

window.addEventListener('load', main)

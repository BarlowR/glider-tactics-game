import { World, createDirectionalLight } from "./components/world.js"
import { create_terrain_mesh, heightmap_const } from "./components/terrain_tools.js"
import { Glider } from "./components/glider.js"

const dim_x = 1000;
const dim_y = 800;

const camera_x_offset = 10;
const camera_y_offset = 10;
const camera_z_offset = 10;
const camera_spring_constant = 0.05;

function main(){
    var world = new World(document.body, 
                          dim_x, 
                          dim_y,
                          camera_x_offset,
                          camera_y_offset);

    // Add a light
    var light = createDirectionalLight([-10, 10, 15]);

    // Create the terrain
    // TODO: pull this from server
    const terrain = create_terrain_mesh(heightmap_const);

    // Make the glider object
    var glider = new Glider();

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

    world.register_tick_function(function(tick){glider.check_latest_action(latest_event, tick)});
    world.register_tick_function(function(tick){glider.lift_and_sink(heightmap_const, heightmap_const)});
    world.register_tick_function(function(tick){glider.move()});
    world.register_tick_function(function(t){move_camera_to_follow_object(glider.position)});
    world.start();
}

window.addEventListener('load', main)

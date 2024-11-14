import { SoaringGame } from "./components/soaring_game.js"
import { heightmap_const, thermalmap_const } from "./components/maps.js"


const dim_x = 1200;
const dim_y = 800;

const camera_x_offset = 10;
const camera_y_offset = 10;
const camera_z_offset = 10;
const camera_spring_constant = 0.05;

const starting_position = [150, 150, 4];

const height_scaling_factor = 1.5;

function main(){
    var soaring_game = new SoaringGame( dim_x,
                                    dim_y,
                                    starting_position,
                                    heightmap_const,
                                    thermalmap_const)
    soaring_game.start();
}

window.addEventListener('load', main)

import { SoaringGame } from "./components/soaring_game.js"
import { heightmap_const, thermalmap_const } from "./components/maps.js"


const dim_x = 1200;
const dim_y = 800;
const starting_position = [250, 250, 4];

function main() {
    var soaring_game = new SoaringGame(dim_x,
        dim_y,
        starting_position,
        heightmap_const,
        thermalmap_const)
}

window.addEventListener('load', main)

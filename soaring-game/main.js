import { SoaringGame } from "./components/soaring_game.js"
import { heightmap_const, thermalmap_const } from "./components/little_ranges.js"


const dim_x = 1200;
const dim_y = 800;

function main() {
    var soaring_game = new SoaringGame(dim_x,
        dim_y,
        heightmap_const,
        thermalmap_const)
}

window.addEventListener('load', main)

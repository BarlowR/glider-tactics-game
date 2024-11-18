import { SoaringGame } from "./components/soaring_game.js"


const dim_x = 1200;
const dim_y = 800;

function main() {
    var soaring_game = new SoaringGame(dim_x,
                                       dim_y)
}

window.addEventListener('load', main)

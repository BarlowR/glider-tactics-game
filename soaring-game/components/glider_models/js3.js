import { GliderModel } from "../glider.js"
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

const JS3 = new GliderModel("JS3", glide_polar_js3, "./assets/toyplane/");


export { JS3 }

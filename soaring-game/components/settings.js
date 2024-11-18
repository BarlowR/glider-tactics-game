import { GliderModel } from "./glider.js"

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

class SettingsManager {
    constructor() {
        if (SettingsManager._instance) {
            throw new Error("SettingManager should be a singleton and shouldn't be instantiated more than once.")
        }
        SettingsManager._instance = this;
        this.glider_model;
        this.terrain = {name : "",
                        height_map : [[]],
                        loaded_height_map : false,
                        thermal_map : [[]],
                        loaded_thermal_map : false,
        };
        this.height_scaling_factor = 1.5;
        this.light_position = [-10, 10, 30];
        this.camera_x_offset = 10;
        this.camera_y_offset = 10;
        this.camera_z_offset = 10;
        this.camera_spring_constant = 0.05;

    }
    set_glider_model = (model_name) =>{
        if (model_name == "JS3"){
            this.glider_model = new GliderModel("JS3", glide_polar_js3, "./assets/toyplane/");
        } else {
            throw new Error("Unknown glider model");
        }
    }
    set_height_map = (height_map) =>{
        this.terrain.height_map = height_map 
        this.terrain.loaded_height_map = true;
    }
    set_thermal_map = (thermal_map) =>{
        this.terrain.thermal_map = thermal_map 
        this.terrain.loaded_thermal_map = true;
    }
    load_map = (folder, name) => {
        this.terrain.name = name;
        fetch(folder + '/height_map.json')
            .then((response) => response.json())
            .then((response_json) => {
                this.set_height_map(response_json)
                console.log("Loaded Height Map from " + folder);
            });
        fetch(folder + '/thermal_map.json')
            .then((response) => response.json())
            .then((response_json) => {
                this.set_thermal_map(response_json)
                console.log("Loaded Thermal Map from " + folder);
            });
    }
  }


  export {SettingsManager}

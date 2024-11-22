import { JS3 } from "./glider_models/js3"
class SettingsManager {
    constructor() {
        if (SettingsManager._instance) {
            throw new Error("SettingManager shouldn't be instantiated more than once.")
        }
        SettingsManager._instance = this;
        this.glider_model;
        this.terrain = {
            name: "",
            height_map: [[]],
            loaded_height_map: false,
            thermal_map: [[]],
            loaded_thermal_map: false,
        };
        this.height_scaling_factor = 1.5;
        this.light_position = [-10, 10, 30];
        this.camera_x_offset = 10;
        this.camera_y_offset = 10;
        this.camera_z_offset = 10;
        this.camera_spring_constant = 0.05;
        this.glider_color_options = ["#fe0101", "#2982ff", "#a8ff94", "#7f00ad"];
        this.glider_color = this.glider_color_options[0];
    }
    set_glider_model = (model_name) => {
        if (model_name == "JS3") {
            this.glider_model = JS3
        } else {
            throw new Error("Unknown glider model");
        }
    }
    set_height_map = (height_map) => {
        this.terrain.height_map = height_map
        this.terrain.loaded_height_map = true;
    }
    set_thermal_map = (thermal_map) => {
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

export { SettingsManager }

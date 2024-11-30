import { create_jS3 } from "./glider_models/js3"
import { height_map_to_color_map } from "./terrain_tools.js"
import { create_terrain_mesh } from "./terrain_tools.js"

const CONFIG_NOT_LOADED = -1
const USE_ONLINE_SERVER = 0
const USE_LOCAL_SERVER = 1

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
            color_map: [[]],
            loaded_color_map: false,
        };
        this.height_scaling_factor = 1.5;
        this.light_position = [-10, 10, 30];
        this.camera_x_offset = 10;
        this.camera_y_offset = 10;
        this.camera_z_offset = 10;
        this.camera_spring_constant = 0.05;
        this.initial_zoom_level = 50
        this.glider_color_options = ["#fe0101", "#2982ff", "#a8ff94", "#7f00ad"];
        this.glider_color = this.glider_color_options[0];
        this.use_local_server = CONFIG_NOT_LOADED
        this.load_config()
    }
    set_glider_model = (model_name) => {
        if (model_name == "JS3") {
            this.glider_model = create_jS3(this.glider_color)
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
    set_color_map = (color_map) => {
        this.terrain.color_map = color_map
        this.terrain.loaded_color_map = true;
    }
    load_map = (folder, name) => {
        this.terrain.name = name;
        fetch(folder + '/height_map.json')
            .then((response) => response.json())
            .then((response_json) => {
                this.set_height_map(response_json)
                console.log("Loaded Height Map from " + folder);
                // Wait to fetch the color map until we have a height map,
                // incase we need to generate the color map from the height map
                this.fetch_color_map(folder)
                // Once we have the height map we can geenrate the terrain mesh
                this.generate_mesh();
            });
        fetch(folder + '/thermal_map.json')
            .then((response) => response.json())
            .then((response_json) => {
                this.set_thermal_map(response_json)
                console.log("Loaded Thermal Map from " + folder);
            });            
    }
    load_config = () => {
        console.log("Loading Config...")
        fetch("config.json")
            .then((response) => response.json())
            .then((response_json) => {
                if (response_json.use_local_server){
                    this.use_local_server = USE_LOCAL_SERVER
                    console.log("Config loaded, using local server")
                } else {
                    this.use_local_server = USE_ONLINE_SERVER
                    console.log("Config loaded, using online server")
                }
            }).catch(e => {
                console.log("No config.json file found, defaulting to local server");
                this.use_local_server = USE_LOCAL_SERVER
            })
    }
    
    generate_mesh(){
        if (this.terrain.loaded_height_map){
            this.terrain.mesh = create_terrain_mesh(this.terrain.height_map, this.height_scaling_factor);
            this.terrain.mesh.name = "terrain_mesh";
            this.terrain.mesh_created = true;
        }
    }

    fetch_color_map = (folder) => {
        fetch(folder + '/color_map.json')
            .then((response) => response.json())
            .then((response_json) => {
                this.set_color_map(response_json)
                console.log("Loaded Color Map from " + folder);
            }).catch(e => {
                const color_map = height_map_to_color_map(this.terrain.height_map);
                this.set_color_map(color_map)
                console.log("No Color Map to load, generated Color Map from Height Map in:" + folder);
            })
    }
}

export { SettingsManager, CONFIG_NOT_LOADED, USE_ONLINE_SERVER, USE_LOCAL_SERVER }

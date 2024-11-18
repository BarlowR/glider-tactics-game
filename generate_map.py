from particle import ThermalParticleDistribution
import generate_terrain
import time
import os
import argparse
import json

def generate_map(dim_x, dim_y, map_type):
    print(f"Beginning Generation")
    start_time = time.time()
    map_layer = None
    thermal_strength = None
    if (map_type == "big_ranges"):
        map_layer = generate_terrain.generate_big_ranges(dim_x, dim_y)
        thermal_strength = 7
    elif (map_type == "little_ranges"):
        map_layer = generate_terrain.generate_little_ranges(dim_x, dim_y)
        thermal_strength = 4
    else: 
        raise Exception("Bad map type specified")
    map_gen_time = time.time()
    elapsed_time = map_gen_time - start_time
    print(f"Map generation took {elapsed_time}s")
    thermals = ThermalParticleDistribution((dim_x * dim_y)/10, map_layer, thermal_strength)
    thermal_distribution_time = time.time()
    elapsed_time = thermal_distribution_time - map_gen_time
    print(f"Distribution took {elapsed_time}s")
    thermals.simulate_particles((0, 0))
    sim_time = time.time()
    elapsed_time = sim_time - thermal_distribution_time
    print(f"Simulation took {elapsed_time}s")
    return(map_layer, thermals)
    

def save_map_file(hm, tm, folder):
    if (not os.path.isdir(folder)):
        os.mkdir(folder)

    with open(os.path.join(folder, "height_map.json"), "w") as f:
        json.dump(hm.tolist(), f)

    with open(os.path.join(folder, "thermal_map.json"), "w") as f:
        json.dump(tm, f)


def build_json_map_file(map_type, dim_x, dim_y, folder):
    map_layer, thermals = generate_map(dim_x, dim_y, map_type)
    save_map_file(map_layer, thermals.thermal_map, folder)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("dim_x", type=int)
    parser.add_argument("dim_y", type=int)
    parser.add_argument("--map_type", default="big_ranges")

    args = parser.parse_args()
    build_json_map_file(args.map_type, args.dim_x, args.dim_y, os.path.join("soaring-game/public/assets/maps", args.map_type))

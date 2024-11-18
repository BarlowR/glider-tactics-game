from particle import ThermalParticleDistribution
import generate_terrain
import time
import os
import argparse

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
    

def save_map_file(hm, tm, file):
    with open(file, "w") as f:
        f.write("const heightmap_const = [")
        for row in hm:
            f.write("[")
            for element in row: 
                f.write(f"{element},")
            f.write("],\n")
        f.write("]\n")
        f.write("const thermalmap_const = [")
        for row in tm:
            f.write("[")
            for element in row: 
                f.write(f"{element},")
            f.write("],\n")
        f.write("]\n")
        f.write("export { heightmap_const, thermalmap_const };")


def build_js_map_file(map_type, dim_x, dim_y, folder):
    map_layer, thermals = generate_map(dim_x, dim_y, map_type)
    save_map_file(map_layer, thermals.thermal_map, os.path.join(folder, f"{map_type}.js"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("dim_x", type=int)
    parser.add_argument("dim_y", type=int)
    parser.add_argument("--map_type", default="big_ranges")

    args = parser.parse_args()
    build_js_map_file(args.map_type, args.dim_x, args.dim_y, "soaring-game/components")

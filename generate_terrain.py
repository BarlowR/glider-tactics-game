import matplotlib.pyplot as plt
import perlin_noise
from particle import ThermalParticleDistribution
import numpy as np
from isometrics import create_iso_lines, xyz_to_iso_xy
from matplotlib.collections import LineCollection
import matplotlib.animation as animation
import random
from enum import Enum


def flatten(terrain, threshold, above = True):
    flattened_terrain = terrain
    for x_index in range(len(terrain)):
        for y_index in range(len(terrain[0])):
            if ((terrain[x_index][y_index] < threshold) and above):
                flattened_terrain[x_index][y_index] = threshold
            elif ((terrain[x_index][y_index] > threshold) and not above):
                flattened_terrain[x_index][y_index] = threshold
    return flattened_terrain

def augment(terrain, function):
    augmented_terrain = terrain
    for x_index in range(len(terrain)):
        for y_index in range(len(terrain[0])):
            augmented_terrain[x_index][y_index] = function(terrain[x_index][y_index])

    return augmented_terrain

def normalize(terrain):
    max_value = 0
    for x_index in range(len(terrain)):
        for y_index in range(len(terrain[0])):
            if (terrain[x_index][y_index] > max_value):
                max_value = terrain[x_index][y_index]
    return (terrain/max_value)

    
def generate_big_ranges(dim_x, dim_y):
    noise_layers = [ 3 * perlin_noise.noise_map(dim_x, dim_y, 1,               z_pos=random.random() * 10), 
                     8 * perlin_noise.noise_map(dim_x, dim_y, 5,  scale_y = 2, z_pos=random.random() * 10), 
                     2 * perlin_noise.noise_map(dim_x, dim_y, 15, scale_y = 5, z_pos=random.random() * 10), 
                     5 * perlin_noise.noise_map(dim_x, dim_y, 20,              z_pos=random.random() * 10)]
    map_layer = np.sum(noise_layers, axis=0)
    map_layer += 2
    map_layer = normalize(map_layer)
    map_layer = flatten(map_layer, 0, above=True)
    # map_layer = augment(map_layer, sigmoid)
    map_layer *= 4
    return map_layer
    

def generate_little_ranges(dim_x, dim_y):
    noise_layers = [10 * perlin_noise.noise_map(dim_x, dim_y, 10, z_pos=random.random() * 10), 
                     4 * perlin_noise.noise_map(dim_x, dim_y, 40, z_pos=random.random() * 10)]
    map_layer = np.sum(noise_layers, axis=0)
    map_layer = normalize(map_layer)
    map_layer = flatten(map_layer, 0, above=True)
    map_layer *= 2
    return map_layer

def generate_lengthwise_ranges(dim_x, dim_y):
    noise_layers = [perlin_noise.noise_map(dim_x, dim_y, 15, scale_y = 4, z_pos=random.random() * 10), 
                    perlin_noise.noise_map(dim_x, dim_y, 30, scale_y = 15, z_pos=random.random() * 10), 
                    perlin_noise.noise_map(dim_x, dim_y, 50, z_pos=random.random() * 10)]
    map_layer = np.sum([noise_layers[0]*10, noise_layers[1]*6, noise_layers[2] * 2], axis=0)
    map_layer = normalize(map_layer)
    map_layer = flatten(map_layer, 0, above=True)
    map_layer = flatten(map_layer, 0, above=True)
    map_layer = augment(map_layer, lambda x: (x*x*x + np.pow(x, 1/3))/2)
    map_layer *= 3
    return map_layer

def sigmoid(x):
    return (1/(1+np.pow(10, -(4*x-2))))
    

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


def main():
    pass

from dataclasses import dataclass
import numpy as np
import unittest 
import random
import time

FRICTION = 0.2
STICKINESS = 0.05    
SEA_LEVEL_PROBABILITY = 0.25
MAX_PROABILITY_CEILING = 3
MAX_THERMAL_STRENGTH = 5

@dataclass
class Particle():
    # Location, Velocity
    position_x: int
    position_y: int

    friction: float = FRICTION
    velocity_x = 0
    velocity_y = 0

    # partical volume
    volume = 10.0
    
    # Volume of sediment 
    sediment = 0.0

    # Particle density
    density = 0.1

    def normal_force(self, heightmap, force = -9.8):
        """ Calculate the gradient of the current position on the given heightmap"""
        normal_x = 0
        normal_y = 0


        # Given a slope with opposite Δ, adjacent s, hypotenuse h and angle θ
        #   |\
        #   | \
        # Δ |  \ h
        #   |   \
        #   |  θ/\
        #   |___|_\
        #      s

        
        # An object on the surface will experience a normal force vector with magnitude
        # Fn = mg * Cos(θ)
        # with a direction perpendicular to the surface
        # The x component of the normal force vector can be found with trig:
        # Fnx = Fn * Sin (θ)
        # Therefore, Fnx can be calculated as 
        # Fnx = mg * Cos(θ) * Sin(θ)
        # For the above trangle, Cos(θ) = d/h and Sin(θ) = x/h
        # so Fnx = mg * s/h * Δ/h and h^2 = s^2 + Δ^2. 
        # Finally, 
        # Fnx = mg * (s * Δ)/(s^s + Δ^2)

        mg = self.density * self.volume * force

        # TODO Clean this up. Is fractional indicies the right way to hold position?

        delta_x, delta_y = 0, 0

        # left side of map
        span = 1
        if int(self.position_x) == 0:
            delta_x = heightmap[0][int(self.position_y)] - heightmap[1][int(self.position_y)]
        # right side of map
        elif int(self.position_x) >= (len(heightmap) - 2):
            delta_x = heightmap[-2][int(self.position_y)] - heightmap[-1][int(self.position_y)]
        # anywhere else in map
        else:
            delta_x = heightmap[int(self.position_x)-1][int(self.position_y)] - heightmap[int(self.position_x)+1][int(self.position_y)]
            span = 2
        normal_x = mg * (span * delta_x)/(span ** 2 + delta_x **2)

        # bottom of map
        span = 1
        if int(self.position_y) == 0:
            delta_y = (heightmap[int(self.position_x)][0] - heightmap[int(self.position_x)][1])
        # top of map
        elif int(self.position_y) >= (len(heightmap[0]) - 2):
            delta_y = (heightmap[int(self.position_x)][-2] - heightmap[int(self.position_x)][-1])
        else:
            delta_y = (heightmap[int(self.position_x)][int(self.position_y)-1] - heightmap[int(self.position_x)][int(self.position_y)+1])
            span = 2
        normal_y = mg * (span * delta_y)/((span ** 2) + (delta_y ** 2))

        return normal_x, normal_y

    def particle_speed(self):
        """ Calculate the magnitude of the current particle velocity """
        return np.sqrt(self.velocity_x**2 + self.velocity_y**2)
    
    def step_dynamics(self, heightmap, dt = 1, force = -9.8):
        """ Step the particle down a heightmap subject to gravity"""
        normal_x, normal_y = self.normal_force(heightmap, force)

        # Calculate acceleration based on provided surface normal vector
        acceleraton_x = normal_x/(self.volume * self.density)
        acceleraton_y = normal_y/(self.volume * self.density)

        # Increase velocity based on acceleration
        self.velocity_x += acceleraton_x*dt
        self.velocity_y += acceleraton_y*dt

        # Decrease velocity based on friction (higher damping at higher speeds)
        self.velocity_x *= (1 - self.friction*dt)
        self.velocity_y *= (1 - self.friction*dt)

        # Update position based on velocity
        self.position_x += self.velocity_x*dt
        self.position_y += self.velocity_y*dt

        if self.position_x <= 0:
            self.position_x = 0
            self.velocity_x = 0
        elif self.position_x >= len(heightmap) - 1:
            self.position_x = len(heightmap) - 1
            self.velocity_x = 0

        if self.position_y <= 0:
            self.position_y = 0
            self.velocity_y = 0
        elif self.position_y >= len(heightmap[0]) - 1:
            self.position_y = len(heightmap[0]) - 1
            self.velocity_y = 0

class DiscreteThermalParticle(Particle):
    released: bool = False
    upward_velocity : float = 0.0
    
    heat_energy = 100

    def step_dynamics(self, heightmap, force = -9.8, wind = (0,0)):
        # Move to the highest adjacent point
        map_width = len(heightmap)
        map_height = len(heightmap[1])

        current_height = heightmap[self.position_x][self.position_y]
        left = [-1, 0, current_height]
        right = [1, 0, current_height]
        down = [0, -1, current_height]
        up = [0, 1, current_height]

        if (self.position_x > 0):
            left[2] = heightmap[self.position_x-1][self.position_y] - wind[0]/40
        if (self.position_x < map_width-1):
            right[2] = heightmap[self.position_x+1][self.position_y] + wind[0]/40
        if (self.position_y > 0):
            down[2] = heightmap[self.position_x][self.position_y-1] - wind[1]/40
        if (self.position_y < map_height-1):
            up[2] = heightmap[self.position_x][self.position_y+1] + wind[1]/40

        next_position = (0, 0, current_height)
        # Identify the highest adjacent point
        for adjacent_position in [left, right, down, up]:
            if adjacent_position[2] > next_position[2]:
                next_position = adjacent_position
        
        if next_position[2] == current_height:
            #particle isn't moving
            self.released = True

        z_delta = next_position[2] - current_height

        # estimate the pull of the partical away from the change in terrain 
        bending = self.upward_velocity - z_delta

        # If the terrain drops away too quickly, release the particle
        if bending > STICKINESS:
            self.released = True
            
        # update upward velocity 
        self.upward_velocity += (z_delta - self.upward_velocity) * (1 - FRICTION)

        self.position_x += next_position[0]
        self.position_y += next_position[1]

        # As we move, lose some heat to the outside environment
        self.heat_energy *= 0.95

def elevation_distribution(elevation):
    if (elevation > MAX_PROABILITY_CEILING):
        return 1

    return ((elevation + SEA_LEVEL_PROBABILITY) / 
            (MAX_PROABILITY_CEILING+SEA_LEVEL_PROBABILITY))

class ThermalParticleDistribution():
    particles = []
    particle_trail = []
    height_map = None
    albedo_map = None 
    map_height = 0
    map_width = 0
    thermal_movement_simulated = False   
    thermals = {}
    thermal_map = [[]]
    aggregated_particles = {"x": [], "y":[], "strength": []}

    def __init__(self, number_of_particles, height_map, max_thermal, albedo_map=None):
        
        if albedo_map:
            assert(len(height_map) == len(albedo_map))
            assert(len(height_map[0]) == len(albedo_map[0]))

        self.height_map = height_map
        self.albedo_map = albedo_map
        self.map_width = len(height_map)
        self.map_height = len(height_map[1])
        self.max_thermal = max_thermal
        assert(self.map_width > 0)
        assert(self.map_height > 0)

        self.particles = self.distribute_particles(number_of_particles)


    def distribute_particles(self, desired_number_of_particles):
        """
        Distribute thermal particles over a map given a height map and an albedo map.
        Both maps should have a structure of map[x][y] = value. 
        Height map should have a lower bound of 0. Values map roughly to kilometers, I.E. a value of 1 means 1000m of elevation.
        Albedo map shoule be on the range 0-1, with 0 as a perfect absorber and 1 as a perfect reflector.
        https://en.wikipedia.org/wiki/Albedo
        Note: 
        This function is not efficient for very high numbers of particles, as particles are drawn randomly and may be culled based on
        the distributions. TODO for later is to rewrite this to instead draw each particle from the distributions. 
        """


        particles = []
        while len(particles) < desired_number_of_particles:
            # Create a particle random;
            new_particle = DiscreteThermalParticle(random.randrange(self.map_width), random.randrange(self.map_height))
            
            # pull the height of the particle & pull its probability
            elevation = self.height_map[new_particle.position_x][new_particle.position_y]
            elevation_probability = elevation_distribution(elevation)

            # If we don't have a albedo map, just use the height map
            total_probability = elevation_probability
            if self.albedo_map:
                albedo = self.albedo_map[new_particle.position_x][new_particle.position_y]
                albedo_probability = 1-albedo
                # If there is an albedo map, combine it with the elevation probabiolity and 
                # value it 2:1 against the elevation map
                total_probability = ((2 * albedo_probability) + elevation_probability)/3

            # Make a random draw based on the total probability. If it passes, add the particle to the list
            if (random.random() < total_probability):
                particles.append(new_particle)

        return particles

    def check_all_released(self):
        """ 
        Check if all the thermal particles have released
        """
        all_released = True
        for particle in self.particles:
            all_released = all_released and particle.released
        return all_released

    def aggregate_particles(self):
        assert(self.thermal_movement_simulated)
        self.thermal_map = [[0 for _ in range(self.map_height)] for _ in range(self.map_width)]
        max_value = 0
        for particle in self.particles:

            # Discard anything on the edge of the map
            if (particle.position_x == 0) or (particle.position_x == self.map_width - 1):
                continue
            if (particle.position_y == 0) or (particle.position_y == self.map_height -1):
                continue

            # Add the particle's energy to the thermal particle map
            if (particle.position_x, particle.position_y) in self.thermals.keys():
                self.thermals[(particle.position_x, particle.position_y)] += particle.heat_energy
            else:
                self.thermals[(particle.position_x, particle.position_y)] = particle.heat_energy

            self.thermal_map[particle.position_x][particle.position_y] += particle.heat_energy
            for x_delta, y_delta, factor in [   [-1, -1, 0.2],
                                                [-1,  1, 0.2],
                                                [ 1, -1, 0.2],
                                                [ 1,  1, 0.2],
                                                [-1,  0, 0.4],
                                                [ 0, -1, 0.4],
                                                [ 0,  1, 0.4],
                                                [ 1,  0, 0.4]] :
                # Make thermals wider
                # We be sure to not exceed bounds here as we skip any particles on the edges above
                self.thermal_map[particle.position_x + x_delta][particle.position_y + y_delta] += (particle.heat_energy * factor)
                
            if self.thermal_map[particle.position_x][particle.position_y] > max_value:
                max_value = self.thermal_map[particle.position_x][particle.position_y]
            
        # Normalize with distribution and apply max value
        for row_index, row in enumerate(self.thermal_map):
            for col_index, initial_value in enumerate(row):
                normalized_scaled_value = (self.max_thermal * thermal_distribution(initial_value/max_value))
                self.thermal_map[row_index][col_index] = normalized_scaled_value
                if (initial_value > 0):
                    self.aggregated_particles["x"].append(row_index)
                    self.aggregated_particles["y"].append(col_index)
                    self.aggregated_particles["strength"].append(normalized_scaled_value)



    def simulate_particles(self, wind):
        """
        Simulate thermal particle dynamics until all have released from the landscape
        """
        self.particle_trail = [{"x": [], "y":[], "heat":[]} for _ in range(len(self.particles))]

        for _ in range (10000):
            if self.check_all_released():
                break
            for index, particle in enumerate(self.particles):
                    if not particle.released:
                        particle.step_dynamics(self.height_map, wind = wind)
                        self.particle_trail[index]["x"].append(particle.position_x)
                        self.particle_trail[index]["y"].append(particle.position_y)
                        self.particle_trail[index]["heat"].append(particle.heat_energy)


        assert (self.check_all_released())
        self.thermal_movement_simulated = True
        self.aggregate_particles()

# Make good thermals more likely
def thermal_distribution(normalized_thermal):
    normalized_thermal = np.sqrt(normalized_thermal)
    if normalized_thermal > (6/10):
        normalized_thermal = (6/10)
    normalized_thermal *= 10/6
    return normalized_thermal

if __name__ == "__main__":
    unittest.main() 
        

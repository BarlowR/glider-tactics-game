from dataclasses import dataclass
import numpy as np
import unittest 

FRICTION = 0.2
STICKINESS = 0.02

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

class TestParticle(unittest.TestCase): 
  
    def test_dynamics(self):
        height_map_1 = [[0,0,0,0,0],
                        [0,1,1,1,0],
                        [0,1,1,1,0],
                        [0,1,1,1,0],
                        [0,0,0,0,0]]
        

        ########################################################################################
        test_name = "Top Left No Friction"
        test_part = Particle(1, 1, 0)
        step_num = 0

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1

        self.assertEqual(test_part.velocity_x, -0.4, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, -0.4, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 1 + test_part.velocity_x, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 1 + test_part.velocity_y, f"{test_name}, Step {step_num}, position_y")

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1
        
        self.assertEqual(test_part.velocity_x, 0, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, 0, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 0, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 0, f"{test_name}, Step {step_num}, position_y")

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1
        
        self.assertEqual(test_part.velocity_x, 0, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, 0, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 0, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 0, f"{test_name}, Step {step_num}, position_y")

        ########################################################################################
        test_name = "Top No Friction"
        test_part = Particle(2, 1, 0)
        step_num = 0

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1

        self.assertEqual(test_part.velocity_x, 0, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, -0.5, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 2, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 1 + test_part.velocity_y, f"{test_name}, Step {step_num}, position_y")

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1
        
        self.assertEqual(test_part.velocity_x, 0, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, 0, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 2, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 0, f"{test_name}, Step {step_num}, position_y")

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1
        
        self.assertEqual(test_part.velocity_x, 0, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, 0, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 2, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 0, f"{test_name}, Step {step_num}, position_y")


        ########################################################################################
        test_name = "Right No Friction"
        test_part = Particle(3, 2, 0)
        step_num = 0

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1

        self.assertEqual(test_part.velocity_x, 0.5, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, 0, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 3 + test_part.velocity_x, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 2, f"{test_name}, Step {step_num}, position_y")

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1
        
        self.assertEqual(test_part.velocity_x, 0, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, 0, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 4, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 2, f"{test_name}, Step {step_num}, position_y")

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1
        
        self.assertEqual(test_part.velocity_x, 0, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, 0, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 4, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 2, f"{test_name}, Step {step_num}, position_y")
        
        
        ########################################################################################
        test_name = "Middle No Friction"
        test_part = Particle(2, 2, 0)
        step_num = 0

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1

        self.assertEqual(test_part.velocity_x, 0, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, 0, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 2, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 2, f"{test_name}, Step {step_num}, position_y")

        test_part.step_dynamics(height_map_1, 1, 1)
        step_num += 1
        
        self.assertEqual(test_part.velocity_x, 0, f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, 0, f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 2, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 2, f"{test_name}, Step {step_num}, position_y")

        ########################################################################################
        test_name = "Top Left Friction"
        test_part = Particle(1, 1, FRICTION)
        step_num = 0

        dt = 1

        test_part.step_dynamics(height_map_1, dt)
        step_num += 1

        self.assertEqual(test_part.velocity_x, -0.5 * (1 - FRICTION * dt), f"{test_name}, Step {step_num}, velocity_x")
        self.assertEqual(test_part.velocity_y, -0.5 * (1 - FRICTION * dt), f"{test_name}, Step {step_num}, velocity_y")

        self.assertEqual(test_part.position_x, 1 + test_part.velocity_x, f"{test_name}, Step {step_num}, position_x")
        self.assertEqual(test_part.position_y, 1 + test_part.velocity_y, f"{test_name}, Step {step_num}, position_y")


class DiscreteThermalParticle(Particle):
    released: bool = False
    upward_velocity : float = 0.0

    def step_dynamics(self, heightmap, force = -9.8):
        # Move to the highest adjacent point
        map_width = len(heightmap)
        map_height = len(heightmap[1])

        current_height = heightmap[self.position_x][self.position_y]
        left = [-1, 0, current_height]
        right = [1, 0, current_height]
        down = [0, -1, current_height]
        up = [0, 1, current_height]

        if (self.position_x > 0):
            left[2] = heightmap[self.position_x-1][self.position_y]
        if (self.position_x < map_width-1):
            right[2] = heightmap[self.position_x+1][self.position_y]
        if (self.position_y > 0):
            down[2] = heightmap[self.position_x][self.position_y-1]
        if (self.position_y < map_height-1):
            up[2] = heightmap[self.position_x][self.position_y+1]

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

        

        


if __name__ == "__main__":
    unittest.main() 
        

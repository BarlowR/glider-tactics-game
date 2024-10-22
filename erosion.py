from dataclasses import dataclass
import numpy as np
import unittest 
import particle

# Based on article: 
# https://nickmcd.me/2020/04/10/simple-particle-based-hydraulic-erosion/

DEPOSITION_CONSTANT = 0.3
EVAPORATION_RATE = 0.005

@dataclass
class ErosionParticle(particle.Particle):
    # partical volume
    volume = 1.0
    
    # Volume of sediment 
    sediment = 0.0

    # Particle density
    density = 1.0

    def step_sediment(self, dt = 1):
        """ Calculate the sediment picked up or dropped """
        # Determine equilibrium sediment concentration. concentration increases as speed increases.
        eq_constant = self.volume * self.particle_speed()

        c_diff = eq_constant - self.sediment

        sediment = dt*DEPOSITION_CONSTANT*c_diff
        self.sediment += sediment
        
        # Evaporation
        self.volume *= (1.0 - dt*EVAPORATION_RATE)
        
        # Reurn how much sediment was removed on the map at the given position
        return (self.position_x, self.position_y, sediment)
    
    def step_particle(self, heightmap, dt = 1):
        self.step_dynamics(heightmap, dt)
        return self.step_sediment(dt)
    


class TestParticle(unittest.TestCase): 

    def test_sediment(self):
         ########################################################################################
        test_name = "Sediment Manipulation"
        test_part = ErosionParticle(2, 2, 0)

        sediment_mass = 1

        test_part.velocity_x = 0
        test_part.velocity_y = 0
        test_part.step_sediment()

        self.assertEqual(test_part.sediment, 0, f"{test_name}, No Velocity")

        test_part.velocity_x = 1
        pos_x, pos_y, dep = test_part.step_sediment()
        sediment_mass -= dep

        self.assertEqual(pos_x, 2)
        self.assertEqual(pos_y, 2)

        # dt * DEPOSITION_CONSTANT * (volume * particle_speed - 0)
        self.assertEqual(dep, 0.475, f"{test_name}, 1 Unit Velocity")
        self.assertEqual(test_part.sediment, dep, f"{test_name}, 1 Unit Velocity")

        pos_x, pos_y, dep_2 = test_part.step_sediment()
        sediment_mass -= dep_2

        # dt * DEPOSITION_CONSTANT * (volume * particle_speed - 0.0475)
        self.assertEqual(dep_2, 0.21375, f"{test_name}, 1 Unit Velocity")
        self.assertEqual(test_part.sediment, dep + dep_2, f"{test_name}, 1 Unit Velocity")

        test_part.velocity_x = 0

        pos_x, pos_y, dep_3 = test_part.step_sediment()
        sediment_mass -= dep_3
        # dt * DEPOSITION_CONSTANT * (volume * particle_speed - 0.0475)
        self.assertEqual(dep_3, -0.344375, f"{test_name}, 1 Unit Velocity")
        self.assertEqual(test_part.sediment, dep + dep_2 + dep_3, f"{test_name}, 1 Unit Velocity")

if __name__ == "__main__":
    unittest.main() 
        


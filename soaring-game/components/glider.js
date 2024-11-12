import * as THREE from 'three';
import { distance } from 'three/webgpu';

const k_rotation_ticks = 20
const unit_length = 100 //m

class Glider {
    constructor(starting_position = [40, 40, 3]){
        this.sprite_materials = [
            new THREE.TextureLoader().load( 'assets/toyplane/up.png' ),
            new THREE.TextureLoader().load( 'assets/toyplane/right.png' ),
            new THREE.TextureLoader().load( 'assets/toyplane/down.png' ),
            new THREE.TextureLoader().load( 'assets/toyplane/left.png' ),
            new THREE.TextureLoader().load( 'assets/toyplane/up_bank.png' ),
            new THREE.TextureLoader().load( 'assets/toyplane/left_bank.png' ),
            new THREE.TextureLoader().load( 'assets/toyplane/down_bank.png' ),
            new THREE.TextureLoader().load( 'assets/toyplane/right_bank.png' ),
            
        ]

        for (var tex in this.sprite_materials){
            this.sprite_materials[tex].minFilter = THREE.NearestFilter;
            this.sprite_materials[tex].magFilter = THREE.NearestFilter;
        }
        const material = new THREE.SpriteMaterial( { map: this.sprite_materials["top"] } );
        
        this.mesh = new THREE.Sprite( material );
        this.mesh.scale.set(3, 2, 1);
        // This should probably be an even divisor of 1000. 
        // This 
        this.speed = 20;

        this.velocity = {x: 0,
                         y: 0, 
                         z: 0};
        this.position = {x: starting_position[0],
                         y: starting_position[1],
                         z: starting_position[2]};
        this.crashed = false;

        const line_material = new THREE.LineBasicMaterial({
            color: 0x0000ff,
        });
        
        const points = [];
        points.push( new THREE.Vector3( 0, 0, -10 ) );
        points.push( new THREE.Vector3( 0, 0, 0) );
        
        const line_geometry = new THREE.BufferGeometry().setFromPoints( points );
        
        this.line = new THREE.Line( line_geometry, line_material );
    }

    check_latest_action(latest_event, tick){

        // Consideration for later: modifiable speed & polar curves
        // if (latest_event == ["q"] && this.speed < 40){
        //     this.speed += 10;
        // } else if (latest_event == ["a"] && this.speed > 10){
        //     this.speed -= 10;
        // }

        // This is written to put all event handling at intersections on the 1 unit grid. 
        // I will probably need to improve this at some point. 
        // This could also be handled by setting integer positions at set times and interpolating inbetween?
        if (tick % (1000/this.speed) == 0){
            if (latest_event == ["ArrowRight"]){
                this.velocity.x =  (this.speed/1000);    
                this.velocity.y =  0.00 
            } else if (latest_event == ["ArrowLeft"]){
                this.velocity.x = -(this.speed/1000);    
                this.velocity.y =  0.00 
            } else if (latest_event == ["ArrowUp"]){
                this.velocity.x =  0.00;           
                this.velocity.y =  (this.speed/1000) 
            } else if (latest_event == ["ArrowDown"]){
                this.velocity.x =  0.00;           
                this.velocity.y = -(this.speed/1000) 
            } else if (latest_event == [" "]){
                this.velocity.x =  0.00;           
                this.velocity.y =  0.00 
            }
        }
    }
    // Could potentially move lift/sink calculation serverside to obfuscate 
    lift_and_sink(thermal_map, elevation_map){
        const x_index = Math.round(this.position.x);
        const y_index = Math.round(this.position.y);
        const lift_index = thermal_map[x_index][y_index];
        
        const agl = this.position.z - elevation_map[x_index][y_index];
        // reduce thermal strength linearly within 500 m of the ground
        const agl_index = (agl > 0.5) ? 1.0 : agl + 0.5;
        
        const inversion = 5 + elevation_map[x_index][y_index]/2;
        
        const inversion_index =  (this.position.z < inversion) ? 
        (1 - (this.position.z * this.position.z * this.position.z)/ ( inversion * inversion * inversion)) :
        0;
        
        const lift = lift_index * agl_index * inversion_index;        
        const sink_rate = -(this.speed/15000);
        this.velocity.z = lift_index > 0 ? 
                                lift * 0.001 :
                                0
        this.velocity.z += sink_rate;
    }
    move(tick){
        if (this.crashed){
            return;
        }
        // Update position from velocity
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;

        // TODO rotation
        
        // There has to be a better way to assign properties
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.position.z = this.position.z + 0.5;

        this.line.position.x = this.position.x;
        this.line.position.y = this.position.y;
        this.line.position.z = this.position.z;
    }
    check_collision(height_map){
        const x_index = Math.round(this.position.x);
        const y_index = Math.round(this.position.y);
        const ground = height_map[x_index][y_index];
        this.agl = this.position.z - ground;
        if (this.agl <= 0){
            this.crashed = true;
        }
    }
    update_sprite(tick){
        if (this.velocity.x == 0 && this.velocity.y == 0){
            var circle = (Math.floor(tick / k_rotation_ticks) % 4);
            if (circle == 0){
                this.mesh.material.map = this.sprite_materials[4];
            } else if (circle == 1) {
                this.mesh.material.map = this.sprite_materials[5];
            } else if (circle == 2) {
                this.mesh.material.map = this.sprite_materials[6];
            } else if (circle == 3) {
                this.mesh.material.map = this.sprite_materials[7];
            }
        } else if (this.velocity.y > 0){
            this.mesh.material.map = this.sprite_materials[0];
        } else if (this.velocity.x > 0) {
            this.mesh.material.map = this.sprite_materials[1];
        } else if (this.velocity.y < 0) {
            this.mesh.material.map = this.sprite_materials[2];
        } else if (this.velocity.x < 0) {
            this.mesh.material.map = this.sprite_materials[3];
        }
    }
    update(tick, latest_event, height_map, thermal_map){
        this.check_latest_action(latest_event, tick);
        this.lift_and_sink(thermal_map, height_map);
        this.move();
        this.update_sprite(tick);
        this.check_collision(thermal_map);
    }
}

export { Glider};

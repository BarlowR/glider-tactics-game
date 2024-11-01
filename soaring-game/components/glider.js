import * as THREE from 'three';
import { distance } from 'three/webgpu';


class Glider {
    constructor(starting_position = [40, 40, 5]){
        // TODO: replace this with a glider model 
        const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5); 

        const material = new THREE.MeshBasicMaterial( {color: 0xFFff00, wireframe:true} ); 
        this.mesh = new THREE.Mesh( geometry, material ); 

        // This should probably be an even divisor of 1000
        this.speed = 20;

        this.velocity = {x: 0,
                         y: 0, 
                         z: 0};
        this.position = {x: starting_position[0],
                         y: starting_position[1],
                         z: starting_position[2]};

        const line_material = new THREE.LineBasicMaterial({
            color: 0x0000ff
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
    lift_and_sink(thermal_map, elevation_map){
        const x_index = Math.round(this.position.x);
        const y_index = Math.round(this.position.y);
        const lift_index = thermal_map[x_index][y_index] - 0.5;
        
        const agl = this.position.z - elevation_map[x_index][y_index];
        // reduce thermal strength linearly within 500 m of the ground
        const agl_index = (agl > 0.5) ? 1.0 : agl + 0.5;

        // altitude;
        const inversion = 5 + elevation_map[x_index][y_index]/2;

        const inversion_index = 1 - (agl * agl)/ ( inversion * inversion);

        const lift = lift_index * agl_index * inversion_index;
        console.log(lift_index, agl_index, inversion_index);
        
        const sink_rate = this.velocity.z = -(this.speed/20000);
        this.velocity.z =   lift_index > 0 ? 
                                lift * 0.005 :
                                -0.004;
        this.velocity.z += -sink_rate;
    }
    move(tick){
        // Update position from velocity
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;

        // TODO rotation
        
        // There has to be a better way to assign properties
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.position.z = this.position.z;

        this.line.position.x = this.position.x;
        this.line.position.y = this.position.y;
        this.line.position.z = this.position.z;
    }
}

export { Glider};

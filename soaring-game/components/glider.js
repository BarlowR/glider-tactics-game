import * as THREE from 'three';
import { distance } from 'three/webgpu';

const k_rotation_ticks = 20
const k_horizontal_unit_length = 2500 //m
const k_vertical_unit_length = 1000 //m
const k_time_scaling = 100 //m

class Glider {
    constructor(starting_position = [40, 40, 3], glide_polar, velocity_ne, height_scaling_factor, max_thermal = 7) {
        this.sprite_materials = [
            new THREE.TextureLoader().load('assets/toyplane/up.png'),
            new THREE.TextureLoader().load('assets/toyplane/right.png'),
            new THREE.TextureLoader().load('assets/toyplane/down.png'),
            new THREE.TextureLoader().load('assets/toyplane/left.png'),
            new THREE.TextureLoader().load('assets/toyplane/up_bank.png'),
            new THREE.TextureLoader().load('assets/toyplane/left_bank.png'),
            new THREE.TextureLoader().load('assets/toyplane/down_bank.png'),
            new THREE.TextureLoader().load('assets/toyplane/right_bank.png'),

        ]

        this.glide_polar = glide_polar;
        this.height_scaling_factor = height_scaling_factor;
        this.max_thermal = max_thermal;

        for (var tex in this.sprite_materials) {
            this.sprite_materials[tex].minFilter = THREE.NearestFilter;
            this.sprite_materials[tex].magFilter = THREE.NearestFilter;
        }
        const material = new THREE.SpriteMaterial({ map: this.sprite_materials["top"] });

        this.mesh = new THREE.Sprite(material);
        this.mesh.position.set(0, 0, -5);
        this.mesh.scale.set(2, 2 / 1.5, 1);
        // This should probably be an even divisor of 1000. 
        // This 
        this.airspeed = 40;
        this.direction = 0;

        this.velocity_ne = velocity_ne; 

        this.velocity = {
            x: 0,
            y: 0,
            z: 0
        };
        this.thermalling = false;
        this.starting_position = starting_position;
        this.position = {
            x: starting_position[0],
            y: starting_position[1],
            z: starting_position[2]
        };
        this.crashed = false;
        this.flutter = false;
        this.stalled = false;

        const line_material = new THREE.LineBasicMaterial({
            color: 0x0000ff,
        });

        const points = [];
        points.push(new THREE.Vector3(0, 0, -10));
        points.push(new THREE.Vector3(0, 0, 0));

        const line_geometry = new THREE.BufferGeometry().setFromPoints(points);

        this.line = new THREE.Line(line_geometry, line_material);
    }

    reset = () => {
        this.crashed = false;
        this.flutter = false;
        this.stalled = false;
        this.airspeed = 40;
        this.position.x= this.starting_position[0]
        this.position.y= this.starting_position[1]
        this.position.z= this.starting_position[2]
    }
    check_latest_action(latest_event, tick, dt) {
        // This is written to put all event handling at intersections on the 1 unit grid. 
        // I will probably need to improve this at some point. 
        // This could also be handled by setting integer positions at set times and interpolating inbetween?
        if (latest_event == ["ArrowRight"]) {
            this.direction = Math.PI / 2
            this.thermalling = false;
        } else if (latest_event == ["ArrowLeft"]) {
            this.direction = 3* Math.PI /2
            this.thermalling = false;
        } else if (latest_event == ["ArrowUp"]) {
            this.direction = 0
            this.thermalling = false;
        } else if (latest_event == ["ArrowDown"]) {
            this.direction = Math.PI
            this.thermalling = false;
        } else if (latest_event == ["q"]) {
            this.airspeed += dt/1000 * 20
        } else if (latest_event == ["a"]) {
            this.airspeed -= dt/1000 * 20
        } else if (latest_event == [" "]) {
            this.thermalling = true;
            this.airspeed = 30
        }
        if (this.airspeed > this.velocity_ne/3.6) {
            this.flutter = true;
        } else if (this.airspeed < 80/3.6) {
            this.stalled = true;
        }
    }
    // Could potentially move lift/sink calculation serverside to obfuscate 
    lift_and_sink(thermal_map, elevation_map) {
        const x_index = Math.round(this.position.x);
        const y_index = Math.round(this.position.y);
        const lift_index = thermal_map[x_index][y_index];

        const agl = this.position.z - elevation_map[x_index][y_index];
        // reduce thermal strength linearly within 500 m of the ground
        const agl_index = (agl > 0.5) ? 1.0 : agl + 0.5;

        const inversion = 5 + elevation_map[x_index][y_index] / 2;

        const inversion_index = (this.position.z < inversion) ?
            (1 - (this.position.z * this.position.z * this.position.z) / (inversion * inversion * inversion)) :
            0;

        const lift = lift_index * agl_index * inversion_index * this.max_thermal;
        
        var polar_index = 80
        if (this.airspeed * 3.6 > 80){
            polar_index = Math.round(this.airspeed * 3.6 / 10) * 10
        } else if (this.airspeed > this.velocity_ne){
            polar_index = 250;
        }
        var sink_rate = -3;
        if (polar_index in this.glide_polar){
            sink_rate = this.glide_polar[polar_index];
        }
        this.velocity.z = lift_index > 0 ? lift : 0;
        this.velocity.z += sink_rate;
    }
    move(dt) {
        if (this.crashed || this.flutter || this.stalled) {
            return;
        }
        if (!this.thermalling){
            this.velocity.x = this.airspeed * Math.sin(this.direction);
            this.velocity.y = this.airspeed * Math.cos(this.direction);
        } else {
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
        
        // Update position from velocity
        this.position.x += this.velocity.x * 1 / k_horizontal_unit_length * dt / 1000 * k_time_scaling;
        this.position.y += this.velocity.y * 1 / k_horizontal_unit_length * dt / 1000 * k_time_scaling;
        this.position.z += this.velocity.z * 1 / k_vertical_unit_length * dt / 1000 * k_time_scaling;

        // There has to be a better way to assign properties?
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.position.z = this.position.z * this.height_scaling_factor;

        this.line.position.x = this.mesh.position.x;
        this.line.position.y = this.mesh.position.y;
        this.line.position.z = this.mesh.position.z;
    }
    check_collision(height_map) {
        const x_index = Math.round(this.position.x);
        const y_index = Math.round(this.position.y);
        const ground = height_map[x_index][y_index];
        this.agl = this.position.z - ground;
        if (this.agl <= 0) {
            this.crashed = true;
        }
    }
    update_sprite(tick) {
        if (this.thermalling) {
            var circle = (Math.floor(tick / k_rotation_ticks) % 4);
            if (circle == 0) {
                this.mesh.material.map = this.sprite_materials[4];
            } else if (circle == 1) {
                this.mesh.material.map = this.sprite_materials[5];
            } else if (circle == 2) {
                this.mesh.material.map = this.sprite_materials[6];
            } else if (circle == 3) {
                this.mesh.material.map = this.sprite_materials[7];
            }
        } else if (this.direction == 0) {
            this.mesh.material.map = this.sprite_materials[0];
        } else if (this.direction == Math.PI/2) {
            this.mesh.material.map = this.sprite_materials[1];
        } else if (this.direction == Math.PI) {
            this.mesh.material.map = this.sprite_materials[2];
        } else if (this.direction == 3 * Math.PI/2) {
            this.mesh.material.map = this.sprite_materials[3];
        }
    }
    update(tick, dt, latest_event, height_map, thermal_map) {
        this.check_latest_action(latest_event, tick, dt);
        this.lift_and_sink(thermal_map, height_map);
        this.move(dt);
        this.update_sprite(tick);
        this.check_collision(height_map);
    }
}

export { Glider };

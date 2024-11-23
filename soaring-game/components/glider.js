import * as THREE from 'three';

const k_rotation_ticks = 20
const k_horizontal_unit_length = 2500 //m
const k_vertical_unit_length = 1000 //m
const k_time_scaling = 100 //m

class GliderModel {
    constructor(model_name, polar, sprite_folder){
        this.model_name = model_name;
        this.polar = polar;
        console.log(sprite_folder)
        this.sprite_materials = [
            new THREE.TextureLoader().load(sprite_folder + 'up.png'),
            new THREE.TextureLoader().load(sprite_folder + 'right.png'),
            new THREE.TextureLoader().load(sprite_folder + 'down.png'),
            new THREE.TextureLoader().load(sprite_folder + 'left.png'),
            new THREE.TextureLoader().load(sprite_folder + 'up_bank.png'),
            new THREE.TextureLoader().load(sprite_folder + 'left_bank.png'),
            new THREE.TextureLoader().load(sprite_folder + 'down_bank.png'),
            new THREE.TextureLoader().load(sprite_folder + 'right_bank.png'),
        ]
        for (var tex in this.sprite_materials) {
            this.sprite_materials[tex].minFilter = THREE.NearestFilter;
            this.sprite_materials[tex].magFilter = THREE.NearestFilter;
        }
    } 
}

class Glider {
    constructor(starting_position, glider_model, color, velocity_ne, height_scaling_factor) {
        this.glider_model = glider_model
        this.height_scaling_factor = height_scaling_factor;
        this.color = color

        const material = new THREE.SpriteMaterial({ map: this.glider_model.sprite_materials[0], color : this.color});

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
            x: starting_position.x,
            y: starting_position.y,
            z: starting_position.z
        };
        this.agl = this.starting_position.z
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
        this.move(0);
        this.update_sprite(0)
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

        const lift = lift_index * agl_index * inversion_index;
        
        var polar_index = 80
        if (this.airspeed * 3.6 > 80){
            polar_index = Math.round(this.airspeed * 3.6 / 10) * 10
        } else if (this.airspeed > this.velocity_ne){
            polar_index = 250;
        }
        var sink_rate = -3;
        if (polar_index in this.glider_model.polar){
            sink_rate = this.glider_model.polar[polar_index];
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
                this.mesh.material.map = this.glider_model.sprite_materials[4];
            } else if (circle == 1) {
                this.mesh.material.map = this.glider_model.sprite_materials[5];
            } else if (circle == 2) {
                this.mesh.material.map = this.glider_model.sprite_materials[6];
            } else if (circle == 3) {
                this.mesh.material.map = this.glider_model.sprite_materials[7];
            }
        } else if (this.direction == 0) {
            this.mesh.material.map = this.glider_model.sprite_materials[0];
        } else if (this.direction == Math.PI/2) {
            this.mesh.material.map = this.glider_model.sprite_materials[1];
        } else if (this.direction == Math.PI) {
            this.mesh.material.map = this.glider_model.sprite_materials[2];
        } else if (this.direction == 3 * Math.PI/2) {
            this.mesh.material.map = this.glider_model.sprite_materials[3];
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

export {GliderModel, Glider };

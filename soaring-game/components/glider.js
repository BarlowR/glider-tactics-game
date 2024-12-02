import * as THREE from 'three';

const k_rotation_ticks = 15
const k_horizontal_unit_length = 2500 //m
const k_vertical_unit_length = 1000 //m
const k_time_scaling = 100 //m


class GliderDynamics {
    constructor(airspeed,
                direction,
                thermalling,
                velocity,
                position){
        this.airspeed = airspeed;
        this.direction = direction;
        this.thermalling = thermalling;
        this.velocity = velocity;
        this.position = position;
    }
}
class GliderModel {
    constructor(model_name, polar, sprite_folder, color){
        this.model_name = model_name;
        this.polar = polar;
        this.color = color;
        this.sprite_materials = [
            new THREE.TextureLoader().load(sprite_folder + '0000_up.png'),
            new THREE.TextureLoader().load(sprite_folder + '0000_right.png'),
            new THREE.TextureLoader().load(sprite_folder + '0000_down.png'),
            new THREE.TextureLoader().load(sprite_folder + '0000_left.png'),
            new THREE.TextureLoader().load(sprite_folder + '0001_up.png'),
            new THREE.TextureLoader().load(sprite_folder + '0001_upright.png'),
            new THREE.TextureLoader().load(sprite_folder + '0001_right.png'),
            new THREE.TextureLoader().load(sprite_folder + '0001_rightdown.png'),
            new THREE.TextureLoader().load(sprite_folder + '0001_down.png'),
            new THREE.TextureLoader().load(sprite_folder + '0001_downleft.png'),
            new THREE.TextureLoader().load(sprite_folder + '0001_left.png'),
            new THREE.TextureLoader().load(sprite_folder + '0001_leftup.png'),
            
        ]
        for (var tex in this.sprite_materials) {
            this.sprite_materials[tex].minFilter = THREE.NearestFilter;
            this.sprite_materials[tex].magFilter = THREE.NearestFilter;
        }
    } 

    set_color = (color) => {
        this.color = color
    }
}

class Glider {
    constructor(starting_position, glider_model, color, velocity_ne, height_scaling_factor) {
        this.glider_model = glider_model
        this.height_scaling_factor = height_scaling_factor;
        this.glider_model.set_color(color);

        const material = new THREE.SpriteMaterial({ map: this.glider_model.sprite_materials[0], color : this.glider_model.color});

        this.mesh = new THREE.Sprite(material);
        this.mesh.position.set(0, 0, -5);
        this.mesh.scale.set(5, 5 / 1.5, 1);
        // This should probably be an even divisor of 1000. 
        // This 

        this.dynamics = new GliderDynamics( 40, 0, false, 
                                            {x: 0, y: 0, z: 0},
                                            {x: starting_position.x,
                                             y: starting_position.y,
                                             z: starting_position.z})
        
        
        this.starting_position = starting_position;
        this.velocity_ne = velocity_ne; 
        
        this.agl = this.starting_position.z
        this.crashed = false;
        this.flutter = false;
        this.stalled = false;
        this.start_turn_tick = 0;

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
            this.dynamics.direction = Math.PI / 2
            this.dynamics.thermalling = false;
        } else if (latest_event == ["ArrowLeft"]) {
            this.dynamics.direction = 3* Math.PI /2
            this.dynamics.thermalling = false;
        } else if (latest_event == ["ArrowUp"]) {
            this.dynamics.direction = 0
            this.dynamics.thermalling = false;
        } else if (latest_event == ["ArrowDown"]) {
            this.dynamics.direction = Math.PI
            this.dynamics.thermalling = false;
        } else if (latest_event == ["q"]) {
            this.dynamics.airspeed += dt/1000 * 20
        } else if (latest_event == ["a"]) {
            this.dynamics.airspeed -= dt/1000 * 20
        } else if (latest_event == [" "]) {
            this.dynamics.thermalling = true;
            this.dynamics.airspeed = 30
        }
        if (this.dynamics.airspeed > this.velocity_ne/3.6) {
            this.flutter = true;
        } else if (this.dynamics.airspeed < 80/3.6) {
            this.stalled = true;
        }
    }
    // Could potentially move lift/sink calculation serverside to obfuscate 
    lift_and_sink(thermal_map, elevation_map) {
        const x_index = Math.round(this.dynamics.position.x);
        const y_index = Math.round(this.dynamics.position.y);
        const lift_index = thermal_map[x_index][y_index];

        const agl = this.dynamics.position.z - elevation_map[x_index][y_index];
        // reduce thermal strength linearly within 500 m of the ground
        const agl_index = (agl > 0.5) ? 1.0 : agl + 0.5;

        const inversion = 5 + elevation_map[x_index][y_index] / 2;

        const inversion_index = (this.dynamics.position.z < inversion) ?
            (1 - (this.dynamics.position.z * this.dynamics.position.z * this.dynamics.position.z) / (inversion * inversion * inversion)) :
            0;

        const lift = lift_index * agl_index * inversion_index;
        
        var polar_index = 80
        if (this.dynamics.airspeed * 3.6 > 80){
            polar_index = Math.round(this.dynamics.airspeed * 3.6 / 10) * 10
        } else if (this.dynamics.airspeed > this.dynamics.velocity_ne){
            polar_index = 250;
        }
        var sink_rate = -3;
        if (polar_index in this.glider_model.polar){
            sink_rate = this.glider_model.polar[polar_index];
        }
        this.dynamics.velocity.z = lift_index > 0 ? lift : 0;
        this.dynamics.velocity.z += sink_rate;
    }
    move(dt) {
        if (this.crashed || this.flutter || this.stalled) {
            return;
        }
        if (!this.dynamics.thermalling){
            this.dynamics.velocity.x = this.dynamics.airspeed * Math.sin(this.dynamics.direction);
            this.dynamics.velocity.y = this.dynamics.airspeed * Math.cos(this.dynamics.direction);
        } else {
            this.dynamics.velocity.x = 0;
            this.dynamics.velocity.y = 0;
        }
        
        // Update position from velocity
        const new_position = { x: this.dynamics.position.x + this.dynamics.velocity.x * 1 / k_horizontal_unit_length * dt / 1000 * k_time_scaling,
                               y: this.dynamics.position.y + this.dynamics.velocity.y * 1 / k_horizontal_unit_length * dt / 1000 * k_time_scaling,
                               z: this.dynamics.position.z + this.dynamics.velocity.z * 1 / k_vertical_unit_length * dt / 1000 * k_time_scaling}

       this.update_position(new_position)
    }

    update_position = (position) => {
        this.dynamics.position.x = position.x
        this.dynamics.position.y = position.y
        this.dynamics.position.z = position.z

        // There has to be a better way to assign properties?
        this.mesh.position.x = this.dynamics.position.x;
        this.mesh.position.y = this.dynamics.position.y;
        this.mesh.position.z = this.dynamics.position.z * this.height_scaling_factor;

        this.line.position.x = this.mesh.position.x;
        this.line.position.y = this.mesh.position.y;
        this.line.position.z = this.mesh.position.z;
    }

    check_collision(height_map) {
        const x_index = Math.round(this.dynamics.position.x);
        const y_index = Math.round(this.dynamics.position.y);
        const ground = height_map[x_index][y_index];
        this.agl = this.dynamics.position.z - ground;
        if (this.agl <= 0) {
            this.crashed = true;
        }
    }
    update_sprite(tick) {
        // 0 for up, 1 for right, 2 for down, 3 for left
        const direction_index = Math.floor(this.dynamics.direction/(Math.PI/2))
        console.log(direction_index)
       
        if (this.dynamics.thermalling) {
            const sprite_offset = 4; 
            if (this.start_turn_tick == -1){
                this.start_turn_tick = tick;
            }

            var circle_direction = (1 + 2*direction_index + Math.floor(((tick - this.start_turn_tick) / k_rotation_ticks))) % 8
            this.mesh.material.map = this.glider_model.sprite_materials[sprite_offset + circle_direction];
        } else  {
                this.mesh.material.map = this.glider_model.sprite_materials[direction_index];
                this.start_turn_tick = -1
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

export {GliderModel, Glider, GliderDynamics};

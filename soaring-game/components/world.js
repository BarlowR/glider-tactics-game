import * as THREE from 'three';

class World {
    constructor(container, dim_x, dim_y, camera_x_offset, camera_y_offset) {
        this.camera = createCamera(dim_x, dim_y, camera_x_offset, camera_y_offset);
        this.scene = createScene();
        this.ticks = 0;
        this.tick_functions = {};
        this.renderer = createRenderer(dim_x, dim_y);
        this.renderer.domElement.id = "game_canvas";
        container.appendChild(this.renderer.domElement);
        this.renderer.setAnimationLoop(this.animate);
        this.now =

            this.last_tick_millis = new Date().getTime();
    }
    start() {
        this.renderer.setAnimationLoop(() => {
            // modify the scene
            this.tick();
            // render a frame
            this.renderer.render(this.scene, this.camera);
        });
    }
    render_single_frame(){
        this.renderer.render(this.scene, this.camera);
    }
    stop() {
        this.renderer.setAnimationLoop(null);
    }
    tick() {
        const current_millis = new Date().getTime();
        const elapsed_time = current_millis - this.last_tick_millis;
        // don't render faster than 60fps.
        // TODO: Seperate out physics from render timing. This is likely a pain
        if (elapsed_time > (1000 / 60)) {
            this.ticks += 1;
            if (!this.tick_functions) {
                return;
            }
            for (const name in this.tick_functions) {
                this.tick_functions[name](this.ticks, elapsed_time);
            }
            this.last_tick_millis = new Date().getTime();
        }
    }
    register_tick_function(f, name) {
        this.tick_functions[name] = f;
    }
    remove_tick_function(name) {
        delete this.tick_functions[name];
    }
}


function createDirectionalLight(location, look_at = [0, 0, 0]) {
    const light = new THREE.DirectionalLight('white', 3.0);
    light.position.set(location[0], location[1], location[2]);
    light.target.position.set(look_at[0], look_at[1], look_at[2]);
    return light
}

function createCamera(dim_x, dim_y, camera_x_offset, camera_y_offset) {
    var camera = new THREE.PerspectiveCamera(75, dim_x / dim_y, 0.1, 1000);
    // Set camera rotation
    camera.rotation.order = "ZXY";
    camera.rotation.z = -Math.atan2(camera_x_offset, camera_y_offset);
    camera.rotation.x = .80;
    return camera
}

function createScene() {
    var scene = new THREE.Scene();
    scene.background = new THREE.Color('white');
    return scene;
}

function createRenderer(dim_x, dim_y) {
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.physicallyCorrectLights = true;
    renderer.antialias = true;
    renderer.setSize(dim_x, dim_y);
    return renderer;
}

export { World, createDirectionalLight }

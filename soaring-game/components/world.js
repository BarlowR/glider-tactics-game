import * as THREE from 'three';

class World {
    constructor(container, dim_x, dim_y, camera_x_offset, camera_y_offset) {
        this.camera = createCamera(dim_x, dim_y, camera_x_offset, camera_y_offset);
        this.scene = createScene();
        this.ticks = 0;
        this.tick_functions = [];
        this.renderer = createRenderer(dim_x, dim_y);
        container.appendChild( this.renderer.domElement );
        this.renderer.setAnimationLoop( this.animate );
    }
    start() {
        this.renderer.setAnimationLoop(() => {
            // modify the scene
            this.tick();
            // render a frame
            this.renderer.render(this.scene, this.camera);
        });
    }
    stop() {
        this.renderer.setAnimationLoop(null);
    }
    tick() {
        this.ticks += 1;
        if (!this.tick_functions){
            return;
        }
        for (const f of this.tick_functions){
            f(this.ticks);
        }
    }
    register_tick_function(f){
        this.tick_functions.push(f);
    }
}


function createDirectionalLight(location, look_at = [0,0,0]){
    const light = new THREE.DirectionalLight('white', 3.0);
    light.position.set(location[0], location[1], location[2]);
    light.target.position.set(look_at[0], look_at[1], look_at[2]);
    return light
}

function createCamera(dim_x, dim_y, camera_x_offset, camera_y_offset){
    var camera = new THREE.PerspectiveCamera( 75, dim_x / dim_y, 0.1, 1000 );
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
    var renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.physicallyCorrectLights = true;
    renderer.antialias = true;
    renderer.setSize( dim_x, dim_y );
    return renderer;
}

export { World, createDirectionalLight }

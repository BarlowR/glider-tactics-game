import { cameraNear, Float16BufferAttribute } from "three/webgpu"
import { create_jS3 } from "./glider_models/js3.js"

class MultiplayerGliders {
    constructor() {
        this.gliders = {}
        this.map = {}
        this.game_state 
        this.server_time
    }
    register_glider = (id, name, color) => {
        this.gliders[id] = {
            model: create_jS3(color),
            name: name,
            color: color,
            position: {
                x: 0,
                y: 0, 
                z: 0
            }
        }
    }
    update_glider_position = (id, position) => {
        this.gliders[id].position = position
    }
    update_server_info = (report) => {
        this.starting_position = report.starting_position
        this.server_time = report.world_time
        this.game_state = report.game_state
    }
    remove_glider = (name) => {
        if (this.gliders[name]){
            delete this.gliders[name]
            return true;
        }
        return false
    }
}

class MultiplayerClient {
    constructor (host = "localhost", port = 8080) {
        this.host = host
        this.port = port
        this.server_connected = false
        this.server_websocket;
        this.multiplayer_gliders = new MultiplayerGliders()
        this.id
    }

    open_connection = () => {
        this.server_websocket = new WebSocket("ws://" + this.host + ":" + this.port);

        this.server_websocket.onerror = (error) => { 
            console.log("WS can't connect"); 
            this.server_connected = false;
          }
        this.server_websocket.onopen = (event) => {
            this.server_connected = true;
        }
        this.server_websocket.onclose = (event) => {
            this.server_connected = false;
        }
        this.server_websocket.onmessage = (message) => {
            this.receive_message(message)
        };
        return true
    }

    close_connection = () => {
        this.server_websocket.close()
    }

    send_join_message = (name, color) => {
        this.id = Math.random().toString(16).slice(10)
        const join_message = {
            type: "join", 
            id: this.id,
            name: name,
            color: color
        }
        this.send_message(JSON.stringify(join_message));
    }

    send_position_message = (position, velocity) => {
        const position_message = {
            type: "update_position", 
            position: position,
            velocity: velocity,
        }
        this.send_message(JSON.stringify(position_message));
    }

    send_message = (string_message) => {
        if (this.server_connected) {
            this.server_websocket.send(string_message)
            return true;
        }
        return false;
    }

    receive_message = (message) => {
        try{
            var data = JSON.parse(message["data"])
        } catch (error){
            return
        }
        if (!("type" in data) || data.type != "report") {
            console.log("Unknown Message")
        }
        
        if (data.type == "report") {
            this.handle_report(data.report)
        }
    }

    handle_report = (report) => {
        this.multiplayer_gliders.update_server_info(report)
        var existing_gliders =  new Set(Object.keys(this.multiplayer_gliders.gliders))
        for (const [glider_id, glider_info] of Object.entries(report.gliders)){            
            if (glider_id in this.multiplayer_gliders.gliders){
                this.multiplayer_gliders.update_glider_position(glider_id, glider_info.position)
            } else if (glider_id != this.id){
                console.log("Registering New Glider: ", glider_id)
                this.multiplayer_gliders.register_glider(glider_id, glider_info.name, glider_info.color)
            }
            if (existing_gliders.has(glider_id)){
                existing_gliders.delete(glider_id)
            }
        }
        
        for (const remaining_glider of existing_gliders){
            console.log("Removing ", remaining_glider)
            this.multiplayer_gliders.remove_glider(remaining_glider)
        }
    }
}




export { MultiplayerClient }

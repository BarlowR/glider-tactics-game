import { cameraNear, Float16BufferAttribute } from "three/webgpu"
import { create_jS3 } from "./glider_models/js3.js"

class MultiplayerGliders {
    constructor() {
        this.gliders = {}
        this.map = {}
        this.game_state 
        this.server_time
    }
    register_glider = (name, color) => {
        this.gliders[name] = {
            model: create_jS3(color),
            position: {
                x: 0,
                y: 0, 
                z: 0
            }
        }
    }
    update_glider_position = (name, position) => {
        this.gliders[name] = position
    }
    update_server_info = (time, game_state) => {
        this.server_time = time
        this.game_state = game_state
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
        const join_message = {
            type: "join", 
            id: name,
            color: color
        }
        this.send_message(JSON.stringify(join_message));
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
        
        this.handle_report(data.report)
    }

    handle_report = (report) => {
        this.multiplayer_gliders.update_server_info(report.time, report.game_state)
        var existing_gliders =  new Set(Object.keys(this.multiplayer_gliders.gliders))
        for (const [glider_name, glider_info] of Object.entries(report.gliders)){            
            if (glider_name in this.multiplayer_gliders.gliders){
                this.multiplayer_gliders.update_glider_position(glider_name, glider_info.position)
            } else {
                console.log("Registering New Glider: ", glider_name)
                this.multiplayer_gliders.register_glider(glider_name, glider_info.color)
            }
            if (existing_gliders.has(glider_name)){
                existing_gliders.delete(glider_name)
            }
        }
        
        for (const remaining_glider of existing_gliders){
            console.log("Removing ", remaining_glider)
            this.multiplayer_gliders.remove_glider(remaining_glider)
        }
    }
}




export { MultiplayerClient }

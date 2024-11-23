

class MultiplayerClient {
    constructor (host = "localhost", port = 8080) {
        this.host = host
        this.port = port
        this.server_websocket = new WebSocket("ws://" + this.host + ":" + this.port);
        this.server_connected = false
        this.server_websocket.onopen = (event) => {
            this.server_connected = true;
        }
        this.server_websocket.onmessage = (message) => {
            this.receive_message(message)
        };
    }

    send_message = (string_message) => {
        if (this.server_connected) {
            this.server_websocket.send(string_message)
        }
    }

    receive_message = (message) => {
        console.log(message)
    }
}


export { MultiplayerClient }

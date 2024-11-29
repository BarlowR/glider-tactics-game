import asyncio
import websockets
import ssl
import json 

async def connect():
    # SSL context setup for the client (optional, if using a self-signed certificate)
    ssl_context = ssl.create_default_context()

    uri = "wss://soaring-server.barlowr.com:8080"  # WebSocket server address (with wss://)
    
    async with websockets.connect(uri, ssl=ssl_context) as websocket:
        # Send a message to the server
        join_str= json.dumps({"type": "join", "id": "12345", "name": "Rob", "color": "#ffffff"})
        await websocket.send(join_str)
        print("Message sent to server")

        # Receive a response from the server
        response = await websocket.recv()
        print(f"Received from server: {response}")

# Run the client
asyncio.run(connect())

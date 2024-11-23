
import asyncio
import websockets
from websockets.asyncio.server import broadcast, serve
import json
from enum import Enum


UPDATE_TIME_MS = 100


class GameStates(Enum):
    WAITING_FOR_START = 0
    RUNNING = 1
    COMPLETED = 2

class SoaringGameState:
    gliders = {}
    map = None
    game_state = GameStates.WAITING_FOR_START

    def register_new_glider(self, name, color):
        self.gliders[name] = {"color": color,
                              "position": {"x": 0, "y": 0, "z": 0}}
    
    def remove_glider(self, name):
        if (name in self.gliders.keys()):
            del self.gliders[name]

    def update_position(self, glider_id, position):
        if glider_id in self.gliders.keys():
            self.gliders[glider_id]["position"] = position

    def generate_glider_position_report(self):
        return json.dumps(self.gliders)
    
    def check_finished(self):
        return False


CONNECTED_PLAYERS = set()
GAME_INSTANCE = SoaringGameState()

async def run_game(connected, game_state):
    while not game_state.check_finished():
        await update_connected(connected, game_state)
        await asyncio.sleep(UPDATE_TIME_MS/1000)
    
async def listen_client(websocket, id, game_state):
    async for message in websocket:
        # Load the message
        event = json.loads(message)

        # Make sure it's an expected type
        if not (event["type"] == "update_position"):
            print("Unknown message from client ")
            continue

        try:
            # Update this glider's position
            print("updating position")
            game_state.update_position(id, event["position"])
        except ValueError as exc:
            # Send an "error" event if the move was illegal.
            print(exc)
            continue

async def join(websocket, id, color):
    # Register to receive moves from this game.
    CONNECTED_PLAYERS.add(websocket)
    print(f"Adding Player: {id}")

    GAME_INSTANCE.register_new_glider(id, color)
    try:
        # Send the first move, in case the first player already played it.
        await listen_client(websocket, id, GAME_INSTANCE)
    finally:
        print(f"Player {id} Left")
        CONNECTED_PLAYERS.remove(websocket)

async def update_connected(connected, game_state):
    broadcast(connected, game_state.generate_glider_position_report())

async def handler(websocket):
    # Receive and parse the "init" event from the UI.
    try: 
        message = await websocket.recv()
    except Exception as e:
        return
    event = json.loads(message)
    assert "type" in event.keys()

    if event["type"] == "join":
        # Second player joins an existing game.
        print("Joining...")
        await join(websocket, event["id"], event["color"])

async def main():
    async with serve(handler, "", 8080):
        await run_game(CONNECTED_PLAYERS, GAME_INSTANCE)
        await asyncio.get_running_loop().create_future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())

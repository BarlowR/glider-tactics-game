
import asyncio
import websockets
from websockets.asyncio.server import broadcast, serve
import json
from enum import IntEnum


UPDATE_TIME_MS = 10
WAIT_TIME_MS = 10 * 1000


class GameStates(IntEnum):
    WAITING_FOR_START = 0
    RUNNING = 1
    COMPLETED = 2

class SoaringGameState:
    gliders = {}
    map = None
    game_state = GameStates.WAITING_FOR_START
    starting_position = {"x": 300, "y": 300, "z": 3}
    world_time = WAIT_TIME_MS
    def __init__(self, period):
        self.period = period

    def register_new_glider(self, id, name, color):
        self.gliders[id] = {"color": color,
                              "name": name,
                              "position": {"x": 0, "y": 0, "z": 0}}
    
    def remove_glider(self, name):
        self.gliders.pop(name, None)

    def update_position(self, glider_id, position):
        if glider_id in self.gliders.keys():
            self.gliders[glider_id]["position"] = position

    def wait_for_start(self):
        self.world_time -= self.period
        if (self.world_time <= 0):
                self.start_flight()
    
    def start_flight(self):
        print("Start Flight")
        self.world_time = 0
        self.game_state = GameStates.RUNNING

    def run_flight(self):
        self.world_time += self.period   
        if (self.check_finished()):
            self.end_flight()
        return

    def end_flight(self):
        print("End")
        self.world_time = WAIT_TIME_MS
        self.game_state = GameStates.COMPLETED


    def teardown(self):
        self.world_time -= self.period
        if (self.world_time <= 0):
            self.game_state = GameStates.WAITING_FOR_START
            self.world_time = WAIT_TIME_MS
            print("Lobby")

    def update(self):
        self.update
        if (self.game_state == GameStates.WAITING_FOR_START):
            self.wait_for_start()
        elif (self.game_state == GameStates.RUNNING):
            self.run_flight()    
        elif (self.game_state == GameStates.COMPLETED):
            self.teardown()   

    def generate_glider_position_report(self):
        return json.dumps({"type" : "report",
                            "report" :  {"world_time" : self.world_time,
                                        "game_state" : int(self.game_state),
                                        "starting_position" : self.starting_position,
                                        "gliders" : self.gliders}})
    
    def check_finished(self):
        return self.world_time > 10000


CONNECTED_PLAYERS = set()
GAME_INSTANCE = SoaringGameState(UPDATE_TIME_MS)

async def run_game(connected, game_state):
    while not game_state.check_finished():
        GAME_INSTANCE.update()
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
            game_state.update_position(id, event["position"])
        except ValueError as exc:
            # Send an "error" event if the move was illegal.
            print(exc)
            continue

async def join(websocket, id, name, color):
    # Register to receive moves from this game.
    CONNECTED_PLAYERS.add(websocket)
    print(f"Adding Player: {id}")

    GAME_INSTANCE.register_new_glider(id, name, color)
    try:
        # Send the first move, in case the first player already played it.
        await listen_client(websocket, id, GAME_INSTANCE)
    finally:
        print(f"Player {id} Left")
        GAME_INSTANCE.remove_glider(id)
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
        await join(websocket, event["id"], event["name"], event["color"])

async def main():
    async with serve(handler, "", 8080):
        await run_game(CONNECTED_PLAYERS, GAME_INSTANCE)
        await asyncio.get_running_loop().create_future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())

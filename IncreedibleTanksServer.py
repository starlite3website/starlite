import websockets
def start(websocket, uri):
    websocket.send('BigBobbit')
websockets.server.serve(start, "starlite3.tk", 0);

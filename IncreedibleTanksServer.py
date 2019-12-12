import websockets
def start(websocket, uri):
    await websocket.send('Does this work playcode.io?')
websockets.server.serve(start, "starlite3.tk", 0);

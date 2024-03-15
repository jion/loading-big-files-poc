const SyncServer = require('./WebSocketSyncServer');
const PORT = 8080; // Ensure this port matches your Docker and WebSocket client setup

var syncServer = new SyncServer(PORT);
syncServer.start();

console.log(`SyncServer started on port ${PORT}`);

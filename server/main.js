const mongoose = require('mongoose');
const SyncServer = require('./WebSocketSyncServer');
const PORT = 8080; // Ensure this port matches your Docker and WebSocket client setup

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection
  .once('open', () => {
    console.log('Connected to MongoDB');

    // Start the SyncServer only after successfully connecting to MongoDB
    const syncServer = new SyncServer(PORT);
    syncServer.start();
    console.log(`SyncServer started on port ${PORT}`);
  })
  .on('error', (error) => {
    console.log('Connection error:', error);
  });

const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

// Use environment variable for MongoDB connection URL
const mongoUrl = process.env.MONGO_URL;
const dbName = 'myDexieApp';
let db;

MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) throw err;
  console.log("Connected successfully to Mo`ngoDB");
  db = client.db(dbName);
});

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('Received: %s', message);
    // Implement logic for message handling and MongoDB interaction here
    ws.send('Message received!: ' + message);
  });

  ws.send('Connected to WebSocket server');
});

console.log('WebSocket server started on port 8080');

# POC - Uploading large sets of data by sharing a local cache

## Technology:
- IndexedDB as local cache & Frontend replica of the DB to show data
- MongoDB as the server DB
- [Dexie.js](https://dexie.org/), a Minimalistic Wrapper for IndexedDB
- Real-Time Data Sync: Implements [Dexie.js Syncable](https://dexie.org/docs/Syncable/Dexie.Syncable.js.html) protocol
- Adapts the ISyncProtocol for MongoDB, inspired by Dexie's example implementations ([server-side](https://github.com/dexie/Dexie.js/blob/master/samples/remote-sync/websocket/WebSocketSyncServer.js) - [client-side](https://github.com/dexie/Dexie.js/blob/master/samples/remote-sync/websocket/WebSocketSyncProtocol.js))
- Moongose library for interacting with MongoDB
- React.js for the client (CRA)
- Node.js for the server
- 2 WebWorkers, one for reading (streaming) the uploaded files, and another one for loading data into Dexie.

Diagram:
[Link](https://whimsical.com/poc-program-migrations-system-architecture-sequence-diagram-XVMMZjHBHJRwJZedgWKqso)
![Architecture Diagram](architecture.png)

## Known limitations

- Only supports customer data (JSONL where each line is a customer)
- Mongo connector is not a solid implementation, just as basic as I need for this demo
- Even though Dixie sends changes in chunks to the server, the server saves records one-by-one into the DB
- The implementation is kind of flaky, even the original sample implementations are not production ready
- 100k lines will cause the server to crash (OOM)

# Setup

```sh
docker-compose up -d
```

Once up, you can access the client by browsing http://localhost/

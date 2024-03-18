// import Dexie from 'dexie';
// import '../WebSocketSyncProtocol';
// import { db } from '../db';

// db.syncable.connect('websocket', 'ws://localhost:8080');
// db.syncable.on('statusChanged', (newStatus, url) => {
//   console.log(`Sync Status: ${Dexie.Syncable.StatusTexts[newStatus]}`);
// });

onmessage = async function(e) {
    const { file } = e.data;
    const reader = new FileReader();

    reader.onload = function() {
        // db.open().then(function (db) {
            const lines = reader.result.split('\n');
            for (const line of lines) {
                try {
                    if (line) { // Avoid empty lines
                        const customer = JSON.parse(line);
                        // Post each customer object back to the main thread
                        postMessage({ customer });
                        // console.log('Adding customer from worker:', customer);
                        // db.customers.add(customer).catch(error => {
                        //     console.error('Error adding customer to Dexie:', error);
                        // });
                    }
                } catch (error) {
                    console.error('Error parsing JSON line in worker:', error);
                    // Optionally, send error back to main thread
                    postMessage({ error: error.toString() });
                }
            }
        // }).catch (function (err) {
        //     console.log('Error opening database:', err);
        // });

    };

    reader.onerror = function(error) {
        console.error('FileReader error:', error);
        postMessage({ error: error.toString() });
    };

    reader.readAsText(file);
};

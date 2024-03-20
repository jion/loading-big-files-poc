import Dexie from 'dexie';
import { db } from '../db';


db.syncable.connect('websocket', 'ws://localhost:8080');
db.syncable.on('statusChanged', (newStatus, url) => {
  console.log(`Sync Status: ${Dexie.Syncable.StatusTexts[newStatus]}`);
});

async function upsertInBulk(data) {
    try {
        await db.open();
        await db.customers.bulkPut(data);
        console.log("[DexieDB] Data upserted successfully");
    } catch (error) {
        console.error('Error operating with Dexie:', error);
    }
}

onmessage = async function(event) {
    const message = event.data;

    if (message.action === "upsert_data_in_bulk") {
        console.log("[DexieDB] Upserting data in bulk to Dexie");
        await upsertInBulk(message.data);
        if(message.partial === false) {
            console.log("[DexieDB] Finished upserting data in bulk to Dexie");
            postMessage({
                "from": "dexie_db",
                "action": "finished_uploading",
                "timestamp": Date.now(),
            });
        }
    }
}

postMessage({
    action: "worker_loaded",
    from: "dexie_db",
    message: "Dexie upload worker loaded"
});

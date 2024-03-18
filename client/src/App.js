import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
// import './WebSocketSyncProtocol';
import { db } from './db';

// db.syncable.connect('websocket', 'ws://localhost:8080');
// db.syncable.on('statusChanged', (newStatus, url) => {
//   console.log(`Sync Status: ${Dexie.Syncable.StatusTexts[newStatus]}`);
// });

function CustomerDataComponent() {
  // Summary -------------------------------------------------------------------
  // dexie query, last 10 customers
  const customers = useLiveQuery(() => db.customers.orderBy('id').reverse().limit(10).toArray());

  const handleDelete = async (id) => {
    await db.customers.delete(id);
  };
  const handleClear = async () => {
    await db.customers.clear();
  }

  // Worker --------------------------------------------------------------------
  const [dbWorker, setDbWorker] = useState();
  const [fileWorker, setFileWorker] = useState();

  const [uploadStartTime, setUploadStartTime] = useState();
  const [uploadEndTime, setUploadEndTime] = useState();
  const [totalElapsedTime, setTotalElapsedTime] = useState();

  const [chunkSize, setChunkSize] = useState(1000);


  useEffect(() => {
    const dbWorker = new Worker(new URL('workers/DexieDB.worker.js', import.meta.url), { type: 'module' });
    setDbWorker(dbWorker);

    const handleDbWorkerMessage = event => {
      const { from, action, timestamp } = event.data;
      if (from === "dexie_db" && action === "finished_uploading") {
        setUploadEndTime(timestamp);
      }
    };

    dbWorker.addEventListener('message', handleDbWorkerMessage);
  }, []);

  useEffect(() => {
    if (!uploadEndTime || !uploadStartTime || (uploadEndTime < uploadStartTime)) return;
    setTotalElapsedTime(uploadEndTime - uploadStartTime);
  }, [uploadEndTime, uploadStartTime]);

  useEffect(() => {
    if (!dbWorker) return;
    const fileWorker = new Worker(new URL('workers/FileProcessor.worker.js', import.meta.url), { type: 'module' });
    setFileWorker(fileWorker);

    const handleFileWorkerMessage = event => {
      const { action, from, file_name, data, partial } = event.data;
      if (from === "file_processor" && action === "upsert_data_in_bulk") {
        dbWorker.postMessage({
          action: "upsert_data_in_bulk",
          data,
          partial,
        });
      }
    }

    fileWorker.addEventListener('message', handleFileWorkerMessage);
  }, [dbWorker]);

  // Dropzone ------------------------------------------------------------------
  const onDrop = useCallback(acceptedFiles => {
    if(!fileWorker) return;
    // Record start time
    setTotalElapsedTime(null);
    setUploadStartTime(Date.now())
    setUploadEndTime(null);

    // Send file to web worker for processing
    const file = acceptedFiles[0];
    fileWorker.postMessage({
      action: 'load_file',
      file,
      file_name: file.name,
      chunkSize,
    });
  }, [fileWorker, chunkSize]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  // React Component -----------------------------------------------------------
  return (
    <div>
      <div {...getRootProps()} style={{ border: '2px dashed #007bff', padding: '20px', marginBottom: '20px' }}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop a file here, or click to select a file</p>
      </div>
      {/* Display timestamps and elapsed time */}
      <div>
        {uploadStartTime && <p>Upload Start: {new Date(uploadStartTime).toLocaleString()}</p>}
        {uploadEndTime && <p>Dexie Loaded: {new Date(uploadEndTime).toLocaleString()}</p>}
        {totalElapsedTime && <p>Total Time Elapsed: {totalElapsedTime / 1000} seconds</p>}
      </div>
      {/* Component to adjust chunksize */}
      <div>
        <label>Chunk Size: </label>
        <input type="number" value={chunkSize} onChange={(e) => setChunkSize(e.target.value)} />
      </div>
      {/* Display customers */}
      <h2>Customers</h2>
      <p>Showing last 10 customers</p>
      <button onClick={() => handleClear()}>Reset Table</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {customers && customers.map(customer => (
            <tr key={customer.id}>
              <td>{customer.merchant_user_id}</td>
              <td>{customer.first_name}</td>
              <td>{customer.last_name}</td>
              <td>{customer.email}</td>
              <td><button onClick={() => handleDelete(customer.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CustomerDataComponent;

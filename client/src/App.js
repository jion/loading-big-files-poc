import React, { useState, useCallback } from 'react';
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDropzone } from 'react-dropzone';
import './WebSocketSyncProtocol';
import { db } from './db';

// Assuming your Web Worker script is named "worker.js" and located in the public folder
const worker = new Worker('worker.js');

db.syncable.connect('websocket', 'ws://localhost:8080');
db.syncable.on('statusChanged', (newStatus, url) => {
  console.log(`Sync Status: ${Dexie.Syncable.StatusTexts[newStatus]}`);
});

function CustomerDataComponent() {
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const customers = useLiveQuery(() => db.customers.toArray(), []);

  const onDrop = useCallback(acceptedFiles => {
    // Assuming only one file is accepted and processed
    const file = acceptedFiles[0];
    console.log('File accepted:', file);

    // Send file to web worker for processing
    worker.postMessage({ file });

  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('newCustomer:', newCustomer);
    await db.customers.add(newCustomer);
    setNewCustomer({ firstName: '', lastName: '', email: '' }); // Reset form
  };

  const handleDelete = async (id) => {
    await db.customers.delete(id);
  };

  return (
    <div>
      <div {...getRootProps()} style={{ border: '2px dashed #007bff', padding: '20px', marginBottom: '20px' }}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop a file here, or click to select a file</p>
      </div>
      <h2>Customers</h2>
      <table>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {customers && customers.map(customer => (
            <tr key={customer.id}>
              <td>{customer.firstName}</td>
              <td>{customer.lastName}</td>
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

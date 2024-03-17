import React, { useState, useEffect, useCallback } from 'react';
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
    // Send file to web worker for processing
    const file = acceptedFiles[0];
    worker.postMessage({ file });
  }, []);

  useEffect(() => {
    // Listen for messages from the worker
    const handleMessage = (event) => {
      const { customer, error } = event.data;
      if (error) {
        console.error('Error from worker:', error);
        return;
      }

      if (customer) {
        console.log('Adding customer from worker:', customer);
        db.customers.add(customer).catch(error => {
          console.error('Error adding customer to Dexie:', error);
        });
      }
    };

    worker.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      worker.removeEventListener('message', handleMessage);
    };
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

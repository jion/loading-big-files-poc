import React, { useState } from 'react';
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import './WebSocketSyncProtocol';
import { db } from './db';

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
          <tr>
            <td><input name="firstName" value={newCustomer.firstName} onChange={handleInputChange} /></td>
            <td><input name="lastName" value={newCustomer.lastName} onChange={handleInputChange} /></td>
            <td><input name="email" value={newCustomer.email} onChange={handleInputChange} /></td>
            <td><button onClick={handleSubmit}>Add Customer</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CustomerDataComponent;

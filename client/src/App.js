import React, { useState } from 'react';
import './App.css';

function App() {
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [ws, setWs] = useState(new WebSocket('ws://localhost:8080'));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ws.send(JSON.stringify(customer));
    alert('Customer data sent');
  };

  return (
    <div className="App">
      <header className="App-header">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstName"
            value={customer.firstName}
            onChange={handleChange}
            placeholder="First Name"
            required
          />
          <input
            type="text"
            name="lastName"
            value={customer.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            required
          />
          <input
            type="email"
            name="email"
            value={customer.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
          <button type="submit">Send Customer Data</button>
        </form>
      </header>
    </div>
  );
}

export default App;

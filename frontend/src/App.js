import React from 'react';
import Register from './components/Register';
import Login from './components/Login';
import FingerprintEnroll from './components/FingerprintEnroll';

function App(){
  return (
    <div style={{ padding: 20 }}>
      <h1>MERN Fingerprint Auth Demo</h1>
      <div style={{ display: 'flex', gap: 40 }}>
        <div>
          <Register />
          <FingerprintEnroll />
        </div>
        <div>
          <Login />
        </div>
      </div>
    </div>    
  );
}

export default App;
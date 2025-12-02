import React, { useState } from 'react';
import API, { setAuthToken } from '../api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', form);
      setMessage('Logged in');
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
    } catch (err) {
      setMessage('Error logging in');
    }
  };

  const loginWithFingerprint = async () => {
    try {
      const res = await API.post('/fingerprint/identify');
      // got token
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      setMessage('Logged in via fingerprint');
    } catch (err) {
      setMessage('Fingerprint login failed');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input name="email" value={form.email} onChange={handle} placeholder="Email" />
        <input name="password" type="password" value={form.password} onChange={handle} placeholder="Password" />
        <button type="submit">Login</button>
      </form>
      <hr />
      <button onClick={loginWithFingerprint}>Login with Fingerprint</button>
      <p>{message}</p>
    </div>
  );
}
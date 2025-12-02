import React, { useState } from 'react';
import API from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/signup', form);
      setMessage('Registered. You can now enroll fingerprint.');
      // store token locally
      localStorage.setItem('token', res.data.token);
      API.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handle} />
        <input name="email" placeholder="Email" value={form.email} onChange={handle} />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={handle} />
        <button type="submit">Sign Up</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
import React, { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Use environment variables for credentials (fallback to defaults for localhost)
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'india@123';
    
    if (username === adminUsername && password === adminPassword) {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen w-full text-white bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-900/80 flex items-center justify-center">
      <div className="bg-white/10 p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h2 className="text-3xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-purple-500/60"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-purple-500/60"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full mt-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl px-4 py-3 text-sm font-semibold shadow-lg shadow-purple-900/30"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

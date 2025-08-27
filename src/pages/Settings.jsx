import React, { useState, useEffect } from 'react';
import { Input, Label } from '../components/ui';

export default function SettingsPage() {
    const [name, setName] = useState("Girjesh");
  const [email, setEmail] = useState("you@example.com");
  const [notif, setNotif] = useState(true);

  return (
    <section className="mt-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Settings</h2>
      <div className="mt-4 grid gap-4">
        <Label>Profile</Label>
        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Email" value={email} onChange={setEmail} />
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
          <input type="checkbox" checked={notif} onChange={() => setNotif(!notif)} />
          <span>Email notifications</span>
        </div>
        <div className="text-right">
          <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600">Save Changes</button>
        </div>
      </div>
    </section>
  );
}

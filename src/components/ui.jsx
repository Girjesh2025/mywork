import React from 'react';

export function Card({ children, className = "" }) { return <div className={`rounded-2xl bg-white/5 border border-white/10 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] ${className}`}>{children}</div>; }
export function Th({ children }) { return <th className="px-4 py-3 text-xs uppercase tracking-wider text-white/70">{children}</th>; }
export function Td({ children, className = "" }) { return <td className={`px-4 py-3 ${className}`}>{children}</td>; }
export function Progress({ value }) { return (<div className="h-2 bg-white/10 rounded-full overflow-hidden w-40"><div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${value}%` }} /></div>); }
export function Select({ value, onChange, options, label }) {
  return (
    <label className="grid gap-1 text-sm min-w-[160px]">
      {label && <span className="opacity-70">{label}</span>}
      <div className="bg-white/10 rounded-xl px-3 py-2">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent outline-none w-full">
          {options.map((o) => (<option key={o} value={o} className="bg-indigo-900">{o}</option>))}
        </select>
      </div>
    </label>
  );
}
export function Input({ label, value, onChange, type = "text", min, max }) {
  return (
    <label className="grid gap-1 text-sm">
      {label && <span className="opacity-70">{label}</span>}
      <input type={type} min={min} max={max} value={value} onChange={(e) => onChange(e.target.value)} className="bg-white/10 rounded-xl px-3 py-2 outline-none" />
    </label>
  );
}
export function Label({ children }) { return <div className="text-sm font-semibold text-white/80">{children}</div>; }
export function TaskLine({ label, date, done }) { return (<div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><input type="checkbox" defaultChecked={done} /><span className={`text-sm ${done ? "line-through opacity-60" : ""}`}>{label}</span></div>{date && <span className="text-xs opacity-70">{date}</span>}</div>); }

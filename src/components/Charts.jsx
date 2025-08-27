import React from 'react';

export function StatTile({ title, value, icon, progress, badge }) {
  return (
    <div className="rounded-2xl bg-gradient-to-tr from-indigo-900/60 to-violet-800/20 border border-white/10 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center">{icon}</div>
          <div><div className="text-2xl font-extrabold">{value}</div><div className="text-sm opacity-70">{title}</div></div>
        </div>
        {badge && <span className="text-xs bg-white/10 px-2 py-1 rounded-lg">{badge}</span>}
      </div>
      {typeof progress === "number" && (<div className="mt-4 h-2 bg-white/10 rounded-full"><div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full" style={{ width: `${progress}%` }} /></div>)} 
    </div>
  );
}

export function DonutChart({ size = 180, thickness = 16, data, centerLabel = "" }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const value = (d.value / total) * circumference;
          const dashArray = `${value} ${circumference - value}`;
          const dashOffset = -acc;
          acc += value;
          return (
            <circle key={i} r={radius} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={dashArray} strokeDashoffset={dashOffset} transform="rotate(-90)" strokeLinecap="butt" />
          );
        })}
        <text textAnchor="middle" dominantBaseline="middle" className="fill-white" fontSize={size * 0.22} fontWeight={800} y={-6}>{centerLabel}</text>
        <text textAnchor="middle" dominantBaseline="middle" className="fill-white/70" fontSize={size * 0.09} y={18}>Percent</text>
      </g>
    </svg>
  );
}

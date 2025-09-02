import React, { useState } from 'react';
import { Card, Progress } from './ui';
import { CopyIcon } from './Icons';
import { niceDate, badgeFor, urlOfSite } from '../utils/helpers';

function PreviewImage({ url, status, width = 480, height = 270 }) {
  const apiUrl = `/api/screenshot?url=${encodeURIComponent(url)}&width=${width}&height=${height}&status=${encodeURIComponent(status)}`;

  return (
    <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-white/10 mb-3 bg-gray-800">
      <img
        src={apiUrl}
        alt={`${url} preview`}
        className="w-full h-full object-cover"
        // The browser's default behavior for a failed image src is sufficient.
        // A custom error component can be added back if specific UI is needed.
      />
    </div>
  );
}

export function ProjectCard({ p, onDelete, onEdit }) {
  return (
    <Card>
      <a href={urlOfSite(p.site)} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">
        <PreviewImage url={urlOfSite(p.site)} status={p.status} />
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-lg">{p.name}</h4>
            <p className="text-xs opacity-70">{p.site}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg bg-white/10">{p.progress}%</span>
        </div>
      </a>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">{p.tags?.map((t) => (<span key={t} className="px-2 py-1 rounded-lg bg-white/10">{t}</span>))}</div>
      <div className="mt-3 flex items-center justify-between text-xs opacity-70"><span>Last Updated</span><span className="flex items-center gap-2">{niceDate(p.updatedAt)} <CopyIcon className="w-4 h-4 opacity-70" /></span></div>
      <div className="mt-3 flex items-center justify-between">
        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeFor(p.status)}`}>{p.status}</span>
        <div className="flex gap-2">
          {onEdit && (<button onClick={onEdit} className="text-blue-400 hover:text-blue-200 text-xs">Edit</button>)}
          {onDelete && (<button onClick={onDelete} className="text-rose-400 hover:text-rose-200 text-xs">Delete</button>)}
        </div>
      </div>
    </Card>
  );
}

export function ProjectRow({ p }) {
  return (
    <Card>
      <a href={urlOfSite(p.site)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 hover:opacity-90 transition-opacity">
        <div className="flex-1">
          <h4 className="font-semibold">{p.name}</h4>
          <p className="text-xs opacity-70">{p.site}</p>
          <div className="mt-2 flex items-center gap-2"><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeFor(p.status)}`}>{p.status}</span><div className="ml-2"><Progress value={p.progress} /></div></div>
        </div>
        <div className="w-[130px] flex-shrink-0">
          <PreviewImage url={urlOfSite(p.site)} status={p.status} width={260} height={90} />
        </div>
      </a>
    </Card>
  );
}

import React, { useRef } from 'react';
import { Card, Progress } from './ui';
import { CopyIcon } from './Icons';
import { niceDate, badgeFor, urlOfSite } from '../utils/helpers';

function PreviewImage({ url, status, width = 480, height = 270 }) {
  const imgRef = useRef(null);

  // Get API base URL from environment or use relative URL
  // In production, we use the absolute URL from .env.production
  // In development, we use a relative URL that gets proxied through Vite
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const apiUrl = `${API_BASE_URL}/api/screenshot?url=${encodeURIComponent(url)}&width=${width}&height=${height}`;

  return (
    <div 
      ref={imgRef}
      className="relative aspect-[16/9] rounded-xl overflow-hidden border border-white/10 mb-3"
    >
      <img
        src={apiUrl}
        alt={`${url} preview`}
        className="w-full h-full object-cover"
      />

      {/* Status indicator overlay */}
      <div className="absolute top-2 right-2">
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          status === 'Live' ? 'bg-green-500/80 text-white' :
          status === 'Development' ? 'bg-yellow-500/80 text-white' :
          'bg-gray-500/80 text-white'
        }`}>
          {status}
        </div>
      </div>
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
      <div className="mt-3 flex items-center justify-between text-xs opacity-70">
        <span>Last Updated</span>
        <span className="flex items-center gap-2">
          {niceDate(p.updatedAt)} 
          <button 
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              navigator.clipboard.writeText(urlOfSite(p.site));
              // Optional: Show a toast notification
              console.log('URL copied to clipboard:', urlOfSite(p.site));
            }} 
            className="hover:opacity-100 transition-opacity"
            title="Copy URL to clipboard"
          >
            <CopyIcon className="w-4 h-4 opacity-70" />
          </button>
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeFor(p.status)}`}>{p.status}</span>
        <div className="flex gap-2">
          {onEdit && (<button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} className="px-2 py-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition-colors text-xs">Edit</button>)}
          {onDelete && (<button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} className="px-2 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 rounded transition-colors text-xs">Delete</button>)}
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

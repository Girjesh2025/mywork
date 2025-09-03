import React, { useState, useRef, useEffect } from 'react';
import { Card, Progress } from './ui';
import { CopyIcon } from './Icons';
import { niceDate, badgeFor, urlOfSite } from '../utils/helpers';

function PreviewImage({ url, status, width = 480, height = 270 }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  const apiUrl = `/api/screenshot?url=${encodeURIComponent(url)}&width=${width}&height=${height}&format=webp`;

  // Simple image loading
  const loadImage = () => {
    if (isLoaded || imageError) return;
    
    if (imgRef.current) {
      imgRef.current.src = apiUrl;
    }
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          loadImage();
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef}
      className="relative aspect-[16/9] rounded-xl overflow-hidden border border-white/10 mb-3 bg-gray-800"
    >
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-gray-400">Loading preview...</p>
          </div>
        </div>
      )}

      {/* Main image */}
      {isInView && (
        <img
          src={apiUrl}
          alt={`${url} preview`}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 to-red-800/50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-xs text-white">Preview unavailable</p>
          </div>
        </div>
      )}
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

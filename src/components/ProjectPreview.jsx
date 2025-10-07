import React, { useEffect, useState } from 'react';
import { normalizeSite, clampNum } from '../utils/helpers';

export function ProjectPreview({ projectData }) {
  const { name, site, status, progress } = projectData;
  const [animateProgress, setAnimateProgress] = useState(false);
  
  // Normalize the data for preview
  const normalizedSite = normalizeSite(site);
  const clampedProgress = clampNum(progress || 0, 0, 100);
  
  // Animate progress bar when progress changes
  useEffect(() => {
    setAnimateProgress(true);
    const timer = setTimeout(() => setAnimateProgress(false), 300);
    return () => clearTimeout(timer);
  }, [progress]);
  
  // Status color mapping
  const statusColors = {
    'Active': 'bg-emerald-500',
    'Live': 'bg-blue-500',
    'Planned': 'bg-yellow-500',
    'On Hold': 'bg-red-500'
  };
  
  const statusColor = statusColors[status] || 'bg-gray-500';
  
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <h4 className="text-sm font-semibold text-white/60 mb-3">Live Preview</h4>
      
      {/* Project Card Preview */}
      <div className="bg-white/10 rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-[1.02]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={`font-semibold text-white mb-1 transition-all duration-200 ${name ? 'opacity-100' : 'opacity-50'}`}>
              {name || 'Project Name'}
            </h3>
            <p className={`text-sm text-white/60 transition-all duration-200 ${site ? 'opacity-100' : 'opacity-50'}`}>
              {normalizedSite || 'project-site.com'}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white transition-all duration-300 ${statusColor}`}>
            {status || 'Planned'}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-white/60">Progress</span>
            <span className={`text-xs text-white/80 transition-all duration-200 ${animateProgress ? 'scale-110 font-bold' : ''}`}>
              {clampedProgress}%
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className={`bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2 rounded-full transition-all duration-500 ease-out ${animateProgress ? 'shadow-lg shadow-violet-500/50' : ''}`}
              style={{ width: `${clampedProgress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Action Buttons Preview */}
        <div className="flex gap-2">
          <button className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors">
            Edit
          </button>
          <button className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors">
            Delete
          </button>
        </div>
      </div>
      
      {/* Preview Details */}
      <div className="mt-3 text-xs text-white/50 space-y-1">
        <p className="flex items-center gap-2">
          <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
          Site URL: <span className="text-white/70">{normalizedSite || 'project-site.com'}</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="w-2 h-2 bg-fuchsia-500 rounded-full"></span>
          Progress: <span className="text-white/70">{clampedProgress}% (clamped 0-100)</span>
        </p>
        <p className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColor.replace('bg-', 'bg-')}`}></span>
          Status: <span className="text-white/70">{status || 'Planned'}</span>
        </p>
      </div>
    </div>
  );
}
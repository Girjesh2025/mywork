import React, { useState, useEffect } from 'react';
import { today } from '../utils/helpers';

export default function NextProjectPage() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [site, setSite] = useState("");
  const [status, setStatus] = useState("Planned");
  const [tags, setTags] = useState("");

  useEffect(() => {
    fetch('http://localhost:3001/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data.sort((a, b) => b.id - a.id)))
      .catch(error => console.error("Failed to fetch projects:", error));
  }, []);

  async function addProject() {
    if (!name || !site) return;
    
    const id = Math.max(...projects.map(p => p.id), 0) + 1;
    const newProject = {
      id,
      name,
      site,
      status,
      progress: status === 'Live' ? 100 : status === 'Active' ? 50 : 0,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      updatedAt: today()
    };

    try {
      const response = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (!response.ok) throw new Error('Failed to add project');
      const addedProject = await response.json();
      setProjects([addedProject, ...projects]);
      setName("");
      setSite("");
      setStatus("Planned");
      setTags("");
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteProject(projectId) {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete project');
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <section className="mt-6 max-w-4xl">
      <h2 className="text-2xl font-bold">Add New Project</h2>
      
      {/* Add Project Form */}
      <div className="mt-4 p-6 rounded-2xl bg-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Project name" 
            className="bg-white/10 rounded-xl px-4 py-3 outline-none" 
          />
          <input 
            value={site} 
            onChange={(e) => setSite(e.target.value)} 
            placeholder="Website URL (e.g., www.example.com)" 
            className="bg-white/10 rounded-xl px-4 py-3 outline-none" 
          />
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            className="bg-white/10 rounded-xl px-4 py-3 outline-none"
          >
            <option value="Planned">Planned</option>
            <option value="Active">Active</option>
            <option value="Live">Live</option>
            <option value="On Hold">On Hold</option>
          </select>
          <input 
            value={tags} 
            onChange={(e) => setTags(e.target.value)} 
            placeholder="Tags (comma separated)" 
            className="bg-white/10 rounded-xl px-4 py-3 outline-none" 
          />
        </div>
        <button 
          onClick={addProject} 
          className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-semibold hover:opacity-90 transition-opacity"
        >
          Add Project
        </button>
      </div>

      {/* Recent Projects List */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Recent Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map((p) => (
            <div key={p.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{p.name}</h4>
                <button 
                  onClick={() => deleteProject(p.id)} 
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  ×
                </button>
              </div>
              <p className="text-sm opacity-70 mb-2">{p.site}</p>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-lg ${
                  p.status === 'Live' ? 'bg-green-500/20 text-green-300' :
                  p.status === 'Active' ? 'bg-blue-500/20 text-blue-300' :
                  p.status === 'Planned' ? 'bg-orange-500/20 text-orange-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {p.status}
                </span>
                <span className="text-xs opacity-60">{p.progress}%</span>
              </div>
              {p.tags && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-white/10 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

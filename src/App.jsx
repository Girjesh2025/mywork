import React, { useState, useEffect } from 'react';
import { MENU } from './data/seed';
import { today } from './utils/helpers';
import { projectsAPI } from './utils/supabase';
import { SearchIcon, BadgeIcon, BellIcon, DotIcon } from './components/Icons';
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/Projects';
import StatusPage from './pages/Status';
import NextProjectPage from './pages/NextProject';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/LoginPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Changed to false to require login
  const [active, setActive] = useState("dashboard");
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  console.log('🏗️ App.jsx: Component rendered, projects state:', projects?.length || 0, 'projects');

  // Check for existing authentication on app load
  useEffect(() => {
    const savedAuth = localStorage.getItem('mywork_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    // Only fetch projects if authenticated
    if (!isAuthenticated) return;
    
    console.log('🔄 App.jsx: Fetching projects from Supabase...');
    setLoading(true);
    projectsAPI.getAll()
      .then(data => {
        console.log('✅ App.jsx: Projects received from Supabase:', data);
        console.log('📊 App.jsx: Total projects count:', data?.length || 0);
        console.log('🟢 App.jsx: Live projects:', data?.filter(p => p.status === 'Live') || []);
        console.log('🔍 App.jsx: All project names:', data?.map(p => p.name) || []);
        setProjects(data || []);
        setLoading(false);
      })
      .catch(error => {
        console.error("❌ App.jsx: Failed to fetch projects:", error);
        console.log('🔄 App.jsx: Setting empty array as fallback');
        setProjects([]);
        setLoading(false);
      });
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('mywork_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('mywork_authenticated');
    setProjects([]);
    setActive("dashboard");
  };

  async function handleAddProject() {
    const nextId = projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    const letter = String.fromCharCode(64 + ((nextId % 26) || 26));
    const name = `Project ${letter}`;
    const newProject = {
      name,
      site: `www.${letter.toLowerCase()}.com`,
      status: "Planned",
      progress: 0,
      tags: ["New"],
      updated_at: today()
    };

    try {
      const addedProject = await projectsAPI.create(newProject);
      setProjects(prev => [...prev, addedProject]);
      setActive("projects");
    } catch (error) {
      console.error(error);
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;

  return (
    <div className="min-h-screen w-full text-white bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-900/80 flex">
      <aside className="w-[260px] shrink-0 bg-gradient-to-b from-indigo-950/80 to-indigo-900/40 backdrop-blur border-r border-white/10 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2 pt-2 pb-4">
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-purple-400/60">
            <img src="https://i.pravatar.cc/100?img=8" alt="avatar" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-sm opacity-70">Welcome</p>
            <p className="font-semibold text-lg">Admin</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-white/60 hover:text-white/90 transition-colors p-1 rounded-lg hover:bg-white/10"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {MENU.map((m) => (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              className={`group w-full flex items-center gap-3 px-3 py-2 rounded-xl transition ${active === m.key ? "bg-indigo-700/40 text-white shadow-inner shadow-indigo-400/10" : "text-white/80 hover:text-white hover:bg-white/5"}`}>
              <m.icon className="w-5 h-5 opacity-90" />
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={handleAddProject} className="mt-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-lg shadow-purple-900/30">
          + Add Project
        </button>

        <div className="mt-2 p-3 rounded-xl bg-white/5 text-xs text-white/70">
          <p className="flex items-center gap-2"><DotIcon /> {totalProjects} Total Projects</p>
          <p className="mt-2 flex items-center gap-2"><DotIcon /> {activeProjects} Active Projects</p>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="relative flex-1 max-w-xl">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 outline-none focus:ring-2 ring-purple-500/60 placeholder:text-white/50" />
            <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 opacity-70" />
          </div>
          <div className="flex items-center gap-3">
            <BadgeIcon />
            <BellIcon />
          </div>
        </div>

        {active === "dashboard" && <Dashboard projects={projects} query={query} loading={loading} />}
        {active === "projects" && <ProjectsPage projects={projects} setProjects={setProjects} query={query} />}
        {active === "status" && <StatusPage projects={projects} />}
        {active === "next" && <NextProjectPage />}
        {active === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
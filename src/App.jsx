import React, { useState, useEffect } from 'react';
import { MENU } from './data/seed';
import { today } from './utils/helpers';
import { fetchProjects, addProject as apiAddProject } from './utils/api';
import { SearchIcon, BadgeIcon, BellIcon, DotIcon } from './components/Icons';
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/Projects';
import StatusPage from './pages/Status';
import NextProjectPage from './pages/NextProject';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/LoginPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [active, setActive] = useState("dashboard");
    const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    console.log('Fetching projects from API...');
    fetchProjects()
      .then(data => {
        console.log('Projects received from API:', data);
        console.log('Live projects:', data.filter(p => p.status === 'Live'));
        setProjects(data);
      })
      .catch(error => {
        console.error("Failed to fetch projects:", error);
      });
  }, []);

  async function handleAddProject() {
    const nextId = projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    const letter = String.fromCharCode(64 + ((nextId % 26) || 26));
    const name = `Project ${letter}`;
    const newProject = {
      id: nextId,
      name,
      site: `www.${letter.toLowerCase()}.com`,
      status: "Planned",
      progress: 0,
      tags: ["New"],
      updatedAt: today()
    };

    try {
      const addedProject = await apiAddProject(newProject);
      setProjects(prev => [...prev, addedProject]);
      setActive("projects");
    } catch (error) {
      console.error(error);
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
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
          <div>
            <p className="text-sm opacity-70">Welcome</p>
            <p className="font-semibold text-lg">Girjesh</p>
          </div>
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

        {active === "dashboard" && <Dashboard projects={projects} query={query} />}
        {active === "projects" && <ProjectsPage projects={projects} setProjects={setProjects} query={query} />}
        {active === "status" && <StatusPage projects={projects} />}
        {active === "next" && <NextProjectPage />}
        {active === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
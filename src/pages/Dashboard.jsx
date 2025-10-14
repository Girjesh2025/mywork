import React, { useMemo, useState, useEffect } from 'react';
import { Card, TaskLine } from '../components/ui';
import { StatTile, DonutChart } from '../components/Charts';
import { ProjectCard } from '../components/Project';
import { CubeIcon, LockIcon } from '../components/Icons';
import { tasksAPI } from '../utils/supabase';
import VisitorAnalytics from '../components/VisitorAnalytics';

// Function to get dynamic greeting based on current time
const getDynamicGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
};

// Digital Clock Component
const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="text-right">
      <div className="text-2xl font-mono font-bold text-white">
        {formatTime(time)}
      </div>
      <div className="text-sm text-white/70 mt-1">
        {formatDate(time)}
      </div>
    </div>
  );
};

export default function Dashboard({ projects, query, loading }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    tasksAPI.getAll().then(setTasks);
  }, []);

  // Move all useMemo hooks to the top level before any conditional returns
  const filtered = useMemo(() => {
    if (!projects || !Array.isArray(projects)) {
      console.log('⚠️ Dashboard: Projects is not an array:', projects);
      return [];
    }
    
    const result = projects.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(query.toLowerCase());
      const siteMatch = p.site?.toLowerCase().includes(query.toLowerCase());
      return nameMatch || siteMatch;
    });
    
    return result;
  }, [projects, query]);

  const stats = useMemo(() => {
    if (!projects || !Array.isArray(projects)) {
      console.log('⚠️ Dashboard: Projects is not an array for stats:', projects);
      return { total: 0, byStatus: { Active: 0, Live: 0, Planned: 0, "On Hold": 0 } };
    }
    
    const total = projects.length;
    const byStatus = {
      Active: projects.filter((p) => p.status === "Active").length,
      Live: projects.filter((p) => p.status === "Live").length,
      Planned: projects.filter((p) => p.status === "Planned").length,
      "On Hold": projects.filter((p) => p.status === "On Hold").length,
    };
    console.log('📈 Dashboard stats:', { total, byStatus });
    console.log('🟢 Live projects in stats:', projects.filter((p) => p.status === "Live"));
    return { total, byStatus };
  }, [projects]);

  const distribution = [
    { name: "Active", value: stats.byStatus["Active"], color: "#60a5fa" },
    { name: "Live", value: stats.byStatus["Live"], color: "#34d399" },
    { name: "Planned", value: stats.byStatus["Planned"], color: "#f59e0b" },
    { name: "On Hold", value: stats.byStatus["On Hold"], color: "#f87171" },
  ];

  console.log('🏠 Dashboard: Received projects prop:', projects);
  console.log('📊 Dashboard: Projects length:', projects?.length || 0);

  if (loading) {
    return (
      <section className="mt-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{getDynamicGreeting()}, Girjesh <span className="inline-block">👋</span></h1>
        <p className="text-white/70 mt-1">Loading your projects...</p>
        <div className="mt-6 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/60">Fetching projects from Supabase...</p>
        </div>
      </section>
    );
  }

  const handleAddTask = async () => {
    const label = prompt("Enter task label:");
    if (label) {
      const newTask = await tasksAPI.create({ label, done: false });
      setTasks([...tasks, newTask]);
    }
  };

  return (
    <section className="mt-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{getDynamicGreeting()}, Girjesh <span className="inline-block">👋</span></h1>
          <p className="text-white/70 mt-1">Here are your projects</p>
        </div>
        <DigitalClock />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="grid md:grid-cols-2 gap-6">
            <StatTile title="Total Projects" value={stats.total} icon={<CubeIcon />} progress={Math.min(100, Math.round((filtered.length / (stats.total || 1)) * 100))} />
            <StatTile title="Active Projects" value={stats.byStatus["Active"]} icon={<LockIcon />} badge="Planned" />
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-2 p-8 text-center bg-white/5 rounded-lg">
                <p className="text-lg">No projects found</p>
                <p className="text-sm text-white/60 mt-2">
                  {projects?.length === 0 ? 'No projects in database' : `No projects match "${query}"`}
                </p>
              </div>
            ) : (
              filtered.map((p) => (
                <ProjectCard key={p.id} p={p} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Visitor Analytics */}
          <VisitorAnalytics />
          
          <Card>
            <h3 className="text-lg font-semibold">Distribution</h3>
            <div className="flex items-center gap-6 mt-4">
              <DonutChart size={160} thickness={18} data={distribution} centerLabel={`${Math.round((distribution.reduce((a,b)=>a+b.value,0)/(stats.total||1))*100)}`} />
              <ul className="space-y-2 text-sm">
                {distribution.map((d) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
                    <span className="w-16 inline-block opacity-80">{d.name}</span>
                    <span className="opacity-70">{stats.total ? Math.round((d.value / stats.total) * 100) : 0}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold">Next Project</h3>
            <div className="mt-4 space-y-4 text-sm">
              {tasks.map((task) => (
                <TaskLine key={task.id} label={task.label} date={task.date} done={task.done} />
              ))}
              <div className="text-right">
                <button onClick={handleAddTask} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold">Add</button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

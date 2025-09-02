import React, { useMemo } from 'react';
import { Card, TaskLine } from '../components/ui';
import { StatTile, DonutChart } from '../components/Charts';
import { ProjectCard } from '../components/Project';
import { CubeIcon, LockIcon } from '../components/Icons';

export default function Dashboard({ projects, query }) {
  const filtered = useMemo(() => projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.site.toLowerCase().includes(query.toLowerCase())), [projects, query]);

  const stats = useMemo(() => {
    const total = projects.length;
    const byStatus = {
      Active: projects.filter((p) => p.status === "Active").length,
      Live: projects.filter((p) => p.status === "Live").length,
      Planned: projects.filter((p) => p.status === "Planned").length,
      "On Hold": projects.filter((p) => p.status === "On Hold").length,
    };
    return { total, byStatus };
  }, [projects]);

  const distribution = [
    { name: "Active", value: stats.byStatus["Active"], color: "#60a5fa" },
    { name: "Live", value: stats.byStatus["Live"], color: "#34d399" },
    { name: "Planned", value: stats.byStatus["Planned"], color: "#f59e0b" },
    { name: "On Hold", value: stats.byStatus["On Hold"], color: "#f87171" },
  ];

  return (
    <section className="mt-6">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Good evening, Girjesh <span className="inline-block">👋</span></h1>
      <p className="text-white/70 mt-1">Here are your projects</p>

      <div className="grid xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="grid md:grid-cols-2 gap-6">
            <StatTile title="Total Projects" value={stats.total} icon={<CubeIcon />} progress={Math.min(100, Math.round((filtered.length / (stats.total || 1)) * 100))} />
            <StatTile title="Active Projects" value={stats.byStatus["Active"]} icon={<LockIcon />} badge="Planned" />
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
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
              <TaskLine label="Set up auth" date="Aug 22, 2025" />
              <TaskLine label="Write documentation" done />
              <TaskLine label="Add email notifications" done />
              <div className="text-right">
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold">Add</button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

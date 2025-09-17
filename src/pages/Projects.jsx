import React, { useMemo, useState } from 'react';
import { Select, Input } from '../components/ui';
import { ProjectCard } from '../components/Project';
import { normalizeSite, clampNum, today } from '../utils/helpers';
import { updateProject, deleteProject as deleteProjectAPI } from '../utils/api';

export default function ProjectsPage({ projects, setProjects, query }) {
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ id: 0, name: "", site: "", status: "Planned", progress: 0, tags: [] });

  const filtered = useMemo(() => {
    let list = projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.site.toLowerCase().includes(query.toLowerCase()))
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (sort === "recent") list = list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    if (sort === "progress") list = list.sort((a, b) => b.progress - a.progress);
    return list;
  }, [projects, query, status, sort]);

    function startEdit(p) { setEditingId(p.id); setEditData({ ...p }); }

  async function saveEdit() {
    const projectToUpdate = { ...editData, site: normalizeSite(editData.site), progress: clampNum(editData.progress, 0, 100), updatedAt: today() };
    try {
      const updatedProject = await updateProject(editingId, projectToUpdate);
      setProjects(projects.map((p) => (p.id === editingId ? {...updatedProject, updatedAt: today()} : p)));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating project:', error);
      // Fallback for when API fails but we still want UI to update
      setProjects(projects.map((p) => (p.id === editingId ? {...projectToUpdate, id: editingId} : p)));
      setEditingId(null);
    }
  }

  async function deleteProject(projectId) {
    try {
      await deleteProjectAPI(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-white/60">All your projects at a glance (Editable)</p>
        </div>
        <div className="flex gap-3">
          <Select value={status} onChange={setStatus} options={["all", "Active", "Live", "Planned", "On Hold"]} />
          <Select value={sort} onChange={setSort} options={["recent", "progress"]} />
        </div>
      </div>

      {editingId && (
        <div className="mt-4 p-4 rounded-xl bg-white/10">
          <h3 className="font-semibold mb-2">Edit Project</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Name" value={editData.name} onChange={(v) => setEditData({ ...editData, name: v })} />
            <Input label="Site" value={editData.site} onChange={(v) => setEditData({ ...editData, site: v })} />
            <Select value={editData.status} onChange={(v) => setEditData({ ...editData, status: v })} options={["Active", "Live", "Planned", "On Hold"]} />
            <Input label="Progress %" type="number" min={0} max={100} value={editData.progress} onChange={(v) => setEditData({ ...editData, progress: Number(v) })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={saveEdit} className="px-4 py-2 bg-emerald-600 rounded-xl">Save</button>
            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-rose-600 rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {filtered.map((p) => (
          <ProjectCard key={p.id} p={p} onDelete={() => deleteProject(p.id)} onEdit={() => startEdit(p)} />
        ))}
      </div>
    </section>
  );
}

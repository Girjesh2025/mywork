import React, { useMemo, useState } from 'react';
import { Select, Input } from '../components/ui';
import { ProjectCard } from '../components/Project';
import { ProjectPreview } from '../components/ProjectPreview';
import { normalizeSite, clampNum, today } from '../utils/helpers';
import { projectsAPI } from '../utils/supabase';
import { useNotification } from '../components/Notification';

export default function ProjectsPage({ projects, setProjects, query }) {
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("recent");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ id: 0, name: "", site: "", status: "Planned", progress: 0, tags: [] });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState({ name: "", site: "", status: "Planned", progress: 0, tags: [] });
  
  const { showNotification, NotificationComponent } = useNotification();

  const filtered = useMemo(() => {
    let list = projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.site.toLowerCase().includes(query.toLowerCase()))
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (sort === "recent") list = list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    if (sort === "progress") list = list.sort((a, b) => b.progress - a.progress);
    return list;
  }, [projects, query, status, sort]);

    function startEdit(p) { setEditingId(p.id); setEditData({ ...p }); }

  async function saveEdit() {
    console.log('Save button clicked, editingId:', editingId, 'editData:', editData);
    
    if (!editingId) {
      console.error('No project ID to update');
      showNotification('No project selected for update', 'error');
      return;
    }
    
    const projectToUpdate = { 
      ...editData, 
      site: normalizeSite(editData.site), 
      progress: clampNum(editData.progress, 0, 100), 
      updated_at: today() 
    };
    
    console.log('Project to update:', projectToUpdate);
    
    try {
      const updatedProject = await projectsAPI.update(editingId, projectToUpdate);
      console.log('Project updated successfully:', updatedProject);
      setProjects(projects.map((p) => (p.id === editingId ? {...updatedProject, updated_at: today()} : p)));
      setEditingId(null);
      setEditData({ id: 0, name: "", site: "", status: "Planned", progress: 0, tags: [] });
      showNotification('Project saved successfully!', 'success');
    } catch (error) {
      console.error('Error updating project:', error);
      showNotification('Failed to save project. Please try again.', 'error');
      // Don't close the edit form on error so user can retry
    }
  }

  async function createProject() {
    const projectToCreate = { 
      ...createData, 
      site: normalizeSite(createData.site), 
      progress: clampNum(createData.progress, 0, 100), 
      updated_at: today(),
      tags: createData.tags.length ? createData.tags : ["New"]
    };
    
    try {
      const newProject = await projectsAPI.create(projectToCreate);
      setProjects([...projects, newProject]);
      setShowCreateForm(false);
      setCreateData({ name: "", site: "", status: "Planned", progress: 0, tags: [] });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  }

  async function deleteProject(projectId) {
    try {
      await projectsAPI.delete(projectId);
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
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-900/30"
          >
            + New Project
          </button>
          <Select value={status} onChange={setStatus} options={["all", "Active", "Live", "Planned", "On Hold"]} />
          <Select value={sort} onChange={setSort} options={["recent", "progress"]} />
        </div>
      </div>

      {showCreateForm && (
        <div className="mt-4 p-4 rounded-xl bg-white/10">
          <h3 className="font-semibold mb-2">Create New Project</h3>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div>
              <div className="grid gap-3">
                <Input label="Name" value={createData.name} onChange={(v) => setCreateData({ ...createData, name: v })} />
                <Input label="Site" value={createData.site} onChange={(v) => setCreateData({ ...createData, site: v })} />
                <Select value={createData.status} onChange={(v) => setCreateData({ ...createData, status: v })} options={["Active", "Live", "Planned", "On Hold"]} />
                <Input label="Progress %" type="number" min={0} max={100} value={createData.progress} onChange={(v) => setCreateData({ ...createData, progress: Number(v) })} />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={createProject} className="px-4 py-2 bg-emerald-600 rounded-xl">Create</button>
                <button onClick={() => { setShowCreateForm(false); setCreateData({ name: "", site: "", status: "Planned", progress: 0, tags: [] }); }} className="px-4 py-2 bg-rose-600 rounded-xl">Cancel</button>
              </div>
            </div>
            
            {/* Live Preview Section */}
            <div>
              <ProjectPreview projectData={createData} />
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="mt-4 p-4 rounded-xl bg-white/10">
          <h3 className="font-semibold mb-2">Edit Project</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Input label="Name" value={editData.name} onChange={(v) => setEditData({ ...editData, name: v })} />
              <Input label="Site" value={editData.site} onChange={(v) => setEditData({ ...editData, site: v })} />
              <Select value={editData.status} onChange={(v) => setEditData({ ...editData, status: v })} options={["Active", "Live", "Planned", "On Hold"]} />
              <Input label="Progress %" type="number" min={0} max={100} value={editData.progress} onChange={(v) => setEditData({ ...editData, progress: Number(v) })} />
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-white/70">Live Preview</h4>
              <ProjectPreview 
                projectData={editData}
              />
            </div>
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
      <NotificationComponent />
    </section>
  );
}

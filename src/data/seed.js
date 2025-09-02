import { DashIcon, FolderIcon, CheckIcon, ListIcon, SettingsIcon } from '../components/Icons';

export const MENU = [
  { key: "dashboard", label: "Dashboard", icon: DashIcon },
  { key: "projects", label: "Projects", icon: FolderIcon },
  { key: "status", label: "Status", icon: CheckIcon },
  { key: "next", label: "Next Project", icon: ListIcon },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

export const seedProjects = [
  { id: 1, name: "Project A", site: "www.a.com", status: "Active", progress: 70, tags: ["Landing", "Marketing"], updatedAt: "2025-08-10" },
  { id: 2, name: "Project B", site: "www.b.com", status: "Planned", progress: 35, tags: ["Shop", "UI"], updatedAt: "2025-07-02" },
  { id: 3, name: "Project C", site: "www.c.com", status: "Live", progress: 10, tags: ["Portfolio", "Design"], updatedAt: "2026-07-23" },
  { id: 4, name: "Project D", site: "www.d.com", status: "On Hold", progress: 50, tags: ["E‑commerce", "Design"], updatedAt: "2025-06-20" },
];

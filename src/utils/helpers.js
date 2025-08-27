export function niceDate(d) { try { return new Date(d).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" }); } catch { return d; } }
export function today() { return new Date().toISOString().slice(0, 10); }
export function clampNum(n, min, max) { n = Number(n); if (Number.isNaN(n)) return min; return Math.max(min, Math.min(max, n)); }
export function badgeFor(status) { switch (status) { case "Active": return "bg-blue-500/20 text-blue-200"; case "Live": return "bg-emerald-500/20 text-emerald-200"; case "Planned": return "bg-amber-500/20 text-amber-200"; case "On Hold": return "bg-rose-500/20 text-rose-200"; default: return "bg-white/10"; } }
export function normalizeSite(site) { if (!site) return ""; return site.replace(/^https?:\/\//i, ""); }
export function urlOfSite(site) { if (!site) return "#"; if (/^https?:\/\//i.test(site)) return site; return `https://${site}`; }

"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminTable, Column } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { PaginationBar } from "@/components/admin/PaginationBar";

type P = { id: string; title: string; summary: string; tags: string[]; demoUrl: string; repoUrl: string; videoHint: string; claps: number };

export default function AdminProjectsPage() {
  const [data, setData] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<P | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<P | null>(null);
  const [form, setForm] = useState({ id: "", title: "", summary: "", tags: "", demoUrl: "", repoUrl: "", videoHint: "", timePeriod: "", zh_title: "", zh_summary: "", zh_video_hint: "" });
  const [allSkills, setAllSkills] = useState<{ name: string; category: string; color: string }[]>([]);
  const [pickedSkills, setPickedSkills] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/projects?page=${page}&pageSize=${pageSize}`);
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      const j = await res.json();
      setData(j.data); setTotal(j.pagination.total); setTotalPages(j.pagination.totalPages);
    } catch { setError("Failed to load projects"); }
    finally { setLoading(false); }
  }, [page, pageSize]);
  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data) => {
        const list: { name: string; category: string; color: string }[] = [];
        for (const cat of data.categories) {
          for (const s of cat.skills) {
            list.push({ name: typeof s === "string" ? s : s.name, category: cat.title, color: cat.color });
          }
        }
        setAllSkills(list);
      })
      .catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setForm({ id: "", title: "", summary: "", tags: "", demoUrl: "", repoUrl: "", videoHint: "", timePeriod: "", zh_title: "", zh_summary: "", zh_video_hint: "" }); setPickedSkills([]); setModalOpen(true); };
  const openEdit = (r: P) => { setEditing(r); setForm({ id: r.id, title: (r as any).en_title || r.title, summary: (r as any).en_summary || r.summary, tags: r.tags.join(", "), demoUrl: r.demoUrl, repoUrl: r.repoUrl, videoHint: (r as any).en_video_hint || r.videoHint, timePeriod: (r as any).timePeriod || "", zh_title: (r as any).zh_title || "", zh_summary: (r as any).zh_summary || "", zh_video_hint: (r as any).zh_video_hint || "" }); setModalOpen(true); const existingSkills = (r as any).skills?.map((s: any) => s.name) || []; setPickedSkills(existingSkills); };

  const save = async () => {
    const payload = { ...form, tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean), skills: pickedSkills, timePeriod: form.timePeriod };
    const m = editing ? "PUT" : "POST";
    const u = editing ? `/api/admin/projects/${editing.id}` : "/api/admin/projects";
    await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setModalOpen(false); fetchData();
  };
  const del = async () => { if (!deleteTarget) return; await fetch(`/api/admin/projects/${deleteTarget.id}`, { method: "DELETE" }); setDeleteTarget(null); fetchData(); };

  const cols: Column<P>[] = [
    { key: "id", header: "ID", render: (r) => <span className="text-gray-400 font-mono text-xs">{r.id}</span>, className: "w-36" },
    { key: "t", header: "Title", render: (r) => <div><div className="font-semibold text-gray-800">{r.title}</div>{(r as any).zh_title && (r as any).zh_title !== r.title ? <div className="text-xs text-gray-400 mt-0.5">{(r as any).zh_title}</div> : null}</div> },
    { key: "g", header: "Tags", render: (r) => (
      <div className="flex gap-1.5 flex-wrap">{r.tags.map((t) => <span key={t} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg text-xs font-medium">{t}</span>)}</div>
    ), className: "w-52" },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-3 justify-end">
        <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="text-gray-400 hover:text-blue-600 text-xs font-semibold transition-colors">Edit</button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }} className="text-gray-400 hover:text-red-500 text-xs font-semibold transition-colors">Delete</button>
      </div>
    ), className: "w-28" },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-12">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your project portfolio</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">+ New Project</button>
      </div>
      {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-11 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      : error ? <div className="py-24 text-center"><p className="text-red-500 text-sm font-medium mb-3">{error}</p><button onClick={fetchData} className="text-sm text-blue-600 hover:underline font-medium">Retry</button></div>
      : (<><AdminTable columns={cols} data={data} keyFn={(r) => r.id} emptyMessage="No projects yet — add your first one above." />
          <PaginationBar page={page} pageSize={pageSize} total={total} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} /></>)}
      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Project" : "New Project"}>
        <div className="space-y-5">
          {!editing && <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">ID (slug)</label><input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>}
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Summary</label><textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={4} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all resize-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Tags <span className="font-normal text-gray-400">(comma-separated)</span></label><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">
              Skills <span className="font-normal text-gray-400">(select from skill library)</span>
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-1.5">
              {allSkills.length === 0 && (
                <p className="text-xs text-gray-400 py-2 text-center">Loading skills...</p>
              )}
              {allSkills.map((skill) => (
                <label key={skill.name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
                  <input
                    type="checkbox"
                    checked={pickedSkills.includes(skill.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPickedSkills([...pickedSkills, skill.name]);
                      } else {
                        setPickedSkills(pickedSkills.filter((s) => s !== skill.name));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: `var(--${skill.color})`, display: "inline-block" }} />
                  <span className="text-sm text-gray-700">{skill.name}</span>
                  <span className="text-[11px] text-gray-400 ml-auto">{skill.category}</span>
                </label>
              ))}
            </div>
          </div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Demo URL</label><input value={form.demoUrl} onChange={(e) => setForm({ ...form, demoUrl: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Repo URL</label><input value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Video Hint</label><input value={form.videoHint} onChange={(e) => setForm({ ...form, videoHint: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Time Period <span className="font-normal text-gray-400">(e.g. 2024, 2025-Present)</span></label><input value={form.timePeriod} onChange={(e) => setForm({ ...form, timePeriod: e.target.value })} placeholder="e.g. 2025-Present" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div className="flex justify-end pt-2"><button onClick={save} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">Save</button></div>
        </div>
      </AdminModal>
      <AdminConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={del} />
    </div>
  );
}
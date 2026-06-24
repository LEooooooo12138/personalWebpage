"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminTable, Column } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { PaginationBar } from "@/components/admin/PaginationBar";

type Exp = { id: string; year: string; title: string; description: string; note?: string; sort_order: number };

export default function AdminExperiencesPage() {
  const [data, setData] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Exp | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exp | null>(null);
  const [form, setForm] = useState({ year: "", title: "", description: "", note: "", zh_title: "", zh_description: "", zh_note: "" });

  const [allSkills, setAllSkills] = useState<{ name: string; category: string; color: string }[]>([]);
  const [pickedSkills, setPickedSkills] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/experiences?page=${page}&pageSize=${pageSize}`);
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      const j = await res.json();
      setData(j.data); setTotal(j.pagination.total); setTotalPages(j.pagination.totalPages);
    } catch { setError("Failed to load experiences"); }
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

  const openCreate = () => { setEditing(null); setForm({ year: "", title: "", description: "", note: "", zh_title: "", zh_description: "", zh_note: "" }); setPickedSkills([]); setModalOpen(true); };
  const openEdit = (r: Exp) => { setEditing(r); setForm({ year: r.year, title: (r as any).en_title || r.title, description: (r as any).en_description || r.description, note: (r as any).en_note || r.note || "", zh_title: (r as any).zh_title || "", zh_description: (r as any).zh_description || "", zh_note: (r as any).zh_note || "" }); setModalOpen(true); const existingSkills = (r as any).skills?.map((s: any) => s.name) || []; setPickedSkills(existingSkills); };

  const save = async () => {
    const m = editing ? "PUT" : "POST";
    const u = editing ? `/api/admin/experiences/${editing.id}` : "/api/admin/experiences";
    await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, skills: pickedSkills }) });
    setModalOpen(false); fetchData();
  };

  const del = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/experiences/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null); fetchData();
  };

  const cols: Column<Exp>[] = [
    { key: "s", header: "#", render: (r) => <span className="text-gray-400 tabular-nums text-xs">{r.sort_order}</span>, className: "w-12" },
    { key: "y", header: "Year", render: (r) => <span className="text-gray-500 font-mono text-xs">{r.year}</span>, className: "w-28" },
    { key: "t", header: "Title", render: (r) => <span className="font-semibold text-gray-800">{r.title}</span> },
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
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Experiences</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your experience timeline</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">+ New Experience</button>
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-2 gap-5 mb-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-1">Total Entries</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-1">Latest Year</p>
            <p className="text-2xl font-bold text-gray-900">{data.length ? Math.max(...data.map(d => parseInt(d.year) || 0)).toString() : "—"}</p>
          </div>
        </div>
      )}

      {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-11 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      : error ? <div className="py-24 text-center"><p className="text-red-500 text-sm font-medium mb-3">{error}</p><button onClick={fetchData} className="text-sm text-blue-600 hover:underline font-medium">Retry</button></div>
      : (<>
          <AdminTable columns={cols} data={data} keyFn={(r) => r.id} emptyMessage="No experiences yet — add your first one above." />
          <PaginationBar page={page} pageSize={pageSize} total={total} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>)}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Experience" : "New Experience"}>
        <div className="space-y-5">
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Year</label><input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all resize-none" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Note <span className="font-normal text-gray-400">(optional)</span></label><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          {/* ── Chinese i18n ── */}
          <div className="border-t border-gray-100 pt-5 mt-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-4">Chinese (中文) Translation</p>
            <div className="space-y-5">
              <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Title (中文)</label><input value={form.zh_title} onChange={(e) => setForm({ ...form, zh_title: e.target.value })} placeholder="Leave blank to use English title" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
              <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Description (中文)</label><textarea value={form.zh_description} onChange={(e) => setForm({ ...form, zh_description: e.target.value })} rows={4} placeholder="Leave blank to use English description" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all resize-none" /></div>
              <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Note (中文) <span className="font-normal text-gray-400">(optional)</span></label><input value={form.zh_note} onChange={(e) => setForm({ ...form, zh_note: e.target.value })} placeholder="Leave blank to use English note" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
            </div>
          </div>
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
          <div className="flex justify-end pt-2"><button onClick={save} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">Save</button></div>
        </div>
      </AdminModal>
      <AdminConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={del} />
    </div>
  );
}

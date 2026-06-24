"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminTable, Column } from "@/components/admin/AdminTable";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";

type Cat = { id: string; color: string; sort_order: number; en_title: string; en_description: string; zh_title: string; zh_description: string };
type Skill = { name: string; category_id: string; proficiency: number | null; sort_order: number };
type Lang = { lang: string; name: string };

export default function AdminSkillsPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [skillsByCat, setSkillsByCat] = useState<Record<string, Skill[]>>({});
  const [langs, setLangs] = useState<Lang[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [catModal, setCatModal] = useState(false);
  const [catEd, setCatEd] = useState<Cat | null>(null);
  const [catF, setCatF] = useState({ id: "", enTitle: "", zhTitle: "", enDesc: "", zhDesc: "", color: "gold", sortOrder: 0 });
  const [skModal, setSkModal] = useState(false);
  const [skEd, setSkEd] = useState<Skill | null>(null);
  const [skF, setSkF] = useState({ name: "", categoryId: "", proficiency: "" });
  const [langModal, setLangModal] = useState(false);
  const [langF, setLangF] = useState("");
  const [delSk, setDelSk] = useState<Skill | null>(null);

  const fd = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [cr, lr] = await Promise.all([fetch("/api/admin/skills/categories"), fetch("/api/admin/skills/languages")]);
      if (cr.status === 401) { window.location.href = "/admin/login"; return; }
      const cl: Cat[] = (await cr.json()).data;
      setCats(cl); setLangs((await lr.json()).data);
      const pk = await fetch("/api/skills?lang=en"); const pd = await pk.json();
      const sm: Record<string, Skill[]> = {};
      if (pd.categories) for (const c of pd.categories) sm[c.id] = c.skills.map((s: string, i: number) => ({ name: s, category_id: c.id, proficiency: null, sort_order: i }));
      setSkillsByCat(sm);
      if (cl.length && !sel) setSel(cl[0].id);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  }, [sel]);
  useEffect(() => { fd(); }, []);

  const saveCat = async () => {
    const m = catEd ? "PUT" : "POST";
    const u = catEd ? `/api/admin/skills/categories/${catEd.id}` : "/api/admin/skills/categories";
    await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(catF) });
    setCatModal(false); fd();
  };
  const deleteCat = async (id: string) => { await fetch(`/api/admin/skills/categories/${id}`, { method: "DELETE" }); if (sel === id) setSel(null); fd(); };

  const saveSk = async () => {
    const m = skEd ? "PUT" : "POST";
    const u = skEd ? `/api/admin/skills/${encodeURIComponent(skEd.name)}` : "/api/admin/skills";
    await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: skF.name, categoryId: skF.categoryId, proficiency: skF.proficiency ? parseInt(skF.proficiency) : null }) });
    setSkModal(false); fd();
  };
  const delSkFn = async () => { if (!delSk) return; await fetch(`/api/admin/skills/${encodeURIComponent(delSk.name)}?categoryId=${delSk.category_id}`, { method: "DELETE" }); setDelSk(null); fd(); };
  const saveLangs = async () => {
    const ls: Lang[] = [];
    for (const line of langF.trim().split("\n").filter(Boolean)) { const [l, ...r] = line.split(":"); if (l && r.length) ls.push({ lang: l.trim(), name: r.join(":").trim() }); }
    await fetch("/api/admin/skills/languages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ls) });
    setLangModal(false); fd();
  };

  const catCols: Column<Cat>[] = [
    { key: "c", header: "", render: (r) => <div className="w-3 h-3 rounded-full" style={{ background: r.color === "gold" ? "#c49b3f" : r.color === "terracotta" ? "#c4785b" : "#7d9a7a" }} />, className: "w-8" },
    { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs text-gray-400">{r.id}</span> },
    { key: "en", header: "English", render: (r) => <span className="font-semibold text-gray-800">{r.en_title}</span> },
    { key: "zh", header: "中文", render: (r) => <span className="text-gray-500">{r.zh_title}</span> },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-3 justify-end">
        <button onClick={(e) => { e.stopPropagation(); setCatEd(r); setCatF({ id: r.id, enTitle: r.en_title, zhTitle: r.zh_title, enDesc: r.en_description, zhDesc: r.zh_description, color: r.color, sortOrder: r.sort_order }); setCatModal(true); }} className="text-gray-400 hover:text-blue-600 text-xs font-semibold">Edit</button>
        <button onClick={(e) => { e.stopPropagation(); deleteCat(r.id); }} className="text-gray-400 hover:text-red-500 text-xs font-semibold">Delete</button>
      </div>
    ), className: "w-28" },
  ];
  const skCols: Column<Skill>[] = [
    { key: "n", header: "Name", render: (r) => <span className="font-semibold text-gray-800">{r.name}</span> },
    { key: "p", header: "Prof.", render: (r) => <span className="text-gray-400 tabular-nums">{r.proficiency ?? "—"}</span>, className: "w-20" },
    { key: "a", header: "", render: (r) => (
      <div className="flex gap-3 justify-end">
        <button onClick={(e) => { e.stopPropagation(); setSkEd(r); setSkF({ name: r.name, categoryId: r.category_id, proficiency: r.proficiency?.toString() || "" }); setSkModal(true); }} className="text-gray-400 hover:text-blue-600 text-xs font-semibold">Edit</button>
        <button onClick={(e) => { e.stopPropagation(); setDelSk(r); }} className="text-gray-400 hover:text-red-500 text-xs font-semibold">Delete</button>
      </div>
    ), className: "w-28" },
  ];

  const cur = sel ? (skillsByCat[sel] || []) : [];

  return (
    <div>
      <div className="flex items-start justify-between mb-12">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Skills</h1>
          <p className="text-sm text-gray-500 mt-1">Manage categories, skills, and languages</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setLangF(langs.map((l) => `${l.lang}: ${l.name}`).join("\n")); setLangModal(true); }} className="px-4 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-xs font-semibold hover:text-gray-800 hover:bg-gray-50 transition-all">Languages</button>
          <button onClick={() => { setCatEd(null); setCatF({ id: "", enTitle: "", zhTitle: "", enDesc: "", zhDesc: "", color: "gold", sortOrder: 0 }); setCatModal(true); }} className="px-4 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-xs font-semibold hover:text-gray-800 hover:bg-gray-50 transition-all">+ Category</button>
        </div>
      </div>
      {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-11 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      : error ? <div className="py-24 text-center"><p className="text-red-500 text-sm font-medium mb-3">{error}</p><button onClick={fd} className="text-sm text-blue-600 hover:underline font-medium">Retry</button></div>
      : (<>
        <div className="mb-8">
          <AdminTable columns={catCols} data={cats} keyFn={(r) => r.id} emptyMessage="No categories yet." />
        </div>
        {cats.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex gap-2 flex-wrap">
                {cats.map((c) => (
                  <button key={c.id} onClick={() => setSel(c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${sel === c.id ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200"}`}>
                    {c.en_title}
                  </button>
                ))}
              </div>
              <button onClick={() => { setSkEd(null); setSkF({ name: "", categoryId: sel || "", proficiency: "" }); setSkModal(true); }} className="px-4 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-xs font-semibold hover:text-gray-800 hover:bg-gray-50 transition-all">+ Skill</button>
            </div>
            <AdminTable columns={skCols} data={cur} keyFn={(r) => `${r.category_id}:${r.name}`} emptyMessage="No skills in this category." />
          </>
        )}
      </>)}

      <AdminModal open={catModal} onClose={() => setCatModal(false)} title={catEd ? "Edit Category" : "New Category"}>
        <div className="space-y-5">
          {!catEd && <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">ID</label><input value={catF.id} onChange={(e) => setCatF({ ...catF, id: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>}
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">English Title</label><input value={catF.enTitle} onChange={(e) => setCatF({ ...catF, enTitle: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">中文标题</label><input value={catF.zhTitle} onChange={(e) => setCatF({ ...catF, zhTitle: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">English Description</label><input value={catF.enDesc} onChange={(e) => setCatF({ ...catF, enDesc: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">中文描述</label><input value={catF.zhDesc} onChange={(e) => setCatF({ ...catF, zhDesc: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Color</label>
            <select value={catF.color} onChange={(e) => setCatF({ ...catF, color: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all">
              <option value="gold">Gold</option><option value="terracotta">Terracotta</option><option value="sage">Sage</option>
            </select>
          </div>
          <div className="flex justify-end pt-2"><button onClick={saveCat} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">Save</button></div>
        </div>
      </AdminModal>
      <AdminModal open={skModal} onClose={() => setSkModal(false)} title={skEd ? "Edit Skill" : "New Skill"}>
        <div className="space-y-5">
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Name</label><input value={skF.name} onChange={(e) => setSkF({ ...skF, name: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Category</label><select value={skF.categoryId} onChange={(e) => setSkF({ ...skF, categoryId: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all">{cats.map((c) => <option key={c.id} value={c.id}>{c.en_title}</option>)}</select></div>
          <div><label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Proficiency (0–100)</label><input type="number" value={skF.proficiency} onChange={(e) => setSkF({ ...skF, proficiency: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" /></div>
          <div className="flex justify-end pt-2"><button onClick={saveSk} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">Save</button></div>
        </div>
      </AdminModal>
      <AdminModal open={langModal} onClose={() => setLangModal(false)} title="Languages">
        <div className="space-y-5">
          <p className="text-xs text-gray-400">One per line, format: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">lang: name</code></p>
          <textarea value={langF} onChange={(e) => setLangF(e.target.value)} rows={8} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all font-mono text-xs resize-none" />
          <div className="flex justify-end pt-2"><button onClick={saveLangs} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20">Save</button></div>
        </div>
      </AdminModal>
      <AdminConfirmDialog open={!!delSk} onClose={() => setDelSk(null)} onConfirm={delSkFn} />
    </div>
  );
}
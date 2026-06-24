"use client";

import { useState, useEffect, useCallback } from "react";

export default function AdminProfilePage() {
  const [p, setP] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fd = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/profile");
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      setP((await res.json()).data);
    } catch { setError("Failed to load profile"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fd(); }, [fd]);

  const save = async () => {
    setSaving(true); setSaved(false);
    await fetch("/api/admin/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const up = (k: string, v: string) => setP({ ...p, [k]: v });

  if (loading) return <div className="space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-2xl" />)}</div>;
  if (error) return <div className="py-24 text-center"><p className="text-red-500 text-sm font-medium mb-3">{error}</p><button onClick={fd} className="text-sm text-blue-600 hover:underline font-medium">Retry</button></div>;

  return (
    <div>
      <div className="flex items-start justify-between mb-12">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Edit your portfolio profile</p>
        </div>
        <div className="flex items-center gap-4">
          {saved && <span className="text-green-600 text-sm font-semibold animate-in fade-in">✓ Saved</span>}
          <button onClick={save} disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Name</label>
          <input value={p.name || ""} onChange={(e) => up("name", e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Role</label>
          <input value={p.role || ""} onChange={(e) => up("role", e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Tagline</label>
          <input value={p.tagline || ""} onChange={(e) => up("tagline", e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Location Pool <span className="font-normal text-gray-400">(JSON array)</span></label>
          <textarea value={p.location_pool || "[]"} onChange={(e) => up("location_pool", e.target.value)} rows={3} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all font-mono text-xs resize-none" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Songs Pool <span className="font-normal text-gray-400">(JSON array)</span></label>
          <textarea value={p.songs_pool || "[]"} onChange={(e) => up("songs_pool", e.target.value)} rows={3} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all font-mono text-xs resize-none" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Stack <span className="font-normal text-gray-400">(JSON array)</span></label>
          <textarea value={p.stack || "[]"} onChange={(e) => up("stack", e.target.value)} rows={4} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 transition-all font-mono text-xs resize-none" />
        </div>
      </div>
    </div>
  );
}
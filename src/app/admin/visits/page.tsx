"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminTable, Column } from "@/components/admin/AdminTable";

type VS = { total: number; pages: { page: string; count: number }[] };

export default function AdminVisitsPage() {
  const [data, setData] = useState<VS | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fd = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/visits");
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      setData((await res.json()).data);
    } catch { setError("Failed to load visit stats"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fd(); }, [fd]);

  const cols: Column<{ page: string; count: number }>[] = [
    { key: "p", header: "Page", render: (r) => <span className="font-mono text-xs text-gray-800">{r.page}</span> },
    { key: "c", header: "Visits", render: (r) => <span className="font-bold text-gray-900 tabular-nums">{r.count.toLocaleString()}</span>, className: "w-28 text-right" },
  ];

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Visit Statistics</h1>
        <p className="text-sm text-gray-500 mt-1">Page view analytics</p>
      </div>
      {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-11 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      : error ? <div className="py-24 text-center"><p className="text-red-500 text-sm font-medium mb-3">{error}</p><button onClick={fd} className="text-sm text-blue-600 hover:underline font-medium">Retry</button></div>
      : data ? (<>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-12">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Total Visits Across All Pages</p>
          <p className="text-4xl font-bold text-gray-900 tracking-tight">{data.total.toLocaleString()}</p>
        </div>
        <AdminTable columns={cols} data={data.pages} keyFn={(r) => r.page} emptyMessage="No visits recorded yet." />
      </>) : null}
    </div>
  );
}
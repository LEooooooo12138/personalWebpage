"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminTable, Column } from "@/components/admin/AdminTable";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { PaginationBar } from "@/components/admin/PaginationBar";

type Note = { id: string; author: string; message: string; createdAt: string };

export default function AdminGuestbookPage() {
  const [data, setData] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [delT, setDelT] = useState<Note | null>(null);

  const fd = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/guestbook?page=${page}&pageSize=${pageSize}`);
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      const j = await res.json();
      setData(j.data); setTotal(j.pagination.total); setTotalPages(j.pagination.totalPages);
    } catch { setError("Failed to load guestbook"); }
    finally { setLoading(false); }
  }, [page, pageSize]);
  useEffect(() => { fd(); }, [fd]);

  const del = async () => { if (!delT) return; await fetch(`/api/admin/guestbook/${delT.id}`, { method: "DELETE" }); setDelT(null); fd(); };

  const cols: Column<Note>[] = [
    { key: "a", header: "Author", render: (r) => <span className="font-semibold text-gray-800">{r.author}</span>, className: "w-36" },
    { key: "m", header: "Message", render: (r) => <span className="text-gray-600">{r.message}</span> },
    { key: "d", header: "Date", render: (r) => <span className="text-gray-400 text-xs tabular-nums">{new Date(r.createdAt).toLocaleDateString()}</span>, className: "w-28" },
    { key: "x", header: "", render: (r) => <button onClick={(e) => { e.stopPropagation(); setDelT(r); }} className="text-gray-400 hover:text-red-500 text-xs font-semibold transition-colors">Delete</button>, className: "w-20 text-right" },
  ];

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Guestbook</h1>
        <p className="text-sm text-gray-500 mt-1">Moderate guestbook entries</p>
      </div>
      {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-11 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      : error ? <div className="py-24 text-center"><p className="text-red-500 text-sm font-medium mb-3">{error}</p><button onClick={fd} className="text-sm text-blue-600 hover:underline font-medium">Retry</button></div>
      : (<><AdminTable columns={cols} data={data} keyFn={(r) => r.id} emptyMessage="No guestbook entries yet." />
          <PaginationBar page={page} pageSize={pageSize} total={total} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} /></>)}
      <AdminConfirmDialog open={!!delT} onClose={() => setDelT(null)} onConfirm={del} />
    </div>
  );
}
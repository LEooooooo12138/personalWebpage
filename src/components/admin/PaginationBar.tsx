"use client";

import clsx from "clsx";

type Props = {
  page: number; pageSize: number; total: number; totalPages: number;
  onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
};

const SIZES = [10, 20, 50];

export function PaginationBar({ page, pageSize, total, totalPages, onPageChange, onPageSizeChange }: Props) {
  if (total === 0) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
    .reduce<(number | "...")[]>((acc, n, i, arr) => {
      if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("...");
      acc.push(n); return acc;
    }, []);

  return (
    <div className="flex items-center justify-between pt-8 text-sm">
      <div className="flex items-center gap-3 text-gray-500">
        <span className="text-xs">Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-gray-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 appearance-none cursor-pointer"
        >
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-gray-400">of {total}</span>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="px-3 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed text-gray-400 text-xs font-semibold transition-colors">
          Prev
        </button>
        {pages.map((n, i) =>
          n === "..." ? (
            <span key={`d-${i}`} className="w-9 text-center text-gray-300 text-xs">…</span>
          ) : (
            <button key={n} onClick={() => onPageChange(n)}
              className={clsx(
                "w-9 h-9 rounded-lg text-xs font-semibold transition-all",
                n === page
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
              )}>
              {n}
            </button>
          ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="px-3 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed text-gray-400 text-xs font-semibold transition-colors">
          Next
        </button>
      </div>
    </div>
  );
}

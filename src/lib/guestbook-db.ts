import { list, put } from "@vercel/blob";
import { GuestNote } from "@/types/portfolio";
import { getPortfolioDb } from "@/lib/portfolio-db";
import { shouldUseBlob } from "@/lib/db-factory";

type GuestbookRow = {
  id: string;
  author: string;
  message: string;
  created_at: string;
};

const BLOB_PREFIX = "guestbook/notes/";

/* ── Blob backend ── */

const listFromBlob = async (): Promise<GuestNote[]> => {
  const notes: GuestNote[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({
      prefix: BLOB_PREFIX,
      cursor,
      limit: 1000,
    });

    for (const blob of result.blobs) {
      const response = await fetch(blob.url, { cache: "no-store" });
      if (!response.ok) continue;
      const parsed = (await response.json()) as GuestNote;
      if (
        parsed &&
        typeof parsed.id === "string" &&
        typeof parsed.author === "string" &&
        typeof parsed.message === "string" &&
        typeof parsed.createdAt === "string"
      ) {
        notes.push(parsed);
      }
    }

    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500);
};

const insertToBlob = async (note: GuestNote) => {
  await put(`${BLOB_PREFIX}${note.id}.json`, JSON.stringify(note), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    allowOverwrite: false,
  });
};

/* ── SQLite backend ── */

const listFromSqlite = (): GuestNote[] => {
  const db = getPortfolioDb();
  const rows = db
    .prepare(
      "SELECT id, author, message, created_at FROM guestbook_notes ORDER BY created_at DESC LIMIT 500",
    )
    .all() as GuestbookRow[];

  return rows.map((row) => ({
    id: row.id,
    author: row.author,
    message: row.message,
    createdAt: row.created_at,
  }));
};

const insertToSqlite = (note: GuestNote) => {
  const db = getPortfolioDb();
  db.prepare(
    "INSERT INTO guestbook_notes (id, author, message, created_at) VALUES (?, ?, ?, ?)",
  ).run(note.id, note.author, note.message, note.createdAt);
};

/* ── Public API ── */

export const listGuestbookNotes = async (): Promise<GuestNote[]> => {
  if (shouldUseBlob()) return listFromBlob();
  return listFromSqlite();
};

export const insertGuestbookNote = async (note: GuestNote): Promise<GuestNote> => {
  if (shouldUseBlob()) {
    await insertToBlob(note);
    return note;
  }
  insertToSqlite(note);
  return note;
};

/* ── Admin API ── */

export type PaginatedResult<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export function listGuestbookAdmin(page: number, pageSize: number): PaginatedResult<GuestNote> {
  const db = getPortfolioDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM guestbook_notes").get() as { c: number }).c;
  const rows = db
    .prepare("SELECT id, author, message, created_at FROM guestbook_notes ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(pageSize, (page - 1) * pageSize) as GuestbookRow[];

  return {
    data: rows.map((r) => ({ id: r.id, author: r.author, message: r.message, createdAt: r.created_at })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 },
  };
}

export function deleteGuestbookNote(id: string): void {
  const db = getPortfolioDb();
  db.prepare("DELETE FROM guestbook_notes WHERE id = ?").run(id);
}

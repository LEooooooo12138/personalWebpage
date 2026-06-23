import { list, put } from "@vercel/blob";
import { GuestNote } from "@/types/portfolio";
import { getSingletonDb, shouldUseBlob } from "@/lib/db-factory";

type GuestbookRow = {
  id: string;
  author: string;
  message: string;
  created_at: string;
};

const BLOB_PREFIX = "guestbook/notes/";

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS guestbook_notes (
    id TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_guestbook_created_at
  ON guestbook_notes(created_at DESC);
`;

/* ── Blob 后端 ── */

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

/* ── SQLite 后端 ── */

const listFromSqlite = (): GuestNote[] => {
  const db = getSingletonDb("guestbook", SCHEMA_SQL);
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
  const db = getSingletonDb("guestbook", SCHEMA_SQL);
  db.prepare(
    "INSERT INTO guestbook_notes (id, author, message, created_at) VALUES (?, ?, ?, ?)",
  ).run(note.id, note.author, note.message, note.createdAt);
};

/* ── 对外接口 ── */

export const listGuestbookNotes = async (): Promise<GuestNote[]> => {
  if (shouldUseBlob()) {
    return listFromBlob();
  }
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

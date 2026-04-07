import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { GuestNote } from "@/types/portfolio";

type GuestbookRow = {
  id: string;
  author: string;
  message: string;
  created_at: string;
};

declare global {
  var __guestbookDb: Database.Database | undefined;
}

const getFallbackJsonPath = () => {
  const baseDir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return path.join(baseDir, "guestbook.json");
};

const readFallbackNotes = (): GuestNote[] => {
  const jsonPath = getFallbackJsonPath();
  if (!fs.existsSync(jsonPath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const parsed = JSON.parse(raw) as GuestNote[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
};

const writeFallbackNotes = (notes: GuestNote[]) => {
  fs.writeFileSync(getFallbackJsonPath(), JSON.stringify(notes, null, 2), "utf-8");
};

const getDbPath = () => {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "guestbook.db");
};

const getDb = () => {
  if (!globalThis.__guestbookDb) {
    const db = new Database(getDbPath());
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS guestbook_notes (
        id TEXT PRIMARY KEY,
        author TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_guestbook_created_at
      ON guestbook_notes(created_at DESC);
    `);
    globalThis.__guestbookDb = db;
  }
  return globalThis.__guestbookDb;
};

export const listGuestbookNotes = (): GuestNote[] => {
  try {
    const db = getDb();
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
  } catch {
    return readFallbackNotes()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 500);
  }
};

export const insertGuestbookNote = (note: GuestNote): GuestNote => {
  try {
    const db = getDb();
    db.prepare(
      "INSERT INTO guestbook_notes (id, author, message, created_at) VALUES (?, ?, ?, ?)",
    ).run(note.id, note.author, note.message, note.createdAt);
  } catch {
    const notes = readFallbackNotes();
    notes.push(note);
    writeFallbackNotes(notes);
  }
  return note;
};

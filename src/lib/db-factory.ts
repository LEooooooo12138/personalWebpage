import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

declare global {
  var __dbs: Record<string, Database.Database> | undefined;
}

export const shouldUseBlob = (): boolean =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const ensureDataDir = (): string => {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

export const getSingletonDb = (
  dbName: string,
  schemaSql: string,
): Database.Database => {
  if (!globalThis.__dbs) globalThis.__dbs = {};

  if (!globalThis.__dbs[dbName]) {
    const dbPath = path.join(ensureDataDir(), `${dbName}.db`);
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(schemaSql);
    globalThis.__dbs[dbName] = db;
  }

  return globalThis.__dbs[dbName];
};

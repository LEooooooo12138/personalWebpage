import { getPortfolioDb } from "@/lib/portfolio-db";

export type ProfileData = Record<string, string>;

export function getProfile(): ProfileData {
  const db = getPortfolioDb();
  const rows = db.prepare("SELECT key, value FROM profile").all() as { key: string; value: string }[];
  const result: ProfileData = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export function updateProfile(fields: Record<string, string>): void {
  const db = getPortfolioDb();
  const stmt = db.prepare("INSERT OR REPLACE INTO profile (key, value) VALUES (?, ?)");
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(fields)) {
      stmt.run(key, value);
    }
  });
  tx();
}

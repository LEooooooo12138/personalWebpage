import { cookies } from "next/headers";
import { getPortfolioDb } from "@/lib/portfolio-db";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "admin_token";
const SESSION_HOURS = 24;

export type AdminUser = { id: string; username: string };

// ── Session helpers ──

function generateToken(): string {
  return crypto.randomUUID();
}

function expiryISO(): string {
  return new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
}

// ── Auth actions ──

export async function createSession(password: string): Promise<AdminUser | null> {
  const db = getPortfolioDb();
  const user = db.prepare("SELECT id, username, password_hash FROM admin_users").get() as {
    id: string; username: string; password_hash: string;
  } | undefined;

  if (!user) return null;

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return null;

  const token = generateToken();
  db.prepare("INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    token, user.id, expiryISO(),
  );

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });

  return { id: user.id, username: user.username };
}

export async function validateSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const db = getPortfolioDb();
  const session = db.prepare(
    "SELECT s.user_id, s.expires_at, u.username FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token = ?",
  ).get(token) as { user_id: string; expires_at: string; username: string } | undefined;

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    db.prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
    return null;
  }

  return { id: session.user_id, username: session.username };
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const db = getPortfolioDb();
    db.prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
  }

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

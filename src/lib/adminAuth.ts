import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const COOKIE = "da_admin";
const SESSION_HOURS = 12;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function audit(userId: string | null, action: string, entityType?: string, entityId?: string, detail?: string) {
  await db.auditLog.create({ data: { userId, action, entityType, entityId, detail } });
}

// One-time setup. Runs only while no admin exists. Reads the email and a temporary
// password from Railway environment variables. Forces a password change on first login.
async function ensureFirstAdmin() {
  if ((await db.adminUser.count()) > 0) return;
  const email = process.env.ADMIN_SETUP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SETUP_PASSWORD;
  if (!email || !password) return;
  await db.adminUser.create({
    data: { email, passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true },
  });
  await audit(null, "setup.first_admin_created");
}

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureFirstAdmin();
  const generic = { ok: false as const, error: "That did not work." };
  const user = await db.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    await bcrypt.compare(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi");
    return generic;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) return { ok: false, error: "Too many tries. Wait 15 minutes." };
  const good = await bcrypt.compare(password, user.passwordHash);
  if (!good) {
    const fails = user.failedLogins + 1;
    await db.adminUser.update({
      where: { id: user.id },
      data: fails >= MAX_FAILS
        ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) }
        : { failedLogins: fails },
    });
    await audit(user.id, "login.failed");
    return generic;
  }
  await db.adminUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000);
  await db.adminSession.create({ data: { tokenHash: sha(token), userId: user.id, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    expires: expiresAt,
  });
  await audit(user.id, "login.ok");
  return { ok: true };
}

export async function currentAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.adminSession.findUnique({ where: { tokenHash: sha(token) }, include: { user: true } });
  if (!s || s.expiresAt < new Date()) return null;
  return s.user;
}

export async function requireAdmin() {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  if (user.mustChangePassword) redirect("/admin/change-password");
  return user;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: sha(token) } });
  jar.delete({ name: COOKIE, path: "/admin" });
}

export async function changePassword(userId: string, next: string) {
  await db.adminUser.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(next, 12), mustChangePassword: false },
  });
  await audit(userId, "password.changed");
}

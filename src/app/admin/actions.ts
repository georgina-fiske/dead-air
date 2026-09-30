"use server";
import { redirect } from "next/navigation";
import { changePassword, currentAdmin, login, logout } from "@/lib/adminAuth";

export type FormState = { error?: string; values?: Record<string, string> };

// Server actions check the Origin header against the Host. Cookies are SameSite=Strict.
export async function loginAction(_: FormState | undefined, form: FormData) {
  const email = String(form.get("email") ?? "");
  const r = await login(email, String(form.get("password") ?? ""));
  if (!r.ok) return { error: r.error, values: { email } };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

export async function changePasswordAction(_: FormState | undefined, form: FormData) {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  const a = String(form.get("password") ?? "");
  const b = String(form.get("confirm") ?? "");
  if (a.length < 12) return { error: "Use at least 12 characters." };
  if (a !== b) return { error: "The two passwords do not match." };
  await changePassword(user.id, a);
  redirect("/admin");
}

import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/adminAuth";
import { changePasswordAction } from "../actions";
import { AuthForm } from "../AuthForm";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  return (
    <section className="sec narrow">
      <h1 className="h1">New password</h1>
      <p className="note">{user.mustChangePassword ? "Pick your own password before you go in." : "Change your password."}</p>
      <AuthForm
        action={changePasswordAction}
        button="Save password"
        fields={[
          { name: "password", label: "New password (12+ characters)", type: "password", autoComplete: "new-password" },
          { name: "confirm", label: "Type it again", type: "password", autoComplete: "new-password" },
        ]}
      />
    </section>
  );
}

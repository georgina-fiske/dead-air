import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/adminAuth";
import { loginAction } from "../actions";
import { AuthForm } from "../AuthForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <section className="sec narrow">
      <h1 className="h1">Log in</h1>
      <AuthForm
        action={loginAction}
        button="Log in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "username" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
    </section>
  );
}

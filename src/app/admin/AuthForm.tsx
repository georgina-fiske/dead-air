"use client";
import { useActionState } from "react";

import type { FormState } from "./actions";

type Action = (s: FormState | undefined, f: FormData) => Promise<FormState | undefined>;

export function AuthForm({ action, fields, button }: {
  action: Action;
  fields: { name: string; label: string; type: string; autoComplete: string }[];
  button: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="form">
      {fields.map((f) => (
        <label key={f.name}>
          <span>{f.label}</span>
          <input name={f.name} type={f.type} autoComplete={f.autoComplete} defaultValue={state?.values?.[f.name]} required />
        </label>
      ))}
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Wait." : button}</button>
    </form>
  );
}

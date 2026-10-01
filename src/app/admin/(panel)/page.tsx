import { QuickAddForm } from "./quick-add/QuickAddForm";

export const dynamic = "force-dynamic";

// Quick add is the default admin screen. It always starts blank.
export default function QuickAddPage() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date());
  return (
    <section className="sec narrow-form" style={{ maxWidth: 760 }}>
      <div className="sec-head"><h2>Quick add</h2></div>
      <p className="note">Drop in the photos, paste the text, paste the links, press one button. Then check the preview and publish.</p>
      <QuickAddForm today={today} />
    </section>
  );
}

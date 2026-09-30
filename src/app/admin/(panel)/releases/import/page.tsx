import { ImportForm } from "./ImportForm";

export default function ImportPage() {
  return (
    <section className="sec">
      <div className="sec-head"><h2>Import releases</h2></div>
      <p className="note">Columns: artist, title, type (Single, EP, Album, Live album), date (YYYY-MM-DD or DD/MM/YYYY), label. You see a preview before anything is saved.</p>
      <ImportForm />
    </section>
  );
}

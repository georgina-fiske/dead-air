import { ReleaseForm } from "../ReleaseForm";

export default function NewRelease() {
  return (
    <section className="sec narrow-form">
      <div className="sec-head"><h2>New release</h2></div>
      <ReleaseForm r={{ artist: "", title: "", type: "SINGLE", releaseDate: "", label: "", sourceUrl: "" }} />
    </section>
  );
}

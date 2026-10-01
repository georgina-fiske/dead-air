import { OpinionEditor } from "../OpinionEditor";

export default function NewOpinion() {
  return (
    <section className="sec">
      <div className="sec-head"><h2>New piece</h2></div>
      <OpinionEditor init={{ title: "", bodyHtml: "" }} />
    </section>
  );
}

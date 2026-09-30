import { InterviewEditor } from "../InterviewEditor";

export default function NewInterview() {
  return (
    <section className="sec">
      <div className="sec-head"><h2>New interview</h2></div>
      <InterviewEditor init={{ artist: "", subtitle: "", date: "", qa: [] }} />
    </section>
  );
}

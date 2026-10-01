"use client";
import { useId, useState } from "react";
import type { TriviaItem } from "@/lib/pressText";

// "Reveal answer" buttons. Real buttons, with aria-expanded.
export function Trivia({ items }: { items: TriviaItem[] }) {
  const base = useId();
  const [open, setOpen] = useState<Record<number, boolean>>({});
  if (items.length === 0) return null;
  return (
    <section className="trivia" aria-labelledby={`${base}-h`}>
      <h2 id={`${base}-h`} className="trivia-h">Pub trivia cheat sheet</h2>
      <ol className="trivia-list">
        {items.map((t, i) => {
          const id = `${base}-a${i}`;
          const isOpen = !!open[i];
          return (
            <li key={i} className="trivia-item">
              <p className="trivia-q">{t.question}</p>
              <button type="button" className="reveal" aria-expanded={isOpen} aria-controls={id} onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
                {isOpen ? "Hide answer" : "Reveal answer"}
              </button>
              <p id={id} className="trivia-a" hidden={!isOpen}>{t.answer}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

import { useNavigate } from "react-router";
import { BackLink } from "../components/BackLink";
import { motion } from "motion/react";
import { WIKI_NOTES } from "../data/wiki";

export function Wiki() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-page flex flex-col overflow-y-auto">
      <div className="editorial-radial-wash" aria-hidden="true" />

      <div className="relative z-10 pt-12 px-6 pb-2 flex items-center justify-between">
        <BackLink to="/" label="Inicio" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 px-6 pb-12"
      >
        <div className="mb-8">
          <p className="editorial-eyebrow mb-2">Wiki ritual</p>
          <h1 className="mb-2.5 font-serif text-title-1 text-ink-strong">Biblioteca de notas y prácticas</h1>
          <p className="font-sans text-body text-ink-muted">
            Este espacio queda preparado para sumar la información extensa sobre rituales, velas,
            preparación y prácticas compartidas.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {WIKI_NOTES.map((note, index) => (
            <motion.button
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              onClick={() => navigate(`/wiki/${note.id}`)}
              type="button"
              className="group relative isolate flex min-h-[200px] w-full flex-col justify-end overflow-hidden rounded-card border border-line-soft text-left transition-all hover:scale-[0.99] active:scale-[0.98]"
            >
              {/* Background Image & Overlay */}
              <div className="absolute inset-0 z-0 bg-surface-soft">
                {note.image && (
                  <img
                    src={note.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                {/* Subtle gradient for text legibility ONLY at the very bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              </div>

              {/* Text Content */}
              <div className="relative z-10 px-6 py-6 w-full">
                <p className="editorial-eyebrow mb-2" style={{ color: "rgba(255,255,255,0.82)" }}>
                  {note.eyebrow}
                </p>
                <h2 className="mb-2 font-serif text-title-2 text-on-ink-strong">{note.title}</h2>
                <p className="font-sans text-body" style={{ color: "rgba(255,255,255,0.86)" }}>
                  {note.summary}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

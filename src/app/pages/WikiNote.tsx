import { useNavigate, useParams } from "react-router";
import { BackLink } from "../components/BackLink";
import { motion, useScroll, useTransform } from "motion/react";
import { ChevronDown, Sparkle } from "lucide-react";
import { getWikiNoteById } from "../data/wiki";

export function WikiNote() {
  const navigate = useNavigate();
  const { id } = useParams();
  const note = id ? getWikiNoteById(id) : null;
  const { scrollY } = useScroll();

  const y = useTransform(scrollY, [0, 800], [0, 250]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  if (!note) {
    return (
      <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center px-6 text-center">
        <p className="mb-2 font-serif text-title-2 text-ink-strong">No encontramos esta nota</p>
        <p className="mb-5 font-sans text-body text-ink-muted">Puede que el enlace haya cambiado.</p>
        <button
          type="button"
          onClick={() => navigate("/wiki")}
          className="editorial-button editorial-button--primary"
        >
          Volver a la wiki
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ink-strong)] overflow-x-hidden relative">
      <BackLink
        to="/wiki"
        label="Volver a la wiki"
        variant="icon"
        className="!fixed top-12 left-6 z-50 !border-white/20 !bg-black/25 text-white backdrop-blur-md hover:!bg-black/40"
      />

      <div className="relative w-full h-[88vh] min-h-[500px] flex flex-col justify-end overflow-hidden isolate">
        {note.image && (
          <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
            <img src={note.image} alt="" decoding="async" className="w-full h-full object-cover origin-bottom" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink-strong)] via-black/40 to-black/10" />
          </motion.div>
        )}

        <div className="relative z-10 px-8 pb-32 w-full max-w-2xl mx-auto flex flex-col items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full"
          >
            <p className="editorial-eyebrow text-on-ink-strong">{note.eyebrow}</p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 font-serif text-display text-on-ink-strong"
          >
            {note.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="font-sans text-body-lg"
            style={{ color: "rgba(255,255,255,0.86)" }}
          >
            {note.summary}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-on-ink-subtle animate-bounce flex flex-col items-center gap-2"
          aria-hidden="true"
        >
          <span className="editorial-eyebrow editorial-eyebrow--on-dark">Scroll</span>
          <ChevronDown size={20} />
        </motion.div>
      </div>

      <div className="relative z-20 mx-auto -mt-10 flex min-h-screen max-w-3xl flex-col rounded-t-panel bg-surface-base px-6 pb-24 pt-10 shadow-[var(--shadow-lifted)]">
        <div className="editorial-sheet-handle mb-12" aria-hidden="true" />

        <p className="mb-12 font-sans text-title-4 font-medium text-ink-strong">{note.body}</p>

        <div className="mb-12 h-px w-full bg-line-soft" />

        {note.sections && (
          <div className="flex flex-col gap-16">
            {note.sections.map((section, idx) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-sans text-title-3 font-light text-ink-decor" aria-hidden="true">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-serif text-title-2 text-ink-strong">
                    {section.title.replace(/^\d+\.\s*/, "")}
                  </h2>
                </div>

                {section.paragraphs?.map((paragraph, paragraphIndex) => (
                  <p
                    key={`${section.title}-paragraph-${paragraphIndex}`}
                    className="mb-5 font-sans text-body-lg text-ink-body"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <div className="editorial-card editorial-card--soft mt-6 p-6">
                    <ul className="flex flex-col gap-5">
                      {section.bullets.map((bullet, bulletIndex) => {
                        const parts = bullet.split(":");
                        const hasColon = parts.length > 1 && parts[0].length < 40;

                        return (
                          <li
                            key={`${section.title}-bullet-${bulletIndex}`}
                            className="flex items-start gap-4"
                          >
                            <div className="mt-1 shrink-0 text-ink-decor" aria-hidden="true">
                              <Sparkle size={18} strokeWidth={1.5} />
                            </div>
                            <span className="font-sans text-body-lg text-ink-body">
                              {hasColon ? (
                                <>
                                  <strong className="font-medium text-ink-strong">
                                    {parts[0]}:
                                  </strong>
                                  {parts.slice(1).join(":")}
                                </>
                              ) : (
                                bullet
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

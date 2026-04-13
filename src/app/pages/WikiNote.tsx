import { useNavigate, useParams } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowLeft, ChevronDown, Sparkle } from "lucide-react";
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <p
          style={{
            fontFamily: "var(--font-serif-display)",
            fontSize: "28px",
            color: "var(--ink-strong)",
            marginBottom: "8px",
          }}
        >
          No encontramos esta nota
        </p>
        <button
          onClick={() => navigate("/wiki")}
          className="px-5 py-3 rounded-xl bg-[var(--ink-strong)] text-white"
          style={{ fontFamily: "var(--font-sans-ui)", fontSize: "14px" }}
        >
          Volver a la wiki
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ink-strong)] overflow-x-hidden relative">
      <button
        onClick={() => navigate("/wiki")}
        className="fixed top-12 left-6 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-black/40 hover:scale-105 active:scale-95"
      >
        <ArrowLeft size={18} strokeWidth={2} />
      </button>

      <div className="relative w-full h-[88vh] min-h-[500px] flex flex-col justify-end overflow-hidden isolate">
        {note.image && (
          <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
            <img src={note.image} alt="" className="w-full h-full object-cover origin-bottom" />
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
            <p
              className="text-white uppercase tracking-[0.2em] text-[10px] font-semibold"
              style={{ fontFamily: "var(--font-sans-ui)" }}
            >
              {note.eyebrow}
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white text-[44px] leading-[1.05] mb-6"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            {note.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-[#E0E0E0] text-[16px] leading-[1.65]"
            style={{ fontFamily: "var(--font-sans-ui)" }}
          >
            {note.summary}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce flex flex-col items-center gap-2"
        >
          <span
            className="text-[10px] uppercase tracking-widest font-medium"
            style={{ fontFamily: "var(--font-sans-ui)" }}
          >
            Scroll
          </span>
          <ChevronDown size={20} />
        </motion.div>
      </div>

      <div className="relative z-20 bg-white min-h-screen rounded-t-[36px] -mt-10 pt-10 pb-24 px-8 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] flex flex-col max-w-3xl mx-auto border-t border-white/50">
        <div className="w-12 h-1.5 bg-[var(--surface-muted)] rounded-full mx-auto mb-14" />

        <p
          className="text-[var(--ink-strong)] text-[19px] leading-[1.7] mb-14 font-medium"
          style={{ fontFamily: "var(--font-sans-ui)" }}
        >
          {note.body}
        </p>

        <div className="h-[1px] w-full bg-[var(--surface-muted)] mb-14" />

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
                  <span
                    className="text-[#DDD] text-[20px] font-light"
                    style={{ fontFamily: "var(--font-sans-ui)" }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h2
                    className="text-[var(--ink-strong)] text-[28px]"
                    style={{ fontFamily: "var(--font-serif-display)" }}
                  >
                    {section.title.replace(/^\d+\.\s*/, "")}
                  </h2>
                </div>

                {section.paragraphs?.map((paragraph, paragraphIndex) => (
                  <p
                    key={`${section.title}-paragraph-${paragraphIndex}`}
                    className="text-[var(--ink-muted)] text-[16px] leading-[1.8] mb-5"
                    style={{ fontFamily: "var(--font-sans-ui)" }}
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <div
                    className="mt-6 bg-[var(--surface-softest)] p-7 border border-[var(--surface-muted)] shadow-sm"
                    style={{ borderRadius: "var(--radius-2xl, 24px)" }}
                  >
                    <ul className="flex flex-col gap-5">
                      {section.bullets.map((bullet, bulletIndex) => {
                        const parts = bullet.split(":");
                        const hasColon = parts.length > 1 && parts[0].length < 40;

                        return (
                          <li
                            key={`${section.title}-bullet-${bulletIndex}`}
                            className="flex items-start gap-4"
                          >
                            <div className="shrink-0 mt-[4px] text-[#A0A0A0]">
                              <Sparkle size={18} strokeWidth={1.5} />
                            </div>
                            <span
                              className="text-[var(--ink-body)] text-[15px] leading-[1.7]"
                              style={{ fontFamily: "var(--font-sans-ui)" }}
                            >
                              {hasColon ? (
                                <>
                                  <strong className="text-[var(--ink-strong)] font-semibold">
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

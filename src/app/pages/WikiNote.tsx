import { useNavigate, useParams } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { getWikiNoteById } from "../data/wiki";
import { ArrowLeft, ChevronDown, Sparkle } from "lucide-react";

export function WikiNote() {
  const navigate = useNavigate();
  const { id } = useParams();
  const note = id ? getWikiNoteById(id) : null;
  const { scrollY } = useScroll();

  // Parallax effect for the hero image
  const y = useTransform(scrollY, [0, 800], [0, 250]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  if (!note) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <p
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "28px",
            color: "#111",
            marginBottom: "8px",
          }}
        >
          No encontramos esta nota
        </p>
        <button
          onClick={() => navigate("/wiki")}
          className="px-5 py-3 rounded-xl bg-[#0A0A0A] text-white"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
        >
          Volver a la wiki
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] overflow-x-hidden relative">
      {/* Absolute Back Button */}
      <button
        onClick={() => navigate("/wiki")}
        className="fixed top-12 left-6 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-black/40 hover:scale-105 active:scale-95"
      >
        <ArrowLeft size={18} strokeWidth={2} />
      </button>

      {/* Hero Section */}
      <div className="relative w-full h-[88vh] min-h-[500px] flex flex-col justify-end overflow-hidden isolate">
        {note.image && (
          <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
            <img src={note.image} alt="" className="w-full h-full object-cover origin-bottom" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/40 to-black/10" />
          </motion.div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 px-8 pb-32 w-full max-w-2xl mx-auto flex flex-col items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full"
          >
            <p
              className="text-white uppercase tracking-[0.2em] text-[10px] font-semibold"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {note.eyebrow}
            </p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white text-[44px] leading-[1.05] mb-6"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            {note.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-[#E0E0E0] text-[16px] leading-[1.65]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {note.summary}
          </motion.p>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest font-medium" style={{ fontFamily: "Inter, sans-serif" }}>Scroll</span>
          <ChevronDown size={20} />
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="relative z-20 bg-white min-h-screen rounded-t-[36px] -mt-10 pt-10 pb-24 px-8 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] flex flex-col max-w-3xl mx-auto border-t border-white/50">
        
        {/* Decorative grabber line */}
        <div className="w-12 h-1.5 bg-[#E5E5E5] rounded-full mx-auto mb-14" />

        {/* Lead paragraph */}
        <p
          className="text-[#111] text-[19px] leading-[1.7] mb-14 font-medium"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {note.body}
        </p>

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#F0F0F0] mb-14" />

        {note.sections && (
          <div className="flex flex-col gap-16">
            {note.sections.map((section, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-4 mb-6">
                  {/* Subtle numerical or visual marker */}
                  <span className="text-[#DDD] text-[20px] font-light" style={{ fontFamily: "Inter, sans-serif" }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h2
                    className="text-[#0A0A0A] text-[28px]"
                    style={{ fontFamily: "Cormorant Garamond, serif" }}
                  >
                    {section.title.replace(/^\d+\.\s*/, '')} {/* Quita el número del titulo si ya lo tenía */}
                  </h2>
                </div>
                
                {section.paragraphs && section.paragraphs.map((p, pIdx) => (
                  <p
                    key={`p-${pIdx}`}
                    className="text-[#555] text-[16px] leading-[1.8] mb-5"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {p}
                  </p>
                ))}

                {section.bullets && (
                  <div className="mt-6 bg-[#FAFAFA] rounded-[24px] p-7 border border-[#F0F0F0] shadow-sm">
                    <ul className="flex flex-col gap-5">
                      {section.bullets.map((b, bIdx) => {
                        // Extract bolder keywords if there's a colon
                        const parts = b.split(':');
                        const hasColon = parts.length > 1 && parts[0].length < 40;

                        return (
                          <li
                            key={`b-${bIdx}`}
                            className="flex items-start gap-4"
                          >
                            <div className="shrink-0 mt-[4px] text-[#A0A0A0]">
                              <Sparkle size={18} strokeWidth={1.5} />
                            </div>
                            <span
                              className="text-[#444] text-[15px] leading-[1.7]"
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              {hasColon ? (
                                <>
                                  <strong className="text-[#111] font-semibold">{parts[0]}:</strong>
                                  {parts.slice(1).join(':')}
                                </>
                              ) : (
                                b
                              )}
                            </span>
                          </li>
                        )
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

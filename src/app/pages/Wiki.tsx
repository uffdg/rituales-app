import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { WIKI_NOTES } from "../data/wiki";

export function Wiki() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-y-auto">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 pt-14 px-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#888] hover:text-[#0A0A0A] transition-colors"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Inicio
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 px-6 pb-12"
      >
        <div className="mb-8">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#BBB",
              marginBottom: "8px",
            }}
          >
            Wiki ritual
          </p>
          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "32px",
              fontWeight: 400,
              color: "#0A0A0A",
              lineHeight: 1.15,
              marginBottom: "10px",
            }}
          >
            Biblioteca de notas y prácticas
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#888",
              lineHeight: 1.6,
            }}
          >
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
              className="relative w-full text-left rounded-[6px] overflow-hidden transition-all hover:scale-[0.99] active:scale-[0.97] min-h-[200px] flex flex-col justify-end group isolate border border-[rgba(0,0,0,0.04)]"
            >
              {/* Background Image & Overlay */}
              <div className="absolute inset-0 z-0 bg-[#F5F5F5]">
                {note.image && (
                  <img
                    src={note.image}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                {/* Subtle gradient for text legibility ONLY at the very bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.7)] via-[rgba(0,0,0,0.1)] to-transparent" />
              </div>

              {/* Text Content */}
              <div className="relative z-10 px-6 py-6 w-full">
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "8px",
                  }}
                >
                  {note.eyebrow}
                </p>
                <h2
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: "26px",
                    fontWeight: 400,
                    color: "#FFFFFF",
                    lineHeight: 1.15,
                    marginBottom: "8px",
                  }}
                >
                  {note.title}
                </h2>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: 1.6,
                  }}
                >
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

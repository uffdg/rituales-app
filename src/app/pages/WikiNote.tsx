import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { getWikiNoteById } from "../data/wiki";

export function WikiNote() {
  const navigate = useNavigate();
  const { id } = useParams();
  const note = id ? getWikiNoteById(id) : null;

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
          onClick={() => navigate("/wiki")}
          className="flex items-center gap-2 text-[#888] hover:text-[#0A0A0A] transition-colors"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Wiki
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 px-6 pb-12"
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#BBB",
            marginBottom: "10px",
          }}
        >
          {note.eyebrow}
        </p>

        <h1
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "36px",
            fontWeight: 400,
            color: "#0A0A0A",
            lineHeight: 1.08,
            marginBottom: "14px",
          }}
        >
          {note.title}
        </h1>

        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "#777",
            lineHeight: 1.7,
            marginBottom: "24px",
          }}
        >
          {note.summary}
        </p>

        <div className="rounded-[28px] border border-[rgba(0,0,0,0.07)] bg-white px-5 py-5">
          <p
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "22px",
              fontWeight: 400,
              color: "#0A0A0A",
              lineHeight: 1.3,
              marginBottom: "10px",
            }}
          >
            Texto en preparación
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#777",
              lineHeight: 1.75,
            }}
          >
            {note.body}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

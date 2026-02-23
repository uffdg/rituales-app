import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { ProgressBar } from "../components/ProgressBar";
import { AI_RITUALS } from "../data/rituals";

const RITUAL_VERSIONS = [
  {
    title: "Ritual de presencia plena",
    opening: "Cierra los ojos. Toma tres respiraciones profundas, soltando con cada exhalación lo que no necesitas ahora. Cuando sientas tu cuerpo un poco más suave, estás listo para comenzar.",
    symbolicAction: "Llena un vaso con agua limpia. Sosténlo entre tus manos. Observa el agua — sin agitación, transparente, receptiva. Bebe lentamente en tres sorbos, como si bebieras claridad.",
    closing: "Cierra los ojos una vez más. Di en silencio: \"Gracias por lo que ya está tomando forma\". Quédate así 30 segundos. Eso fue suficiente.",
  },
  {
    title: "Ritual de soltura y apertura",
    opening: "Párte con los pies bien apoyados en el suelo. Respira hondo. Imagina que con cada exhalación, suenas más liviano/a.",
    symbolicAction: "Escribe en papel lo que quieres dejar ir o lo que quieres recibir. Una sola frase, sin editar. Luego dóblalo y guárdalo en un lugar que veas.",
    closing: "Lee lo que escribiste en voz baja. Di: \"Confío en el proceso\". Dobla el papel. Ya terminó. Ya empezó.",
  },
  {
    title: "Ritual de conexión simple",
    opening: "Siéntate cómodo/a. Coloca una mano en tu corazón. Siente tu latido durante unos segundos. Estás aquí.",
    symbolicAction: "Toma algo de la naturaleza — una hoja, una piedra, agua, sal — y sostenlo. Piensa en tu intención como si ya estuviera cumplida. Visualízala concreta, específica.",
    closing: "Deja el objeto en tu mesa o escritorio. Cada vez que lo veas hoy, recuerda tu intención. Di: \"Ya está en movimiento\".",
  },
];

export function StepRitual() {
  const navigate = useNavigate();
  const { ritual, updateRitual } = useRitual();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRitual, setCurrentRitual] = useState(ritual.aiRitual?.title ? ritual.aiRitual : null);
  const [showVersions, setShowVersions] = useState(false);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editedTexts, setEditedTexts] = useState({
    title: "",
    opening: "",
    symbolicAction: "",
    closing: "",
  });

  const generateRitual = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const base = AI_RITUALS[ritual.ritualType] || AI_RITUALS["default"];
      const result = {
        title: base.title,
        opening: base.opening,
        symbolicAction: base.symbolicAction,
        closing: base.closing,
      };
      setCurrentRitual(result);
      setEditedTexts(result);
      setIsGenerating(false);
    }, 1800);
  };

  useEffect(() => {
    if (!currentRitual || !currentRitual.title) {
      generateRitual();
    } else {
      setEditedTexts(currentRitual);
    }
  }, []);

  const handleSimplify = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const simple = {
        title: "Ritual breve de intención",
        opening: "Cierra los ojos. Respira profundo tres veces.",
        symbolicAction: "Toma un vaso de agua. Bébelo lentamente pensando en lo que quieres.",
        closing: "Di en voz baja: \"Confío en mi proceso\". Abre los ojos.",
      };
      setCurrentRitual(simple);
      setEditedTexts(simple);
      setIsGenerating(false);
    }, 1400);
  };

  const handleSelectVersion = (v: (typeof RITUAL_VERSIONS)[0]) => {
    setCurrentRitual(v);
    setEditedTexts(v);
    setShowVersions(false);
  };

  const handleNext = () => {
    const finalRitual = editedTexts.title ? editedTexts : currentRitual;
    updateRitual({ aiRitual: finalRitual as any });
    navigate("/crear/5");
  };

  const blocks = [
    { key: "opening", label: "Apertura", icon: "◯" },
    { key: "symbolicAction", label: "Acción simbólica", icon: "◎" },
    { key: "closing", label: "Cierre", icon: "·" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

      <ProgressBar step={4} onBack={() => navigate("/crear/3")} />

      <div className="flex-1 px-6 pb-10 overflow-y-auto relative z-10">
        {/* Step label */}
        <p
          className="mb-3 text-[#AAA]"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Paso 4 — Tu ritual
        </p>

        {/* Loading state */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div
                className="relative mb-6"
                style={{ width: 64, height: 64 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full border border-[#0A0A0A]"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 rounded-full border border-[rgba(0,0,0,0.15)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9 1L11 7L17 9L11 11L9 17L7 11L1 9L7 7L9 1Z"
                      stroke="#0A0A0A"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <p
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "20px",
                  fontWeight: 300,
                  color: "#0A0A0A",
                  marginBottom: "4px",
                }}
              >
                Creando tu ritual...
              </p>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: "#BBB",
                  fontWeight: 300,
                }}
              >
                Un momento
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ritual content */}
        <AnimatePresence>
          {!isGenerating && currentRitual && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Title */}
              <h2
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "26px",
                  fontWeight: 400,
                  color: "#0A0A0A",
                  lineHeight: 1.3,
                  marginBottom: "20px",
                }}
              >
                {currentRitual.title}
              </h2>

              {/* Ritual blocks */}
              <div className="flex flex-col gap-3 mb-5">
                {blocks.map((block) => {
                  const text =
                    (editedTexts as Record<string, string>)[block.key] ||
                    (currentRitual as Record<string, string>)[block.key] ||
                    "";
                  const isEditing = editingBlock === block.key;
                  return (
                    <motion.div
                      key={block.key}
                      className="rounded-2xl border border-[rgba(0,0,0,0.07)] overflow-hidden"
                      layout
                    >
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            style={{
                              fontFamily: "Cormorant Garamond, serif",
                              fontSize: "14px",
                              color: "#CCC",
                            }}
                          >
                            {block.icon}
                          </span>
                          <p
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "10px",
                              fontWeight: 500,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              color: "#AAA",
                            }}
                          >
                            {block.label}
                          </p>
                        </div>
                        {isEditing ? (
                          <textarea
                            autoFocus
                            value={text}
                            onChange={(e) =>
                              setEditedTexts((prev) => ({
                                ...prev,
                                [block.key]: e.target.value,
                              }) as typeof prev)
                            }
                            className="w-full border-none bg-transparent focus:outline-none resize-none"
                            rows={4}
                            style={{
                              fontFamily: "Cormorant Garamond, serif",
                              fontSize: "16px",
                              fontWeight: 300,
                              lineHeight: 1.6,
                              color: "#0A0A0A",
                            }}
                          />
                        ) : (
                          <p
                            style={{
                              fontFamily: "Cormorant Garamond, serif",
                              fontSize: "16px",
                              fontWeight: 300,
                              lineHeight: 1.6,
                              color: "#0A0A0A",
                            }}
                          >
                            {text}
                          </p>
                        )}
                      </div>
                      <div className="px-4 pb-3 flex gap-2">
                        <button
                          onClick={() =>
                            setEditingBlock(isEditing ? null : block.key)
                          }
                          className="text-[11px] text-[#AAA] hover:text-[#555] transition-colors"
                          style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.04em" }}
                        >
                          {isEditing ? "Guardar" : "Editar"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* AI action buttons */}
              <div className="flex gap-2 mb-8 flex-wrap">
                <button
                  onClick={() => generateRitual()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[rgba(0,0,0,0.12)] text-[#555] hover:border-[rgba(0,0,0,0.3)] transition-all"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1L6.8 4.2L10 5.5L6.8 6.8L5.5 10L4.2 6.8L1 5.5L4.2 4.2L5.5 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                  </svg>
                  Regenerar
                </button>
                <button
                  onClick={handleSimplify}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[rgba(0,0,0,0.12)] text-[#555] hover:border-[rgba(0,0,0,0.3)] transition-all"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                >
                  Hacerlo más simple
                </button>
                <button
                  onClick={() => setShowVersions(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[rgba(0,0,0,0.12)] text-[#555] hover:border-[rgba(0,0,0,0.3)] transition-all"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                >
                  Dame 3 versiones
                </button>
              </div>

              {/* CTA */}
              <button
                onClick={handleNext}
                className="w-full py-4 px-6 bg-[#0A0A0A] text-white rounded-2xl transition-all active:scale-[0.98] hover:bg-[#1A1A1A]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  fontWeight: 400,
                  letterSpacing: "0.03em",
                }}
              >
                Siguiente
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom sheet: 3 versions */}
      <AnimatePresence>
        {showVersions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowVersions(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white rounded-t-3xl z-50 p-6 pb-10"
              style={{ maxHeight: "80vh", overflowY: "auto" }}
            >
              <div className="w-10 h-1 bg-[#E0E0E0] rounded-full mx-auto mb-6" />
              <p
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "22px",
                  fontWeight: 400,
                  marginBottom: "16px",
                  color: "#0A0A0A",
                }}
              >
                Elige una versión
              </p>
              <div className="flex flex-col gap-3">
                {RITUAL_VERSIONS.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectVersion(v)}
                    className="text-left p-4 border border-[rgba(0,0,0,0.08)] rounded-2xl hover:border-[rgba(0,0,0,0.2)] transition-all"
                  >
                    <p
                      style={{
                        fontFamily: "Cormorant Garamond, serif",
                        fontSize: "17px",
                        fontWeight: 500,
                        color: "#0A0A0A",
                        marginBottom: "4px",
                      }}
                    >
                      {v.title}
                    </p>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        fontWeight: 300,
                        color: "#888",
                        lineHeight: 1.5,
                        WebkitLineClamp: 2,
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {v.opening}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
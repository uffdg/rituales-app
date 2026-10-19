import { useId, type ReactNode } from "react";

// Ilustraciones lineales de los 22 arcanos mayores (Rider-Waite), en el estilo
// de las cartas del Oráculo: trazo dorado fino sobre negro, marco en arco y
// motivos celestes. Cada dibujo toma el símbolo central de la carta original.
// Los ids son los del mazo (rituales-backend/src/lib/oracle-deck.js).
//
// Todo se dibuja en un viewBox de 200 × 300. Los trazos dentro de
// `.arcana-lines` se dibujan solos al revelar (con `animate`); los de
// `.arcana-stars` titilan siempre. Ver src/styles/oracle.css.

export const ARCANA_GOLD = "#c9a66b";
export const ARCANA_INK = "#141312";

// ── Piezas comunes ──

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}

function fmt(n: number) {
  return Math.round(n * 10) / 10;
}

function Rays({
  cx,
  cy,
  r1,
  r2,
  n,
  from = 0,
  to = 360,
  alt,
}: {
  cx: number;
  cy: number;
  r1: number;
  r2: number;
  n: number;
  from?: number;
  to?: number;
  alt?: number;
}) {
  const full = to - from >= 360;
  const step = (to - from) / (full ? n : n - 1);
  const d = Array.from({ length: n }, (_, i) => {
    const deg = from + i * step;
    const outer = alt && i % 2 === 1 ? alt : r2;
    const [x1, y1] = polar(cx, cy, r1, deg);
    const [x2, y2] = polar(cx, cy, outer, deg);
    return `M${fmt(x1)} ${fmt(y1)} L${fmt(x2)} ${fmt(y2)}`;
  }).join(" ");
  return <path d={d} />;
}

function starPath(cx: number, cy: number, outer: number, inner: number, points: number, rotate = -90) {
  const step = 180 / points;
  return (
    Array.from({ length: points * 2 }, (_, i) => {
      const [x, y] = polar(cx, cy, i % 2 === 0 ? outer : inner, rotate + i * step);
      return `${i === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`;
    }).join(" ") + " Z"
  );
}

// Pentagrama de trazo continuo (como en el pentáculo).
function pentagramPath(cx: number, cy: number, r: number, rotate = -90) {
  const order = [0, 2, 4, 1, 3];
  return (
    order
      .map((k, i) => {
        const [x, y] = polar(cx, cy, r, rotate + k * 72);
        return `${i === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`;
      })
      .join(" ") + " Z"
  );
}

function Sparkle({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  return (
    <path
      d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`}
    />
  );
}

function Dot({ x, y, r = 1.2 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill="currentColor" stroke="none" />;
}

// Medialuna: `side` es hacia dónde mira la panza.
function Crescent({ cx, cy, r, side = "left" }: { cx: number; cy: number; r: number; side?: "left" | "right" }) {
  const outer = side === "left" ? 0 : 1;
  const inner = side === "left" ? 1 : 0;
  return (
    <path
      d={`M${cx} ${cy - r} A${r} ${r} 0 1 ${outer} ${cx} ${cy + r} A${fmt(r * 0.7)} ${r} 0 1 ${inner} ${cx} ${cy - r} Z`}
    />
  );
}

function Flame({ x, y, s = 6 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x} ${y - s} Q${x + s * 0.7} ${y} ${x} ${y + s * 0.6} Q${x - s * 0.7} ${y} ${x} ${y - s} Z`} />;
}

function Lemniscate({ cx, cy, w = 16, h = 9 }: { cx: number; cy: number; w?: number; h?: number }) {
  return (
    <path
      d={`M${cx - w} ${cy} C${cx - w} ${cy - h} ${cx - 2} ${cy - h} ${cx} ${cy} C${cx + 2} ${cy + h} ${cx + w} ${cy + h} ${cx + w} ${cy} C${cx + w} ${cy - h} ${cx + 2} ${cy - h} ${cx} ${cy} C${cx - 2} ${cy + h} ${cx - w} ${cy + h} ${cx - w} ${cy} Z`}
    />
  );
}

function Waves({ y, from = 24, to = 176, amp = 5 }: { y: number; from?: number; to?: number; amp?: number }) {
  const seg = 15;
  let d = `M${from} ${y}`;
  for (let x = from; x < to; x += seg * 2) {
    d += ` Q${x + seg / 2} ${y - amp} ${x + seg} ${y} Q${x + seg * 1.5} ${y + amp} ${x + seg * 2} ${y}`;
  }
  return <path d={d} />;
}

// ── Los 22 arcanos: [trazos que se dibujan, estrellas que titilan] ──

type Art = { lines: ReactNode; stars: ReactNode };

const ARCANA: Record<string, Art> = {
  "el-loco": {
    lines: (
      <>
        <circle cx="100" cy="62" r="13" />
        <Rays cx={100} cy={62} r1={18} r2={27} n={16} alt={23} />
        <path d="M24 196 L58 160 L80 182 L108 148 L150 196" />
        <path d="M14 236 H118 Q130 238 134 252 L138 286" />
        <path d="M60 208 Q66 210 64 216 Q60 222 56 216 Q54 210 60 208 Z M60 221 V235" />
        <path d="M90 236 L132 168" />
        <circle cx="135" cy="163" r="7" />
        <path d="M142 226 Q160 196 178 222" strokeDasharray="2 4" />
      </>
    ),
    stars: (
      <>
        <Sparkle x={152} y={104} r={5} />
        <Sparkle x={50} y={110} r={3.5} />
        <Dot x={40} y={140} />
        <Dot x={166} y={134} />
        <Dot x={120} y={116} />
      </>
    ),
  },

  "el-mago": {
    lines: (
      <>
        <Lemniscate cx={100} cy={56} />
        <path d="M100 80 V152" />
        <circle cx="100" cy="78" r="3" />
        <circle cx="100" cy="154" r="3" />
        <Rays cx={100} cy={78} r1={7} r2={13} n={8} from={200} to={340} />
        <path d="M30 196 H170 M44 196 V230 M156 196 V230" />
        <path d="M42 172 Q42 186 52 186 Q62 186 62 172 Z M52 186 V194 M46 194 H58" />
        <path d="M84 158 V194 M78 168 H90" />
        <circle cx="116" cy="182" r="10" />
        <path d={pentagramPath(116, 182, 8)} />
        <path d="M146 162 V196 M146 170 Q152 168 152 174 M146 182 Q140 180 140 186" />
        <path d="M30 258 Q45 246 60 258 T90 258 T120 258 T150 258 T170 258" />
      </>
    ),
    stars: (
      <>
        <Sparkle x={52} y={110} r={4} />
        <Sparkle x={150} y={114} r={4} />
        <Dot x={70} y={90} />
        <Dot x={132} y={92} />
      </>
    ),
  },

  "la-sacerdotisa": {
    lines: (
      <>
        <circle cx="100" cy="60" r="8" />
        <Crescent cx={84} cy={60} r={8} side="left" />
        <Crescent cx={116} cy={60} r={8} side="right" />
        <path d="M34 96 H54 M36 96 V246 M52 96 V246 M30 246 H58" />
        <path d="M146 96 H166 M148 96 V246 M164 96 V246 M142 246 H170" />
        <path d="M56 110 Q100 128 144 110" />
        <circle cx="72" cy="138" r="4" />
        <circle cx="100" cy="146" r="4" />
        <circle cx="128" cy="138" r="4" />
        <rect x="88" y="166" width="24" height="36" rx="4" />
        <path d="M93 178 H107 M93 186 H107 M93 194 H103" />
        <path d="M80 236 Q100 260 120 236 Q100 250 80 236 Z" />
        <Waves y={270} />
      </>
    ),
    stars: (
      <>
        <text x="44" y="182" textAnchor="middle" fontSize="11" fill="currentColor" stroke="none" fontFamily="serif">B</text>
        <text x="156" y="182" textAnchor="middle" fontSize="11" fill="currentColor" stroke="none" fontFamily="serif">J</text>
        <Sparkle x={100} y={86} r={4} />
        <Dot x={70} y={84} />
        <Dot x={130} y={84} />
      </>
    ),
  },

  "la-emperatriz": {
    lines: (
      <>
        <circle cx="100" cy="132" r="20" />
        <path d="M100 152 V190 M86 174 H114" />
        <path d="M60 262 Q60 232 66 204 M66 212 L60 206 M66 212 L72 206 M65 224 L59 218 M65 224 L71 218 M64 236 L58 230 M64 236 L70 230" />
        <path d="M100 262 V204 M100 212 L94 206 M100 212 L106 206 M100 224 L94 218 M100 224 L106 218 M100 236 L94 230 M100 236 L106 230" />
        <path d="M140 262 Q140 232 134 204 M134 212 L128 206 M134 212 L140 206 M135 224 L129 218 M135 224 L141 218 M136 236 L130 230 M136 236 L142 230" />
        <path d="M24 272 Q60 264 100 272 T176 272" />
      </>
    ),
    stars: (
      <>
        {Array.from({ length: 12 }, (_, i) => {
          const [x, y] = polar(100, 96, 40, 200 + (i * 140) / 11);
          return <Sparkle key={i} x={fmt(x)} y={fmt(y)} r={2.6} />;
        })}
        <Dot x={48} y={150} />
        <Dot x={152} y={150} />
      </>
    ),
  },

  "el-emperador": {
    lines: (
      <>
        <path d="M34 94 L62 60 L80 80 L100 50 L124 84 L140 66 L166 94" />
        <rect x="54" y="118" width="92" height="118" />
        <path d="M62 118 C50 118 46 104 56 100 C64 97 68 106 62 109" />
        <path d="M138 118 C150 118 154 104 144 100 C136 97 132 106 138 109" />
        <ellipse cx="100" cy="150" rx="9" ry="12" />
        <path d="M100 162 V208 M84 174 H116" />
        <circle cx="100" cy="222" r="5" />
        <path d="M44 246 H156 M36 258 H164" />
      </>
    ),
    stars: (
      <>
        <Sparkle x={48} y={110} r={3.5} />
        <Sparkle x={152} y={110} r={3.5} />
        <Dot x={100} y={36} />
        <Dot x={70} y={44} />
        <Dot x={130} y={44} />
      </>
    ),
  },

  "el-hierofante": {
    lines: (
      <>
        <path d="M82 94 Q100 58 118 94 Z M86 84 H114 M90 74 H110 M100 50 V60 M96 55 H104" />
        <path d="M100 104 V232 M92 112 H108 M88 122 H112 M84 132 H116" />
        <path d="M40 110 V250 M46 110 V250 M154 110 V250 M160 110 V250 M36 110 H50 M150 110 H164" />
        <path d="M72 252 L128 216 M72 216 L128 252" />
        <circle cx="68" cy="255" r="5" />
        <circle cx="68" cy="213" r="5" />
        <path d="M128 216 L134 220 M124 219 L130 223 M128 252 L134 248 M124 249 L130 245" />
      </>
    ),
    stars: (
      <>
        <Sparkle x={62} y={86} r={4} />
        <Sparkle x={138} y={86} r={4} />
        <Dot x={100} y={36} />
        <Dot x={78} y={180} />
        <Dot x={122} y={180} />
      </>
    ),
  },

  "los-enamorados": {
    lines: (
      <>
        <circle cx="100" cy="62" r="12" />
        <Rays cx={100} cy={62} r1={16} r2={25} n={12} />
        <path d="M58 104 Q100 72 142 104 M68 108 Q100 88 132 108" />
        <path d="M76 232 L100 168 L124 232" />
        <path d="M50 250 V188" />
        <Flame x={50} y={176} />
        <Flame x={40} y={188} s={5} />
        <Flame x={60} y={188} s={5} />
        <Flame x={44} y={166} s={4} />
        <Flame x={56} y={166} s={4} />
        <path d="M150 250 V186" />
        <circle cx="150" cy="170" r="16" />
        <path d="M150 238 C140 230 160 222 150 214 C140 206 160 198 150 190" />
        <path d="M24 250 H176" />
      </>
    ),
    stars: (
      <>
        <Dot x={144} y={166} r={1.6} />
        <Dot x={156} y={172} r={1.6} />
        <Dot x={148} y={178} r={1.6} />
        <Sparkle x={42} y={124} r={3.5} />
        <Sparkle x={160} y={128} r={3.5} />
      </>
    ),
  },

  "el-carro": {
    lines: (
      <>
        <path d="M48 98 Q100 66 152 98" />
        <path d="M48 98 Q56 106 64 98 Q72 106 80 98 Q88 106 96 98 Q104 106 112 98 Q120 106 128 98 Q136 106 144 98 Q148 102 152 98" />
        <path d="M52 100 V176 M148 100 V176" />
        <rect x="56" y="150" width="88" height="50" />
        <circle cx="100" cy="166" r="5" />
        <path d="M95 166 Q82 158 70 166 M105 166 Q118 158 130 166" />
        <circle cx="70" cy="214" r="14" />
        <circle cx="130" cy="214" r="14" />
        <path d="M70 200 V228 M56 214 H84 M130 200 V228 M116 214 H144" />
        <path d="M58 254 Q70 236 82 254 Z M118 254 Q130 236 142 254 Z" />
      </>
    ),
    stars: (
      <>
        <Dot x={72} y={88} />
        <Dot x={86} y={83} />
        <Dot x={100} y={81} />
        <Dot x={114} y={83} />
        <Dot x={128} y={88} />
        <Sparkle x={100} y={52} r={5} />
      </>
    ),
  },

  "la-fuerza": {
    lines: (
      <>
        <Lemniscate cx={100} cy={60} />
        <path d="M40 124 Q100 102 160 124" />
        <path d="M58 146 Q100 132 142 146" />
        <circle cx="100" cy="182" r="20" />
        <Rays cx={100} cy={182} r1={24} r2={38} n={20} alt={32} />
        <path d="M96 188 L104 188 L100 193 Z M100 193 V196 M94 198 Q100 201 106 198" />
        <path d="M30 252 H170" />
      </>
    ),
    stars: (
      <>
        <Dot x={93} y={177} r={1.6} />
        <Dot x={107} y={177} r={1.6} />
        <Dot x={60} y={114} r={2} />
        <Dot x={80} y={108} r={2} />
        <Dot x={120} y={108} r={2} />
        <Dot x={140} y={114} r={2} />
        <Sparkle x={150} y={86} r={4} />
      </>
    ),
  },

  "el-ermitano": {
    lines: (
      <>
        <path d="M20 272 L100 214 L180 272" />
        <path d="M66 96 V264" />
        <path d="M124 110 V120 M110 124 L124 114 L138 124 Z M112 124 H136 L132 158 H116 Z" />
        <path d={starPath(124, 141, 7, 4, 6)} />
        <Rays cx={124} cy={141} r1={22} r2={32} n={12} alt={27} />
      </>
    ),
    stars: (
      <>
        <Sparkle x={58} y={74} r={4} />
        <Sparkle x={150} y={210} r={3} />
        <Dot x={40} y={130} />
        <Dot x={88} y={60} />
        <Dot x={160} y={96} />
      </>
    ),
  },

  "la-rueda-de-la-fortuna": {
    lines: (
      <>
        <circle cx="100" cy="152" r="52" />
        <circle cx="100" cy="152" r="34" />
        <circle cx="100" cy="152" r="8" />
        <Rays cx={100} cy={152} r1={8} r2={34} n={8} />
        <path d="M92 94 L100 82 L108 94 M100 82 V74" />
        <path d="M40 120 C30 140 50 160 40 180 C32 196 46 206 44 216" />
        <path d="M36 82 q4 -8 12 -4 q6 -6 12 2 q6 0 4 6 h-28 z" />
        <path d="M136 82 q4 -8 12 -4 q6 -6 12 2 q6 0 4 6 h-28 z" />
        <path d="M30 244 q4 -8 12 -4 q6 -6 12 2 q6 0 4 6 h-28 z" />
        <path d="M142 244 q4 -8 12 -4 q6 -6 12 2 q6 0 4 6 h-28 z" />
      </>
    ),
    stars: (
      <>
        <text x="100" y="114" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none" fontFamily="serif">T</text>
        <text x="143" y="155" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none" fontFamily="serif">A</text>
        <text x="100" y="197" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none" fontFamily="serif">R</text>
        <text x="57" y="155" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none" fontFamily="serif">O</text>
        <Sparkle x={160} y={176} r={3.5} />
        <Dot x={100} y={264} />
      </>
    ),
  },

  "la-justicia": {
    lines: (
      <>
        <path d="M86 74 L90 62 L96 70 L100 58 L104 70 L110 62 L114 74 Z" />
        <path d="M100 84 L104 92 V200 H96 V92 Z M84 200 H116 M100 200 V218" />
        <circle cx="100" cy="222" r="4" />
        <path d="M44 140 H156" />
        <path d="M48 140 L38 176 M48 140 L58 176 M34 176 Q48 188 62 176 Z" />
        <path d="M152 140 L142 176 M152 140 L162 176 M138 176 Q152 188 166 176 Z" />
        <path d="M30 252 H170 M40 252 V236 M160 252 V236" />
      </>
    ),
    stars: (
      <>
        <Sparkle x={56} y={92} r={4} />
        <Sparkle x={144} y={92} r={4} />
        <Dot x={100} y={42} />
        <Dot x={70} y={214} />
        <Dot x={130} y={214} />
      </>
    ),
  },

  "el-colgado": {
    lines: (
      <>
        <path d="M54 76 H146 M60 76 V252 M140 76 V252" />
        <path d="M54 76 q-6 -6 0 -12 M146 76 q6 -6 0 -12 M60 140 q-8 -2 -10 -10 M140 170 q8 -2 10 -10" />
        <path d="M100 76 V100 M100 100 V150 M100 114 L118 126 L104 142" />
        <path d="M84 150 L116 150 L100 194 Z" />
        <circle cx="100" cy="206" r="9" />
        <Rays cx={100} cy={206} r1={13} r2={22} n={14} alt={18} />
        <path d="M30 252 H170" />
      </>
    ),
    stars: (
      <>
        <Sparkle x={100} y={46} r={4} />
        <Dot x={80} y={58} />
        <Dot x={120} y={58} />
        <Dot x={40} y={200} />
        <Dot x={160} y={120} />
      </>
    ),
  },

  "la-muerte": {
    lines: (
      <>
        <path d="M64 66 V222 M64 76 H134 V122 H64" />
        <circle cx="99" cy="99" r="4" />
        {Array.from({ length: 5 }, (_, i) => {
          const [x, y] = polar(99, 99, 8, -90 + i * 72);
          return <circle key={i} cx={fmt(x)} cy={fmt(y)} r="5" />;
        })}
        <path d="M40 250 V200 H62 V250 M40 200 V194 H46 V200 M51 200 V194 H57 V200" />
        <path d="M138 250 V200 H160 V250 M138 200 V194 H144 V200 M149 200 V194 H155 V200" />
        <path d="M74 250 A26 26 0 0 1 126 250" />
        <Rays cx={100} cy={250} r1={32} r2={42} n={7} from={200} to={340} />
        <path d="M24 250 H176" />
        <Waves y={268} from={30} to={170} amp={4} />
      </>
    ),
    stars: (
      <>
        <Sparkle x={150} y={86} r={4} />
        <Dot x={44} y={150} />
        <Dot x={156} y={150} />
      </>
    ),
  },

  "la-templanza": {
    lines: (
      <>
        <rect x="90" y="86" width="20" height="20" />
        <path d="M100 90 L108 102 L92 102 Z" />
        <path d="M88 112 C64 96 44 80 40 56 C52 70 64 74 74 76 C62 84 66 94 82 102" />
        <path d="M112 112 C136 96 156 80 160 56 C148 70 136 74 126 76 C138 84 134 94 118 102" />
        <path d="M52 128 Q52 154 68 154 Q84 154 84 128 Z M68 154 V162 M60 162 H76" />
        <path d="M116 168 Q116 194 132 194 Q148 194 148 168 Z M132 194 V202 M124 202 H140" />
        <path d="M84 132 C104 136 116 150 122 166" strokeDasharray="3 3" />
        <path d="M80 214 L100 196 L120 214" />
        <path d="M100 270 C90 250 116 238 104 222 C98 216 102 214 100 210" />
        <path d="M46 250 V230 M46 230 q-6 -6 0 -10 q6 4 0 10 M58 254 V236 M58 236 q-5 -5 0 -9 q5 4 0 9" />
        <Waves y={262} from={112} to={176} amp={4} />
      </>
    ),
    stars: (
      <>
        <Sparkle x={100} y={186} r={3.5} />
        <Dot x={100} y={60} />
        <Dot x={70} y={176} />
        <Dot x={152} y={140} />
      </>
    ),
  },

  "el-diablo": {
    lines: (
      <>
        <circle cx="100" cy="64" r="17" />
        <path d={pentagramPath(100, 64, 15, 90)} />
        <path d="M100 104 C80 88 56 92 44 110 C56 108 62 116 64 124 C70 116 80 116 84 124 C88 114 96 110 100 104" />
        <path d="M100 104 C120 88 144 92 156 110 C144 108 138 116 136 124 C130 116 120 116 116 124 C112 114 104 110 100 104" />
        <rect x="78" y="168" width="44" height="40" />
        <circle cx="100" cy="180" r="4" />
        <path d="M97 184 Q76 208 62 234 M103 184 Q124 208 138 234" strokeDasharray="4 3" strokeWidth="2" />
        <circle cx="60" cy="240" r="6" />
        <circle cx="140" cy="240" r="6" />
        <path d="M128 148 L140 128" />
        <Flame x={142} y={122} s={6} />
        <path d="M30 254 H170" />
      </>
    ),
    stars: (
      <>
        <Dot x={60} y={150} />
        <Dot x={74} y={140} />
        <Dot x={152} y={170} />
        <Sparkle x={44} y={70} r={3} />
      </>
    ),
  },

  "la-torre": {
    lines: (
      <>
        <path d="M80 262 V120 H120 V262" />
        <path d="M80 120 V112 H88 V120 H96 V112 H104 V120 H112 V112 H120 V120" />
        <rect x="92" y="148" width="6" height="10" />
        <rect x="104" y="188" width="6" height="10" />
        <rect x="92" y="224" width="6" height="10" />
        <path d="M116 98 L119 86 L124 94 L128 82 L132 94 L137 86 L140 98 Z" transform="rotate(24 128 92)" />
        <path d="M38 58 L76 92 L64 96 L104 124" />
        <Flame x={95} y={140} s={5} />
        <Flame x={107} y={180} s={5} />
        <Flame x={95} y={216} s={5} />
        <path d="M30 264 Q100 250 170 264" />
      </>
    ),
    stars: (
      <>
        <Flame x={58} y={150} s={4} />
        <Flame x={146} y={140} s={4} />
        <Flame x={52} y={200} s={4} />
        <Flame x={150} y={212} s={4} />
        <Dot x={150} y={70} />
      </>
    ),
  },

  "la-estrella": {
    lines: (
      <>
        <path d={starPath(100, 88, 26, 8, 8)} />
        <path d="M70 176 Q64 190 72 202 H84 Q90 190 82 176 Z M86 182 Q100 202 96 236" />
        <path d="M122 172 Q116 186 124 198 H136 Q142 186 134 172 Z M138 178 Q152 206 158 236" />
        <path d="M30 240 Q60 232 90 240 T120 240" />
        <path d="M24 254 Q60 246 100 254 T176 254" />
        <path d="M120 238 H176" />
      </>
    ),
    stars: (
      <>
        <path d={starPath(54, 70, 6, 2, 8)} />
        <path d={starPath(146, 70, 6, 2, 8)} />
        <path d={starPath(40, 112, 6, 2, 8)} />
        <path d={starPath(160, 112, 6, 2, 8)} />
        <path d={starPath(62, 140, 6, 2, 8)} />
        <path d={starPath(138, 140, 6, 2, 8)} />
        <path d={starPath(100, 40, 6, 2, 8)} />
      </>
    ),
  },

  "la-luna": {
    lines: (
      <>
        <circle cx="100" cy="78" r="22" />
        <path d="M100 56 A22 22 0 0 0 100 100 A15 22 0 0 1 100 56 Z" />
        <Rays cx={100} cy={78} r1={27} r2={36} n={16} alt={32} />
        <path d="M30 202 V142 H48 V202 M30 142 V136 H36 V142 M42 142 V136 H48 V142 M36 168 H42 V178 H36 Z" />
        <path d="M152 202 V142 H170 V202 M152 142 V136 H158 V142 M164 142 V136 H170 V142 M158 168 H164 V178 H158 Z" />
        <path d="M100 280 C88 260 116 246 100 228 C88 214 110 200 100 180 C94 170 102 160 100 150" />
        <path d="M24 262 Q50 254 76 262 M124 262 Q150 254 176 262" />
        <path d="M92 272 Q100 264 108 272 M92 272 l-4 -4 M108 272 l4 -4" />
      </>
    ),
    stars: (
      <>
        <Flame x={78} y={124} s={4} />
        <Flame x={100} y={132} s={4} />
        <Flame x={122} y={124} s={4} />
        <Dot x={94} y={74} r={1.4} />
      </>
    ),
  },

  "el-sol": {
    lines: (
      <>
        <circle cx="100" cy="104" r="28" />
        <path d="M90 113 Q100 121 110 113" />
        <Rays cx={100} cy={104} r1={34} r2={50} n={24} alt={42} />
        <path d="M24 222 H176 M24 236 H176 M50 222 V236 M90 222 V236 M130 222 V236 M70 236 V250 M110 236 V250 M150 236 V250 M24 250 H176" />
        {[44, 78, 122, 156].map((x) => (
          <g key={x}>
            <circle cx={x} cy="200" r="5" />
            <Rays cx={x} cy={200} r1={7} r2={11} n={10} />
            <path d={`M${x} 211 V222`} />
          </g>
        ))}
      </>
    ),
    stars: (
      <>
        <Dot x={91} y={99} r={1.6} />
        <Dot x={109} y={99} r={1.6} />
        <Sparkle x={42} y={62} r={3} />
        <Sparkle x={158} y={62} r={3} />
      </>
    ),
  },

  "el-juicio": {
    lines: (
      <>
        <path d="M44 88 Q48 70 66 74 Q74 58 92 66 Q104 54 118 66 Q136 60 140 76 Q158 76 156 92 Z" />
        <path d="M88 96 L126 148 M124 146 Q134 148 140 162 Q128 160 122 154" />
        <rect x="104" y="116" width="16" height="16" />
        <path d="M112 116 V132 M104 124 H120" />
        <path d="M60 96 L54 120 M76 96 L74 112 M146 96 L150 118" />
        <path d="M34 238 h28 v14 h-28 z M84 246 h32 v14 h-32 z M138 238 h28 v14 h-28 z" />
        <circle cx="48" cy="226" r="4" />
        <path d="M48 230 L40 212 M48 230 L56 212" />
        <circle cx="100" cy="234" r="4" />
        <path d="M100 238 L92 220 M100 238 L108 220" />
        <circle cx="152" cy="226" r="4" />
        <path d="M152 230 L144 212 M152 230 L160 212" />
        <Waves y={272} from={30} to={170} amp={4} />
      </>
    ),
    stars: (
      <>
        <Sparkle x={100} y={40} r={4} />
        <Dot x={44} y={160} />
        <Dot x={160} y={180} />
        <Dot x={70} y={140} />
      </>
    ),
  },

  "el-mundo": {
    lines: (
      <>
        <ellipse cx="100" cy="152" rx="46" ry="74" />
        <ellipse cx="100" cy="152" rx="39" ry="66" />
        {Array.from({ length: 18 }, (_, i) => {
          const deg = i * 20 + 10;
          const [x1, y1] = [100 + 39 * Math.cos((deg * Math.PI) / 180), 152 + 66 * Math.sin((deg * Math.PI) / 180)];
          const [x2, y2] = [100 + 46 * Math.cos(((deg + 8) * Math.PI) / 180), 152 + 74 * Math.sin(((deg + 8) * Math.PI) / 180)];
          return <path key={i} d={`M${fmt(x1)} ${fmt(y1)} L${fmt(x2)} ${fmt(y2)}`} />;
        })}
        <Lemniscate cx={100} cy={78} w={9} h={5} />
        <Lemniscate cx={100} cy={226} w={9} h={5} />
        <path d="M88 128 Q112 150 92 178" />
        <path d="M80 140 L86 132 M116 168 L122 160" />
      </>
    ),
    stars: (
      <>
        <Sparkle x={100} y={152} r={14} />
        <Sparkle x={40} y={74} r={4} />
        <Sparkle x={160} y={74} r={4} />
        <Sparkle x={40} y={238} r={4} />
        <Sparkle x={160} y={238} r={4} />
      </>
    ),
  },
};

export const ARCANA_IDS = Object.keys(ARCANA);

export function ArcanaArt({
  id,
  animate = false,
  width = 170,
  className = "",
}: {
  id: string;
  animate?: boolean;
  width?: number;
  className?: string;
}) {
  const art = ARCANA[id];
  const clipId = `arcana-clip-${useId().replace(/:/g, "")}`;

  return (
    <svg
      width={width}
      height={(width * 300) / 200}
      viewBox="0 0 200 300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`arcana-art ${animate ? "arcana-animate" : ""} ${className}`}
      style={{ color: ARCANA_GOLD }}
    >
      <rect x="6" y="6" width="188" height="288" rx="94" />
      <rect x="12" y="12" width="176" height="276" rx="88" strokeWidth="0.6" opacity="0.45" />
      <clipPath id={clipId}>
        <rect x="12" y="12" width="176" height="276" rx="88" />
      </clipPath>
      {art ? (
        <g clipPath={`url(#${clipId})`}>
          <g className="arcana-lines">{art.lines}</g>
          <g className="arcana-stars">{art.stars}</g>
        </g>
      ) : null}
    </svg>
  );
}

// Dorso de las cartas, en el mismo estilo: arco, órbitas que giran y estrellas.
export function ArcanaBack({ width = 108 }: { width?: number }) {
  return (
    <svg
      width={width}
      height={(width * 300) / 200}
      viewBox="0 0 200 300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
      className="arcana-art"
      style={{ color: ARCANA_GOLD }}
    >
      <rect x="6" y="6" width="188" height="288" rx="94" fill={ARCANA_INK} />
      <rect x="12" y="12" width="176" height="276" rx="88" strokeWidth="0.6" opacity="0.45" />
      <ellipse className="oracle-spin" cx="100" cy="150" rx="62" ry="40" strokeWidth="1" />
      <ellipse className="oracle-spin-rev" cx="100" cy="150" rx="40" ry="62" strokeWidth="1" />
      <circle className="oracle-spin oracle-spin-slow" cx="100" cy="150" r="70" strokeWidth="0.8" strokeDasharray="2 6" />
      <g className="arcana-stars">
        <Sparkle x={100} y={150} r={10} />
        <Sparkle x={100} y={48} r={5} />
        <Sparkle x={100} y={252} r={5} />
        <Dot x={60} y={80} />
        <Dot x={140} y={80} />
        <Dot x={60} y={220} />
        <Dot x={140} y={220} />
      </g>
    </svg>
  );
}

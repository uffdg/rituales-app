export interface WikiNote {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  body: string;
}

export const WIKI_NOTES: WikiNote[] = [
  {
    id: "preparar-vela",
    title: "Cómo se prepara una vela",
    eyebrow: "Guía esencial",
    summary: "Un espacio para explicar intención, limpieza, encendido y cuidado antes del ritual.",
    body:
      "Este espacio queda listo para desarrollar el paso a paso de preparación de una vela antes del ritual. Después vamos a sumar el texto completo con indicaciones claras, simples y usables.",
  },
  {
    id: "importancia-del-ritual",
    title: "La importancia del ritual",
    eyebrow: "Fundamentos",
    summary: "Acá va a vivir una lectura simple sobre por qué un gesto simbólico ordena y sostiene una intención.",
    body:
      "Esta nota va a explicar por qué un ritual puede ayudar a ordenar una intención, enfocar la atención y crear un momento de presencia con sentido. Después le sumamos el desarrollo completo.",
  },
  {
    id: "como-prepararte",
    title: "Cómo prepararte para un ritual",
    eyebrow: "Antes de empezar",
    summary: "Este contenido va a reunir cuerpo, respiración, espacio y presencia antes de hacer cualquier práctica.",
    body:
      "Acá vamos a reunir todo lo necesario para preparar cuerpo, respiración, espacio y disposición antes de empezar un ritual. Por ahora queda el espacio listo para cargar ese contenido.",
  },
  {
    id: "rituales-en-grupo",
    title: "Rituales en grupo",
    eyebrow: "Prácticas compartidas",
    summary: "Un lugar para bajar ideas sobre cuidado, coordinación y energía cuando el ritual se hace con otras personas.",
    body:
      "Esta nota va a servir para desarrollar cómo sostener un ritual grupal con cuidado, roles claros y una intención compartida. Después la completamos con el texto final.",
  },
  {
    id: "el-aquelarre",
    title: "El aquelarre",
    eyebrow: "Historia y símbolo",
    summary: "Esta nota puede abrir el sentido cultural y simbólico del encuentro ritual en comunidad.",
    body:
      "Este espacio queda preparado para una lectura sobre el sentido histórico, simbólico y comunitario del aquelarre, con un tono claro y accesible para la app.",
  },
  {
    id: "las-lunas-y-su-energia",
    title: "Las lunas y su energía",
    eyebrow: "Ciclos lunares",
    summary: "Una nota para explicar cómo cambia el clima energético según cada fase de la luna.",
    body:
      "Este espacio queda listo para desarrollar el sentido de cada fase lunar y cómo puede acompañar distintas intenciones, ritmos y tipos de ritual.",
  },
];

export function getWikiNoteById(id: string) {
  return WIKI_NOTES.find((note) => note.id === id) || null;
}

/**
 * 6 rituales curatoriales — uno por cada intención principal.
 * Cada uno usa una combinación distinta de elemento + energía.
 * Son la base del contenido de Stories y se dosifican por día.
 */

export interface CuratedRitual {
  id: string;
  ritualType: string;
  element: string;
  energy: string;
  intensity: string;
  duration: number;
  intention: string;
  anchor: string;
  aiRitual: {
    title: string;
    opening: string;
    symbolicAction: string;
    closing: string;
  };
  // Para Stories
  storyImage: string;
  storyEyebrow: string;
  storyTitle: string;
  storyBody: string;
  storyCta: string;
}

export const CURATED_RITUALS: CuratedRitual[] = [
  {
    id: "curated-claridad",
    ritualType: "claridad",
    element: "agua",
    energy: "apertura",
    intensity: "suave",
    duration: 10,
    intention: "Quiero ver con claridad lo que necesito",
    anchor: "Escribir en papel la decisión y confiar en lo primero que aparece",
    aiRitual: {
      title: "Ritual de claridad interior",
      opening:
        "Buscá un lugar tranquilo. Apagá notificaciones. Cerrá los ojos y tomá cuatro respiraciones profundas, soltando tensión con cada exhalación. Cuando estés lista, llevá tu atención a la pregunta o situación que necesita claridad.",
      symbolicAction:
        "Tomá un vaso de agua limpia. Sostenerlo entre tus manos. Visualizá el agua como tu mente — clara, sin agitación. Bebé lentamente, pensando en que cada sorbo te conecta con tu propia sabiduría. Si tenés papel, escribí la pregunta central y rodeala con un círculo.",
      closing:
        "Cerrá los ojos nuevamente. Inhalá profundo y al exhalar, susurrá: \"Ya tengo la respuesta que necesito — solo necesito escucharla\". Abrí los ojos. Escribí lo primero que venga a tu mente sin editar. Confiá en eso.",
    },
    storyImage: "/images/story-water-1.jpg",
    storyEyebrow: "RITUAL DE CLARIDAD",
    storyTitle: "Lo que buscás ya está en vos",
    storyBody: "El agua refleja sin juzgar. Este ritual te ayuda a ver con nitidez lo que ya sabés pero todavía no te animaste a escuchar.",
    storyCta: "Hacer este ritual",
  },
  {
    id: "curated-amor-propio",
    ritualType: "amor-propio",
    element: "agua",
    energy: "conexion",
    intensity: "media",
    duration: 10,
    intention: "Quiero reconectarme conmigo",
    anchor: "Mandar un mensaje a alguien que quiero, sin esperar nada a cambio",
    aiRitual: {
      title: "Ritual de amor y reconocimiento propio",
      opening:
        "Párate frente a un espejo o sentate cómodamente. Colocá una mano sobre tu corazón. Cerrá los ojos. Tomá tres respiraciones profundas y con cada una, sentí el calor de tu propia mano. Notá que tu corazón late — ha estado ahí, con vos, siempre.",
      symbolicAction:
        "Ponete algo de crema o aceite en las manos. Mientras te las aplicás, nombrá en voz alta o mentalmente tres cosas que tu cuerpo hace por vos cada día. No tienen que ser grandes. Pueden ser: \"me lleva donde necesito ir\", \"me permite abrazar\", \"me mantiene viva\".",
      closing:
        "Colocá ambas manos en tu pecho. Decí: \"Me elijo hoy\". No tiene que ser perfecto — solo sincero. Respirá hondo una vez más y soltá. Ya terminaste. Eso fue suficiente.",
    },
    storyImage: "/images/story-water-2.jpg",
    storyEyebrow: "RITUAL DE AMOR PROPIO",
    storyTitle: "Tu cuerpo te lleva a donde necesitás",
    storyBody: "Reconectar con vos no es un lujo — es el punto de partida de todo lo demás. Este ritual dura 10 minutos y cuesta cero.",
    storyCta: "Hacer este ritual",
  },
  {
    id: "curated-calma",
    ritualType: "calma",
    element: "tierra",
    energy: "calma",
    intensity: "suave",
    duration: 5,
    intention: "Quiero soltar la tensión y encontrar calma",
    anchor: "Salir a caminar 15 minutos sin el teléfono",
    aiRitual: {
      title: "Ritual de calma y soltura",
      opening:
        "Buscá un lugar donde puedas sentarte sin interrupciones. Cerrá los ojos. Comenzá a respirar con una cuenta de 4-7-8: inhalá 4 segundos, retenés 7, exhalás 8. Repetí este ciclo cuatro veces.",
      symbolicAction:
        "Si tenés agua, colocá tus manos bajo el chorro unos segundos — fría o tibia. Mientras el agua corre sobre tus manos, imaginá que se lleva la tensión, la preocupación, el ruido mental. Si no hay agua cerca, frotá suavemente tus palmas entre sí hasta sentirlas cálidas.",
      closing:
        "Tomá una respiración profunda. Al exhalar, decí en voz baja: \"Puedo con esto — y también puedo descansar\". Quedate en silencio 30 segundos más. No hagás nada. Solo sé.",
    },
    storyImage: "/images/story-grass-3.jpg",
    storyEyebrow: "RITUAL DE CALMA",
    storyTitle: "La tierra te sostiene cuando todo se mueve",
    storyBody: "No hay nada que resolver ahora mismo. Este ritual de 5 minutos es un permiso para dejar de correr.",
    storyCta: "Hacer este ritual",
  },
  {
    id: "curated-enfoque",
    ritualType: "enfoque",
    element: "fuego",
    energy: "poder",
    intensity: "media",
    duration: 5,
    intention: "Quiero concentrar mi energía en lo que importa",
    anchor: "Apagar las notificaciones y trabajar 1 hora sin interrupciones",
    aiRitual: {
      title: "Ritual de activación y enfoque",
      opening:
        "Párate. Estirá los brazos sobre tu cabeza, inhalá profundo y al exhalar, bajá los brazos con fuerza. Repetí dos veces. Esto activa tu cuerpo y tu mente.",
      symbolicAction:
        "Frotá tus palmas durante 10 segundos hasta sentir calor. Colocalas suavemente sobre tus ojos cerrados. Visualizá exactamente cómo querés que resulte el momento que viene — concreto, específico, ya logrado.",
      closing:
        "Soltá las manos. Abrí los ojos. Respirá. Decí: \"Estoy preparada. Voy\".",
    },
    storyImage: "/images/story-fire-1.jpg",
    storyEyebrow: "RITUAL DE ENFOQUE",
    storyTitle: "El fuego que se dirige es el más poderoso",
    storyBody: "Antes de empezar algo importante, este ritual de 5 minutos activa tu cuerpo, aclara tu mente y te pone en modo hacer.",
    storyCta: "Hacer este ritual",
  },
  {
    id: "curated-cerrar-ciclo",
    ritualType: "cerrar-ciclo",
    element: "fuego",
    energy: "calma",
    intensity: "profunda",
    duration: 10,
    intention: "Quiero soltar lo que ya no me sirve",
    anchor: "Borrar o archivar algo que me recordaba lo que quiero soltar",
    aiRitual: {
      title: "Ritual de soltura y cierre",
      opening:
        "Encendé una vela o imaginá una pequeña llama frente a vos. Respirá profundo tres veces. Pensá en lo que querés soltar — una emoción, una situación, una versión de vos que ya fue.",
      symbolicAction:
        "Escribí en un papel lo que querés dejar ir. Una sola frase, sin editar. Después rompelo en pedazos pequeños y tíralo, o si tenés vela, quemalo con cuidado. Mirá cómo se va.",
      closing:
        "Observá el espacio vacío que queda. Respirá. Decí: \"Gracias. Ya fue. Ahora sigo\". Cerrá los ojos un minuto más y sentí la liviandad de lo que soltaste.",
    },
    storyImage: "/images/story-fire-3.jpg",
    storyEyebrow: "RITUAL DE CIERRE",
    storyTitle: "Lo que ya fue no necesita más de tu energía",
    storyBody: "Soltar no es olvidar — es elegir no cargar más con algo que ya cumplió su ciclo. Este ritual crea un cierre real.",
    storyCta: "Hacer este ritual",
  },
  {
    id: "curated-atraer",
    ritualType: "atraer",
    element: "tierra",
    energy: "poder",
    intensity: "media",
    duration: 10,
    intention: "Quiero abrir espacio para nuevas oportunidades",
    anchor: "Mandar esa propuesta o mensaje que tenía pendiente",
    aiRitual: {
      title: "Ritual de apertura y atracción",
      opening:
        "Párate descalza si podés, con los pies bien apoyados en el suelo. Respirá tres veces sintiendo el peso de tu cuerpo. Estás presente, estás acá.",
      symbolicAction:
        "Sostené un objeto pequeño de la naturaleza — una piedra, una hoja, una semilla. Mientras lo sostenés, pensá en lo que querés atraer como si ya estuviera en camino. No como un deseo, sino como una certeza en formación.",
      closing:
        "Guardá el objeto en un lugar visible. Cada vez que lo veas, recordá tu intención. Decí: \"Estoy segura para recibir lo que se alinea conmigo\".",
    },
    storyImage: "/images/story-mountain-2.jpg",
    storyEyebrow: "RITUAL DE ATRACCIÓN",
    storyTitle: "Lo que querés ya está en movimiento",
    storyBody: "La tierra sostiene lo que sembrás. Este ritual conecta tu intención con una acción concreta para que lo que deseás pueda llegar.",
    storyCta: "Hacer este ritual",
  },
];

export function getCuratedRitualById(id: string): CuratedRitual | undefined {
  return CURATED_RITUALS.find((r) => r.id === id);
}

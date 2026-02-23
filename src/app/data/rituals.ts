export const RITUAL_TYPES = [
  { id: "claridad", label: "Claridad", icon: "◯", description: "Ver con más nitidez" },
  { id: "amor-propio", label: "Amor propio", icon: "◎", description: "Reconectar contigo" },
  { id: "calma", label: "Calma", icon: "—", description: "Soltar la tensión" },
  { id: "enfoque", label: "Enfoque", icon: "△", description: "Concentrar la energía" },
  { id: "cerrar-ciclo", label: "Cerrar ciclo", icon: "⊘", description: "Soltar y avanzar" },
  { id: "atraer", label: "Atraer oportunidad", icon: "✦", description: "Abrir puertas" },
];

export const ENERGIES = [
  { id: "calma", label: "Calma", description: "Serena y suave" },
  { id: "apertura", label: "Apertura", description: "Expansiva y receptiva" },
  { id: "poder", label: "Poder", description: "Firme y determinada" },
  { id: "conexion", label: "Conexión", description: "Profunda y presente" },
];

export const ELEMENTS = [
  {
    id: "tierra",
    label: "Tierra",
    subtitle: "Cuerpo · Estabilidad",
    description: "Te ancla al presente. Ideal cuando necesitas estabilidad, paciencia o reconectar con tu cuerpo.",
    symbol: "▭",
  },
  {
    id: "agua",
    label: "Agua",
    subtitle: "Emoción · Fluidez",
    description: "Mueve lo que está estancado. Ideal para soltar, sentir o fluir con los cambios.",
    symbol: "~",
  },
  {
    id: "fuego",
    label: "Fuego",
    subtitle: "Acción · Coraje",
    description: "Activa tu voluntad. Ideal cuando necesitas impulso, decisión o transformación.",
    symbol: "△",
  },
  {
    id: "aire",
    label: "Aire",
    subtitle: "Ideas · Perspectiva",
    description: "Aclara la mente. Ideal para momentos de confusión, creatividad o comunicación.",
    symbol: "≋",
  },
];

export const ANCHOR_SUGGESTIONS = [
  "Mandar ese mensaje",
  "Definir 1 hora de trabajo",
  "Salir a caminar",
  "Ordenar mi espacio",
  "Pedir ayuda",
  "Escribir 3 ideas",
  "Llamar a alguien",
];

export const INTENTION_CHIPS = [
  "Claridad", "Calma", "Amor propio", "Enfoque", "Soltar", "Oportunidad",
];

export const AI_RITUALS: Record<string, any> = {
  default: {
    title: "Ritual de presencia y claridad",
    opening:
      "Encuentra un lugar donde puedas estar sin interrupciones por unos minutos. Siéntate con la espalda recta y los pies apoyados en el suelo. Cierra los ojos. Toma tres respiraciones lentas y profundas — inhala por la nariz contando hasta cuatro, exhala por la boca contando hasta seis. Con cada exhalación, imagina que liberas todo lo que no necesitas cargar hoy.",
    symbolicAction:
      "Llena un vaso con agua limpia. Sostén la copa entre ambas palmas y piensa en tu intención — no como algo que falta, sino como algo que ya está tomando forma. Bebe el agua lentamente, en tres sorbos conscientes. Con cada sorbo, siente cómo tu cuerpo recibe y acepta lo que estás pidiendo.",
    closing:
      "Abre los ojos. Toma un momento de silencio. En voz baja o en tu mente, di: \"Gracias por la claridad que ya existe en mí\". Escribe una palabra — solo una — que represente cómo quieres sentirte hoy. Guárdala.",
  },
  claridad: {
    title: "Ritual de claridad interior",
    opening:
      "Siéntate en un lugar tranquilo. Apaga notificaciones. Cierra los ojos y toma cuatro respiraciones profundas, liberando tensión con cada exhalación. Cuando estés listo, lleva tu atención a la pregunta o situación que necesita claridad.",
    symbolicAction:
      "Toma un vaso de agua limpia. Sostenlo entre tus manos. Visualiza el agua como un espejo de tu mente — clara, sin agitación. Bebe lentamente, pensando en que cada sorbo te conecta con tu propia sabiduría. Si tienes una hoja y lapicero, escribe la pregunta central y rodéala con un círculo.",
    closing:
      "Cierra los ojos nuevamente. Inhala profundo y al exhalar, susurra: \"Ya tengo la respuesta que necesito — solo necesito escucharla\". Abre los ojos. Escribe lo primero que venga a tu mente sin editar. Confía en eso.",
  },
  "amor-propio": {
    title: "Ritual de amor y reconocimiento propio",
    opening:
      "Párate frente a un espejo o siéntate cómodamente. Coloca una mano sobre tu corazón. Cierra los ojos. Toma tres respiraciones profundas y con cada una, siente el calor de tu propia mano. Nota que tu corazón late — ha estado ahí, contigo, siempre.",
    symbolicAction:
      "Ponte algo de crema o aceite en las manos. Mientras te las aplicas, nombra en voz alta o mentalmente tres cosas que tu cuerpo hace por ti cada día. No tienen que ser grandes. Pueden ser: \"me lleva a donde necesito ir\", \"me permite abrazar\", \"me mantiene vivo/a\".",
    closing:
      "Coloca ambas manos en tu pecho. Di: \"Me elijo hoy\". No tiene que ser perfecto — solo sincero. Respira hondo una vez más y suelta. Ya terminaste. Eso fue suficiente.",
  },
  calma: {
    title: "Ritual de calma y soltura",
    opening:
      "Busca un lugar donde puedas sentarte o acostarte sin interrupciones. Cierra los ojos. Comienza a respirar con una cuenta de 4-7-8: inhala 4 segundos, retén 7 segundos, exhala 8 segundos. Repite este ciclo cuatro veces.",
    symbolicAction:
      "Si tienes agua, coloca tus manos bajo el chorro unos segundos — fría o tibia, lo que prefieras. Mientras el agua corre sobre tus manos, imagina que se lleva la tensión, la preocupación, el ruido mental. Si no hay agua cerca, frota suavemente tus palmas entre sí hasta sentirlas cálidas.",
    closing:
      "Toma una respiración profunda. Al exhalar, di en voz baja: \"Puedo con esto — y también puedo descansar\". Siéntate en silencio 30 segundos más. No hagas nada. Solo sé.",
  },
};

export const EXPLORE_RITUALS = [
  {
    id: "1",
    title: "Ritual de claridad para tomar una decisión",
    type: "Claridad",
    energy: "Apertura",
    element: "Agua",
    duration: 10,
    intensity: "Suave",
    author: "Anónimo",
    likes: 48,
    aiRitual: {
      title: "Ritual de claridad para tomar una decisión",
      opening:
        "Siéntate en silencio. Toma cuatro respiraciones profundas, soltando tensión con cada exhalación. Lleva tu atención a la situación que necesita claridad.",
      symbolicAction:
        "Toma un vaso de agua limpia. Sostenlo entre tus manos. Visualiza el agua como tu mente — clara, sin agitación. Bebe lentamente, pensando en tu sabiduría interior.",
      closing:
        "Cierra los ojos. Susurra: \"Ya tengo la respuesta que necesito\". Escribe lo primero que venga a tu mente.",
    },
    intention: "Quiero tener claridad para tomar una decisión importante",
    anchor: "Escribir los pros y contras en papel",
  },
  {
    id: "2",
    title: "Soltar lo que ya no me sirve",
    type: "Cerrar ciclo",
    energy: "Calma",
    element: "Fuego",
    duration: 5,
    intensity: "Suave",
    author: "Valeria M.",
    likes: 72,
    aiRitual: {
      title: "Ritual de soltura y cierre",
      opening:
        "Enciende una vela o imagina una pequeña llama frente a ti. Respira profundo tres veces. Piensa en lo que quieres soltar.",
      symbolicAction:
        "Escribe en un papel lo que quieres dejar ir. Puede ser una emoción, una situación, una versión de ti. Rómpelo en pedazos pequeños y tíralo.",
      closing:
        "Observa el espacio vacío que queda. Respira. Di: \"Gracias. Ya fue. Ahora sigo\".",
    },
    intention: "Quiero cerrar un ciclo que me tiene anclado/a",
    anchor: "Borrar o archivar algo que me recordaba eso",
  },
  {
    id: "3",
    title: "Atracción de una nueva oportunidad",
    type: "Atraer oportunidad",
    energy: "Poder",
    element: "Tierra",
    duration: 10,
    intensity: "Media",
    author: "Anónimo",
    likes: 91,
    aiRitual: {
      title: "Ritual de apertura y atracción",
      opening:
        "Párate descalzo/a si puedes, con los pies bien apoyados en el suelo. Respira tres veces sintiendo el peso de tu cuerpo. Estás presente, estás aquí.",
      symbolicAction:
        "Sostén un objeto pequeño de la naturaleza — una piedra, una hoja, una semilla. Mientras lo sostienes, piensa en lo que quieres atraer como si ya estuviera en camino. No como un deseo, sino como una certeza en formación.",
      closing:
        "Guarda el objeto en un lugar visible. Cada vez que lo veas, recuerda tu intención. Di: \"Estoy listo/a para recibir lo que se alinea conmigo\".",
    },
    intention: "Quiero abrir espacio para nuevas oportunidades laborales",
    anchor: "Mandar una propuesta o mensaje que tenía pendiente",
  },
  {
    id: "4",
    title: "Enfoque antes de un momento importante",
    type: "Enfoque",
    energy: "Poder",
    element: "Fuego",
    duration: 5,
    intensity: "Suave",
    author: "Diego R.",
    likes: 35,
    aiRitual: {
      title: "Ritual de activación y enfoque",
      opening:
        "Párate. Estira los brazos sobre tu cabeza, inhala profundo y al exhalar, baja los brazos con fuerza. Repite dos veces. Esto activa tu cuerpo y tu mente.",
      symbolicAction:
        "Frota tus palmas durante 10 segundos hasta sentir calor. Colócalas suavemente sobre tus ojos cerrados. Visualiza exactamente cómo quieres que resulte el momento que viene.",
      closing:
        "Suelta las manos. Abre los ojos. Respira. Di: \"Estoy preparado/a. Voy\".",
    },
    intention: "Quiero estar enfocado/a antes de mi presentación",
    anchor: "Revisar mis notas y apagar el celular 10 minutos antes",
  },
  {
    id: "5",
    title: "Reconectarme conmigo en un día difícil",
    type: "Amor propio",
    energy: "Conexión",
    element: "Agua",
    duration: 10,
    intensity: "Profunda",
    author: "Anónimo",
    likes: 114,
    aiRitual: {
      title: "Ritual de reencuentro personal",
      opening:
        "Encuentra silencio. Siéntate o acuéstate. Coloca una mano sobre tu pecho. Siente tu propio latido. Cierra los ojos.",
      symbolicAction:
        "Date una ducha consciente o lávate la cara con agua fría. Mientras el agua te toca, piensa: 'Estoy limpiando lo que no me pertenece'. No lo que eres — solo lo que cargaste hoy.",
      closing:
        "Sécate despacio. Mírate en el espejo aunque sea un segundo. Di: \"Hice lo que pude. Y fue suficiente\".",
    },
    intention: "Quiero reconectarme conmigo después de un día muy pesado",
    anchor: "Acostarme sin el celular los primeros 15 minutos",
  },
  {
    id: "6",
    title: "Iniciar la semana con presencia",
    type: "Calma",
    energy: "Calma",
    element: "Aire",
    duration: 5,
    intensity: "Suave",
    author: "Camila V.",
    likes: 29,
    aiRitual: {
      title: "Ritual de inicio de semana",
      opening:
        "Abre una ventana o sal un momento al exterior. Siente el aire en tu cara. Inhala profundo por la nariz, recibiendo el nuevo comienzo. Exhala por la boca, soltando lo que quedó de la semana anterior.",
      symbolicAction:
        "Escribe en papel o en tu teléfono una sola palabra que quieres que guíe esta semana. No una lista. Solo una palabra.",
      closing:
        "Lee esa palabra en voz alta tres veces. Ponla en un lugar visible. Di: \"Esta semana, elijo ___\".",
    },
    intention: "Comenzar la semana con calma y sin ansiedad",
    anchor: "Planificar solo mis 3 prioridades del lunes",
  },
];

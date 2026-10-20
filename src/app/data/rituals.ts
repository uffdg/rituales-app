export const RITUAL_TYPES = [
  { id: "claridad", label: "Claridad", icon: "◯", description: "Ver con más nitidez" },
  { id: "amor-propio", label: "Amor propio", icon: "◎", description: "Reconectar con vos" },
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
    description: "Te ancla al presente. Ideal cuando necesitás estabilidad, paciencia o reconectar con tu cuerpo.",
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
    description: "Activa tu voluntad. Ideal cuando necesitás impulso, decisión o transformación.",
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
      "Encontrá un lugar donde puedas estar sin interrupciones por unos minutos. Sentate con la espalda recta y los pies apoyados en el suelo. Cerrá los ojos. Hacé tres respiraciones lentas y profundas — inhalá por la nariz contando hasta cuatro, exhalá por la boca contando hasta seis. Con cada exhalación, imaginá que liberás todo lo que no necesitás cargar hoy.",
    symbolicAction:
      "Llená un vaso con agua limpia. Sostené la copa entre ambas palmas y pensá en tu intención — no como algo que falta, sino como algo que ya está tomando forma. Tomá el agua lentamente, en tres sorbos conscientes. Con cada sorbo, sentí cómo tu cuerpo recibe y acepta lo que estás pidiendo.",
    closing:
      "Abrí los ojos. Tomate un momento de silencio. En voz baja o en tu mente, decí: \"Gracias por la claridad que ya existe en mí\". Escribí una palabra — solo una — que represente cómo querés sentirte hoy. Guardala.",
  },
  claridad: {
    title: "Ritual de claridad interior",
    opening:
      "Sentate en un lugar tranquilo. Apagá las notificaciones. Cerrá los ojos y hacé cuatro respiraciones profundas, liberando tensión con cada exhalación. Cuando estés lista, llevá tu atención a la pregunta o situación que necesita claridad.",
    symbolicAction:
      "Tomá un vaso de agua limpia. Sostenelo entre tus manos. Visualizá el agua como un espejo de tu mente — clara, sin agitación. Tomala lentamente, pensando en que cada sorbo te conecta con tu propia sabiduría. Si tenés una hoja y una lapicera, escribí la pregunta central y rodeala con un círculo.",
    closing:
      "Cerrá los ojos nuevamente. Inhalá profundo y al exhalar, susurrá: \"Ya tengo la respuesta que necesito — solo necesito escucharla\". Abrí los ojos. Escribí lo primero que venga a tu mente sin editar. Confiá en eso.",
  },
  "amor-propio": {
    title: "Ritual de amor y reconocimiento propio",
    opening:
      "Parate frente a un espejo o sentate cómodamente. Apoyá una mano sobre tu corazón. Cerrá los ojos. Hacé tres respiraciones profundas y con cada una, sentí el calor de tu propia mano. Nota que tu corazón late — estuvo ahí, con vos, siempre.",
    symbolicAction:
      "Ponete algo de crema o aceite en las manos. Mientras te las aplicás, nombrá en voz alta o mentalmente tres cosas que tu cuerpo hace por vos cada día. No tienen que ser grandes. Pueden ser: \"me lleva a donde necesito ir\", \"me permite abrazar\", \"me mantiene viva\".",
    closing:
      "Apoyá ambas manos en tu pecho. Decí: \"Me elijo hoy\". No tiene que ser perfecto — solo sincero. Respirá hondo una vez más y soltá. Ya terminaste. Eso fue suficiente.",
  },
  calma: {
    title: "Ritual de calma y soltura",
    opening:
      "Buscá un lugar donde puedas sentarte o acostarte sin interrupciones. Cerrá los ojos. Empezá a respirar con una cuenta de 4-7-8: inhalá 4 segundos, retené 7 segundos, exhalá 8 segundos. Repetí este ciclo cuatro veces.",
    symbolicAction:
      "Si tenés agua, poné tus manos bajo el chorro unos segundos — fría o tibia, lo que prefieras. Mientras el agua corre sobre tus manos, imaginá que se lleva la tensión, la preocupación, el ruido mental. Si no hay agua cerca, frotá suavemente tus palmas entre sí hasta sentirlas cálidas.",
    closing:
      "Hacé una respiración profunda. Al exhalar, decí en voz baja: \"Puedo con esto — y también puedo descansar\". Quedate en silencio 30 segundos más. No hagas nada. Solo sé.",
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
        "Sentate en silencio. Hacé cuatro respiraciones profundas, soltando tensión con cada exhalación. Llevá tu atención a la situación que necesita claridad.",
      symbolicAction:
        "Tomá un vaso de agua limpia. Sostenelo entre tus manos. Visualizá el agua como tu mente — clara, sin agitación. Tomala lentamente, pensando en tu sabiduría interior.",
      closing:
        "Cerrá los ojos. Susurrá: \"Ya tengo la respuesta que necesito\". Escribí lo primero que venga a tu mente.",
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
        "Encendé una vela o imaginá una pequeña llama frente a vos. Respirá profundo tres veces. Pensá en lo que querés soltar.",
      symbolicAction:
        "Escribí en un papel lo que querés dejar ir. Puede ser una emoción, una situación, una versión tuya. Rompelo en pedazos pequeños y tiralo.",
      closing:
        "Observá el espacio vacío que queda. Respirá. Decí: \"Gracias. Ya fue. Ahora sigo\".",
    },
    intention: "Quiero cerrar un ciclo que me tiene anclada",
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
        "Parate descalza si podés, con los pies bien apoyados en el suelo. Respirá tres veces sintiendo el peso de tu cuerpo. Estás presente, estás acá.",
      symbolicAction:
        "Sostené un objeto pequeño de la naturaleza — una piedra, una hoja, una semilla. Mientras lo sostenés, pensá en lo que querés atraer como si ya estuviera en camino. No como un deseo, sino como una certeza en formación.",
      closing:
        "Guardá el objeto en un lugar visible. Cada vez que lo veas, recordá tu intención. Decí: \"Estoy segura para recibir lo que se alinea conmigo\".",
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
        "Parate. Estirá los brazos sobre tu cabeza, inhalá profundo y al exhalar, bajá los brazos con fuerza. Repetí dos veces. Esto activa tu cuerpo y tu mente.",
      symbolicAction:
        "Frotá tus palmas durante 10 segundos hasta sentir calor. Apoyalas suavemente sobre tus ojos cerrados. Visualizá exactamente cómo querés que resulte el momento que viene.",
      closing:
        "Soltá las manos. Abrí los ojos. Respirá. Decí: \"Estoy preparada. Voy\".",
    },
    intention: "Quiero estar enfocada antes de mi presentación",
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
        "Buscá silencio. Sentate o acostate. Apoyá una mano sobre tu pecho. Sentí tu propio latido. Cerrá los ojos.",
      symbolicAction:
        "Date una ducha consciente o lavate la cara con agua fría. Mientras el agua te toca, pensá: 'Estoy limpiando lo que no me pertenece'. No lo que sos — solo lo que cargaste hoy.",
      closing:
        "Secate despacio. Mirate en el espejo aunque sea un segundo. Decí: \"Hice lo que pude. Y fue suficiente\".",
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
        "Abrí una ventana o salí un momento afuera. Sentí el aire en tu cara. Inhalá profundo por la nariz, recibiendo el nuevo comienzo. Exhala por la boca, soltando lo que quedó de la semana anterior.",
      symbolicAction:
        "Escribí en papel o en tu teléfono una sola palabra que quieras que guíe esta semana. No una lista. Solo una palabra.",
      closing:
        "Leé esa palabra en voz alta tres veces. Ponela en un lugar visible. Decí: \"Esta semana, elijo ___\".",
    },
    intention: "Comenzar la semana con calma y sin ansiedad",
    anchor: "Planificar solo mis 3 prioridades del lunes",
  },
  {
    id: "7",
    title: "Deseo rosa para atraer amor recíproco",
    type: "Amor propio",
    energy: "Conexión",
    element: "Agua",
    duration: 10,
    intensity: "Profunda",
    author: "Galería Rituales",
    likes: 64,
    aiRitual: {
      title: "Ritual rosa para atraer amor recíproco",
      opening:
        "Buscá un momento tranquilo. Respirá lento y apoyá una mano en el corazón. Imaginá una luz rosa envolviendo tu pecho y aflojando defensas viejas.",
      symbolicAction:
        "Escribí en un papel cómo querés sentirte en un vínculo amoroso: vista, cuidada, elegida, en paz. Leelo en voz alta y sostené ese papel entre tus manos unos segundos.",
      closing:
        "Doblá el papel y guardalo cerca de tu cama. Decí: \"Abro espacio para un amor que me encuentre disponible y en verdad\".",
    },
    intention: "Quiero atraer un amor recíproco y tierno",
    anchor: "Elegir un gesto concreto para tratarme con más amor esta semana",
  },
  {
    id: "8",
    title: "Impulso rojo para activar una venta",
    type: "Atraer oportunidad",
    energy: "Poder",
    element: "Fuego",
    duration: 5,
    intensity: "Media",
    author: "Galería Rituales",
    likes: 52,
    aiRitual: {
      title: "Ritual rojo para activar una venta",
      opening:
        "Parate con los pies firmes en el suelo. Inhalá profundo y al exhalar sentí cómo tu cuerpo se enciende con decisión, como una chispa roja que despierta acción.",
      symbolicAction:
        "Tomá tu celular o cuaderno y escribí el nombre del servicio, producto o propuesta que querés mover hoy. Miralo como algo vivo, listo para circular.",
      closing:
        "Decí: \"Mi trabajo tiene valor y hoy se pone en movimiento\". Después elegí un paso inmediato: publicar, responder o enviar una propuesta.",
    },
    intention: "Quiero activar una venta que está trabada",
    anchor: "Mandar hoy mismo una oferta o recordatorio pendiente",
  },
  {
    id: "9",
    title: "Descanso azul para sanar el cuerpo",
    type: "Calma",
    energy: "Calma",
    element: "Agua",
    duration: 10,
    intensity: "Suave",
    author: "Galería Rituales",
    likes: 77,
    aiRitual: {
      title: "Ritual azul para descanso y salud",
      opening:
        "Acostate o sentate cómoda. Respirá más lento de lo habitual y sentí una luz azul rodeando tu cuerpo, bajando el ruido del día y creando calma.",
      symbolicAction:
        "Poné ambas manos sobre la zona del cuerpo que necesita más cuidado, o sobre el pecho si no sabés dónde. Repetí en silencio: \"Le doy descanso a mi cuerpo para que pueda recuperar su equilibrio\".",
      closing:
        "Tomá un vaso de agua despacio. Imaginá que esa agua lleva paz a cada parte de vos. Permitite ir más lento el resto del día.",
    },
    intention: "Quiero descansar de verdad para recuperar energía y salud",
    anchor: "Apagar pantallas media hora antes de dormir",
  },
  {
    id: "10",
    title: "Limpieza blanca para ordenar un vínculo",
    type: "Claridad",
    energy: "Apertura",
    element: "Aire",
    duration: 5,
    intensity: "Suave",
    author: "Galería Rituales",
    likes: 46,
    aiRitual: {
      title: "Ritual blanco para ordenar un vínculo",
      opening:
        "Abrí una ventana o buscá aire fresco. Hacé tres respiraciones largas y sentí que una luz blanca limpia el peso emocional acumulado entre vos y ese vínculo.",
      symbolicAction:
        "Escribí tres palabras que describan cómo querés que se sienta esa relación: clara, honesta, liviana, tierna o las que te surjan. Leelas despacio.",
      closing:
        "Decí: \"Suelto la confusión y dejo espacio para la verdad\". Guardá esas palabras como guía de tu próxima conversación o decisión.",
    },
    intention: "Quiero limpiar la confusión en un vínculo importante",
    anchor: "Decidir una conversación o límite que necesito expresar",
  },
  {
    id: "11",
    title: "Semilla verde para abrir prosperidad",
    type: "Atraer oportunidad",
    energy: "Apertura",
    element: "Tierra",
    duration: 10,
    intensity: "Media",
    author: "Galería Rituales",
    likes: 88,
    aiRitual: {
      title: "Ritual verde para abrir prosperidad",
      opening:
        "Sentate con algo de tierra, una planta o una semilla cerca. Respirá profundo y sentí que tu deseo de prosperidad puede crecer con paciencia y sostén.",
      symbolicAction:
        "Poné una moneda o billete doblado debajo de una maceta o de una taza con tierra. Mientras lo hacés, nombrá aquello que querés cultivar económicamente.",
      closing:
        "Agradecé como si esa abundancia ya estuviera en camino. Decí: \"Lo que cuido crece\" y dejá ese pequeño altar en un lugar visible.",
    },
    intention: "Quiero abrir prosperidad y estabilidad económica",
    anchor: "Revisar mis ingresos y anotar una meta concreta para este mes",
  },
  {
    id: "12",
    title: "Mente amarilla para ordenar las cuentas",
    type: "Enfoque",
    energy: "Poder",
    element: "Aire",
    duration: 5,
    intensity: "Suave",
    author: "Galería Rituales",
    likes: 41,
    aiRitual: {
      title: "Ritual amarillo para enfoque financiero",
      opening:
        "Sentate con una libreta o una nota abierta. Respirá profundo y visualizá una luz amarilla aclarando tu mente, como si prendieras una lámpara adentro tuyo.",
      symbolicAction:
        "Escribí tus gastos, pendientes o números tal como están, sin evitarlos. Miralos con honestidad y elegí una sola prioridad para ordenar hoy.",
      closing:
        "Decí: \"Puedo ver con claridad lo que necesito ordenar\". Cerrá la libreta sabiendo que ya empezaste a acomodarte.",
    },
    intention: "Quiero ordenar mis cuentas con claridad y enfoque",
    anchor: "Separar 15 minutos mañana para revisar mis números otra vez",
  },
  {
    id: "13",
    title: "Cambio naranja para atraer trabajo",
    type: "Atraer oportunidad",
    energy: "Poder",
    element: "Fuego",
    duration: 10,
    intensity: "Media",
    author: "Galería Rituales",
    likes: 58,
    aiRitual: {
      title: "Ritual naranja para abrir trabajo nuevo",
      opening:
        "Parate y mové suavemente el cuerpo durante unos segundos. Respirá con energía, imaginando una llama naranja que despierta tu motivación y tu deseo de avanzar.",
      symbolicAction:
        "Escribí el tipo de trabajo, proyecto o cliente que querés atraer. Después, debajo, anotá una acción concreta que te acerque a eso hoy mismo.",
      closing:
        "Leé en voz alta esa acción y hacela visible. Decí: \"Me abro al cambio que me impulsa hacia adelante\".",
    },
    intention: "Quiero atraer una oportunidad laboral nueva",
    anchor: "Actualizar mi perfil o enviar una postulación hoy",
  },
  {
    id: "14",
    title: "Transformación violeta para sanar un amor viejo",
    type: "Cerrar ciclo",
    energy: "Conexión",
    element: "Agua",
    duration: 20,
    intensity: "Profunda",
    author: "Galería Rituales",
    likes: 69,
    aiRitual: {
      title: "Ritual violeta para transformar un amor viejo",
      opening:
        "Buscá silencio y sentate cómoda. Respirá profundo varias veces hasta sentir que afloja el pecho. Imaginá una bruma violeta envolviendo recuerdos que todavía duelen.",
      symbolicAction:
        "Escribí aquello que todavía seguís llevando de esa historia: palabras, promesas, escenas o emociones. Leelo una vez y después doblá el papel con suavidad.",
      closing:
        "Apoyá el papel en un cuenco o caja y decí: \"Lo vivido me transformó, pero ya no me define\". Agradecé lo aprendido y elegí volver a vos.",
    },
    intention: "Quiero sanar una historia de amor que todavía me pesa",
    anchor: "Dejar de revisar algo que me ata a esa relación",
  },
  {
    id: "15",
    title: "Protección negra contra la escasez",
    type: "Cerrar ciclo",
    energy: "Poder",
    element: "Fuego",
    duration: 5,
    intensity: "Media",
    author: "Galería Rituales",
    likes: 37,
    aiRitual: {
      title: "Ritual negro para cortar con la escasez",
      opening:
        "Respirá profundo y reconocé el miedo económico que venís cargando. Imaginá una llama negra absorbiendo esas ideas de carencia y dejándote más firme.",
      symbolicAction:
        "Escribí una creencia de escasez que querés cortar, como \"no me alcanza\" o \"no puedo más\". Tachala varias veces hasta que deje de tener fuerza.",
      closing:
        "Decí: \"Corto con lo que me achica y protejo mi energía\". Tirá ese papel y elegí una acción de orden que te devuelva poder.",
    },
    intention: "Quiero cortar con el miedo y la sensación constante de escasez",
    anchor: "Borrar un gasto automático que ya no necesito",
  },
  {
    id: "16",
    title: "Deseo dorado para expansión económica",
    type: "Atraer oportunidad",
    energy: "Apertura",
    element: "Tierra",
    duration: 10,
    intensity: "Profunda",
    author: "Galería Rituales",
    likes: 83,
    aiRitual: {
      title: "Ritual dorado para expansión económica",
      opening:
        "Buscá un espacio ordenado y llevá tu atención al deseo de crecer. Imaginá una luz dorada alrededor tuyo, recordándote que también merecés recibir en grande.",
      symbolicAction:
        "Colocá una moneda, un billete o un símbolo de abundancia frente a vos. Visualizá ese brillo dorado expandiéndose hacia tus proyectos, ventas e ideas.",
      closing:
        "Decí: \"Recibo con gratitud lo que se expande para mí\". Guardá ese objeto donde puedas verlo durante la semana.",
    },
    intention: "Quiero expandir mis ingresos con confianza y merecimiento",
    anchor: "Anotar una meta económica más grande y sostenerla visible",
  },
  {
    id: "17",
    title: "Intuición plateada para volver a elegirte",
    type: "Amor propio",
    energy: "Conexión",
    element: "Aire",
    duration: 10,
    intensity: "Suave",
    author: "Galería Rituales",
    likes: 57,
    aiRitual: {
      title: "Ritual plateado para escuchar tu intuición",
      opening:
        "Cerrá los ojos y llevá una mano a la garganta y otra al corazón. Respirá suave, imaginando una luz plateada que ordena tu sensibilidad y tu escucha interna.",
      symbolicAction:
        "Escribí una pregunta simple: \"¿Qué necesito hoy para elegirme más?\". Quedate un minuto en silencio y dejá que aparezca una respuesta sin forzarla.",
      closing:
        "Leé esa respuesta en voz baja. Decí: \"Confío en mi guía interna y la sigo con suavidad\".",
    },
    intention: "Quiero volver a escucharme y elegirme con más amor",
    anchor: "Decir que no a algo que me aleja de mí",
  },
  {
    id: "18",
    title: "Salud verde para recuperar energía",
    type: "Calma",
    energy: "Calma",
    element: "Tierra",
    duration: 10,
    intensity: "Suave",
    author: "Galería Rituales",
    likes: 62,
    aiRitual: {
      title: "Ritual verde para recuperar energía",
      opening:
        "Sentate con los pies apoyados en el suelo. Hacé respiraciones profundas y sentí una luz verde recorriendo tu cuerpo, trayendo descanso, salud y renovación.",
      symbolicAction:
        "Tomá un vaso de agua o una infusión tibia con total atención. Mientras lo hacés, repetí: \"Mi cuerpo sabe volver a su equilibrio\".",
      closing:
        "Agradecé a tu cuerpo por sostenerte incluso cuando estás cansada. Elegí un pequeño acto de cuidado para hoy y comprometete con eso.",
    },
    intention: "Quiero recuperar energía física y sentirme más saludable",
    anchor: "Tomarme una pausa real y salir a caminar 10 minutos",
  },
  {
    id: "19",
    title: "Blanco de paz para reconciliar un corazón",
    type: "Amor propio",
    energy: "Apertura",
    element: "Agua",
    duration: 5,
    intensity: "Suave",
    author: "Galería Rituales",
    likes: 44,
    aiRitual: {
      title: "Ritual blanco para reconciliar el corazón",
      opening:
        "Respirá con suavidad y dejá que baje la exigencia. Imaginá una luz blanca limpiando restos de enojo, culpa o tristeza guardada.",
      symbolicAction:
        "Escribí una frase de perdón o de paz para vos misma, aunque todavía no la sientas completa. Sostenela un momento y dejá que repose en tu pecho.",
      closing:
        "Decí: \"Elijo paz para mi corazón, incluso mientras sigo aprendiendo\". Guardá esa frase como recordatorio.",
    },
    intention: "Quiero hacer espacio para la paz en mi vida amorosa",
    anchor: "Hablarme con más suavidad cada vez que me critique",
  },
  {
    id: "20",
    title: "Rojo de acción para cobrar lo que vale tu trabajo",
    type: "Enfoque",
    energy: "Poder",
    element: "Fuego",
    duration: 5,
    intensity: "Media",
    author: "Galería Rituales",
    likes: 55,
    aiRitual: {
      title: "Ritual rojo para cobrar tu valor",
      opening:
        "Parate recta y respirá profundo. Sentí una energía roja subiendo por el cuerpo, afirmando tu presencia y tu derecho a pedir lo que corresponde.",
      symbolicAction:
        "Escribí el monto, propuesta o límite económico que necesitás sostener. Miralo sin achicarte. Repetí: \"Mi trabajo merece intercambio claro\".",
      closing:
        "Elegí una acción inmediata: enviar un presupuesto, recordar un pago o corregir un precio. Hacela dentro de las próximas 24 horas.",
    },
    intention: "Quiero cobrar lo que vale mi trabajo con firmeza",
    anchor: "Mandar el presupuesto o recordatorio que vengo evitando",
  },
];

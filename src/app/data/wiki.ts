export interface WikiNote {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  body: string;
  sections?: Array<{
    title: string;
    paragraphs?: string[];
    bullets?: string[];
  }>;
  image?: string;
}

export const WIKI_NOTES: WikiNote[] = [
  {
    id: "preparar-vela",
    image: "/wiki/sixteen-miles-out-oDfeFV-Y2v0-unsplash.jpg",
    title: "Cómo se prepara una vela",
    eyebrow: "Guía esencial",
    summary: "Intención, limpieza, encendido y cuidado para usar la vela como parte real del ritual.",
    body:
      "En la tradición wicca, una vela no es solo luz. Es un puente entre tu intención y el campo de posibilidad. Prepararla con presencia cambia el ritual por completo.",
    sections: [
      {
        title: "1. Antes de empezar",
        paragraphs: [
          "Encender una vela puede dejar de ser un gesto automático y volverse un acto consciente. Lo que preparás antes del encendido ordena lo que después querés activar.",
          "La idea no es hacerlo perfecto. La idea es hacerlo real, con intención clara y atención puesta en el momento.",
        ],
      },
      {
        title: "2. Qué color elegir",
        bullets: [
          "Blanco: limpieza, purificación y protección. También reemplaza otros colores si no los tenés.",
          "Negro: corte, absorción de energía densa y protección profunda.",
          "Rojo: pasión, vitalidad, deseo y fuerza de voluntad.",
          "Rosa: amor propio, reconciliación, sanación del corazón y vínculos afectivos.",
          "Naranja: alegría, abundancia creativa, impulso y éxito en proyectos.",
          "Amarillo: claridad mental, comunicación, aprendizaje y enfoque.",
          "Verde: prosperidad material, salud física, crecimiento y naturaleza.",
          "Azul: paz interior, intuición, descanso, sueños y calma profunda.",
          "Violeta: espiritualidad, transformación, sabiduría y conexión con lo sagrado.",
          "Dorado: éxito, poder personal, energía solar y abundancia mayor.",
          "Plateado: energía lunar, intuición, ciclos y reflexión.",
        ],
      },
      {
        title: "3. Forma y material",
        bullets: [
          "Vela cilíndrica: versátil para rituales de duración media.",
          "Vela de siete días: ideal para trabajos sostenidos y procesos largos.",
          "Vela cónica: útil para una sesión más breve e intensa.",
          "Cera de abeja: se considera de las más limpias energéticamente.",
          "Corazón de cobre: amplifica intención, vínculo, abundancia y comunicación.",
        ],
      },
      {
        title: "4. Cómo limpiarla",
        paragraphs: [
          "Toda vela nueva carga energía de fabricación, transporte y manipulación. Antes de intencionarla, conviene limpiarla.",
        ],
        bullets: [
          "Pasarla por humo de salvia, romero, palo santo o incienso.",
          "Apoyar la base en sal gruesa durante una noche.",
          "Dejarla a la luz de la luna nueva o llena.",
          "Limpiarla con agua y sal si el material lo permite, secándola muy bien después.",
          "Sostenerla entre las manos y visualizar una luz blanca o dorada limpiándola.",
        ],
      },
      {
        title: "5. Cómo intencionarla con aceite",
        paragraphs: [
          "Ungir una vela con aceite es una forma antigua de cargarla con intención. La dirección también importa.",
        ],
        bullets: [
          "De la mecha hacia la base: para atraer, convocar o llamar hacia vos.",
          "De la base hacia la mecha: para soltar, liberar o alejar.",
          "Lavanda: calma, sueño y purificación.",
          "Rosa: amor propio, ternura y sanación emocional.",
          "Canela: abundancia, rapidez, protección y fuego.",
          "Naranja dulce: alegría, prosperidad y energía solar.",
          "Pachulí: tierra, estabilidad, dinero y sensualidad.",
          "Eucalipto: salud, limpieza y claridad mental.",
          "Mirra o incienso: elevación espiritual y conexión con lo sagrado.",
        ],
      },
      {
        title: "6. El momento del encendido",
        bullets: [
          "Antes de prenderla, cerrá los ojos y traé la intención con claridad.",
          "Si podés, usá fósforos: no es obligatorio, pero suma una capa simbólica.",
          "Nombrá la intención en presente y en positivo.",
          "Observá la llama unos segundos: también forma parte del ritual.",
        ],
      },
      {
        title: "7. Cuánto puede durar",
        bullets: [
          "1 día: acción inmediata, claridad o energía puntual.",
          "3 días: transformación y pasaje.",
          "7 días: manifestación sostenida y semana planetaria.",
          "13 días: proceso lunar de media vuelta.",
          "28 o 29 días: ciclo lunar completo para cambios profundos.",
        ],
      },
      {
        title: "8. Cómo apagarla",
        paragraphs: [
          "En la tradición wicca no se recomienda soplar una vela ritual, porque se entiende que dispersa la intención.",
        ],
        bullets: [
          "Usar apagavelas.",
          "Apagar con los dedos húmedos si sabés hacerlo con seguridad.",
          "Cubrir la llama para quitarle oxígeno.",
          "Al apagarla, podés decir: “La llama descansa. La intención sigue activa.”",
        ],
      },
      {
        title: "9. Qué mirar mientras arde",
        bullets: [
          "Llama alta y estable: energía fluyendo.",
          "Llama pequeña o temblorosa: resistencia o falta de foco.",
          "Se apaga sola: puede haber cierre o algo para revisar.",
          "Chisporrotea: movimiento energético intenso.",
          "Humo negro: resistencia, bloqueo o falta de limpieza.",
          "Humo blanco: purificación activa.",
        ],
      },
      {
        title: "Una nota final",
        paragraphs: [
          "La vela más poderosa es la que preparaste con presencia.",
          "No necesitás hacerlo perfecto. Necesitás hacerlo consciente y real.",
        ],
      },
    ],
  },
  {
    id: "importancia-del-ritual",
    image: "/wiki/ray-albrow-vCc-F97wkHk-unsplash.jpg",
    title: "La importancia del ritual",
    eyebrow: "Fundamentos",
    summary: "Por qué un gesto simbólico puede ordenar la atención, sostener una intención y crear presencia real.",
    body:
      "Hay algo que pasa cuando hacés una cosa pequeña con atención completa. Un gesto sencillo, sin utilidad práctica inmediata, puede ordenar lo que venía disperso. Eso es un ritual.",
    sections: [
      {
        title: "1. Qué es un ritual",
        paragraphs: [
          "Un ritual no es una rutina automática. Es una acción con presencia, donde cada gesto está elegido y habitado.",
          "Tampoco es superstición. No se trata de delegar afuera lo que querés que pase, sino de alinearte con una intención y recordarte quién sos y hacia dónde querés ir.",
        ],
      },
      {
        title: "2. Por qué funciona",
        paragraphs: [
          "El cerebro responde a la repetición, al símbolo y a la emoción. Cuando repetís un gesto con atención, construís una asociación interna entre ese gesto y un estado.",
          "Con el tiempo, ese gesto deja de ser solo una acción y se vuelve una señal. La vela, el agua, el aroma o la respiración le comunican al cuerpo: ahora estamos entrando en otro modo.",
        ],
      },
      {
        title: "3. Cómo interrumpe el piloto automático",
        paragraphs: [
          "Vivimos gran parte del tiempo desde la inercia. El ritual corta esa continuidad y le dice al sistema nervioso que algo distinto está pasando.",
          "Ese corte convoca atención, y la atención es la base de cualquier cambio real.",
        ],
      },
      {
        title: "4. El valor del símbolo",
        paragraphs: [
          "El inconsciente no trabaja solo con ideas. También responde a imágenes, sensaciones, relatos y símbolos.",
          "Por eso una intención dicha en palabras puede ordenarse mucho más cuando además se encarna en un gesto, una llama, un objeto o un ritmo.",
        ],
      },
      {
        title: "5. Para qué sirve en la práctica",
        bullets: [
          "Ordena la intención: te obliga a precisar qué querés convocar.",
          "Crea presencia: te trae al cuerpo y al momento actual.",
          "Marca umbrales: ayuda a cerrar etapas y abrir otras.",
          "Sostiene en el tiempo: vuelve una intención más estable a través de la repetición.",
        ],
      },
      {
        title: "6. Un ritual mínimo",
        paragraphs: [
          "No hace falta mucho para que un ritual funcione. Lo esencial es que exista un núcleo claro y habitable.",
        ],
        bullets: [
          "Una intención clara, en presente y en positivo.",
          "Un gesto físico que involucre al cuerpo.",
          "Un momento delimitado, con inicio y cierre.",
          "Una repetición con cierta cadencia.",
        ],
      },
      {
        title: "7. Ritual y sistema nervioso",
        paragraphs: [
          "Cuando el cuerpo reconoce una secuencia predecible, sensorial y segura, puede empezar a regularse.",
          "Por eso el ritual también es una forma de bajar la guardia, entrar en presencia y darle al sistema nervioso una experiencia distinta de la urgencia cotidiana.",
        ],
      },
      {
        title: "Para cerrar",
        paragraphs: [
          "Un ritual no cambia la vida de golpe.",
          "Pero entrena una forma de estar presente en ella. Y con el tiempo, eso puede cambiar mucho.",
        ],
      },
    ],
  },
  {
    id: "como-prepararte",
    image: "/wiki/nicole-queiroz-hfGFOLrztbM-unsplash.jpg",
    title: "Cómo prepararte para un ritual",
    eyebrow: "Antes de empezar",
    summary: "Cuerpo, respiración, espacio y presencia para llegar al ritual antes de empezar.",
    body:
      "Un ritual empieza antes del primer gesto. Empieza cuando decidís que algo merece tu atención completa. Todo lo que hacés antes de encender la vela o nombrar una intención ya forma parte del trabajo.",
    sections: [
      {
        title: "1. El cuerpo primero",
        paragraphs: [
          "El sistema nervioso no sabe que decidiste hacer un ritual. Solo sabe cómo se siente el cuerpo cuando llegás.",
          "Si el cuerpo está acelerado, tenso o desconectado, eso también entra al ritual. Por eso la preparación física no es un lujo: es parte de la práctica.",
        ],
        bullets: [
          "Parate o sentate y sentí el peso del cuerpo sobre lo que te sostiene.",
          "Aflojá hombros y mandíbula.",
          "Poné las manos sobre el pecho o la panza.",
          "Quedate unos segundos notando que ya estás acá.",
        ],
      },
      {
        title: "2. La postura justa",
        paragraphs: [
          "No existe una postura sagrada única. La mejor postura es la que te permite estar presente sin distraerte todo el tiempo.",
        ],
        bullets: [
          "Sentada: columna alargada, sin rigidez.",
          "Acostada: solo si no te dormís.",
          "De pie: ideal para rituales de activación o movimiento.",
          "Manos en regazo, rodillas o en contacto con el elemento central del ritual.",
        ],
      },
      {
        title: "3. La respiración de llegada",
        paragraphs: [
          "La respiración es la puerta más directa entre lo externo y tu estado interno. Antes de cualquier ritual, puede ayudarte a cambiar de modo.",
        ],
        bullets: [
          "Inhalá por la nariz llevando el aire a la panza.",
          "Sostené un instante.",
          "Exhalá más lento de lo que inhalaste.",
          "Esperá un segundo antes de volver a tomar aire.",
        ],
      },
      {
        title: "4. Según cómo llegás",
        bullets: [
          "Si llegás ansiosa: inhalá 4 tiempos y exhalá 8.",
          "Si llegás apagada: inhalá 6 tiempos y exhalá 4.",
          "Si llegás en calma: tres respiraciones conscientes alcanzan.",
        ],
      },
      {
        title: "5. Preparar el espacio",
        paragraphs: [
          "El espacio no es neutro. Antes de empezar, el entorno ya le está diciendo algo a tu cuerpo.",
        ],
        bullets: [
          "Elegí un lugar donde no vayas a ser interrumpida.",
          "Silenciá el teléfono.",
          "Despejá la superficie que vas a usar.",
          "Acomodá luz, temperatura y estímulos para que no te saquen del momento.",
        ],
      },
      {
        title: "6. Qué puede sostener la atmósfera",
        bullets: [
          "Luz tenue o velas para entrar en introspección.",
          "Aromas como incienso, salvia o aceites para anclar el estado.",
          "Silencio o música instrumental sin letra.",
          "Objetos con carga simbólica: cristales, plantas, cartas o elementos naturales.",
        ],
      },
      {
        title: "7. El gesto de entrada",
        paragraphs: [
          "La presencia no se compra ni se fuerza. Se invita. Tener un gesto de umbral ayuda a que el cuerpo entienda que está entrando en otro tiempo.",
        ],
        bullets: [
          "Hacer siempre las mismas tres respiraciones.",
          "Poner las manos en agua unos segundos.",
          "Tocar la vela o el objeto principal del ritual y cerrar los ojos.",
          "Repetir una frase de apertura como: “Estoy acá. Estoy presente. Estoy lista.”",
        ],
      },
      {
        title: "8. Si aparecen pensamientos",
        paragraphs: [
          "Van a aparecer. No hace falta dejar la mente en blanco para estar presente.",
        ],
        bullets: [
          "No pelearte con el pensamiento.",
          "Observarlo y dejarlo pasar.",
          "Volver al cuerpo: al peso, al aire, al contacto con la superficie.",
          "Recordar que la práctica no es no irte, sino saber volver.",
        ],
      },
      {
        title: "9. Una secuencia simple",
        bullets: [
          "Preparar el espacio: 2 o 3 minutos.",
          "Llegar al cuerpo: 1 minuto.",
          "Respirar con conciencia: 1 o 2 minutos.",
          "Hacer tu gesto de umbral: 30 segundos.",
          "Quedarte en silencio: 1 o 2 minutos.",
          "Recién entonces, empezar el ritual.",
        ],
      },
      {
        title: "Para llevarte",
        paragraphs: [
          "Prepararte no es demorar.",
          "Es crear las condiciones para que algo real pueda pasar.",
        ],
      },
    ],
  },
  {
    id: "rituales-en-grupo",
    image: "/wiki/gustavo-zambelli-sK9W1j9oR3I-unsplash.jpg",
    title: "Rituales en grupo",
    eyebrow: "Prácticas compartidas",
    summary: "Cuidado, roles y estructura para sostener bien una práctica ritual compartida.",
    body:
      "Cuando dos o más personas hacen un ritual juntas, cambia la naturaleza de la experiencia. La intención se vuelve colectiva, y con eso aparece también una responsabilidad distinta.",
    sections: [
      {
        title: "1. Por qué hacerlo en grupo",
        paragraphs: [
          "Un ritual grupal puede ser muy poderoso porque la atención y la presencia se retroalimentan. La respiración de otras personas, el silencio compartido y la intención común crean un campo distinto al de la práctica solitaria.",
        ],
        bullets: [
          "Rituales de transición, cierre o comienzo.",
          "Intenciones compartidas, como protección o abundancia grupal.",
          "Encuentros regulares que construyen constancia.",
          "Celebraciones estacionales, equinoccios o solsticios.",
        ],
      },
      {
        title: "2. Qué cambia en lo grupal",
        paragraphs: [
          "Cuando el ritual es grupal, la intención necesita ser acordada. Ya no alcanza con lo que una sola persona quiere activar.",
          "También cambia el ritmo: quien facilita sostiene la estructura y cada participante entra en un tiempo que ya no es completamente propio.",
        ],
      },
      {
        title: "3. Los roles ayudan",
        paragraphs: [
          "Nombrar roles evita que el cuidado quede flotando. No hace falta que sean muchos, pero sí que estén claros.",
        ],
        bullets: [
          "Quien facilita: guía el inicio, el desarrollo y el cierre.",
          "Quien cuida el espacio físico: música, velas, agua, temperatura, orden.",
          "Quien acompaña el campo emocional: presencia disponible si alguien necesita sostén.",
          "Participantes: no son pasivos; su atención y su presencia también construyen el ritual.",
        ],
      },
      {
        title: "4. Construir una intención compartida",
        paragraphs: [
          "La intención grupal no es la suma de intenciones individuales. Es una frase o dirección común que contiene al grupo.",
        ],
        bullets: [
          "Hacer una ronda breve antes de empezar para saber cómo llega cada persona.",
          "Nombrar una intención en plural, en presente y en positivo.",
          "Dejar espacio para que cada quien también traiga su intención personal dentro de ese marco.",
        ],
      },
      {
        title: "5. Cuidar el espacio común",
        bullets: [
          "Preparar el espacio antes de que llegue el grupo.",
          "Dejar claro que alguien puede salir si lo necesita.",
          "Volver a la respiración cuando el grupo se dispersa.",
          "No confundir sostener con controlar: el ritual necesita estructura, no rigidez.",
        ],
      },
      {
        title: "6. El cierre importa",
        paragraphs: [
          "Un ritual grupal no termina cuando se apaga la última vela. Termina cuando el grupo vuelve al espacio ordinario de manera consciente.",
        ],
        bullets: [
          "Hacer una ronda de cierre breve.",
          "Nombrar nuevamente la intención o hacer un gesto compartido de final.",
          "Dejar unos minutos sin apuro antes de irse.",
          "Ofrecer agua o algo de comer para volver al cuerpo.",
        ],
      },
      {
        title: "7. Acuerdos entre participantes",
        bullets: [
          "Presencia real durante el tiempo del ritual.",
          "Confidencialidad sobre lo compartido.",
          "Respeto por los ritmos individuales.",
          "Ninguna experiencia es “la correcta”.",
        ],
      },
      {
        title: "8. Después del ritual",
        paragraphs: [
          "Algunos rituales dejan a alguien más abierta o sensible. El cuidado no termina necesariamente cuando se cierra el círculo.",
        ],
        bullets: [
          "Dejar un canal simple para decir cómo quedó cada une.",
          "Hacer un pequeño chequeo al día siguiente si el ritual fue intenso.",
          "Dar espacio para nombrar algo que no terminó de cerrar bien.",
        ],
      },
      {
        title: "Para llevarte",
        paragraphs: [
          "Un ritual grupal no es un ritual solitario con más gente.",
          "La potencia del campo compartido es real. Y también lo es la responsabilidad de sostenerlo bien.",
        ],
      },
    ],
  },
  {
    id: "el-aquelarre",
    image: "/wiki/shane-rounce-DNkoNXQti3c-unsplash.jpg",
    title: "El aquelarre",
    eyebrow: "Historia y símbolo",
    summary: "Sentido histórico, simbólico y comunitario del encuentro ritual compartido.",
    body:
      "Aquelarre es una palabra cargada de historia. Durante siglos nombró el miedo a mujeres reunidas, conocimiento compartido y poder fuera de las instituciones. Hoy también puede leerse como memoria y recuperación.",
    sections: [
      {
        title: "1. De dónde viene la palabra",
        paragraphs: [
          "Aquelarre viene del euskera y suele traducirse como “prado del macho cabrío”. Fue el nombre que se usó durante la Inquisición para señalar supuestas reuniones nocturnas de brujas.",
          "Ese relato fue construido sobre todo por quienes perseguían. Muchas de esas reuniones probablemente eran espacios comunitarios donde circulaban prácticas, saberes y rituales previos al control eclesiástico.",
        ],
      },
      {
        title: "2. Qué se perseguía en realidad",
        paragraphs: [
          "La caza de brujas no fue un accidente aislado. Fue una forma de disciplinar cuerpos, saberes y comunidades que no dependían del Estado ni de la Iglesia.",
        ],
        bullets: [
          "El conocimiento de las hierbas, el cuerpo y los ciclos.",
          "La autonomía de parteras, curanderas y mujeres que sabían.",
          "La existencia de comunidades que se organizaban sin pedir permiso.",
          "La relación con la naturaleza, la noche y la luna como algo sospechoso para el orden dominante.",
        ],
      },
      {
        title: "3. Lo que sobrevivió",
        paragraphs: [
          "A pesar de la persecución, muchas prácticas no desaparecieron. Se transformaron, se ocultaron o se transmitieron en voces bajas entre generaciones.",
        ],
        bullets: [
          "La tradición oral de abuelas y mujeres que sabían qué planta usar, cómo cortar un mal o cómo pedirle a la luna.",
          "La reaparición de esas prácticas en el siglo XX a través de la wicca y otras formas de espiritualidad ritual.",
          "La recuperación feminista de la figura de la bruja como símbolo de autonomía y saber propio.",
        ],
      },
      {
        title: "4. Qué puede significar hoy",
        paragraphs: [
          "Hoy se usa la palabra aquelarre para nombrar encuentros muy distintos, pero hay algo común en todos: personas reunidas con intención, fuera de estructuras rígidas, sosteniendo un espacio compartido.",
        ],
        bullets: [
          "Conocimiento compartido entre iguales.",
          "Ritual sostenido por una intención colectiva.",
          "Naturaleza y ciclos como marco.",
          "Comunidad como forma y como sentido.",
        ],
      },
      {
        title: "5. Lo que no es",
        bullets: [
          "No es solo una estética de velas negras y capas.",
          "No es necesariamente wicca.",
          "No depende del nombre que use el grupo, sino de la intención, la presencia y el cuidado del espacio común.",
        ],
      },
      {
        title: "6. La noche, la luna y el fuego",
        paragraphs: [
          "Las descripciones del aquelarre suelen ubicarlo de noche, y eso no es casual. La noche es territorio de transición, símbolo, sueño e intimidad.",
          "La luna organiza el tiempo ritual y el fuego ocupa el centro porque orienta la atención compartida. Mirar el mismo fuego también regula al grupo.",
        ],
      },
      {
        title: "7. Para qué sirve saber esto",
        paragraphs: [
          "No hace falta identificarse con la brujería para que esta historia diga algo valioso hoy.",
          "El aquelarre sigue planteando una pregunta muy actual: cómo nos reunimos para sostener lo importante fuera de estructuras que no siempre nos contienen.",
        ],
      },
      {
        title: "Para llevarte",
        paragraphs: [
          "El aquelarre fue perseguido por la fuerza de la comunidad, del conocimiento compartido y del espacio común cuidado entre personas.",
          "Eso que se quiso desarmar es, justamente, lo que muchas prácticas rituales buscan volver a crear.",
        ],
      },
    ],
  },
  {
    id: "las-lunas-y-su-energia",
    image: "/wiki/siim-lukka-K6rjbT5P6wE-unsplash.jpg",
    title: "Las lunas y su energía",
    eyebrow: "Ciclos lunares",
    summary: "Cómo cada fase lunar puede acompañar distintos ritmos, intenciones y tipos de ritual.",
    body:
      "La luna no decide tu semana, pero sí puede funcionar como espejo de ciclo. Usarla bien no es creer que hace algo por vos, sino dejar que te ayude a ordenar cuándo iniciar, sostener, reconocer o soltar.",
    sections: [
      {
        title: "El ciclo completo",
        paragraphs: [
          "La luna completa un ciclo en unos 29.5 días. Durante ese recorrido pasa por ocho fases reconocibles, cada una con una cualidad distinta.",
          "No hace falta hacer algo en cada fase. El ciclo es una guía, no una obligación.",
        ],
      },
      {
        title: "1. Luna nueva",
        paragraphs: [
          "Es el inicio del ciclo. El momento más oscuro, quieto y cargado de potencial.",
        ],
        bullets: [
          "Energía: introspectiva, silenciosa, de semilla.",
          "Favorece: nuevos comienzos, preguntas, proyectos en estado cero.",
          "Ritual sugerido: escribir la intención y sembrarla simbólicamente.",
          "Conviene evitar: pedir resultados inmediatos.",
        ],
      },
      {
        title: "2. Creciente fina",
        paragraphs: [
          "La intención empieza a moverse. Es momento de dar los primeros pasos.",
        ],
        bullets: [
          "Energía: activa, ascendente, orientada.",
          "Favorece: impulso, primeras acciones, decisión práctica.",
          "Ritual sugerido: movimiento corporal y revisión de la intención.",
        ],
      },
      {
        title: "3. Cuarto creciente",
        paragraphs: [
          "Aparece la primera prueba real del ciclo: decidir si seguís, ajustás o reforzás el rumbo.",
        ],
        bullets: [
          "Energía: compromiso, ajuste, determinación.",
          "Favorece: superar bloqueos y sostener lo que ya empezó.",
          "Ritual sugerido: mirar resistencias y elegir cómo seguir.",
        ],
      },
      {
        title: "4. Cuarto creciente",
        paragraphs: [
          "La energía sigue creciendo y pide afinación. Es tiempo de pulir.",
        ],
        bullets: [
          "Energía: refinamiento, anticipación, gratitud.",
          "Favorece: ajustes finales antes del momento culminante.",
          "Ritual sugerido: agradecer lo que ya se movió y preparar la llena.",
        ],
      },
      {
        title: "5. Luna llena",
        paragraphs: [
          "Es el punto de mayor visibilidad e intensidad del ciclo.",
        ],
        bullets: [
          "Energía: amplificada, reveladora, celebratoria.",
          "Favorece: reconocer logros, agradecer, ver con claridad.",
          "Ritual sugerido: fuego, agua de luna, celebración o práctica compartida.",
          "Conviene evitar: iniciar algo completamente nuevo.",
        ],
      },
      {
        title: "6. Cuarto menguante",
        paragraphs: [
          "Después del pico, empieza la integración. Es momento de asimilar.",
        ],
        bullets: [
          "Energía: reflexiva, integradora, comunicativa.",
          "Favorece: procesar, escribir, compartir lo aprendido.",
          "Ritual sugerido: journaling, conversación o lectura del propio ciclo.",
        ],
      },
      {
        title: "7. Cuarto menguante",
        paragraphs: [
          "Es el momento natural para limpiar y soltar.",
        ],
        bullets: [
          "Energía: liberadora, decreciente, depurativa.",
          "Favorece: cierres, limpiezas, corte de patrones o hábitos.",
          "Ritual sugerido: limpieza del espacio, escritura y liberación simbólica.",
        ],
      },
      {
        title: "8. Luna bálsámica",
        paragraphs: [
          "Los últimos días antes de la luna nueva. El momento más silencioso del ciclo.",
        ],
        bullets: [
          "Energía: quieta, liminal, profunda.",
          "Favorece: descanso, retiro, incubación y escucha interna.",
          "Ritual sugerido: baño ritual, meditación o simplemente no hacer.",
          "Conviene evitar: exigencia y productividad forzada.",
        ],
      },
      {
        title: "Un ritmo mínimo que funciona",
        bullets: [
          "Luna nueva: escribir una intención.",
          "Luna llena: reconocer qué se movió y agradecer.",
          "Cuarto menguante: cerrar, limpiar y soltar.",
        ],
      },
      {
        title: "Correspondencias rápidas",
        bullets: [
          "Luna nueva: negro, blanco, plateado profundo.",
          "Creciente: verde, naranja, dorado claro.",
          "Llena: blanco brillante, dorado, plateado, amarillo.",
          "Menguante: azul, violeta, gris.",
          "Bálsámica: negro, azul marino, plateado oscuro.",
        ],
      },
      {
        title: "Para llevarte",
        paragraphs: [
          "La luna no te dice qué hacer. Te muestra en qué parte del ciclo estás.",
          "No todo crece en cualquier estación. A veces el gesto más sabio es sembrar. Otras, esperar. Otras, soltar.",
        ],
      },
    ],
  },
];

export function getWikiNoteById(id: string) {
  return WIKI_NOTES.find((note) => note.id === id) || null;
}

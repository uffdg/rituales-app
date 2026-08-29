# Feedback Log

Registro vivo de feedback de usuarios, mentores y testers — se suma acá cada vez que llega algo nuevo, en vez de perderse en chats sueltos. Mismo formato de tabla de insights que las entrevistas en profundidad (ver `guidelines/` y la carpeta de investigación del TFG).

---

## Entrada 2026-08-29 — Usuario vía LinkedIn

**Contexto**: mensaje espontáneo por LinkedIn de un usuario que probó la app por su cuenta (no es parte del guión formal de entrevistas). Compartió screenshot del paso 5 del wizard de creación (no capturado en este log — pedir que lo reenvíe si hace falta referenciarlo). Se ofreció a conversar sobre GTM o Producto — evaluar si conviene sumarlo como entrevista formal (cuenta para la saturación de 5–8 entrevistas que pide el guión de investigación).

**Contacto**: WhatsApp +54 9 11 5887-8559 (compartido voluntariamente por el usuario para seguimiento — dato personal, no republicar fuera de este repo privado).

### Bugs / técnico

- [ ] El mail de registro (OTP de Supabase Auth) cae en spam — revisar configuración de dominio/SMTP.

### Insights

| # | Insight | Evidencia (cita textual) | Implicación para el producto | Prioridad |
|---|---|---|---|---|
| 1 | El frame "holístico" (colores de vela, vínculo con elementos) puede espantar audiencias no afines — se percibe como pseudociencia | "no me copó lo de colores de las velas o vincularlo tanto con los elementos... trataría de cuidar esas cosas más de pseudo ciencia para hacerlo más inclusivo" | **Segunda validación independiente** de la tensión ya detectada en la investigación ("Resistencia al frame autoayuda" — ver `RitualesAI_Investigacion.docx`). Propone resolverlo en onboarding: preguntas simples que personalicen el framing (versión mística vs. secular/racional del mismo contenido) en vez de un tono único para todos. | Alta |
| 2 | Falta instrumentación de completitud del ritual (¿lo miró o lo hizo de verdad?) | "Me hubiese gustado tener alguna herramienta -cómo PM- para saber si un usuario entró a chusmear un ritual o si lo hizo realmente" | Agregar: (a) vista resumen del ritual antes de arrancar, (b) botón "Empezar ritual" que dispare un flujo paso a paso medible, (c) evento de analytics que distinga "vio" de "completó". Encaja directo con `analytics.ts`, que ya trackea eventos pero no completitud del flujo guiado. | Alta |
| 3 | Cierre del ritual sin captura de resultado/reflexión | Propone terminar con "una foto o retroalimentación escrita/voicenote/encuesta" | Cross-valida con el insight #08 de la entrevista a Ginny (métricas emocionales en el tiempo, "Health del celular pero de inteligencia emocional"). Candidato a extensión del Diario de Anclas. | Media |
| 4 | El paso 5 ("crear tu ritual" / anclaje) es lo más valorado de la app | "Si me encantó el paso 5 de crear tu ritual" | Segunda validación independiente (después del insight #02 de Ginny) de que el anclaje es el diferencial más fuerte. Reforzar su visibilidad, no diluirlo en próximos cambios de UI. | Confirma prioridad ya alta |
| 5 | El contenido del ritual (textos) es percibido como demasiado largo | "los encontré demasiado largos" | Revisar longitud de guiones — ver `guidelines/RITUAL_SCRIPTS.md`. | Alta |
| 6 | Frase "No necesitás hacerlo perfecto. Necesitás hacerlo consciente y real." resuena como estructural para el producto | Cita textual, el usuario la marca espontáneamente como el corazón de la propuesta | Candidata a frase ancla de `VOICE.md`. El usuario también sugiere sacar el "recurso" que la hace real de un único user persona y llevarlo a "algo más horizontal" — **punto ambiguo, repreguntar a Mariana antes de actuar** (ver nota abajo). | Por confirmar |

### Pendiente de aclarar con Mariana

- Punto #6: ¿a qué se refiere exactamente con sacarlo del "user persona Marian" y llevarlo a "algo más horizontal"? ¿Es sobre el tono de copy atado a una persona específica, o sobre no diseñar el contenido pensando en un solo arquetipo de usuario?
- Conseguir el screenshot del paso 5 que mencionó, si aporta contexto visual al insight #4.

---

## Entrada 2026-04-02 — Raúl Villoslada, vía LinkedIn

**Contexto**: Raúl había respondido una encuesta previa y pidió el link para probar la app tras un posteo de Mariana. Probó la app un feriado y mandó feedback "en vivo" apenas terminó — texto largo y detallado, con background propio en diseño de servicios (workshop de Service Blueprint en UADE). Se ofreció a colaborar más adelante. **Nota importante**: dos de sus frases ("es una app a la que seguro voy a volver" y la comparación de valor con pedirle un ritual directo a ChatGPT) ya estaban citadas de forma anónima como "feedback cualitativo espontáneo" en `RitualesAI_Doc3_Oportunidad.docx` (sección 1.3) — esta entrada es la fuente completa y con nombre detrás de esa cita.

### Insights

| # | Insight | Evidencia (cita textual) | Implicación para el producto | Prioridad |
|---|---|---|---|---|
| 7 | El botón flotante "?" en Home confunde — lo esperaba como ayuda/onboarding, lo lleva a registro/perfil | "Pensé que me servía para ingresar a una sección de ayuda, y lo toqué inicialmente buscando un onboarding" | Revisar el ícono o el destino del botón "?" en Home — el signo de pregunta comunica "ayuda", no "cuenta". | Alta |
| 8 | La tipografía serif del copy es demasiado liviana (light), cuesta leer | "me pareció demasiado 'light'... tuve que hacer un esfuerzo extra con la vista" | Evaluar subir el peso de la fuente serif en `theme.css` para bloques largos de copy. | Media |
| 9 | Tocar un tag dentro de un ritual (ej. "Agua") no filtra rituales sugeridos ahí, aunque sí funciona desde Explorar | "hubiera esperado que se desplegaran rituales sugeridos bajo ese tag... desde 'Explorar' veo que eso sí se puede hacer y funciona perfecto" | Inconsistencia de comportamiento entre pantallas — el usuario espera que un tag sea clickeable/filtrable en cualquier contexto donde aparece, no solo en Explorar. | Media |
| 10 | Percibió la app "hablándole en femenino" al principio; luego entendió que es porque los rituales compartidos por otras personas conservan la redacción de quien los creó, mientras que la IA genera en neutro para rituales propios | "me di cuenta de que en realidad muchos de los rituales son compartidos por otras personas... En el ritual que generé yo, la IA lo escribió de manera neutra" | No es un bug — es contenido comunitario con voz propia de cada autor. Vale la pena decidir explícitamente si eso es deseable (autenticidad comunitaria) o si conviene neutralizar también el copy compartido; no cambiar sin decidirlo a propósito. | Baja (decisión de producto, no bug) |
| 11 | Posicionamiento entre Co-Star (muy abstracto/astrológico) y Calm (muy clínico), con componente espiritual + acción concreta real al final — percibido como diferencial fuerte | "no la encuentro ni tan 'abstracta' y astrológica como Co-Star ni tan 'clínica' como Calm... me parece interesante que me inviten a salir de la app para tomar esa acción real" | **Tercera validación independiente** (después del análisis de competencia en `RitualesAI_Doc3_Oportunidad.docx` y de la entrevista a Ginny) de que el cuadrante "alta personalización + práctica ritual accionable" es el diferencial real. Reforzar el cierre accionable de cada ritual en la comunicación. | Confirma prioridad ya alta |
| 12 | La generación de ritual interpretó bien la intención con pocas palabras, y educó al usuario sobre elementos/velas sin conocimiento previo | "con pocas palabras la IA interpretó correctamente la intención... No conocía prácticamente nada de elementos y velas y la app me pudo educar bien" | El wizard de creación y el copy educativo están funcionando como está diseñado — no tocar sin necesidad. | — (confirma que funciona) |
| 13 | La Wiki (notas y consejos) es muy valorada pero tiene baja discoverability — la encontró recién al final de explorar toda la app | "me pareció muy importante la wiki... pero la encontré recién después de haber navegado todo el resto de la app" | Evaluar exponer la Wiki más temprano en el recorrido (ej. desde onboarding o desde el resumen del ritual), no solo en el tab de navegación inferior. | Alta |
| 14 | Interés espontáneo en un aspecto comunitario/social — inspirarse en rituales de otras personas | "Veo muy interesante todo el aspecto comunitario para poder inspirarse en algo tan personal como un ritual" | Señal de demanda para una futura feature social/comunitaria — no es un pedido urgente, pero vale registrarlo como dirección de producto a mediano plazo. | Baja / a futuro |

### Notas adicionales

- Raúl tiene background en Service Blueprint (workshop UADE con Mariana como facilitadora) — buen candidato a entrevista formal en profundidad o incluso a colaborador de service design si se retoma su oferta de ayudar.
- No compartió teléfono, solo contacto por LinkedIn.

---

## Entrada (fecha a confirmar) — Sesión moderada en persona, think-aloud

**Contexto**: sesión presencial de testeo con think-aloud (Mariana moderando, "andá contándome qué ves"), grabada y transcripta automáticamente (hay errores de transcripción — leer con margen de error). Ocurrió en el marco de una reunión social ("gracias por venir el sábado"), con una persona conocida que ya conocía el concepto por conversaciones previas. **Esta sesión cuenta como entrevista formal moderada** — suma a la saturación de entrevistas en profundidad que pide el guión de investigación (segunda sesión moderada además de Ginny). Falta confirmar la fecha exacta para el registro.

Al cierre, la entrevistada ofreció mandar fotos de un libro físico de rituales/esoterismo que usa como referencia — pendiente de recibir, útil como referencia de layout de contenido (ver insight #19).

### Insights

| # | Insight | Evidencia (cita textual, transcripción con posibles errores) | Implicación para el producto | Prioridad |
|---|---|---|---|---|
| 15 | El código de acceso (OTP) no llegó durante la sesión en vivo — reproducido en tiempo real | "No sé qué te está mandando porque no manda código... me di cuenta que está fallando eso de vuelta" | **Confirma en vivo, con una fuente totalmente independiente, el mismo bug ya logueado** (mail de OTP cayendo en spam / no llegando). Ya no es un caso aislado — subir prioridad a bloqueante. | Alta (bloqueante) |
| 16 | La usuaria no revisa su email — lo usa solo para "vaciar" notificaciones, reenvía lo importante a otra bandeja | "no miro los mails... los abro solo para que no me queden almacenados" | El login por OTP a email puede no ser el canal correcto para buena parte del segmento. Evaluar alternativa (magic link que abra directo, SMS/WhatsApp, o reducir fricción del paso de login). | Alta |
| 17 | El texto de reencuadre de intención sale genérico y no resuena — no se sintió entendida | Tipeó algo como "día muy agotado" y recibió: "Energía renovada y el descanso profundo que necesitas fluye naturalmente hacia vos..." — reacción: "No lo entiendo. Lo que esperaba... es como que leo esto y no me dice nada" | **Evidencia real, negativa, sobre la hipótesis central sin validar** que ya estaba marcada en `RitualesAI_Investigacion.docx` ("¿la frase reencuadra de verdad o se siente genérica?"). La usuaria esperaba algo concreto y accionable ("tomate un tecito, salí afuera, respirá"), no una frase poética abstracta. Revisar el prompt de reencuadre — es el corazón de la propuesta de valor y en este caso falló. | **Alta — crítico** |
| 18 | El "diario de intenciones" / mecánica de intención diaria no se entiende sin explicación | Mariana (moderando) lo aclara en la propia sesión: "eso que no se entendía al principio es para generar una intención diaria... pero claramente no se está entendiendo" | Confirmación directa (de la propia fundadora, en vivo) de un gap de onboarding/explicación sobre esta feature específica. | Alta |
| 19 | El formato del contenido del ritual se percibe fragmentado ("consejos aislados... separaditos") en vez de una estructura tipo receta (pasos + materiales a la vista) | "esperaría más como una receta... primero lees el ritual y después lo que necesitás, y acá aparecen como consejos aislados" — compara con un libro físico de rituales que usa, donde el ritual y los materiales necesarios aparecen juntos, "de costadito" | Rediseñar el layout de contenido del ritual al modelo "receta": pasos principales + lista de materiales visible en simultáneo, no fragmentado en tarjetas separadas. | Alta |
| 20 | Preferencia fuerte por formato físico/papel para seguir el ritual en el momento — perder el lugar haciendo scroll en el celular genera olvidos | Comparación extensa con recetas de cocina y tablaturas de guitarra: "cuando lleguo al final digo 'ah, me olvidé esto'... con un libro podés recorrerlo con el dedo como índice y saltar de un lado al otro, no scroleando y volviendo" | No implica literalmente imprimir, pero sí resolver la navegación durante el ritual en vivo: un índice/overview persistente que permita saltar entre pasos con el dedo en vez de scroll lineal ida y vuelta. Namearlo como problema de navegación-en-uso, no de formato papel vs. digital. | Media-Alta |
| 21 | Hay tarjetas de "sugerencia" que pasan desapercibidas | "Ah, no había leído la sugerencia" (dicho tarde en la sesión, cuando ya llevaba rato explorando) | Otro caso de contenido valioso con baja visibilidad — mismo patrón que la Wiki en el feedback de Raúl (#13). Revisar jerarquía visual de tarjetas de sugerencia/tips. | Media |
| 22 | Confusión sobre cuándo termina realmente el ritual | "Pensé que ya había terminado de armar el ritual y todavía no lo terminé" | **Tercera validación independiente** del gap de completitud/estado del ritual (ya logueado como insight #2 del usuario anónimo de LinkedIn). Refuerza que instrumentar y comunicar claramente el estado ("armando" vs. "completado") es prioritario, no un detalle menor. | Alta (confirma prioridad ya alta) |
| 23 | El audio/música del ritual guiado no suena, aunque la UI indica que inició | "no escucho música, no me suena nada... ya inició... debería aparecer la campanita, pero no se escucha" — Mariana responde en la sesión: "eso ya está identificado, entiendo que no se entienda" | Bug de audio ya conocido por el equipo, reproducido en vivo frente a una usuaria real — confirma que sigue sin resolverse al momento de esta sesión. | Alta (bloqueante conocido) |
| 24 | Familiaridad previa con apps de fase lunar que dan recomendaciones concretas de "qué hacer / qué no hacer" según la fase | Describe una app de ciclo lunar que dejó de usar por exceso de publicidad, que le decía cosas como "cuarto menguante → cortate el pelo, iniciá proyectos" — genérico pero memorizable con el uso | Contexto competitivo directo (categoría de apps de fase lunar) — el formato "qué hacer / qué no hacer" concreto por fase es lo que el segmento ya conoce y espera; compararlo contra cómo Rituales presenta hoy el calendario cósmico. | Baja / contexto |
| 25 | El flujo de exploración libre (sin tarea puntual) "ayudó a ordenar" a la usuaria | "está bueno porque como que me ayudó a ordenarlo" | Señal cualitativa positiva sobre el valor percibido incluso cuando hay fricción técnica en el camino — la propuesta de fondo sostiene el interés a pesar de los bugs. | — (confirma valor de fondo) |

### Pendiente

- Confirmar fecha exacta de esta sesión para el registro.
- Pedir/recibir las fotos del libro físico de rituales que ofreció mandar (referencia de layout — ver insight #19).
- Revisar la transcripción original si hace falta precisión en alguna cita — está hecha por reconocimiento automático de voz y tiene errores.

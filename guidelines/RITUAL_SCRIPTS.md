# Rituales · Arquitectura de Scripts de Ritual Guiado

`guidelines/RITUAL_SCRIPTS.md`

Este documento define la estructura, los bloques, los tiempos y las marcas SSML
para construir rituales guiados de 1, 5, 10 y 20 minutos.
Es el sistema que permite al módulo de guía generar audio coherente, con ritmo real,
sin consumir tokens innecesarios ni producir un texto que suena a lectura.

---

## Principios de escritura para voz

Antes de ver la estructura, estas son las reglas que hacen que un texto suene hablado
y no leído.

**Frases cortas.** Máximo 12 palabras por frase. Si necesitás más, cortá.
**Puntos solos.** Un punto es una pausa corta. Dos puntos son una pausa media. Tres puntos son una pausa larga.
**Sin subordinadas largas.** Nada de "que", "aunque", "sin embargo" en el medio de una frase de audio.
**Imperativo directo.** "Respirá." no "Te invito a respirar."
**Repetición intencional.** Repetir una palabra o frase es ritmo, no error.
**Sin adjetivos acumulados.** Un adjetivo por objeto. Máximo.
**Preguntas cortas.** "¿Qué sentís?" no "¿Qué es lo que estás sintiendo en este momento?"

---

## Sistema de marcas SSML

Estas marcas van en el texto que se envía a ElevenLabs.
Se procesan como instrucciones de prosodia, no se leen en voz alta.

```
[PAUSA_MICRO]   = 0.5 segundos  → entre frases dentro de un bloque
[PAUSA_CORTA]   = 1.5 segundos  → entre ideas dentro de una sección
[PAUSA_MEDIA]   = 3 segundos    → entre secciones
[PAUSA_LARGA]   = 6 segundos    → momentos de silencio activo
[PAUSA_EXTRA]   = 10 segundos   → silencio de práctica (solo en 10' y 20')
[LENTO]         = baja velocidad de lectura en el fragmento siguiente
[NORMAL]        = vuelve a velocidad base
[SUAVE]         = baja volumen levemente
```

En el prompt a ElevenLabs, estas marcas se convierten a SSML real:
```xml
[PAUSA_CORTA] → <break time="1.5s"/>
[LENTO]       → <prosody rate="slow">
[NORMAL]      → </prosody>
```

---

## Bloques reutilizables

Hay bloques que son iguales en todos los rituales.
Se generan una vez, se guardan, y se reutilizan.
**Solo el núcleo se genera cada vez.**
Esto reduce el consumo de tokens a la mitad o más.

### INTRO UNIVERSAL (≈ 25 segundos)

```
Frená. [PAUSA_CORTA]
Hacé una pausa. [PAUSA_CORTA]
Donde estés está bien. [PAUSA_MEDIA]
[LENTO]
Cerrá los ojos si podés. [PAUSA_CORTA]
O bajá la mirada. [PAUSA_CORTA]
[NORMAL]
Este momento es tuyo. [PAUSA_MEDIA]
```

**Tokens estimados:** ~40
**Tiempo audio:** 25–30 segundos

---

### APERTURA DE CUERPO (≈ 35 segundos)

Versión base. Se adapta levemente por elemento.

```
[LENTO]
Sentí tus apoyos. [PAUSA_CORTA]
El peso de tu cuerpo. [PAUSA_CORTA]
Dónde tocás la silla, el piso, la cama. [PAUSA_MEDIA]
Respirá normal. [PAUSA_CORTA]
No hay una manera correcta de respirar ahora. [PAUSA_CORTA]
Solo notá cómo entra y cómo sale. [PAUSA_LARGA]
[NORMAL]
```

**Tokens estimados:** ~55
**Tiempo audio:** 30–40 segundos

---

### CIERRE UNIVERSAL (≈ 30 segundos)

```
[LENTO]
De a poco, volvé. [PAUSA_CORTA]
Mové los dedos. [PAUSA_CORTA]
Respirá un poco más profundo. [PAUSA_MEDIA]
Llevate lo que encontraste. [PAUSA_CORTA]
No hace falta que lo entiendas ahora. [PAUSA_MEDIA]
[NORMAL]
Cuando quieras, abrí los ojos.
```

**Tokens estimados:** ~50
**Tiempo audio:** 25–35 segundos

---

## Arquitectura por duración

### RITUAL DE 1 MINUTO

**Para:** momento de transición inmediato. Antes de una reunión, al salir de casa,
al lavarse las manos. Cero fricción. Sin intención elaborada.

**Estructura:**
```
INTRO UNIVERSAL (25s)
+ NÚCLEO MICRO (20s)
+ FRASE DE CIERRE (10s)
= ~55 segundos
```

**Núcleo micro — template:**
```
[LENTO]
Una sola cosa. [PAUSA_CORTA]
{{INTENCION_CORTA}} [PAUSA_MEDIA]
Eso es todo lo que necesitás ahora. [PAUSA_CORTA]
[NORMAL]
```

**Frase de cierre micro:**
```
Listo. Seguí.
```

**Variables:** `{{INTENCION_CORTA}}` — máximo 8 palabras. Ej: "Hoy estoy presente en lo que importa."
**Tokens núcleo:** ~30
**Tokens totales (con bloques reutilizables):** ~120
**Acciones del usuario:** ninguna. Solo escuchar.

---

### RITUAL DE 5 MINUTOS

**Para:** práctica corta con intención. Mañana, pausa del mediodía, antes de dormir.
Tiene una acción simple del usuario pero breve.

**Estructura:**
```
INTRO UNIVERSAL       (25s)
APERTURA DE CUERPO    (35s)
NÚCLEO PERSONALIZADO  (2:30min)
CIERRE UNIVERSAL      (30s)
= ~3:30 min de audio + 1:30 min de práctica silenciosa
```

**Núcleo 5 minutos — template:**
```
[LENTO]
Traés algo hoy. [PAUSA_CORTA]
No hace falta nombrarlo bien. [PAUSA_CORTA]
Solo sentilo. [PAUSA_LARGA]

{{ECO_EMOCIONAL}} [PAUSA_MEDIA]

{{INTENCION_REENCUADRADA}} [PAUSA_LARGA]

Repetila internamente. [PAUSA_CORTA]
Una vez. [PAUSA_EXTRA]

Guardala. [PAUSA_CORTA]
Es tuya. [PAUSA_MEDIA]
[NORMAL]
```

**Variables:**
- `{{ECO_EMOCIONAL}}` — frase que refleja lo que trajo el usuario. Máx 10 palabras.
- `{{INTENCION_REENCUADRADA}}` — la intención generada. Máx 12 palabras.

**Acción del usuario:** repetir la intención internamente durante `[PAUSA_EXTRA]`.
**Tokens núcleo:** ~80
**Tokens totales:** ~185
**Segmentos generados dinámicamente:** solo el núcleo.

---

### RITUAL DE 10 MINUTOS

**Para:** práctica completa. Tiene elemento natural, pregunta, acción física opcional.

**Estructura:**
```
INTRO UNIVERSAL           (25s)
APERTURA DE CUERPO        (35s)
DESCENSO CON ELEMENTO     (1:30min)
NÚCLEO PERSONALIZADO      (4:00min)
RETORNO                   (1:30min)
CIERRE UNIVERSAL          (30s)
= ~8:30 min de audio + pausas activas
```

**Descenso con elemento — templates por elemento:**

*Agua:*
```
[LENTO]
El agua no apura. [PAUSA_CORTA]
Aclara cuando la dejás quieta. [PAUSA_MEDIA]
Tus pensamientos también. [PAUSA_LARGA]
Dejá que se asienten. [PAUSA_EXTRA]
[NORMAL]
```

*Tierra:*
```
[LENTO]
La tierra sostiene sin preguntar. [PAUSA_CORTA]
Sentí el piso bajo tus pies. [PAUSA_MEDIA]
Ese sostén es real. [PAUSA_LARGA]
Quedáte ahí un momento. [PAUSA_EXTRA]
[NORMAL]
```

*Fuego:*
```
[LENTO]
El fuego elige una dirección. [PAUSA_CORTA]
Solo una. [PAUSA_MEDIA]
¿Hacia dónde va tu energía hoy? [PAUSA_LARGA]
Solo notalo. Sin juzgar. [PAUSA_EXTRA]
[NORMAL]
```

*Aire:*
```
[LENTO]
El aire no retiene. [PAUSA_CORTA]
Pasa. [PAUSA_MEDIA]
Exhalá largo. [PAUSA_CORTA]
Que se vaya lo que ya no. [PAUSA_EXTRA]
[NORMAL]
```

**Núcleo 10 minutos — template:**
```
[LENTO]
{{ECO_EMOCIONAL}} [PAUSA_MEDIA]

Hay algo que querés ver diferente. [PAUSA_CORTA]
{{PREGUNTA_RITUAL}} [PAUSA_LARGA]

No busques la respuesta. [PAUSA_CORTA]
Dejá que aparezca. [PAUSA_EXTRA]

{{INTENCION_REENCUADRADA}} [PAUSA_MEDIA]

Sentila en el cuerpo. [PAUSA_CORTA]
¿Dónde la sentís? [PAUSA_LARGA]

Quedáte ahí. [PAUSA_EXTRA]
[NORMAL]
```

**Variables:**
- `{{ECO_EMOCIONAL}}` — reflejo de lo que trajo. Máx 10 palabras.
- `{{PREGUNTA_RITUAL}}` — pregunta que abre. Máx 8 palabras. Ej: "¿Qué ves si te quedás quieto?"
- `{{INTENCION_REENCUADRADA}}` — la intención. Máx 12 palabras.

**Retorno:**
```
[LENTO]
De a poco, volvé a la respiración. [PAUSA_CORTA]
Al peso del cuerpo. [PAUSA_MEDIA]
Llevate la intención. [PAUSA_CORTA]
No como tarea. Como semilla. [PAUSA_MEDIA]
[NORMAL]
```

**Tokens por segmento:**
- Descenso con elemento: ~60
- Núcleo: ~100
- Retorno: ~40
- **Total dinámico:** ~200 tokens
- **Total con reutilizables:** ~345 tokens

---

### RITUAL DE 20 MINUTOS

**Para:** práctica profunda. Sesión completa. Tiene acción física, escritura o movimiento.

**Estructura:**
```
INTRO UNIVERSAL           (25s)
APERTURA DE CUERPO        (35s)
DESCENSO EXTENDIDO        (3:00min)
NÚCLEO EXTENDIDO          (10:00min)
INTEGRACIÓN               (3:00min)
RETORNO                   (2:00min)
CIERRE UNIVERSAL          (30s)
= ~19:30 min
```

**Descenso extendido:**
Toma la versión corta del elemento + agrega escaneo de cuerpo completo.

**Escaneo de cuerpo (1:30 min adicional):**
```
[LENTO]
Llevá la atención a la cabeza. [PAUSA_CORTA]
Sin juzgar lo que encontrás. [PAUSA_MEDIA]
Bajá a los hombros. [PAUSA_CORTA]
Al pecho. [PAUSA_CORTA]
A la panza. [PAUSA_MEDIA]
¿Dónde hay tensión? [PAUSA_CORTA]
¿Dónde hay espacio? [PAUSA_LARGA]
Seguí bajando. [PAUSA_CORTA]
Las piernas. Los pies. [PAUSA_EXTRA]
[NORMAL]
```

**Núcleo extendido:**
Agrega al núcleo de 10 minutos una sección de acción:

```
[LENTO]
Ahora una sola acción. [PAUSA_CORTA]
{{ACCION_RITUAL}} [PAUSA_MEDIA]
Hacela despacio. [PAUSA_CORTA]
Con toda la atención. [PAUSA_EXTRA]

Volvé. [PAUSA_CORTA]
¿Algo cambió? [PAUSA_LARGA]
No hace falta que lo nombres. [PAUSA_EXTRA]
[NORMAL]
```

**Variable `{{ACCION_RITUAL}}`:**
Tiene que ser simple, inmediata, sin materiales. Ejemplos:
- "Poné una mano en el pecho."
- "Respirá tres veces más lento de lo normal."
- "Escribí una palabra. La primera que venga."
- "Cerrá los puños. Apretá. Soltá."

**Integración (3 min):**
```
[LENTO]
Quedáte un momento en lo que encontraste. [PAUSA_EXTRA]

No lo proceses todavía. [PAUSA_CORTA]
Solo dejalo estar. [PAUSA_EXTRA]

{{INTENCION_REENCUADRADA}} [PAUSA_MEDIA]

Esa es tu ancla para hoy. [PAUSA_EXTRA]
[NORMAL]
```

**Tokens por segmento:**
- Escaneo: ~70
- Núcleo extendido: ~150
- Integración: ~60
- **Total dinámico:** ~280 tokens
- **Total con reutilizables:** ~455 tokens

---

## Tabla de referencia rápida

| Duración | Tokens dinámicos | Tokens totales | Acciones usuario | Bloques dinámicos |
|----------|-----------------|----------------|------------------|-------------------|
| 1 min    | ~30             | ~120           | Ninguna          | Núcleo micro      |
| 5 min    | ~80             | ~185           | Repetir intención| Núcleo            |
| 10 min   | ~200            | ~345           | Sostener atención| Descenso + Núcleo |
| 20 min   | ~280            | ~455           | Acción física    | Descenso + Núcleo + Integración |

---

## Reglas de las acciones del usuario

Las acciones del usuario dentro del ritual tienen que cumplir estas condiciones:

**Inmediatas** — se pueden hacer ahora, donde están, sin preparación.
**Sin materiales** — no requieren nada externo salvo el cuerpo.
**Cortas** — máximo 30 segundos de ejecución.
**Opcionales en 1 y 5 min** — en rituales cortos no hay acciones obligatorias.
**Una sola por ritual** — nunca dos acciones en el mismo ritual.

Lista de acciones válidas por elemento:

*Agua:* mirar un punto fijo sin parpadear 10 segundos. Tomar un sorbo de agua despacio.
*Tierra:* apoyar ambas palmas en una superficie. Sentir el peso del cuerpo completo.
*Fuego:* hacer un puño, apretarlo, soltarlo. Respirar por la nariz contando hasta 4.
*Aire:* exhalar por la boca en 8 tiempos. Sacudir suavemente manos y hombros.

---

## Flujo de generación

```
1. Usuario input (voz o texto)
        ↓
2. Prompt 0 — Detección de estado emocional + elemento
        ↓
3. Prompt 1 — Generación de variables:
   eco_emocional / pregunta_ritual / intencion_reencuadrada / accion_ritual
        ↓
4. Selección de duración (1 / 5 / 10 / 20 min)
        ↓
5. Ensamblado del script:
   bloques_reutilizables + template_duración.fill(variables)
        ↓
6. Envío a ElevenLabs por segmentos:
   — intro_universal (cacheado)
   — apertura_cuerpo (cacheado)
   — descenso_elemento (cacheado por elemento)
   — nucleo (generado dinámicamente)
   — cierre_universal (cacheado)
        ↓
7. Concatenación con crossfade de 150ms entre segmentos
        ↓
8. Reproducción
```

**Optimización de costo:**
Los segmentos cacheados (intro, apertura, cierre, descensos por elemento = 4 variantes)
se generan una vez y se reutilizan.
Solo el núcleo y la integración (en 20 min) se generan por sesión.
Esto reduce el costo de ElevenLabs en aproximadamente 70%.

---

## Próximos pasos técnicos

- [ ] Implementar sistema de caché de segmentos por elemento
- [ ] Construir función de ensamblado de script por duración
- [ ] Testear crossfade entre segmentos en reproducción
- [ ] Calibrar velocidad base de la voz elegida para que 1 min = 60 segundos reales
- [ ] Resolver reproducción en background cuando la app está minimizada
- [ ] Agregar selector de duración en el flujo de creación de ritual

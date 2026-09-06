"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useInView } from "framer-motion";
import { Compass, Radar, Wand2, ShieldCheck, Send, MessageCircle, BarChart3, type LucideIcon } from "lucide-react";

/**
 * Los siete agentes como un equipo al que se le puede preguntar, en vez de
 * una cuadrícula de tarjetas que se lee en diagonal. Cada uno habla en
 * primera persona de lo que realmente hace hoy — el Revisor de Marca y el
 * de Tendencias existen desde hace tiempo pero nunca habían aparecido en la
 * landing, que solo listaba cinco.
 *
 * Los colores son una familia derivada del azul de marca (más un ámbar para
 * el único que sirve para frenar cosas), no siete colores sueltos: dan
 * identidad a cada personaje sin romper el acento único que usa el resto
 * del producto.
 */
interface Agent {
  id: string;
  /** Nombre corto para el avatar. */
  name: string;
  /** Título completo tal como se dice. Explícito y no "Agente de " + name,
   * porque ese prefijo produce "Agente de Revisor de Marca". */
  fullName: string;
  role: string;
  icon: LucideIcon;
  color: string;
  /** Render 3D del personaje en `public/agentes/<id>.webp`. El objeto que
   * trae cada uno es lo que lo identifica a simple vista (laptop, cámara,
   * celular…), así que la pose no es decorativa: es el ícono. Si el archivo
   * todavía no existe, la sección cae al ícono de Lucide y no se rompe. */
  image: string;
  messages: string[];
}

const AGENTS: Agent[] = [
  {
    id: "estrategia",
    name: "Estrategia",
    fullName: "Agente de Estrategia",
    role: "Decide qué se publica",
    icon: Compass,
    color: "#2f6fb0",
    image: "/agentes/estrategia.webp",
    messages: [
      "Yo decido qué se publica y qué día.",
      "Leo el cuestionario de tu marca — tu tono, qué vendes, a quién le vendes — y armo el plan del mes completo, con el guion de cada pieza ya escrito.",
      "Si tu plan trae 8 videos, reparto esos 8 donde más sirven. No relleno el calendario por llenarlo.",
    ],
  },
  {
    id: "tendencias",
    name: "Tendencias",
    fullName: "Agente de Tendencias",
    role: "Investiga qué está funcionando",
    icon: Radar,
    color: "#3d8f9e",
    image: "/agentes/tendencias.webp",
    messages: [
      "Antes de que se escriba nada, yo investigo.",
      "Busco en internet qué tipo de contenido está funcionando ahora mismo para negocios como el tuyo, en tu ciudad.",
      "Y traigo el calendario que importa: Buen Fin, Día de las Madres, la quincena. Si vendes en Estados Unidos, cambio a Black Friday y Thanksgiving.",
    ],
  },
  {
    id: "creativo",
    name: "Creativo",
    fullName: "Agente Creativo",
    role: "Produce el video y la imagen",
    icon: Wand2,
    color: "#6a5fb0",
    image: "/agentes/creativo.webp",
    messages: [
      "Yo lo produzco.",
      "Tomo el guion y genero el video o la imagen de verdad — no un borrador ni una plantilla que tengas que rellenar.",
      "Uso las fotos de tu negocio que subiste como referencia, para que se parezca a ti y no a un banco de imágenes.",
    ],
  },
  {
    id: "revisor",
    name: "Revisor de Marca",
    fullName: "Agente Revisor de Marca",
    role: "Revisa antes que tú",
    icon: ShieldCheck,
    color: "#b08a3d",
    image: "/agentes/revisor.webp",
    messages: [
      "Yo reviso antes que tú.",
      "Cada pieza pasa por mí: que suene a tu marca, que no diga algo que no debería, que el gancho no sea genérico.",
      "Si algo no pasa, lo marco y no llega a publicarse sin que tú lo veas primero.",
    ],
  },
  {
    id: "publicacion",
    name: "Publicación",
    fullName: "Agente de Publicación",
    role: "Sube el contenido",
    icon: Send,
    color: "#2f8f6b",
    image: "/agentes/publicacion.webp",
    messages: [
      "Yo la subo.",
      "Publico en Instagram, Facebook o TikTok a la hora que tiene sentido para tu giro — un restaurante antes de la comida, un gimnasio antes de la hora en que la gente entrena.",
      "Tú apruebas una vez; de ahí en adelante me encargo yo.",
    ],
  },
  {
    id: "respuestas",
    name: "Respuestas",
    fullName: "Agente de Respuestas",
    role: "Contesta a tus clientes",
    icon: MessageCircle,
    color: "#4a7fd0",
    image: "/agentes/respuestas.webp",
    messages: [
      "Yo contesto.",
      "Cuando alguien pregunta precio, horario o disponibilidad en tus comentarios o mensajes, respondo con la información real de tu negocio.",
      "Si la pregunta se pone seria, te la paso a ti en vez de inventar una respuesta.",
    ],
  },
  {
    id: "resultados",
    name: "Resultados",
    fullName: "Agente de Resultados",
    role: "Mide qué funcionó",
    icon: BarChart3,
    color: "#4f6a86",
    image: "/agentes/resultados.webp",
    messages: [
      "Yo mido.",
      "Traigo los números reales de cada publicación: alcance, likes, comentarios, seguidores nuevos.",
      "Y te digo qué funcionó de verdad, para que el plan del mes que entra salga mejor que este.",
    ],
  },
];

/** Cuántos caracteres por segundo teclea el agente. Bastante más rápido
 * que una persona: a velocidad humana las tres frases tardarían casi
 * medio minuto y nadie espera tanto en una landing. */
const CHARS_PER_SECOND = 55;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** La preferencia del sistema, leída sin `setState` dentro de un efecto
 * (que dispara un render en cascada). En el servidor no hay media query,
 * y se asume que sí se anima: es lo que verá la mayoría, y si el visitante
 * pidió lo contrario el primer render en cliente ya lo corrige. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Revela `text` carácter por carácter y devuelve cuántos van.
 *
 * El avance se calcula contra el reloj y no sumando uno por frame: así
 * tarda lo mismo en un monitor de 120 Hz que en uno de 60, y una pestaña
 * que se congela un momento no se queda a media frase — al volver, retoma
 * donde le tocaba por tiempo.
 *
 * `running` existe porque la sección está muy abajo en la landing: si el
 * tecleo arranca al montar, para cuando alguien baja hasta aquí el primer
 * agente ya terminó de escribir y nunca se ve el efecto. */
function useTypewriter(text: string, running: boolean) {
  const reduced = usePrefersReducedMotion();
  const [count, setCount] = useState(0);
  // Reiniciar el conteo en un efecto dejaría un frame con el texto nuevo
  // cortado a la longitud que llevaba el anterior. Ajustarlo en el render
  // es el patrón que React contempla para esto.
  const [typedText, setTypedText] = useState(text);
  if (typedText !== text) {
    setTypedText(text);
    setCount(0);
  }

  useEffect(() => {
    if (reduced || !running) return;
    let frame = 0;
    let start: number | undefined;
    const step = (now: number) => {
      start ??= now;
      const shown = Math.min(text.length, Math.floor(((now - start) / 1000) * CHARS_PER_SECOND));
      setCount(shown);
      if (shown < text.length) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [text, reduced, running]);

  return reduced ? text.length : count;
}

export default function TeamSection() {
  const [activeId, setActiveId] = useState(AGENTS[0].id);
  // Un PNG que falte no puede tumbar la sección entera: los ids que no
  // cargaron caen al ícono de Lucide, que es lo que había antes de los
  // personajes y se lee bien a cualquier tamaño.
  const [missing, setMissing] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  // `once`: una vez que arrancó, cambiar de agente vuelve a teclear aunque
  // el panel se haya salido de cuadro un momento.
  const panelInView = useInView(panelRef, { once: true, margin: "-80px" });
  const active = AGENTS.find((a) => a.id === activeId) ?? AGENTS[0];
  const ActiveIcon = active.icon;
  const activeHasImage = !missing.includes(active.id);
  // Las tres frases se teclean como un solo texto para que la segunda
  // arranque justo cuando termina la primera, sin temporizadores encadenados.
  const script = active.messages.join("\n");
  const typed = useTypewriter(script, panelInView);
  // Dónde empieza cada frase dentro del guion, para repartir entre ellas
  // los caracteres que ya salieron.
  const starts: number[] = [];
  let cursor = 0;
  for (const message of active.messages) {
    starts.push(cursor);
    cursor += message.length + 1;
  }
  const markMissing = (id: string) => setMissing((prev) => (prev.includes(id) ? prev : [...prev, id]));

  return (
    <section id="agentes" className="relative py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">TU NUEVO EQUIPO</p>
        <h2 className="max-w-lg text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Siete agentes. Cada uno con su trabajo.
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base">
          Toca a cualquiera y te cuenta de qué se encarga.
        </p>

        {/* Fila con scroll lateral en celular: siete avatares no caben, y
            apilarlos rompería la lectura de "esto es un equipo". Las fichas
            son cuadradas y más grandes que un ícono porque adentro va un
            personaje de cuerpo entero: a 56px la silueta no se distingue. */}
        <div className="-mx-6 mt-10 flex snap-x gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:flex-wrap sm:justify-start sm:overflow-visible sm:px-0">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const isActive = agent.id === activeId;
            const hasImage = !missing.includes(agent.id);
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setActiveId(agent.id)}
                aria-pressed={isActive}
                className="flex w-[92px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-[112px]"
                style={{ opacity: isActive ? 1 : 0.55 }}
              >
                <span
                  className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl transition-transform"
                  style={{
                    backgroundColor: `${agent.color}1a`,
                    border: `1px solid ${agent.color}${isActive ? "80" : "26"}`,
                    transform: isActive ? "scale(1.06)" : "scale(1)",
                  }}
                >
                  {hasImage ? (
                    // object-contain y no cover: los renders vienen con aire
                    // alrededor y recortarlos les corta el objeto que
                    // justamente identifica al agente. mix-blend-multiply es
                    // lo que hace desaparecer el fondo — ver la nota larga
                    // abajo, en el render grande.
                    <img
                      src={agent.image}
                      alt=""
                      onError={() => markMissing(agent.id)}
                      // El <img> viene ya en el HTML del servidor y empieza a
                      // cargar antes de que React hidrate: si el archivo no
                      // existe, el evento de error ocurre cuando todavía no
                      // hay handler y `onError` nunca se entera. Al montar,
                      // un <img> que ya terminó y no tiene ancho natural es
                      // exactamente eso — un 404 que ya pasó.
                      ref={(el) => {
                        if (el?.complete && el.naturalWidth === 0) markMissing(agent.id);
                      }}
                      className="h-full w-full object-contain object-bottom mix-blend-multiply"
                    />
                  ) : (
                    <Icon className="h-6 w-6" strokeWidth={1.75} style={{ color: agent.color }} />
                  )}
                </span>
                <span className="text-[11px] font-medium leading-tight text-zinc-700 sm:text-xs">{agent.name}</span>
              </button>
            );
          })}
        </div>

        {/* El hilo arranca con un agente ya seleccionado, no vacío: la
            sección tiene que decir algo aunque nadie toque nada. */}
        {/* Sin `backdrop-blur` a propósito: `backdrop-filter` convierte al
            panel en un backdrop root y aísla el mix-blend-multiply de sus
            hijos, así que el fondo blanco del render deja de fundirse y
            aparece un recuadro alrededor del personaje. Las fichas de
            arriba nunca tuvieron el problema porque no llevan blur. */}
        <div ref={panelRef} className="mt-8 overflow-hidden rounded-3xl border border-[var(--hairline)] bg-white/60">
          <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-5 py-4">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${active.color}1a`, border: `1px solid ${active.color}40` }}
            >
              <ActiveIcon className="h-[18px] w-[18px]" strokeWidth={1.75} style={{ color: active.color }} />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-950">{active.fullName}</p>
              <p className="text-xs text-zinc-500">{active.role}</p>
            </div>
          </div>

          {/* La burbuja encima y el personaje debajo, centrados, en vez de
              uno al lado del otro: la cola cae sobre su cabeza y se lee
              como que está hablando él, no como un bocadillo puesto junto
              a una ilustración. La misma composición sirve en celular y en
              escritorio, así que no hay dos versiones que mantener. */}
          <div className="flex flex-col items-center px-5 pb-6 pt-7 sm:pb-8 sm:pt-9">
            <div className="relative w-full max-w-xl">
              <div
                className="space-y-2.5 rounded-[1.75rem] px-6 py-5 sm:rounded-[2rem] sm:px-8 sm:py-6"
                style={{
                  background: "#fff",
                  border: `1px solid ${active.color}2e`,
                  boxShadow: `0 18px 50px -20px ${active.color}80`,
                }}
              >
                {active.messages.map((message, i) => {
                  const shown = Math.min(message.length, Math.max(0, typed - starts[i]));
                  const typing = shown > 0 && shown < message.length;
                  return (
                    <p key={`${active.id}-${i}`} className="relative text-sm leading-relaxed text-zinc-700">
                      {/* La frase completa queda en el flujo pero
                          transparente: reserva su alto desde el primer
                          frame, así la burbuja no crece a saltos mientras
                          se escribe. Va en opacity-0 y no en invisible
                          porque `visibility: hidden` también la esconde
                          de los lectores de pantalla, y esta es la copia
                          que ellos leen — la de encima va marcada como
                          decorativa para que no se lea dos veces. */}
                      <span className="opacity-0">{message}</span>
                      <span aria-hidden="true" className="absolute inset-0">
                        {message.slice(0, shown)}
                        {typing && (
                          <span
                            className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse align-[-0.15em]"
                            style={{ backgroundColor: active.color }}
                          />
                        )}
                      </span>
                    </p>
                  );
                })}
              </div>

              {/* La cola cuelga a la izquierda del centro y engancha hacia
                  la derecha, hacia la cabeza: enganchada al otro lado
                  apunta a un espacio vacío y deja de leerse como que está
                  hablando él.

                  Va como un trazo abierto — relleno blanco pero sin línea
                  de cierre arriba — para que el borde solo dibuje las dos
                  curvas de afuera y el lado que toca la burbuja quede sin
                  costura. Cerrar el path pintaría una raya cruzando el
                  borde inferior de la burbuja. */}
              <svg
                aria-hidden="true"
                viewBox="0 0 40 34"
                className="absolute left-1/2 top-full -mt-px h-[26px] w-[30px] -translate-x-[52px] sm:h-8 sm:w-10 sm:-translate-x-16"
              >
                <path
                  d="M13,0 C13,15 20,26 35,33 C27,23 27,11 27,0"
                  fill="#fff"
                  stroke={`${active.color}2e`}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {activeHasImage && (
              /* La animación va en el <img> y no en un div que lo envuelva:
                 un padre con `opacity` crea un contexto de apilamiento que
                 aísla el blend, y el fondo blanco del render deja de
                 fundirse — se ve un recuadro blanco alrededor del muñeco. */
              <motion.img
                key={`${active.id}-art`}
                src={active.image}
                alt={`Ilustración del ${active.fullName}`}
                onError={() => markMissing(active.id)}
                ref={(el) => {
                  if (el?.complete && el.naturalWidth === 0) markMissing(active.id);
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="mt-5 h-44 w-auto object-contain mix-blend-multiply sm:mt-6 sm:h-64"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

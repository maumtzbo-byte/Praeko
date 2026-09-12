/**
 * La sección que contesta la única objeción que importa.
 *
 * Cuando una marca lee "contenido generado con IA", lo primero que piensa
 * no es "qué barato" — es "va a inventar mi producto y se va a ver falso".
 * Y tiene razón en preocuparse: es exactamente lo que pasa cuando alguien
 * le pide a un generador "una crema en un baño bonito".
 *
 * No es lo que hacemos, y la diferencia es concreta: el producto entra
 * como foto suya y sale como foto suya. Lo generado es el escenario. Por
 * eso esta sección va antes de precios — de nada sirve un precio bueno si
 * el que lo lee cree que le vas a entregar una mentira.
 *
 * Y por eso también lleva los límites escritos. Decir "no hacemos ropa"
 * cuesta un renglón y compra el beneficio de la duda en todo lo demás; una
 * página que solo promete es una página que nadie termina de creer.
 */
const NO_HACEMOS = [
  {
    titulo: "Sin tus fotos no arrancamos",
    detalle: "Si no nos mandas nada, no hay pieza. Nos sirven las que ya tengas, aunque sean de celular.",
  },
  {
    titulo: "No vamos a grabar contigo",
    detalle: "¿Quieres a tu gente y tu taller en cámara? Búscate un fotógrafo. Eso lo hace mejor una persona con una cámara.",
  },
  {
    titulo: "Ropa y calzado, no",
    detalle: "La tela cae distinto en cada toma y ahí sí se nota el truco. Todavía no sabemos resolverlo.",
  },
];

export default function ProductoReal() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">LA PREGUNTA DE SIEMPRE</p>
        <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Tu etiqueta no la toca nadie
        </h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-600 sm:text-base">
          Tu frasco entra como la foto que ya tienes y sale con la misma forma, el mismo color y el
          mismo nombre al frente. Lo que armamos alrededor es la mesa de mármol, la luz de las seis de
          la tarde, la mano que lo levanta, la cámara dándole la vuelta.
        </p>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600 sm:text-base">
          Es lo que pasa cuando una marca grande lleva su producto a un estudio. Aquí no hay estudio
          que agendar.
        </p>

        {/* TODO: aquí va la comparación lado a lado —foto de catálogo contra
            escena generada— en cuanto existan las primeras piezas reales.
            A propósito NO se deja un marco vacío de relleno: un recuadro que
            promete una imagen y no la tiene es el mismo error que los
            botones de play sobre degradados que acabamos de quitar. Mejor
            una sección honesta de texto que una maqueta que miente. */}

        <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-3">
          {NO_HACEMOS.map(({ titulo, detalle }) => (
            <div
              key={titulo}
              className="rounded-2xl bg-[image:var(--plastico)] p-5 shadow-[var(--relieve-panel)] sm:p-6"
            >
              <p className="text-[15px] font-semibold tracking-tight text-zinc-950">{titulo}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{detalle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
    titulo: "No inventamos tu producto",
    detalle: "Tu frasco, tu bolsa y tu etiqueta son tu foto. Si no nos la das, no hay pieza.",
  },
  {
    titulo: "No vamos a grabar contigo",
    detalle: "Si necesitas a tu gente, tu taller o tus clientes en cámara, eso es otra cosa y te conviene un fotógrafo.",
  },
  {
    titulo: "No hacemos ropa ni calzado",
    detalle: "La tela se dobla y cae distinto en cada toma, y ahí sí se nota. Preferimos decírtelo antes.",
  },
];

export default function ProductoReal() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">LO QUE SÍ ES TUYO</p>
        <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Tu producto no lo generamos nosotros: es tu foto
        </h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-600 sm:text-base">
          Lo que generamos es el mundo alrededor. La mesa de mármol, la luz de la mañana, la mano que
          lo levanta, la cámara que le da la vuelta. Tu producto entra como la foto que ya tienes y
          sale igual, con su forma y su etiqueta intactas.
        </p>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600 sm:text-base">
          Es lo mismo que hace una marca grande cuando lleva su producto a un estudio, nada más que
          sin agendar el estudio.
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

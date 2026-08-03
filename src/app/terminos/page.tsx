import type { Metadata } from "next";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = { title: "Términos de Servicio — Frames" };

const LAST_UPDATED = "3 de agosto de 2026";

export default function TerminosPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500">LEGAL</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Términos de Servicio
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Última actualización: {LAST_UPDATED}</p>

          <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-zinc-700">
            <section>
              <h2 className="text-lg font-semibold text-zinc-950">1. Aceptación de los términos</h2>
              <p className="mt-2">
                Al crear una cuenta o usar Frames, aceptas estos Términos de Servicio y nuestra{" "}
                <a href="/privacidad" className="text-accent hover:underline">
                  Política de Privacidad
                </a>
                . Si no estás de acuerdo, no uses el producto.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">2. Qué es Frames</h2>
              <p className="mt-2">
                Frames es una plataforma que usa inteligencia artificial para planear, generar y
                (cuando tú lo autorizas) publicar contenido de marketing en redes sociales para tu
                negocio. Cada plan tiene límites de generación (imágenes/videos por mes, redes
                sociales conectables) descritos en la página de Precios.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">3. Tu cuenta</h2>
              <p className="mt-2">
                Eres responsable de mantener segura tu contraseña y de toda la actividad que ocurra
                bajo tu cuenta. Debes ser mayor de edad y tener autoridad legítima para representar
                al negocio que registras en Frames.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">4. Conectar tus redes sociales</h2>
              <p className="mt-2">
                Al conectar Instagram, Facebook o TikTok, autorizas a Frames a publicar contenido en
                tu nombre únicamente cuando tú generas y confirmas una pieza para publicarse —
                Frames no publica contenido de forma autónoma sin esa confirmación. Puedes
                desconectar cualquier cuenta en cualquier momento; al hacerlo, Frames pierde acceso
                de inmediato.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">5. Contenido generado por IA</h2>
              <p className="mt-2">
                El contenido que Frames genera (guiones, imágenes, videos) se basa en la
                información que tú proporcionas sobre tu negocio. Eres responsable de revisar el
                contenido antes de publicarlo — Frames incluye un Agente Revisor de Marca que
                señala piezas que podrían necesitar tu revisión, pero la decisión final de publicar
                siempre es tuya. No garantizamos que el contenido generado esté libre de errores.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">6. Pagos y planes</h2>
              <p className="mt-2">
                Los planes de pago se cobran de forma recurrente según el ciclo que elijas. Puedes
                cambiar o cancelar tu plan en cualquier momento desde tu panel; los cambios aplican
                según lo descrito en la sección de Facturación.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">7. Uso aceptable</h2>
              <p className="mt-2">
                No puedes usar Frames para generar o publicar contenido ilegal, engañoso, difamatorio,
                que infrinja derechos de terceros, o que viole las políticas de las plataformas donde
                publicas (Meta, TikTok). Nos reservamos el derecho de suspender cuentas que violen
                esta sección.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">8. Disponibilidad del servicio</h2>
              <p className="mt-2">
                Trabajamos para mantener Frames disponible, pero no garantizamos un servicio
                ininterrumpido. Algunas funciones dependen de proveedores externos (Meta, TikTok,
                fal.ai, Anthropic) cuya disponibilidad está fuera de nuestro control.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">9. Propiedad intelectual</h2>
              <p className="mt-2">
                El contenido que Frames genera específicamente para tu negocio (guiones, imágenes,
                videos) es tuyo — puedes usarlo, publicarlo y editarlo sin restricción. La
                tecnología, el software y la marca Frames son propiedad nuestra; usar el producto no
                te da derechos sobre ellos más allá de lo necesario para usar el servicio.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">10. Terminación de cuenta</h2>
              <p className="mt-2">
                Puedes cerrar tu cuenta cuando quieras desde Configuración. Nosotros podemos
                suspender o cerrar una cuenta que incumpla la sección 7 (Uso aceptable) o que
                represente un riesgo para el servicio o para otros usuarios, avisándote por correo
                salvo que la ley o la urgencia del caso lo impida.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">11. Limitación de responsabilidad</h2>
              <p className="mt-2">
                Frames se ofrece &quot;tal cual&quot;. En la medida permitida por la ley, no somos
                responsables por daños indirectos, pérdida de ganancias, o consecuencias derivadas
                del contenido que generes y decidas publicar, ni por fallas de los proveedores
                externos (Meta, TikTok, fal.ai, Anthropic, Supabase, Vercel, Stripe) que están fuera
                de nuestro control.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">12. Ley aplicable y jurisdicción</h2>
              <p className="mt-2">
                Estos términos se rigen por las leyes de México. Cualquier disputa se someterá a los
                tribunales competentes de México, salvo que la ley aplicable disponga otra cosa.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">13. Cambios a estos términos</h2>
              <p className="mt-2">
                Podemos actualizar estos términos ocasionalmente. Si el cambio es significativo, te
                avisaremos por correo o dentro del producto antes de que entre en vigor.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">14. Contacto</h2>
              <p className="mt-2">
                ¿Dudas sobre estos términos? Escríbenos a{" "}
                <a href="mailto:soporte@frames.com" className="text-accent hover:underline">
                  soporte@frames.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

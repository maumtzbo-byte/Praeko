import type { Metadata } from "next";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = { title: "Política de Privacidad — Frames" };

const LAST_UPDATED = "3 de agosto de 2026";

export default function PrivacidadPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500">LEGAL</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Política de Privacidad
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Última actualización: {LAST_UPDATED}</p>

          <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-zinc-700">
            <section>
              <h2 className="text-lg font-semibold text-zinc-950">1. Quiénes somos</h2>
              <p className="mt-2">
                Frames es una plataforma de marketing con inteligencia artificial para negocios
                pequeños en México, operada por Frames (&quot;nosotros&quot;, &quot;Frames&quot;). Esta política
                explica qué información recopilamos cuando usas nuestro sitio y nuestro producto,
                cómo la usamos, y qué derechos tienes sobre ella.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">2. Qué información recopilamos</h2>
              <ul className="mt-2 list-disc pl-5 [&>li]:mt-1.5">
                <li>
                  <strong>Datos de cuenta:</strong> nombre, correo electrónico y contraseña cuando te
                  registras — tu contraseña se guarda de forma irreversible (hash); ni nosotros
                  podemos verla en texto plano.
                </li>
                <li>
                  <strong>Datos de tu negocio:</strong> nombre, giro, descripción, ciudad, tono de
                  marca, productos, objetivos y demás información que ingresas durante el proceso
                  de onboarding o en Configuración — la usamos para que la IA genere contenido
                  específico de tu negocio, no genérico.
                </li>
                <li>
                  <strong>Contenido generado:</strong> los guiones, imágenes y videos que Frames crea
                  para tu negocio, y el calendario de publicaciones asociado.
                </li>
                <li>
                  <strong>Conexiones de redes sociales:</strong> cuando conectas Instagram, Facebook
                  o TikTok, guardamos el token de acceso que esas plataformas nos entregan (nunca tu
                  contraseña) para poder publicar contenido en tu nombre, dentro de los permisos que
                  tú autorizaste explícitamente en el momento de conectar la cuenta.
                </li>
                <li>
                  <strong>Datos de uso:</strong> qué funciones usas y con qué frecuencia, para poder
                  mejorar el producto y hacer cumplir los límites de tu plan.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">
                3. Cómo usamos los permisos de Meta y TikTok
              </h2>
              <p className="mt-2">
                Cuando conectas una cuenta de Instagram, Facebook o TikTok, Frames solicita
                únicamente los permisos necesarios para las funciones que ofrece el producto:
              </p>
              <ul className="mt-2 list-disc pl-5 [&>li]:mt-1.5">
                <li>
                  <strong>Leer tus páginas/cuentas conectables</strong> (<code>pages_show_list</code>,
                  <code> business_management</code>) — para que puedas elegir qué Página o cuenta de
                  Instagram vincular a tu negocio en Frames.
                </li>
                <li>
                  <strong>Publicar contenido en tu nombre</strong> (<code>pages_manage_posts</code>,
                  <code> instagram_content_publish</code>) — para publicar, cuando tú lo pides, el
                  contenido que Frames generó para tu negocio. Frames nunca publica nada sin que tú
                  hayas generado y confirmado esa pieza primero.
                </li>
                <li>
                  <strong>Leer métricas básicas</strong> (<code>pages_read_engagement</code>,
                  <code> instagram_basic</code>) — para mostrarte en tu panel de Analíticas cómo le
                  fue a lo que publicaste (alcance, likes, comentarios).
                </li>
              </ul>
              <p className="mt-2">
                Para TikTok solicitamos <code>user.info.basic</code> (identificar tu cuenta) y{" "}
                <code>video.publish</code> (publicar el video que tú confirmaste). Mientras nuestra
                app de TikTok no complete su proceso de auditoría, esas publicaciones se hacen en
                modo privado (solo visibles para ti) — es una limitación de la plataforma, no una
                función que hayamos desactivado.
              </p>
              <p className="mt-2">
                Puedes desconectar cualquier cuenta en cualquier momento desde{" "}
                <span className="font-medium">Redes sociales</span> dentro de tu panel — al hacerlo,
                eliminamos el token de acceso guardado de inmediato.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">
                4. Con quién compartimos información
              </h2>
              <p className="mt-2">
                No vendemos tus datos. Los compartimos únicamente con los proveedores que Frames
                usa para operar el producto, y solo en la medida necesaria para prestar el
                servicio:
              </p>
              <ul className="mt-2 list-disc pl-5 [&>li]:mt-1.5">
                <li>Supabase — base de datos y autenticación.</li>
                <li>Vercel — hospedaje de la aplicación.</li>
                <li>Anthropic (Claude) — generación de estrategia, guiones y revisión de contenido.</li>
                <li>fal.ai — generación de imágenes y video.</li>
                <li>Meta (Instagram/Facebook) y TikTok — para publicar contenido y leer métricas, únicamente en las cuentas que tú conectaste.</li>
                <li>Stripe — procesamiento de pagos, cuando aplica.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">5. Transferencia internacional de datos</h2>
              <p className="mt-2">
                Algunos de los proveedores listados arriba procesan datos en servidores fuera de
                México (Estados Unidos, principalmente), bajo sus propias políticas de privacidad y
                seguridad. Al usar Frames, aceptas esta transferencia, necesaria para operar el
                servicio.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">6. Cuánto tiempo conservamos tus datos</h2>
              <p className="mt-2">
                Conservamos tu información mientras tu cuenta esté activa. Si cierras tu cuenta,
                eliminamos tus datos de negocio, contenido y tokens de redes sociales en un plazo
                razonable, salvo la información que estemos legalmente obligados a conservar (por
                ejemplo, registros de facturación).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">7. Tus derechos (ARCO)</h2>
              <p className="mt-2">
                De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los
                Particulares, tienes derecho a <strong>Acceder</strong> a tus datos,{" "}
                <strong>Rectificarlos</strong> si están desactualizados o son incorrectos,{" "}
                <strong>Cancelarlos</strong> (eliminarlos) cuando ya no sean necesarios, y{" "}
                <strong>Oponerte</strong> a un uso específico de los mismos. Puedes corregir la
                información de tu negocio directamente desde tu panel de Configuración; para
                acceder, cancelar (eliminar) tus datos o ejercer los demás derechos ARCO, sigue las{" "}
                <a href="/eliminar-datos" className="text-accent hover:underline">
                  instrucciones aquí
                </a>{" "}
                o escríbenos a{" "}
                <a href="mailto:soporte@frames.com" className="text-accent hover:underline">
                  soporte@frames.com
                </a>{" "}
                — respondemos en un plazo máximo de 20 días hábiles. Desconectar una red social
                (desde el panel de Redes sociales) revoca de inmediato el acceso que le diste a
                Frames sobre esa cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">8. Cookies y almacenamiento local</h2>
              <p className="mt-2">
                Usamos cookies estrictamente necesarias para mantener tu sesión iniciada y para
                completar el proceso de conexión con Meta/TikTok (se borran en cuanto termina). Por
                separado, tu navegador guarda localmente (en <code>sessionStorage</code>, no como
                cookie) si ya viste la animación de bienvenida en esta sesión, para no repetirla. No
                usamos cookies de rastreo publicitario de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">9. Menores de edad</h2>
              <p className="mt-2">
                Frames está diseñado para dueños de negocio y no está dirigido a menores de 18 años.
                No recopilamos intencionalmente información de menores.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">10. Cambios a esta política</h2>
              <p className="mt-2">
                Si hacemos cambios importantes a esta política, te avisaremos por correo o dentro
                del producto antes de que entren en vigor.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">11. Ley aplicable</h2>
              <p className="mt-2">
                Esta política se rige por las leyes de México, incluyendo la Ley Federal de
                Protección de Datos Personales en Posesión de los Particulares.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-950">12. Contacto</h2>
              <p className="mt-2">
                ¿Preguntas sobre esta política o tus datos? Escríbenos a{" "}
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

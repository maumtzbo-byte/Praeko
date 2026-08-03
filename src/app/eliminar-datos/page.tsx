import type { Metadata } from "next";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = { title: "Eliminar tus datos — Frames" };

export default function EliminarDatosPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-24">
          <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500">LEGAL</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Cómo eliminar tus datos
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700">
            Puedes pedir que eliminemos toda tu información de Frames en cualquier momento.
          </p>

          <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-zinc-700">
            <div className="rounded-2xl border border-[var(--hairline)] bg-white p-6">
              <h2 className="text-base font-semibold text-zinc-950">Solicita la eliminación</h2>
              <p className="mt-2">
                Escríbenos a{" "}
                <a href="mailto:soporte@frames.com" className="text-accent hover:underline">
                  soporte@frames.com
                </a>{" "}
                desde el correo con el que te registraste, pidiendo la eliminación de tu cuenta.
                Verificamos tu identidad y eliminamos tu perfil de negocio, contenido generado y
                tokens de redes sociales conectadas en un plazo máximo de 20 días hábiles, conforme
                a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--hairline)] bg-white p-6">
              <h2 className="text-base font-semibold text-zinc-950">
                Si solo quieres desconectar una red social
              </h2>
              <p className="mt-2">
                No necesitas eliminar tu cuenta completa — ve a{" "}
                <span className="font-medium">Redes sociales</span> dentro de tu panel y desconecta
                la cuenta específica. Eliminamos el token de acceso guardado de inmediato.
              </p>
            </div>
          </div>

          <p className="mt-8 text-xs text-zinc-500">
            Más detalles sobre qué datos guardamos y por cuánto tiempo en nuestra{" "}
            <a href="/privacidad" className="text-accent hover:underline">
              Política de Privacidad
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
